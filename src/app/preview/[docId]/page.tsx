'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, AlertCircle, FileDown, Lock } from 'lucide-react';
import { DocumentRenderer, normalizeDocId } from '@/components/templates/DocumentRenderer';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { useLiff } from '@/components/auth/LiffProvider';

interface DocPreviewPageProps {
  params: {
    docId: string;
  };
}

interface DocMetadata {
  code: string;
  title: string;
  orientation: string;
}

const docTitles: Record<string, DocMetadata> = {
  // DOC-01: แบบใบสำคัญรับเงิน (Receipt Voucher - A4 Portrait)
  'doc-1': { code: 'DOC-01', title: 'แบบใบสำคัญรับเงิน', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },
  'doc-01': { code: 'DOC-01', title: 'แบบใบสำคัญรับเงิน', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },

  // DOC-02A: ใบส่งมอบงาน เต็มจำนวน (Delivery Note Full Amount - A4 Portrait)
  'doc-2a': { code: 'DOC-02A', title: 'ใบส่งมอบงาน (เต็มจำนวน)', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },
  'doc-02a': { code: 'DOC-02A', title: 'ใบส่งมอบงาน (เต็มจำนวน)', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },

  // DOC-02B: ใบส่งมอบงาน หักวันลา (Delivery Note With Deduction - A4 Portrait)
  'doc-2b': { code: 'DOC-02B', title: 'ใบส่งมอบงาน (หักวันลา)', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },
  'doc-02b': { code: 'DOC-02B', title: 'ใบส่งมอบงาน (หักวันลา)', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },

  // DOC-03: รายงานการปฏิบัติงาน 18x31 (Workload Matrix 18x31 - A4 Landscape)
  'doc-3': { code: 'DOC-03', title: 'รายงานการปฏิบัติงาน 18x31', orientation: 'A4 แนวนอน (297 x 210 มม.)' },
  'doc-03': { code: 'DOC-03', title: 'รายงานการปฏิบัติงาน 18x31', orientation: 'A4 แนวนอน (297 x 210 มม.)' },

  // DOC-04: รับรองการมาปฏิบัติงาน (Attendance Sheet - A4 Portrait)
  'doc-4': { code: 'DOC-04', title: 'รับรองการมาปฏิบัติงาน', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },
  'doc-04': { code: 'DOC-04', title: 'รับรองการมาปฏิบัติงาน', orientation: 'A4 แนวตั้ง (210 x 297 มม.)' },
};

function normalizeKey(rawId?: string): string {
  if (!rawId) return '';
  return rawId.trim().toLowerCase().replace(/^doc[-_]*/, 'doc-');
}

