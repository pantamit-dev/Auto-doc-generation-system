'use client';

/**
 * src/app/admin/page.tsx
 * ==============================================================================
 * Admin Panel Overview Dashboard
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  ListFilter, 
  Sliders, 
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    adminMembers: 0,
    totalOptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [membersRes, optionsRes] = await Promise.all([
          fetch('/api/admin/members?limit=100'),
          fetch('/api/system-options?all=true'),
        ]);

        let totalMembers = 0;
        let activeMembers = 0;
        let adminMembers = 0;

        if (membersRes.ok) {
          const mData = await membersRes.json();
          totalMembers = mData.total || mData.members?.length || 0;
          activeMembers = mData.members?.filter((m: any) => m.status === 'active')?.length || 0;
          adminMembers = mData.members?.filter((m: any) => m.role === 'admin')?.length || 0;
        }

        let totalOptions = 0;
        if (optionsRes.ok) {
          const oData = await optionsRes.json();
          totalOptions = oData.options?.length || 0;
        }

        setStats({ totalMembers, activeMembers, adminMembers, totalOptions });
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'สมาชิกทั้งหมด',
      value: loading ? '...' : stats.totalMembers,
      sub: 'บัญชีผู้รับจ้างในระบบ',
      icon: Users,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
    },
    {
      title: 'สมาชิกที่ใช้งานอยู่',
      value: loading ? '...' : stats.activeMembers,
      sub: 'สถานะพร้อมใช้งาน (Active)',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'ผู้ดูแลระบบ (Admin)',
      value: loading ? '...' : stats.adminMembers,
      sub: 'สิทธิ์บริหารจัดการระบบ',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'ตัวเลือก Dropdown',
      value: loading ? '...' : stats.totalOptions,
      sub: 'ตัวเลือกแบบฟอร์ม 6 หมวดหมู่',
      icon: ListFilter,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">{card.title}</p>
                <p className="text-2xl font-bold font-heading text-slate-800">{card.value}</p>
                <p className="text-[11px] text-slate-400 truncate">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1: Membership Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base md:text-lg text-slate-800">
              ระบบจัดการสมาชิก (Members)
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              ค้นหาและกรองรายชื่อสมาชิก แก้ไขข้อมูลผู้รับจ้าง สลับสิทธิ์ Admin/Member และเปิด-ปิดสถานะการใช้งาน
            </p>
          </div>
          <Link
            href="/admin/members"
            className="inline-flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-sky-50 text-sky-700 font-semibold text-xs md:text-sm rounded-xl transition-colors border border-slate-200 hover:border-sky-200 mt-2"
          >
            <span>ไปที่จัดการสมาชิก</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Module 2: Dynamic Dropdown Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ListFilter className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base md:text-lg text-slate-800">
              จัดการตัวเลือก Dropdown
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              เพิ่ม ลบ และเปิด-ปิดตัวเลือกของฟอร์ม (คำนำหน้า, ตำแหน่งงาน, ส่วนราชการ, ธนาคาร, ประเภทการลา)
            </p>
          </div>
          <Link
            href="/admin/options"
            className="inline-flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-amber-50 text-amber-700 font-semibold text-xs md:text-sm rounded-xl transition-colors border border-slate-200 hover:border-amber-200 mt-2"
          >
            <span>ไปที่จัดการตัวเลือก</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Module 3: System Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base md:text-lg text-slate-800">
              การตั้งค่าระบบ (Settings)
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              ปรับค่าคงที่การคำนวณเงินเดือน (ตัวหาร 30 วัน), จำนวนชิ้นงานเป้าหมายต่องวด (110) และกรอบเวลาลงชื่อ
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="inline-flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs md:text-sm rounded-xl transition-colors border border-slate-200 hover:border-indigo-200 mt-2"
          >
            <span>ไปที่การตั้งค่าระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
