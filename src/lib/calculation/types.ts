/**
 * src/lib/calculation/types.ts
 * ==============================================================================
 * Calculation Engine Types & Contracts for Thai Government Salary & Workload System
 * Authoritative sources:
 * - salary_calculation_engine.py
 * - calculation_algorithms_and_formulas.md
 * - vba_functions.bas
 * ==============================================================================
 */

/**
 * Calendar day classification
 */
export type CalendarDayStatus = 'working' | 'weekend' | 'holiday' | 'absent';

/**
 * Individual Calendar Day representation for the target period
 */
export interface CalendarDay {
  day: number; // วันที่ในเดือน 1-31
  date_iso: string; // วันที่ ISO 8601 (YYYY-MM-DD) เช่น "2026-10-01"
  weekday_name?: string; // ชื่อวันภาษาไทย เช่น "วันพฤหัสบดี"
  weekday_short?: string; // ชื่อวันย่อ เช่น "พฤ."
  day_of_week?: number; // 0=Sunday, 1=Monday ... 6=Saturday
  is_weekend: boolean; // วันเสาร์หรืออาทิตย์
  is_holiday: boolean; // วันหยุดนักขัตฤกษ์
  is_absent: boolean; // วันลา/ไม่มาปฏิบัติงาน
  is_working_day: boolean; // วันทำงานปกติ (ไม่ใช่วันหยุด เสาร์-อาทิตย์ หรือวันลา)
  cell_color: string; // '#FFFFFF' (วันทำงาน) หรือ '#D3D3D3' (วันหยุด)
  remark: string; // หมายเหตุ เช่น "วันหยุดเสาร์-อาทิตย์", "วันหยุดนักขัตฤกษ์", "ไม่มาปฏิบัติงาน", หรือ ""
  status?: CalendarDayStatus;
}

/**
 * Daily Attendance Record
 * Check-in window: 07:30:00 - 08:30:00
 * Check-out window: 16:30:00 - 19:00:00
 * Non-working days have empty string "" for times.
 */
export interface AttendanceRecord {
  day: number; // วันที่ 1-31
  date_iso?: string; // วันที่ ISO 8601
  is_working_day: boolean; // เป็นวันทำงานปกติหรือไม่
  time_in: string; // เวลาเข้างาน 'HH:MM:SS' เช่น "08:08:12" หรือ "" ในวันหยุด
  time_in_short: string; // เวลาเข้างานแบบย่อ 'HH:MM' เช่น "08:08" หรือ ""
  time_out: string; // เวลาออกงาน 'HH:MM:SS' เช่น "18:28:45" หรือ "" ในวันหยุด
  time_out_short: string; // เวลาออกงานแบบย่อ 'HH:MM' เช่น "18:28" หรือ ""
  remark: string; // หมายเหตุ เช่น "" หรือ "ไม่มาปฏิบัติงาน"
  cell_color?: string; // '#FFFFFF' หรือ '#D3D3D3'
}

/**
 * 18x31 Workload Matrix Result
 * Constraints:
 * - Exactly 18 task categories (rows)
 * - Days in target month (cols, 28 to 31)
 * - Non-working days strictly receive 0 tasks
 * - Active working days guaranteed >= 1 task
 * - Grand total across the matrix strictly equals 110
 */
export interface WorkloadMatrixResult {
  matrix: number[][]; // 18 แถว x D คอลัมน์ (ค่าในเซลล์เป็น 0 หรือ 1)
  task_totals: number[]; // ความยาว 18 (ผลรวมของแต่ละภารกิจ, ผลบวกรวม = 110)
  daily_sums: number[]; // ความยาว D (ผลรวมของแต่ละวัน, ผลบวกรวม = 110)
  grand_total: number; // ยอดรวมทั้งสิ้น ต้องเท่ากับ 110 พอดี
  working_days_indices?: number[]; // ดัชนีคอลัมน์ของวันทำงานปกติ
}

/**
 * Financial Salary Calculation Result
 * Government Rules:
 * - Daily rate divisor is strictly 30.0 days (monthly_salary / 30.0) regardless of calendar days.
 * - Absence deduction = absent_days_count * daily_rate
 * - Net payable = monthly_salary - deduction_amount
 */
export interface SalaryCalculationResult {
  monthly_salary: number; // อัตราค่าจ้างรายเดือน เช่น 19800.00
  total_periods: number; // จำนวนงวดทั้งหมด เช่น 12
  total_contract_amount: number; // วงเงินสัญญาจ้างรวม เช่น 237600.00
  daily_rate: number; // อัตราค่าจ้างต่อวัน (ฐาน 30 วัน) เช่น 660.00
  absent_days_count: number; // จำนวนวันที่ลา เช่น 0 หรือ 1
  deduction_amount: number; // จำนวนเงินที่หัก เช่น 0.00 หรือ 660.00
  net_payable: number; // จำนวนเงินที่ขอเบิกจ่ายสุทธิ เช่น 19800.00 หรือ 19140.00
  has_deduction: boolean; // มีการหักเงินค่าลาหรือไม่ (absent_days_count > 0)
  monthly_salary_bahttext: string; // ตัวอักษรภาษาไทยค่าจ้างรายเดือน เช่น "หนึ่งหมื่นเก้าพันแปดร้อยบาทถ้วน"
  net_payable_bahttext: string; // ตัวอักษรภาษาไทยเงินสุทธิ เช่น "หนึ่งหมื่นเก้าพันหนึ่งร้อยสี่สิบบาทถ้วน"
  total_contract_amount_bahttext: string; // ตัวอักษรภาษาไทยวงเงินสัญญารวม
  monthly_salary_thai: string; // เลขไทยค่าจ้างรายเดือน เช่น "๑๙,๘๐๐"
  net_payable_thai: string; // เลขไทยเงินสุทธิ เช่น "๑๙,๑๔๐"
  total_contract_amount_thai: string; // เลขไทยวงเงินสัญญารวม เช่น "๒๓๗,๖๐๐"
}

