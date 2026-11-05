/**
 * src/types/systemOptions.ts
 * ==============================================================================
 * Dynamic System Dropdown Options & Global Settings Types
 * ==============================================================================
 */

export type OptionCategory =
  | 'title'
  | 'position'
  | 'agency'
  | 'payer_agency'
  | 'bank'
  | 'leave_type';

export interface SystemOption {
  id: string;
  category: OptionCategory | string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  label: string;
  description?: string | null;
  updated_at?: string;
}

export interface WorkingHoursConfig {
  time_in_min: string;
  time_in_max: string;
  time_out_min: string;
  time_out_max: string;
}
