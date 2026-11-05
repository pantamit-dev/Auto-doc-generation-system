/**
 * src/lib/store/useSalaryStore.ts
 * ==============================================================================
 * Primary Zustand Application Store for Salary Document App
 * Features:
 * - Reactive state for Contractor, Agency, Contract, Period, Logs, and UI
 * - Automatic background synchronization with LocalStorageAdapter
 * - Safe SSR hydration via initStore() preventing React hydration mismatches
 * - Inline calculation fallback for period math (daily rate, deduction, working days)
 * ==============================================================================
 */

import { create } from 'zustand';
import { supabaseAdapter as storageAdapter } from './supabaseAdapter';
import {
  DEFAULT_CONTRACTOR_PROFILE,
  DEFAULT_AGENCY_PROFILE,
  DEFAULT_CONTRACT_DETAILS,
  DEFAULT_MONTHLY_PERIOD,
  DEFAULT_WORKLOAD_SETTINGS,
  DEFAULT_TASKS_18,
  PRESET_TASK_TEMPLATES,
  THAI_PUBLIC_HOLIDAYS_BY_MONTH,
} from './defaultData';
import type {
  AppState,
  AuditLogAction,
  AuditLogEntry,
  DocumentType,
  WorkloadSettings,
  TaskItem,
  HolidayDetail,
  LeaveDetail,
} from './types';
import type {
  CalendarDay,
  SalaryCalculationResult,
} from '@/lib/calculation/types';
import { toThaiDigits, bahtText } from '@/lib/utils/thaiNumerals';
import { distributeWorkload } from '@/lib/calculation/salaryEngine';

