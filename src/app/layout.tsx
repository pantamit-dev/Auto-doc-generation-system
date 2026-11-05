import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { LiffProvider } from '@/components/auth/LiffProvider';

export const metadata: Metadata = {
  title: 'ระบบส่งออกเอกสารเบิกจ่ายและรายงานปฏิบัติงาน (Salary & Work Document Export System)',
  description: 'ระบบจัดการข้อมูลผู้รับจ้าง คำนวณค่าตอบแทน บันทึกเวลา และพิมพ์เอกสารราชการมาตรฐาน 5 รายการ ผ่าน LINE Mini App',
  applicationName: 'SalaryDocApp',
  authors: [{ name: 'วิทยาลัยนักบริหารสาธารณสุข' }],
  keywords: ['ค่าจ้างเหมาบริการ', 'เอกสารราชการ', 'แบบใบสำคัญรับเงิน', 'ใบส่งมอบงาน', '110 ชิ้นงาน', 'บันทึกเวลาปฏิบัติงาน', 'LINE Mini App'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <body className="h-full bg-slate-50 text-slate-800 antialiased font-sans">
        <LiffProvider>
          <AppShell>{children}</AppShell>
        </LiffProvider>
      </body>
    </html>
  );
}
