/**
 * src/lib/store/types.ts
 * ==============================================================================
 * State Management & Storage Adapter Interfaces for salary-doc-web
 * ==============================================================================
 */

import type {
  ContractorProfile,
  AgencyProfile,
  ContractDetails,
  MonthlyPeriod,
  AuditLogEntry,
  AuditLogAction,
  DocumentType,
  DocumentId,
  WorkloadSettings,
  TaskItem,
  HolidayDetail,
  LeaveDetail,
} from '@/types/schema';

import type {
  CalendarDay,
  AttendanceRecord,
  WorkloadMatrixResult,
  SalaryCalculationResult,
} from '@/lib/calculation/types';

export type {
  ContractorProfile,
  AgencyProfile,
  ContractDetails,
  MonthlyPeriod,
  AuditLogEntry,
  AuditLogAction,
  DocumentType,
  DocumentId,
  WorkloadSettings,
  TaskItem,
  HolidayDetail,
  LeaveDetail,
};

/**
 * 1. Unified Storage Adapter Contract (Dual Local/Supabase Interface)
 * Matches PROJECT.md Section 2 and accommodates local mock & PostgreSQL backends.
 */
export interface IStorageAdapter {
  getProfile(): Promise<ContractorProfile>;
  saveProfile(profile: Partial<ContractorProfile>): Promise<ContractorProfile>;
  getAgency(): Promise<AgencyProfile>;
  saveAgency(agency: Partial<AgencyProfile>): Promise<AgencyProfile>;
  getContract(): Promise<ContractDetails>;
  saveContract(contract: Partial<ContractDetails>): Promise<ContractDetails>;
  getCurrentPeriod(): Promise<MonthlyPeriod>;
  saveCurrentPeriod(period: MonthlyPeriod): Promise<MonthlyPeriod>;
  getWorkloadSettings?(): Promise<WorkloadSettings>;
  saveWorkloadSettings?(settings: Partial<WorkloadSettings>): Promise<WorkloadSettings>;
  getAuditLogs(limit?: number): Promise<AuditLogEntry[]>;
  logAction(action: AuditLogAction | Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<AuditLogEntry>;
  resetToDefaults(): Promise<void>;

  // Optional extended repository operations
  getPeriod?(periodNumber: number): Promise<MonthlyPeriod | null>;
  getAllPeriods?(): Promise<MonthlyPeriod[]>;
  exportData?(): Promise<string>;
  exportAllData?(): Promise<string>;
  importData?(jsonPayload: string): Promise<void>;
  importAllData?(jsonPayload: string): Promise<void>;
}

/**
 * 2. Complete Zustand Application State & Actions
 */
export interface AppState {
  // Domain Data Entities
  contractor: ContractorProfile;
  agency: AgencyProfile;
  contract: ContractDetails;
  currentPeriod: MonthlyPeriod;
  workloadSettings: WorkloadSettings;
  auditLogs: AuditLogEntry[];

  // Computed & Engine Outputs
  calendarDays: CalendarDay[];
  workloadResult: WorkloadMatrixResult | null;
  attendanceRecords: AttendanceRecord[];
  salaryResult: SalaryCalculationResult | null;

  // UI & Workflow State
  activeDocument: DocumentType;
  selectedPeriodNumber: number;
  isCalculating: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // State Mutation Actions
  setContractor: (updates: Partial<ContractorProfile>) => void;
  setAgency: (updates: Partial<AgencyProfile>) => void;
  setContract: (updates: Partial<ContractDetails>) => void;
  setCurrentPeriod: (updates: Partial<MonthlyPeriod>) => void;
  setHolidays: (holidays: number[]) => void;
  toggleHoliday: (day: number) => void;
  setAbsentDays: (absentDays: number[]) => void;
  toggleAbsentDay: (day: number) => void;

  // Holiday & Leave Management Actions
  setHolidayDetail: (day: number, name: string) => void;
  removeHolidayDetail: (day: number) => void;
  setLeaveDetail: (day: number, reason: string, type?: LeaveDetail['type']) => void;
  removeLeaveDetail: (day: number) => void;
  applyThaiPublicHolidaysPreset: (month?: number) => void;
  clearAllHolidays: () => void;
  clearAllLeaves: () => void;

  // Workload Settings Actions
  setWorkloadSettings: (settings: Partial<WorkloadSettings>) => void;
  setTargetTasks: (target: number) => void;
  setTaskList: (tasks: TaskItem[]) => void;
  addTaskItem: (description: string) => void;
  updateTaskItem: (id: number, description: string) => void;
  removeTaskItem: (id: number) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  resetTaskListToDefault: () => void;
  loadTaskPreset: (presetIndex: number) => void;

  // Calculation & Engine Trigger Actions
  generateWorkload: (seed?: number) => void;
  generateWorkloadWithConditions: (options?: Partial<WorkloadSettings>) => void;
  toggleMatrixCell: (row: number, col: number) => void;
  clearWorkloadMatrix: () => void;
  generateAttendance: (seed?: number) => void;
  recalculateAll: () => void;

  // Navigation & UI Actions
  setActiveDocument: (docId: DocumentType) => void;
  setSelectedPeriodNumber: (periodNumber: number) => void;

  // Persistence & Audit Actions
  initStore: () => Promise<void>;
  logAudit: (action: AuditLogAction | Omit<AuditLogEntry, 'id' | 'created_at'>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportStateJson: () => string;
  importStateJson: (json: string) => boolean;
}

/**
 * 3. Document Template Props Interface
 * Contract consumed by all 5 print templates in src/components/templates/
 */
export interface DocumentProps {
  contractor: ContractorProfile;
  agency: AgencyProfile;
  contract: ContractDetails;
  period: MonthlyPeriod;
  calendarDays: CalendarDay[];
  workload: WorkloadMatrixResult;
  attendance: AttendanceRecord[];
  salary: SalaryCalculationResult;
}

/**
 * 4. LocalStorage Keys Enumeration
 */
export const STORAGE_KEYS = {
  APP_STATE: 'salary_doc_app_state',
  PROFILE: 'salary_doc_profile',
  AGENCY: 'salary_doc_agency',
  CONTRACT: 'salary_doc_contract',
  PERIOD: 'salary_doc_current_period',
  WORKLOAD_SETTINGS: 'salary_doc_workload_settings',
  AUDIT_LOGS: 'salary_doc_audit_logs',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
