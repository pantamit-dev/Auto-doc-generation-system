'use client';

/**
 * src/app/profile/page.tsx
 * Integrated Member & Agency Profile Management Page
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Building2, 
  FileSignature, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

import { useSalaryStore } from '@/lib/store/useSalaryStore';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { AgencyForm } from '@/components/forms/AgencyForm';
import { ContractForm } from '@/components/forms/ContractForm';

import type { ContractorProfile, AgencyProfile, ContractDetails } from '@/types/schema';

type ActiveTab = 'profile' | 'agency' | 'contract';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store bindings
  const contractor = useSalaryStore((s) => s.contractor);
  const agency = useSalaryStore((s) => s.agency);
  const contract = useSalaryStore((s) => s.contract);
  const setContractor = useSalaryStore((s) => s.setContractor);
  const setAgency = useSalaryStore((s) => s.setAgency);
  const setContract = useSalaryStore((s) => s.setContract);
  const resetToDefaults = useSalaryStore((s) => s.resetToDefaults);
  const exportStateJson = useSalaryStore((s) => s.exportStateJson);
  const importStateJson = useSalaryStore((s) => s.importStateJson);
  const logAudit = useSalaryStore((s) => s.logAudit);
  const initStore = useSalaryStore((s) => s.initStore);
  const isHydrated = useSalaryStore((s) => s.isHydrated);

  // Initialize store on mount if not yet hydrated
  useEffect(() => {
    if (!isHydrated) {
      initStore();
    }
  }, [isHydrated, initStore]);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ text, type });
    setTimeout(() => setBannerMessage(null), 3500);
  };

  // Form Save Handlers with Audit Logging
  const handleSaveProfile = async (data: ContractorProfile) => {
    setContractor(data);
    await logAudit?.({
      action: 'PROFILE_UPDATE',
      actor: data.full_name || 'ผู้ใช้งาน',
      entity_type: 'contractor_profile',
      summary: `แก้ไขข้อมูลผู้รับจ้าง (${data.full_name})`,
    });
    showBanner('บันทึกข้อมูลผู้รับจ้างเรียบร้อยแล้ว');
  };

  const handleSaveAgency = async (data: AgencyProfile) => {
    setAgency(data);
    await logAudit?.({
      action: 'AGENCY_UPDATE',
      actor: data.signers.contractor_name || 'ผู้ใช้งาน',
      entity_type: 'agency_profile',
      summary: `แก้ไขข้อมูลหน่วยงานและผู้ลงนาม (${data.agency_name})`,
    });
    showBanner('บันทึกข้อมูลส่วนราชการและผู้ลงนามเรียบร้อยแล้ว');
  };

  const handleSaveContract = async (data: ContractDetails) => {
    setContract(data);
    await logAudit?.({
      action: 'CONTRACT_UPDATE',
      actor: contractor.full_name || 'ผู้ใช้งาน',
      entity_type: 'contract',
      summary: `แก้ไขข้อมูลสัญญาจ้างเลขที่ ${data.contract_number}`,
    });
    showBanner('บันทึกข้อมูลสัญญาจ้างเรียบร้อยแล้ว');
  };

  // Export JSON Backup
  const handleExportJson = () => {
    try {
      const jsonStr = exportStateJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `salary_doc_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      logAudit?.({
        action: 'DATA_EXPORT',
        actor: contractor.full_name || 'ผู้ใช้งาน',
        entity_type: 'app_state',
        summary: 'ส่งออกข้อมูลสำรอง JSON ทั้งหมด',
      });
      showBanner('ส่งออกไฟล์สำรอง JSON เรียบร้อยแล้ว');
    } catch {
      showBanner('เกิดข้อผิดพลาดในการส่งออกไฟล์สำรอง', 'error');
    }
  };

  // Import JSON Backup
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importStateJson(content);
        if (success) {
          logAudit?.({
            action: 'DATA_IMPORT',
            actor: 'ผู้ใช้งาน',
            entity_type: 'app_state',
            summary: `นำเข้าข้อมูลสำรองจากไฟล์ ${file.name}`,
          });
          showBanner(`นำเข้าข้อมูลจากไฟล์ ${file.name} เรียบร้อยแล้ว`);
        } else {
          showBanner('ไฟล์ข้อมูลไม่ถูกต้องหรือไม่ตรงตามโครงสร้างระบบ', 'error');
        }
      } catch {
        showBanner('ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบไฟล์', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Reset to Defaults
  const handleConfirmReset = async () => {
    try {
      await resetToDefaults();
      setShowResetConfirm(false);
      await logAudit?.({
        action: 'DATA_RESET',
        actor: 'ผู้ใช้งาน',
        entity_type: 'app_state',
        summary: 'รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น',
      });
      showBanner('รีเซ็ตข้อมูลทั้งหมดเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    } catch {
      showBanner('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFileChange}
      />

      {/* Global Notification Banner */}
      {bannerMessage && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm transition-all duration-300 animate-in fade-in ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {bannerMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{bannerMessage.text}</span>
        </div>
      )}

      {/* Page Header & Global Action Toolbar */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-800">ข้อมูลผู้รับจ้างและหน่วยงาน (Profile & Settings)</h2>
          <p className="text-slate-500 text-sm md:text-base mt-1">
            จัดการข้อมูลส่วนตัว สัญญาจ้าง อัตราค่าตอบแทน และรายนามผู้ลงนามในเอกสารราชการ
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[46px] px-3.5 py-2 text-xs md:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            title="ส่งออกไฟล์สำรองข้อมูล JSON ทั้งหมด"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">สำรองข้อมูล</span> JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[46px] px-3.5 py-2 text-xs md:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            title="นำเข้าไฟล์สำรองข้อมูล JSON"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">นำเข้า</span> JSON
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[46px] px-3.5 py-2 text-xs md:text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
            title="รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น"
          >
            <RotateCcw className="w-4 h-4" />
            คืนค่าเริ่มต้น
          </button>
        </div>
      </div>

      {/* Segmented Tab Controls (Touch Target >= 44px) */}
      <div className="bg-slate-200/80 p-1.5 rounded-xl flex items-center gap-1 max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-h-[46px] px-4 py-2.5 text-sm md:text-base font-medium font-heading rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-white text-sky-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>ข้อมูลผู้รับจ้าง</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agency')}
          className={`flex-1 min-h-[46px] px-4 py-2.5 text-sm md:text-base font-medium font-heading rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'agency'
              ? 'bg-white text-sky-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>หน่วยงาน & ผู้ลงนาม</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contract')}
          className={`flex-1 min-h-[46px] px-4 py-2.5 text-sm md:text-base font-medium font-heading rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'contract'
              ? 'bg-white text-sky-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>สัญญาจ้าง & ค่าตอบแทน</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'profile' && (
          <ProfileForm initialData={contractor} onSave={handleSaveProfile} />
        )}
        {activeTab === 'agency' && (
          <AgencyForm
            initialData={agency}
            contractorFullName={contractor.full_name}
            onSave={handleSaveAgency}
          />
        )}
        {activeTab === 'contract' && (
          <ContractForm initialData={contract} onSave={handleSaveContract} />
        )}
      </div>

      {/* Reset Confirmation Dialog Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-800">ยืนยันการคืนค่าเริ่มต้นของระบบ?</h3>
              <p className="text-sm text-slate-500">
                ข้อมูลผู้รับจ้าง ข้อมูลหน่วยงาน สัญญาจ้าง และบันทึกเวลาทั้งหมดจะถูกแทนที่ด้วยข้อมูลตั้งต้น ข้อมูลที่คุณแก้ไขจะไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
              >
                ยืนยันคืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