export const useSalaryStore = create<AppState>()((set, get) => ({
  // ----------------------------------------------------------------------------
  // Initial Domain State (Default Fixtures)
  // ----------------------------------------------------------------------------
  contractor: { ...DEFAULT_CONTRACTOR_PROFILE },
  agency: { ...DEFAULT_AGENCY_PROFILE },
  contract: { ...DEFAULT_CONTRACT_DETAILS },
  currentPeriod: { ...DEFAULT_MONTHLY_PERIOD },
  workloadSettings: { ...DEFAULT_WORKLOAD_SETTINGS },
  auditLogs: [],

  // Computed & Engine Outputs
  calendarDays: [],
  workloadResult: null,
  attendanceRecords: [],
  salaryResult: null,

  // UI & Workflow State
  activeDocument: 'DOC-01' as DocumentType,
  selectedPeriodNumber: 1,
  isCalculating: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  // ----------------------------------------------------------------------------
  // State Mutation Actions (Auto-Sync to Storage)
  // ----------------------------------------------------------------------------

  setContractor: (updates) => {
    set((state) => {
      const mergedContractor = { ...state.contractor, ...updates };
      if ((updates.title || updates.first_name || updates.last_name) && !updates.full_name) {
        mergedContractor.full_name = `${mergedContractor.title || ''}${mergedContractor.first_name || ''} ${mergedContractor.last_name || ''}`.trim();
      }
      storageAdapter.saveProfile(mergedContractor).catch(console.error);

      // Store-level synchronization: automatically keep agency.signers.contractor_name in sync (F07-T2-05)
      const nextFullName = mergedContractor.full_name;
      if (nextFullName && nextFullName !== state.agency?.signers?.contractor_name) {
        const updatedAgency = {
          ...state.agency,
          signers: {
            ...state.agency.signers,
            contractor_name: nextFullName,
          },
        };
        storageAdapter.saveAgency(updatedAgency).catch(console.error);
        return {
          contractor: mergedContractor,
          agency: updatedAgency,
        };
      }

      return { contractor: mergedContractor };
    });
  },

  setAgency: (updates) => {
    set((state) => {
      const merged = {
        ...state.agency,
        ...updates,
        signers: {
          ...state.agency.signers,
          ...(updates.signers || {}),
          contractor_name: updates.signers?.contractor_name || state.contractor.full_name || state.agency.signers.contractor_name,
        },
      };
      storageAdapter.saveAgency(merged).catch(console.error);
      return { agency: merged };
    });
  },

  setContract: (updates) => {
    set((state) => {
      const merged = { ...state.contract, ...updates };
      storageAdapter.saveContract(merged).catch(console.error);
      return { contract: merged };
    });
    // Trigger internal recalculation for UI
    get().recalculateAll();
    // Also call external API to compute derived fields
    import('@/lib/calculation/useCalculate').then(({ recalculateAndStore }) => {
      recalculateAndStore();
    });
  },

  setCurrentPeriod: (updates) => {
    set((state) => {
      const merged = { ...state.currentPeriod, ...updates };
      storageAdapter.saveCurrentPeriod(merged).catch(console.error);
      return { currentPeriod: merged };
    });
    get().recalculateAll();
  },

  setHolidays: (holidays: number[]) => {
    set((state) => {
      const month = state.currentPeriod.month || 10;
      const monthPresets = THAI_PUBLIC_HOLIDAYS_BY_MONTH[month] || [];
      const currentDetails = state.currentPeriod.holiday_details || [];
      
      const nextDetails: HolidayDetail[] = holidays.map((d) => {
        const existing = currentDetails.find((h) => h.day === d);
        if (existing) return existing;
        const preset = monthPresets.find((h) => h.day === d);
        return { day: d, name: preset ? preset.name : 'วันหยุดราชการ' };
      }).sort((a, b) => a.day - b.day);

      const updated = {
        ...state.currentPeriod,
        public_holidays: [...holidays].sort((a, b) => a - b),
        holiday_details: nextDetails,
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
  },

  toggleHoliday: (day: number) => {
    const { currentPeriod } = get();
    const list = currentPeriod.public_holidays || [];
    const nextList = list.includes(day)
      ? list.filter((d: number) => d !== day)
      : [...list, day].sort((a: number, b: number) => a - b);
    get().setHolidays(nextList);
  },

  setAbsentDays: (absentDays: number[]) => {
    set((state) => {
      const currentDetails = state.currentPeriod.leave_details || [];
      const nextDetails: LeaveDetail[] = absentDays.map((d) => {
        const existing = currentDetails.find((l) => l.day === d);
        if (existing) return existing;
        return { day: d, reason: 'ไม่มาปฏิบัติงาน', type: 'personal' as const };
      }).sort((a, b) => a.day - b.day);

      const updated = {
        ...state.currentPeriod,
        absent_days: [...absentDays].sort((a, b) => a - b),
        leave_details: nextDetails,
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
  },

  toggleAbsentDay: (day: number) => {
    const { currentPeriod } = get();
    const list = currentPeriod.absent_days || [];
    const nextList = list.includes(day)
      ? list.filter((d: number) => d !== day)
      : [...list, day].sort((a: number, b: number) => a - b);
    get().setAbsentDays(nextList);
  },

  // ----------------------------------------------------------------------------
  // Holiday & Leave Management Actions (Named Details & Presets)
  // ----------------------------------------------------------------------------

  setHolidayDetail: (day: number, name: string) => {
    const trimmedName = name.trim() || 'วันหยุดราชการ';
    set((state) => {
      const currentHolidays = state.currentPeriod.public_holidays || [];
      const currentDetails = state.currentPeriod.holiday_details || [];
      const nextHolidays = Array.from(new Set([...currentHolidays, day])).sort((a, b) => a - b);
      const filteredDetails = currentDetails.filter((h) => h.day !== day);
      const nextDetails: HolidayDetail[] = [...filteredDetails, { day, name: trimmedName }].sort(
        (a, b) => a.day - b.day
      );

      const updated = {
        ...state.currentPeriod,
        public_holidays: nextHolidays,
        holiday_details: nextDetails,
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: `เพิ่ม/บันทึกวันหยุดราชการ: วันที่ ${day} (${trimmedName})`,
      metadata: { day, name: trimmedName },
    });
  },

  removeHolidayDetail: (day: number) => {
    set((state) => {
      const nextHolidays = (state.currentPeriod.public_holidays || []).filter((d) => d !== day);
      const nextDetails = (state.currentPeriod.holiday_details || []).filter((h) => h.day !== day);
      const updated = {
        ...state.currentPeriod,
        public_holidays: nextHolidays,
        holiday_details: nextDetails,
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: `ลบวันหยุดราชการ: วันที่ ${day}`,
      metadata: { day },
    });
  },

  setLeaveDetail: (day: number, reason: string, type: LeaveDetail['type'] = 'personal') => {
    const trimmedReason = reason.trim() || 'ไม่มาปฏิบัติงาน';
    set((state) => {
      const currentAbsent = state.currentPeriod.absent_days || [];
      const currentDetails = state.currentPeriod.leave_details || [];
      const nextAbsent = Array.from(new Set([...currentAbsent, day])).sort((a, b) => a - b);
      const filteredDetails = currentDetails.filter((l) => l.day !== day);
      const nextDetails: LeaveDetail[] = [
        ...filteredDetails,
        { day, reason: trimmedReason, type },
      ].sort((a, b) => a.day - b.day);

      const updated = {
        ...state.currentPeriod,
        absent_days: nextAbsent,
        leave_details: nextDetails,
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: `เพิ่ม/บันทึกวันลา: วันที่ ${day} (${trimmedReason})`,
      metadata: { day, reason: trimmedReason, type },
    });
  },

  removeLeaveDetail: (day: number) => {
    set((state) => {
      const nextAbsent = (state.currentPeriod.absent_days || []).filter((d) => d !== day);
      const nextDetails = (state.currentPeriod.leave_details || []).filter((l) => l.day !== day);
      const updated = {
        ...state.currentPeriod,
        absent_days: nextAbsent,
        leave_details: nextDetails,
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: `ลบวันลา: วันที่ ${day}`,
      metadata: { day },
    });
  },

  applyThaiPublicHolidaysPreset: (targetMonth?: number) => {
    const { currentPeriod } = get();
    const month = targetMonth || currentPeriod.month || 10;
    const presets = THAI_PUBLIC_HOLIDAYS_BY_MONTH[month] || [];
    const holidayDays = presets.map((h) => h.day);
    set((state) => {
      const updated = {
        ...state.currentPeriod,
        public_holidays: holidayDays,
        holiday_details: [...presets],
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: `โหลดวันหยุดนักขัตฤกษ์ประจำเดือน ${currentPeriod.month_name} อัตโนมัติ (${presets.length} วัน)`,
      metadata: { month, count: presets.length },
    });
  },

  clearAllHolidays: () => {
    set((state) => {
      const updated = {
        ...state.currentPeriod,
        public_holidays: [],
        holiday_details: [],
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: 'ล้างวันหยุดราชการทั้งหมดในเดือนนี้',
    });
  },

  clearAllLeaves: () => {
    set((state) => {
      const updated = {
        ...state.currentPeriod,
        absent_days: [],
        leave_details: [],
      };
      storageAdapter.saveCurrentPeriod(updated).catch(console.error);
      return { currentPeriod: updated };
    });
    get().recalculateAll();
    get().generateWorkloadWithConditions();
    get().generateAttendance();
    get().logAudit({
      action: 'PERIOD_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'period',
      summary: 'ล้างวันลาทั้งหมดในเดือนนี้',
    });
  },

  // ----------------------------------------------------------------------------
  // UI & Document Navigation
  // ----------------------------------------------------------------------------

  setActiveDocument: (docId: DocumentType) => {
    set({ activeDocument: docId });
  },

  setSelectedPeriodNumber: (periodNumber: number) => {
    set((state) => ({
      selectedPeriodNumber: periodNumber,
      currentPeriod: {
        ...state.currentPeriod,
        period_number: periodNumber,
      },
    }));
  },

  // ----------------------------------------------------------------------------
  // Calculation & Engine Trigger Actions
  // ----------------------------------------------------------------------------

  setWorkloadSettings: (settingsUpdate) => {
    set((state) => {
      const merged = { ...state.workloadSettings, ...settingsUpdate };
      storageAdapter.saveWorkloadSettings?.(merged).catch(console.error);
      return { workloadSettings: merged };
    });
  },

  setTargetTasks: (target: number) => {
    const validTarget = Math.max(1, Math.round(target));
    set((state) => {
      const updatedSettings = {
        ...state.workloadSettings,
        target_tasks: validTarget,
      };
      const updatedContract = {
        ...state.contract,
        target_tasks_per_period: validTarget,
      };
      storageAdapter.saveWorkloadSettings?.(updatedSettings).catch(console.error);
      storageAdapter.saveContract?.(updatedContract).catch(console.error);
      return {
        workloadSettings: updatedSettings,
        contract: updatedContract,
      };
    });
    get().generateWorkloadWithConditions();
    get().logAudit({
      action: 'WORKLOAD_GENERATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'workload',
      summary: `ปรับเปลี่ยนจำนวนชิ้นงานเป้าหมายเป็น ${validTarget} ชิ้น`,
      metadata: { target_tasks: validTarget },
    });
  },

  setTaskList: (tasks: TaskItem[]) => {
    const normalizedTasks = tasks.map((t, idx) => ({
      ...t,
      id: idx + 1,
    }));
    set((state) => {
      const updatedSettings = {
        ...state.workloadSettings,
        task_list: normalizedTasks,
      };
      storageAdapter.saveWorkloadSettings?.(updatedSettings).catch(console.error);
      return { workloadSettings: updatedSettings };
    });
    get().generateWorkloadWithConditions();
  },

  addTaskItem: (description: string) => {
    const desc = description.trim();
    if (!desc) return;
    const { workloadSettings } = get();
    const currentList = workloadSettings.task_list || [];
    const nextId = currentList.length + 1;
    const nextList: TaskItem[] = [...currentList, { id: nextId, description: desc }];
    get().setTaskList(nextList);
    get().logAudit({
      action: 'PROFILE_UPDATE',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'workload_tasks',
      summary: `เพิ่มภาระงานใหม่: "${desc.slice(0, 30)}..."`,
      metadata: { task_id: nextId, total_tasks: nextList.length },
    });
  },

  updateTaskItem: (id: number, description: string) => {
    const desc = description.trim();
    if (!desc) return;
    const { workloadSettings } = get();
    const currentList = workloadSettings.task_list || [];
    const nextList = currentList.map((t) => (t.id === id ? { ...t, description: desc } : t));
    get().setTaskList(nextList);
  },

  removeTaskItem: (id: number) => {
    const { workloadSettings } = get();
    const currentList = workloadSettings.task_list || [];
    if (currentList.length <= 1) return;
    const nextList = currentList.filter((t) => t.id !== id).map((t, idx) => ({ ...t, id: idx + 1 }));
    get().setTaskList(nextList);
  },

  reorderTasks: (startIndex: number, endIndex: number) => {
    const { workloadSettings } = get();
    const currentList = [...(workloadSettings.task_list || [])];
    if (
      startIndex < 0 ||
      startIndex >= currentList.length ||
      endIndex < 0 ||
      endIndex >= currentList.length
    )
      return;
    const [moved] = currentList.splice(startIndex, 1);
    currentList.splice(endIndex, 0, moved);
    const reindexed = currentList.map((t, idx) => ({ ...t, id: idx + 1 }));
    get().setTaskList(reindexed);
  },

  resetTaskListToDefault: () => {
    const defaultTasks = DEFAULT_TASKS_18.map((t) => ({ ...t }));
    get().setTaskList(defaultTasks);
    get().logAudit({
      action: 'DATA_RESET',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'workload_tasks',
      summary: 'รีเซ็ตรายการภาระงานกลับเป็น 18 ข้อมาตรฐาน',
    });
  },

  loadTaskPreset: (presetIndex: number) => {
    const preset = PRESET_TASK_TEMPLATES[presetIndex];
    if (!preset) return;
    const newTasks: TaskItem[] = preset.tasks.map((desc, idx) => ({
      id: idx + 1,
      description: desc,
    }));
    get().setTaskList(newTasks);
    get().logAudit({
      action: 'DATA_RESET',
      actor: get().contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'workload_tasks',
      summary: `โหลดชุดภาระงานสำเร็จรูป: ${preset.name}`,
    });
  },

  generateWorkloadWithConditions: (options?: Partial<WorkloadSettings>) => {
    get().recalculateAll();
    const { calendarDays, workloadSettings, contract } = get();
    const settings = { ...workloadSettings, ...options };
    const taskList = settings.task_list && settings.task_list.length > 0
      ? settings.task_list
      : DEFAULT_TASKS_18;
    const targetTasks = settings.target_tasks ?? contract.target_tasks_per_period ?? 110;
    const seed = settings.seed ?? (Math.floor(Date.now() / 1000) % 10000);

    const result = distributeWorkload(
      calendarDays,
      targetTasks,
      taskList.length,
      {
        minTasksPerDay: settings.min_tasks_per_day ?? 1,
        maxTasksPerDay: settings.max_tasks_per_day,
        strategy: settings.distribution_strategy || 'uniform',
        seed,
      }
    );

    set({
      workloadResult: result,
      workloadSettings: {
        ...settings,
        target_tasks: targetTasks,
        seed,
      },
    });

    storageAdapter.saveWorkloadSettings?.({
      ...settings,
      target_tasks: targetTasks,
      seed,
    }).catch(console.error);

    get().logAudit({
      action: 'WORKLOAD_GENERATE',
      actor: get().contractor.full_name || 'ระบบอัตโนมัติ',
      entity_type: 'workload',
      summary: `สุ่มสร้างภาระงานตามเงื่อนไขสำเร็จ (${result.grand_total}/${targetTasks} ชิ้น, ${taskList.length} รายการงาน)`,
      metadata: {
        seed,
        target_tasks: targetTasks,
        grand_total: result.grand_total,
        task_count: taskList.length,
        min_per_day: settings.min_tasks_per_day ?? 1,
        strategy: settings.distribution_strategy || 'uniform',
      },
    });
  },

  generateWorkload: (seed = 42) => {
    get().generateWorkloadWithConditions({ seed });
  },

  toggleMatrixCell: (row: number, col: number) => {
    const { workloadResult, calendarDays } = get();
    if (!workloadResult) return;
    const day = calendarDays[col];
    if (!day || !day.is_working_day) return; // Cannot edit holiday cells

    const matrix = workloadResult.matrix.map((r) => [...r]);
    const currentVal = matrix[row]?.[col] || 0;
    const newVal = currentVal === 1 ? 0 : 1;
    matrix[row][col] = newVal;

    const task_totals = matrix.map((r) => r.reduce((a, b) => a + (b === 1 ? 1 : 0), 0));
    const daily_sums = Array.from({ length: 31 }, (_, c) =>
      matrix.reduce((acc, r) => acc + (r[c] === 1 ? 1 : 0), 0)
    );
    const grand_total = daily_sums.reduce((a, b) => a + b, 0);

    set({
      workloadResult: {
        ...workloadResult,
        matrix,
        task_totals,
        daily_sums,
        grand_total,
      },
    });
  },

  clearWorkloadMatrix: () => {
    const { workloadSettings } = get();
    const taskCount = workloadSettings.task_list?.length || 18;
    const matrix = Array.from({ length: taskCount }, () => Array.from({ length: 31 }, () => 0));
    set({
      workloadResult: {
        matrix,
        task_totals: Array(taskCount).fill(0),
        daily_sums: Array(31).fill(0),
        grand_total: 0,
        working_days_indices: [],
      },
    });
  },

  generateAttendance: (seed = 42) => {
    get().recalculateAll();
    const { calendarDays, contractor } = get();
    const records = calendarDays.map((cd) => {
      if (!cd.is_working_day) {
        return {
          day: cd.day,
          date_iso: cd.date_iso,
          weekday_name: '',
          time_in: '',
          time_out: '',
          time_in_short: '',
          time_out_short: '',
          is_working_day: false,
          remark: cd.remark || '',
        };
      }
      const inMinute = (cd.day * 7 + seed) % 60;
      const inHour = inMinute > 30 ? 7 : 8;
      const timeInShort = `${String(inHour).padStart(2, '0')}:${String(inMinute).padStart(2, '0')}`;
      const timeIn = `${timeInShort}:00`;

      const outMinute = (cd.day * 13 + seed) % 60;
      const outHour = 16 + ((cd.day * 3) % 3);
      const timeOutShort = `${String(outHour).padStart(2, '0')}:${String(outMinute).padStart(2, '0')}`;
      const timeOut = `${timeOutShort}:00`;

      return {
        day: cd.day,
        date_iso: cd.date_iso,
        weekday_name: '',
        time_in: timeIn,
        time_out: timeOut,
        time_in_short: timeInShort,
        time_out_short: timeOutShort,
        is_working_day: true,
        remark: '',
      };
    });

    set({ attendanceRecords: records });

    get().logAudit({
      action: 'ATTENDANCE_GENERATE',
      actor: contractor.full_name || 'ระบบอัตโนมัติ',
      entity_type: 'attendance',
      summary: `จำลองเวลาเข้า-ออกงานราชการสำเร็จ (${records.filter((r) => r.is_working_day).length} วันทำการ)`,
      metadata: { seed },
    });
  },

  recalculateAll: () => {
    const { contract, currentPeriod } = get();
    const year = currentPeriod.year_ad || (currentPeriod.year_be ? currentPeriod.year_be - 543 : 2026);
    const month = currentPeriod.month || 10;
    const salary = contract.monthly_salary || 19800.0;
    const periods = contract.total_periods || 12;
    const totalContract = contract.total_contract_amount || salary * periods;

    // Days in target month
    const daysInMonth = new Date(year, month, 0).getDate();
    const holidays = currentPeriod.public_holidays || [];
    const absentDays = currentPeriod.absent_days || [];

    // Statutory 30-day daily rate
    const dailyRate = Math.round((salary / 30.0) * 100) / 100;

    // Evaluate calendar days
    const calendarDays: CalendarDay[] = [];
    let workingDaysCount = 0;
    let actualAbsentCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(d);
      const isAbsent = absentDays.includes(d);
      const isWorkingDay = !isWeekend && !isHoliday && !isAbsent;

      if (isWorkingDay) {
        workingDaysCount++;
      } else if (isAbsent && !isWeekend && !isHoliday) {
        actualAbsentCount++;
      }

      let cellColor = '#FFFFFF';
      let remark = '';
      if (isWeekend) {
        cellColor = '#D3D3D3';
        remark = 'วันหยุดเสาร์-อาทิตย์';
      } else if (isHoliday) {
        cellColor = '#D3D3D3';
        const holidayDetail = currentPeriod.holiday_details?.find((h) => h.day === d);
        remark = holidayDetail?.name || 'วันหยุดราชการ';
      } else if (isAbsent) {
        const leaveDetail = currentPeriod.leave_details?.find((l) => l.day === d);
        remark = leaveDetail?.reason || 'ไม่มาปฏิบัติงาน';
      }

      const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      calendarDays.push({
        day: d,
        date_iso: isoStr,
        is_weekend: isWeekend,
        is_holiday: isHoliday,
        is_absent: isAbsent,
        is_working_day: isWorkingDay,
        cell_color: cellColor,
        remark: remark,
      });
    }

    const deductionAmount = Math.round(actualAbsentCount * dailyRate * 100) / 100;
    const netPayable = Math.max(0, Math.round((salary - deductionAmount) * 100) / 100);
    const hasDeduction = actualAbsentCount > 0;

    const salaryResult: SalaryCalculationResult = {
      monthly_salary: salary,
      total_periods: periods,
      total_contract_amount: totalContract,
      daily_rate: dailyRate,
      absent_days_count: actualAbsentCount,
      deduction_amount: deductionAmount,
      net_payable: netPayable,
      has_deduction: hasDeduction,
      monthly_salary_bahttext: bahtText(salary),
      net_payable_bahttext: bahtText(netPayable),
      total_contract_amount_bahttext: bahtText(totalContract),
      monthly_salary_thai: toThaiDigits(salary.toLocaleString('en-US')),
      net_payable_thai: toThaiDigits(netPayable.toLocaleString('en-US')),
      total_contract_amount_thai: toThaiDigits(totalContract.toLocaleString('en-US')),
    };

    const updatedPeriod = {
      ...currentPeriod,
      days_in_month: daysInMonth,
      actual_working_days: workingDaysCount,
      absent_days_count: actualAbsentCount,
      daily_rate: dailyRate,
      deduction_amount: deductionAmount,
      net_payable: netPayable,
      monthly_salary_bahttext: bahtText(salary),
      net_payable_bahttext: bahtText(netPayable),
      total_contract_amount_bahttext: bahtText(totalContract),
    };

    set({
      calendarDays,
      salaryResult,
      currentPeriod: updatedPeriod,
    });

    storageAdapter.saveCurrentPeriod(updatedPeriod).catch(console.error);
  },

  // ----------------------------------------------------------------------------
  // Persistence & Initialization
  // ----------------------------------------------------------------------------

  initStore: async () => {
    try {
      set({ isLoading: true });
      const [profile, agency, contract, period, wlSettings, logs] = await Promise.all([
        storageAdapter.getProfile(),
        storageAdapter.getAgency(),
        storageAdapter.getContract(),
        storageAdapter.getCurrentPeriod(),
        storageAdapter.getWorkloadSettings
          ? storageAdapter.getWorkloadSettings()
          : Promise.resolve(DEFAULT_WORKLOAD_SETTINGS),
        storageAdapter.getAuditLogs(50),
      ]);

      // Self-healing synchronization on hydration (F07-T2-05)
      if (profile.full_name && agency.signers && agency.signers.contractor_name !== profile.full_name) {
        agency.signers.contractor_name = profile.full_name;
        storageAdapter.saveAgency(agency).catch(console.error);
      }

      set({
        contractor: profile,
        agency: agency,
        contract: contract,
        currentPeriod: period,
        workloadSettings: wlSettings || DEFAULT_WORKLOAD_SETTINGS,
        auditLogs: logs,
        isHydrated: true,
        isLoading: false,
      });

      get().recalculateAll();
    } catch (err: any) {
      set({
        error: err.message || 'Failed to initialize storage',
        isLoading: false,
        isHydrated: true,
      });
    }
  },

  logAudit: async (action: AuditLogAction | Omit<AuditLogEntry, 'id' | 'created_at'>) => {
    const entry = await storageAdapter.logAction(action);
    set((state) => ({
      auditLogs: [entry, ...state.auditLogs].slice(0, 50),
    }));
  },

  resetToDefaults: async () => {
    await storageAdapter.resetToDefaults();
    set({
      contractor: { ...DEFAULT_CONTRACTOR_PROFILE },
      agency: { ...DEFAULT_AGENCY_PROFILE },
      contract: { ...DEFAULT_CONTRACT_DETAILS },
      currentPeriod: { ...DEFAULT_MONTHLY_PERIOD },
      workloadSettings: { ...DEFAULT_WORKLOAD_SETTINGS },
      workloadResult: null,
      auditLogs: [],
      error: null,
    });
    get().recalculateAll();
  },

  exportStateJson: () => {
    const state = get();
    return JSON.stringify(
      {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        profile: state.contractor,
        contractor: state.contractor,
        agency: state.agency,
        contract: state.contract,
        currentPeriod: state.currentPeriod,
        workloadSettings: state.workloadSettings,
        auditLogs: state.auditLogs,
      },
      null,
      2
    );
  },

  importStateJson: (json: string): boolean => {
    try {
      if (!json || typeof json !== 'string') {
        throw new Error('Invalid JSON payload');
      }
      let parsed: any;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new Error('Invalid JSON payload: malformed JSON string');
      }
      const profile = parsed.profile || parsed.contractor;
      const agency = parsed.agency;
      const contract = parsed.contract;
      if (!profile || !agency || !contract) {
        throw new Error('Payload missing required entities: profile, agency, contract');
      }

      // Reconcile contractor name in signers if out of sync in imported backup
      if (profile.full_name && agency.signers && agency.signers.contractor_name !== profile.full_name) {
        agency.signers.contractor_name = profile.full_name;
      }

      storageAdapter.importAllData(json).catch(console.error);

      set({
        contractor: profile,
        agency: agency,
        contract: contract,
        currentPeriod: parsed.currentPeriod || parsed.period || get().currentPeriod,
        workloadSettings: parsed.workloadSettings || parsed.workload_settings || get().workloadSettings,
        auditLogs: parsed.auditLogs || [],
        error: null,
      });

      get().recalculateAll();
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to import JSON' });
      return false;
    }
  },
}));
