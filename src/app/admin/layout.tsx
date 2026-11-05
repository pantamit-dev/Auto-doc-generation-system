'use client';

/**
 * src/app/admin/layout.tsx
 * ==============================================================================
 * Admin Panel Shell Layout: Role Guard & Sub-Navigation Tabs
 * ==============================================================================
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  ListFilter, 
  Sliders, 
  LayoutDashboard, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { useSession } from '@/lib/auth/useSession';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading } = useSession();

  const navItems = [
    { href: '/admin', label: 'ภาพรวมระบบ', icon: LayoutDashboard, exact: true },
    { href: '/admin/members', label: 'จัดการสมาชิก', icon: Users },
    { href: '/admin/options', label: 'ตัวเลือก Dropdown', icon: ListFilter },
    { href: '/admin/settings', label: 'การตั้งค่าระบบ', icon: Sliders },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Shield className="w-8 h-8 text-sky-600" />
          <p className="text-sm">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
        </div>
      </div>
    );
  }

  // Unauthorized screen if not admin
  if (!isAdmin && process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 md:p-8 rounded-2xl border border-red-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงส่วนนี้</h2>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          หน้า Admin Panel สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณคือ <strong>{user?.display_name || 'สมาชิกทั่วไป'}</strong>
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าหลัก</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold font-heading text-slate-800">
                แผงควบคุมผู้ดูแลระบบ (Admin Panel)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                ADMIN
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500">
              ระบบจัดการสมาชิก, จัดการตัวเลือก Dropdown และตั้งค่าระบบกลาง
            </p>
          </div>
        </div>

        {/* Back to App Link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าข้อมูลผู้รับจ้าง</span>
        </Link>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-xl overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Content Area */}
      <div>{children}</div>
    </div>
  );
}
