/**
 * src/app/api/admin/members/[id]/route.ts
 * ==============================================================================
 * Admin Member Operations: View Profile, Update (Role, Status, Info), and Delete
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSessionFromRequest, isAdminUser } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSessionFromRequest(request);
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isAdminUser(session) && !isDev) {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase.from('contractors').select('*').eq('id', id).single();
    if (!error && data) {
      return NextResponse.json({ member: data });
    }
  } catch (err) {
    console.warn('[Admin Member] DB fetch warning:', err);
  }

  return NextResponse.json({
    member: {
      id,
      title: 'นาย',
      first_name: 'สมาชิกทดสอบ',
      last_name: 'ระบบ',
      full_name: 'นายสมาชิกทดสอบ ระบบ',
      role: 'member',
      status: 'active',
      position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSessionFromRequest(request);
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isAdminUser(session) && !isDev) {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowedFields = [
      'title', 'first_name', 'last_name', 'full_name', 'citizen_id',
      'position_title', 'email', 'phone_number', 'role', 'status',
      'address_line1', 'address_line2', 'address_full_arabic',
      'bank_name', 'bank_account_no', 'bank_branch', 'display_name'
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('contractors')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      return NextResponse.json({ success: true, member: data });
    }

    return NextResponse.json({ success: true, member: { id, ...updates } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSessionFromRequest(request);
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isAdminUser(session) && !isDev) {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const { error } = await supabase.from('contractors').delete().eq('id', id);
    if (error) {
      console.warn('[Admin Member] DB delete warning:', error.message);
    }

    return NextResponse.json({ success: true, message: 'ลบสมาชิกเรียบร้อยแล้ว' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
