-- =============================================================================
-- Manual setup script for a new Supabase project.
-- Run only this file in the Supabase SQL Editor on an empty project.
-- It creates schema objects only. It inserts no rows and grants no table access
-- to anon or authenticated. Server-side code uses the service_role key.
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE audit_action_type AS ENUM (
    'PROFILE_UPDATE',
    'AGENCY_UPDATE',
    'CONTRACT_UPDATE',
    'PERIOD_UPDATE',
    'WORKLOAD_GENERATE',
    'WORKLOAD_GENERATED',
    'ATTENDANCE_GENERATE',
    'ATTENDANCE_GENERATED',
    'DOCUMENT_PREVIEW',
    'DOCUMENT_PRINT',
    'DATA_RESET',
    'DATA_EXPORT',
    'DATA_IMPORT',
    'DATA_IMPORTED',
    'USER_REGISTER',
    'USER_LOGIN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE period_status_type AS ENUM (
    'draft',
    'calculated',
    'finalized'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: users (LINE Pure-LIFF Profile Sync)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  picture_url TEXT,
  status_message TEXT,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('customer', 'admin', 'staff', 'member')),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: contractors (Unified Member Profile: Email Auth + LINE LIFF)
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  line_user_id VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  title VARCHAR(50) NOT NULL DEFAULT 'นาย',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) GENERATED ALWAYS AS (title || first_name || ' ' || last_name) STORED,
  display_name VARCHAR(255),
  avatar_url TEXT,
  citizen_id VARCHAR(13) CHECK (citizen_id IS NULL OR citizen_id ~ '^[0-9]{13}$'),
  position_title VARCHAR(255) NOT NULL DEFAULT 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  email VARCHAR(255),
  phone_number VARCHAR(20),
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  address_full_arabic TEXT NOT NULL DEFAULT '',
  bank_name VARCHAR(100) DEFAULT 'ธนาคารกรุงไทย',
  bank_account_no VARCHAR(50) DEFAULT '',
  bank_branch VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLE: agencies (Agency Profile & Signers)
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name VARCHAR(255) NOT NULL DEFAULT 'วิทยาลัยนักบริหารสาธารณสุข',
  payer_agency VARCHAR(255) NOT NULL DEFAULT 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข',
  department VARCHAR(255) DEFAULT 'สำนักงานปลัดกระทรวงสาธารณสุข',
  ministry VARCHAR(255) DEFAULT 'กระทรวงสาธารณสุข',
  province VARCHAR(100) DEFAULT 'เพชรบุรี',
  position_title VARCHAR(255) NOT NULL DEFAULT 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  contractor_name VARCHAR(255) NOT NULL DEFAULT '',
  supervisor_name VARCHAR(255) NOT NULL DEFAULT '',
  supervisor_position VARCHAR(255) DEFAULT 'นักวิชาการคอมพิวเตอร์ชำนาญการ',
  inspection_chairman_name VARCHAR(255) NOT NULL DEFAULT 'ประธานกรรมการตรวจรับพัสดุ',
  committee_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  payer_officer_name VARCHAR(255) NOT NULL DEFAULT '',
  payer_officer_position VARCHAR(255) DEFAULT 'เจ้าหน้าที่การเงินและบัญชี',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLE: contracts (Contract Details & Parameters)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  contract_number VARCHAR(50) NOT NULL DEFAULT '',
  contract_number_thai VARCHAR(50) NOT NULL DEFAULT '',
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_date_thai VARCHAR(100) NOT NULL DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date_thai VARCHAR(100) NOT NULL DEFAULT '',
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year')::DATE,
  end_date_thai VARCHAR(100) NOT NULL DEFAULT '',
  duration_months INT NOT NULL DEFAULT 12 CHECK (duration_months > 0),
  total_periods INT NOT NULL DEFAULT 12 CHECK (total_periods > 0),
  monthly_salary NUMERIC(12,2) NOT NULL DEFAULT 19800.00 CHECK (monthly_salary >= 0),
  total_contract_amount NUMERIC(12,2) NOT NULL DEFAULT 237600.00 CHECK (total_contract_amount >= 0),
  daily_rate NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(monthly_salary / 30.0, 2)) STORED,
  target_tasks_per_period INT NOT NULL DEFAULT 110 CHECK (target_tasks_per_period > 0),
  task_matrix_range VARCHAR(50) NOT NULL DEFAULT 'C4:AG21',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_contract_dates CHECK (end_date >= start_date)
);

