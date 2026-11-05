'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCog,
  FileSpreadsheet,
  CalendarClock,
  Printer,
  History,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building2,
  Shield,
} from 'lucide-react';
import { useSession } from '@/lib/auth/useSession';

export interface SidebarRoute {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exactMatch?: boolean;
}

export interface DocumentQuickLink {
  id: string;
  docCode: string;
  title: string;
  href: string;
  orientation: 'portrait' | 'landscape';
  badgeText: string;
}

export const MAIN_ROUTES: SidebarRoute[] = [
  {
    id: 'dashboard',
    label: 'หน้าหลัก (Dashboard)',
    href: '/',
    icon: LayoutDashboard,
    exactMatch: true,
  },
  {
    id: 'profile',
    label: 'ข้อมูลผู้รับจ้าง & หน่วยงาน',
    href: '/profile',
    icon: UserCog,
  },
  {
    id: 'workload',
    label: 'ภาระงาน (Workload Matrix)',
    href: '/workload',
    icon: FileSpreadsheet,
  },
  {
    id: 'attendance',
    label: 'เวลาปฏิบัติงาน & วันหยุด-วันลา',
    href: '/attendance',
    icon: CalendarClock,
  },
  {
    id: 'preview',
    label: 'ระบบตรวจสอบ & พิมพ์เอกสาร',
    href: '/preview',
    icon: Printer,
  },
  {
    id: 'audit',
    label: 'ประวัติการแก้ไข (Audit Logs)',
    href: '/audit',
    icon: History,
  },
];

export const DOCUMENT_QUICK_LINKS: DocumentQuickLink[] = [
  {
    id: 'doc-1',
    docCode: 'DOC-01',
    title: 'แบบใบสำคัญรับเงิน',
    href: '/preview/doc-1',
    orientation: 'portrait',
    badgeText: 'A4 แนวตั้ง',
  },
  {
    id: 'doc-2a',
    docCode: 'DOC-02A',
    title: 'ใบส่งมอบงาน (เต็มจำนวน)',
    href: '/preview/doc-2a',
    orientation: 'portrait',
    badgeText: 'A4 แนวตั้ง',
  },
  {
    id: 'doc-2b',
    docCode: 'DOC-02B',
    title: 'ใบส่งมอบงาน (หักวันลา)',
    href: '/preview/doc-2b',
    orientation: 'portrait',
    badgeText: 'A4 แนวตั้ง',
  },
  {
    id: 'doc-3',
    docCode: 'DOC-03',
    title: 'รายงานการปฏิบัติงาน 18x31',
    href: '/preview/doc-3',
    orientation: 'landscape',
    badgeText: 'A4 แนวนอน',
  },
  {
    id: 'doc-4',
    docCode: 'DOC-04',
    title: 'รับรองการมาปฏิบัติงาน',
    href: '/preview/doc-4',
    orientation: 'portrait',
    badgeText: 'A4 แนวตั้ง',
  },
];

export interface DesktopSidebarProps {
  className?: string;
  agencyTitle?: string;
  subAgencyTitle?: string;
  initialCollapsed?: boolean;
}

export function DesktopSidebar({
  className = '',
  agencyTitle = 'ระบบส่งออกเอกสารเบิกจ่าย',
  subAgencyTitle = 'วิทยาลัยนักบริหารสาธารณสุข',
  initialCollapsed = false,
}: DesktopSidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();
  const { isAdmin } = useSession();

  const isRouteActive = (route: SidebarRoute) => {
    if (route.exactMatch) {
      return pathname === route.href;
    }
    return pathname === route.href || pathname.startsWith(`${route.href}/`);
  };

  const isDocActive = (doc: DocumentQuickLink) => pathname === doc.href;

  return (
    <aside
      aria-label="แถบนำทางหลักด้านข้าง"
      className={`desktop-sidebar relative flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-72'
      } ${className}`}
    >
      {/* Branding Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed ? (
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="font-heading text-base md:text-lg font-bold text-sky-400 truncate leading-tight">
                {agencyTitle}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1 truncate">
              {subAgencyTitle}
            </p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-950 text-sky-300 border border-sky-800">
              ฟอนต์ราชการ: TH Sarabun PSK 100%
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {/* Section: Main System Routes */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider font-heading">
              เมนูหลัก
            </div>
          )}
          <ul className="space-y-1">
            {MAIN_ROUTES.map((route) => {
              const active = isRouteActive(route);
              const IconComponent = route.icon;

              return (
                <li key={route.id}>
                  <Link
                    href={route.href}
                    title={collapsed ? route.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm md:text-base font-medium transition-colors min-h-[48px] md:min-h-[44px] ${
                      active
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{route.label}</span>}
                  </Link>
                </li>
              );
            })}

            {/* Admin Panel Link */}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  title={collapsed ? 'ผู้ดูแลระบบ (Admin Panel)' : undefined}
                  aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm md:text-base font-medium transition-colors min-h-[48px] md:min-h-[44px] ${
                    pathname.startsWith('/admin')
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-300 hover:bg-slate-800 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Shield className={`w-5 h-5 flex-shrink-0 ${pathname.startsWith('/admin') ? 'text-white' : 'text-indigo-400'}`} />
                  {!collapsed && <span className="truncate">จัดการระบบ (Admin Panel)</span>}
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Section: 5 Government Document Templates with Orientation Badges */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider font-heading">
              เอกสารราชการ 5 รายการ
            </div>
          )}
          <ul className="space-y-1">
            {DOCUMENT_QUICK_LINKS.map((doc) => {
              const active = isDocActive(doc);

              return (
                <li key={doc.id}>
                  <Link
                    href={doc.href}
                    title={collapsed ? `${doc.title} (${doc.badgeText})` : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs md:text-sm transition-colors min-h-[48px] md:min-h-[44px] ${
                      active
                        ? 'bg-slate-800 text-sky-300 border border-sky-700/50'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`w-4 h-4 flex-shrink-0 ${active ? 'text-sky-400' : 'text-slate-500'}`} />
                      {!collapsed && <span className="truncate">{doc.title}</span>}
                    </div>

                    {!collapsed && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] md:text-xs font-medium flex-shrink-0 ${
                          doc.orientation === 'landscape'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {doc.badgeText}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Collapse / Expand Toggle Button Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
        {!collapsed && (
          <div className="text-[11px] text-slate-500 truncate">
            v1.0.0 (REA Production)
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto md:mx-0 min-w-[48px] min-h-[48px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
