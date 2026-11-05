'use client';

/**
 * src/app/admin/settings/page.tsx
 * ==============================================================================
 * Global System Settings Configuration (Admin Panel)
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Check, 
  AlertCircle, 
  Calculator, 
  Clock, 
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [statutoryDivisor, setStatutoryDivisor] = useState(30);
  const [targetTasks, setTargetTasks] = useState(110);
  const [workingHours, setWorkingHours] = useState({
    time_in_min: '07:30',
    time_in_max: '08:30',
    time_out_min: '16:30',
    time_out_max: '19:00',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/system-settings');
        if (res.ok) {
          const data = await res.json();
          const settings = data.settings || [];
          for (const s of settings) {
            if (s.setting_key === 'statutory_divisor') {
              setStatutoryDivisor(Number(s.setting_value) || 30);
            }
            if (s.setting_key === 'target_tasks_per_period') {
              setTargetTasks(Number(s.setting_value) || 110);
            }
            if (s.setting_key === 'working_hours' && typeof s.setting_value === 'object') {
              setWorkingHours(s.setting_value);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.all([
        fetch('/api/system-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setting_key: 'statutory_divisor',
            setting_value: statutoryDivisor,
            label: 'ตัวหารอัตราค่าจ้างรายวันตามระเบียบราชการ',
          }),
        }),
        fetch('/api/system-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setting_key: 'target_tasks_per_period',
            setting_value: targetTasks,
            label: 'จำนวนชิ้นงานเป้าหมายต่องวด',
          }),
        }),
        fetch('/api/system-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setting_key: 'working_hours',
            setting_value: workingHours,
            label: 'ช่วงเวลาปฏิบัติงานมาตรฐาน',
          }),
        }),
      ]);
      showToast('success', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setStatutoryDivisor(30);
    setTargetTasks(110);
    setWorkingHours({
      time_in_min: '07:30',
      time_in_max: '08:30',
      time_out_min: '16:30',
      time_out_max: '19:00',
    });
    showToast('success', 'คืนค่าพารามิเตอร์เป็นค่ามาตรฐานแล้ว (กดบันทึกเพื่อยืนยัน)');
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Statutory & Wage Calculation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base md:text-lg text-slate-800">
                พารามิเตอร์การคำนวณค่าตอบแทนตามระเบียบราชการ
              </h3>
              <p className="text-xs md:text-sm text-slate-500">
                สูตรคำนวณอัตราค่าจ้างรายวันและการหักเงินวันลา
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                ตัวหารอัตราค่าจ้างรายวัน (Statutory Divisor)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={statutoryDivisor}
                  onChange={(e) => setStatutoryDivisor(parseInt(e.target.value, 10) || 30)}
                  className="w-32 min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-600">วัน (ค่ามาตรฐานภาครัฐ: 30)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                สูตร: ค่าจ้างรายเดือน ÷ 30 = อัตราค่าจ้างต่อวัน
              </p>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5">
                จำนวนชิ้นงานเป้าหมายต่องวด (Target Tasks)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={targetTasks}
                  onChange={(e) => setTargetTasks(parseInt(e.target.value, 10) || 110)}
                  className="w-32 min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-600">ชิ้นงาน (ค่ามาตรฐาน: 110)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                กระจายในตารางภาระงาน DOC-03 และระบุในใบส่งมอบงาน DOC-02A/B
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Attendance Time Limits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base md:text-lg text-slate-800">
                กรอบเวลาการลงเวลาปฏิบัติงาน (DOC-04)
              </h3>
              <p className="text-xs md:text-sm text-slate-500">
                กำหนดช่วงเวลาสุ่มหรือสร้างเวลามาปฏิบัติงานและเวลากลับ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs md:text-sm font-semibold text-slate-700">
                เวลาเข้าปฏิบัติงาน (Check-In Window)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={workingHours.time_in_min}
                  onChange={(e) => setWorkingHours({ ...workingHours, time_in_min: e.target.value })}
                  className="min-h-[46px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <span className="text-xs text-slate-400">ถึง</span>
                <input
                  type="time"
                  value={workingHours.time_in_max}
                  onChange={(e) => setWorkingHours({ ...workingHours, time_in_max: e.target.value })}
                  className="min-h-[46px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs md:text-sm font-semibold text-slate-700">
                เวลากลับ (Check-Out Window)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={workingHours.time_out_min}
                  onChange={(e) => setWorkingHours({ ...workingHours, time_out_min: e.target.value })}
                  className="min-h-[46px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <span className="text-xs text-slate-400">ถึง</span>
                <input
                  type="time"
                  value={workingHours.time_out_max}
                  onChange={(e) => setWorkingHours({ ...workingHours, time_out_max: e.target.value })}
                  className="min-h-[46px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs md:text-sm rounded-xl transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