-- 7. TABLE: monthly_periods (Monthly Operational Record & Calculations)
CREATE TABLE IF NOT EXISTS public.monthly_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  period_number_thai VARCHAR(10) NOT NULL DEFAULT '๑',
  year_ad INT NOT NULL DEFAULT 2026,
  year_be INT NOT NULL DEFAULT 2569,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  month_name VARCHAR(50) NOT NULL DEFAULT 'ตุลาคม',
  invoice_date DATE DEFAULT CURRENT_DATE,
  invoice_date_thai VARCHAR(100) NOT NULL DEFAULT '',
  receipt_date DATE DEFAULT CURRENT_DATE,
  receipt_date_thai VARCHAR(100) DEFAULT '',
  public_holidays JSONB NOT NULL DEFAULT '[]'::jsonb,
  absent_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  days_in_month INT NOT NULL CHECK (days_in_month BETWEEN 28 AND 31),
  actual_working_days INT NOT NULL DEFAULT 20 CHECK (actual_working_days >= 0),
  absent_days_count INT NOT NULL DEFAULT 0 CHECK (absent_days_count >= 0),
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 660.00,
  deduction_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_payable NUMERIC(12,2) NOT NULL DEFAULT 19800.00,
  monthly_salary_bahttext TEXT NOT NULL DEFAULT '',
  net_payable_bahttext TEXT NOT NULL DEFAULT '',
  total_contract_amount_bahttext TEXT DEFAULT '',
  workload_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_workload_totals JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_workload_totals JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendance_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  status period_status_type NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contract_period UNIQUE (contract_id, period_number)
);

-- 8. TABLE: system_options (Dynamic Form Dropdowns)
CREATE TABLE IF NOT EXISTS public.system_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABLE: system_settings (Global System Configurations)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  label VARCHAR(255) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLE: audit_logs (Audit Trail & Change History)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type audit_action_type NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  actor_name VARCHAR(255) NOT NULL DEFAULT 'ระบบอัตโนมัติ',
  summary TEXT NOT NULL,
  changes_diff JSONB,
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INDEXES (Supabase Postgres Performance Best Practices)
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON public.users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractors_line_user_id ON public.contractors(line_user_id) WHERE line_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractors_role_status ON public.contractors(role, status);
CREATE INDEX IF NOT EXISTS idx_contractors_citizen_id ON public.contractors(citizen_id) WHERE citizen_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_contractor_id ON public.contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_monthly_periods_contract_id ON public.monthly_periods(contract_id);
CREATE INDEX IF NOT EXISTS idx_monthly_periods_period_number ON public.monthly_periods(period_number);
CREATE INDEX IF NOT EXISTS idx_monthly_periods_year_month ON public.monthly_periods(year_ad, month);

CREATE INDEX IF NOT EXISTS idx_system_options_category ON public.system_options(category, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id) WHERE user_id IS NOT NULL;

-- 12. AUTOMATIC updated_at TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contractors_updated_at ON public.contractors;
CREATE TRIGGER trg_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agencies_updated_at ON public.agencies;
CREATE TRIGGER trg_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON public.contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_monthly_periods_updated_at ON public.monthly_periods;
CREATE TRIGGER trg_monthly_periods_updated_at
  BEFORE UPDATE ON public.monthly_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_system_options_updated_at ON public.system_options;
CREATE TRIGGER trg_system_options_updated_at
  BEFORE UPDATE ON public.system_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- The browser roles receive no table privileges or RLS policies. Application
-- access must go through authenticated server handlers using service_role.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.users,
  public.contractors,
  public.agencies,
  public.contracts,
  public.monthly_periods,
  public.system_options,
  public.system_settings,
  public.audit_logs
TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
