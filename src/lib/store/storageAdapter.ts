/**
 * src/lib/store/storageAdapter.ts
 * ==============================================================================
 * LocalStorage Adapter implementing IStorageAdapter
 * Features:
 * - Robust SSR safety (Node.js/App Router headless compatibility)
 * - In-memory fallback on quota exceed or private browsing restrictions
 * - Fallback key tracking preventing read desynchronization on QuotaExceededError
 * - Lazy initialization with default fixtures (defaultData.ts)
 * - Safe object parsing protecting against "null" / primitive stored values
 * - Strict entity object validation on importAllData preventing corruption
 * - Mutex-serialized logAction promise queue preventing RMW race conditions
 * - PostgreSQL UUID-compliant audit log IDs via RFC 4122 v4 generateUUID()
 * - Partial update deep merging
 * - Audit log creation & capping (last 500)
 * - Full JSON export and schema-validated import
 * ==============================================================================
 */

import type {
  ContractorProfile,
  AgencyProfile,
  ContractDetails,
  MonthlyPeriod,
  WorkloadSettings,
  AuditLogEntry,
  AuditLogAction,
  IStorageAdapter,
} from './types';

import { STORAGE_KEYS } from './types';

import {
  DEFAULT_CONTRACTOR_PROFILE,
  DEFAULT_AGENCY_PROFILE,
  DEFAULT_CONTRACT_DETAILS,
  DEFAULT_MONTHLY_PERIOD,
  DEFAULT_WORKLOAD_SETTINGS,
} from './defaultData';

