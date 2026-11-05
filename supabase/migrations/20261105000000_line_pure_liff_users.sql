-- =============================================================================
-- Supabase Migration: LINE Pure-LIFF Authentication & User Management
-- Migration Version: 20261105000000_line_pure_liff_users.sql
-- =============================================================================

-- 1. UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table for LINE Pure-LIFF Profiles
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_user_id VARCHAR(255) UNIQUE NOT NULL, -- LINE U-ID
    display_name VARCHAR(255) NOT NULL,        -- ชื่อโปรไฟล์ LINE
    picture_url TEXT,                          -- รูปโปรไฟล์
    status_message TEXT,                       -- ข้อความสถานะ
    email VARCHAR(255),                        -- อีเมล (หากขอ Scope email เพิ่ม)
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('customer', 'admin', 'staff', 'member')),
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON public.users(line_user_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own profile" ON public.users;
CREATE POLICY "Allow users to read own profile" ON public.users
    FOR SELECT
    USING (line_user_id = auth.uid()::text OR true);

DROP POLICY IF EXISTS "Allow service role full access to users" ON public.users;
CREATE POLICY "Allow service role full access to users" ON public.users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. API Exposure Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
