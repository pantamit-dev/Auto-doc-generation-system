'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Dices,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings2,
  BookmarkCheck,
  Check,
  Calendar,
  Hash,
  Info,
} from 'lucide-react';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { PRESET_TASK_TEMPLATES } from '@/lib/store/defaultData';
import type { TaskItem } from '@/types/schema';

export function WorkloadForm() {
  const contract = useSalaryStore((s) => s.contract);
  const currentPeriod = useSalaryStore((s) => s.currentPeriod);
  const workloadSettings = useSalaryStore((s) => s.workloadSettings);
  const workloadResult = useSalaryStore((s) => s.workloadResult);
  const calendarDays = useSalaryStore((s) => s.calendarDays);

  const setTargetTasks = useSalaryStore((s) => s.setTargetTasks);
  const setWorkloadSettings = useSalaryStore((s) => s.setWorkloadSettings);
  const addTaskItem = useSalaryStore((s) => s.addTaskItem);
  const updateTaskItem = useSalaryStore((s) => s.updateTaskItem);
  const removeTaskItem = useSalaryStore((s) => s.removeTaskItem);
  const reorderTasks = useSalaryStore((s) => s.reorderTasks);
  const resetTaskListToDefault = useSalaryStore((s) => s.resetTaskListToDefault);
  const loadTaskPreset = useSalaryStore((s) => s.loadTaskPreset);
  const generateWorkloadWithConditions = useSalaryStore((s) => s.generateWorkloadWithConditions);
  const clearWorkloadMatrix = useSalaryStore((s) => s.clearWorkloadMatrix);

  // Local form state
  const [newTaskInput, setNewTaskInput] = useState('');
  const [targetInput, setTargetInput] = useState<number>(
    workloadSettings?.target_tasks ?? contract?.target_tasks_per_period ?? 110
  );
  const [minTasksPerDay, setMinTasksPerDay] = useState<number>(
    workloadSettings?.min_tasks_per_day ?? 1
  );
  const [distributionStrategy, setDistributionStrategy] = useState<'uniform' | 'weighted' | 'alternating'>(
    workloadSettings?.distribution_strategy ?? 'uniform'
  );
  const [seedInput, setSeedInput] = useState<number>(workloadSettings?.seed ?? 42);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(
    null
  );

  const tasksList = workloadSettings?.task_list || [];
  const numWorkingDays = currentPeriod?.actual_working_days || calendarDays.filter((d) => d.is_working_day).length || 20;
  const maxCapacity = tasksList.length * numWorkingDays;
  const grandTotal = workloadResult?.grand_total ?? 0;
  const isBalanced = grandTotal === targetInput;

  const showNotice = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskInput.trim();
    if (!trimmed) return;
    addTaskItem(trimmed);
    setNewTaskInput('');
    showNotice(`เพิ่มภาระงาน "${trimmed.slice(0, 30)}..." เรียบร้อยแล้ว`);
  };

  // Target task change
  const handleTargetChange = (newTarget: number) => {
    const val = Math.max(1, Math.min(newTarget, 9999));
    setTargetInput(val);
    setTargetTasks(val);
    showNotice(`ปรับเปลี่ยนจำนวนชิ้นงานเป้าหมายเป็น ${val} ชิ้น`);
  };

  // Trigger randomized distribution
  const handleGenerate = () => {
    generateWorkloadWithConditions({
      target_tasks: targetInput,
      min_tasks_per_day: minTasksPerDay,
      distribution_strategy: distributionStrategy,
      seed: seedInput,
    });
    showNotice(`สุ่มกระจายภาระงาน ${targetInput} ชิ้น ลงตารางตามเงื่อนไขสำเร็จ`, 'success');
  };

  // Roll new random seed
  const handleRollSeed = () => {
    const nextSeed = Math.floor(Math.random() * 9000) + 1000;
    setSeedInput(nextSeed);
    generateWorkloadWithConditions({
      target_tasks: targetInput,
      min_tasks_per_day: minTasksPerDay,
      distribution_strategy: distributionStrategy,
      seed: nextSeed,
    });
    showNotice(`สุ่มเลข Seed ใหม่ (${nextSeed}) และประมวลผลตารางสำเร็จ`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm font-medium transition-all shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* SECTION 1: Target Workload Units (จำนวนชิ้นงานเป้าหมาย) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Hash className="w-5 h-5 text-emerald-600" />
            <h3 className="font-heading text-lg font-bold">1. กำหนดจำนวนชิ้นงานตามสัญญาจ้าง (Target Tasks)</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            ยอดปัจจุบัน: {targetInput} ชิ้นงาน
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              จำนวนชิ้นงานเป้าหมายต่องวด (ชิ้น)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={maxCapacity || 500}
                value={targetInput}
                onChange={(e) => handleTargetChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-heading text-lg font-bold text-slate-900"
              />
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">ชิ้น</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="md:col-span-7">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              เลือกตามมาตรฐานสัญญา หรือปรับละเอียด
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleTargetChange(110)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  targetInput === 110
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ★ 110 ชิ้น (มาตรฐาน REA)
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange(100)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  targetInput === 100
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                100 ชิ้น
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange(80)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  targetInput === 80
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                80 ชิ้น
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange(120)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  targetInput === 120
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                120 ชิ้น
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange(targetInput - 5)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono"
                title="ลด 5 ชิ้น"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange(targetInput + 5)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono"
                title="เพิ่ม 5 ชิ้น"
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Capacity Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">วันทำการปกติในเดือน:</span>
            <span className="font-heading text-sm font-bold text-slate-800">{numWorkingDays} วัน</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">จำนวนรายการงาน:</span>
            <span className="font-heading text-sm font-bold text-slate-800">{tasksList.length} รายการ</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">เฉลี่ยต่อวันทำงาน:</span>
            <span className="font-heading text-sm font-bold text-slate-800">
              {numWorkingDays > 0 ? (targetInput / numWorkingDays).toFixed(1) : 0} ชิ้น/วัน
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">ความจุสูงสุด (1 ชิ้น/ช่อง):</span>
            <span className="font-heading text-sm font-bold text-slate-800">{maxCapacity} ชิ้น</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Workload Tasks Management (กรอกข้อมูลภาระงาน / งานที่ปฏิบัติได้เอง) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="font-heading text-lg font-bold">2. กรอกและจัดการรายการภาระงาน (Task Categories)</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium mr-1">ชุดสำเร็จรูป:</span>
            {PRESET_TASK_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  loadTaskPreset(idx);
                  showNotice(`โหลดชุด "${preset.name}" สำเร็จ`);
                }}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                title={preset.description}
              >
                {idx === 0 ? '💻 IT/คอมพ์ (18 ข้อ)' : idx === 1 ? '📋 สารบรรณ' : '💰 พัสดุ/การเงิน'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                resetTaskListToDefault();
                showNotice('รีเซ็ตเป็น 18 ข้อมาตรฐานแล้ว');
              }}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1 transition-colors"
              title="รีเซ็ตกลับเป็น 18 ข้อมาตรฐาน"
            >
              <RotateCcw className="w-3 h-3" />
              รีเซ็ต
            </button>
          </div>
        </div>

        {/* Add New Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="พิมพ์ชื่องานที่ปฏิบัติ หรือภาระงานใหม่ที่ต้องการเพิ่ม..."
            className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!newTaskInput.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            เพิ่มงาน
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {tasksList.map((task: TaskItem, index: number) => (
            <div
              key={task.id}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white group transition-all"
            >
              {/* Index Badge */}
              <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </div>

              {/* Editable Description */}
              <input
                type="text"
                value={task.description}
                onChange={(e) => updateTaskItem(task.id, e.target.value)}
                className="flex-1 text-sm bg-transparent px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-emerald-400 focus:bg-slate-50 focus:outline-none transition-colors"
              />

              {/* Actions: Up, Down, Delete */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => reorderTasks(index, index - 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                  title="เลื่อนขึ้น"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === tasksList.length - 1}
                  onClick={() => reorderTasks(index, index + 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                  title="เลื่อนลง"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={tasksList.length <= 1}
                  onClick={() => {
                    removeTaskItem(task.id);
                    showNotice(`ลบภาระงานลำดับที่ ${index + 1} เรียบร้อยแล้ว`, 'info');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors ml-1"
                  title="ลบภาระงานนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Distribution Conditions & Randomizer Settings (เงื่อนไขการสุ่มกระจายชิ้นงาน) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
          <Settings2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-heading text-lg font-bold">3. เงื่อนไขการสุ่มกระจายชิ้นงานลงตาราง (Distribution Rules)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Condition 1: Minimum tasks per working day */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              จำนวนชิ้นงานขั้นต่ำต่อวันทำงาน
            </label>
            <select
              value={minTasksPerDay}
              onChange={(e) => setMinTasksPerDay(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value={1}>การันตีอย่างน้อย 1 ชิ้น/วันทำงาน (มาตรฐานราชการ)</option>
              <option value={2}>การันตีอย่างน้อย 2 ชิ้น/วันทำงาน</option>
              <option value={0}>ไม่จำกัดขั้นต่ำ (สุ่มอิสระตามความเหมาะสม)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              *วันหยุดราชการและวันเสาร์-อาทิตย์ จะเป็น 0 ชิ้นงานเสมอ
            </p>
          </div>

          {/* Condition 2: Strategy */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              วิธีการสุ่มกระจายชิ้นงาน
            </label>
            <select
              value={distributionStrategy}
              onChange={(e) =>
                setDistributionStrategy(e.target.value as 'uniform' | 'weighted' | 'alternating')
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="uniform">สุ่มแบบกระจายสม่ำเสมอ (Uniform Random - แนะนำ)</option>
              <option value="alternating">สุ่มแบบสลับแถวภาระงาน (Alternating Sequence)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              *สร้างการกระจายชิ้นงานที่ดูสมจริงและเป็นธรรมชาติ
            </p>
          </div>

          {/* Condition 3: Seed */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ค่า Seed สุ่มจำลอง (Deterministic Seed)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={seedInput}
                onChange={(e) => setSeedInput(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleRollSeed}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                title="สุ่มเลข Seed ใหม่"
              >
                <Dices className="w-4 h-4" />
                สุ่มใหม่
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              *Seed เดิมจะได้ผลลัพธ์ตารางเดิมที่สามารถตรวจสอบย้อนหลังได้
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-colors shadow-sm min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              สุ่มกระจาย {targetInput} ชิ้นงานลงตารางตามเงื่อนไข
            </button>
            <button
              type="button"
              onClick={() => {
                clearWorkloadMatrix();
                showNotice('ล้างตารางภาระงานทั้งหมดเรียบร้อยแล้ว', 'info');
              }}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs md:text-sm font-semibold transition-colors min-h-[44px]"
            >
              ล้างตารางทั้งหมด
            </button>
          </div>

          {/* Real-time Status Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold ${
                isBalanced
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isBalanced ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
              ยอดรวมตาราง: {grandTotal} / {targetInput} ชิ้น
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
              วันหยุด = 0 ชิ้น (100%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
