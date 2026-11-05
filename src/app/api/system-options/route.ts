/**
 * src/app/api/system-options/route.ts
 * ==============================================================================
 * API for fetching and creating dynamic form dropdown options
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_SYSTEM_OPTIONS } from '@/lib/systemOptions/defaultOptions';
import { getSessionFromRequest, isAdminUser } from '@/lib/auth/session';
import type { SystemOption } from '@/types/systemOptions';

// In-memory working copy if DB is unreachable
let inMemoryOptions: SystemOption[] = [...DEFAULT_SYSTEM_OPTIONS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const includeInactive = searchParams.get('all') === 'true';

  try {
    let query = supabase.from('system_options').select('*').order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return NextResponse.json({ options: data });
    }
  } catch (err) {
    console.warn('[System Options] DB fetch error, falling back to memory/defaults:', err);
  }

  // Fallback to in-memory options
  let filtered = inMemoryOptions;
  if (category) {
    filtered = filtered.filter((opt) => opt.category === category);
  }
  if (!includeInactive) {
    filtered = filtered.filter((opt) => opt.is_active);
  }

  return NextResponse.json({ options: filtered });
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const isDev = process.env.NODE_ENV !== 'production';

  // Check admin authorization (allow in dev if session absent for initial seeding/tests)
  if (!isAdminUser(session) && !isDev) {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { category, label, value, sort_order, is_default } = body;

    if (!category || !label || !value) {
      return NextResponse.json(
        { error: 'category, label, and value are required fields' },
        { status: 400 }
      );
    }

    const newOption = {
      category: category.trim(),
      label: label.trim(),
      value: value.trim(),
      sort_order: typeof sort_order === 'number' ? sort_order : 100,
      is_active: true,
      is_default: Boolean(is_default),
    };

    // Try persisting to Supabase
    const { data, error } = await supabase
      .from('system_options')
      .insert(newOption)
      .select('*')
      .single();

    if (!error && data) {
      inMemoryOptions.push(data);
      return NextResponse.json({ success: true, option: data }, { status: 201 });
    }

    // Fallback in-memory persistence
    const fallbackOption: SystemOption = {
      id: `opt-${Date.now()}`,
      ...newOption,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryOptions.push(fallbackOption);

    return NextResponse.json({ success: true, option: fallbackOption }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create option' }, { status: 500 });
  }
}
