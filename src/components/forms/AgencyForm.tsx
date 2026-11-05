'use client';

/**
 * src/components/forms/AgencyForm.tsx
 * Agency Information & Government Signers Form (หน่วยงานและผู้ลงนาม)
 */

import React, { useState, useEffect } from 'react';
import { Building2, UserCheck, Plus, Trash2, Check } from 'lucide-react';
import type { AgencyProfile, AgencySigners } from '@/types/schema';
import { ComboboxSelect } from '@/components/ui/ComboboxSelect';
import { useSystemOptions } from '@/lib/systemOptions/useSystemOptions';

export interface AgencyFormProps {
  initialData: AgencyProfile;
  contractorFullName?: string;
  onSave: (updated: AgencyProfile) => Promise<void> | void;
  isLoading?: boolean;
}

export function AgencyForm({ initialData, contractorFullName, onSave, isLoading = false }: AgencyFormProps) {
  const { comboboxOptions: agencyOptions } = useSystemOptions('agency');
  const { comboboxOptions: payerAgencyOptions } = useSystemOptions('payer_agency');

  const [formData, setFormData] = useState<AgencyProfile>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [newCommitteeMember, setNewCommitteeMember] = useState('');

  // Keep form data synchronized
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Synchronize contractor_name with contractor full_name (Requirement F07-T2-05)
  useEffect(() => {
    if (contractorFullName && formData.signers.contractor_name !== contractorFullName) {
      setFormData((prev) => ({
        ...prev,
        signers: {
          ...prev.signers,
          contractor_name: contractorFullName,
        },
      }));
      setIsDirty(true);
    }
  }, [contractorFullName, formData.signers.contractor_name]);

  const handleAgencyChange = (field: keyof AgencyProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSignerChange = (field: keyof AgencySigners, value: string) => {
    setFormData((prev) => ({
      ...prev,
      signers: {
        ...prev.signers,
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  const handleAddCommitteeMember = () => {
    if (!newCommitteeMember.trim()) return;
    setFormData((prev) => ({
      ...prev,
      signers: {
        ...prev.signers,
        committee_members: [...(prev.signers.committee_members || []), newCommitteeMember.trim()],
      },
    }));
    setNewCommitteeMember('');
    setIsDirty(true);
  };

  const handleRemoveCommitteeMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      signers: {
        ...prev.signers,
        committee_members: (prev.signers.committee_members || []).filter((_, i) => i !== index),
      },
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Default fallback for payer officer line if left empty (F07-T2-01)
    const normalizedData: AgencyProfile = {
      ...formData,
      signers: {
        ...formData.signers,
        payer_officer_name: formData.signers.payer_officer_name?.trim() || '..................................................',
      },
    };
    await onSave(normalizedData);
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
          <span className="text-sm font-medium">บันทึกข้อมูลส่วนราชการและผู้ลงนามเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Card 1: ข้อมูลส่วนราชการผู้ว่าจ้างและเบิกจ่าย */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">ข้อมูลส่วนราชการผู้ว่าจ้าง</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ComboboxSelect
              id="agency-name-select"
              label="ชื่อส่วนราชการที่ปฏิบัติงาน"
              required
              options={agencyOptions.length > 0 ? agencyOptions : [
                { label: 'วิทยาลัยนักบริหารสาธารณสุข', value: 'วิทยาลัยนักบริหารสาธารณสุข' },
                { label: 'สำนักงานปลัดกระทรวงสาธารณสุข', value: 'สำนักงานปลัดกระทรวงสาธารณสุข' },
                { label: 'สำนักงานสาธารณสุขจังหวัดเพชรบุรี', value: 'สำนักงานสาธารณสุขจังหวัดเพชรบุรี' },
              ]}
              value={formData.agency_name}
              onChange={(val) => handleAgencyChange('agency_name', val)}
              placeholder="เลือกส่วนราชการหรือพิมพ์เอง"
              allowCustom={true}
            />
            <p className="text-xs md:text-sm text-slate-500 mt-1">ปรากฏที่หัวกระดาษของรายงานภาระงานและบันทึกเวลา</p>
          </div>

          <div>
            <ComboboxSelect
              id="payer-agency-select"
              label="ส่วนราชการผู้จ่ายเงิน"
              required
              options={payerAgencyOptions.length > 0 ? payerAgencyOptions : [
                { label: 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข', value: 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข' },
                { label: 'กลุ่มงานการเงินและบัญชี สำนักงานสาธารณสุขจังหวัดเพชรบุรี', value: 'กลุ่มงานการเงินและบัญชี สำนักงานสาธารณสุขจังหวัดเพชรบุรี' },
              ]}
              value={formData.payer_agency}
              onChange={(val) => handleAgencyChange('payer_agency', val)}
              placeholder="เลือกหน่วยงานผู้จ่ายเงินหรือพิมพ์เอง"
              allowCustom={true}
            />
            <p className="text-xs md:text-sm text-slate-500 mt-1">ปรากฏในแบบใบสำคัญรับเงิน</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">กรม / สำนัก</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => handleAgencyChange('department', e.target.value)}
              placeholder="สำนักงานปลัดกระทรวงสาธารณสุข"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">กระทรวง</label>
            <input
              type="text"
              value={formData.ministry || ''}
              onChange={(e) => handleAgencyChange('ministry', e.target.value)}
              placeholder="กระทรวงสาธารณสุข"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              จังหวัด <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.province || ''}
              onChange={(e) => handleAgencyChange('province', e.target.value)}
              placeholder="เพชรบุรี"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Card 2: รายนามผู้ลงนามในเอกสารราชการ 4 ตำแหน่ง */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserCheck className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">รายนามผู้ลงนามในเอกสารราชการ</h3>
        </div>

        {/* 1. ผู้รับจ้าง (Contractor) */}
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
            1. ผู้รับจ้าง / ผู้รับเงิน (ลงนามทุกเอกสาร)
          </label>
          <input
            type="text"
            readOnly
            value={formData.signers.contractor_name}
            className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-not-allowed font-medium"
          />
          <p className="text-xs md:text-sm text-slate-500 mt-1">อัปเดตอัตโนมัติตามชื่อ-นามสกุลในแท็บข้อมูลผู้รับจ้าง</p>
        </div>

        {/* 2. ผู้ควบคุมการปฏิบัติงาน (Supervisor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              2. ผู้ควบคุมการปฏิบัติงาน (ลงนามรายงานภาระงาน matrix 18x31) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.signers.supervisor_name}
              onChange={(e) => handleSignerChange('supervisor_name', e.target.value)}
              placeholder="นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ตำแหน่งผู้ควบคุมการปฏิบัติงาน (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={formData.signers.supervisor_position || ''}
              onChange={(e) => handleSignerChange('supervisor_position', e.target.value)}
              placeholder="นักวิชาการคอมพิวเตอร์ชำนาญการ"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* 3. ประธานกรรมการตรวจรับพัสดุ (Chairman) */}
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
            3. ประธานกรรมการตรวจรับพัสดุ (ส่งถึงในใบส่งมอบงาน และลงนามรับรองเวลา) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.signers.inspection_chairman_name}
            onChange={(e) => handleSignerChange('inspection_chairman_name', e.target.value)}
            placeholder="ประธานกรรมการตรวจรับพัสดุ"
            className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* 4. กรรมการตรวจรับพัสดุ (Dynamic Committee Members) */}
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
            รายชื่อกรรมการตรวจรับพัสดุ (ถ้ามี)
          </label>
          <div className="space-y-2 mb-3">
            {(formData.signers.committee_members || []).map((member, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={member}
                  className="flex-1 min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCommitteeMember(index)}
                  className="min-h-[46px] min-w-[46px] p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-center"
                  aria-label="ลบกรรมการ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCommitteeMember}
              onChange={(e) => setNewCommitteeMember(e.target.value)}
              placeholder="ระบุชื่อกรรมการตรวจรับ เช่น นายกรรมการ หนึ่ง"
              className="flex-1 min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleAddCommitteeMember}
              className="min-h-[46px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm md:text-base font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              เพิ่มกรรมการ
            </button>
          </div>
        </div>

        {/* 5. เจ้าหน้าที่ผู้จ่ายเงิน (Disbursement Payer Officer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              4. เจ้าหน้าที่ผู้จ่ายเงิน (ลงนามในแบบใบสำคัญรับเงิน DOC-01)
            </label>
            <input
              type="text"
              value={formData.signers.payer_officer_name}
              onChange={(e) => handleSignerChange('payer_officer_name', e.target.value)}
              placeholder=".................................................."
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
            <p className="text-xs md:text-sm text-slate-500 mt-1">หากเว้นว่าง ระบบจะใช้เส้นประ 50 จุดตามแบบฟอร์มราชการ</p>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ตำแหน่งเจ้าหน้าที่การเงิน
            </label>
            <input
              type="text"
              value={formData.signers.payer_officer_position || ''}
              onChange={(e) => handleSignerChange('payer_officer_position', e.target.value)}
              placeholder="เจ้าหน้าที่การเงินและบัญชี"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
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
          disabled={isLoading}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-heading font-semibold text-sm md:text-base rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          บันทึกข้อมูลหน่วยงานและผู้ลงนาม
        </button>
      </div>
    </form>
  );
}
