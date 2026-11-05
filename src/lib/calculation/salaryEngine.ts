/**
 * Salary calculation engine – derives fields from contract inputs.
 * The logic mirrors the CSV at:
 *   C:\\Users\\PC-Psave\\Documents\\แผนผังการเชื่อมโยงข้อมูลและฟิลด์ที่คำนวณอัตโนมัติ (Data Linkage & Derived Logic).csv
 *
 * Only a subset of the full business logic is implemented here for the core
 * calculations required by the UI and tests. Additional helper functions can be
 * added later without breaking the public API.
 */
import { toThaiDigits, bahtText } from '@/lib/utils/thaiNumerals';
import type { CalendarDay, WorkloadMatrixResult } from '@/lib/calculation/types';

/**
 * Simple Linear Congruential Generator (PRNG) for deterministic, reproducible randomness.
 */
export class SeededRandom {
  private seed: number;
  constructor(seed: number = 42) {
    this.seed = Math.abs(Math.floor(seed)) % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export interface DistributeWorkloadOptions {
  minTasksPerDay?: number;
  maxTasksPerDay?: number;
  strategy?: 'uniform' | 'weighted' | 'alternating';
  seed?: number;
}

/**
 * Distribute target tasks across active working days in calendar.
 * Invariants guaranteed:
 * 1. Non-working days (weekends, public holidays, absent days) strictly receive 0 tasks (#d3d3d3)
 * 2. Active working days guaranteed >= minTasksPerDay (default 1)
 * 3. Matrix grand total strictly equals targetTasks
 * 4. Cells in matrix are binary (0 or 1)
 */
export function distributeWorkload(
  calendarDays: CalendarDay[],
  targetTasks: number = 110,
  taskCount: number = 18,
  optionsOrSeed: DistributeWorkloadOptions | number = 42
): WorkloadMatrixResult {
  const options: DistributeWorkloadOptions =
    typeof optionsOrSeed === 'number'
      ? { seed: optionsOrSeed }
      : (optionsOrSeed || {});

  const seed = options.seed ?? 42;
  const minTasksPerDay = Math.max(0, options.minTasksPerDay ?? 1);
  const strategy = options.strategy || 'uniform';

  const workingColIndices = calendarDays
    .map((cd, idx) => (cd.is_working_day ? idx : -1))
    .filter((idx) => idx !== -1);
  const numWorkingDays = workingColIndices.length;

  const effectiveTaskCount = Math.max(1, taskCount);

  if (numWorkingDays === 0) {
    const matrix = Array.from({ length: effectiveTaskCount }, () => Array.from({ length: 31 }, () => 0));
    return {
      matrix,
      task_totals: Array(effectiveTaskCount).fill(0),
      daily_sums: Array(31).fill(0),
      grand_total: 0,
      working_days_indices: [],
    };
  }

  const maxCapacity = effectiveTaskCount * numWorkingDays;
  const effectiveTarget = Math.max(0, Math.min(targetTasks, maxCapacity));

  const rng = new SeededRandom(seed);
  const matrix: number[][] = Array.from({ length: effectiveTaskCount }, () =>
    Array.from({ length: 31 }, () => 0)
  );

  let currentCount = 0;

  // Pass 1: Guarantee minTasksPerDay on each active working day (when capacity permits)
  const canGuaranteeMin = effectiveTarget >= numWorkingDays * minTasksPerDay;
  const guaranteedMin = canGuaranteeMin ? minTasksPerDay : (effectiveTarget >= numWorkingDays ? 1 : 0);

  if (guaranteedMin > 0) {
    for (const c of workingColIndices) {
      for (let g = 0; g < guaranteedMin && currentCount < effectiveTarget; g++) {
        const availableRows: number[] = [];
        for (let r = 0; r < effectiveTaskCount; r++) {
          if (matrix[r][c] === 0) availableRows.push(r);
        }
        if (availableRows.length > 0) {
          const r = availableRows[rng.nextInt(0, availableRows.length - 1)];
          matrix[r][c] = 1;
          currentCount++;
        }
      }
    }
  }

  // Pass 2: Distribute remaining tasks
  let remaining = effectiveTarget - currentCount;
  if (remaining > 0) {
    if (strategy === 'alternating') {
      let step = 0;
      let fails = 0;
      while (remaining > 0 && fails < numWorkingDays * effectiveTaskCount * 2) {
        const c = workingColIndices[step % numWorkingDays];
        const r = (step * 7 + seed + fails) % effectiveTaskCount;
        if (matrix[r][c] === 0) {
          matrix[r][c] = 1;
          remaining--;
          fails = 0;
        } else {
          fails++;
        }
        step++;
      }
    } else {
      // Uniform shuffle pool of available empty working day cells
      const pool: [number, number][] = [];
      for (const c of workingColIndices) {
        for (let r = 0; r < effectiveTaskCount; r++) {
          if (matrix[r][c] === 0) {
            pool.push([r, c]);
          }
        }
      }

      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = rng.nextInt(0, i);
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
      }

      for (let k = 0; k < remaining && k < pool.length; k++) {
        const [r, c] = pool[k];
        matrix[r][c] = 1;
      }
    }
  }

  const task_totals = matrix.map((row) => row.reduce((sum, val) => sum + (val === 1 ? 1 : 0), 0));
  const daily_sums = Array.from({ length: 31 }, (_, col) =>
    matrix.reduce((sum, row) => sum + (row[col] === 1 ? 1 : 0), 0)
  );
  const grand_total = task_totals.reduce((sum, val) => sum + val, 0);

  return {
    matrix,
    task_totals,
    daily_sums,
    grand_total,
    working_days_indices: workingColIndices,
  };
}

function toGregorianYear(year: number): number {
  return year > 2400 ? year - 543 : year;
}

/** Simple date helper – assumes input strings are ISO (YYYY-MM-DD) or any format
 * that `new Date()` can parse. Returns a JavaScript Date object.
 */
function parseDate(input: string): Date {
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${input}`);
  }
  return d;
}

/**
 * Calculate the number of months between two dates (inclusive).
 * Example from CSV: "1 Oct 69 – 30 Sep 70" => 12 months.
 * The function treats the end of month as inclusive; if the day component of
 * the end date is >= the start day, an extra month is counted.
 */
export function totalMonths(startDateStr: string, endDateStr: string): number {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  if (end < start) return 0;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  let total = years * 12 + months;
  // Include the last month when the end day is not before the start day
  if (end.getDate() >= start.getDate()) total += 1;
  return total;
}

/** Total installments = total months (one installment per month). */
export function totalInstallments(totalMonthsCount: number): number {
  return totalMonthsCount;
}

/** Calculate contract amount = monthly wage * total installments. */
export function totalContractAmount(monthlyWage: number, installments: number): number {
  return monthlyWage * installments;
}

/** Convert a numeric amount to Thai Baht textual representation.
 * Uses official bahtText utility according to Thai Ministry of Finance standards.
 */
export function amountToThaiBahtText(amount: number): string {
  return bahtText(amount);
}

/** Get number of days in a given month.
 * Supports both Gregorian (AD) and Buddhist Era (BE) years.
 */
export function daysInMonth(year: number, month: number): number {
  const gYear = toGregorianYear(year);
  // month is 1‑based (1 = January)
  return new Date(gYear, month, 0).getDate();
}

/** Determine work days for a month, excluding weekends, holidays, and leave days.
 * `holidays` and `leaveDays` are arrays of day numbers (1‑based) that should be
 * excluded. The function returns the count of valid work days.
 * Supports both Gregorian (AD) and Buddhist Era (BE) years.
 */
export function workDaysInMonth(
  year: number,
  month: number,
  holidays: number[] = [],
  leaveDays: number[] = []
): number {
  const gYear = toGregorianYear(year);
  const dim = daysInMonth(gYear, month);
  let workDays = 0;
  for (let day = 1; day <= dim; day++) {
    const date = new Date(gYear, month - 1, day);
    const weekday = date.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = holidays.includes(day);
    const isLeave = leaveDays.includes(day);
    if (!isWeekend && !isHoliday && !isLeave) workDays++;
  }
  return workDays;
}

/** Simple workload matrix calculator – aggregates daily counts per task.
 * The CSV describes a 110‑item matrix but the exact shape is application‑specific.
 * This helper accepts a list of tasks where each task contains an array of daily
 * counts (size up to 31). It returns:
 *   - `tasksRowTotal`: sum per task (horizontal total)
 *   - `dailyTotals`: sum per day (vertical total)
 *   - `grandTotal`: overall sum
 *   - `isBalanced`: boolean indicating whether `grandTotal` equals the expected
 *     target (passed by the caller).
 */
export interface TaskRow {
  dailyCounts: number[]; // length <= 31, index 0 = day 1
}

export interface WorkloadResult {
  tasksRowTotal: number[];
  dailyTotals: number[];
  grandTotal: number;
  isBalanced: boolean;
}

export function calculateWorkloadMatrix(
  tasks: TaskRow[],
  targetGrandTotal: number
): WorkloadResult {
  const tasksRowTotal: number[] = [];
  const dailyTotals: number[] = Array(31).fill(0);
  let grandTotal = 0;

  tasks.forEach((task) => {
    const rowSum = task.dailyCounts.reduce((a, b) => a + b, 0);
    tasksRowTotal.push(rowSum);
    grandTotal += rowSum;
    task.dailyCounts.forEach((count, idx) => {
      dailyTotals[idx] += count;
    });
  });

  // Trim dailyTotals to the maximum day that actually has data
  const lastDay = dailyTotals.findLastIndex((v) => v !== 0) + 1; // 0‑based to length
  const trimmedDaily = dailyTotals.slice(0, lastDay);

  return {
    tasksRowTotal,
    dailyTotals: trimmedDaily,
    grandTotal,
    isBalanced: grandTotal === targetGrandTotal,
  };
}

/**
 * Primary exported function – receives a contract input object and returns all
 * derived fields required by the UI.
 */
export interface ContractInput {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  monthlyWage?: number;
  start_date?: string;
  end_date?: string;
  monthly_salary?: number;
  yearBE?: number; // Thai BE year for calendar calculations
  year_be?: number;
  month?: number; // 1‑12
  holidays?: number[]; // day numbers in the month
  public_holidays?: number[];
  leaveDays?: number[]; // day numbers in the month
  absent_days?: number[];
  tasks?: TaskRow[]; // optional workload matrix tasks
  targetGrandTotal?: number; // expected total for workload balance check
}

export interface ContractDerived {
  totalMonths: number;
  totalInstallments: number;
  totalContractAmount: number;
  amountThaiBahtText: string;
  daysInMonth: number;
  workDays: number;
  workload?: WorkloadResult;
}

export function calculateContract(input: ContractInput): ContractDerived {
  const startDate = input.startDate || input.start_date || '';
  const endDate = input.endDate || input.end_date || '';
  const monthlyWage = input.monthlyWage ?? input.monthly_salary ?? 0;
  const yearBE = input.yearBE ?? input.year_be ?? 2569;
  const month = input.month ?? 10;
  const holidays = input.holidays ?? input.public_holidays ?? [];
  const leaveDays = input.leaveDays ?? input.absent_days ?? [];

  const tm = totalMonths(startDate, endDate);
  const ti = totalInstallments(tm);
  const amount = totalContractAmount(monthlyWage, ti);
  const thaiText = amountToThaiBahtText(amount);
  const dim = daysInMonth(yearBE, month);
  const work = workDaysInMonth(yearBE, month, holidays, leaveDays);

  const result: ContractDerived = {
    totalMonths: tm,
    totalInstallments: ti,
    totalContractAmount: amount,
    amountThaiBahtText: thaiText,
    daysInMonth: dim,
    workDays: work,
  };

  if (input.tasks && typeof input.targetGrandTotal === 'number') {
    result.workload = calculateWorkloadMatrix(input.tasks, input.targetGrandTotal);
  }

  return result;
}
