/**
 * src/lib/store/supabaseAdapter.ts
 * ==============================================================================
 * Supabase Storage Adapter implementing IStorageAdapter (Hybrid Dual-Sync)
 *
 * Features:
 * - Direct real-time cloud persistence to Supabase PostgreSQL:
 *   - public.contractors
 *   - public.agencies
 *   - public.contracts
 *   - public.monthly_periods
 *   - public.audit_logs
 * - Resilient offline-first caching via LocalStorageAdapter
 * - Graceful fallback on network loss or unconfigured credentials
 * - Automatic type transformation between TypeScript schema and PostgreSQL DDL
 * ==============================================================================
 */

import { supabase } from '@/lib/supabaseClient';
import { localStorageAdapter, generateUUID } from './storageAdapter';
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
import {
  DEFAULT_CONTRACTOR_PROFILE,
  DEFAULT_AGENCY_PROFILE,
  DEFAULT_CONTRACT_DETAILS,
  DEFAULT_MONTHLY_PERIOD,
} from './defaultData';

const DETERMINISTIC_IDS = {
  CONTRACTOR: '00000000-0000-0000-0000-000000000001',
  AGENCY: '00000000-0000-0000-0000-000000000002',
  CONTRACT: '00000000-0000-0000-0000-000000000003',
  PERIOD: '00000000-0000-0000-0000-000000000004',
};

