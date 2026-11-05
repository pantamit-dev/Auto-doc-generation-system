'use client';

import React from 'react';
import type { ContractorProfile, AgencyProfile, ContractDetails, MonthlyPeriod } from '@/types/schema';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { toThaiDigits, formatThaiDate } from '@/lib/utils/thaiNumerals';

export interface Doc04Props {
  contractor?: ContractorProfile;
  agency?: AgencyProfile;
  contract?: ContractDetails;
  period?: MonthlyPeriod;
  attendanceRecords?: Array<{
    day: number;
    time_in?: string;
    time_out?: string;
    is_working_day?: boolean;
    remark?: string;
  }>;
  highlightMockup?: boolean;
}

export function Doc04AttendanceSheet({
  contractor: propContractor,
  agency: propAgency,
  contract: propContract,
  period: propPeriod,
  attendanceRecords: propAttendance,
  highlightMockup = false,
}: Doc04Props) {
  const storeContractor = useSalaryStore((s) => s.contractor);
  const storeAgency = useSalaryStore((s) => s.agency);
  const storeContract = useSalaryStore((s) => s.contract);
  const storePeriod = useSalaryStore((s) => s.currentPeriod);
  const storeAttendance = useSalaryStore((s) => s.attendanceRecords);

  const contractor = propContractor || storeContractor;
  const agency = propAgency || storeAgency;
  const contract = propContract || storeContract;
  const period = propPeriod || storePeriod;

  const yearAD = period.year_ad || (period.year_be ? period.year_be - 543 : 2026);
  const month = period.month || 10;
  const holidays = period.public_holidays || [];
  const absentDays = period.absent_days || [];
  const daysInMonth = new Date(yearAD, month, 0).getDate();

  // Pseudo-random generation matching realistic timestamps if not provided
  const records = propAttendance || (storeAttendance && storeAttendance.length > 0 ? storeAttendance : Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const dt = new Date(yearAD, month - 1, day);
    const dayOfWeek = dt.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(day);
    const isAbsent = absentDays.includes(day);
    const isWorking = !isWeekend && !isHoliday && !isAbsent;

    let remark = '';
    if (isWeekend) remark = 'วันหยุดเสาร์-อาทิตย์';
    else if (isHoliday) {
      const hDetail = period.holiday_details?.find((h) => h.day === day);
      remark = hDetail?.name || 'วันหยุดราชการ';
    } else if (isAbsent) {
      const lDetail = period.leave_details?.find((l) => l.day === day);
      remark = lDetail?.reason || 'ไม่มาปฏิบัติงาน';
    }

    const inMinute = (day * 7 + 12) % 60;
    const inHour = inMinute > 30 ? 7 : 8;
    const timeIn = isWorking ? `${String(inHour).padStart(2, '0')}:${String(inMinute).padStart(2, '0')}:12` : '';

    const outMinute = (day * 13 + 24) % 60;
    const outHour = 16 + ((day * 3) % 3);
    const timeOut = isWorking ? `${String(outHour).padStart(2, '0')}:${String(outMinute).padStart(2, '0')}:45` : '';

    return {
      day,
      time_in: timeIn,
      time_out: timeOut,
      is_working_day: isWorking,
      remark,
    };
  }));

  const actualWorkingDays = period.actual_working_days ?? records.filter((r) => r.is_working_day).length;
  const absentDaysCount = period.absent_days_count ?? (period.absent_days?.length ?? 0);

  const contractNumThai = contract.contract_number_thai || toThaiDigits(contract.contract_number || '2/2570');
  const contractDateThai = contract.contract_date_thai || formatThaiDate(contract.contract_date || '2026-10-29');
  const periodNumThai = toThaiDigits(period.period_number || 1);
  const yearBeThai = toThaiDigits(period.year_be || 2569);
  const daysInMonthThai = toThaiDigits(daysInMonth);

  // Position title normalization (prevent duplicating 'จ้างเหมาบริการปฏิบัติงาน' prefix)
  const rawPosition = contractor.position_title || 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์';
  const cleanPosition = rawPosition.replace(/^งาน\s*:\s*/, '').trim();
  const positionTitleDisplay = cleanPosition.startsWith('จ้างเหมาบริการ')
    ? cleanPosition
    : `จ้างเหมาบริการปฏิบัติงาน${cleanPosition}`;

  const red = (content: React.ReactNode) => (
    <span className={highlightMockup ? 'text-red-600 font-semibold' : ''}>{content}</span>
  );

  return (
    <div className="thai-gov-doc page-attendance-sheet bg-white text-black w-[210mm] min-h-[297mm] p-[10mm_15mm_10mm_15mm] print:p-0 print:w-full print:h-auto print:min-h-0 print:max-h-none print:shadow-none print:border-none mx-auto shadow-lg print:overflow-visible font-['TH_Sarabun_PSK',sans-serif] text-[12pt] leading-[1.25] box-border">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 12mm 8mm 12mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-attendance-sheet {
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-attendance-sheet table,
          .page-attendance-sheet table * {
            line-height: 1.15 !important;
          }
          .page-attendance-sheet table th,
          .page-attendance-sheet table td {
            padding-top: 1px !important;
            padding-bottom: 1px !important;
          }
          .page-attendance-sheet-signatures {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      {/* Title */}
      <div className="text-center font-bold text-[18pt] mb-1">
        รับรองการมาปฏิบัติงาน
      </div>

      {/* Header Info Block (Matching sheet 'Working' 100% - Centered) */}
      <div className="text-[12pt] leading-tight mb-2 text-center">
        <div>งาน : {red(positionTitleDisplay)}</div>
        <div>ชื่อผู้รับจ้าง &nbsp;{red(contractor.full_name)}</div>
        <div>สัญญาเลขที่ {red(contractNumThai)} ลงวันที่ {red(contractDateThai)}</div>
        <div>
          งวดที่ …. {red(periodNumThai)} ..... ประจำเดือน {red(period.month_name)} {red(yearBeThai)} (วันที่ ๑ - {red(daysInMonthThai)} {red(period.month_name)} {red(yearBeThai)})
        </div>
      </div>

      {/* Attendance Table */}
      <table className="w-full border-collapse border border-black text-center text-[9.5pt] leading-tight">
        <thead>
          <tr className="bg-slate-50 print:bg-slate-50 font-bold">
            <th className="border border-black w-[35px] py-0.5">วันที่</th>
            <th className="border border-black w-[150px] py-0.5">ชื่อ &nbsp; - &nbsp; นามสกุล</th>
            <th className="border border-black w-[65px] py-0.5">ลายเซ็น</th>
            <th className="border border-black w-[60px] py-0.5">เวลามา</th>
            <th className="border border-black w-[65px] py-0.5">ลายเซ็น</th>
            <th className="border border-black w-[60px] py-0.5">เวลากลับ</th>
            <th className="border border-black w-[110px] py-0.5">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => {
            const isWork = rec.is_working_day;
            const rowClass = isWork ? 'bg-white' : 'bg-[#d3d3d3] print:bg-[#d3d3d3]';
            return (
              <tr key={rec.day} className={rowClass}>
                <td className="border border-black py-[1px] text-center">{rec.day}</td>
                <td className="border border-black py-[1px] text-left px-2">{red(contractor.full_name)}</td>
                <td className="border border-black py-[1px] text-[8.5pt]">{isWork ? '' : ''}</td>
                <td className="border border-black py-[1px] text-[9pt]">{red(rec.time_in || '')}</td>
                <td className="border border-black py-[1px] text-[8.5pt]">{isWork ? '' : ''}</td>
                <td className="border border-black py-[1px] text-[9pt]">{red(rec.time_out || '')}</td>
                <td className="border border-black py-[1px] text-[8.5pt] text-slate-800 print:text-black">{rec.remark || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className="mt-1.5 text-[11.5pt] flex gap-8">
        <div>จำนวนวันลา : <strong>{absentDaysCount > 0 ? red(absentDaysCount) : '…................'}</strong> วัน</div>
        <div>จำนวนเวลาปฏิบัติงาน : <strong>{red(actualWorkingDays)}</strong> วัน</div>
      </div>

      {/* Signatures */}
      <div className="page-attendance-sheet-signatures mt-2.5 flex justify-between items-center text-center text-[11.5pt] px-8">
        <div className="w-[45%] text-center">
          <div>(ลงชื่อ).................................................ผู้รับจ้าง</div>
          <div className="mt-1">( {red(contractor.full_name)} )</div>
        </div>
        <div className="w-[45%] text-center">
          <div>(ลงชื่อ).................................................ผู้รับรอง</div>
          <div className="mt-1">
            (&nbsp;{red(agency.signers.inspection_chairman_name || '                                                                ')}&nbsp;)
          </div>
          <div>ประธานกรรมการตรวจรับพัสดุ</div>
        </div>
      </div>
    </div>
  );
}
