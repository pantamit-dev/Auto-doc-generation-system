'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import liff from '@line/liff';

export interface UserProfile {
  id?: string;
  user_id?: string | null;
  line_user_id?: string | null;
  display_name: string;
  picture_url?: string | null;
  email?: string | null;
  role?: 'admin' | 'member' | 'customer' | 'staff';
  full_name?: string | null;
  position_title?: string | null;
  citizen_id?: string | null;
}

interface LiffContextType {
  liff: typeof liff | null;
  isInClient: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isInClient: false,
  isLoggedIn: false,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  setUser: () => {},
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [isInClient, setIsInClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize token with backend verification endpoint
  const verifyTokenWithServer = useCallback(async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoggedIn(true);
        return data.user;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[LiffProvider] Verify failed:', err);
      }
    } catch (err) {
      console.error('[LiffProvider] Verify exception:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          console.error('[LiffProvider] NEXT_PUBLIC_LIFF_ID is not configured');
          if (isMounted) setLoading(false);
          return;
        }

        // Initialize LIFF SDK
        await liff.init({ liffId });
        
        if (!isMounted) return;

        setLiffObject(liff);
        const inClient = liff.isInClient();
        setIsInClient(inClient);

        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          const idToken = liff.getIDToken();

          if (idToken) {
            await verifyTokenWithServer(idToken);
          } else {
            // Fallback: check session API
            const meRes = await fetch('/api/auth/me').catch(() => null);
            if (meRes && meRes.ok) {
              const meData = await meRes.json();
              if (meData.authenticated && isMounted) {
                setUser(meData.user);
              }
            }
          }
        } else {
          // If running inside LINE App, perform automatic silent login
          if (inClient) {
            liff.login();
            return;
          }

          // Outside LINE App: check if user already has an active session cookie
          const meRes = await fetch('/api/auth/me').catch(() => null);
          if (meRes && meRes.ok) {
            const meData = await meRes.json();
            if (meData.authenticated && isMounted) {
              setUser(meData.user);
              setIsLoggedIn(true);
            }
          }
        }
      } catch (err) {
        console.error('[LiffProvider] LIFF initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initLiff();

    return () => {
      isMounted = false;
    };
  }, [verifyTokenWithServer]);

  const refreshUser = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setUser(meData.user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      }
    } catch (err) {
      console.warn('[LiffProvider] refreshUser error:', err);
    }
  }, []);

  const login = () => {
    if (!liffObject) {
      console.warn('[LiffProvider] LIFF object is not initialized yet');
      return;
    }
    if (!liffObject.isLoggedIn()) {
      liffObject.login();
    }
  };

  const logout = async () => {
    try {
      if (liffObject && liffObject.isLoggedIn()) {
        liffObject.logout();
      }
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <LiffContext.Provider
      value={{
        liff: liffObject,
        isInClient,
        isLoggedIn,
        user,
        loading,
        login,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => useContext(LiffContext);
