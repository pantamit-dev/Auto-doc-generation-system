'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CalendarCheck,
  CalendarX,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Coins,
  FileText,
  Info,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { THAI_PUBLIC_HOLIDAYS_BY_MONTH } from '@/lib/store/defaultData';
import type { HolidayDetail, LeaveDetail } from '@/types/schema';
import { useSystemOptions } from '@/lib/systemOptions/useSystemOptions';

export function HolidayLeaveManager() {
  const { comboboxOptions: leaveTypeOptions } = useSystemOptions('leave_type');
  const currentPeriod = useSalaryStore((s) => s.currentPeriod);
  const contract = useSalaryStore((s) => s.contract);
  const calendarDays = useSalaryStore((s) => s.calendarDays);

  const setHolidayDetail = useSalaryStore((s) => s.setHolidayDetail);
  const removeHolidayDetail = useSalaryStore((s) => s.removeHolidayDetail);
  const setLeaveDetail = useSalaryStore((s) => s.setLeaveDetail);
  const removeLeaveDetail = useSalaryStore((s) => s.removeLeaveDetail);
  const applyThaiPublicHolidaysPreset = useSalaryStore((s) => s.applyThaiPublicHolidaysPreset);
  const clearAllHolidays = useSalaryStore((s) => s.clearAllHolidays);
  const clearAllLeaves = useSalaryStore((s) => s.clearAllLeaves);
  const toggleHoliday = useSalaryStore((s) => s.toggleHoliday);
  const toggleAbsentDay = useSalaryStore((s) => s.toggleAbsentDay);
  const generateWorkloadWithConditions = useSalaryStore((s) => s.generateWorkloadWithConditions);
  const generateAttendance = useSalaryStore((s) => s.generateAttendance);

  // Form local states
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [holidayNameInput, setHolidayNameInput] = useState<string>('');
  const [leaveReasonInput, setLeaveReasonInput] = useState<string>('ลาป่วย');
  const [leaveTypeInput, setLeaveTypeInput] = useState<LeaveDetail['type']>('sick');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(
    null
  );

  const showNotice = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const yearAD = currentPeriod.year_ad || (currentPeriod.year_be ? currentPeriod.year_be - 543 : 2026);
  const month = currentPeriod.month || 10;
  const daysInMonth = new Date(yearAD, month, 0).getDate();

  // Day of week of the 1st of the month (0=Sun, 1=Mon, ..., 6=Sat)
  // Convert so Monday is 0, Sunday is 6
  const firstDaySundayBased = new Date(yearAD, month - 1, 1).getDay();
  const firstDayMondayBased = (firstDaySundayBased + 6) % 7; // Mon=0, Tue=1 ... Sun=6

  const holidays = currentPeriod.public_holidays || [];
  const absentDays = currentPeriod.absent_days || [];
  const holidayDetails = currentPeriod.holiday_details || [];
  const leaveDetails = currentPeriod.leave_details || [];

  const actualWorkingDays = currentPeriod.actual_working_days ?? 20;
  const absentCount = currentPeriod.absent_days_count ?? absentDays.length;
  const monthlySalary = contract.monthly_salary || 19800;
  const dailyRate = currentPeriod.daily_rate || Math.round((monthlySalary / 30.0) * 100) / 100;
  const deductionAmount = currentPeriod.deduction_amount ?? Math.round(absentCount * dailyRate * 100) / 100;
  const netPayable = currentPeriod.net_payable ?? Math.max(0, monthlySalary - deductionAmount);

  // Common public holiday suggestions
  const commonHolidaySuggestions = [
    'วันนวมินทรมหาราช',
    'วันปิยมหาราช',
    'วันขึ้นปีใหม่',
    'วันสงกรานต์',
    'วันแรงงานแห่งชาติ',
    'วันฉัตรมงคล',
    'วันเฉลิมพระชนมพรรษา',
    'วันแม่แห่งชาติ',
    'วันพ่อแห่งชาติ',
    'วันรัฐธรรมนูญ',
    'วันสิ้นปี',
    'วันหยุดชดเชย',
  ];

  // Quick holiday add
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const name = holidayNameInput.trim() || 'วันหยุดราชการ';
    setHolidayDetail(selectedDay, name);
    setHolidayNameInput('');
    showNotice(`บันทึกวันหยุดราชการ วันที่ ${selectedDay} (${name}) เรียบร้อย`);
  };

  // Quick leave add
  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const reason = leaveReasonInput.trim() || 'ไม่มาปฏิบัติงาน';
    setLeaveDetail(selectedDay, reason, leaveTypeInput);
    setLeaveReasonInput('ลาป่วย');
    showNotice(`บันทึกวันลา วันที่ ${selectedDay} (${reason}) หักเงินค่าจ้าง 660.00 บาท เรียบร้อย`);
  };

  // One-click Thai preset
  const handleApplyPreset = () => {
    applyThaiPublicHolidaysPreset(month);
    const presets = THAI_PUBLIC_HOLIDAYS_BY_MONTH[month] || [];
    showNotice(`โหลดวันหยุดราชการประจำเดือน ${currentPeriod.month_name} สำเร็จ (${presets.length} วัน)`, 'success');
  };

  // Synchronize downstream workload and attendance
  const handleResyncAll = () => {
    generateWorkloadWithConditions();
    generateAttendance();
    showNotice('จัดสรรภาระงาน (DOC-03) และจำลองเวลาเข้า-ออก (DOC-04) สอดคล้องกับปฏิทินใหม่เรียบร้อย', 'success');
  };

  // Helper to get status of day d
  const getDayInfo = (d: number) => {
    const dt = new Date(yearAD, month - 1, d);
    const dayOfWeek = dt.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(d);
    const isAbsent = absentDays.includes(d);
    const isWorking = !isWeekend && !isHoliday && !isAbsent;

    const hDetail = holidayDetails.find((h) => h.day === d);
    const lDetail = leaveDetails.find((l) => l.day === d);

    return {
      day: d,
      dayOfWeek,
      isWeekend,
      isHoliday,
      isAbsent,
      isWorking,
      holidayName: hDetail?.name || (isHoliday ? 'วันหยุดราชการ' : ''),
      leaveReason: lDetail?.reason || (isAbsent ? 'ไม่มาปฏิบัติงาน' : ''),
      leaveType: lDetail?.type,
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-heading font-medium flex items-center justify-between shadow-md transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : notification.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : notification.type === 'warn' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Financial Impact & Stat Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-heading">วันทำงานปกติ (Working Days)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-heading">
            {actualWorkingDays} <span className="text-sm font-normal text-slate-500">/ {daysInMonth} วัน</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ชิ้นงานกระจายลงเฉพาะวันทำงาน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-heading">วันหยุดราชการ (Public Holidays)</div>
          <div className="text-2xl font-bold text-sky-700 mt-1 font-heading">
            {holidays.length} <span className="text-sm font-normal text-slate-500">วัน</span>
          </div>
          <div className="text-[11px] text-sky-600 mt-1">ได้รับค่าจ้างปกติ ไม่หักเงิน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-heading">วันลาตนเอง (Absent / Leave)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-heading">
            {absentCount} <span className="text-sm font-normal text-slate-500">วัน</span>
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            หักวันละ ฿{dailyRate.toFixed(2)} (รวม ฿{deductionAmount.toFixed(2)})
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-heading">ค่าจ้างสุทธิที่ขอเบิกจ่าย</div>
          <div className="text-2xl font-bold text-slate-800 mt-1 font-heading font-mono">
            ฿{netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-semibold mt-1">
            {absentCount > 0 ? (
              <span className="text-amber-700">ส่งมอบด้วย DOC-02B (หักวันลา)</span>
            ) : (
              <span className="text-emerald-700">ส่งมอบด้วย DOC-02A (เต็มจำนวน)</span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive 31-Day Calendar Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              ปฏิทินวันทำงาน วันหยุดนักขัตฤกษ์ และวันลา ประจำเดือน {currentPeriod.month_name} พ.ศ. {currentPeriod.year_be}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่วันที่ในตารางเพื่อเลือกและกำหนดสถานะวันหยุดหรือวันลา ระบบจะคำนวณเงินหักและอัปเดตเอกสารอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleApplyPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
              title="ดึงวันหยุดราชการประจำเดือนตุลาคมจากระเบียบทางการ"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              โหลดวันหยุดราชการประจำเดือนอัตโนมัติ
            </button>
            <button
              type="button"
              onClick={handleResyncAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="สร้างภาระงานและเวลาเข้าออกใหม่ให้ตรงกับปฏิทินปัจจุบัน"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              อัปเดต DOC-03 & DOC-04
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-heading flex-wrap pt-1 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>วันทำงานปกติ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
            <span>วันหยุดราชการ/นักขัตฤกษ์</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>วันลาตนเอง (หักค่าจ้าง)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span>
            <span>วันหยุดเสาร์-อาทิตย์</span>
          </div>
        </div>

        {/* 7-Column Calendar Grid */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {/* Day of Week Headers (จันทร์ - อาทิตย์) */}
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center font-heading text-xs font-bold text-slate-700 py-2">
            <div>จันทร์</div>
            <div>อังคาร</div>
            <div>พุธ</div>
            <div>พฤหัสบดี</div>
            <div>ศุกร์</div>
            <div className="text-amber-800">เสาร์</div>
            <div className="text-rose-800">อาทิตย์</div>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-[1px]">
            {/* Blank leading cells before the 1st day of month */}
            {Array.from({ length: firstDayMondayBased }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-slate-50/70 min-h-[76px] p-2 opacity-40"></div>
            ))}

            {/* Days 1 to daysInMonth */}
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const info = getDayInfo(day);
              const isSelected = selectedDay === day;

              let cellBg = 'bg-white hover:bg-slate-50';
              let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              let statusLabel = 'ทำงานปกติ';

              if (info.isWeekend) {
                cellBg = 'bg-slate-100 hover:bg-slate-150 text-slate-500';
                badgeBg = 'bg-slate-200 text-slate-700 border-slate-300';
                statusLabel = 'วันหยุด ส.-อา.';
              } else if (info.isHoliday) {
                cellBg = 'bg-sky-50/90 hover:bg-sky-100/90 text-sky-900';
                badgeBg = 'bg-sky-100 text-sky-800 border-sky-300';
                statusLabel = info.holidayName || 'วันหยุดราชการ';
              } else if (info.isAbsent) {
                cellBg = 'bg-amber-50 hover:bg-amber-100 text-amber-900';
                badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
                statusLabel = info.leaveReason || 'วันลาตนเอง';
              }

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[84px] p-2 cursor-pointer transition-all flex flex-col justify-between ${cellBg} ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-inset shadow-xs' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold font-heading rounded-md px-1.5 py-0.5 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {day}
                    </span>
                    {info.isAbsent && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                        -฿660
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    <div
                      className={`text-[10.5px] font-heading font-medium truncate px-1 py-0.5 rounded border ${badgeBg}`}
                      title={statusLabel}
                    >
                      {statusLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Quick Action Bar */}
        {selectedDay && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-slate-800 text-sm">
                วันที่เลือก: วันที่ {selectedDay} {currentPeriod.month_name}
              </span>
              <span className="text-slate-500">
                (สถานะปัจจุบัน: {getDayInfo(selectedDay).isWorking ? '🟢 วันทำงาน' : getDayInfo(selectedDay).isHoliday ? '🔵 วันหยุดราชการ' : getDayInfo(selectedDay).isAbsent ? '🟠 วันลา' : '⚪ วันหยุดเสาร์-อาทิตย์'})
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  removeHolidayDetail(selectedDay);
                  removeLeaveDetail(selectedDay);
                  showNotice(`ตั้งวันที่ ${selectedDay} เป็นวันทำงานปกติเรียบร้อย`);
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-heading font-medium transition-colors"
              >
                เป็นวันทำงานปกติ
              </button>
              <button
                type="button"
                onClick={() => {
                  const defaultName = THAI_PUBLIC_HOLIDAYS_BY_MONTH[month]?.find((h) => h.day === selectedDay)?.name || 'วันหยุดราชการ';
                  setHolidayDetail(selectedDay, defaultName);
                  removeLeaveDetail(selectedDay);
                  showNotice(`ตั้งวันที่ ${selectedDay} เป็นวันหยุดราชการ (${defaultName}) เรียบร้อย`);
                }}
                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-heading font-medium transition-colors"
              >
                เป็นวันหยุดราชการ
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveDetail(selectedDay, 'ลาป่วย', 'sick');
                  removeHolidayDetail(selectedDay);
                  showNotice(`ตั้งวันที่ ${selectedDay} เป็นวันลาตนเอง (ลาป่วย) เรียบร้อย`);
                }}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-heading font-medium transition-colors"
              >
                เป็นวันลาตนเอง
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forms Section: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: จัดการวันหยุดราชการ / นักขัตฤกษ์ */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-50 text-sky-700 rounded-lg border border-sky-100">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-slate-800 text-base">จัดการวันหยุดราชการ / นักขัตฤกษ์</h4>
                <p className="text-xs text-slate-500">กำหนดวันและชื่อวันหยุดราชการ (ไม่ถูกหักเงินค่าจ้าง)</p>
              </div>
            </div>

            {holidays.length > 0 && (
              <button
                type="button"
                onClick={clearAllHolidays}
                className="text-xs text-rose-600 hover:text-rose-700 font-heading font-medium underline"
              >
                ล้างวันหยุดทั้งหมด
              </button>
            )}
          </div>

          <form onSubmit={handleAddHoliday} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-700 mb-1">
                  เลือกวันที่ (1–{daysInMonth})
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-heading"
                >
                  {Array.from({ length: daysInMonth }, (_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      วันที่ {idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-heading font-semibold text-slate-700 mb-1">
                  ชื่อวันหยุดราชการ
                </label>
                <input
                  type="text"
                  list="holiday-suggestions"
                  value={holidayNameInput}
                  onChange={(e) => setHolidayNameInput(e.target.value)}
                  placeholder="เช่น วันนวมินทรมหาราช, วันปิยมหาราช"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-heading"
                />
                <datalist id="holiday-suggestions">
                  {commonHolidaySuggestions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-heading font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม / บันทึกวันหยุดราชการ
            </button>
          </form>

          {/* Active Public Holidays List */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-heading font-semibold text-slate-600">
              วันหยุดราชการที่บันทึกไว้ในเดือนนี้ ({holidays.length} วัน):
            </span>

            {holidays.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                ยังไม่มีวันหยุดราชการในเดือนนี้
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {holidays.map((day) => {
                  const detail = holidayDetails.find((h) => h.day === day);
                  const name = detail?.name || 'วันหยุดราชการ';
                  return (
                    <div
                      key={day}
                      className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-lg flex items-center justify-between text-xs font-heading"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                          {day}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-800">{name}</span>
                          <span className="text-[11px] text-slate-500 block">
                            วันที่ {day} {currentPeriod.month_name} {currentPeriod.year_be}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeHolidayDetail(day)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="ลบวันหยุดนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Form 2: จัดการวันลาตนเอง / ไม่มาปฏิบัติงาน */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                <CalendarX className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-slate-800 text-base">จัดการวันลาตนเอง / ไม่มาปฏิบัติงาน</h4>
                <p className="text-xs text-slate-500">
                  กำหนดวันลาและเหตุผล (หักค่าจ้าง 660.00 บาท/วัน และออกใบส่งมอบ DOC-02B)
                </p>
              </div>
            </div>

            {absentDays.length > 0 && (
              <button
                type="button"
                onClick={clearAllLeaves}
                className="text-xs text-rose-600 hover:text-rose-700 font-heading font-medium underline"
              >
                ล้างวันลาทั้งหมด
              </button>
            )}
          </div>

          <form onSubmit={handleAddLeave} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-700 mb-1">
                  เลือกวันที่ (1–{daysInMonth})
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-heading"
                >
                  {Array.from({ length: daysInMonth }, (_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      วันที่ {idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-slate-700 mb-1">
                  ประเภทการลา
                </label>
                <select
                  value={leaveTypeInput}
                  onChange={(e) => {
                    const type = e.target.value as LeaveDetail['type'];
                    setLeaveTypeInput(type);
                    const matchedOpt = leaveTypeOptions.find((o) => o.value === type);
                    if (matchedOpt) {
                      setLeaveReasonInput(matchedOpt.label);
                    } else if (type === 'sick') setLeaveReasonInput('ลาป่วย');
                    else if (type === 'personal') setLeaveReasonInput('ลากิจส่วนตัว');
                    else if (type === 'absent') setLeaveReasonInput('ไม่มาปฏิบัติงาน');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-heading"
                >
                  {leaveTypeOptions.length > 0 ? (
                    leaveTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="sick">ลาป่วย</option>
                      <option value="personal">ลากิจส่วนตัว</option>
                      <option value="absent">ไม่มาปฏิบัติงาน</option>
                      <option value="other">อื่นๆ</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-slate-700 mb-1">
                  เหตุผล / หมายเหตุ
                </label>
                <input
                  type="text"
                  value={leaveReasonInput}
                  onChange={(e) => setLeaveReasonInput(e.target.value)}
                  placeholder="เช่น ลาป่วย มีไข้"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-heading"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-heading font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม / บันทึกวันลา (หักเงินตามระเบียบ ฿660.00)
            </button>
          </form>

          {/* Active Leave Days List */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-heading font-semibold text-slate-600">
              วันลาที่บันทึกไว้ในเดือนนี้ ({absentDays.length} วัน):
            </span>

            {absentDays.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                ไม่มีวันลาในเดือนนี้ (ได้รับค่าจ้างเต็มจำนวน ฿19,800.00)
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {absentDays.map((day) => {
                  const detail = leaveDetails.find((l) => l.day === day);
                  const reason = detail?.reason || 'ไม่มาปฏิบัติงาน';
                  const typeLabel =
                    detail?.type === 'sick'
                      ? 'ลาป่วย'
                      : detail?.type === 'personal'
                      ? 'ลากิจส่วนตัว'
                      : 'ไม่มาปฏิบัติงาน';
                  return (
                    <div
                      key={day}
                      className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between text-xs font-heading"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                          {day}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{reason}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                              {typeLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-700 font-medium block">
                            หักเงินค่าจ้าง ฿{dailyRate.toFixed(2)} บาท
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLeaveDetail(day)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="ลบวันลานี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
