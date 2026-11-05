'use client';

import React from 'react';
import Link from 'next/link';
import { Printer, FileText, ArrowRight, FileDown, ShieldCheck, Lock } from 'lucide-react';
import { useLiff } from '@/components/auth/LiffProvider';

const documentList = [
  {
    id: 'doc-1',
    code: 'DOC-01',
    name: 'แบบใบสำคัญรับเงิน',
    description: 'เอกสารสำคัญแสดงการรับเงินค่าจ้างเหมาบริการรายเดือน พร้อมคำอ่านจำนวนเงินบาทถ้วน',
    orientation: 'A4 แนวตั้ง',
    href: '/preview/doc-1',
  },
  {
    id: 'doc-2a',
    code: 'DOC-02A',
    name: 'ใบส่งมอบงาน (เต็มจำนวน)',
    description: 'เอกสารส่งมอบงานกรณีไม่มีการลา เบิกจ่ายค่าจ้างเต็มจำนวน 19,800 บาท',
    orientation: 'A4 แนวตั้ง',
    href: '/preview/doc-2a',
  },
  {
    id: 'doc-2b',
    code: 'DOC-02B',
    name: 'ใบส่งมอบงาน (หักวันลา)',
    description: 'เอกสารส่งมอบงานกรณีมีวันลา ระบุยอดหักวันละ 660 บาท และยอดจ่ายสุทธิ',
    orientation: 'A4 แนวตั้ง',
    href: '/preview/doc-2b',
  },
  {
    id: 'doc-3',
    code: 'DOC-03',
    name: 'รายงานการปฏิบัติงาน 18x31',
    description: 'ตารางเมทริกซ์แจกแจงงาน 18 กลุ่มงาน x 31 วัน รวมยอดภารกิจ 110 รายการ',
    orientation: 'A4 แนวนอน',
    href: '/preview/doc-3',
  },
  {
    id: 'doc-4',
    code: 'DOC-04',
    name: 'รับรองการมาปฏิบัติงาน',
    description: 'ตารางบันทึกเวลาเข้า-ออกงานรายวัน พร้อมช่องลงนามรับรองของผู้ควบคุมงาน',
    orientation: 'A4 แนวตั้ง',
    href: '/preview/doc-4',
  },
];

export default function PreviewPortalPage() {
  const { isLoggedIn } = useLiff();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-800">
              ศูนย์พรีวิวและส่งออกเอกสารราชการ (Document Preview & Export Portal)
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              ตรวจสอบความถูกต้อง สั่งพิมพ์ และส่งออกไฟล์ PDF เอกสารราชการมาตรฐาน 5 รายการ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>มาตรฐาน A4 ราชการ (ขอบกระดาษ 30 มม. เจาะรูเข้าแฟ้ม)</span>
        </div>
      </div>

      {/* Grid of 5 Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentList.map((doc) => (
          <div
            key={doc.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {doc.code}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    doc.orientation === 'A4 แนวนอน'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {doc.orientation}
                </span>
              </div>
              <h3 className="font-heading text-base md:text-lg font-bold text-slate-800 mt-1">
                {doc.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                {doc.description}
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
              {/* Direct Export PDF Button - Only when logged in */}
              {isLoggedIn ? (
                <Link
                  href={`${doc.href}?export=pdf`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-semibold transition-all min-h-[44px]"
                  title={`ส่งออก ${doc.code} เป็นไฟล์ PDF`}
                >
                  <FileDown className="w-4 h-4 text-rose-600" />
                  <span>ส่งออก PDF</span>
                </Link>
              ) : (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>เข้าสู่ระบบเพื่อส่งออก</span>
                </span>
              )}

              {/* Open Document Page */}
              <Link
                href={doc.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all min-h-[44px]"
              >
                <span>เปิดหน้าเอกสาร</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
