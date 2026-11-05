/**
 * src/app/api/auth/me/route.ts
 * ==============================================================================
 * Retrieves current active authenticated user from session cookie or session_line_id
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  // 1. Check signed session token
  const session = getSessionFromRequest(request);

  if (session && session.user) {
    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  }

  // 2. Check session_line_id cookie fallback
  const lineUserId = request.cookies.get('session_line_id')?.value;
  if (lineUserId) {
    try {
      const { data: contractor } = await supabaseAdmin
        .from('contractors')
        .select('*')
        .eq('line_user_id', lineUserId)
        .maybeSingle();

      if (contractor) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: contractor.id,
            line_user_id: contractor.line_user_id,
            email: contractor.email,
            role: contractor.role,
            status: contractor.status,
            display_name: contractor.display_name,
            full_name: contractor.full_name,
            avatar_url: contractor.avatar_url,
            citizen_id: contractor.citizen_id,
            position_title: contractor.position_title,
          },
        });
      }

      // Check users table fallback
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('line_user_id', lineUserId)
        .maybeSingle();

      if (userRecord) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: userRecord.id,
            line_user_id: userRecord.line_user_id,
            email: userRecord.email,
            role: userRecord.role === 'admin' ? 'admin' : 'member',
            status: 'active',
            display_name: userRecord.display_name,
            avatar_url: userRecord.picture_url,
          },
        });
      }
    } catch (err) {
      console.warn('[api/auth/me fallback error]:', err);
    }
  }

  return NextResponse.json({
    authenticated: false,
    user: null,
  });
}
