/**
 * src/lib/auth/lineAuth.ts
 * ==============================================================================
 * LINE Login & Pure-LIFF Token Verification & User Synchronization
 * ==============================================================================
 */

import { supabase } from '@/lib/supabaseClient';
import type { AuthUser, LineProfile, UserRole } from '@/types/auth';

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';
const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

export const LINE_CONFIG = {
  channelId: process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CLIENT_ID || process.env.NEXT_PUBLIC_LIFF_ID?.split('-')[0] || '',
  channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET || '',
  liffId: process.env.NEXT_PUBLIC_LIFF_ID || '',
  redirectUri: process.env.LINE_REDIRECT_URI || 'http://localhost:3000/api/auth/line/callback',
};

/**
 * Verifies a LINE ID Token directly with LINE official endpoint.
 */
export async function verifyLineIdToken(idToken: string, channelId: string) {
  const res = await fetch(LINE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LINE ID token verification failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Builds the LINE Login OAuth authorization URL (fallback / unit test helper).
 */
export function buildLineAuthUrl(state: string, customRedirectUri?: string): string {
  const redirectUri = customRedirectUri || LINE_CONFIG.redirectUri;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CONFIG.channelId,
    redirect_uri: redirectUri,
    state,
    scope: 'profile openid email',
  });
  return `${LINE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges authorization code for LINE access token.
 */
export async function exchangeLineCode(code: string, redirectUri?: string): Promise<{ access_token: string; id_token?: string }> {
  const uri = redirectUri || LINE_CONFIG.redirectUri;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: uri,
    client_id: LINE_CONFIG.channelId,
    client_secret: LINE_CONFIG.channelSecret,
  });

  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LINE token exchange failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Fetches user profile from LINE API using access token.
 */
export async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
  const res = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LINE profile fetch failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Upserts a contractor record in Supabase corresponding to the LINE user.
 */
export async function syncContractorWithLineProfile(
  profile: LineProfile,
  requestedRole: UserRole = 'member'
): Promise<AuthUser> {
  // Check if member with this line_user_id already exists in Supabase
  const { data: existingUser, error: findError } = await supabase
    .from('contractors')
    .select('*')
    .eq('line_user_id', profile.userId)
    .maybeSingle();

  if (findError) {
    console.warn('[LINE Auth] Failed to query existing contractor:', findError.message);
  }

  if (existingUser) {
    // Update existing user display name & avatar if changed
    const { data: updated, error: updateError } = await supabase
      .from('contractors')
      .update({
        display_name: profile.displayName || existingUser.display_name,
        avatar_url: profile.pictureUrl || existingUser.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id)
      .select('*')
      .single();

    if (!updateError && updated) {
      return {
        id: updated.id,
        user_id: updated.user_id,
        line_user_id: updated.line_user_id,
        email: updated.email,
        role: (updated.role as UserRole) || 'member',
        status: (updated.status as any) || 'active',
        display_name: updated.display_name || profile.displayName,
        avatar_url: updated.avatar_url,
        citizen_id: updated.citizen_id,
        position_title: updated.position_title,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      };
    }
  }

  // Create new contractor record
  const nameParts = (profile.displayName || 'ผู้ใช้งาน LINE').trim().split(/\s+/);
  const firstName = nameParts[0] || 'ผู้ใช้งาน';
  const lastName = nameParts.slice(1).join(' ') || 'LINE';

  const newRecord = {
    line_user_id: profile.userId,
    display_name: profile.displayName,
    avatar_url: profile.pictureUrl || null,
    title: 'นาย',
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    role: requestedRole,
    status: 'active',
    position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
    address_line1: '๑๖๓/๑๗๔ หมู่ที่ ๓ ตำบลบ้านหาด',
    address_line2: 'อำเภอบ้านลาด จังหวัดเพชรบุรี',
    address_full_arabic: '163/174 หมู่ที่ 3 ตำบลบ้านหาด อำเภอบ้านลาด จังหวัดเพชรบุรี',
    bank_name: 'ธนาคารกรุงไทย',
    bank_account_no: '123-4-56789-0',
  };

  const { data: created, error: insertError } = await supabase
    .from('contractors')
    .insert(newRecord)
    .select('*')
    .single();

  if (insertError || !created) {
    console.warn('[LINE Auth] Failed to insert contractor, falling back to local object:', insertError?.message);
    return {
      id: '00000000-0000-0000-0000-000000000001',
      line_user_id: profile.userId,
      role: requestedRole,
      status: 'active',
      display_name: profile.displayName,
      avatar_url: profile.pictureUrl || null,
      position_title: newRecord.position_title,
    };
  }

  return {
    id: created.id,
    user_id: created.user_id,
    line_user_id: created.line_user_id,
    email: created.email,
    role: (created.role as UserRole) || 'member',
    status: (created.status as any) || 'active',
    display_name: created.display_name || profile.displayName,
    avatar_url: created.avatar_url,
    citizen_id: created.citizen_id,
    position_title: created.position_title,
    created_at: created.created_at,
    updated_at: created.updated_at,
  };
}

/**
 * Generates mock profiles for fast unit testing.
 */
export function getMockUserProfile(role: UserRole = 'member'): AuthUser {
  if (role === 'admin') {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      line_user_id: 'U_mock_admin_001',
      role: 'admin',
      status: 'active',
      display_name: 'ผู้ดูแลระบบ (Admin)',
      email: 'admin@salarydoc.gov.th',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      citizen_id: '1234567890123',
      position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์ (Admin)',
    };
  }

  return {
    id: '00000000-0000-0000-0000-000000000005',
    line_user_id: 'U_mock_member_002',
    role: 'member',
    status: 'active',
    display_name: 'สมชาย รักชาติ (LINE Member)',
    email: 'somchai@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=somchai',
    citizen_id: '3769900987654',
    position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
  };
}
