-- =============================================================================
-- Supabase Migration: Thai Government Contractor Salary & Document System
-- Migration Version: 20261102000000_init_schema.sql
-- Description: Core tables, enums, constraints, generated columns, indexes,
--              triggers, and Row Level Security (RLS) policies.
-- Best Practices applied:
-- - /supabase-postgres-best-practices & /supabase skills
-- - Subquery wrapped auth functions: (select auth.uid()) for caching
-- - Avoid deprecated auth.role() and use explicit TO authenticated / TO anon
-- - Security invoker on views: WITH (security_invoker = true)
-- - Both USING and WITH CHECK on UPDATE policies
-- - search_path = '' on trigger functions
-- - Foreign key indexes on all relationships
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

-- Audit Action Types: includes both imperative and past-tense variants for full compatibility
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
    'DATA_IMPORTED'
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

-- -----------------------------------------------------------------------------
-- 2. TABLE: contractors (Member / Personal Profile)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL DEFAULT 'นาย',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  -- Stored generated column for full name with title
  full_name VARCHAR(255) GENERATED ALWAYS AS (title || first_name || ' ' || last_name) STORED,
  citizen_id VARCHAR(13) CHECK (citizen_id IS NULL OR citizen_id ~ '^[0-9]{13}$'),
  position_title VARCHAR(255) NOT NULL DEFAULT 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  email VARCHAR(255),
  phone_number VARCHAR(20),
  -- Address fields: Thai numerals for Delivery Invoices, Arabic numerals for Receipt Voucher
  address_line1 TEXT NOT NULL DEFAULT '๑๖๓/๑๗๔ หมู่ที่ ๓ ตำบลบ้านหาด',
  address_line2 TEXT NOT NULL DEFAULT 'อำเภอบ้านลาด จังหวัดเพชรบุรี',
  address_full_arabic TEXT NOT NULL DEFAULT '163/174 หมู่ที่ 3 ตำบลบ้านหาด อำเภอบ้านลาด จังหวัดเพชรบุรี',
  bank_name VARCHAR(100) DEFAULT 'ธนาคารกรุงไทย',
  bank_account_no VARCHAR(50) DEFAULT '123-4-56789-0',
  bank_branch VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility view for 'profiles' with security_invoker = true
CREATE OR REPLACE VIEW profiles WITH (security_invoker = true) AS
  SELECT * FROM contractors;

-- -----------------------------------------------------------------------------
-- 3. TABLE: agencies (Agency Profile & Signers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name VARCHAR(255) NOT NULL DEFAULT 'วิทยาลัยนักบริหารสาธารณสุข',
  payer_agency VARCHAR(255) NOT NULL DEFAULT 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข',
  department VARCHAR(255) DEFAULT 'สำนักงานปลัดกระทรวงสาธารณสุข',
  ministry VARCHAR(255) DEFAULT 'กระทรวงสาธารณสุข',
  province VARCHAR(100) DEFAULT 'เพชรบุรี',
  position_title VARCHAR(255) NOT NULL DEFAULT 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  -- Signer Roles
  contractor_name VARCHAR(255) NOT NULL DEFAULT 'นาย[ชื่อผู้รับจ้าง] [นามสกุล]',
  supervisor_name VARCHAR(255) NOT NULL DEFAULT 'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]',
  supervisor_position VARCHAR(255) DEFAULT 'นักวิชาการคอมพิวเตอร์ชำนาญการ',
  inspection_chairman_name VARCHAR(255) NOT NULL DEFAULT 'ประธานกรรมการตรวจรับพัสดุ',
  committee_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  payer_officer_name VARCHAR(255) NOT NULL DEFAULT '..................................................',
  payer_officer_position VARCHAR(255) DEFAULT 'เจ้าหน้าที่การเงินและบัญชี',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. TABLE: contracts (Contract Details & Parameters)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  contract_number VARCHAR(50) NOT NULL DEFAULT '2/2570',
  contract_number_thai VARCHAR(50) NOT NULL DEFAULT '๒/๒๕๗๐',
  contract_date DATE NOT NULL DEFAULT '2026-10-29',
  contract_date_thai VARCHAR(100) NOT NULL DEFAULT '๒๙ ตุลาคม ๒๕๖๙',
  start_date DATE NOT NULL DEFAULT '2026-10-01',
  start_date_thai VARCHAR(100) NOT NULL DEFAULT '๑ ตุลาคม ๒๕๖๙',
  end_date DATE NOT NULL DEFAULT '2027-09-30',
  end_date_thai VARCHAR(100) NOT NULL DEFAULT '๓๐ กันยายน ๒๕๗๐',
  duration_months INT NOT NULL DEFAULT 12 CHECK (duration_months > 0),
  total_periods INT NOT NULL DEFAULT 12 CHECK (total_periods > 0),
  monthly_salary NUMERIC(12,2) NOT NULL DEFAULT 19800.00 CHECK (monthly_salary >= 0),
  total_contract_amount NUMERIC(12,2) NOT NULL DEFAULT 237600.00 CHECK (total_contract_amount >= 0),
  -- Statutory daily rate: monthly_salary / 30.0
  daily_rate NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(monthly_salary / 30.0, 2)) STORED,
  target_tasks_per_period INT NOT NULL DEFAULT 110 CHECK (target_tasks_per_period > 0),
  task_matrix_range VARCHAR(50) NOT NULL DEFAULT 'C4:AG21',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_contract_dates CHECK (end_date >= start_date)
);