function DocPreviewContent({ params }: DocPreviewPageProps) {
  const searchParams = useSearchParams();
  const { isLoggedIn } = useLiff();
  const rawDocId = params?.docId || '';
  const normalizedKey = normalizeKey(rawDocId);
  const normalizedCode = normalizeDocId(rawDocId);

  const docInfo = docTitles[normalizedKey] || {
    code: normalizedCode,
    title: `เอกสาร ${normalizedCode}`,
    orientation: normalizedCode === 'DOC-03' ? 'A4 แนวนอน' : 'A4 แนวตั้ง',
  };

  const currentPeriod = useSalaryStore((s) => s.currentPeriod);
  const absentDaysCount = currentPeriod?.absent_days_count ?? (currentPeriod?.absent_days?.length ?? 0);

  const [scale, setScale] = useState(1);

  const handlePrint = () => {
    if (!isLoggedIn) return;
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (!isLoggedIn) return;
    if (typeof window !== 'undefined') {
      const originalTitle = document.title;
      // Set title to clean suggested filename for browser's Save as PDF
      document.title = `${docInfo.code}_${docInfo.title}`.replace(/[\/\\:*?"<>|]/g, '_');
      
      // Ensure custom font TH Sarabun PSK is fully rendered before printing
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font loading fallback
        }
      }
      
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
    }
  }, [docInfo.code, docInfo.title, isLoggedIn]);

  // Trigger export automatically if requested via URL query (?export=pdf or ?action=print)
  useEffect(() => {
    if (!isLoggedIn) return;
    if (searchParams.get('export') === 'pdf' || searchParams.get('action') === 'print') {
      const timer = setTimeout(() => {
        handleExportPdf();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchParams, handleExportPdf, isLoggedIn]);

  return (
    <div className="space-y-4">
      {/* Top Action & Navigation Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/preview"
            className="inline-flex items-center gap-2 text-sm md:text-base text-slate-600 hover:text-slate-900 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้ารวมเอกสาร
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {docInfo.code}
            </span>
            <span className="font-heading text-sm md:text-base font-semibold text-slate-800 hidden md:inline">
              {docInfo.title}
            </span>
          </div>
        </div>

        {/* Controls: Zoom, PDF Export & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls (preview only) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-slate-700">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
              className="p-1.5 hover:bg-white rounded transition-colors text-xs cursor-pointer"
              title="ย่อขนาด"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs md:text-sm font-mono px-1 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
              className="p-1.5 hover:bg-white rounded transition-colors text-xs cursor-pointer"
              title="ขยายขนาด"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="p-1.5 hover:bg-white rounded transition-colors text-xs cursor-pointer"
              title="รีเซ็ตขนาด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs md:text-sm px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium hidden xs:inline-block">
            {docInfo.orientation}
          </span>

          {/* Export & Print Controls - Only available when logged in */}
          {isLoggedIn ? (
            <>
              {/* Export PDF Button (Rose Accent) */}
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-all shadow-xs hover:shadow min-h-[46px] cursor-pointer"
                title="ส่งออกเอกสารเป็นไฟล์ PDF (Save as PDF)"
              >
                <FileDown className="w-4 h-4" />
                <span>ส่งออก PDF</span>
              </button>

              {/* Native Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm md:text-base font-heading font-semibold transition-colors shadow-sm min-h-[46px] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์เอกสารนี้</span>
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs md:text-sm font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>กรุณาเข้าสู่ระบบเพื่อพิมพ์หรือส่งออกเอกสาร</span>
              <Link
                href="/auth/login"
                className="ml-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Recommendation Banner for Delivery Note (No-Print) */}
      {normalizedCode === 'DOC-02A' && absentDaysCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>
              <strong>คำแนะนำ:</strong> ในงวดนี้ตรวจพบวันลา <strong>{absentDaysCount} วัน</strong> ควรใช้เอกสาร{' '}
              <strong>DOC-02B ใบส่งมอบงาน (หักวันลา)</strong> เพื่อระบุยอดเงินหักและยอดสุทธิที่ถูกต้อง
            </span>
          </div>
          <Link
            href="/preview/doc-2b"
            className="ml-3 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs whitespace-nowrap transition-colors"
          >
            สลับไป DOC-02B
          </Link>
        </div>
      )}

      {normalizedCode === 'DOC-02B' && absentDaysCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-xs flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
            <span>
              <strong>ข้อมูล:</strong> ในงวดนี้ไม่มีการหักวันลา สามารถเลือกใช้เอกสาร{' '}
              <strong>DOC-02A ใบส่งมอบงาน (เต็มจำนวน)</strong> ได้
            </span>
          </div>
          <Link
            href="/preview/doc-2a"
            className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs whitespace-nowrap transition-colors"
          >
            สลับไป DOC-02A
          </Link>
        </div>
      )}

      {/* Canvas Area: Scales for visual preview on screen; in print mode uses native 100% vector */}
      <div className="preview-canvas-wrapper w-full overflow-x-auto p-2 sm:p-6 bg-slate-100/60 rounded-xl border border-slate-200 flex justify-center print:bg-transparent print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:h-auto print:overflow-visible">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
          className="transition-transform duration-150 print:!transform-none print:!m-0 print:!p-0 print:w-full print:h-auto print:overflow-visible"
        >
          <DocumentRenderer docId={rawDocId} />
        </div>
      </div>
    </div>
  );
}

export default function DocPreviewDetailPage({ params }: DocPreviewPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">กำลังเตรียมเอกสาร...</div>}>
      <DocPreviewContent params={params} />
    </Suspense>
  );
}
