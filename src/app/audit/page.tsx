'use client';

/**
 * src/app/audit/page.tsx
 * Interactive Audit Log History & Changes Diff Viewer
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Eye,
  X,
  FileText,
  User,
  Building,
  Sparkles,
  RefreshCw,
  Clock,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { useSalaryStore } from '@/lib/store/useSalaryStore';
import type { AuditLogEntry } from '@/types/schema';

// Badge color mapping based on action type
function getActionBadgeStyle(action: string) {
  const norm = action.toUpperCase();
  if (norm.includes('PROFILE')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (norm.includes('AGENCY')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (norm.includes('CONTRACT')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (norm.includes('WORKLOAD') || norm.includes('ATTENDANCE')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (norm.includes('RESET')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (norm.includes('IMPORT') || norm.includes('EXPORT')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (norm.includes('DOCUMENT')) {
    return 'bg-teal-50 text-teal-700 border-teal-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function getActionIcon(action: string) {
  const norm = action.toUpperCase();
  if (norm.includes('PROFILE')) return <User className="w-3.5 h-3.5" />;
  if (norm.includes('AGENCY')) return <Building className="w-3.5 h-3.5" />;
  if (norm.includes('CONTRACT')) return <FileText className="w-3.5 h-3.5" />;
  if (norm.includes('WORKLOAD') || norm.includes('ATTENDANCE'))
    return <Sparkles className="w-3.5 h-3.5" />;
  if (norm.includes('RESET')) return <RefreshCw className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
}

export default function AuditPage() {
  const auditLogs = useSalaryStore((state) => state.auditLogs);
  const resetToDefaults = useSalaryStore((state) => state.resetToDefaults);
  const isHydrated = useSalaryStore((state) => state.isHydrated);
  const initStore = useSalaryStore((state) => state.initStore);

  useEffect(() => {
    if (!isHydrated) {
      initStore();
    }
  }, [isHydrated, initStore]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeEntry, setActiveEntry] = useState<AuditLogEntry | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Category filter definitions
  const categories = [
    { id: 'ALL', label: 'ทั้งหมด' },
    { id: 'PROFILE', label: 'ข้อมูลส่วนตัว (Profile)' },
    { id: 'AGENCY', label: 'หน่วยงาน (Agency)' },
    { id: 'CONTRACT', label: 'สัญญาจ้าง (Contract)' },
    { id: 'GENERATOR', label: 'ระบบสุ่ม/คำนวณ (Generator)' },
    { id: 'SYSTEM', label: 'ระบบ (System/Reset)' },
  ];

  // Filtering and sorting logic
  const filteredLogs = useMemo(() => {
    let result = [...auditLogs];

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((entry) => {
        const act = (entry.action || entry.action_type || '').toUpperCase();
        if (selectedCategory === 'PROFILE') return act.includes('PROFILE');
        if (selectedCategory === 'AGENCY') return act.includes('AGENCY');
        if (selectedCategory === 'CONTRACT') return act.includes('CONTRACT');
        if (selectedCategory === 'GENERATOR')
          return act.includes('WORKLOAD') || act.includes('ATTENDANCE');
        if (selectedCategory === 'SYSTEM')
          return (
            act.includes('RESET') ||
            act.includes('IMPORT') ||
            act.includes('EXPORT')
          );
        return true;
      });
    }

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((entry) => {
        const summary = (entry.summary || '').toLowerCase();
        const actor = (entry.actor || entry.actor_name || '').toLowerCase();
        const act = (entry.action || entry.action_type || '').toLowerCase();
        const entity = (entry.entity_type || '').toLowerCase();
        const id = (entry.id || '').toLowerCase();
        return (
          summary.includes(q) ||
          actor.includes(q) ||
          act.includes(q) ||
          entity.includes(q) ||
          id.includes(q)
        );
      });
    }

    // Sort order (default: newest first / desc)
    result.sort((a, b) => {
      const tA = new Date(a.timestamp || a.created_at || 0).getTime();
      const tB = new Date(b.timestamp || b.created_at || 0).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

    return result;
  }, [auditLogs, selectedCategory, searchQuery, sortOrder]);

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `audit_logs_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            <History className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl md:text-2xl font-bold text-slate-800">
                บันทึกประวัติการแก้ไขและคำนวณ (Audit Log System)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs md:text-sm font-semibold bg-indigo-100 text-indigo-800">
                {auditLogs.length} รายการ
              </span>
            </div>
            <p className="text-slate-500 text-sm md:text-base mt-1">
              ติดตามทุกการแก้ไขข้อมูล การสุ่มภาระงาน การจำลองเวลา และการพิมพ์เอกสาร (บันทึกอัตโนมัติพร้อม Changes Diff)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportJson}
            disabled={auditLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm md:text-base font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-[46px]"
          >
            <Download className="w-4 h-4 text-slate-500" />
            ส่งออก JSON
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={auditLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm md:text-base font-medium hover:bg-rose-100 transition-colors disabled:opacity-50 min-h-[46px]"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            ล้างประวัติ
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามสรุปการทำงาน, ผู้กระทำ, ชนิดข้อมูล หรือรหัสอ้างอิง..."
              className="w-full min-h-[46px] pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Order Button */}
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
            }
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[44px]"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span>
              {sortOrder === 'desc' ? 'ล่าสุดก่อน (ใหม่ → เก่า)' : 'เก่าก่อน (เก่า → ใหม่)'}
            </span>
          </button>
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Audit History Table / Card Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">
              ไม่พบประวัติการใช้งาน
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'ไม่พบบันทึกที่ตรงกับเงื่อนไขการค้นหา ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
                : 'ระบบยังไม่มีประวัติการกระทำ การแก้ไขข้อมูลหรือการสุ่มภาระงานจะถูกบันทึกที่นี่โดยอัตโนมัติ'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">วันและเวลา (Timestamp)</th>
                  <th className="py-3 px-4">ประเภทเหตุการณ์ (Action)</th>
                  <th className="py-3 px-4">สรุปการดำเนินการ (Summary)</th>
                  <th className="py-3 px-4">ผู้กระทำ (Actor)</th>
                  <th className="py-3 px-4 text-center">รายละเอียด (Diff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredLogs.map((entry) => {
                  const actionStr = entry.action || entry.action_type || '';
                  const actorStr = entry.actor || entry.actor_name || 'ระบบอัตโนมัติ';
                  const dateStr = entry.timestamp || entry.created_at || '';

                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '-';

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="font-mono font-medium text-slate-700">
                          {formattedDate}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {entry.id.slice(0, 18)}...
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getActionBadgeStyle(
                            actionStr
                          )}`}
                        >
                          {getActionIcon(actionStr)}
                          <span>{actionStr}</span>
                        </span>
                      </td>

                      {/* Summary & Entity */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {entry.summary}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {entry.entity_type}
                          </span>
                          {entry.entity_id && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {entry.entity_id.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{actorStr}</span>
                        </div>
                      </td>

                      {/* Diff Action Button */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveEntry(entry)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors min-h-[36px]"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>ดู Diff</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Diff & Metadata Inspection Drawer/Modal */}
      {activeEntry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${getActionBadgeStyle(
                      activeEntry.action || activeEntry.action_type || ''
                    )}`}
                  >
                    {activeEntry.action || activeEntry.action_type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {activeEntry.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {activeEntry.summary}
                </h3>
              </div>
              <button
                onClick={() => setActiveEntry(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Event Meta Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">ผู้ดำเนินการ (Actor)</span>
                  <span className="font-semibold text-slate-800">
                    {activeEntry.actor || activeEntry.actor_name || 'ระบบอัตโนมัติ'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">วันเวลา (Timestamp)</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {activeEntry.timestamp || activeEntry.created_at}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">ประเภทข้อมูล (Entity)</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {activeEntry.entity_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">รหัสอ้างอิง (Entity ID)</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {activeEntry.entity_id || '-'}
                  </span>
                </div>
              </div>

              {/* Changes Diff Section */}
              {(() => {
                const diff = activeEntry.diff || activeEntry.changes_diff;
                if (!diff || (!diff.before && !diff.after)) {
                  return (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      ไม่มีข้อมูลความแตกต่างของข้อมูล (No Diff Recorded)
                    </div>
                  );
                }

                const beforeKeys = Object.keys(diff.before || {});
                const afterKeys = Object.keys(diff.after || {});
                const allKeys = Array.from(new Set([...beforeKeys, ...afterKeys]));

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                        รายการข้อมูลที่เปลี่ยนแปลง (Changes Diff)
                      </h4>
                      <span className="text-xs text-slate-500">
                        {allKeys.length} ฟิลด์ที่มีการเปลี่ยนแปลง
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                      {allKeys.map((key) => {
                        const beforeVal = (diff.before as any)?.[key];
                        const afterVal = (diff.after as any)?.[key];
                        const isObject =
                          typeof beforeVal === 'object' ||
                          typeof afterVal === 'object';

                        return (
                          <div key={key} className="p-3 text-xs space-y-1.5">
                            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {key}
                            </span>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="p-2 rounded bg-rose-50/60 border border-rose-200 text-rose-900 font-mono break-all">
                                <span className="text-[10px] uppercase font-bold text-rose-500 block mb-1">
                                  ก่อนแก้ไข (Before)
                                </span>
                                {isObject
                                  ? JSON.stringify(beforeVal)
                                  : String(beforeVal ?? '—')}
                              </div>
                              <div className="p-2 rounded bg-emerald-50/60 border border-emerald-200 text-emerald-900 font-mono break-all">
                                <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-1">
                                  หลังแก้ไข (After)
                                </span>
                                {isObject
                                  ? JSON.stringify(afterVal)
                                  : String(afterVal ?? '—')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Execution Metadata Section */}
              {activeEntry.metadata &&
                Object.keys(activeEntry.metadata).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      พารามิเตอร์การประมวลผล (Execution Metadata)
                    </h4>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs divide-y divide-slate-200/60">
                      {Object.entries(activeEntry.metadata).map(
                        ([k, v]) => (
                          <div
                            key={k}
                            className="py-1.5 flex justify-between items-center"
                          >
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-bold text-slate-800">
                              {typeof v === 'object'
                                ? JSON.stringify(v)
                                : String(v)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleCopyJson(activeEntry)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors min-h-[44px]"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>คัดลอก JSON แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอก Raw JSON</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveEntry(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium transition-colors min-h-[44px]"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  ยืนยันการล้างประวัติ Audit Log?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  การกระทำนี้จะล้างประวัติการแก้ไขทั้งหมดที่บันทึกไว้ใน Local Storage
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              หมายเหตุ: หากต้องการเก็บประวัติไว้เพื่อการตรวจสอบ กรุณากดปุ่ม <strong>&quot;ส่งออก JSON&quot;</strong> ก่อนดำเนินการ
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  await resetToDefaults();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition-colors min-h-[44px]"
              >
                ยืนยันล้างข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
