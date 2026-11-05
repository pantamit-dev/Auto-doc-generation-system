/**
 * src/lib/systemOptions/defaultOptions.ts
 * ==============================================================================
 * Static Default Fixtures for Dynamic System Options & Settings
 * Used as default state and fallback when database is uninitialized
 * ==============================================================================
 */

import type { SystemOption, SystemSetting } from '@/types/systemOptions';

export const DEFAULT_SYSTEM_OPTIONS: SystemOption[] = [
  // Titles (คำนำหน้าชื่อ)
  { id: 'opt-title-1', category: 'title', label: 'นาย', value: 'นาย', sort_order: 1, is_active: true, is_default: true },
  { id: 'opt-title-2', category: 'title', label: 'นาง', value: 'นาง', sort_order: 2, is_active: true, is_default: false },
  { id: 'opt-title-3', category: 'title', label: 'นางสาว', value: 'นางสาว', sort_order: 3, is_active: true, is_default: false },
  { id: 'opt-title-4', category: 'title', label: 'ว่าที่ร้อยตรี', value: 'ว่าที่ร้อยตรี', sort_order: 4, is_active: true, is_default: false },
  { id: 'opt-title-5', category: 'title', label: 'ดร.', value: 'ดร.', sort_order: 5, is_active: true, is_default: false },

  // Positions (ตำแหน่งงาน)
  { id: 'opt-pos-1', category: 'position', label: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์', value: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์', sort_order: 1, is_active: true, is_default: true },
  { id: 'opt-pos-2', category: 'position', label: 'เจ้าหน้าที่ธุรการ', value: 'เจ้าหน้าที่ธุรการ', sort_order: 2, is_active: true, is_default: false },
  { id: 'opt-pos-3', category: 'position', label: 'นักวิชาการสาธารณสุข', value: 'นักวิชาการสาธารณสุข', sort_order: 3, is_active: true, is_default: false },
  { id: 'opt-pos-4', category: 'position', label: 'เจ้าพนักงานการเงินและบัญชี', value: 'เจ้าพนักงานการเงินและบัญชี', sort_order: 4, is_active: true, is_default: false },
  { id: 'opt-pos-5', category: 'position', label: 'เจ้าพนักงานพัสดุ', value: 'เจ้าพนักงานพัสดุ', sort_order: 5, is_active: true, is_default: false },

  // Agencies (ส่วนราชการที่ปฏิบัติงาน)
  { id: 'opt-agency-1', category: 'agency', label: 'วิทยาลัยนักบริหารสาธารณสุข', value: 'วิทยาลัยนักบริหารสาธารณสุข', sort_order: 1, is_active: true, is_default: true },
  { id: 'opt-agency-2', category: 'agency', label: 'สำนักงานปลัดกระทรวงสาธารณสุข', value: 'สำนักงานปลัดกระทรวงสาธารณสุข', sort_order: 2, is_active: true, is_default: false },
  { id: 'opt-agency-3', category: 'agency', label: 'กรมการแพทย์', value: 'กรมการแพทย์', sort_order: 3, is_active: true, is_default: false },
  { id: 'opt-agency-4', category: 'agency', label: 'กรมควบคุมโรค', value: 'กรมควบคุมโรค', sort_order: 4, is_active: true, is_default: false },
  { id: 'opt-agency-5', category: 'agency', label: 'สำนักงานสาธารณสุขจังหวัดเพชรบุรี', value: 'สำนักงานสาธารณสุขจังหวัดเพชรบุรี', sort_order: 5, is_active: true, is_default: false },

  // Payer Agencies (ส่วนราชการผู้จ่ายเงิน)
  { id: 'opt-payer-1', category: 'payer_agency', label: 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข', value: 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข', sort_order: 1, is_active: true, is_default: true },
  { id: 'opt-payer-2', category: 'payer_agency', label: 'กลุ่มงานการเงินและบัญชี สำนักงานสาธารณสุขจังหวัดเพชรบุรี', value: 'กลุ่มงานการเงินและบัญชี สำนักงานสาธารณสุขจังหวัดเพชรบุรี', sort_order: 2, is_active: true, is_default: false },
  { id: 'opt-payer-3', category: 'payer_agency', label: 'ฝ่ายการเงิน วิทยาลัยนักบริหารสาธารณสุข', value: 'ฝ่ายการเงิน วิทยาลัยนักบริหารสาธารณสุข', sort_order: 3, is_active: true, is_default: false },

  // Banks (ธนาคาร)
  { id: 'opt-bank-1', category: 'bank', label: 'ธนาคารกรุงไทย', value: 'ธนาคารกรุงไทย', sort_order: 1, is_active: true, is_default: true },
  { id: 'opt-bank-2', category: 'bank', label: 'ธนาคารกสิกรไทย', value: 'ธนาคารกสิกรไทย', sort_order: 2, is_active: true, is_default: false },
  { id: 'opt-bank-3', category: 'bank', label: 'ธนาคารไทยพาณิชย์', value: 'ธนาคารไทยพาณิชย์', sort_order: 3, is_active: true, is_default: false },
  { id: 'opt-bank-4', category: 'bank', label: 'ธนาคารกรุงเทพ', value: 'ธนาคารกรุงเทพ', sort_order: 4, is_active: true, is_default: false },
  { id: 'opt-bank-5', category: 'bank', label: 'ธนาคารออมสิน', value: 'ธนาคารออมสิน', sort_order: 5, is_active: true, is_default: false },
  { id: 'opt-bank-6', category: 'bank', label: 'ธนาคารกรุงศรีอยุธยา', value: 'ธนาคารกรุงศรีอยุธยา', sort_order: 6, is_active: true, is_default: false },
  { id: 'opt-bank-7', category: 'bank', label: 'ธนาคารทหารไทยธนชาต (ttb)', value: 'ธนาคารทหารไทยธนชาต (ttb)', sort_order: 7, is_active: true, is_default: false },

  // Leave Types (ประเภทการลา)
  { id: 'opt-leave-1', category: 'leave_type', label: 'ลาป่วย', value: 'sick', sort_order: 1, is_active: true, is_default: true },
  { id: 'opt-leave-2', category: 'leave_type', label: 'ลากิจส่วนตัว', value: 'personal', sort_order: 2, is_active: true, is_default: false },
  { id: 'opt-leave-3', category: 'leave_type', label: 'ขาดงาน / ไม่มาปฏิบัติงาน', value: 'absent', sort_order: 3, is_active: true, is_default: false },
];

