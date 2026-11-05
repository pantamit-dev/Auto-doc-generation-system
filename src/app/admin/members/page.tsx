'use client';

/**
 * src/app/admin/members/page.tsx
 * ==============================================================================
 * Membership Management System (CRUD + Instant Search & Filtering)
 * Designed with /ui-ux-pro-max: WCAG AAA contrast, responsive table, modal dialogs
 * ==============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Shield, 
  User, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import type { ContractorProfile } from '@/types/schema';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<ContractorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<ContractorProfile> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Toggle Member Status (active <-> suspended)
  const handleToggleStatus = async (member: ContractorProfile) => {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
        );
        showToast('success', `เปลี่ยนสถานะเป็น ${nextStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'} แล้ว`);
      }
    } catch {
      showToast('error', 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  // Toggle Role (admin <-> member)
  const handleToggleRole = async (member: ContractorProfile) => {
    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
        );
        showToast('success', `เปลี่ยนสิทธิ์เป็น ${nextRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิก (Member)'} แล้ว`);
      }
    } catch {
      showToast('error', 'ไม่สามารถเปลี่ยนบทบาทได้');
    }
  };

  // Delete Member
  const handleDeleteMember = async (id?: string) => {
    if (!id || !confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสมาชิกรายนี้ออกจากระบบ?')) return;
    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        showToast('success', 'ลบสมาชิกออกจากระบบเรียบร้อยแล้ว');
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการลบสมาชิก');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (member: ContractorProfile) => {
    setEditingMember({ ...member });
    setIsModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingMember({
      title: 'นาย',
      first_name: '',
      last_name: '',
      citizen_id: '',
      position_title: 'จ้างเหมาบริการปฏิบัติงานเครื่องคอมพิวเตอร์',
      email: '',
      phone_number: '',
      role: 'member',
      status: 'active',
      bank_name: 'ธนาคารกรุงไทย',
      bank_account_no: '',
    });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.first_name || !editingMember?.last_name) {
      showToast('error', 'กรุณาระบุชื่อและนามสกุล');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingMember.id);
      const url = isEdit ? `/api/admin/members/${editingMember.id}` : '/api/admin/members';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast('success', isEdit ? 'แก้ไขข้อมูลสมาชิกสำเร็จ' : 'เพิ่มสมาชิกใหม่เรียบร้อยแล้ว');
        fetchMembers();
      } else {
        const errData = await res.json();
        showToast('error', errData.error || 'บันทึกข้อมูลล้มเหลว');
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Action Header: Search & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ, เลขบัตร ปชช., อีเมล, ชื่อ LINE..."
              className="w-full min-h-[44px] pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* New Member Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm flex-shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มสมาชิกใหม่</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">กรองสิทธิ์:</span>
          {['all', 'admin', 'member'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'all' ? 'ทั้งหมด' : role === 'admin' ? 'เฉพาะ Admin' : 'เฉพาะ Member'}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-400 font-medium">กรองสถานะ:</span>
          {['all', 'active', 'suspended'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'ทั้งหมด' : status === 'active' ? 'เปิดใช้งาน (Active)' : 'ระงับ (Suspended)'}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchMembers}
            title="รีเฟรชข้อมูล"
            className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Members Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-sm md:text-base text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>รายชื่อสมาชิกในระบบ</span>
            <span className="text-xs font-normal text-slate-400">({total} รายการ)</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">ผู้ใช้งาน (LINE / Profile)</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล & ตำแหน่ง</th>
                <th className="px-4 py-3">เลขประจำตัวประชาชน</th>
                <th className="px-4 py-3 text-center">บทบาท (Role)</th>
                <th className="px-4 py-3 text-center">สถานะ (Status)</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Identity & LINE */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.full_name}`}
                          alt=""
                          className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {member.display_name || member.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {member.email || (member.line_user_id ? `LINE: ${member.line_user_id.slice(0, 10)}...` : 'ไม่ระบุอีเมล')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Name & Position */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{member.full_name}</p>
                      <p className="text-xs text-slate-500">{member.position_title}</p>
                    </td>

                    {/* Citizen ID */}
                    <td className="px-4 py-3.5 text-slate-600 font-mono">
                      {member.citizen_id || '-'}
                    </td>

                    {/* Role Switcher */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRole(member)}
                        title="คลิกเพื่อสลับบทบาทระหว่าง Admin และ Member"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          member.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {member.role === 'admin' ? (
                          <>
                            <Shield className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Admin</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Member</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Status Switcher */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member)}
                        title="คลิกเพื่อเปิดใช้งานหรือระงับบัญชี"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {member.status === 'active' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ใช้งาน</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            <span>ระงับ</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        title="แก้ไขข้อมูล"
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        title="ลบสมาชิก"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {isLoading ? 'กำลังโหลดข้อมูลสมาชิก...' : 'ไม่พบรายชื่อสมาชิกตามเงื่อนไขที่ค้นหา'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Member Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-800">
                {editingMember.id ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">คำนำหน้า</label>
                  <select
                    value={editingMember.title || 'นาย'}
                    onChange={(e) => setEditingMember({ ...editingMember, title: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ว่าที่ร้อยตรี">ว่าที่ร้อยตรี</option>
                    <option value="ดร.">ดร.</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    required
                    value={editingMember.first_name || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, first_name: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={editingMember.last_name || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, last_name: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เลขประจำตัวประชาชน 13 หลัก</label>
                <input
                  type="text"
                  maxLength={13}
                  value={editingMember.citizen_id || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, citizen_id: e.target.value })}
                  placeholder="เช่น 1769900123456"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ตำแหน่งงานตามสัญญา</label>
                <input
                  type="text"
                  value={editingMember.position_title || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, position_title: e.target.value })}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={editingMember.email || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingMember.phone_number || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, phone_number: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">บทบาท (Role)</label>
                  <select
                    value={editingMember.role || 'member'}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as any })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="member">สมาชิกทั่วไป (Member)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">สถานะ (Status)</label>
                  <select
                    value={editingMember.status || 'active'}
                    onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as any })}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="suspended">ระงับการใช้งาน (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs md:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
