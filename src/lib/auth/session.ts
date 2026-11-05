/**
 * src/lib/auth/session.ts
 * ==============================================================================
 * Secure Session & Token Management for Next.js App Router
 * ==============================================================================
 */

import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import type { AuthUser, SessionPayload } from '@/types/auth';

export const SESSION_COOKIE_NAME = 'salary_auth_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'thai-gov-salary-session-secret-key-2026-safe-fallback';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

/**
 * Creates a signed session token containing user payload.
 */
export function createSessionToken(user: AuthUser): string {
  const expires_at = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload: SessionPayload = { user, expires_at };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(encodedPayload);
  const signature = hmac.digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  try {
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(encodedPayload);
    const expectedSig = hmac.digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(json);

    // Check expiry
    if (payload.expires_at < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies session from NextRequest cookies or Authorization header.
 */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  // 1. Check Cookie
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    const verified = verifySessionToken(cookie.value);
    if (verified) return verified;
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifySessionToken(token);
    if (verified) return verified;
  }

  return null;
}

/**
 * Helper to check if session user has admin privilege.
 */
export function isAdminUser(session: SessionPayload | null): boolean {
  return session?.user?.role === 'admin' && session?.user?.status === 'active';
}
