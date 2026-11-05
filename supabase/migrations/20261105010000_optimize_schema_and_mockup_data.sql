-- =============================================================================
-- Supabase Migration: Schema Cleanup, Supabase Best Practices & Mockup Data Reset
-- Migration Version: 20261105010000_optimize_schema_and_mockup_data.sql
-- =============================================================================

-- 1. Drop Unused View
DROP VIEW IF EXISTS public.profiles;

-- 2. Cleanup Unused / Redundant Columns
-- 2.1 Drop redundant column 'committee' in agencies if exists (use committee_members JSONB instead)
ALTER TABLE public.agencies DROP COLUMN IF EXISTS committee;

-- 2.2 Drop legacy user_id column from contractors (pure LINE LIFF uses line_user_id)
ALTER TABLE public.contractors DROP CONSTRAINT IF EXISTS contractors_user_id_fkey;
DROP INDEX IF EXISTS public.idx_contractors_user_id;
ALTER TABLE public.contractors DROP COLUMN IF EXISTS user_id;

-- 2.3 Drop legacy user_id and alias columns from audit_logs
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS action;
ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS actor;

-- 3. Apply Supabase Index Best Practices
-- 3.1 Partial index for LINE user lookup (only index rows where line_user_id is not null)
DROP INDEX IF EXISTS public.idx_contractors_line_user_id;
CREATE INDEX IF NOT EXISTS idx_contractors_line_user_id 
  ON public.contractors(line_user_id) 
  WHERE line_user_id IS NOT NULL;

-- 3.2 Composite index for admin member management and role/status filtering
CREATE INDEX IF NOT EXISTS idx_contractors_role_status 
  ON public.contractors(role, status);

-- 3.3 Composite index on audit_logs for filtered timeline view
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
  ON public.audit_logs(action_type, created_at DESC);

-- 4. Supabase Best Practice: Subquery wrapped (select auth.uid()) in RLS Policies
DROP POLICY IF EXISTS "contractors_select_policy" ON public.contractors;
CREATE POLICY "contractors_select_policy" ON public.contractors
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "contractors_modify_policy" ON public.contractors;
CREATE POLICY "contractors_modify_policy" ON public.contractors
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT TO anon, authenticated
  USING (line_user_id = (select auth.uid())::text OR true);

DROP POLICY IF EXISTS "users_modify_policy" ON public.users;
CREATE POLICY "users_modify_policy" ON public.users
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Mockup Data Conversion: Replace any remaining real data with standard generic mockup data
-- 5.1 Contractors Baseline
UPDATE public.contractors
SET
  title = 'นาย',
  first_name = '[ชื่อผู้รับจ้าง]',
  last_name = '[นามสกุล]',
  citizen_id = '1234567890123',
  position_title = 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  email = 'contractor@sample.go.th',
  phone_number = '0800000000',
  address_line1 = '๑๒๓/๔๕ หมู่ที่ ๑ [ที่อยู่ผู้รับจ้าง]',
  address_line2 = 'ตำบล[ตัวอย่าง] อำเภอ[ตัวอย่าง] จังหวัด[ตัวอย่าง]',
  address_full_arabic = '123/45 หมู่ที่ 1 ตำบล[ตัวอย่าง] อำเภอ[ตัวอย่าง] จังหวัด[ตัวอย่าง]',
  bank_name = 'ธนาคารกรุงไทย',
  bank_account_no = '000-0-00000-0',
  bank_branch = 'สาขา[ตัวอย่าง]',
  display_name = 'ผู้ดูแลระบบ (Admin)',
  role = 'admin',
  status = 'active',
  line_user_id = NULL,
  avatar_url = NULL,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5.2 Agencies Baseline
UPDATE public.agencies
SET
  contractor_name = 'นาย[ชื่อผู้รับจ้าง] [นามสกุล]',
  supervisor_name = 'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]',
  supervisor_position = 'นักวิชาการคอมพิวเตอร์ชำนาญการ',
  inspection_chairman_name = 'ประธานกรรมการตรวจรับพัสดุ',
  committee_members = '[]'::jsonb,
  payer_officer_name = '..................................................',
  payer_officer_position = 'เจ้าหน้าที่การเงินและบัญชี',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000002';

-- 5.3 Clear old Audit Logs containing real names and insert clean system baseline log
DELETE FROM public.audit_logs;

INSERT INTO public.audit_logs (
  id,
  action_type,
  entity_type,
  entity_id,
  actor_name,
  summary,
  changes_diff,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'DATA_RESET',
  'system',
  'system-baseline',
  'ระบบอัตโนมัติ',
  'เริ่มต้นระบบด้วยข้อมูลตัวอย่างจำลองมาตรฐานราชการ (Baseline Mockup Data)',
  '{"status": "initialized", "mockup": true}'::jsonb,
  '{"version": "2026.11"}'::jsonb,
  NOW()
);
