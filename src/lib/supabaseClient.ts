import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon key – replace with your own values when the DB is provisioned.
// For now we use placeholder values so the code compiles and can be mocked in tests.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
