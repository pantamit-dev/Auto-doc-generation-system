/**
 * src/app/api/auth/register/route.ts
 * ==============================================================================
 * Registration Endpoint for Member Sign Up (Minimal Fields First)
 * Fields: 1. Email, 2. Password, 3. First Name, 4. Last Name
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import type { AuthUser } from '@/types/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, firstName, lastName } = body;

    // 1. Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (อีเมล, รหัสผ่าน, ชื่อ, นามสกุล)' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanFirstName = String(firstName).trim();
    const cleanLastName = String(lastName).trim();
    const cleanPassword = String(password);

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = userList?.users?.find(u => u.email === cleanEmail);

    if (existingAuthUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ' },
        { status: 409 }
      );
    }

    // 3. Create user in Supabase Auth (Auto-confirmed)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        first_name: cleanFirstName,
        last_name: cleanLastName,
        role: 'member',
      },
    });

    if (createError || !newUser.user) {
      console.error('[Register Auth Error]:', createError);
      return NextResponse.json(
        { error: createError?.message || 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    const userId = newUser.user.id;

    // 4. Create Profile in public.contractors table
    const { data: newContractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .insert({
        user_id: userId,
        title: 'นาย',
        first_name: cleanFirstName,
        last_name: cleanLastName,
        display_name: `${cleanFirstName} ${cleanLastName}`,
        email: cleanEmail,
        role: 'member',
        status: 'active',
        position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
      })
      .select()
      .single();

    if (contractorError) {
      console.warn('[Register Contractor Insert Warning]:', contractorError);
    }

    // 5. Add Audit Log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: userId,
        action_type: 'USER_REGISTER',
        entity_type: 'contractors',
        entity_id: newContractor?.id || userId,
        actor_name: `${cleanFirstName} ${cleanLastName}`,
        summary: `ลงทะเบียนสมาชิกใหม่สำเร็จ: ${cleanEmail}`,
      });
    } catch (auditErr) {
      console.warn('[Register Audit Log Warning]:', auditErr);
    }

    // 6. Construct AuthUser payload
    const authUser: AuthUser = {
      id: newContractor?.id || userId,
      user_id: userId,
      email: cleanEmail,
      role: 'member',
      status: 'active',
      display_name: `${cleanFirstName} ${cleanLastName}`,
      full_name: `${cleanFirstName} ${cleanLastName}`,
      position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
      created_at: newContractor?.created_at || new Date().toISOString(),
      updated_at: newContractor?.updated_at || new Date().toISOString(),
    };

    // 7. Generate Session Cookie for Auto-login
    const token = createSessionToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      redirectTo: '/profile',
      message: 'ลงทะเบียนสำเร็จ กำลังเข้าสู่ระบบ...',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('[Register API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    );
  }
}