/**
 * Calendar Evaluation Summary Result
 */
export interface CalendarEvaluationResult {
  days: CalendarDay[];
  days_in_month: number;
  actual_working_days: number;
  weekend_days_count: number;
  holiday_days_count: number;
  absent_days_count: number;
}

/**
 * Generator Options
 */
export interface WorkloadGeneratorOptions {
  target_tasks?: number; // ค่าเริ่มต้น 110
  task_count?: number; // ค่าเริ่มต้น 18
  seed?: number; // สำหรับ random seed ที่ deterministic
}

export interface AttendanceSimulatorOptions {
  time_in_min?: string; // ค่าเริ่มต้น "07:30:00"
  time_in_max?: string; // ค่าเริ่มต้น "08:30:00"
  time_out_min?: string; // ค่าเริ่มต้น "16:30:00"
  time_out_max?: string; // ค่าเริ่มต้น "19:00:00"
  seed?: number;
}

/**
 * Standard Task Definition
 */
export interface TaskDefinition {
  id: number; // 1-18
  description: string;
}

/**
 * Official List of 18 Standard Task Categories (TaskList)
 */
export const STANDARD_18_TASKS: readonly TaskDefinition[] = [
  { id: 1, description: 'ติดตั้ง ซ่อมบำรุง และดูแลอุปกรณ์คอมพิวเตอร์และอุปกรณ์ ICT ให้พร้อมใช้งาน' },
  { id: 2, description: 'บริหารจัดการโครงสร้างเครือข่ายรวมถึงอุปกรณ์เชื่อมต่อและการเชื่อมต่ออินเทอร์เน็ตของหน่วยงาน' },
  { id: 3, description: 'ป้องกัน ตรวจจับ และตอบสนองต่อการบุกรุก ไวรัส หรือภัยคุกคามเครือข่ายเพื่อรักษาความปลอดภัยของข้อมูล' },
  { id: 4, description: 'จัดทำและเก็บบันทึกรายงานการซ่อมบำรุง ปัญหา และประวัติการแก้ไขเป็นฐานข้อมูลสำหรับอ้างอิง' },
  { id: 5, description: 'ให้คำปรึกษาและแนะนำการใช้คอมพิวเตอร์ โปรแกรม และระบบสารสนเทศแก่บุคลากรและผู้รับบริการ' },
  { id: 6, description: 'ให้บริการช่วยเหลือ (helpdesk) แก่ผู้ใช้งานทั้งภายในและภายนอก รวมทั้งแก้ไขปัญหาเชิงเทคนิค' },
  { id: 7, description: 'จัดทำคู่มือเอกสารการปฏิบัติงาน สื่อการสอน และวัสดุเรียนรู้เกี่ยวกับระบบและอุปกรณ์' },
  { id: 8, description: 'จัดเก็บและวิเคราะห์สถิติการใช้งานเพื่อนำไปสู่การวางแผนบำรุงรักษาเชิงป้องกัน' },
  { id: 9, description: 'เตรียมความพร้อมและสนับสนุนด้านเทคนิคสำหรับการจัดประชุมและการอบรม ทั้งในสถานที่และแบบออนไลน์' },
  { id: 10, description: 'สนับสนุนและดูแลระบบการอบรมออนไลน์ (LMS และบริการฝึกอบรมผ่านอินเทอร์เน็ต)' },
  { id: 11, description: 'บริหารและพัฒนาเว็บไซต์ของหน่วยงาน (CMS, LMS, RMS) รวมถึงการอัพเดทเนื้อหาและระบบ' },
  { id: 12, description: 'ผลิตสื่อประชาสัมพันธ์ เช่น อินโฟกราฟิก และเผยแพร่ข้อมูลของหน่วยงาน' },
  { id: 13, description: 'ถ่ายภาพและตกแต่งภาพกิจกรรมของหน่วยงานเพื่อใช้สื่อและเก็บบันทึก' },
  { id: 14, description: 'คัดเลือก แนะนำ และจัดหาอุปกรณ์หรือเครื่องมือที่ช่วยเพิ่มประสิทธิภาพการทำงานของบุคลากร' },
  { id: 15, description: 'พัฒนาเว็บแอปพลิเคชันภายในองค์กรด้วย Google Apps Script (GAS)' },
  { id: 16, description: 'ดูแลและบริหารจัดการระบบ Google Workspace (บัญชี อีเมล และสิทธิ์การเข้าถึง)' },
  { id: 17, description: 'จัดทำนโยบายและแนวทางการสำรองข้อมูลและกู้คืนระบบเพื่อป้องกันการสูญหายของข้อมูล' },
  { id: 18, description: 'ตรวจสอบและปรับปรุงประสิทธิภาพระบบและเครือข่ายให้รองรับการใช้งานอย่างเสถียร' },
] as const;