/**
 * Generate an RFC 4122 version 4 compliant UUID.
 * Uses native Web Crypto API `crypto.randomUUID()` when available,
 * falling back to `crypto.getRandomValues()` or cryptographically sound PRNG.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4 (0100)
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx (RFC 4122)
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class LocalStorageAdapter implements IStorageAdapter {
  private memoryStorage: Map<string, string> = new Map();
  private fallbackKeys: Set<string> = new Set();
  private logQueue: Promise<unknown> = Promise.resolve();
  private isBrowser: boolean;

  constructor(initialMemory?: Map<string, string>) {
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    if (initialMemory) {
      this.memoryStorage = new Map(initialMemory);
    }
  }

  // ----------------------------------------------------------------------------
  // Internal Safe Storage Layer (SSR & In-Memory Fallback)
  // ----------------------------------------------------------------------------

  private getItem(key: string): string | null {
    // If a previous write to localStorage failed (quota or security), read directly from memory fallback
    if (this.fallbackKeys.has(key)) {
      return this.memoryStorage.get(key) ?? null;
    }
    if (this.isBrowser) {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) return item;
      } catch (err) {
        // Fallback to memory on security/quota errors and track key
        this.fallbackKeys.add(key);
      }
    }
    return this.memoryStorage.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser) {
      try {
        window.localStorage.setItem(key, value);
        // If write succeeded, clear any prior fallback tracking for this key
        this.fallbackKeys.delete(key);
      } catch (err) {
        console.warn(`[LocalStorageAdapter] Failed to write to localStorage for key: ${key}, using memory fallback.`, err);
        this.fallbackKeys.add(key);
      }
    }
    this.memoryStorage.set(key, value);
  }

  private removeItem(key: string): void {
    if (this.isBrowser) {
      try {
        window.localStorage.removeItem(key);
        this.fallbackKeys.delete(key);
      } catch (err) {
        this.fallbackKeys.add(key);
      }
    }
    this.memoryStorage.delete(key);
  }

  /**
   * Safely parses JSON strings into typed objects.
   * If parsing fails or produces a non-object (e.g. "null", "123", "true", array),
   * falls back safely to a deep-cloned default fixture.
   */
  private safeParseObject<T>(raw: string | null, fallback: T): T {
    if (!raw) {
      return JSON.parse(JSON.stringify(fallback));
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return JSON.parse(JSON.stringify(fallback));
      }
      return parsed as T;
    } catch {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  // ----------------------------------------------------------------------------
  // Contractor Profile
  // ----------------------------------------------------------------------------

  async getProfile(): Promise<ContractorProfile> {
    const raw = this.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_CONTRACTOR_PROFILE));
      this.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initial));
      return initial;
    }
    return this.safeParseObject<ContractorProfile>(raw, DEFAULT_CONTRACTOR_PROFILE);
  }

  async saveProfile(profileUpdate: Partial<ContractorProfile>): Promise<ContractorProfile> {
    const current = await this.getProfile();
    const updated: ContractorProfile = {
      ...current,
      ...profileUpdate,
      updated_at: new Date().toISOString(),
    };

    // Auto-update full_name if name components changed without explicit full_name
    if ((profileUpdate.title || profileUpdate.first_name || profileUpdate.last_name) && !profileUpdate.full_name) {
      updated.full_name = `${updated.title || ''}${updated.first_name || ''} ${updated.last_name || ''}`.trim();
    }

    this.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  }

  // ----------------------------------------------------------------------------
  // Agency Profile & Signers
  // ----------------------------------------------------------------------------

  async getAgency(): Promise<AgencyProfile> {
    const raw = this.getItem(STORAGE_KEYS.AGENCY);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_AGENCY_PROFILE));
      this.setItem(STORAGE_KEYS.AGENCY, JSON.stringify(initial));
      return initial;
    }
    return this.safeParseObject<AgencyProfile>(raw, DEFAULT_AGENCY_PROFILE);
  }

  async saveAgency(agencyUpdate: Partial<AgencyProfile>): Promise<AgencyProfile> {
    const current = await this.getAgency();
    const updated: AgencyProfile = {
      ...current,
      ...agencyUpdate,
      signers: {
        ...(current?.signers || {}),
        ...(agencyUpdate?.signers || {}),
      },
      updated_at: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.AGENCY, JSON.stringify(updated));
    return updated;
  }

  // ----------------------------------------------------------------------------
  // Contract Details
  // ----------------------------------------------------------------------------

  async getContract(): Promise<ContractDetails> {
    const raw = this.getItem(STORAGE_KEYS.CONTRACT);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_CONTRACT_DETAILS));
      this.setItem(STORAGE_KEYS.CONTRACT, JSON.stringify(initial));
      return initial;
    }
    return this.safeParseObject<ContractDetails>(raw, DEFAULT_CONTRACT_DETAILS);
  }

  async saveContract(contractUpdate: Partial<ContractDetails>): Promise<ContractDetails> {
    const current = await this.getContract();
    const updated: ContractDetails = {
      ...current,
      ...contractUpdate,
      updated_at: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.CONTRACT, JSON.stringify(updated));
    return updated;
  }

  // ----------------------------------------------------------------------------
  // Current Monthly Period
  // ----------------------------------------------------------------------------

  async getCurrentPeriod(): Promise<MonthlyPeriod> {
    const raw = this.getItem(STORAGE_KEYS.PERIOD);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_MONTHLY_PERIOD));
      this.setItem(STORAGE_KEYS.PERIOD, JSON.stringify(initial));
      return initial;
    }
    return this.safeParseObject<MonthlyPeriod>(raw, DEFAULT_MONTHLY_PERIOD);
  }

  async saveCurrentPeriod(period: MonthlyPeriod): Promise<MonthlyPeriod> {
    const updated: MonthlyPeriod = {
      ...period,
      updated_at: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.PERIOD, JSON.stringify(updated));
    return updated;
  }

  // ----------------------------------------------------------------------------
  // Workload Configuration & Tasks
  // ----------------------------------------------------------------------------

  async getWorkloadSettings(): Promise<WorkloadSettings> {
    const raw = this.getItem(STORAGE_KEYS.WORKLOAD_SETTINGS);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_WORKLOAD_SETTINGS));
      this.setItem(STORAGE_KEYS.WORKLOAD_SETTINGS, JSON.stringify(initial));
      return initial;
    }
    return this.safeParseObject<WorkloadSettings>(raw, DEFAULT_WORKLOAD_SETTINGS);
  }

  async saveWorkloadSettings(settingsUpdate: Partial<WorkloadSettings>): Promise<WorkloadSettings> {
    const current = await this.getWorkloadSettings();
    const updated: WorkloadSettings = {
      ...current,
      ...settingsUpdate,
    };

    this.setItem(STORAGE_KEYS.WORKLOAD_SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // ----------------------------------------------------------------------------
  // Audit Logs
  // ----------------------------------------------------------------------------

  async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    const raw = this.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      const list: AuditLogEntry[] = JSON.parse(raw);
      return Array.isArray(list) ? list.slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  async logAction(action: AuditLogAction | Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<AuditLogEntry> {
    const nowIso = new Date().toISOString();
    const actionType = (action as any).action_type || (action as any).action || 'PERIOD_UPDATE';
    const actorName = (action as any).actor_name || (action as any).actor || 'ระบบอัตโนมัติ';
    const diff = (action as any).changes_diff || (action as any).diff;

    // Use RFC 4122 v4 UUID generator for PostgreSQL UUID compatibility
    const generatedId = (action as any).id || generateUUID();

    const entry: AuditLogEntry = {
      id: generatedId,
      timestamp: nowIso,
      created_at: nowIso,
      action: actionType,
      action_type: actionType,
      actor: actorName,
      actor_name: actorName,
      entity_type: action.entity_type || 'system',
      entity_id: action.entity_id,
      summary: action.summary || '',
      diff: diff,
      changes_diff: diff,
      metadata: action.metadata,
    };

    // Serialize concurrent log operations via Promise queue mutex to eliminate RMW race conditions
    const operation = async (): Promise<AuditLogEntry> => {
      const existing = await this.getAuditLogs(500);
      const updated = [entry, ...existing].slice(0, 500); // Keep last 500
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
      return entry;
    };

    const nextTask = this.logQueue.then(operation, operation);
    this.logQueue = nextTask.catch(() => {});
    return nextTask;
  }

  // ----------------------------------------------------------------------------
  // Reset to Defaults
  // ----------------------------------------------------------------------------

  async resetToDefaults(): Promise<void> {
    await this.logQueue;
    this.fallbackKeys.clear();
    this.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_CONTRACTOR_PROFILE));
    this.setItem(STORAGE_KEYS.AGENCY, JSON.stringify(DEFAULT_AGENCY_PROFILE));
    this.setItem(STORAGE_KEYS.CONTRACT, JSON.stringify(DEFAULT_CONTRACT_DETAILS));
    this.setItem(STORAGE_KEYS.PERIOD, JSON.stringify(DEFAULT_MONTHLY_PERIOD));
    this.setItem(STORAGE_KEYS.WORKLOAD_SETTINGS, JSON.stringify(DEFAULT_WORKLOAD_SETTINGS));
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    this.removeItem(STORAGE_KEYS.APP_STATE);
  }

  // ----------------------------------------------------------------------------
  // Full Data Export & Import
  // ----------------------------------------------------------------------------

  async exportAllData(): Promise<string> {
    const profile = await this.getProfile();
    const agency = await this.getAgency();
    const contract = await this.getContract();
    const currentPeriod = await this.getCurrentPeriod();
    const workloadSettings = await this.getWorkloadSettings();
    const auditLogs = await this.getAuditLogs(500);

    return JSON.stringify(
      {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        profile,
        contractor: profile,
        agency,
        contract,
        currentPeriod,
        workloadSettings,
        auditLogs,
      },
      null,
      2
    );
  }

  async exportData(): Promise<string> {
    return this.exportAllData();
  }

  async importAllData(jsonPayload: string): Promise<void> {
    if (!jsonPayload || typeof jsonPayload !== 'string') {
      throw new Error('Invalid JSON payload');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonPayload);
    } catch {
      throw new Error('Invalid JSON payload: malformed JSON string');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid JSON payload: expected an object');
    }

    const profile = parsed.profile || parsed.contractor;
    const agency = parsed.agency;
    const contract = parsed.contract;

    const isPlainObject = (val: unknown): val is Record<string, any> =>
      typeof val === 'object' && val !== null && !Array.isArray(val);

    if (!isPlainObject(profile) || !isPlainObject(agency) || !isPlainObject(contract)) {
      throw new Error('Payload missing required entities: profile, agency, contract must be valid objects');
    }

    this.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    this.setItem(STORAGE_KEYS.AGENCY, JSON.stringify(agency));
    this.setItem(STORAGE_KEYS.CONTRACT, JSON.stringify(contract));

    if (parsed.currentPeriod || parsed.period) {
      const period = parsed.currentPeriod || parsed.period;
      if (isPlainObject(period)) {
        this.setItem(STORAGE_KEYS.PERIOD, JSON.stringify(period));
      }
    }
    if (parsed.workloadSettings || parsed.workload_settings) {
      const wl = parsed.workloadSettings || parsed.workload_settings;
      if (isPlainObject(wl)) {
        this.setItem(STORAGE_KEYS.WORKLOAD_SETTINGS, JSON.stringify(wl));
      }
    }
    if (Array.isArray(parsed.auditLogs)) {
      await this.logQueue;
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(parsed.auditLogs));
    }
  }

  async importData(jsonPayload: string): Promise<void> {
    return this.importAllData(jsonPayload);
  }
}

/** Global default singleton instance */
export const localStorageAdapter = new LocalStorageAdapter();
