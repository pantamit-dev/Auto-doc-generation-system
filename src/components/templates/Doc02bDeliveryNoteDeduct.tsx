'use client';

import React from 'react';
import type { ContractorProfile, AgencyProfile, ContractDetails, MonthlyPeriod } from '@/types/schema';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { toThaiDigits, bahtText } from '@/lib/utils/thaiNumerals';

export interface Doc02bProps {
  contractor?: ContractorProfile;
  agency?: AgencyProfile;
  contract?: ContractDetails;
  period?: MonthlyPeriod;
  highlightMockup?: boolean;
}

export function Doc02bDeliveryNoteDeduct({
  contractor: propContractor,
  agency: propAgency,
  contract: propContract,
  period: propPeriod,
  highlightMockup = false,
}: Doc02bProps) {
  const storeContractor = useSalaryStore((s) => s.contractor);
  const storeAgency = useSalaryStore((s) => s.agency);
  const storeContract = useSalaryStore((s) => s.contract);
  const storePeriod = useSalaryStore((s) => s.currentPeriod);

  const contractor = propContractor || storeContractor;
  const agency = propAgency || storeAgency;
  const contract = propContract || storeContract;
  const period = propPeriod || storePeriod;

  const monthlySalary = contract.monthly_salary || 19800;
  const totalAmount = contract.total_contract_amount || (monthlySalary * (contract.total_periods || 12));
  const absentDays = period.absent_days_count || (period.absent_days?.length ?? 1);
  const dailyRate = Math.round((monthlySalary / 30.0) * 100) / 100;
  const deduction = Math.round(absentDays * dailyRate * 100) / 100;
  const netPayable = Math.max(0, monthlySalary - deduction);

  const monthlySalaryThai = toThaiDigits(monthlySalary.toLocaleString('en-US'));
  const totalAmountThai = toThaiDigits(totalAmount.toLocaleString('en-US'));
  const absentDaysThai = toThaiDigits(absentDays);
  const deductionThai = toThaiDigits(deduction.toLocaleString('en-US'));
  const netPayableThai = toThaiDigits(netPayable.toLocaleString('en-US'));

  const monthlyBahtText = period.monthly_salary_bahttext || bahtText(monthlySalary);
  const totalBahtText = period.total_contract_amount_bahttext || bahtText(totalAmount);
  const netBahtText = period.net_payable_bahttext || bahtText(netPayable);

  const durationMonthsThai = toThaiDigits(contract.duration_months || 12);
  const totalPeriodsThai = toThaiDigits(contract.total_periods || 12);
  const targetTasksThai = toThaiDigits(contract.target_tasks_per_period || 110);
  const yearBeThai = toThaiDigits(period.year_be || 2569);
  const periodNumberThai = toThaiDigits(period.period_number || 1);

  // Thai address formatting
  const addressLine1Thai = toThaiDigits(contractor.address_line1 || '[ที่อยู่ผู้รับจ้าง]');
  const addressLine2Thai = toThaiDigits(contractor.address_line2 || '[ตำบล อำเภอ จังหวัด]');

  // Thai contract dates
  const contractNumThai = contract.contract_number_thai || toThaiDigits(contract.contract_number || '2/2570');
  const contractDateThai = contract.contract_date_thai || '๒๙ ตุลาคม ๒๕๖๙';
  const startDateThai = contract.start_date_thai || '๑ ตุลาคม ๒๕๖๙';
  const endDateThai = contract.end_date_thai || '๓๐ กันยายน ๒๕๗๐';

  // Invoice date line
  const invoiceDateThai = period.invoice_date_thai || `วันที่ ๒ เดือน ${period.month_name} พ.ศ. ${yearBeThai}`;

  const red = (content: React.ReactNode) => (
    <span className={highlightMockup ? 'text-red-600 font-semibold' : ''}>{content}</span>
  );

  return (
    <div className="thai-gov-doc page-delivery-note bg-white text-black w-[210mm] min-h-[297mm] p-[24.5mm_19mm_15mm_31mm] print:p-0 print:w-full print:h-auto print:min-h-0 print:max-h-none print:shadow-none print:border-none mx-auto shadow-lg print:overflow-visible font-['TH_Sarabun_PSK',sans-serif] text-[16pt] leading-[1.35] box-border">
      <style>{`@page { size: A4 portrait;   margin: 24.5mm 19mm 15mm 31mm; }`}</style>
      {/* Title Centered */}
      <div className="text-center text-[26pt] font-bold mb-3">
        ใบส่งมอบงาน /แจ้งหนี้
      </div>

      {/* Address Block Top Right */}
      <div className="text-right mb-2 leading-[1.3]">
        <div>{red(addressLine1Thai)}</div>
        <div>{red(addressLine2Thai)}</div>
      </div>

      {/* Date Line Center/Middle */}
      <div className="ml-[80mm] mb-3">
        {red(invoiceDateThai)}
      </div>

      {/* Header Info */}
      <div className="space-y-1 mb-3 leading-[1.35]">
        <div><strong>เรื่อง</strong> &nbsp;ขอส่งมอบงาน/แจ้งหนี้</div>
        <div><strong>เรียน</strong> &nbsp;{red(agency.signers.inspection_chairman_name || 'ประธานกรรมการตรวจรับพัสดุ')}</div>
      </div>

      {/* Paragraph 1: Contract Background (Matching Docx sample 100%) */}
      <div className="indent-[2.5cm] text-thai-justify mb-2.5 leading-[1.35]">
        ตามสัญญาจ้างเหมาบริการ{red(contractor.position_title)} สัญญาเลขที่ {red(contractNumThai)} ลงวันที่ {red(contractDateThai)} {red(agency.agency_name)}ได้ว่าจ้างข้าพเจ้าฯ ปฏิบัติงานจ้างเหมาบริการ{red(contractor.position_title)} ตั้งแต่วันที่ {red(startDateThai)} ถึง {red(endDateThai)} รวมระยะเวลา {red(durationMonthsThai)} เดือน โดยแบ่งจ่ายเงินเป็นรายเดือน (ทุกสิ้นเดือน) จำนวน {red(totalPeriodsThai)} งวด งวดละ {red(monthlySalaryThai)} บาท({red(monthlyBahtText)}) รวมเป็นเงินทั้งสิ้น {red(totalAmountThai)} บาท({red(totalBahtText)})ซึ่งมีรายละเอียดของงานที่ต้องปฏิบัติตามรายละเอียดเงื่อนไขข้อกำหนดการจ้างเหมาบริการที่แนบท้ายข้อตกลงดังกล่าวนั้น
      </div>

      {/* Paragraph 2: Delivery & Deduction Statement */}
      <div className="indent-[2.5cm] text-thai-justify mb-2.5 leading-[1.35]">
        บัดนี้ ข้าพเจ้าฯ ขอส่งมอบงาน งวดที่ {red(periodNumberThai)} ประจำเดือน {red(period.month_name)} {red(yearBeThai)} จำนวน {red(targetTasksThai)} ชิ้นงานที่ได้ปฏิบัติงานเสร็จเรียบร้อยแล้วตามนัยข้อตกลงข้างต้น หักไม่มาปฏิบัติงานจำนวน {red(absentDaysThai)} วัน เป็นเงิน {red(deductionThai)} บาท และขอเบิกเงินจำนวน {red(netPayableThai)} บาท({red(netBahtText)})
      </div>

      {/* Paragraph 3: Closing request */}
      <div className="indent-[2.5cm] text-thai-justify mb-5 leading-[1.35]">
        จึงเรียนมาเพื่อโปรดเบิกจ่ายเงินให้ต่อไปด้วยจะเป็นพระคุณ
      </div>

      {/* Sign-off Block: Indented to ~80mm (center-aligned signature) */}
      <div className="ml-[80mm] text-center w-[280px] space-y-2">
        <div className="text-center">ขอแสดงความนับถือ</div>
        <div className="pt-8">X ………………………………………………………………</div>
        <div>({red(contractor.full_name)})</div>
        <div>ผู้รับจ้าง</div>
      </div>
    </div>
  );
}