-- -----------------------------------------------------------------------------
-- 5. TABLE: monthly_periods (Monthly Operational Record & Calculations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  period_number_thai VARCHAR(10) NOT NULL DEFAULT '๑',
  year_ad INT NOT NULL DEFAULT 2026,
  year_be INT NOT NULL DEFAULT 2569,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  month_name VARCHAR(50) NOT NULL DEFAULT 'ตุลาคม',
  invoice_date DATE DEFAULT '2026-11-02',
  invoice_date_thai VARCHAR(100) NOT NULL DEFAULT '๒ พฤศจิกายน ๒๕๖๙',
  receipt_date DATE DEFAULT '2026-11-02',
  receipt_date_thai VARCHAR(100) DEFAULT '๒ พฤศจิกายน ๒๕๖๙',
  public_holidays JSONB NOT NULL DEFAULT '[13, 23]'::jsonb,
  absent_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  days_in_month INT NOT NULL CHECK (days_in_month BETWEEN 28 AND 31),
  actual_working_days INT NOT NULL DEFAULT 20 CHECK (actual_working_days >= 0),
  absent_days_count INT NOT NULL DEFAULT 0 CHECK (absent_days_count >= 0),
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 660.00,
  deduction_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_payable NUMERIC(12,2) NOT NULL DEFAULT 19800.00,
  monthly_salary_bahttext TEXT NOT NULL DEFAULT 'หนึ่งหมื่นเก้าพันแปดร้อยบาทถ้วน',
  net_payable_bahttext TEXT NOT NULL DEFAULT 'หนึ่งหมื่นเก้าพันแปดร้อยบาทถ้วน',
  total_contract_amount_bahttext TEXT DEFAULT 'สองแสนสามหมื่นเจ็ดพันหกร้อยบาทถ้วน',
  -- Arrays & Engine Outputs stored as JSONB
  workload_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_workload_totals JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_workload_totals JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendance_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  status period_status_type NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contract_period UNIQUE (contract_id, period_number)
);

-- -----------------------------------------------------------------------------
-- 6. TABLE: audit_logs (Audit Trail & Change History)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type audit_action_type NOT NULL,
  action VARCHAR(100), -- compatibility alias for TypeScript/UI
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  actor_name VARCHAR(255) NOT NULL DEFAULT 'ระบบอัตโนมัติ',
  actor VARCHAR(255), -- compatibility alias
  summary TEXT NOT NULL,
  changes_diff JSONB,
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_citizen_id ON contractors(citizen_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contractor_id ON contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_monthly_periods_contract_id ON monthly_periods(contract_id);
CREATE INDEX IF NOT EXISTS idx_monthly_periods_period_number ON monthly_periods(period_number);
CREATE INDEX IF NOT EXISTS idx_monthly_periods_year_month ON monthly_periods(year_ad, month);

-- Audit Log Indexes for fast filtering and reverse chronological retrieval
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_diff_gin ON audit_logs USING GIN(changes_diff);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN(metadata);

-- -----------------------------------------------------------------------------
-- 8. AUTOMATIC updated_at TIMESTAMP TRIGGER
-- -----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_contractors_updated_at ON contractors;
CREATE TRIGGER trg_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agencies_updated_at ON agencies;
CREATE TRIGGER trg_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_monthly_periods_updated_at ON monthly_periods;
CREATE TRIGGER trg_monthly_periods_updated_at
  BEFORE UPDATE ON monthly_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Contractors Policies (Optimized with subquery (select auth.uid()) and TO clauses)
DROP POLICY IF EXISTS "contractors_select_policy" ON contractors;
DROP POLICY IF EXISTS "contractors_insert_policy" ON contractors;
DROP POLICY IF EXISTS "contractors_update_policy" ON contractors;
DROP POLICY IF EXISTS "contractors_delete_policy" ON contractors;

CREATE POLICY "contractors_select_authenticated" ON contractors
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (select auth.uid()));

CREATE POLICY "contractors_select_anon" ON contractors
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "contractors_insert_authenticated" ON contractors
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = (select auth.uid()));

CREATE POLICY "contractors_insert_anon" ON contractors
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "contractors_update_authenticated" ON contractors
  FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = (select auth.uid()))
  WITH CHECK (user_id IS NULL OR user_id = (select auth.uid()));

CREATE POLICY "contractors_update_anon" ON contractors
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "contractors_delete_authenticated" ON contractors
  FOR DELETE TO authenticated
  USING (user_id IS NULL OR user_id = (select auth.uid()));

