/**
 * src/app/api/auth/logout/route.ts
 * ==============================================================================
 * Logs out user by clearing session cookies (both salary_auth_session and session_line_id)
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'ออกจากระบบเรียบร้อยแล้ว',
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete('session_line_id');
  return response;
}
