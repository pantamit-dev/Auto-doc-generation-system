'use client';

/**
 * src/components/auth/RegisterModal.tsx
 * ==============================================================================
 * Registration Modal Panel (Designed with /ui-ux-pro-max guidelines)
 * Minimal Initial Fields:
 * 1. Email (อีเมล)
 * 2. Password (รหัสผ่าน)
 * 3. First Name (ชื่อ)
 * 4. Last Name (นามสกุล)
 * Additional contract and agency details can be completed after sign-in.
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useLiff } from '@/components/auth/LiffProvider';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const router = useRouter();
  const { refreshUser } = useLiff();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setErrorMessage(null);
      setSuccessMessage(null);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Client Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบและนำท่านไปยังหน้าโปรไฟล์...');
      await refreshUser();

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        router.push(data.redirectTo || '/profile');
      }, 1200);
    } catch (err: any) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header with Gradient Accent */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 id="register-modal-title" className="text-lg md:text-xl font-bold font-heading tracking-tight">
                  ลงทะเบียนสมาชิกใหม่
                </h3>
                <p className="text-xs text-sky-100/90">
                  ระบบสร้างเอกสารราชการผู้รับจ้างเหมาบริการ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="ปิดหน้าต่างลงทะเบียน"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-sky-50/80 border-b border-sky-100 px-6 py-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sky-900 leading-relaxed">
            กรอกข้อมูลเบื้องต้น 4 รายการเพื่อเปิดใช้งานบัญชี จากนั้นท่านสามารถกรอกรายละเอียดสัญญาจ้างและข้อมูลหน่วยงานเพิ่มเติมในหน้าโปรไฟล์
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs md:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs md:text-sm animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Name Fields (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อจริง <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  ref={firstInputRef}
                  type="text"
                  required
                  placeholder="เช่น สมชาย"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="เช่น ใจดี"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              อีเมลสำหรับเข้าสู่ระบบ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              ใช้สำหรับเข้าสู่ระบบและรับข้อมูลเอกสารราชการ
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              กำหนดรหัสผ่าน <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                minLength={6}
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
            <p className="mt-1 text-[11px] text-slate-500">
              ความยาวอย่างน้อย 6 ตัวอักษร (ตัวเลขหรือตัวอักษร)
            </p>
          </div>

          {/* Privacy & Security Note */}
          <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>ข้อมูลของท่านได้รับการเข้ารหัสและเก็บรักษาบน Supabase ตามมาตรฐานความปลอดภัย</span>
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-1/3 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-2/3 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังลงทะเบียน...</span>
                </>
              ) : (
                <>
                  <span>ยืนยันการลงทะเบียน</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
