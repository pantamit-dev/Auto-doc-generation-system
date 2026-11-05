'use client';

import React from 'react';
import type { ContractorProfile, AgencyProfile, ContractDetails, MonthlyPeriod } from '@/types/schema';
import { useSalaryStore } from '@/lib/store/useSalaryStore';

export const TASKS_DESC: string[] = [
  'ติดตั้ง ซ่อมบำรุง และดูแลอุปกรณ์คอมพิวเตอร์และอุปกรณ์ ICT ให้พร้อมใช้งาน',
  'บริหารจัดการโครงสร้างเครือข่ายรวมถึงอุปกรณ์เชื่อมต่อและการเชื่อมต่ออินเทอร์เน็ตของหน่วยงาน',
  'ป้องกัน ตรวจจับ และตอบสนองต่อการบุกรุก ไวรัส หรือภัยคุกคามเครือข่ายเพื่อรักษาความปลอดภัยของข้อมูล',
  'จัดทำและเก็บบันทึกรายงานการซ่อมบำรุง ปัญหา และประวัติการแก้ไขเป็นฐานข้อมูลสำหรับอ้างอิง',
  'ให้คำปรึกษาและแนะนำการใช้คอมพิวเตอร์ โปรแกรม และระบบสารสนเทศแก่บุคลากรและผู้รับบริการ',
  'ให้บริการช่วยเหลือ (helpdesk) แก่ผู้ใช้งานทั้งภายในและภายนอก รวมทั้งแก้ไขปัญหาเชิงเทคนิค',
  'จัดทำคู่มือเอกสารการปฏิบัติงาน สื่อการสอน และวัสดุเรียนรู้เกี่ยวกับระบบและอุปกรณ์',
  'จัดเก็บและวิเคราะห์สถิติการใช้งานเพื่อนำไปสู่การวางแผนบำรุงรักษาเชิงป้องกัน',
  'เตรียมความพร้อมและสนับสนุนด้านเทคนิคสำหรับการจัดประชุมและการอบรม ทั้งในสถานที่และแบบออนไลน์',
  'สนับสนุนและดูแลระบบการอบรมออนไลน์ (LMS และบริการฝึกอบรมผ่านอินเทอร์เน็ต)',
  'บริหารและพัฒนาเว็บไซต์ของหน่วยงาน (CMS, LMS, RMS) รวมถึงการอัพเดทเนื้อหาและระบบ',
  'ผลิตสื่อประชาสัมพันธ์ เช่น อินโฟกราฟิก และเผยแพร่ข้อมูลของหน่วยงาน',
  'ถ่ายภาพและตกแต่งภาพกิจกรรมของหน่วยงานเพื่อใช้สื่อและเก็บบันทึก',
  'คัดเลือก แนะนำ และจัดหาอุปกรณ์หรือเครื่องมือที่ช่วยเพิ่มประสิทธิภาพการทำงานของบุคลากร',
  'พัฒนาเว็บแอปพลิเคชันภายในองค์กรด้วย Google Apps Script (GAS)',
  'ดูแลและบริหารจัดการระบบ Google Workspace (บัญชี อีเมล และสิทธิ์การเข้าถึง)',
  'จัดทำนโยบายและแนวทางการสำรองข้อมูลและกู้คืนระบบเพื่อป้องกันการสูญหายของข้อมูล',
  'ตรวจสอบและปรับปรุงประสิทธิภาพระบบและเครือข่ายให้รองรับการใช้งานอย่างเสถียร',
];

export interface Doc03Props {
  contractor?: ContractorProfile;
  agency?: AgencyProfile;
  contract?: ContractDetails;
  period?: MonthlyPeriod;
  tasks?: string[] | { id: number; description: string }[];
  targetTasks?: number;
  workloadMatrix?: number[][];
  dailySums?: number[];
  taskTotals?: number[];
  grandTotal?: number;
  interactive?: boolean;
  onToggleCell?: (row: number, col: number) => void;
  highlightMockup?: boolean;
}