export const DEFAULT_SYSTEM_SETTINGS: Record<string, SystemSetting> = {
  statutory_divisor: {
    id: 'set-1',
    setting_key: 'statutory_divisor',
    setting_value: 30,
    category: 'calculation',
    label: 'ตัวหารอัตราค่าจ้างรายวันตามระเบียบราชการ',
    description: 'ระเบียบราชการกำหนดให้ใช้ 30 วันเป็นตัวหารคำนวณอัตราค่าจ้างต่อวันเสมอ',
  },
  target_tasks_per_period: {
    id: 'set-2',
    setting_key: 'target_tasks_per_period',
    setting_value: 110,
    category: 'workload',
    label: 'จำนวนชิ้นงานเป้าหมายต่องวด',
    description: 'จำนวนชิ้นงานมาตรฐานที่ต้องปฏิบัติงานในแต่ละงวด (ค่ามาตรฐาน 110 ชิ้นงาน)',
  },
  working_hours: {
    id: 'set-3',
    setting_key: 'working_hours',
    setting_value: {
      time_in_min: '07:30',
      time_in_max: '08:30',
      time_out_min: '16:30',
      time_out_max: '19:00',
    },
    category: 'attendance',
    label: 'ช่วงเวลาปฏิบัติงานมาตรฐาน',
    description: 'กรอบเวลาลงชื่อเข้าปฏิบัติงาน (07:30-08:30) และลงชื่อกลับ (16:30-19:00)',
  },
};
