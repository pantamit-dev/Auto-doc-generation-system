'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Printer,
  CheckCircle2,
  Sliders,
  Eye,
  Columns,
  HelpCircle,
} from 'lucide-react';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { Doc03WorkloadMatrix } from '@/components/templates/Doc03WorkloadMatrix';
import { WorkloadForm } from '@/components/forms/WorkloadForm';

export default function WorkloadPage() {
  const currentPeriod = useSalaryStore((s) => s.currentPeriod);
  const contract = useSalaryStore((s) => s.contract);
  const workloadResult = useSalaryStore((s) => s.workloadResult);
  const workloadSettings = useSalaryStore((s) => s.workloadSettings);
  const generateWorkloadWithConditions = useSalaryStore((s) => s.generateWorkloadWithConditions);
  const isHydrated = useSalaryStore((s) => s.isHydrated);
  const initStore = useSalaryStore((s) => s.initStore);

  const [activeView, setActiveView] = useState<'form' | 'matrix' | 'split'>('form');
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      initStore();
    }
  }, [isHydrated, initStore]);

  useEffect(() => {
    if (isHydrated && !workloadResult) {
      generateWorkloadWithConditions();
    }
  }, [isHydrated, workloadResult, generateWorkloadWithConditions]);

  const targetTasks = workloadSettings?.target_tasks ?? contract?.target_tasks_per_period ?? 110;
  const grandTotal = workloadResult?.grand_total ?? 0;
  const isBalanced = grandTotal === targetTasks;

  const handleQuickRegenerate = () => {
    const nextSeed = Math.floor(Math.random() * 9000) + 1000;
    generateWorkloadWithConditions({ seed: nextSeed });
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-800">
                ระบบจัดการภาระงานและตารางปฏิบัติงาน (Workload Matrix)
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                ข้อตกลง {targetTasks} ชิ้นงาน
              </span>
            </div>
            <p className="text-slate-500 text-sm md:text-base mt-1">
              ประจำเดือน {currentPeriod.month_name} พ.ศ. {currentPeriod.year_be} (วันทำงานปกติ {currentPeriod.actual_working_days || 20} วัน)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleQuickRegenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-colors shadow-sm min-h-[46px]"
          >
            <RefreshCw className="w-4 h-4" />
            สุ่มกระจายชิ้นงานใหม่
          </button>
          <Link
            href="/preview/doc-3"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-colors shadow-sm min-h-[46px]"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ DOC-03
          </Link>
        </div>
      </div>

      {/* Success alert */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ประมวลผลสุ่มกระจายภาระงาน {targetTasks} รายการ สำเร็จเรียบร้อย (รับประกันอย่างน้อย 1 งานต่อวันทำงาน)</span>
        </div>
      )}

      {/* Invariants & Rules Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-emerald-800">
          <Sparkles className="w-4 h-4" />
          เกณฑ์การคำนวณและข้อกำหนดทางธุรกิจ (Invariants):
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="px-2.5 py-1 rounded bg-slate-100 font-medium">
            {workloadSettings?.task_list?.length || 18} แถวภาระงาน
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 font-medium">
            วันหยุดราชการ/เสาร์-อาทิตย์ = 0 (#D3D3D3)
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 font-medium">
            วันทำงานปกติ ≥ 1 ชิ้นงาน
          </span>
          <span
            className={`px-2.5 py-1 rounded font-bold ${
              isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            ยอดรวมสุทธิ = {grandTotal} / {targetTasks} ชิ้น
          </span>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'form'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
            ฟอร์มกรอกข้อมูล & เงื่อนไขสุ่ม
          </button>
          <button
            type="button"
            onClick={() => setActiveView('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'matrix'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            ตารางปฏิบัติงานสด (Interactive Matrix)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('split')}
            className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'split'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-4 h-4 text-emerald-600" />
            แสดงทั้ง 2 ส่วนคู่กัน (Split View)
          </button>
        </div>

        {activeView !== 'form' && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>คลิกที่เซลล์วันทำงานสีขาวเพื่อเปิด/ปิดชิ้นงาน (0 ↔ 1) ได้ทันที</span>
          </div>
        )}
      </div>

      {/* VIEW CONTENT */}
      {activeView === 'form' && <WorkloadForm />}

      {activeView === 'matrix' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">โหมดแก้ไขตารางสด (Interactive Mode):</span>
              <span>ท่านสามารถคลิกเซลล์วันทำงานเพื่อปรับเปลี่ยนชิ้นงานได้ ผลรวมรายแถวและรายวันจะคำนวณใหม่ทันที</span>
            </div>
            <Link
              href="/preview/doc-3"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              ดูตัวอย่างพิมพ์ DOC-03
            </Link>
          </div>
          <div className="w-full overflow-x-auto p-4 bg-slate-100 rounded-xl border border-slate-200 flex justify-center shadow-inner">
            <Doc03WorkloadMatrix interactive={true} />
          </div>
        </div>
      )}

      {activeView === 'split' && (
        <div className="space-y-6">
          <WorkloadForm />
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-slate-800">
                ตารางสรุปรายงานการปฏิบัติงานสด (Live DOC-03 Preview & Interactive Editing)
              </h3>
              <span className="text-xs text-slate-500">คลิกเซลล์เพื่อเปิด/ปิดชิ้นงานได้ทันที</span>
            </div>
            <div className="w-full overflow-x-auto p-4 bg-slate-100 rounded-xl border border-slate-200 flex justify-center shadow-inner">
              <Doc03WorkloadMatrix interactive={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
