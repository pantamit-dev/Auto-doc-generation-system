/**
 * src/types/auth.ts
 * ==============================================================================
 * Authentication & Membership Domain Types
 * ==============================================================================
 */

export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'suspended';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

export interface AuthUser {
  id: string; // contractor / member UUID
  user_id?: string | null; // Supabase auth.users UUID
  line_user_id?: string | null;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  display_name: string;
  full_name?: string | null;
  avatar_url?: string | null;
  citizen_id?: string | null;
  position_title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionPayload {
  user: AuthUser;
  token?: string;
  expires_at: number; // Unix timestamp in seconds
}
