'use client';

/**
 * src/components/layout/Header.tsx
 * ==============================================================================
 * Top Navigation Header with Period Badge, Quick Print, Admin Button & Profile
 * ==============================================================================
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CalendarDays, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  RefreshCw,
  Shield,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useSession } from '@/lib/auth/useSession';

export interface HeaderProps {
  className?: string;
  agencyName?: string;
  payerAgency?: string;
  periodText?: string;
  contractorName?: string;
  hasDeduction?: boolean;
  tasksTotal?: number;
  onRefreshCalculations?: () => void;
}

export function Header({
  className = '',
  agencyName = 'วิทยาลัยนักบริหารสาธารณสุข',
  payerAgency = 'กองบริหารการคลัง สำนักงานปลัดกระทรวงสาธารณสุข',
  periodText = 'งวดที่ 1/2567 (ตุลาคม 2566)',
  contractorName = 'นาย[ชื่อผู้รับจ้าง] [นามสกุล]',
  hasDeduction = false,
  tasksTotal = 110,
  onRefreshCalculations,
}: HeaderProps) {
  const { user, isAdmin, isAuthenticated, logout } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayName = user?.display_name || user?.full_name || contractorName;
  const avatarUrl = user?.avatar_url;

  return (
    <header
      role="banner"
      className={`h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-xs z-30 ${className}`}
    >
      {/* Left: Government Unit Branding */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-sm md:text-base lg:text-lg font-bold text-slate-800 truncate leading-tight">
              {agencyName}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 truncate hidden sm:block">
              {payerAgency}
            </p>
          </div>
        </Link>
      </div>

      {/* Right: Period Badge & Quick Actions */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Current Period Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
          <CalendarDays className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">{periodText}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{tasksTotal} ชิ้นงาน</span>
          <span className="text-slate-300">|</span>
          {hasDeduction ? (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              มีหักวันลา
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              เต็มจำนวน
            </span>
          )}
        </div>

        {/* Recalculate / Sync Action */}
        {onRefreshCalculations && (
          <button
            type="button"
            onClick={onRefreshCalculations}
            title="คำนวณใหม่"
            aria-label="คำนวณข้อมูลเงินเดือนและภาระงานใหม่"
            className="p-2.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Admin Panel Button (Visible for Admins) */}
        {isAdmin && (
          <Link
            href="/admin"
            title="ไปยังแผงควบคุมผู้ดูแลระบบ"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs md:text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="hidden sm:inline">Admin Panel</span>
          </Link>
        )}

        {/* Quick Print Button */}
        <Link
          href="/preview"
          title="ศูนย์พิมพ์เอกสารราชการ"
          aria-label="ไปที่ศูนย์พิมพ์เอกสารราชการ"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
        >
          <Printer className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">พิมพ์เอกสาร</span>
        </Link>

        {/* User Profile & Menu */}
        <div className="relative">
          {isAuthenticated ? (
            <div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors min-h-[44px] cursor-pointer"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-slate-300 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {displayName[0] || 'U'}
                  </div>
                )}
                <span className="font-semibold max-w-[100px] md:max-w-[130px] truncate hidden xs:inline">
                  {displayName}
                </span>
                {isAdmin ? (
                  <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    ADMIN
                  </span>
                ) : (
                  <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                    MEMBER
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกผู้รับจ้าง'}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>ข้อมูลส่วนตัว</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-medium transition-colors"
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>แผงควบคุมระบบ (Admin)</span>
                    </Link>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors min-h-[44px]"
            >
              <User className="w-4 h-4" />
              <span>เข้าสู่ระบบ (LINE)</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
