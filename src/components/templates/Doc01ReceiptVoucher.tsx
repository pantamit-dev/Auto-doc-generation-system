'use client';

import React from 'react';
import type { ContractorProfile, AgencyProfile, ContractDetails, MonthlyPeriod } from '@/types/schema';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { bahtText } from '@/lib/utils/thaiNumerals';

export interface Doc01Props {
  contractor?: ContractorProfile;
  agency?: AgencyProfile;
  contract?: ContractDetails;
  period?: MonthlyPeriod;
  highlightMockup?: boolean;
}

export function Doc01ReceiptVoucher({
  contractor: propContractor,
  agency: propAgency,
  contract: propContract,
  period: propPeriod,
  highlightMockup = false,
}: Doc01Props) {
  const storeContractor = useSalaryStore((s) => s.contractor);
  const storeAgency = useSalaryStore((s) => s.agency);
  const storeContract = useSalaryStore((s) => s.contract);
  const storePeriod = useSalaryStore((s) => s.currentPeriod);

  const contractor = propContractor || storeContractor;
  const agency = propAgency || storeAgency;
  const contract = propContract || storeContract;
  const period = propPeriod || storePeriod;

  const monthlySalary = contract.monthly_salary || 19800;
  const absentDays = period.absent_days_count || (period.absent_days?.length ?? 0);
  const dailyRate = Math.round((monthlySalary / 30.0) * 100) / 100;
  const deduction = Math.round(absentDays * dailyRate * 100) / 100;
  const netPayable = Math.max(0, monthlySalary - deduction);

  const formattedSalary = monthlySalary.toLocaleString('en-US');
  const formattedNet = netPayable.toLocaleString('en-US');
  const deductionFormatted = deduction.toLocaleString('en-US');
  const netBahtText = period.net_payable_bahttext || bahtText(netPayable);

  // Address line construction
  const addressLine = `${contractor.address_line1 || '[ที่อยู่ผู้รับจ้าง]'} ${contractor.address_line2 || '[ตำบล อำเภอ จังหวัด]'}`.trim();

  const red = (content: React.ReactNode) => (
    <span className={highlightMockup ? 'text-red-600 font-semibold' : ''}>{content}</span>
  );

  return (
    <div className="thai-gov-doc page-receipt-voucher bg-white text-black w-[210mm] min-h-[297mm] p-[20mm_15mm_15mm_20mm] print:p-0 print:w-full print:h-auto print:min-h-0 print:max-h-none print:shadow-none print:border-none mx-auto shadow-lg print:overflow-visible font-['TH_Sarabun_PSK',sans-serif] text-[16pt] leading-[1.35] box-border">
      <style>{`@page { size: A4 portrait; margin: 20mm 15mm 15mm 20mm; }`}</style>
      {/* Title */}
      <div className="text-center text-[22pt] font-bold mb-3">
        แบบใบสำคัญรับเงิน
      </div>

      {/* Main Bordered Receipt Box (Matching Government Standard & docx Table 0) */}
      <table className="w-full border-collapse border border-black text-[16pt] leading-[1.35]">
        <tbody>
          {/* Row 0: Header Section inside Table */}
          <tr>
            <td colSpan={2} className="border border-black p-3 align-top">
              {/* Agency Reference Right Aligned */}
              <div className="text-right">
                <div>ที่ &nbsp;{red(agency.agency_name)}</div>
                <div className="text-[14pt] text-slate-800 print:text-black">(ส่วนราชการเป็นผู้ให้)</div>
              </div>

              {/* Date Line */}
              <div className="text-right my-2">
                วันที่............เดือน &nbsp;…………………พ.ศ................
              </div>

              {/* Contractor & Payer Statement */}
              <div className="indent-[2.5cm] text-thai-justify mt-2 leading-[1.4]">
                ข้าพเจ้า {red(contractor.full_name)} อยู่บ้านเลขที่ {red(addressLine)} ได้รับเงินจาก {red(agency.payer_agency)} ดังรายการต่อไปนี้
              </div>
            </td>
          </tr>

          {/* Row 1: Column Headers */}
          <tr className="font-bold text-center bg-slate-50 print:bg-transparent">
            <th className="border border-black w-[75%] py-1.5 px-3 font-bold text-center">
              รายการ
            </th>
            <th className="border border-black w-[25%] py-1.5 px-3 font-bold text-center">
              จำนวนเงิน
            </th>
          </tr>

          {/* Row 2: Items Body */}
          <tr>
            <td className="border border-black p-3 align-top min-h-[140px] h-[140px] text-thai-justify leading-[1.4]">
              <div>ค่า{red(contractor.position_title)}</div>
              <div className="mt-1">
                ประจำเดือน….…{red(period.month_name)}....... พ.ศ. .....{red(period.year_be)}....... &nbsp;เป็นเงิน
              </div>
              {deduction > 0 && (
                <div className="mt-2 text-slate-800 print:text-black">
                  หักไม่มาปฏิบัติงานจำนวน {red(absentDays)} วัน เป็นเงิน {red(deductionFormatted)} บาท
                </div>
              )}
            </td>
            <td className="border border-black p-3 text-right align-top">
              <div>{red(formattedSalary)}</div>
              {deduction > 0 && (
                <div className="mt-2 text-red-600 print:text-black">
                  -{deductionFormatted}
                </div>
              )}
            </td>
          </tr>

          {/* Row 3: Subtotal */}
          <tr className="font-bold">
            <td className="border border-black p-2 text-right pr-6 font-bold">
              รวมเป็นเงิน
            </td>
            <td className="border border-black p-2 text-right font-bold">
              {red(formattedNet)}
            </td>
          </tr>

          {/* Row 4: Confirmation, BahtText & Signatures */}
          <tr>
            <td colSpan={2} className="border border-black p-3 align-top">
              <div className="indent-[1.5cm] leading-[1.4]">
                จำนวนเงิน (ตัวอักษร) ({red(netBahtText)})
              </div>
              <div className="indent-[1.5cm] mt-1">
                ไว้เป็นการถูกต้องแล้ว
              </div>

              {/* Signatures inside the voucher box */}
              <div className="w-[320px] ml-auto mt-4 text-center space-y-3">
                <div>
                  <div>(ลงชื่อ)….......……………...……….............…......ผู้รับเงิน</div>
                  <div className="mt-1">({red(contractor.full_name)})</div>
                </div>
                <div className="pt-2">
                  <div>(ลงชื่อ).......................…..............…………..…....ผู้จ่ายเงิน</div>
                  <div className="mt-1">
                    (&nbsp;{red(agency.signers.payer_officer_name || '                                                                ')}&nbsp;)
                  </div>
                  {agency.signers.payer_officer_position && (
                    <div className="text-[14pt]">
                      ตำแหน่ง {red(agency.signers.payer_officer_position)}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
