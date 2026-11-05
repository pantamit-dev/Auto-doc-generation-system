/**
 * src/types/schema.ts
 * ==============================================================================
 * Core Domain Schema & Data Models for Thai Government Contractor Salary System
 * Authoritative sources:
 * - data_form_input.json & data_form_input_guide.md
 * - format_export_doc/*.html
 * ==============================================================================
 */

/**
 * 1. Contractor Profile (ผู้รับจ้างเหมาบริการ)
 * Contains personal details, government position, address, and banking info.
 * Note on addresses:
 * - Receipt Voucher (แบบใบสำคัญรับเงิน) strictly requires Arabic numerals (address_full_arabic).
 * - Invoice / Delivery Notes (ใบส่งมอบงาน) strictly require Thai numerals (address_line1, address_line2).
 */
export interface ContractorProfile {
  id?: string;
  user_id?: string;
  line_user_id?: string; // LINE user unique ID
  role?: 'admin' | 'member'; // Access control role
  status?: 'active' | 'suspended'; // Account status
  avatar_url?: string; // Profile picture URL
  display_name?: string; // Public display name
  title: string; // คำนำหน้าชื่อ e.g. "นาย", "นาง", "นางสาว"
  first_name: string; // ชื่อ e.g. "[ชื่อผู้รับจ้าง]"
  last_name: string; // นามสกุล e.g. "[นามสกุล]"
  full_name: string; // ชื่อ-นามสกุลเต็ม e.g. "นาย[ชื่อผู้รับจ้าง] [นามสกุล]"
  citizen_id: string; // เลขประจำตัวประชาชน 13 หลัก e.g. "1234567890123"
  position_title: string; // ชื่องานตามสัญญาจ้าง e.g. "จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์"
  email?: string; // อีเมลติดต่อ
  phone_number?: string; // หมายเลขโทรศัพท์ e.g. "0812345678"
  address_line1: string; // ที่อยู่บรรทัดที่ 1 (เลขไทย) e.g. "๑๖๓/๑๗๔ หมู่ที่ ๓ ตำบลบ้านหาด"
  address_line2: string; // ที่อยู่บรรทัดที่ 2 (เลขไทย) e.g. "อำเภอบ้านลาด จังหวัดเพชรบุรี"
  address_full_arabic: string; // ที่อยู่เต็มรูปแบบเลขอารบิกสำหรับใบสำคัญรับเงิน e.g. "163/174 หมู่ที่ 3 ตำบลบ้านหาด อำเภอบ้านลาด จังหวัดเพชรบุรี"
  bank_name?: string; // ชื่อธนาคาร e.g. "ธนาคารกรุงไทย"
  bank_account_no?: string; // เลขที่บัญชีเงินฝากธนาคาร
  bank_branch?: string; // สาขาธนาคาร
  created_at?: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

export * from './auth';
export * from './systemOptions';

/** Backward compatibility alias */
export type MemberProfile = ContractorProfile;

/**
 * 2. Agency Signers (รายนามผู้ลงนามในเอกสารราชการ)
 * Government documents require 4 distinct roles:
 * - contractor_name: ผู้รับเงิน / ผู้รับจ้าง / ผู้ปฏิบัติงาน (ลงนามทุกเอกสาร)
 * - supervisor_name: ผู้ควบคุมการปฏิบัติงาน (ลงนามรายงานการปฏิบัติงาน matrix)
 * - inspection_chairman_name: ประธานกรรมการตรวจรับพัสดุ (ส่งถึงในใบส่งมอบงาน และลงนามรับรองเวลา)
 * - committee_members: กรรมการตรวจรับพัสดุ (กรรมการ 1-2 คน)
 * - payer_officer_name: ผู้จ่ายเงิน (ลงนามในแบบใบสำคัญรับเงิน, ค่าเริ่มต้น '..................................................')
 */
export interface AgencySigners {
  contractor_name: string; // ผู้รับจ้าง / ผู้รับเงิน / ผู้ปฏิบัติงาน
  supervisor_name: string; // ผู้ควบคุมการปฏิบัติงาน
  supervisor_position?: string; // ตำแหน่งผู้ควบคุมการปฏิบัติงาน e.g. "นักวิชาการคอมพิวเตอร์ชำนาญการ"
  inspection_chairman_name: string; // ประธานกรรมการตรวจรับพัสดุ
  committee_members?: string[]; // รายชื่อกรรมการตรวจรับพัสดุ
  payer_officer_name: string; // เจ้าหน้าที่ผู้จ่ายเงิน
  payer_officer_position?: string; // ตำแหน่งเจ้าหน้าที่การเงินและบัญชี
}

/**
 * 3. Agency Profile (ส่วนราชการผู้ว่าจ้าง)
 */
export interface AgencyProfile {
  id?: string;
  agency_name: string; // ชื่อส่วนราชการที่ปฏิบัติงาน e.g. "วิทยาลัยนักบริหารสาธารณสุข"
  payer_agency: string; // ส่วนราชการผู้จ่ายเงิน e.g. "กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข"
  department?: string; // กรม/สำนัก e.g. "สำนักงานปลัดกระทรวงสาธารณสุข"
  ministry?: string; // กระทรวง e.g. "กระทรวงสาธารณสุข"
  province?: string; // จังหวัด e.g. "เพชรบุรี"
  position_title: string; // ชื่องานตามสัญญาจ้าง e.g. "จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์"
  signers: AgencySigners; // ผู้ลงนามตามตำแหน่งต่างๆ
  committee?: string[]; // รายนามกรรมการตรวจรับพัสดุ
  created_at?: string;
  updated_at?: string;
}

/**
 * 4. Contract Details (รายละเอียดสัญญาจ้างเหมาบริการ)
 */
export interface ContractDetails {
  id?: string;
  contract_number: string; // เลขที่สัญญาจ้างเลขอารบิก e.g. "2/2570"
  contract_number_thai: string; // เลขที่สัญญาจ้างเลขไทย e.g. "๒/๒๕๗๐"
  contract_date: string; // วันที่ลงนามในสัญญา ISO (YYYY-MM-DD) e.g. "2026-10-29"
  contract_date_thai: string; // วันที่ลงนามในสัญญาภาษาไทยเลขไทย e.g. "๒๙ ตุลาคม ๒๕๖๙"
  start_date: string; // วันเริ่มต้นสัญญา ISO e.g. "2026-10-01"
  start_date_thai: string; // วันเริ่มต้นสัญญาภาษาไทยเลขไทย e.g. "๑ ตุลาคม ๒๕๖๙"
  end_date: string; // วันสิ้นสุดสัญญา ISO e.g. "2027-09-30"
  end_date_thai: string; // วันสิ้นสุดสัญญาภาษาไทยเลขไทย e.g. "๓๐ กันยายน ๒๕๗๐"
  duration_months: number; // ระยะเวลาการจ้างรวม (เดือน) e.g. 12
  total_periods: number; // จำนวนงวดการจ่ายเงิน e.g. 12
  monthly_salary: number; // อัตราค่าจ้างต่อเดือน (บาท) e.g. 19800.00
  total_contract_amount: number; // วงเงินตามสัญญาจ้างรวมทั้งสิ้น (บาท) e.g. 237600.00
  daily_rate?: number; // อัตราค่าจ้างต่อวัน (monthly_salary / 30.0) e.g. 660.00
  target_tasks_per_period?: number; // จำนวนชิ้นงานเป้าหมายต่องวด e.g. 110
  task_matrix_range?: string; // ช่วงพื้นที่เซลล์ใน Excel e.g. "C4:AG21"
  created_at?: string;
  updated_at?: string;
}

/**
 * 5. Monthly Period (ข้อมูลประจำงวดและปฏิทินการเบิกจ่าย)
 */
export interface HolidayDetail {
  day: number; // วันที่ในเดือน 1-31
  name: string; // ชื่อวันหยุด เช่น "วันนวมินทรมหาราช", "วันปิยมหาราช"
}

export interface LeaveDetail {
  day: number; // วันที่ในเดือน 1-31
  reason: string; // เหตุผลการลา เช่น "ลาป่วย มีไข้", "ลากิจส่วนตัว"
  type?: 'sick' | 'personal' | 'absent' | 'other'; // ประเภทการลา
}

export interface MonthlyPeriod {
  id?: string;
  contract_id?: string;
  period_number: number; // งวดที่ขอเบิกจ่าย (1-12)
  period_number_thai?: string; // งวดที่เลขไทย e.g. "๑"
  year_ad: number; // ปี ค.ศ. e.g. 2026
  year_be: number; // ปี พ.ศ. (ค.ศ. + 543) e.g. 2569
  year?: number; // Alias for year_ad or year_be
  month: number; // เดือนที่ 1-12 e.g. 10
  month_name: string; // ชื่อเดือนภาษาไทย e.g. "ตุลาคม"
  invoice_date?: string; // วันที่ออกใบส่งมอบงาน/แจ้งหนี้ ISO (YYYY-MM-DD) e.g. "2026-11-02"
  invoice_date_thai?: string; // วันที่ออกใบส่งมอบงานภาษาไทยเลขไทย e.g. "๒ พฤศจิกายน ๒๕๖๙"
  receipt_date?: string; // วันที่ออกใบสำคัญรับเงิน ISO
  receipt_date_thai?: string; // วันที่ออกใบสำคัญรับเงินภาษาไทยเลขไทย
  public_holidays: number[]; // รายการวันที่เป็นวันหยุดนักขัตฤกษ์ในเดือนนั้น e.g. [13, 23]
  absent_days: number[]; // รายการวันที่ไม่มาปฏิบัติงาน/ลา e.g. [1] หรือ []
  holiday_details?: HolidayDetail[]; // รายละเอียดชื่อวันหยุดราชการประจำวัน
  leave_details?: LeaveDetail[]; // รายละเอียดเหตุผลและประเภทการลาประจำวัน
  holidays?: number[]; // Alias for public_holidays
  days_in_month?: number; // จำนวนวันในเดือน (28, 29, 30, 31)
  actual_working_days?: number; // จำนวนวันทำงานปกติ (หักเสาร์-อาทิตย์, วันหยุด, วันลา)
  absent_days_count?: number; // จำนวนวันลา
  daily_rate?: number; // อัตราค่าจ้างต่อวัน (monthly_salary / 30.0) e.g. 660.00
  deduction_amount?: number; // จำนวนเงินหักค่าลา e.g. 0.00 หรือ 660.00
  net_payable?: number; // จำนวนเงินค่าจ้างสุทธิ e.g. 19800.00 หรือ 19140.00
  monthly_salary_bahttext?: string; // คำอ่านค่าจ้างรายเดือน e.g. "หนึ่งหมื่นเก้าพันแปดร้อยบาทถ้วน"
  net_payable_bahttext?: string; // คำอ่านค่าจ้างสุทธิ e.g. "หนึ่งหมื่นเก้าพันหนึ่งร้อยสี่สิบบาทถ้วน"
  total_contract_amount_bahttext?: string; // คำอ่านวงเงินรวมตามสัญญา
  status?: 'draft' | 'calculated' | 'finalized';
  created_at?: string;
  updated_at?: string;
}

/** Backward compatibility alias */
export type PeriodCalendar = MonthlyPeriod;

/**
 * 6. Audit Log Action Types & Entry (ระบบบันทึกประวัติการแก้ไขและประมวลผล)
 */
export type AuditActionType =
  | 'PROFILE_UPDATE'
  | 'AGENCY_UPDATE'
  | 'CONTRACT_UPDATE'
  | 'PERIOD_UPDATE'
  | 'WORKLOAD_GENERATE'
  | 'WORKLOAD_GENERATED'
  | 'ATTENDANCE_GENERATE'
  | 'ATTENDANCE_GENERATED'
  | 'DOCUMENT_PREVIEW'
  | 'DOCUMENT_PRINT'
  | 'DATA_RESET'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'DATA_IMPORTED';

export interface AuditLogEntry {
  id: string; // UUID v4
  timestamp: string; // ISO 8601 string
  action: AuditActionType; // รหัสประเภทการกระทำ
  actor: string; // ชื่อผู้กระทำ เช่น "นาย[ชื่อผู้รับจ้าง] [นามสกุล]" หรือ "ระบบอัตโนมัติ"
  entity_type: string; // ประเภทข้อมูล เช่น 'contractor_profile', 'agency_profile', 'contract', 'period', 'workload', 'attendance'
  entity_id?: string; // รหัสอ้างอิงข้อมูลที่ถูกแก้ไข
  summary: string; // คำอธิบายสรุปเหตุการณ์ภาษาไทย/อังกฤษ
  diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>; // พารามิเตอร์เพิ่มเติม เช่น seed, format, target_tasks
  // Compatibility aliases
  action_type?: AuditActionType;
  actor_name?: string;
  changes_diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  created_at?: string;
}

export interface AuditLogAction {
  action: AuditActionType;
  actor: string;
  entity_type: string;
  entity_id?: string;
  summary: string;
  diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * 7. Supporting Settings & Configuration Types
 */
export interface TaskItem {
  id: number; // 1-18 or dynamic id
  description: string;
  unit_count?: number;
}

export interface WorkloadSettings {
  target_tasks: number; // 110 or customizable target tasks count
  target_range?: string; // "C4:AG21"
  task_list: TaskItem[];
  min_tasks_per_day?: number; // minimum tasks per active working day (default 1)
  max_tasks_per_day?: number; // maximum tasks per day cap (optional)
  distribution_strategy?: 'uniform' | 'weighted' | 'alternating'; // allocation mode
  seed?: number; // PRNG seed
}

export interface AttendanceSettings {
  time_in_min: string; // "07:30:00"
  time_in_max: string; // "08:30:00"
  time_out_min: string; // "16:30:00"
  time_out_max: string; // "19:00:00"
  time_format: 'hh:mm' | 'hh:mm:ss';
}

/**
 * 8. Standard Document Template Identifiers
 */
export type DocumentId =
  | 'DOC-01'   // แบบใบสำคัญรับเงิน (Receipt Voucher - A4 Portrait)
  | 'DOC-02A'  // ใบส่งมอบงาน เต็มจำนวน (Delivery Note Full Amount - A4 Portrait)
  | 'DOC-02B'  // ใบส่งมอบงาน หักวันลา (Delivery Note With Deduction - A4 Portrait)
  | 'DOC-03'   // รายงานการปฏิบัติงาน (Workload Matrix 18x31 - A4 Landscape)
  | 'DOC-04';  // รับรองการมาปฏิบัติงาน (Attendance Sheet - A4 Portrait)

export type DocumentType = DocumentId;

export interface DocumentMetadata {
  id: DocumentId;
  code: string;
  title: string;
  title_th: string;
  orientation: 'portrait' | 'landscape';
  paper_size: 'A4';
  description: string;
}
