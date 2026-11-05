'use client';

/**
 * src/components/forms/ProfileForm.tsx
 * Contractor Profile Management Form (ข้อมูลผู้รับจ้าง)
 */

import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, CreditCard, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { ContractorProfile } from '@/types/schema';
import { convertAddressArabicToThai } from '@/lib/utils/thaiNumerals';
import { ComboboxSelect } from '@/components/ui/ComboboxSelect';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { useSystemOptions } from '@/lib/systemOptions/useSystemOptions';

export interface ProfileFormProps {
  initialData: ContractorProfile;
  onSave: (updated: ContractorProfile) => Promise<void> | void;
  isLoading?: boolean;
}

export interface ProfileFormErrors {
  first_name?: string;
  last_name?: string;
  citizen_id?: string;
  phone_number?: string;
  email?: string;
  address_full_arabic?: string;
  address_line1?: string;
  address_line2?: string;
}

export function ProfileForm({ initialData, onSave, isLoading = false }: ProfileFormProps) {
  const { comboboxOptions: titleOptions } = useSystemOptions('title');
  const { comboboxOptions: positionOptions } = useSystemOptions('position');
  const { comboboxOptions: bankOptions } = useSystemOptions('bank');

  const [formData, setFormData] = useState<ContractorProfile>(initialData);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Keep form data in sync if initialData changes externally (e.g. store rehydration)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Real-time derivation of full_name: title + first_name + ' ' + last_name
  const handleNameChange = (field: 'title' | 'first_name' | 'last_name', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const title = next.title?.trim() || '';
      const first = next.first_name?.trim() || '';
      const last = next.last_name?.trim() || '';
      // Thai official concatenation: no space after title, single space between first and last name
      next.full_name = first && last ? `${title}${first} ${last}` : `${title}${first}`;
      return next;
    });
    setIsDirty(true);
  };

  const handleChange = (field: keyof ContractorProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Convert Arabic address to Thai digits for line1 and line2
  const handleAutoConvertAddress = () => {
    if (!formData.address_full_arabic) return;
    const { address_line1, address_line2 } = convertAddressArabicToThai(formData.address_full_arabic);
    setFormData((prev) => ({
      ...prev,
      address_line1,
      address_line2: address_line2 || prev.address_line2,
    }));
    setIsDirty(true);
  };

  // Field Validation
  const validate = (): boolean => {
    const errs: ProfileFormErrors = {};

    if (!formData.first_name?.trim()) {
      errs.first_name = 'กรุณาระบุชื่อ';
    }
    if (!formData.last_name?.trim()) {
      errs.last_name = 'กรุณาระบุนามสกุล';
    }

    // Citizen ID: strictly 13 digits
    if (!formData.citizen_id) {
      errs.citizen_id = 'กรุณาระบุเลขประจำตัวประชาชน';
    } else if (!/^[0-9]{13}$/.test(formData.citizen_id)) {
      errs.citizen_id = 'เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น (เช่น 1234567890123)';
    }

    // Phone number: 10 digits starting with 0
    if (formData.phone_number && !/^0[0-9]{9}$/.test(formData.phone_number.replace(/[^0-9]/g, ''))) {
      errs.phone_number = 'หมายเลขโทรศัพท์ต้องเป็นตัวเลข 10 หลักเริ่มต้นด้วย 0 (เช่น 0812345678)';
    }

    // Email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Address requirements
    if (!formData.address_full_arabic?.trim()) {
      errs.address_full_arabic = 'กรุณาระบุที่อยู่เลขอารบิกสำหรับแบบใบสำคัญรับเงิน';
    } else if (!/[0-9]/.test(formData.address_full_arabic)) {
      errs.address_full_arabic = 'ที่อยู่สำหรับใบสำคัญรับเงินต้องมีเลขอารบิก';
    }

    if (!formData.address_line1?.trim()) {
      errs.address_line1 = 'กรุณาระบุที่อยู่บรรทัดที่ 1 (เลขไทย)';
    } else if (!/[๐-๙]/.test(formData.address_line1)) {
      errs.address_line1 = 'ที่อยู่บรรทัดที่ 1 ต้องมีตัวเลขไทย (กดปุ่มแปลงเป็นเลขไทยด้านบนเพื่อแปลงอัตโนมัติ)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
          <span className="text-sm font-medium">บันทึกข้อมูลผู้รับจ้างเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Card 1: ข้อมูลส่วนตัวและตำแหน่ง */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">ข้อมูลส่วนบุคคลและตำแหน่งงาน</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Title */}
          <div className="md:col-span-1">
            <ComboboxSelect
              id="title-select"
              label="คำนำหน้าชื่อ"
              required
              options={titleOptions.length > 0 ? titleOptions : [
                { label: 'นาย', value: 'นาย' },
                { label: 'นาง', value: 'นาง' },
                { label: 'นางสาว', value: 'นางสาว' },
                { label: 'ว่าที่ร้อยตรี', value: 'ว่าที่ร้อยตรี' },
                { label: 'ดร.', value: 'ดร.' },
              ]}
              value={formData.title}
              onChange={(val) => handleNameChange('title', val)}
              placeholder="เลือกคำนำหน้า"
            />
          </div>

          {/* First Name */}
          <div className="md:col-span-1">
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleNameChange('first_name', e.target.value)}
              placeholder="[ชื่อผู้รับจ้าง]"
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.first_name ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {errors.first_name && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.first_name}</p>}
          </div>

          {/* Last Name */}
          <div className="md:col-span-2">
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleNameChange('last_name', e.target.value)}
              placeholder="[นามสกุล]"
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.last_name ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {errors.last_name && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.last_name}</p>}
          </div>
        </div>

        {/* Full Name Display */}
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-600 mb-1.5">
            ชื่อ-นามสกุลเต็มที่ปรากฏในเอกสารราชการ (คำนวณอัตโนมัติ)
          </label>
          <input
            type="text"
            readOnly
            value={formData.full_name}
            className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-100/70 border border-slate-200 text-slate-700 font-medium rounded-lg cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Citizen ID */}
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              เลขประจำตัวประชาชน 13 หลัก <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={13}
              value={formData.citizen_id || ''}
              onChange={(e) => handleChange('citizen_id', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="1234567890123"
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.citizen_id ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {errors.citizen_id ? (
              <p className="text-xs md:text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.citizen_id}
              </p>
            ) : (
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-mono">
                {formData.citizen_id?.length === 13
                  ? `${formData.citizen_id.slice(0, 1)}-${formData.citizen_id.slice(1, 5)}-${formData.citizen_id.slice(5, 10)}-${formData.citizen_id.slice(10, 12)}-${formData.citizen_id.slice(12)}`
                  : 'ตัวอย่าง: 1-2345-67890-12-3'}
              </p>
            )}
          </div>

          {/* Position Title */}
          <div>
            <ComboboxSelect
              id="position-select"
              label="ชื่องานตามสัญญาจ้าง"
              required
              options={positionOptions.length > 0 ? positionOptions : [
                { label: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์', value: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์' },
                { label: 'เจ้าหน้าที่ธุรการ', value: 'เจ้าหน้าที่ธุรการ' },
                { label: 'นักวิชาการสาธารณสุข', value: 'นักวิชาการสาธารณสุข' },
              ]}
              value={formData.position_title}
              onChange={(val) => handleChange('position_title', val)}
              placeholder="เลือกตำแหน่งหรือพิมพ์เอง"
              allowCustom={true}
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-4 h-4 text-slate-400" />
              หมายเลขโทรศัพท์ติดต่อ
            </label>
            <input
              type="tel"
              maxLength={10}
              value={formData.phone_number || ''}
              onChange={(e) => handleChange('phone_number', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0812345678"
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.phone_number ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {errors.phone_number && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.phone_number}</p>}
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <Mail className="w-4 h-4 text-slate-400" />
              อีเมล
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="panthamit@example.com"
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {errors.email && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Card 2: ข้อมูลที่อยู่ตามทะเบียนบ้าน/ที่อยู่ติดต่อ */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">ที่อยู่ (Address)</h3>
          </div>
          <button
            type="button"
            onClick={handleAutoConvertAddress}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 min-h-[40px] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            แปลงเป็นที่อยู่เลขไทยอัตโนมัติ
          </button>
        </div>

        {/* Address Full Arabic */}
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
            ที่อยู่เลขอารบิกเต็มรูปแบบ (สำหรับแบบใบสำคัญรับเงิน DOC-01) <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={formData.address_full_arabic}
            onChange={(e) => handleChange('address_full_arabic', e.target.value)}
            placeholder="123/45 หมู่ที่ 1 ตำบล[ตัวอย่าง] อำเภอ[ตัวอย่าง] จังหวัด[ตัวอย่าง]"
            className={`w-full p-3 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.address_full_arabic ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'
            }`}
          />
          {errors.address_full_arabic && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.address_full_arabic}</p>}
        </div>

        {/* Address Lines 1 & 2 in Thai Numerals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ที่อยู่บรรทัดที่ 1 เลขไทย (บ้านเลขที่ หมู่ ตำบล) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              placeholder="๑๒๓/๔๕ หมู่ที่ ๑ ตำบล[ตัวอย่าง]"
              className={`w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.address_line1 ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'
              }`}
            />
            {errors.address_line1 && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.address_line1}</p>}
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
              ที่อยู่บรรทัดที่ 2 เลขไทย (อำเภอ จังหวัด) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => handleChange('address_line2', e.target.value)}
              placeholder="อำเภอ[ตัวอย่าง] จังหวัด[ตัวอย่าง]"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Card 3: ข้อมูลบัญชีธนาคารสำหรับรับเงินโอน */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <CreditCard className="w-5 h-5 text-sky-600" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-slate-800">ข้อมูลบัญชีเงินฝากธนาคารสำหรับเบิกจ่าย</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <ComboboxSelect
              id="bank-select"
              label="ชื่อธนาคาร"
              options={bankOptions.length > 0 ? bankOptions : [
                { label: 'ธนาคารกรุงไทย', value: 'ธนาคารกรุงไทย' },
                { label: 'ธนาคารกสิกรไทย', value: 'ธนาคารกสิกรไทย' },
                { label: 'ธนาคารไทยพาณิชย์', value: 'ธนาคารไทยพาณิชย์' },
                { label: 'ธนาคารออมสิน', value: 'ธนาคารออมสิน' },
              ]}
              value={formData.bank_name || 'ธนาคารกรุงไทย'}
              onChange={(val) => handleChange('bank_name', val)}
              placeholder="เลือกธนาคาร"
              allowCustom={true}
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">เลขที่บัญชี</label>
            <input
              type="text"
              value={formData.bank_account_no || ''}
              onChange={(e) => handleChange('bank_account_no', e.target.value)}
              placeholder="123-4-56789-0"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-base font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">สาขาธนาคาร</label>
            <input
              type="text"
              value={formData.bank_branch || ''}
              onChange={(e) => handleChange('bank_branch', e.target.value)}
              placeholder="สาขาเพชรบุรี"
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
          บันทึกข้อมูลผู้รับจ้าง
        </button>
      </div>
    </form>
  );
}
