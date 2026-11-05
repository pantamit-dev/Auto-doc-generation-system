'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Timer,
  RefreshCw,
  Printer,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Columns,
  Sparkles,
} from 'lucide-react';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { Doc04AttendanceSheet } from '@/components/templates/Doc04AttendanceSheet';
import { HolidayLeaveManager } from '@/components/forms/HolidayLeaveManager';

export default function AttendancePage() {
  const currentPeriod = useSalaryStore((s) => s.currentPeriod);
  const attendanceRecords = useSalaryStore((s) => s.attendanceRecords);
  const generateAttendance = useSalaryStore((s) => s.generateAttendance);
  const isHydrated = useSalaryStore((s) => s.isHydrated);

  const [activeTab, setActiveTab] = useState<'calendar' | 'sheet' | 'split'>('calendar');
  const [seed, setSeed] = useState(42);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    if (isHydrated && (!attendanceRecords || attendanceRecords.length === 0)) {
      generateAttendance(seed);
    }
  }, [isHydrated, attendanceRecords, generateAttendance, seed]);

  const handleRegenerate = () => {
    const nextSeed = Date.now() % 10000;
    setSeed(nextSeed);
    generateAttendance(nextSeed);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  const workDaysCount = attendanceRecords.filter((r) => r.is_working_day).length;
  const leaveDaysCount = currentPeriod.absent_days_count ?? (currentPeriod.absent_days?.length ?? 0);
  const holidayCount = currentPeriod.public_holidays?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-800">
              บันทึกเวลาปฏิบัติงาน & ปฏิทินวันหยุด-วันลา
            </h2>
            <p className="text-slate-500 text-sm md:text-base mt-1">
              ประจำเดือน {currentPeriod.month_name} พ.ศ. {currentPeriod.year_be} (วันทำงาน {workDaysCount} วัน, วันหยุดราชการ {holidayCount} วัน, ลา {leaveDaysCount} วัน)
            </p>
          </div>
        </div>

        {/* Action Buttons & View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRegenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-colors shadow-sm min-h-[46px]"
          >
            <RefreshCw className="w-4 h-4" />
            จำลองเวลาเข้า-ออกใหม่
          </button>
          <Link
            href="/preview/doc-4"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-colors shadow-sm min-h-[46px]"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ DOC-04
          </Link>
        </div>
      </div>

      {/* Success alert */}
      {successNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          <span>จำลองเวลาเข้างาน (07:30–08:30) และออกงาน (16:30–19:00) สอดคล้องกับระเบียบราชการเรียบร้อย</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-heading font-semibold transition-all ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          ปฏิทินวันหยุดราชการ & วันลา
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sheet')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-heading font-semibold transition-all ${
            activeTab === 'sheet'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          ตารางเวลาเข้า-ออกงาน (DOC-04)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('split')}
          className={`hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-heading font-semibold transition-all ${
            activeTab === 'split'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          มุมมองแบ่งสองฝั่ง (Split View)
        </button>
      </div>

      {/* Criteria Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-700">เวลาเข้างานช่วงเช้า:</span>
            <div className="text-base font-bold text-sky-700 font-mono mt-0.5">07:30:00 – 08:30:00</div>
          </div>
          <span className="text-[11px] px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-100">
            กรอบเวลาราชการ
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-700">เวลาออกงานช่วงเย็น:</span>
            <div className="text-base font-bold text-indigo-700 font-mono mt-0.5">16:30:00 – 19:00:00</div>
          </div>
          <span className="text-[11px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
            กรอบเวลาราชการ
          </span>
        </div>
      </div>

      {/* View Content based on Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <HolidayLeaveManager />
        </div>
      )}

      {activeTab === 'sheet' && (
        <div className="w-full overflow-x-auto p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
          <Doc04AttendanceSheet />
        </div>
      )}

      {activeTab === 'split' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 space-y-4">
            <HolidayLeaveManager />
          </div>
          <div className="xl:col-span-6 overflow-x-auto p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
            <Doc04AttendanceSheet />
          </div>
        </div>
      )}
    </div>
  );
}