/**
 * Check whether Supabase environment variables are actively provisioned.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project.supabase.co') &&
    key !== 'public-anon-key'
  );
}

// ----------------------------------------------------------------------------
// DB <-> Domain Data Mappers
// ----------------------------------------------------------------------------

function mapDbRowToProfile(row: Record<string, any>): ContractorProfile {
  return {
    id: row.id,
    title: row.title || 'นาย',
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    full_name:
      row.full_name ||
      `${row.title || ''}${row.first_name || ''} ${row.last_name || ''}`.trim(),
    citizen_id: row.citizen_id || '',
    position_title: row.position_title || 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
    email: row.email || undefined,
    phone_number: row.phone_number || undefined,
    address_line1: row.address_line1 || '',
    address_line2: row.address_line2 || '',
    address_full_arabic: row.address_full_arabic || '',
    bank_name: row.bank_name || undefined,
    bank_account_no: row.bank_account_no || undefined,
    bank_branch: row.bank_branch || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDbRowToAgency(row: Record<string, any>): AgencyProfile {
  return {
    id: row.id,
    agency_name: row.agency_name || '',
    payer_agency: row.payer_agency || '',
    department: row.department || undefined,
    ministry: row.ministry || undefined,
    province: row.province || undefined,
    position_title: row.position_title || '',
    signers: {
      contractor_name: row.contractor_name || '',
      supervisor_name: row.supervisor_name || '',
      supervisor_position: row.supervisor_position || undefined,
      inspection_chairman_name: row.inspection_chairman_name || '',
      committee_members: Array.isArray(row.committee_members) ? row.committee_members : [],
      payer_officer_name: row.payer_officer_name || '..................................................',
      payer_officer_position: row.payer_officer_position || 'เจ้าหน้าที่การเงินและบัญชี',
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDbRowToContract(row: Record<string, any>): ContractDetails {
  return {
    id: row.id,
    contract_number: row.contract_number,
    contract_number_thai: row.contract_number_thai,
    contract_date: row.contract_date,
    contract_date_thai: row.contract_date_thai,
    start_date: row.start_date,
    start_date_thai: row.start_date_thai,
    end_date: row.end_date,
    end_date_thai: row.end_date_thai,
    duration_months: Number(row.duration_months),
    total_periods: Number(row.total_periods),
    monthly_salary: Number(row.monthly_salary),
    total_contract_amount: Number(row.total_contract_amount),
    daily_rate: Number(row.daily_rate) || Math.round((Number(row.monthly_salary) / 30.0) * 100) / 100,
    target_tasks_per_period: Number(row.target_tasks_per_period) || 110,
    task_matrix_range: row.task_matrix_range || 'C4:AG21',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDbRowToPeriod(row: Record<string, any>): MonthlyPeriod {
  return {
    id: row.id,
    contract_id: row.contract_id,
    period_number: Number(row.period_number),
    period_number_thai: row.period_number_thai,
    year_ad: Number(row.year_ad),
    year_be: Number(row.year_be),
    month: Number(row.month),
    month_name: row.month_name,
    invoice_date: row.invoice_date,
    invoice_date_thai: row.invoice_date_thai,
    receipt_date: row.receipt_date,
    receipt_date_thai: row.receipt_date_thai,
    public_holidays: Array.isArray(row.public_holidays) ? row.public_holidays : [],
    absent_days: Array.isArray(row.absent_days) ? row.absent_days : [],
    holiday_details: Array.isArray(row.holiday_details) ? row.holiday_details : undefined,
    leave_details: Array.isArray(row.leave_details) ? row.leave_details : undefined,
    days_in_month: Number(row.days_in_month),
    actual_working_days: Number(row.actual_working_days),
    absent_days_count: Number(row.absent_days_count),
    daily_rate: Number(row.daily_rate),
    deduction_amount: Number(row.deduction_amount),
    net_payable: Number(row.net_payable),
    monthly_salary_bahttext: row.monthly_salary_bahttext,
    net_payable_bahttext: row.net_payable_bahttext,
    total_contract_amount_bahttext: row.total_contract_amount_bahttext,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDbRowToAudit(row: Record<string, any>): AuditLogEntry {
  return {
    id: row.id,
    timestamp: row.created_at,
    created_at: row.created_at,
    action: row.action || row.action_type,
    action_type: row.action_type || row.action,
    actor: row.actor || row.actor_name,
    actor_name: row.actor_name || row.actor,
    entity_type: row.entity_type,
    entity_id: row.entity_id || undefined,
    summary: row.summary,
    diff: row.changes_diff || undefined,
    changes_diff: row.changes_diff || undefined,
    metadata: row.metadata || undefined,
  };
}

// ----------------------------------------------------------------------------
// SupabaseStorageAdapter Class
// ----------------------------------------------------------------------------

export class SupabaseStorageAdapter implements IStorageAdapter {
  private local = localStorageAdapter;

  async getProfile(): Promise<ContractorProfile> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('contractors')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const profile = mapDbRowToProfile(data);
          // Sync to local cache
          await this.local.saveProfile(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] getProfile network error, falling back to local:', err);
      }
    }
    return this.local.getProfile();
  }

  async saveProfile(profile: Partial<ContractorProfile>): Promise<ContractorProfile> {
    // 1. Immediately persist to LocalStorage cache
    const savedLocal = await this.local.saveProfile(profile);

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const payload: Record<string, any> = {};
        if (savedLocal.title !== undefined) payload.title = savedLocal.title;
        if (savedLocal.first_name !== undefined) payload.first_name = savedLocal.first_name;
        if (savedLocal.last_name !== undefined) payload.last_name = savedLocal.last_name;
        if (savedLocal.citizen_id !== undefined) payload.citizen_id = savedLocal.citizen_id;
        if (savedLocal.position_title !== undefined) payload.position_title = savedLocal.position_title;
        if (savedLocal.email !== undefined) payload.email = savedLocal.email;
        if (savedLocal.phone_number !== undefined) payload.phone_number = savedLocal.phone_number;
        if (savedLocal.address_line1 !== undefined) payload.address_line1 = savedLocal.address_line1;
        if (savedLocal.address_line2 !== undefined) payload.address_line2 = savedLocal.address_line2;
        if (savedLocal.address_full_arabic !== undefined) payload.address_full_arabic = savedLocal.address_full_arabic;
        if (savedLocal.bank_name !== undefined) payload.bank_name = savedLocal.bank_name;
        if (savedLocal.bank_account_no !== undefined) payload.bank_account_no = savedLocal.bank_account_no;
        if (savedLocal.bank_branch !== undefined) payload.bank_branch = savedLocal.bank_branch;
        payload.updated_at = new Date().toISOString();

        const targetId = savedLocal.id || DETERMINISTIC_IDS.CONTRACTOR;
        const { error } = await supabase
          .from('contractors')
          .update(payload)
          .eq('id', targetId);

        if (error) {
          console.warn('[SupabaseStorageAdapter] saveProfile update failed:', error.message);
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] saveProfile cloud sync error:', err);
      }
    }

    return savedLocal;
  }

  async getAgency(): Promise<AgencyProfile> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('agencies')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const agency = mapDbRowToAgency(data);
          await this.local.saveAgency(agency);
          return agency;
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] getAgency network error, falling back to local:', err);
      }
    }
    return this.local.getAgency();
  }

  async saveAgency(agency: Partial<AgencyProfile>): Promise<AgencyProfile> {
    const savedLocal = await this.local.saveAgency(agency);

    if (isSupabaseConfigured()) {
      try {
        const row: Record<string, any> = {};
        if (savedLocal.agency_name !== undefined) row.agency_name = savedLocal.agency_name;
        if (savedLocal.payer_agency !== undefined) row.payer_agency = savedLocal.payer_agency;
        if (savedLocal.department !== undefined) row.department = savedLocal.department;
        if (savedLocal.ministry !== undefined) row.ministry = savedLocal.ministry;
        if (savedLocal.province !== undefined) row.province = savedLocal.province;
        if (savedLocal.position_title !== undefined) row.position_title = savedLocal.position_title;

        if (savedLocal.signers) {
          if (savedLocal.signers.contractor_name !== undefined) row.contractor_name = savedLocal.signers.contractor_name;
          if (savedLocal.signers.supervisor_name !== undefined) row.supervisor_name = savedLocal.signers.supervisor_name;
          if (savedLocal.signers.supervisor_position !== undefined) row.supervisor_position = savedLocal.signers.supervisor_position;
          if (savedLocal.signers.inspection_chairman_name !== undefined) row.inspection_chairman_name = savedLocal.signers.inspection_chairman_name;
          if (savedLocal.signers.committee_members !== undefined) row.committee_members = savedLocal.signers.committee_members;
          if (savedLocal.signers.payer_officer_name !== undefined) row.payer_officer_name = savedLocal.signers.payer_officer_name;
          if (savedLocal.signers.payer_officer_position !== undefined) row.payer_officer_position = savedLocal.signers.payer_officer_position;
        }
        row.updated_at = new Date().toISOString();

        const targetId = savedLocal.id || DETERMINISTIC_IDS.AGENCY;
        const { error } = await supabase
          .from('agencies')
          .update(row)
          .eq('id', targetId);

        if (error) {
          console.warn('[SupabaseStorageAdapter] saveAgency update failed:', error.message);
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] saveAgency cloud sync error:', err);
      }
    }

    return savedLocal;
  }

  async getContract(): Promise<ContractDetails> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const contract = mapDbRowToContract(data);
          await this.local.saveContract(contract);
          return contract;
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] getContract network error, falling back to local:', err);
      }
    }
    return this.local.getContract();
  }

  async saveContract(contract: Partial<ContractDetails>): Promise<ContractDetails> {
    const savedLocal = await this.local.saveContract(contract);

    if (isSupabaseConfigured()) {
      try {
        const row: Record<string, any> = {};
        if (savedLocal.contract_number !== undefined) row.contract_number = savedLocal.contract_number;
        if (savedLocal.contract_number_thai !== undefined) row.contract_number_thai = savedLocal.contract_number_thai;
        if (savedLocal.contract_date !== undefined) row.contract_date = savedLocal.contract_date;
        if (savedLocal.contract_date_thai !== undefined) row.contract_date_thai = savedLocal.contract_date_thai;
        if (savedLocal.start_date !== undefined) row.start_date = savedLocal.start_date;
        if (savedLocal.start_date_thai !== undefined) row.start_date_thai = savedLocal.start_date_thai;
        if (savedLocal.end_date !== undefined) row.end_date = savedLocal.end_date;
        if (savedLocal.end_date_thai !== undefined) row.end_date_thai = savedLocal.end_date_thai;
        if (savedLocal.duration_months !== undefined) row.duration_months = savedLocal.duration_months;
        if (savedLocal.total_periods !== undefined) row.total_periods = savedLocal.total_periods;
        if (savedLocal.monthly_salary !== undefined) row.monthly_salary = savedLocal.monthly_salary;
        if (savedLocal.total_contract_amount !== undefined) row.total_contract_amount = savedLocal.total_contract_amount;
        if (savedLocal.target_tasks_per_period !== undefined) row.target_tasks_per_period = savedLocal.target_tasks_per_period;
        if (savedLocal.task_matrix_range !== undefined) row.task_matrix_range = savedLocal.task_matrix_range;
        row.updated_at = new Date().toISOString();

        const targetId = savedLocal.id || DETERMINISTIC_IDS.CONTRACT;
        const { error } = await supabase
          .from('contracts')
          .update(row)
          .eq('id', targetId);

        if (error) {
          console.warn('[SupabaseStorageAdapter] saveContract update failed:', error.message);
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] saveContract cloud sync error:', err);
      }
    }

    return savedLocal;
  }

  async getCurrentPeriod(): Promise<MonthlyPeriod> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('monthly_periods')
          .select('*')
          .order('period_number', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const period = mapDbRowToPeriod(data);
          await this.local.saveCurrentPeriod(period);
          return period;
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] getCurrentPeriod network error, falling back to local:', err);
      }
    }
    return this.local.getCurrentPeriod();
  }

  async saveCurrentPeriod(period: MonthlyPeriod): Promise<MonthlyPeriod> {
    const savedLocal = await this.local.saveCurrentPeriod(period);

    if (isSupabaseConfigured()) {
      try {
        const row: Record<string, any> = {
          period_number: savedLocal.period_number,
          period_number_thai: savedLocal.period_number_thai,
          year_ad: savedLocal.year_ad,
          year_be: savedLocal.year_be,
          month: savedLocal.month,
          month_name: savedLocal.month_name,
          invoice_date: savedLocal.invoice_date,
          invoice_date_thai: savedLocal.invoice_date_thai,
          receipt_date: savedLocal.receipt_date,
          receipt_date_thai: savedLocal.receipt_date_thai,
          public_holidays: savedLocal.public_holidays || [],
          absent_days: savedLocal.absent_days || [],
          days_in_month: savedLocal.days_in_month,
          actual_working_days: savedLocal.actual_working_days,
          absent_days_count: savedLocal.absent_days_count,
          daily_rate: savedLocal.daily_rate,
          deduction_amount: savedLocal.deduction_amount,
          net_payable: savedLocal.net_payable,
          monthly_salary_bahttext: savedLocal.monthly_salary_bahttext,
          net_payable_bahttext: savedLocal.net_payable_bahttext,
          total_contract_amount_bahttext: savedLocal.total_contract_amount_bahttext,
          status: savedLocal.status || 'draft',
          updated_at: new Date().toISOString(),
        };

        const targetId = savedLocal.id || DETERMINISTIC_IDS.PERIOD;
        const { error } = await supabase
          .from('monthly_periods')
          .update(row)
          .eq('id', targetId);

        if (error) {
          console.warn('[SupabaseStorageAdapter] saveCurrentPeriod update failed:', error.message);
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] saveCurrentPeriod cloud sync error:', err);
      }
    }

    return savedLocal;
  }

  // ----------------------------------------------------------------------------
  // Workload Settings & Tasks
  // ----------------------------------------------------------------------------

  async getWorkloadSettings(): Promise<WorkloadSettings> {
    return this.local.getWorkloadSettings();
  }

  async saveWorkloadSettings(settings: Partial<WorkloadSettings>): Promise<WorkloadSettings> {
    const saved = await this.local.saveWorkloadSettings(settings);
    return saved;
  }

  async getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data) && data.length > 0) {
          const logs = data.map(mapDbRowToAudit);
          return logs;
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] getAuditLogs network error, falling back to local:', err);
      }
    }
    return this.local.getAuditLogs(limit);
  }

  async logAction(
    action: AuditLogAction | Omit<AuditLogEntry, 'id' | 'created_at'>
  ): Promise<AuditLogEntry> {
    const entry = await this.local.logAction(action);

    if (isSupabaseConfigured()) {
      try {
        const actionType = 'action_type' in action && action.action_type ? action.action_type : action.action;
        const row = {
          id: entry.id || generateUUID(),
          action_type: actionType,
          action: action.action,
          actor_name: entry.actor_name || entry.actor,
          actor: entry.actor,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id || null,
          summary: entry.summary,
          changes_diff: entry.diff || entry.changes_diff || null,
          metadata: entry.metadata || null,
          created_at: entry.created_at || entry.timestamp || new Date().toISOString(),
        };

        const { error } = await supabase.from('audit_logs').insert(row);
        if (error) {
          console.warn('[SupabaseStorageAdapter] logAction cloud insert failed:', error.message);
        }
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] logAction cloud sync error:', err);
      }
    }

    return entry;
  }

  async resetToDefaults(): Promise<void> {
    await this.local.resetToDefaults();

    if (isSupabaseConfigured()) {
      try {
        await Promise.allSettled([
          this.saveProfile(DEFAULT_CONTRACTOR_PROFILE),
          this.saveAgency(DEFAULT_AGENCY_PROFILE),
          this.saveContract(DEFAULT_CONTRACT_DETAILS),
          this.saveCurrentPeriod(DEFAULT_MONTHLY_PERIOD),
        ]);
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] resetToDefaults cloud error:', err);
      }
    }
  }

  async exportAllData(): Promise<string> {
    return this.local.exportAllData();
  }

  async importAllData(jsonPayload: string): Promise<void> {
    await this.local.importAllData(jsonPayload);

    if (isSupabaseConfigured()) {
      try {
        const parsed = JSON.parse(jsonPayload);
        const profile = parsed.contractor || parsed.profile;
        const agency = parsed.agency;
        const contract = parsed.contract;
        const period = parsed.currentPeriod || parsed.period;

        if (profile) await this.saveProfile(profile);
        if (agency) await this.saveAgency(agency);
        if (contract) await this.saveContract(contract);
        if (period) await this.saveCurrentPeriod(period);
      } catch (err) {
        console.warn('[SupabaseStorageAdapter] importAllData cloud sync error:', err);
      }
    }
  }
}

/** Global default hybrid storage instance */
export const supabaseAdapter = new SupabaseStorageAdapter();
