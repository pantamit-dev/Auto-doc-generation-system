/**
 * src/lib/store/dataExportImport.ts
 * ==============================================================================
 * Full Application Data Export & Import Utilities
 * Features:
 * - JSON state serialization with metadata
 * - Schema validation preventing corrupt or incomplete imports
 * - SSR-safe browser file download trigger
 * - Browser FileReader integration
 * ==============================================================================
 */

import type {
  ContractorProfile,
  AgencyProfile,
  ContractDetails,
  MonthlyPeriod,
  WorkloadSettings,
  AuditLogEntry,
  IStorageAdapter,
} from './types';

export interface ExportBackupPayload {
  version: string;
  exported_at: string;
  app: string;
  profile: ContractorProfile;
  contractor: ContractorProfile;
  agency: AgencyProfile;
  contract: ContractDetails;
  currentPeriod: MonthlyPeriod | null;
  workloadSettings?: WorkloadSettings;
  auditLogs: AuditLogEntry[];
}

export interface ValidationResult {
  valid: boolean;
  data?: ExportBackupPayload;
  error?: string;
}

/**
 * Validates raw JSON string against the application backup schema
 */
export function validateImportPayload(jsonString: string): ValidationResult {
  if (!jsonString || typeof jsonString !== 'string' || jsonString.trim().length === 0) {
    return { valid: false, error: 'Invalid JSON payload: empty string provided' };
  }

  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch (err: any) {
    return { valid: false, error: 'Invalid JSON payload: malformed JSON string' };
  }

  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON payload: expected root object' };
  }

  const profile = data.profile || data.contractor;
  const agency = data.agency;
  const contract = data.contract;

  if (!profile || !agency || !contract) {
    return { valid: false, error: 'Payload missing required entities: profile, agency, contract' };
  }

  // Validate core fields
  if (!profile.first_name || !profile.last_name) {
    return { valid: false, error: 'Invalid profile entity: missing first_name or last_name' };
  }
  if (!agency.agency_name) {
    return { valid: false, error: 'Invalid agency entity: missing agency_name' };
  }
  if (typeof contract.monthly_salary !== 'number' || contract.monthly_salary < 0) {
    return { valid: false, error: 'Invalid contract entity: monthly_salary must be a positive number' };
  }

  const normalized: ExportBackupPayload = {
    version: data.version || '1.0.0',
    exported_at: data.exported_at || new Date().toISOString(),
    app: data.app || 'salary-doc-web',
    profile: profile,
    contractor: profile,
    agency: agency,
    contract: contract,
    currentPeriod: data.currentPeriod || data.period || null,
    workloadSettings: data.workloadSettings || data.workload_settings || undefined,
    auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs : [],
  };

  return { valid: true, data: normalized };
}

/**
 * Triggers a browser file download of JSON content
 * SSR-safe: does nothing if window/document is undefined
 */
export function downloadJsonFile(filename: string, jsonContent: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Reads a File object into a text string
 */
export function readJsonFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Convenience helper to export and initiate browser download
 */
export async function exportAndDownloadBackup(
  storage: IStorageAdapter,
  customFilename?: string
): Promise<string> {
  const json = typeof storage.exportAllData === 'function'
    ? await storage.exportAllData()
    : typeof storage.exportData === 'function'
    ? await storage.exportData()
    : JSON.stringify(await storage.getProfile());

  const dateTag = new Date().toISOString().split('T')[0];
  const filename = customFilename || `salary_doc_backup_${dateTag}.json`;
  downloadJsonFile(filename, json);
  return json;
}

/**
 * Convenience helper to read file, validate, and import into storage adapter
 */
export async function importFromFile(
  storage: IStorageAdapter,
  file: File
): Promise<{ success: boolean; message: string }> {
  try {
    const content = await readJsonFile(file);
    const validation = validateImportPayload(content);
    if (!validation.valid || !validation.data) {
      return { success: false, message: validation.error || 'Validation failed' };
    }

    if (typeof storage.importAllData === 'function') {
      await storage.importAllData(content);
    } else if (typeof storage.importData === 'function') {
      await storage.importData(content);
    } else {
      await storage.saveProfile(validation.data.profile);
      await storage.saveAgency(validation.data.agency);
      await storage.saveContract(validation.data.contract);
      if (validation.data.currentPeriod) {
        await storage.saveCurrentPeriod(validation.data.currentPeriod);
      }
    }

    await storage.logAction({
      action: 'DATA_IMPORT',
      actor: validation.data.profile.full_name || 'ผู้ดูแลระบบ',
      entity_type: 'system_backup',
      summary: `นำเข้าข้อมูลสำรองสมบูรณ์ (${file.name})`,
      metadata: { file_name: file.name, file_size: file.size },
    });

    return { success: true, message: 'นำเข้าข้อมูลเรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์' };
  }
}
