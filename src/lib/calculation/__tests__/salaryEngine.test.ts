import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  totalMonths,
  totalInstallments,
  totalContractAmount,
  amountToThaiBahtText,
  daysInMonth,
  workDaysInMonth,
  calculateWorkloadMatrix,
  calculateContract,
  distributeWorkload,
  SeededRandom,
} from '@/lib/calculation/salaryEngine';
import type { CalendarDay } from '@/lib/calculation/types';

describe('Salary Engine calculations', () => {
  test('totalMonths calculates inclusive months correctly', () => {
    // 1 Oct 2022 to 30 Sep 2023 => 12 months
    assert.strictEqual(totalMonths('2022-10-01', '2023-09-30'), 12);
    // Same month same day => 1 month
    assert.strictEqual(totalMonths('2022-05-15', '2022-05-15'), 1);
    // End day before start day reduces month count
    assert.strictEqual(totalMonths('2022-01-20', '2022-02-10'), 1);
  });

  test('totalInstallments mirrors totalMonths', () => {
    assert.strictEqual(totalInstallments(5), 5);
  });

  test('totalContractAmount multiplies correctly', () => {
    assert.strictEqual(totalContractAmount(1500, 12), 18000);
  });

  test('amountToThaiBahtText converts number to official Thai Baht text', () => {
    assert.strictEqual(amountToThaiBahtText(12345), 'หนึ่งหมื่นสองพันสามร้อยสี่สิบห้าบาทถ้วน');
  });

  test('daysInMonth works for leap year February', () => {
    assert.strictEqual(daysInMonth(2020, 2), 29);
    assert.strictEqual(daysInMonth(2021, 2), 28);
  });

  test('workDaysInMonth excludes weekends, holidays, and leave days', () => {
    // May 2022: 31 days, weekends = 9, no holidays/leave => 22 work days
    assert.strictEqual(workDaysInMonth(2022, 5), 22);
    // Add a holiday on day 2 (Monday) and leave on day 3 (Tuesday)
    assert.strictEqual(workDaysInMonth(2022, 5, [2], [3]), 20);
  });

  test('calculateWorkloadMatrix aggregates correctly and checks balance', () => {
    const tasks = [
      { dailyCounts: [1, 2, 3] },
      { dailyCounts: [0, 1, 1] },
    ];
    const result = calculateWorkloadMatrix(tasks, 8);
    assert.deepStrictEqual(result.tasksRowTotal, [6, 2]);
    assert.deepStrictEqual(result.dailyTotals, [1, 3, 4]);
    assert.strictEqual(result.grandTotal, 8);
    assert.strictEqual(result.isBalanced, true);
  });

  test('calculateContract integrates all calculations', () => {
    const input = {
      startDate: '2022-01-01',
      endDate: '2022-12-31',
      monthlyWage: 2000,
      yearBE: 2565,
      month: 1,
      holidays: [1],
      leaveDays: [],
    };
    const result = calculateContract(input);
    assert.strictEqual(result.totalMonths, 12);
    assert.strictEqual(result.totalContractAmount, 24000);
    assert.strictEqual(result.amountThaiBahtText, 'สองหมื่นสี่พันบาทถ้วน');
    assert.strictEqual(result.daysInMonth, 31);
    // Work days for Jan 2022 (BE 2565) with holiday on day 1 (Saturday) => 21 work days
    assert.strictEqual(result.workDays, 21);
  });

  test('distributeWorkload dynamically distributes custom targets and tasks', () => {
    // Mock 31 days with 20 working days
    const mockCalendarDays: CalendarDay[] = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const isWeekend = [3, 4, 10, 11, 17, 18, 24, 25, 31].includes(day);
      const isHoliday = [13, 23].includes(day);
      const isWorking = !isWeekend && !isHoliday;
      return {
        day,
        date_iso: `2026-10-${String(day).padStart(2, '0')}`,
        is_weekend: isWeekend,
        is_holiday: isHoliday,
        is_absent: false,
        is_working_day: isWorking,
        cell_color: isWorking ? '#FFFFFF' : '#D3D3D3',
        remark: isWorking ? '' : 'วันหยุด',
      };
    });

    // 1. Standard 110 items with 18 tasks
    const r110 = distributeWorkload(mockCalendarDays, 110, 18, { seed: 42 });
    assert.strictEqual(r110.grand_total, 110);
    assert.strictEqual(r110.matrix.length, 18);
    assert.strictEqual(r110.task_totals.length, 18);
    assert.strictEqual(r110.daily_sums.length, 31);
    mockCalendarDays.forEach((cd, idx) => {
      if (cd.is_working_day) {
        assert.ok(r110.daily_sums[idx] >= 1);
      } else {
        assert.strictEqual(r110.daily_sums[idx], 0);
      }
    });

    // 2. Custom 80 items with 10 tasks
    const r80 = distributeWorkload(mockCalendarDays, 80, 10, { seed: 99 });
    assert.strictEqual(r80.grand_total, 80);
    assert.strictEqual(r80.matrix.length, 10);
    assert.strictEqual(r80.task_totals.length, 10);
    assert.strictEqual(r80.task_totals.reduce((a, b) => a + b, 0), 80);
    assert.strictEqual(r80.daily_sums.reduce((a, b) => a + b, 0), 80);

    // 3. Custom 120 items with 22 tasks
    const r120 = distributeWorkload(mockCalendarDays, 120, 22, { seed: 101 });
    assert.strictEqual(r120.grand_total, 120);
    assert.strictEqual(r120.matrix.length, 22);
    assert.strictEqual(r120.task_totals.reduce((a, b) => a + b, 0), 120);
  });

  test('distributeWorkload zeroes out newly marked leave and holiday days', () => {
    const mockCalendarDays: CalendarDay[] = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const isWeekend = [3, 4, 10, 11, 17, 18, 24, 25, 31].includes(day);
      const isHoliday = [13, 23, 14].includes(day); // Day 14 added as holiday
      const isAbsent = [15].includes(day); // Day 15 added as leave
      const isWorking = !isWeekend && !isHoliday && !isAbsent;
      return {
        day,
        date_iso: `2026-10-${String(day).padStart(2, '0')}`,
        is_weekend: isWeekend,
        is_holiday: isHoliday,
        is_absent: isAbsent,
        is_working_day: isWorking,
        cell_color: isWorking ? '#FFFFFF' : '#D3D3D3',
        remark: isHoliday ? 'วันหยุดพิเศษ' : isAbsent ? 'ลาป่วย' : '',
      };
    });

    const result = distributeWorkload(mockCalendarDays, 110, 18, { seed: 42 });
    assert.strictEqual(result.grand_total, 110);
    // Days 13, 14, 15, 23 must all be 0 tasks
    assert.strictEqual(result.daily_sums[13 - 1], 0, 'Holiday Day 13 must be 0 tasks');
    assert.strictEqual(result.daily_sums[14 - 1], 0, 'Added Holiday Day 14 must be 0 tasks');
    assert.strictEqual(result.daily_sums[15 - 1], 0, 'Added Leave Day 15 must be 0 tasks');
    assert.strictEqual(result.daily_sums[23 - 1], 0, 'Holiday Day 23 must be 0 tasks');
  });
});
