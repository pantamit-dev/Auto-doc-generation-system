'use client';

/**
 * src/components/forms/ContractForm.tsx
 * Contract Details & Wage Calculation Form (สัญญาจ้างและอัตราค่าตอบแทน)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileSignature, Calendar, DollarSign, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import type { ContractDetails } from '@/types/schema';
import { toThaiDigits, formatThaiDateWithDigits, bahtText } from '@/lib/utils/thaiNumerals';

export interface ContractFormProps {
  initialData: ContractDetails;
  onSave: (updated: ContractDetails) => Promise<void> | void;
  isLoading?: boolean;
}

/**
 * Pure helper function to validate contract date ordering (start_date <= end_date)
 */
export function checkContractDateOrder(startDate?: string, endDate?: string): string | null {
  if (startDate && endDate && startDate > endDate) {
    return 'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา';
  }
  return null;
}

export function ContractForm({ initialData, onSave, isLoading = false }: ContractFormProps) {
  const [formData, setFormData] = useState<ContractDetails>(initialData);
  // Mount-time validation: evaluate initialData immediately upon component mount
  const [dateError, setDateError] = useState<string | null>(() =>
    checkContractDateOrder(initialData?.start_date, initialData?.end_date)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Synchronize formData and re-validate when initialData changes externally
  useEffect(() => {
    setFormData(initialData);
    setDateError(checkContractDateOrder(initialData?.start_date, initialData?.end_date));
  }, [initialData]);

  // Recalculate duration_months and total contract amount when dates or salary change
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'start_date') {
        next.start_date_thai = formatThaiDateWithDigits(value);
      } else {
        next.end_date_thai = formatThaiDateWithDigits(value);
      }

      // Check dates valid using shared validator
      const orderErr = checkContractDateOrder(next.start_date, next.end_date);
      setDateError(orderErr);

      if (next.start_date && next.end_date) {
        if (!orderErr) {
          const [startY, startM] = next.start_date.split('-').map(Number);
          const [endY, endM] = next.end_date.split('-').map(Number);
          const duration = (endY - startY) * 12 + (endM - startM) + 1;
          next.duration_months = Math.max(0, duration);
          next.total_periods = next.duration_months;
          next.total_contract_amount = next.monthly_salary * next.duration_months;
        } else {
          next.duration_months = 0;
          next.total_periods = 0;
          next.total_contract_amount = 0;
        }
      }

      return next;
    });
    setIsDirty(true);
  };

  const handleContractDateChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      contract_date: val,
      contract_date_thai: formatThaiDateWithDigits(val),
    }));
    setIsDirty(true);
  };

  const handleContractNumberChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      contract_number: val,
      contract_number_thai: toThaiDigits(val),
    }));
    setIsDirty(true);
  };

  const handleSalaryChange = (salaryNum: number) => {
    setFormData((prev) => {
      const dailyRate = Math.round((salaryNum / 30.0) * 100) / 100;
      const totalAmount = salaryNum * (prev.duration_months || 12);
      return {
        ...prev,
        monthly_salary: salaryNum,
        daily_rate: dailyRate,
        total_contract_amount: totalAmount,
      };
    });
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit guard: verify date ordering before proceeding
    const orderErr = checkContractDateOrder(formData.start_date, formData.end_date);
    if (orderErr) {
      setDateError(orderErr);
      return;
    }
    if (dateError) return;
    await onSave(formData);
    setIsDirty(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast Feedback */}
      {showSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">บันทึกข้อมูลสัญญาจ้างและการคำนวณเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Card 1: เลขที่และวันที่ลงนามในสัญญาจ้าง */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileSignature className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">เลขที่สัญญาและวันที่ลงนาม</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contract Number */}
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              เลขที่สัญญาจ้าง (เลขอารบิก) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contract_number}
              onChange={(e) => handleContractNumberChange(e.target.value)}
              placeholder="2/2570"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Contract Number Thai */}
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              เลขที่สัญญาจ้าง (เลขไทย คำนวณอัตโนมัติ)
            </label>
            <input
              type="text"
              value={formData.contract_number_thai}
              onChange={(e) => setFormData((prev) => ({ ...prev, contract_number_thai: e.target.value }))}
              placeholder="๒/๒๕๗๐"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-sarabun"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contract Date ISO */}
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              วันที่ลงนามในสัญญา (ISO YYYY-MM-DD) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.contract_date}
              onChange={(e) => handleContractDateChange(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Contract Date Thai */}
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              วันที่ลงนามในสัญญา (ภาษาไทยเลขไทย)
            </label>
            <input
              type="text"
              readOnly
              value={formData.contract_date_thai}
              placeholder="๒๙ ตุลาคม ๒๕๖๙"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-not-allowed font-sarabun"
            />
          </div>
        </div>
      </div>

      {/* Card 2: ระยะเวลาการจ้างและงวดการจ่ายเงิน */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Calendar className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">ระยะเวลาการจ้างตามสัญญา</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              วันเริ่มต้นสัญญา (Start Date) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                dateError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            <p className="text-xs md:text-sm text-slate-500 mt-1">{formData.start_date_thai || '๑ ตุลาคม ๒๕๖๙'}</p>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              วันสิ้นสุดสัญญา (End Date) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                dateError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {dateError ? (
              <p className="text-xs md:text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {dateError}
              </p>
            ) : (
              <p className="text-xs md:text-sm text-slate-500 mt-1">{formData.end_date_thai || '๓๐ กันยายน ๒๕๗๐'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ระยะเวลาการจ้างรวม (เดือน - คำนวณอัตโนมัติ)
            </label>
            <div className="flex items-center min-h-[46px] px-3.5 py-2.5 bg-slate-100 text-slate-800 font-semibold text-base rounded-lg border border-slate-200">
              {formData.duration_months} เดือน
            </div>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              จำนวนงวดการเบิกจ่ายทั้งหมด (งวด)
            </label>
            <input
              type="number"
              min={1}
              value={formData.total_periods}
              onChange={(e) => setFormData((prev) => ({ ...prev, total_periods: Number(e.target.value) || 12 }))}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Card 3: อัตราค่าจ้าง ค่าจ้างรายวัน และวงเงินตามสัญญา */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <DollarSign className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">อัตราค่าจ้างและวงเงินตามสัญญาจ้าง</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              อัตราค่าจ้างต่อเดือน (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={formData.monthly_salary}
              onChange={(e) => handleSalaryChange(Number(e.target.value) || 0)}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base font-semibold font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              อัตราค่าจ้างต่อวัน (หาร 30.0 วันตามระเบียบ)
            </label>
            <div className="flex items-center min-h-[46px] px-3.5 py-2.5 bg-sky-50 border border-sky-100 text-sky-800 font-bold font-mono text-base rounded-lg">
              {formData.daily_rate?.toFixed(2) || '660.00'} บาท
            </div>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              วงเงินตามสัญญารวมทั้งสิ้น (บาท)
            </label>
            <div className="flex items-center min-h-[46px] px-3.5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-base rounded-lg">
              {formData.total_contract_amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
            </div>
          </div>
        </div>

        {/* Live BahtText display */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs md:text-sm text-slate-600 space-y-1">
          <p>
            <span className="font-medium text-slate-700">คำอ่านค่าจ้างรายเดือน: </span>
            {bahtText(formData.monthly_salary)}
          </p>
          <p>
            <span className="font-medium text-slate-700">คำอ่านวงเงินรวม: </span>
            {bahtText(formData.total_contract_amount)}
          </p>
        </div>

        {/* Workload targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              จำนวนชิ้นงานเป้าหมายต่องวด (ชิ้นงาน)
            </label>
            <input
              type="number"
              min={1}
              value={formData.target_tasks_per_period || 110}
              onChange={(e) => setFormData((prev) => ({ ...prev, target_tasks_per_period: Number(e.target.value) || 110 }))}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs md:text-sm text-slate-500 mt-1">มาตรฐานสัญญาจ้างเหมาบริการ 110 ชิ้นงานต่องวด</p>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ช่วงพื้นที่ตาราง Excel ที่อ้างอิง
            </label>
            <input
              type="text"
              value={formData.task_matrix_range || 'C4:AG21'}
              onChange={(e) => setFormData((prev) => ({ ...prev, task_matrix_range: e.target.value }))}
              placeholder="C4:AG21"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Link to Workload Manager */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs md:text-sm text-emerald-900">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>ต้องการแก้ไขข้อความภาระงาน เพิ่ม/ลบงาน หรือสุ่มกระจายชิ้นงานลงตาราง?</span>
          </div>
          <Link
            href="/workload"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium whitespace-nowrap transition-colors"
          >
            ไปที่เมนูภาระงาน →
          </Link>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs md:text-sm text-slate-500">
          {isDirty ? (
            <span className="text-amber-600 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </span>
          ) : (
            <span className="text-slate-400">ข้อมูลเป็นปัจจุบันแล้ว</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !!dateError}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white font-heading font-semibold text-sm md:text-base rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          บันทึกข้อมูลสัญญาจ้าง
        </button>
      </div>
    </form>
  );
}