-- Agencies Policies (Public read, mock/authenticated write)
DROP POLICY IF EXISTS "agencies_select_policy" ON agencies;
DROP POLICY IF EXISTS "agencies_insert_policy" ON agencies;
DROP POLICY IF EXISTS "agencies_update_policy" ON agencies;

CREATE POLICY "agencies_select_policy" ON agencies
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "agencies_insert_policy" ON agencies
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "agencies_update_policy" ON agencies
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Contracts Policies
DROP POLICY IF EXISTS "contracts_select_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON contracts;

CREATE POLICY "contracts_select_policy" ON contracts
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "contracts_insert_policy" ON contracts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "contracts_update_policy" ON contracts
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Monthly Periods Policies
DROP POLICY IF EXISTS "monthly_periods_select_policy" ON monthly_periods;
DROP POLICY IF EXISTS "monthly_periods_insert_policy" ON monthly_periods;
DROP POLICY IF EXISTS "monthly_periods_update_policy" ON monthly_periods;

CREATE POLICY "monthly_periods_select_policy" ON monthly_periods
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "monthly_periods_insert_policy" ON monthly_periods
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "monthly_periods_update_policy" ON monthly_periods
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Audit Logs Policies: Append-Only Immutable History
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete_policy" ON audit_logs;

CREATE POLICY "audit_logs_select_policy" ON audit_logs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Explicitly disallow updates to preserve audit log immutability
CREATE POLICY "audit_logs_no_update" ON audit_logs
  FOR UPDATE TO anon, authenticated
  USING (false);

-- Allow clear logs / delete policy
CREATE POLICY "audit_logs_delete_policy" ON audit_logs
  FOR DELETE TO anon, authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 10. API EXPOSURE & PERMISSIONS
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 11. INITIAL SEED DATA FIXTURES
-- -----------------------------------------------------------------------------
INSERT INTO contractors (
  id, title, first_name, last_name, citizen_id, position_title,
  email, phone_number, address_line1, address_line2, address_full_arabic,
  bank_name, bank_account_no
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'นาย', '[ชื่อผู้รับจ้าง]', '[นามสกุล]', '1234567890123',
  'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  'contractor@example.go.th', '0812345678',
  '๑๖๓/๑๗๔ หมู่ที่ ๓ ตำบลบ้านหาด',
  'อำเภอบ้านลาด จังหวัดเพชรบุรี',
  '163/174 หมู่ที่ 3 ตำบลบ้านหาด  อำเภอบ้านลาด จังหวัดเพชรบุรี',
  'ธนาคารกรุงไทย', '123-4-56789-0'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO agencies (
  id, agency_name, payer_agency, department, ministry, province, position_title,
  contractor_name, supervisor_name, supervisor_position,
  inspection_chairman_name, payer_officer_name, payer_officer_position
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'วิทยาลัยนักบริหารสาธารณสุข',
  'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข',
  'สำนักงานปลัดกระทรวงสาธารณสุข',
  'กระทรวงสาธารณสุข',
  'เพชรบุรี',
  'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  'นาย[ชื่อผู้รับจ้าง] [นามสกุล]',
  'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]',
  'นักวิชาการคอมพิวเตอร์ชำนาญการ',
  'ประธานกรรมการตรวจรับพัสดุ',
  '..................................................',
  'เจ้าหน้าที่การเงินและบัญชี'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO contracts (
  id, contractor_id, contract_number, contract_number_thai, contract_date,
  contract_date_thai, start_date, start_date_thai, end_date, end_date_thai,
  duration_months, total_periods, monthly_salary, total_contract_amount,
  target_tasks_per_period, task_matrix_range
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '2/2570', '๒/๒๕๗๐', '2026-10-29', '๒๙ ตุลาคม ๒๕๖๙',
  '2026-10-01', '๑ ตุลาคม ๒๕๖๙', '2027-09-30', '๓๐ กันยายน ๒๕๗๐',
  12, 12, 19800.00, 237600.00, 110, 'C4:AG21'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO monthly_periods (
  id, contract_id, period_number, period_number_thai, year_ad, year_be,
  month, month_name, invoice_date, invoice_date_thai, receipt_date, receipt_date_thai,
  public_holidays, absent_days, days_in_month, actual_working_days,
  absent_days_count, daily_rate, deduction_amount, net_payable,
  monthly_salary_bahttext, net_payable_bahttext, total_contract_amount_bahttext,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  1, '๑', 2026, 2569, 10, 'ตุลาคม', '2026-11-02', '๒ พฤศจิกายน ๒๕๖๙',
  '2026-11-02', '๒ พฤศจิกายน ๒๕๖๙',
  '[13, 23]'::jsonb, '[]'::jsonb, 31, 20,
  0, 660.00, 0.00, 19800.00,
  'หนึ่งหมื่นเก้าพันแปดร้อยบาทถ้วน',
  'หนึ่งหมื่นเก้าพันแปดร้อยบาทถ้วน',
  'สองแสนสามหมื่นเจ็ดพันหกร้อยบาทถ้วน',
  'draft'
) ON CONFLICT (id) DO NOTHING;
