'use client';

/**
 * src/lib/auth/useSession.ts
 * ==============================================================================
 * React hook for consuming and managing user authentication session
 * Integrated with LINE Pure-LIFF Provider and Supabase Session
 * ==============================================================================
 */

import { useLiff } from '@/components/auth/LiffProvider';
import type { AuthUser } from '@/types/auth';

export function useSession() {
  const { user: liffUser, isLoggedIn, loading, logout: liffLogout, login: liffLogin, refreshUser } = useLiff();

  const authUser: AuthUser | null = liffUser
    ? {
        id: liffUser.id || '00000000-0000-0000-0000-000000000001',
        user_id: liffUser.user_id,
        line_user_id: liffUser.line_user_id,
        email: liffUser.email,
        role: liffUser.role === 'admin' ? 'admin' : 'member',
        status: 'active',
        display_name: liffUser.display_name,
        full_name: liffUser.full_name,
        avatar_url: liffUser.picture_url,
        citizen_id: liffUser.citizen_id,
        position_title: liffUser.position_title || 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
      }
    : null;

  const refresh = async () => {
    await refreshUser();
  };

  return {
    user: authUser,
    isAuthenticated: isLoggedIn && Boolean(authUser),
    isAdmin: authUser?.role === 'admin',
    isLoading: loading,
    refresh,
    logout: liffLogout,
    login: liffLogin,
  };
}
