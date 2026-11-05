-- =============================================================================
-- Supabase Migration: Membership System, LINE Auth, Admin & Dynamic Options
-- Migration Version: 20261104000000_membership_and_dynamic_options.sql
-- =============================================================================

-- 1. Extend contractors table with membership & LINE auth fields
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Update default fixture contractor to have admin role for testing
UPDATE contractors
SET role = 'admin', status = 'active', display_name = 'ผู้ดูแลระบบ (พันธมิตร)'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Create system_options table for dynamic form dropdowns
CREATE TABLE IF NOT EXISTS system_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'title', 'position', 'agency', 'payer_agency', 'bank', 'leave_type'
  label VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_options_category ON system_options(category, is_active, sort_order);

-- 3. Create system_settings table for global system configurations
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  label VARCHAR(255) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 4. Enable RLS
ALTER TABLE system_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_options_select_policy" ON system_options;
CREATE POLICY "system_options_select_policy" ON system_options
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "system_options_modify_policy" ON system_options;
CREATE POLICY "system_options_modify_policy" ON system_options
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "system_settings_select_policy" ON system_settings;
CREATE POLICY "system_settings_select_policy" ON system_settings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "system_settings_modify_policy" ON system_settings;
CREATE POLICY "system_settings_modify_policy" ON system_settings
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. API Exposure Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 6. Initial Dynamic Options Seed Fixtures
INSERT INTO system_options (category, label, value, sort_order, is_default) VALUES
  -- Titles (คำนำหน้าชื่อ)
  ('title', 'นาย', 'นาย', 1, true),
  ('title', 'นาง', 'นาง', 2, false),
  ('title', 'นางสาว', 'นางสาว', 3, false),
  ('title', 'ว่าที่ร้อยตรี', 'ว่าที่ร้อยตรี', 4, false),
  ('title', 'ดร.', 'ดร.', 5, false),

  -- Positions (ตำแหน่งงานตามสัญญา)
  ('position', 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์', 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์', 1, true),
  ('position', 'เจ้าหน้าที่ธุรการ', 'เจ้าหน้าที่ธุรการ', 2, false),
  ('position', 'นักวิชาการสาธารณสุข', 'นักวิชาการสาธารณสุข', 3, false),
  ('position', 'เจ้าพนักงานการเงินและบัญชี', 'เจ้าพนักงานการเงินและบัญชี', 4, false),
  ('position', 'เจ้าพนักงานพัสดุ', 'เจ้าพนักงานพัสดุ', 5, false),

  -- Agencies (ส่วนราชการที่ปฏิบัติงาน)
  ('agency', 'วิทยาลัยนักบริหารสาธารณสุข', 'วิทยาลัยนักบริหารสาธารณสุข', 1, true),
  ('agency', 'สำนักงานปลัดกระทรวงสาธารณสุข', 'สำนักงานปลัดกระทรวงสาธารณสุข', 2, false),
  ('agency', 'กรมการแพทย์', 'กรมการแพทย์', 3, false),
  ('agency', 'กรมควบคุมโรค', 'กรมควบคุมโรค', 4, false),
  ('agency', 'สำนักงานสาธารณสุขจังหวัดเพชรบุรี', 'สำนักงานสาธารณสุขจังหวัดเพชรบุรี', 5, false),

  -- Payer Agencies (ส่วนราชการผู้จ่ายเงิน)
  ('payer_agency', 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข', 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข', 1, true),
  ('payer_agency', 'กลุ่มงานการเงินและบัญชี สำนักงานสาธารณสุขจังหวัดเพชรบุรี', 'กลุ่มงานการเงินและบัญชี สำนักงานสาธารณสุขจังหวัดเพชรบุรี', 2, false),
  ('payer_agency', 'ฝ่ายการเงิน วิทยาลัยนักบริหารสาธารณสุข', 'ฝ่ายการเงิน วิทยาลัยนักบริหารสาธารณสุข', 3, false),

  -- Banks (ธนาคาร)
  ('bank', 'ธนาคารกรุงไทย', 'ธนาคารกรุงไทย', 1, true),
  ('bank', 'ธนาคารกสิกรไทย', 'ธนาคารกสิกรไทย', 2, false),
  ('bank', 'ธนาคารไทยพาณิชย์', 'ธนาคารไทยพาณิชย์', 3, false),
  ('bank', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงเทพ', 4, false),
  ('bank', 'ธนาคารออมสิน', 'ธนาคารออมสิน', 5, false),
  ('bank', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารกรุงศรีอยุธยา', 6, false),
  ('bank', 'ธนาคารทหารไทยธนชาต (ttb)', 'ธนาคารทหารไทยธนชาต (ttb)', 7, false),

  -- Leave Types (ประเภทการลา)
  ('leave_type', 'ลาป่วย', 'sick', 1, true),
  ('leave_type', 'ลากิจส่วนตัว', 'personal', 2, false),
  ('leave_type', 'ขาดงาน / ไม่มาปฏิบัติงาน', 'absent', 3, false)
ON CONFLICT DO NOTHING;

-- 7. Initial System Settings Seed Fixtures
INSERT INTO system_settings (setting_key, setting_value, category, label, description) VALUES
  ('statutory_divisor', '30'::jsonb, 'calculation', 'ตัวหารอัตราค่าจ้างรายวันตามระเบียบราชการ', 'ระเบียบราชการกำหนดให้ใช้ 30 วันเป็นตัวหารคำนวณอัตราค่าจ้างต่อวันเสมอ'),
  ('target_tasks_per_period', '110'::jsonb, 'workload', 'จำนวนชิ้นงานเป้าหมายต่องวด', 'จำนวนชิ้นงานมาตรฐานที่ต้องปฏิบัติงานในแต่ละงวด (ค่ามาตรฐาน 110 ชิ้นงาน)'),
  ('working_hours', '{"time_in_min": "07:30", "time_in_max": "08:30", "time_out_min": "16:30", "time_out_max": "19:00"}'::jsonb, 'attendance', 'ช่วงเวลาปฏิบัติงานมาตรฐาน', 'กรอบเวลาลงชื่อเข้าปฏิบัติงาน (07:30-08:30) และลงชื่อกลับ (16:30-19:00)')
ON CONFLICT (setting_key) DO NOTHING;