export function Doc03WorkloadMatrix({
  contractor: propContractor,
  agency: propAgency,
  contract: propContract,
  period: propPeriod,
  tasks: propTasks,
  targetTasks: propTargetTasks,
  workloadMatrix: propMatrix,
  dailySums: propDailySums,
  taskTotals: propTaskTotals,
  grandTotal: propGrandTotal,
  interactive = false,
  onToggleCell,
  highlightMockup = false,
}: Doc03Props) {
  const storeContractor = useSalaryStore((s) => s.contractor);
  const storeAgency = useSalaryStore((s) => s.agency);
  const storeContract = useSalaryStore((s) => s.contract);
  const storePeriod = useSalaryStore((s) => s.currentPeriod);
  const storeWorkload = useSalaryStore((s) => s.workloadResult);
  const storeWorkloadSettings = useSalaryStore((s) => s.workloadSettings);
  const toggleMatrixCell = useSalaryStore((s) => s.toggleMatrixCell);

  const contractor = propContractor || storeContractor;
  const agency = propAgency || storeAgency;
  const contract = propContract || storeContract;
  const period = propPeriod || storePeriod;

  // Resolve dynamic task descriptions
  const taskDescriptions: string[] = React.useMemo(() => {
    if (propTasks && propTasks.length > 0) {
      return propTasks.map((t) => (typeof t === 'string' ? t : t.description));
    }
    if (storeWorkloadSettings?.task_list && storeWorkloadSettings.task_list.length > 0) {
      return storeWorkloadSettings.task_list.map((t) => t.description);
    }
    return TASKS_DESC;
  }, [propTasks, storeWorkloadSettings?.task_list]);

  const numTasks = taskDescriptions.length;
  const targetTasks =
    propTargetTasks ??
    storeWorkloadSettings?.target_tasks ??
    contract.target_tasks_per_period ??
    110;

  const yearAD = period.year_ad || (period.year_be ? period.year_be - 543 : 2026);
  const month = period.month || 10;
  const holidays = period.public_holidays || [];
  const absentDays = period.absent_days || [];
  const daysInMonth = new Date(yearAD, month, 0).getDate();

  // Determine working day status for each of 31 columns
  const dayStatus = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    if (day > daysInMonth) {
      return { isWorking: false, isBeyondMonth: true, bgClass: 'bg-[#d3d3d3] print:bg-[#d3d3d3]' };
    }
    const dt = new Date(yearAD, month - 1, day);
    const dayOfWeek = dt.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(day);
    const isAbsent = absentDays.includes(day);
    const isWorking = !isWeekend && !isHoliday && !isAbsent;

    return {
      isWorking,
      isBeyondMonth: false,
      bgClass: isWorking ? 'work-cell bg-white' : 'holiday-cell bg-[#d3d3d3] print:bg-[#d3d3d3]',
    };
  });

  // Calculate or retrieve workload matrix
  let matrix = propMatrix || storeWorkload?.matrix;
  if (!matrix || matrix.length !== numTasks) {
    matrix = Array.from({ length: numTasks }, () => Array.from({ length: 31 }, () => 0));
    const workingIndices = dayStatus.map((s, idx) => (s.isWorking ? idx : -1)).filter((idx) => idx !== -1);

    if (workingIndices.length > 0 && numTasks > 0) {
      workingIndices.forEach((c, idx) => {
        const r = idx % numTasks;
        matrix![r][c] = 1;
      });
      let remaining = targetTasks - workingIndices.length;
      let currColIdx = 0;
      let currRowIdx = 1;
      while (remaining > 0) {
        const c = workingIndices[currColIdx % workingIndices.length];
        const r = currRowIdx % numTasks;
        if (matrix[r][c] === 0) {
          matrix[r][c] = 1;
          remaining--;
        }
        currRowIdx++;
        if (currRowIdx % numTasks === 0) currColIdx++;
      }
    }
  }

  // Row and Column Totals
  const taskTotals = propTaskTotals || matrix.map((row) => row.reduce((a, b) => a + (b === 1 ? 1 : 0), 0));
  const dailySums =
    propDailySums ||
    Array.from({ length: 31 }, (_, c) => matrix!.reduce((acc, row) => acc + (row[c] === 1 ? 1 : 0), 0));
  const grandTotal = propGrandTotal ?? dailySums.reduce((a, b) => a + b, 0);

  const handleCellClick = (r: number, c: number, isWorking: boolean) => {
    if (!interactive || !isWorking) return;
    if (onToggleCell) {
      onToggleCell(r, c);
    } else {
      toggleMatrixCell(r, c);
    }
  };

  const red = (content: React.ReactNode) => (
    <span className={highlightMockup ? 'text-red-600 font-semibold' : ''}>{content}</span>
  );

  return (
    <div className="thai-gov-doc page-workload-matrix bg-white text-black w-[297mm] min-h-[210mm] p-[8mm] print:p-0 print:w-full print:h-auto print:min-h-0 print:max-h-none print:shadow-none print:border-none mx-auto shadow-lg print:overflow-visible font-['TH_Sarabun_PSK',sans-serif] text-[11pt] leading-[1.2] box-border">
      <style>{`@page { size: A4 landscape; margin: 8mm 8mm 8mm 8mm; }`}</style>
      {/* Three Header Lines matching name&work.xlsm */}
      <div className="text-center font-bold text-[15pt]">
        ชื่อส่วนราชการ {red(agency.agency_name)} ประจำเดือน {red(period.month_name)} พ.ศ. {red(period.year_be)}
      </div>
      <div className="text-center font-bold text-[16pt]">
        รายงานการปฏิบัติงาน
      </div>
      <div className="text-center text-[14pt] mb-1.5 font-medium">
        {red(contractor.full_name)} {red(contractor.position_title)} (ข้อตกลง {red(targetTasks)} ชิ้นงาน)
      </div>

      {/* 34-Column Table */}
      <table className="w-full border-collapse border border-black text-center text-[9.5pt] table-fixed">
        <thead>
          <tr className="bg-slate-50 print:bg-slate-50 font-bold">
            <th rowSpan={2} className="border border-black w-[26px] py-1 text-center align-middle">
              ลำดับ
            </th>
            <th rowSpan={2} className="border border-black w-[290px] text-center px-1 py-1 align-middle">
              งานที่ปฏิบัติ
            </th>
            <th colSpan={31} className="border border-black py-0.5 text-center">
              วันที่ปฏิบัติงาน
            </th>
            <th rowSpan={2} className="border border-black w-[32px] py-1 text-center align-middle">
              รวม
            </th>
          </tr>
          <tr className="bg-slate-50 print:bg-slate-50 font-bold">
            {Array.from({ length: 31 }, (_, i) => (
              <th key={i} className="border border-black w-[19px] py-0.5 text-center text-[8.5pt]">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {taskDescriptions.map((desc, r) => (
            <tr key={r}>
              <td className="border border-black py-0.5 text-center font-semibold">{r + 1}</td>
              <td className="border border-black px-1.5 text-left text-[9pt] leading-[1.15] truncate" title={desc}>
                {desc}
              </td>
              {Array.from({ length: 31 }, (_, c) => {
                const isOne = matrix![r]?.[c] === 1;
                const { bgClass, isWorking } = dayStatus[c];
                const canClick = interactive && isWorking;
                return (
                  <td
                    key={c}
                    onClick={() => handleCellClick(r, c, isWorking)}
                    className={`border border-black py-0.5 text-center text-[9pt] ${bgClass} ${
                      canClick ? 'cursor-pointer hover:bg-emerald-100 transition-colors select-none' : ''
                    }`}
                    title={canClick ? `คลิกเพื่อ ${isOne ? 'ลบชิ้นงาน' : 'เพิ่มชิ้นงาน'} (แถว ${r + 1}, วันที่ ${c + 1})` : undefined}
                  >
                    {isOne ? '1' : ''}
                  </td>
                );
              })}
              <td className="border border-black py-0.5 font-bold text-center bg-slate-50 print:bg-transparent">
                {taskTotals[r] || 0}
              </td>
            </tr>
          ))}
          {/* Summary Row */}
          <tr className="font-bold bg-slate-50 print:bg-slate-50">
            <td colSpan={2} className="border border-black py-1 text-center font-bold">
              รวม
            </td>
            {Array.from({ length: 31 }, (_, c) => (
              <td key={c} className="border border-black py-1 text-center text-[9pt] font-bold">
                {dailySums[c] || 0}
              </td>
            ))}
            <td className="border border-black py-1 text-center text-[10.5pt] font-bold">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Official Signatures Row */}
      <div className="mt-3 flex justify-between items-center text-center text-[11.5pt] px-16">
        <div className="w-[40%] text-center">
          <div>ผู้ควบคุมการปฏิบัติงาน</div>
          <div className="mt-7">(&nbsp;{red(agency.signers.supervisor_name || 'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]')}&nbsp;)</div>
          <div className="text-[10.5pt]">ตำแหน่ง {red(agency.signers.supervisor_position || 'นักวิชาการคอมพิวเตอร์ชำนาญการ')}</div>
        </div>
        <div className="w-[40%] text-center">
          <div>ผู้ปฏิบัติงาน</div>
          <div className="mt-7">(&nbsp;{red(contractor.full_name)}&nbsp;)</div>
          <div className="text-[10.5pt]">ตำแหน่ง {red(contractor.position_title)}</div>
        </div>
      </div>
    </div>
  );
}
