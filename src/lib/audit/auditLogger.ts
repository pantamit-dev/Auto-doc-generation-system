/**
 * src/lib/audit/auditLogger.ts
 * ==============================================================================
 * Audit Logger Helper: Computes field-level diffs and standardizes action logging
 * ==============================================================================
 */

import type { AuditLogAction } from '@/types/schema';

/**
 * Computes a key-value diff between before and after states.
 * Only includes keys whose values actually changed.
 */
export function computeFieldDiff<T extends Record<string, any>>(
  before: T,
  after: T
): { before: Record<string, any>; after: Record<string, any> } {
  const diffBefore: Record<string, any> = {};
  const diffAfter: Record<string, any> = {};

  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of keys) {
    const valBefore = before?.[key];
    const valAfter = after?.[key];

    // Deep JSON comparison for nested arrays/objects
    const strBefore = JSON.stringify(valBefore);
    const strAfter = JSON.stringify(valAfter);

    if (strBefore !== strAfter) {
      diffBefore[key] = valBefore;
      diffAfter[key] = valAfter;
    }
  }

  return { before: diffBefore, after: diffAfter };
}

/**
 * Standard trigger factory functions for application actions
 */
export const AuditTriggers = {
  profileUpdate: (
    oldProfile: any,
    newProfile: any,
    actorName: string
  ): AuditLogAction => ({
    action: 'PROFILE_UPDATE',
    actor: actorName,
    entity_type: 'contractor_profile',
    entity_id: newProfile.id,
    summary: `ปรับปรุงข้อมูลส่วนตัวผู้รับจ้าง (${newProfile.full_name})`,
    diff: computeFieldDiff(oldProfile, newProfile),
  }),

  agencyUpdate: (
    oldAgency: any,
    newAgency: any,
    actorName: string
  ): AuditLogAction => ({
    action: 'AGENCY_UPDATE',
    actor: actorName,
    entity_type: 'agency_profile',
    entity_id: newAgency.id,
    summary: `ปรับปรุงข้อมูลหน่วยงานและผู้ลงนาม (${newAgency.agency_name})`,
    diff: computeFieldDiff(oldAgency, newAgency),
  }),

  contractUpdate: (
    oldContract: any,
    newContract: any,
    actorName: string
  ): AuditLogAction => ({
    action: 'CONTRACT_UPDATE',
    actor: actorName,
    entity_type: 'contract',
    entity_id: newContract.id,
    summary: `ปรับปรุงสัญญาจ้างเลขที่ ${newContract.contract_number} (ค่าจ้าง: ${newContract.monthly_salary} บาท)`,
    diff: computeFieldDiff(oldContract, newContract),
  }),

  workloadGenerated: (
    periodId: string,
    periodNumber: number,
    seed: number,
    targetTasks: number,
    matrixDiff?: any
  ): AuditLogAction => ({
    action: 'WORKLOAD_GENERATED',
    actor: 'ระบบอัตโนมัติ',
    entity_type: 'workload',
    entity_id: periodId,
    summary: `สร้างเมทริกซ์ภาระงาน 110 ชิ้นงาน ประจำงวดที่ ${periodNumber}`,
    diff: matrixDiff,
    metadata: {
      seed,
      target_tasks: targetTasks,
      generated_at: new Date().toISOString(),
    },
  }),

  attendanceGenerated: (
    periodId: string,
    periodNumber: number,
    seed: number,
    attendanceDiff?: any
  ): AuditLogAction => ({
    action: 'ATTENDANCE_GENERATED',
    actor: 'ระบบอัตโนมัติ',
    entity_type: 'attendance',
    entity_id: periodId,
    summary: `จำลองเวลาลงเวลาปฏิบัติงาน ประจำงวดที่ ${periodNumber} (07:30–08:30 / 16:30–19:00)`,
    diff: attendanceDiff,
    metadata: {
      seed,
      time_in_range: '07:30:00 - 08:30:00',
      time_out_range: '16:30:00 - 19:00:00',
      generated_at: new Date().toISOString(),
    },
  }),

  dataReset: (actorName: string = 'ระบบอัตโนมัติ'): AuditLogAction => ({
    action: 'DATA_RESET',
    actor: actorName,
    entity_type: 'system',
    entity_id: 'defaults',
    summary: 'รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นตามมาตรฐาน data_form_input.json',
  }),

  dataImported: (
    actorName: string = 'ผู้ใช้งาน',
    entitiesImported: string[]
  ): AuditLogAction => ({
    action: 'DATA_IMPORTED',
    actor: actorName,
    entity_type: 'system',
    entity_id: 'import_json',
    summary: `นำเข้าข้อมูลระบบสำเร็จ (${entitiesImported.join(', ')})`,
  }),
};
