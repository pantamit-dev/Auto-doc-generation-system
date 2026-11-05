'use client';

/**
 * src/app/page.tsx
 * ==============================================================================
 * LINE Mini App & Government Salary Document System - Unified Dashboard
 * - Pure-LIFF Authentication Flow (Silent in LINE App, LIFF login on External)
 * - LINE Profile synchronization with Supabase
 * - 4 Core Workspace Action Cards
 * - 5 Interactive Document Preview Cards (Mockup in Red font)
 * - Developer Credit: "ผู้พัฒนา : ©️P'save" (กระทรวงสาธารณสุข)
 * ==============================================================================
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Printer,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  LogOut,
  Sparkles,
  Smartphone,
  ArrowRight,
  FileSpreadsheet,
  UserCircle2,
  CalendarClock,
  ExternalLink,
  ChevronRight,
  UserPlus,
  LogIn,
  Mail
} from 'lucide-react';
import { useLiff } from '@/components/auth/LiffProvider';
import { DocPreviewModal } from '@/components/modals/DocPreviewModal';
import { RegisterModal } from '@/components/auth/RegisterModal';

interface PreviewDocItem {
  id: string;
  docId: string;
  code: string;
  title: string;
  description: string;
  orientation: 'A4 แนวตั้ง' | 'A4 แนวนอน';
  accentColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DOCUMENT_ITEMS: PreviewDocItem[] = [
  {
    id: 'doc-01',
    docId: 'DOC-01',
    code: 'DOC-01',
    title: 'แบบใบสำคัญรับเงิน',
    description: 'เอกสารหลักฐานการรับเงินค่าจ้างเหมาบริการ พร้อมสูตรคำนวณเงินสุทธิและการหักเงินกรณีมีวันลาตามระเบียบราชการ',
    orientation: 'A4 แนวตั้ง',
    accentColor: 'from-blue-600 to-indigo-700',
    icon: FileText,
  },
  {
    id: 'doc-02a',
    docId: 'DOC-02A',
    code: 'DOC-02A',
    title: 'ใบส่งมอบงาน / แจ้งหนี้ (เต็มจำนวน)',
    description: 'หนังสือนำส่งมอบผลงาน 110 ชิ้นงาน และขอเบิกจ่ายเงินเดือนเต็มงวด โดยไม่มีการหักวันลา',
    orientation: 'A4 แนวตั้ง',
    accentColor: 'from-emerald-600 to-teal-700',
    icon: CheckCircle2,
  },
  {
    id: 'doc-02b',
    docId: 'DOC-02B',
    code: 'DOC-02B',
    title: 'ใบส่งมอบงาน / แจ้งหนี้ (หักวันลา)',
    description: 'หนังสือนำส่งมอบงานกรณีมีวันลา โดยระบุข้อความหักเงินและจำนวนวันลาด้วยตัวเลขไทยอย่างถูกต้อง',
    orientation: 'A4 แนวตั้ง',
    accentColor: 'from-amber-600 to-orange-700',
    icon: AlertCircle,
  },
  {
    id: 'doc-03',
    docId: 'DOC-03',
    code: 'DOC-03',
    title: 'รายงานการปฏิบัติงาน 18 กลุ่มงาน × 31 วัน',
    description: 'ตารางเมทริกซ์จัดสรรภาระงาน 18 กิจกรรม รวม 110 งานในเดือน เว้นวันหยุดราชการและวันลาอัตโนมัติ',
    orientation: 'A4 แนวนอน',
    accentColor: 'from-violet-600 to-purple-800',
    icon: FileSpreadsheet,
  },
  {
    id: 'doc-04',
    docId: 'DOC-04',
    code: 'DOC-04',
    title: 'รับรองการมาปฏิบัติงานและบันทึกเวลา',
    description: 'บันทึกเวลาเข้า-ออกงาน (07:30–08:30 และ 16:30–19:00) และสรุปยอดวันปฏิบัติงานจริงและวันลา',
    orientation: 'A4 แนวตั้ง',
    accentColor: 'from-cyan-600 to-blue-700',
    icon: Clock,
  },
];

export default function HomePage() {
  const { isLoggedIn, user, loading, isInClient, login, logout } = useLiff();
  const [selectedDoc, setSelectedDoc] = useState<PreviewDocItem | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // 1. Loading State during LIFF Initialization
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg" />
        <div className="text-center space-y-1">
          <p className="text-base font-bold text-white font-heading">กำลังเชื่อมต่อ LINE LIFF...</p>
          <p className="text-xs text-slate-400">Pure LIFF SDK Authentication</p>
        </div>
      </div>
    );
  }

  // 2. Authenticated State: Unified LINE Mini App Dashboard
  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-slate-100/80 text-slate-800 font-sans flex flex-col pb-24 md:pb-12">
        {/* Mobile Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-sm sm:text-base text-slate-900 leading-tight block">
                  ระบบสร้างเอกสารจ้างเหมาราชการ
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  วิทยาลัยนักบริหารสาธารณสุข
                </span>
              </div>
            </div>

            {/* In-Client Environment Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{isInClient ? 'เปิดใน LINE App' : 'External Browser'}</span>
              <span className="sm:hidden">{isInClient ? 'LINE App' : 'Browser'}</span>
            </div>
          </div>
        </header>

        {/* Main Dashboard Container */}
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
          {/* LINE Profile Card */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Profile Avatar with Emerald Ring */}
              <div className="relative shrink-0">
                {user.picture_url ? (
                  <img
                    src={user.picture_url}
                    alt={user.display_name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-emerald-500 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 flex items-center justify-center border-4 border-emerald-500 shadow-md">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* User Identity Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                    {user.display_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้รับจ้างเหมาบริการ'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {user.position_title || 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์'}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                  {user.line_user_id ? (
                    <span>LINE UID: {user.line_user_id}</span>
                  ) : (
                    <span className="text-sky-600 font-sans font-semibold">เข้าสู่ระบบด้วยอีเมล</span>
                  )}
                  {user.email && <span>• {user.email}</span>}
                </div>

                {/* Verified Sync Status Banner */}
                <div className="mt-3 w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-left">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      {user.line_user_id ? 'ยืนยันตัวตนสำเร็จ (Verified with LINE)' : 'เข้าสู่ระบบสำเร็จ (Supabase Auth)'}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      ข้อมูลบัญชีและโปรไฟล์เชื่อมโยงกับฐานข้อมูล Supabase เรียบร้อยแล้ว
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout Action */}
              <div className="sm:self-start">
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors text-xs font-semibold cursor-pointer min-h-[40px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </section>

          {/* 4 Core Workspace Action Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                เมนูจัดการเอกสารและระบบงาน
              </h2>
              <span className="text-xs text-slate-500">เลือกรายการเพื่อเริ่มปฏิบัติงาน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tile 1: Profile */}
              <Link
                href="/profile"
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-sky-400 transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <UserCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wide">
                      ข้อมูลสัญญา
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                      ข้อมูลผู้รับจ้าง & สัญญา
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      แก้ไขข้อมูลส่วนตัว ตำแหน่ง เลขบัญชี และระยะเวลาสัญญา
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>

              {/* Tile 2: Workload */}
              <Link
                href="/workload"
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-violet-400 transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wide">
                      110 ชิ้นงาน
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-violet-700 transition-colors">
                      ตารางภาระงาน 18 กลุ่มงาน
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      จัดสรรชิ้นงาน 110 รายการใน 31 วัน เว้นวันหยุดราชการ
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>

              {/* Tile 3: Attendance */}
              <Link
                href="/attendance"
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <CalendarClock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                      เวลาทำงาน & วันลา
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                      บันทึกเวลาปฏิบัติงาน
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      บันทึกเวลาเข้า-ออกงาน จัดการวันลา และคำนวณเงินหัก
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>

              {/* Tile 4: Preview & Print */}
              <Link
                href="/preview"
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                      มาตรฐาน A4
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                      ตรวจสอบ & พิมพ์เอกสาร 5 รายการ
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      ออกเอกสารเบิกจ่าย ใบส่งมอบงาน 02A/02B พร้อมพิมพ์
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>
            </div>
          </section>

          {/* 5 Interactive Document Preview Modals Section */}
          <section className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                  เปิดดูตัวอย่างเอกสารราชการ (Mockup Preview)
                </h2>
                <p className="text-xs text-slate-500">
                  คลิกเพื่อเปิดดูแบบฟอร์มเอกสารที่มีข้อมูลตัวอย่างจำลอง (ตัวอักษรสีแดง)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {DOCUMENT_ITEMS.map((doc) => {
                const Icon = doc.icon;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 text-left hover:border-sky-400 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${doc.accentColor} text-white flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-sky-700">{doc.code}</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.title}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{doc.orientation}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        {/* Document Preview Modal */}
        {selectedDoc && (
          <DocPreviewModal
            isOpen={Boolean(selectedDoc)}
            onClose={() => setSelectedDoc(null)}
            docId={selectedDoc.docId}
            title={selectedDoc.title}
            code={selectedDoc.code}
            orientation={selectedDoc.orientation}
          />
        )}
      </div>
    );
  }

  // 3. Unauthenticated State: Public Landing Page with LINE Pure-LIFF Authentication
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Public Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 leading-tight block">
                ระบบสร้างเอกสารจ้างเหมาราชการ
              </span>
              <span className="text-xs text-slate-500 leading-tight block">
                กระทรวงสาธารณสุข
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>เข้าสู่ระบบด้วยอีเมล</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border-2 border-sky-600 hover:bg-sky-50 text-sky-700 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs min-h-[44px] cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>ลงทะเบียน</span>
            </button>

            <button
              type="button"
              onClick={login}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049b42] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow min-h-[44px] cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.572.39.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.956z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย LINE</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-2 sm:pt-6">
          {/* Developer Credit Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin-slow" />
            <span>ผู้พัฒนา : ©️P&apos;save</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-700 font-medium">กระทรวงสาธารณสุข</span>
          </div>

          {/* Main Welcome Heading */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
            ยินดีต้อนรับสู่ระบบสร้างเอกสารจ้างเหมาราชการ
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            ระบบจัดทำและคำนวณเอกสารเบิกจ่ายค่าตอบแทน ตารางภาระงาน 110 รายการ และบันทึกเวลาปฏิบัติงาน 
            สำหรับผู้รับจ้างเหมาบริการภาครัฐอย่างถูกต้องตามระเบียบ 100% เชื่อมต่อ LINE Mini App และ Supabase
          </p>

          {/* Dual Auth Login CTA Banner */}
          <div className="pt-2 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg">
              <button
                type="button"
                onClick={login}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049b42] text-white rounded-2xl text-sm sm:text-base font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 min-h-[50px] cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.572.39.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.956z"/>
                </svg>
                <span>เข้าสู่ระบบด้วย LINE</span>
              </button>

              <Link
                href="/auth/login"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-2xl text-sm sm:text-base font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 min-h-[50px]"
              >
                <Mail className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วยอีเมล</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">ยังไม่มีบัญชีผู้ใช้งาน?</span>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 underline underline-offset-4 cursor-pointer focus:outline-none"
              >
                ลงทะเบียนสมาชิกใหม่ที่นี่
              </button>
            </div>
            <p className="text-xs text-slate-400">
              * เมื่อเปิดผ่าน LINE App ระบบจะเข้าสู่ระบบแบบอัตโนมัติ (Auto In-App Login)
            </p>
          </div>
        </section>

        {/* 5 Document Preview Cards Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
                <Printer className="w-3.5 h-3.5" />
                <span>ตัวอย่างเอกสารราชการมาตรฐาน</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                เปิดดูตัวอย่างเอกสารทั้ง 5 รูปแบบ (Data Mockup)
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                คลิกการ์ดเพื่อเปิดดูตัวอย่างฟอร์มเอกสารที่มีการกรอกข้อมูลจำลอง (ตัวอักษร{' '}
                <span className="text-red-600 font-bold">สีแดง</span> คือข้อมูลตัวอย่างจำลอง)
              </p>
            </div>
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex-shrink-0">
              มาตรฐานขนาด A4 (Portrait / Landscape)
            </div>
          </div>

          {/* 5 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOCUMENT_ITEMS.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-xl hover:border-sky-400 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${doc.accentColor} flex items-center justify-center text-white shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.orientation}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-sky-700 tracking-wide uppercase">
                        {doc.code}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors mt-0.5">
                        {doc.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                        {doc.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-700">
                    <span className="inline-flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      เปิดดูตัวอย่างฟอร์ม
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>ระบบสร้างเอกสารราชการผู้รับจ้างเหมาบริการ © กระทรวงสาธารณสุข • ผู้พัฒนา : ©️P&apos;save</p>
      </footer>

      {/* Interactive Modal */}
      {selectedDoc && (
        <DocPreviewModal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          docId={selectedDoc.docId}
          title={selectedDoc.title}
          code={selectedDoc.code}
          orientation={selectedDoc.orientation}
        />
      )}

      {/* Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
