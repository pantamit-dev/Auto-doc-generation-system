import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import type { AuthUser } from '@/types/auth';

/**
 * POST /api/auth/line/verify
 * ==============================================================================
 * Pure LIFF ID Token Verification & Supabase Synchronization Endpoint
 * ==============================================================================
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // 1. Extract Channel ID from LIFF ID prefix (e.g. 2012302150-qByGFLrm -> 2012302150)
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';
    const channelId = process.env.LINE_LOGIN_CHANNEL_ID || liffId.split('-')[0];

    if (!channelId) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_LIFF_ID is not configured on server' },
        { status: 500 }
      );
    }

    // 2. Verify ID Token directly with LINE official OAuth 2.1 endpoint
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: channelId,
      }),
    });

    if (!verifyRes.ok) {
      const errDetail = await verifyRes.text();
      console.error('[LINE Verify API Error]:', verifyRes.status, errDetail);
      return NextResponse.json(
        { error: 'Invalid LINE ID Token', detail: errDetail },
        { status: 401 }
      );
    }

    const payload = await verifyRes.json();
    const lineUserId: string = payload.sub;
    const displayName: string = payload.name || 'LINE User';
    const pictureUrl: string | null = payload.picture || null;
    const email: string | null = payload.email || null;

    // 3. Upsert into public.users table as defined in Master Specification
    let userRecord = null;
    try {
      const { data: user, error: dbError } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            line_user_id: lineUserId,
            display_name: displayName,
            picture_url: pictureUrl,
            email: email,
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'line_user_id' }
        )
        .select()
        .single();

      if (dbError) {
        console.warn('[Supabase Users Upsert Warning]:', dbError.message);
      } else {
        userRecord = user;
      }
    } catch (usersErr) {
      console.warn('[Supabase Users Upsert Exception]:', usersErr);
    }

    // 4. Synchronize with contractors table for full salary calculation & doc features
    let authUser: AuthUser = {
      id: userRecord?.id || '00000000-0000-0000-0000-000000000001',
      line_user_id: lineUserId,
      email: email,
      role: (userRecord?.role === 'admin' ? 'admin' : 'member'),
      status: 'active',
      display_name: displayName,
      avatar_url: pictureUrl,
    };

    try {
      // Find existing contractor by line_user_id
      const { data: existingContractor } = await supabaseAdmin
        .from('contractors')
        .select('*')
        .eq('line_user_id', lineUserId)
        .maybeSingle();

      if (existingContractor) {
        // Update display_name and avatar_url
        const { data: updated } = await supabaseAdmin
          .from('contractors')
          .update({
            display_name: displayName,
            avatar_url: pictureUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContractor.id)
          .select()
          .single();

        const activeContractor = updated || existingContractor;
        authUser = {
          id: activeContractor.id,
          line_user_id: lineUserId,
          email: activeContractor.email || email,
          role: (activeContractor.role === 'admin' ? 'admin' : 'member'),
          status: activeContractor.status || 'active',
          display_name: activeContractor.display_name || displayName,
          full_name: activeContractor.full_name,
          avatar_url: activeContractor.avatar_url || pictureUrl,
          citizen_id: activeContractor.citizen_id,
          position_title: activeContractor.position_title,
          created_at: activeContractor.created_at,
          updated_at: activeContractor.updated_at,
        };
      } else {
        // Check if there is an unassigned default contractor to link
        const { data: defaultContractor } = await supabaseAdmin
          .from('contractors')
          .select('*')
          .is('line_user_id', null)
          .limit(1)
          .maybeSingle();

        if (defaultContractor) {
          const { data: linked } = await supabaseAdmin
            .from('contractors')
            .update({
              line_user_id: lineUserId,
              display_name: displayName,
              avatar_url: pictureUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', defaultContractor.id)
            .select()
            .single();

          const activeContractor = linked || defaultContractor;
          authUser = {
            id: activeContractor.id,
            line_user_id: lineUserId,
            email: activeContractor.email || email,
            role: (activeContractor.role === 'admin' ? 'admin' : 'member'),
            status: activeContractor.status || 'active',
            display_name: activeContractor.display_name || displayName,
            full_name: activeContractor.full_name,
            avatar_url: activeContractor.avatar_url || pictureUrl,
            citizen_id: activeContractor.citizen_id,
            position_title: activeContractor.position_title,
            created_at: activeContractor.created_at,
            updated_at: activeContractor.updated_at,
          };
        } else {
          // Create new contractor record for new LINE user
          const { data: newContractor } = await supabaseAdmin
            .from('contractors')
            .insert({
              line_user_id: lineUserId,
              display_name: displayName,
              avatar_url: pictureUrl,
              email: email,
              role: 'member',
              status: 'active',
              title: 'นาย',
              first_name: displayName,
              last_name: '',
              full_name: displayName,
              position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
            })
            .select()
            .single();

          if (newContractor) {
            authUser = {
              id: newContractor.id,
              line_user_id: lineUserId,
              email: newContractor.email || email,
              role: newContractor.role,
              status: newContractor.status,
              display_name: newContractor.display_name || displayName,
              full_name: newContractor.full_name,
              avatar_url: newContractor.avatar_url || pictureUrl,
              citizen_id: newContractor.citizen_id,
              position_title: newContractor.position_title,
              created_at: newContractor.created_at,
              updated_at: newContractor.updated_at,
            };
          }
        }
      }
    } catch (contractorErr) {
      console.warn('[Supabase Contractor Sync Exception]:', contractorErr);
    }

    // 5. Set Secure HTTP-Only Session Cookies
    const cookieStore = await cookies();
    
    // Cookie 1: session_line_id (as specified in Master Prompt 5.2)
    cookieStore.set('session_line_id', lineUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Cookie 2: salary_auth_session (signed token for full workspace features)
    const sessionToken = createSessionToken(authUser);
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        line_user_id: lineUserId,
        display_name: authUser.display_name,
        picture_url: authUser.avatar_url,
        email: authUser.email,
        role: authUser.role,
        full_name: authUser.full_name,
        position_title: authUser.position_title,
      },
    });
  } catch (err: any) {
    console.error('[LINE Auth Verify Exception]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
