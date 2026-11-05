'use client';

/**
 * src/components/layout/AppShell.tsx
 * ==============================================================================
 * Master layout controller that conditionally isolates the public landing page 
 * and authentication screens from the internal member workspace and navigation.
 * Fully supports LINE Mini App (Pure-LIFF) and desktop workflows.
 * ==============================================================================
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Header } from '@/components/layout/Header';
import { useLiff } from '@/components/auth/LiffProvider';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isLoggedIn } = useLiff();

  // Route categorization
  const isLanding = pathname === '/';
  const isAuth = pathname.startsWith('/auth');
  const isPrintPage = pathname.startsWith('/print') || pathname.includes('/isolated');

  // 1. Print-specific isolated layout
  if (isPrintPage) {
    return <main className="w-full h-full bg-white">{children}</main>;
  }

  // 2. Auth pages: Clean view without sidebar or header
  if (isAuth) {
    return (
      <div className="min-h-full flex flex-col bg-slate-900 text-slate-800 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  // 3. Home / Landing Page
  if (isLanding) {
    return (
      <div className="min-h-full flex flex-col bg-slate-50 text-slate-800 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <main className="flex-1 w-full">{children}</main>
        {isLoggedIn && (
          <div className="no-print md:hidden">
            <MobileBottomNav />
          </div>
        )}
      </div>
    );
  }

  // 4. Internal Authenticated Workspace: Full navigation with Sidebar, Header & BottomNav
  return (
    <div className="h-full bg-slate-50 text-slate-800 antialiased font-sans flex overflow-hidden">
      {/* Collapsible Desktop Sidebar (Hidden on Mobile & Print) */}
      <div className="no-print hidden md:flex h-full flex-shrink-0">
        <DesktopSidebar />
      </div>

      {/* Main Application Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <div className="no-print flex-shrink-0">
          <Header />
        </div>

        {/* Scrollable Content Workspace */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6 pb-24 md:pb-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Desktop & Print) */}
      <div className="no-print md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
