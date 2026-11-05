'use client';

/**
 * src/app/admin/options/page.tsx
 * ==============================================================================
 * Dynamic Dropdown Options Management (Admin Panel)
 * Allows Admin to add, edit, toggle active, sort, and delete options per category
 * ==============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ListFilter, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import type { SystemOption, OptionCategory } from '@/types/systemOptions';

const CATEGORIES: { id: OptionCategory; label: string; description: string }[] = [
  { id: 'title', label: 'คำนำหน้าชื่อ (Title)', description: 'ตัวเลือกคำนำหน้าชื่อผู้รับจ้างและผู้ลงนาม เช่น นาย, นาง, นางสาว' },
  { id: 'position', label: 'ตำแหน่งงาน (Position)', description: 'ชื่องานตามสัญญาจ้าง เช่น จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์' },
  { id: 'agency', label: 'ส่วนราชการผู้ว่าจ้าง (Agency)', description: 'ชื่อหน่วยงานหรือส่วนราชการที่ปฏิบัติงาน' },
  { id: 'payer_agency', label: 'ส่วนราชการผู้จ่ายเงิน (Payer)', description: 'หน่วยงานผู้จ่ายเงินและเบิกจ่ายงบประมาณ' },
  { id: 'bank', label: 'ธนาคาร (Bank)', description: 'รายชื่อธนาคารสำหรับรับโอนเงินค่าจ้าง' },
  { id: 'leave_type', label: 'ประเภทการลา (Leave Type)', description: 'ประเภทการลา เช่น ลาป่วย, ลากิจส่วนตัว, ขาดงาน' },
];

export default function AdminOptionsPage() {
  const [activeCategory, setActiveCategory] = useState<OptionCategory>('position');
  const [options, setOptions] = useState<SystemOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New option form
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newSortOrder, setNewSortOrder] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/system-options?category=${activeCategory}&all=true`);
      if (res.ok) {
        const data = await res.json();
        setOptions(data.options || []);
        // Suggest next sort order
        const maxSort = (data.options || []).reduce((max: number, o: SystemOption) => Math.max(max, o.sort_order || 0), 0);
        setNewSortOrder(maxSort + 1);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Add Option
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      showToast('error', 'กรุณาระบุชื่อตัวเลือก');
      return;
    }

    const val = newValue.trim() || newLabel.trim();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/system-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          label: newLabel.trim(),
          value: val,
          sort_order: newSortOrder,
        }),
      });

      if (res.ok) {
        setNewLabel('');
        setNewValue('');
        showToast('success', `เพิ่มตัวเลือก "${newLabel}" เรียบร้อยแล้ว`);
        fetchOptions();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'ไม่สามารถเพิ่มตัวเลือกได้');
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (option: SystemOption) => {
    const nextActive = !option.is_active;
    try {
      const res = await fetch(`/api/system-options/${option.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (res.ok) {
        setOptions((prev) =>
          prev.map((o) => (o.id === option.id ? { ...o, is_active: nextActive } : o))
        );
        showToast('success', `${nextActive ? 'เปิด' : 'ปิด'}การแสดงผลตัวเลือกเรียบร้อยแล้ว`);
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการปรับสถานะ');
    }
  };

  // Delete Option
  const handleDeleteOption = async (id: string, label: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบตัวเลือก "${label}"?`)) return;

    try {
      const res = await fetch(`/api/system-options/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOptions((prev) => prev.filter((o) => o.id !== id));
        showToast('success', `ลบตัวเลือก "${label}" เรียบร้อยแล้ว`);
      }
    } catch {
      showToast('error', 'ไม่สามารถลบตัวเลือกได้');
    }
  };

  const currentCategoryInfo = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Category Selection Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>เลือกหมวดหมู่ Dropdown ที่ต้องการจัดการ</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {currentCategoryInfo && (
          <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            ℹ️ {currentCategoryInfo.description}
          </p>
        )}
      </div>

      {/* Add New Option Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-heading font-bold text-sm md:text-base text-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>เพิ่มตัวเลือกใหม่ในหมวด &ldquo;{currentCategoryInfo?.label}&rdquo;</span>
        </h3>

        <form onSubmit={handleAddOption} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ชื่อแสดงใน Dropdown (Label) *
            </label>
            <input
              type="text"
              required
              value={newLabel}
              onChange={(e) => {
                setNewLabel(e.target.value);
                if (!newValue) setNewValue(e.target.value);
              }}
              placeholder="เช่น ตำแหน่งใหม่ หรือ หน่วยงานใหม่..."
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ค่าระบบ (Value) <span className="text-slate-400 font-normal">(ถ้าว่างจะใช้ชื่อแสดง)</span>
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="เช่น computer_technician"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">ลำดับ</label>
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full min-h-[44px] px-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-center"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-xs md:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มตัวเลือก'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Options List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm md:text-base text-slate-800 flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-amber-600" />
            <span>รายการตัวเลือกปัจจุบัน ({options.length} รายการ)</span>
          </h3>
          <button
            type="button"
            onClick={fetchOptions}
            title="รีเฟรช"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center w-16">ลำดับ</th>
                <th className="px-4 py-3">ชื่อตัวเลือก (Label)</th>
                <th className="px-4 py-3">ค่าระบบ (Value)</th>
                <th className="px-4 py-3 text-center w-32">สถานะใช้งาน</th>
                <th className="px-4 py-3 text-center w-24">ค่าเริ่มต้น</th>
                <th className="px-4 py-3 text-right w-20">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {options.length > 0 ? (
                options.map((opt) => (
                  <tr key={opt.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sort Order */}
                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {opt.sort_order}
                    </td>

                    {/* Label */}
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {opt.label}
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {opt.value}
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(opt)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          opt.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {opt.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>เปิดใช้งาน</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>ปิดใช้งาน</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Default Indicator */}
                    <td className="px-4 py-3 text-center">
                      {opt.is_default ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          DEFAULT
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Delete Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(opt.id, opt.label)}
                        title="ลบตัวเลือกนี้"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    {isLoading ? 'กำลังโหลดตัวเลือก...' : 'ยังไม่มีตัวเลือกในหมวดหมู่นี้'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
