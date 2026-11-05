'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCircle2, 
  FileSpreadsheet, 
  CalendarClock, 
  Printer 
} from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exactMatch?: boolean;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    id: 'dashboard',
    label: 'หน้าหลัก',
    href: '/',
    icon: LayoutDashboard,
    exactMatch: true,
  },
  {
    id: 'profile',
    label: 'ข้อมูล',
    href: '/profile',
    icon: UserCircle2,
  },
  {
    id: 'workload',
    label: 'ภาระงาน',
    href: '/workload',
    icon: FileSpreadsheet,
  },
  {
    id: 'attendance',
    label: 'เวลาทำงาน',
    href: '/attendance',
    icon: CalendarClock,
  },
  {
    id: 'preview',
    label: 'พิมพ์เอกสาร',
    href: '/preview',
    icon: Printer,
  },
];

export interface MobileBottomNavProps {
  className?: string;
  items?: MobileNavItem[];
}

export function MobileBottomNav({
  className = '',
  items = MOBILE_NAV_ITEMS,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const isItemActive = (item: MobileNavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav
      aria-label="แถบนำทางหลักบนมือถือ"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg bottom-nav-safe no-print ${className}`}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {items.map((item) => {
          const active = isItemActive(item);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-w-[48px] min-h-[48px] h-full flex flex-col items-center justify-center gap-1 transition-colors duration-150 rounded-lg active:bg-slate-100 ${
                active
                  ? 'text-sky-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <IconComponent className={`w-5 h-5 transition-transform ${active ? 'scale-110 text-sky-600' : 'text-slate-500'}`} />
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-sky-600" />
                )}
              </div>
              <span className="text-xs font-medium leading-tight text-center truncate max-w-[68px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
