/**
 * src/types/database.ts
 * ==============================================================================
 * Supabase Database TypeScript Schema Definition
 * Generated for production PostgreSQL schema matching migration:
 * `supabase/migrations/20261102000000_init_schema.sql`
 * ==============================================================================
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contractors: {
        Row: {
          id: string;
          user_id: string | null;
          line_user_id: string | null;
          role: string;
          status: string;
          avatar_url: string | null;
          display_name: string | null;
          title: string;
          first_name: string;
          last_name: string;
          full_name: string;
          citizen_id: string | null;
          position_title: string;
          email: string | null;
          phone_number: string | null;
          address_line1: string;
          address_line2: string;
          address_full_arabic: string;
          bank_name: string | null;
          bank_account_no: string | null;
          bank_branch: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          line_user_id?: string | null;
          role?: string;
          status?: string;
          avatar_url?: string | null;
          display_name?: string | null;
          title?: string;
          first_name: string;
          last_name: string;
          full_name?: string; // Generated column, optional on insert
          citizen_id?: string | null;
          position_title?: string;
          email?: string | null;
          phone_number?: string | null;
          address_line1?: string;
          address_line2?: string;
          address_full_arabic?: string;
          bank_name?: string | null;
          bank_account_no?: string | null;
          bank_branch?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          line_user_id?: string | null;
          role?: string;
          status?: string;
          avatar_url?: string | null;
          display_name?: string | null;
          title?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          citizen_id?: string | null;
          position_title?: string;
          email?: string | null;
          phone_number?: string | null;
          address_line1?: string;
          address_line2?: string;
          address_full_arabic?: string;
          bank_name?: string | null;
          bank_account_no?: string | null;
          bank_branch?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contractors_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      agencies: {
        Row: {
          id: string;
          agency_name: string;
          payer_agency: string;
          department: string | null;
          ministry: string | null;
          province: string | null;
          position_title: string;
          contractor_name: string;
          supervisor_name: string;
          supervisor_position: string | null;
          inspection_chairman_name: string;
          committee_members: Json;
          payer_officer_name: string;
          payer_officer_position: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_name?: string;
          payer_agency?: string;
          department?: string | null;
          ministry?: string | null;
          province?: string | null;
          position_title?: string;
          contractor_name?: string;
          supervisor_name?: string;
          supervisor_position?: string | null;
          inspection_chairman_name?: string;
          committee_members?: Json;
          payer_officer_name?: string;
          payer_officer_position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_name?: string;
          payer_agency?: string;
          department?: string | null;
          ministry?: string | null;
          province?: string | null;
          position_title?: string;
          contractor_name?: string;
          supervisor_name?: string;
          supervisor_position?: string | null;
          inspection_chairman_name?: string;
          committee_members?: Json;
          payer_officer_name?: string;
          payer_officer_position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      contracts: {
        Row: {
          id: string;
          contractor_id: string | null;
          contract_number: string;
          contract_number_thai: string;
          contract_date: string;
          contract_date_thai: string;
          start_date: string;
          start_date_thai: string;
          end_date: string;
          end_date_thai: string;
          duration_months: number;
          total_periods: number;
          monthly_salary: number;
          total_contract_amount: number;
          daily_rate: number;
          target_tasks_per_period: number;
          task_matrix_range: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id?: string | null;
          contract_number?: string;
          contract_number_thai?: string;
          contract_date?: string;
          contract_date_thai?: string;
          start_date?: string;
          start_date_thai?: string;
          end_date?: string;
          end_date_thai?: string;
          duration_months?: number;
          total_periods?: number;
          monthly_salary?: number;
          total_contract_amount?: number;
          daily_rate?: number;
          target_tasks_per_period?: number;
          task_matrix_range?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string | null;
          contract_number?: string;
          contract_number_thai?: string;
          contract_date?: string;
          contract_date_thai?: string;
          start_date?: string;
          start_date_thai?: string;
          end_date?: string;
          end_date_thai?: string;
          duration_months?: number;
          total_periods?: number;
          monthly_salary?: number;
          total_contract_amount?: number;
          daily_rate?: number;
          target_tasks_per_period?: number;
          task_matrix_range?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contracts_contractor_id_fkey';
            columns: ['contractor_id'];
            referencedRelation: 'contractors';
            referencedColumns: ['id'];
          }
        ];
      };

      monthly_periods: {
        Row: {
          id: string;
          contract_id: string;
          period_number: number;
          period_number_thai: string;
          year_ad: number;
          year_be: number;
          month: number;
          month_name: string;
          invoice_date: string | null;
          invoice_date_thai: string;
          receipt_date: string | null;
          receipt_date_thai: string | null;
          public_holidays: Json;
          absent_days: Json;
          days_in_month: number;
          actual_working_days: number;
          absent_days_count: number;
          daily_rate: number;
          deduction_amount: number;
          net_payable: number;
          monthly_salary_bahttext: string;
          net_payable_bahttext: string;
          total_contract_amount_bahttext: string | null;
          workload_matrix: Json;
          daily_workload_totals: Json;
          task_workload_totals: Json;
          attendance_records: Json;
          status: Database['public']['Enums']['period_status_type'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          period_number: number;
          period_number_thai?: string;
          year_ad?: number;
          year_be?: number;
          month: number;
          month_name?: string;
          invoice_date?: string | null;
          invoice_date_thai?: string;
          receipt_date?: string | null;
          receipt_date_thai?: string | null;
          public_holidays?: Json;
          absent_days?: Json;
          days_in_month?: number;
          actual_working_days?: number;
          absent_days_count?: number;
          daily_rate?: number;
          deduction_amount?: number;
          net_payable?: number;
          monthly_salary_bahttext?: string;
          net_payable_bahttext?: string;
          total_contract_amount_bahttext?: string | null;
          workload_matrix?: Json;
          daily_workload_totals?: Json;
          task_workload_totals?: Json;
          attendance_records?: Json;
          status?: Database['public']['Enums']['period_status_type'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          period_number?: number;
          period_number_thai?: string;
          year_ad?: number;
          year_be?: number;
          month?: number;
          month_name?: string;
          invoice_date?: string | null;
          invoice_date_thai?: string;
          receipt_date?: string | null;
          receipt_date_thai?: string | null;
          public_holidays?: Json;
          absent_days?: Json;
          days_in_month?: number;
          actual_working_days?: number;
          absent_days_count?: number;
          daily_rate?: number;
          deduction_amount?: number;
          net_payable?: number;
          monthly_salary_bahttext?: string;
          net_payable_bahttext?: string;
          total_contract_amount_bahttext?: string | null;
          workload_matrix?: Json;
          daily_workload_totals?: Json;
          task_workload_totals?: Json;
          attendance_records?: Json;
          status?: Database['public']['Enums']['period_status_type'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_periods_contract_id_fkey';
            columns: ['contract_id'];
            referencedRelation: 'contracts';
            referencedColumns: ['id'];
          }
        ];
      };

      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action_type: Database['public']['Enums']['audit_action_type'];
          action: string | null;
          entity_type: string;
          entity_id: string | null;
          actor_name: string;
          actor: string | null;
          summary: string;
          changes_diff: Json | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action_type: Database['public']['Enums']['audit_action_type'];
          action?: string | null;
          entity_type: string;
          entity_id?: string | null;
          actor_name?: string;
          actor?: string | null;
          summary: string;
          changes_diff?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action_type?: Database['public']['Enums']['audit_action_type'];
          action?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          actor_name?: string;
          actor?: string | null;
          summary?: string;
          changes_diff?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      system_options: {
        Row: {
          id: string;
          category: string;
          label: string;
          value: string;
          sort_order: number;
          is_active: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          label: string;
          value: string;
          sort_order?: number;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          label?: string;
          value?: string;
          sort_order?: number;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          category: string;
          label: string;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          category?: string;
          label: string;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          category?: string;
          label?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      profiles: {
        Row: Database['public']['Tables']['contractors']['Row'];
      };
    };

    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };

    Enums: {
      audit_action_type:
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
      period_status_type: 'draft' | 'calculated' | 'finalized';
    };
  };
}

// Convenience Type Helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
