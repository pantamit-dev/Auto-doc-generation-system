/**
 * src/app/api/system-settings/route.ts
 * ==============================================================================
 * API for System Settings management
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_SYSTEM_SETTINGS } from '@/lib/systemOptions/defaultOptions';
import { getSessionFromRequest, isAdminUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (!error && data && data.length > 0) {
      return NextResponse.json({ settings: data });
    }
  } catch (err) {
    console.warn('[System Settings] DB fetch warning:', err);
  }

  return NextResponse.json({ settings: Object.values(DEFAULT_SYSTEM_SETTINGS) });
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isAdminUser(session) && !isDev) {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { setting_key, setting_value, label, description } = body;

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json({ error: 'setting_key and setting_value are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key,
        setting_value,
        label: label || setting_key,
        description,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' })
      .select('*')
      .single();

    if (!error && data) {
      return NextResponse.json({ success: true, setting: data });
    }

    return NextResponse.json({
      success: true,
      setting: { setting_key, setting_value, label, description },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Settings update failed' }, { status: 500 });
  }
}
