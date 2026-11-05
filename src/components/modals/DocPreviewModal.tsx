'use client';

/**
 * src/components/modals/DocPreviewModal.tsx
 * ==============================================================================
 * Interactive Modal for previewing Government Document templates with 
 * highlighted red mockup data placeholders and Export PDF capabilities.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, AlertCircle, FileText, Check, FileDown, Lock } from 'lucide-react';
import { DocumentRenderer } from '@/components/templates/DocumentRenderer';
import { useLiff } from '@/components/auth/LiffProvider';

export interface DocPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  title: string;
  code: string;
  orientation: 'A4 แนวตั้ง' | 'A4 แนวนอน';
}

export function DocPreviewModal({
  isOpen,
  onClose,
  docId,
  title,
  code,
  orientation,
}: DocPreviewModalProps) {
  const { isLoggedIn } = useLiff();
  const [zoomScale, setZoomScale] = useState<number>(0.9);

  // Auto-adjust initial zoom scale based on orientation and screen width
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setZoomScale(orientation === 'A4 แนวนอน' ? 0.38 : 0.48);
      } else {
        setZoomScale(orientation === 'A4 แนวนอน' ? 0.75 : 0.9);
      }
    }
  }, [isOpen, orientation]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomScale((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.3, Math.round((prev - 0.1) * 10) / 10));
  const handleResetZoom = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setZoomScale(orientation === 'A4 แนวนอน' ? 0.38 : 0.48);
    } else {
      setZoomScale(orientation === 'A4 แนวนอน' ? 0.75 : 0.9);
    }
  };

  const handleExportPdf = () => {
    if (!isLoggedIn) return;
    const cleanDocKey = docId.toLowerCase().replace(/^doc[-_]*/, 'doc-');
    if (typeof window !== 'undefined') {
      window.open(`/preview/${cleanDocKey}?export=pdf`, '_blank');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-doc-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 print:bg-transparent print:p-0 print:static print:block"
    >
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:bg-transparent print:border-none print:shadow-none print:max-h-none print:w-full print:block">
        {/* Top Header Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-800/90 border-b border-slate-700/80 no-print print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {code}
                </span>
                <span className="text-xs text-slate-400 hidden xs:inline">{orientation}</span>
              </div>
              <h3 id="modal-doc-title" className="text-sm sm:text-base font-bold text-white truncate">
                {title}
              </h3>
            </div>
          </div>

          {/* Controls: Zoom, PDF Export & Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-750 border border-slate-700 rounded-lg p-0.5 text-xs text-slate-300">
              <button
                type="button"
                onClick={handleZoomOut}
                title="ย่อขนาด"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-medium">{Math.round(zoomScale * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="ขยายขนาด"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="รีเซ็ตขนาด"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors border-l border-slate-700 ml-0.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Export PDF Button (Rose Accent) - Only visible when logged in */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs min-h-[38px] cursor-pointer"
                title="ส่งออกเอกสารเป็นไฟล์ PDF"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden xs:inline">ส่งออก PDF</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่างตัวอย่าง"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors cursor-pointer border border-slate-700/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informational Guidance Alert Bar */}
        <div className="bg-amber-950/60 border-b border-amber-800/50 px-4 sm:px-6 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm text-amber-200 no-print print:hidden">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>ข้อมูลจำลองตัวอย่าง (Data Mockup):</strong> ข้อความที่แสดงด้วย{' '}
            <span className="text-red-400 font-bold underline decoration-red-400 underline-offset-2">สีแดง</span>{' '}
            คือฟิลด์จำลองตัวอย่าง ระบบจะแทนที่ด้วยข้อมูลจริงของท่านโดยอัตโนมัติเมื่อเข้าสู่ระบบ
          </span>
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start print:bg-transparent print:p-0 print:overflow-visible print:block">
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shadow-2xl rounded-xs my-2 overflow-visible print:shadow-none print:m-0 print:p-0 print:overflow-visible print:!transform-none"
          >
            <DocumentRenderer docId={docId} highlightMockup={true} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 no-print print:hidden">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>รูปแบบตรงตามมาตรฐานระเบียบกระทรวงสาธารณสุข 100% (พิมพ์ลงกระดาษ A4)</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-lg transition-colors min-h-[38px] cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>ส่งออกไฟล์ PDF</span>
              </button>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 text-slate-400 rounded-lg text-xs border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>เข้าสู่ระบบเพื่อส่งออก PDF</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors min-h-[38px] cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
