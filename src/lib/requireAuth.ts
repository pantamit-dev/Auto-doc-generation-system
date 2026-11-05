import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook that redirects unauthenticated users to the login page.
 * Should be called at the top of any page component that requires auth.
 */
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
      }
    };
    checkAuth();
  }, [router]);
}
