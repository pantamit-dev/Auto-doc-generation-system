/**
 * src/app/api/auth/login/route.ts
 * ==============================================================================
 * Email & Password Authentication Endpoint via Supabase Auth
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import type { AuthUser } from '@/types/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: cleanEmail,
      password: String(password),
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบใหม่อีกครั้ง' },
        { status: 401 }
      );
    }

    const authUserRecord = authData.user;

    // 2. Fetch contractor profile linked to this user_id or email
    let contractorRecord = null;
    const { data: contractorByUserId } = await supabaseAdmin
      .from('contractors')
      .select('*')
      .eq('user_id', authUserRecord.id)
      .maybeSingle();

    if (contractorByUserId) {
      contractorRecord = contractorByUserId;
    } else {
      const { data: contractorByEmail } = await supabaseAdmin
        .from('contractors')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (contractorByEmail) {
        // Link user_id to this contractor record
        const { data: updatedContractor } = await supabaseAdmin
          .from('contractors')
          .update({ user_id: authUserRecord.id, updated_at: new Date().toISOString() })
          .eq('id', contractorByEmail.id)
          .select()
          .single();
        contractorRecord = updatedContractor || contractorByEmail;
      }
    }

    // 3. Fallback: If no contractor record exists, create one
    if (!contractorRecord) {
      const userMeta = authUserRecord.user_metadata || {};
      const firstName = userMeta.first_name || cleanEmail.split('@')[0];
      const lastName = userMeta.last_name || '';
      const role = userMeta.role === 'admin' ? 'admin' : 'member';

      const { data: newContractor } = await supabaseAdmin
        .from('contractors')
        .insert({
          user_id: authUserRecord.id,
          title: 'นาย',
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`.trim(),
          email: cleanEmail,
          role: role,
          status: 'active',
          position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
        })
        .select()
        .single();

      contractorRecord = newContractor;
    }

    const authUser: AuthUser = {
      id: contractorRecord?.id || authUserRecord.id,
      user_id: authUserRecord.id,
      line_user_id: contractorRecord?.line_user_id || undefined,
      email: cleanEmail,
      role: (contractorRecord?.role === 'admin' ? 'admin' : 'member'),
      status: contractorRecord?.status || 'active',
      display_name: contractorRecord?.display_name || `${contractorRecord?.first_name || ''} ${contractorRecord?.last_name || ''}`.trim() || cleanEmail,
      full_name: contractorRecord?.full_name || `${contractorRecord?.first_name || ''} ${contractorRecord?.last_name || ''}`.trim() || cleanEmail,
      avatar_url: contractorRecord?.avatar_url || null,
      citizen_id: contractorRecord?.citizen_id || null,
      position_title: contractorRecord?.position_title || 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
      created_at: contractorRecord?.created_at,
      updated_at: contractorRecord?.updated_at,
    };

    // 4. Create signed session token and cookie
    const token = createSessionToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      message: 'เข้าสู่ระบบสำเร็จ',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[Login API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
