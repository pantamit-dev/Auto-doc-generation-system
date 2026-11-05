'use client';

/**
 * src/app/auth/login/page.tsx
 * ==============================================================================
 * Official Dual Authentication Portal (LINE LIFF + Email/Password Supabase Auth)
 * - Channel 1: LINE Pure-LIFF Authentication (Auto-login in LINE App)
 * - Channel 2: Email & Password Authentication (Supabase Auth)
 * - Modal Panel: Minimal Member Registration (อีเมล, รหัสผ่าน, ชื่อ, นามสกุล)
 * Designed with /ui-ux-pro-max guidelines.
 * ==============================================================================
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Smartphone,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useLiff } from '@/components/auth/LiffProvider';
import { RegisterModal } from '@/components/auth/RegisterModal';

function LoginContent() {
  const router = useRouter();
  const { isLoggedIn, loading, isInClient, login: liffLogin, refreshUser } = useLiff();

  // Email/Password Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTestAccountHint, setShowTestAccountHint] = useState(false);

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.replace('/');
    }
  }, [loading, isLoggedIn, router]);

  // Handle Email + Password Sign In
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setIsSubmitting(false);
        return;
      }

      // Success: refresh active user context and redirect
      await refreshUser();
      router.replace('/');
    } catch (err: any) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
    }
  };

  // Quick fill test admin credentials
  const fillTestAdmin = () => {
    setEmail('admin@salarydoc.gov.th');
    setPassword('AdminPassword2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 md:bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30 mb-2 border border-sky-400/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight">
            ระบบสร้างเอกสารราชการผู้รับจ้าง
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            วิทยาลัยนักบริหารสาธารณสุข กระทรวงสาธารณสุข
          </p>
        </div>

        {/* Main Card: Dual Authentication Portal */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 overflow-hidden">
          {/* Channel 1: LINE Mini App / LIFF Login */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ช่องทางที่ 1 : เข้าสู่ระบบผ่าน LINE
              </span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium border border-emerald-100">
                <Smartphone className="w-3 h-3 text-emerald-600" />
                <span>{isInClient ? 'LINE App' : 'External'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={liffLogin}
              disabled={loading || isSubmitting}
              className="w-full min-h-[48px] px-5 py-3.5 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049b42] text-white font-bold text-sm md:text-base flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60 cursor-pointer"
            >
              {/* SVG LINE Icon */}
              <svg
                className="w-6 h-6 fill-current flex-shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.365 9.863c.349.002.632.285.634.634v.014c-.004.348-.288.629-.636.63h-2.186v1.442h2.186c.349.002.632.285.634.634v.014c-.004.348-.288.629-.636.63h-2.82c-.349-.002-.632-.285-.634-.634V8.423c.002-.349.285-.632.634-.634h2.82c.349.002.632.285.634.634v.014c-.004.348-.288.629-.636.63h-2.186v1.43h2.186zm-5.746-1.44c.349.002.632.285.634.634v4.757c-.002.349-.285.632-.634.634-.349-.002-.632-.285-.634-.634V8.423c.002-.349.285-.632.634-.634zm-2.04 0c.349.002.632.285.634.634v4.757c-.002.349-.285.632-.634.634-.325-.002-.593-.248-.63-.571l-2.03-2.732v2.669c-.002.349-.285.632-.634.634-.349-.002-.632-.285-.634-.634V8.423c.002-.349.285-.632.634-.634.325.002.593.248.63.571l2.03 2.732V8.423c.002-.349.285-.632.634-.634zm-6.264 0c.349.002.632.285.634.634v4.123h2.186c.349.002.632.285.634.634v.014c-.004.348-.288.629-.636.63h-2.82c-.349-.002-.632-.285-.634-.634V8.423c.002-.349.285-.632.634-.634zM12 2C6.477 2 2 5.925 2 10.767c0 4.318 3.58 7.95 8.428 8.623.328.07.774.217.887.498.102.253.067.65.033 1.008l-.145.874c-.044.267-.206 1.045.917.57 1.123-.475 6.059-3.568 8.267-6.108C21.65 14.73 22 12.834 22 10.767 22 5.925 17.523 2 12 2z" />
              </svg>
              <span>เข้าสู่ระบบด้วย LINE</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-semibold uppercase text-slate-400 tracking-wider">
              หรือเข้าสู่ระบบด้วยอีเมล
            </span>
          </div>

          {/* Channel 2: Email & Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ช่องทางที่ 2 : อีเมลและรหัสผ่าน
              </span>
              <button
                type="button"
                onClick={() => setShowTestAccountHint(!showTestAccountHint)}
                className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1 focus:outline-none"
              >
                <KeyRound className="w-3 h-3" />
                <span>บัญชีทดสอบ Admin</span>
              </button>
            </div>

            {/* Test Admin Account Quick Card */}
            {showTestAccountHint && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-amber-900 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    บัญชีทดสอบเริ่มต้น (Administrator)
                  </span>
                  <button
                    type="button"
                    onClick={fillTestAdmin}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                  >
                    กรอกข้อมูลอัตโนมัติ
                  </button>
                </div>
                <div className="text-[11px] text-amber-800 space-y-0.5 font-mono">
                  <p>อีเมล: <span className="font-bold">admin@salarydoc.gov.th</span></p>
                  <p>รหัสผ่าน: <span className="font-bold">AdminPassword2026!</span></p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมล (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Email Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบด้วยอีเมล</span>
                </>
              )}
            </button>
          </form>

          {/* Section 3: Register Modal Trigger Button */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่?
            </p>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border-2 border-sky-600 hover:bg-sky-50/80 active:bg-sky-100 text-sky-700 font-bold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 focus:ring-sky-100 cursor-pointer shadow-sm hover:shadow"
            >
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>ลงทะเบียนสมาชิกใหม่</span>
            </button>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>จัดเก็บข้อมูลปลอดภัยบน Supabase PostgreSQL และ LINE Official API</span>
        </div>
      </div>

      {/* Registration Modal Panel */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          setIsRegisterOpen(false);
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
          <span className="ml-2 text-sm">กำลังเชื่อมต่อระบบ...</span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
