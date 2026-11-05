# 📚 เอกสารโครงการ salary-doc-web

> ระบบจัดการเอกสารสัญญาจ้างและเงินเดือนสำหรับราชการไทย  
> Thai Government Contractor Salary & Document Management System

---

## 📂 โครงสร้างเอกสาร (Documentation Structure)

```
docs/
├── README.md                    ← หน้านี้ (ดัชนีเอกสารทั้งหมด)
│
├── agent/                       ← เอกสารสำหรับ AGY Agent
│   ├── AGENTS.md                ← กฎและคำแนะนำสำหรับ agent
│   ├── project-context.md       ← บริบทโครงการและโดเมนธุรกิจ
│   ├── code-conventions.md      ← รูปแบบโค้ดที่ต้องปฏิบัติตาม
│   └── task-checklist.md        ← รายการตรวจสอบก่อน/หลังทำงาน
│
├── developer/                   ← เอกสารสำหรับนักพัฒนา
│   ├── getting-started.md       ← คู่มือเริ่มต้นใช้งาน
│   ├── environment-setup.md     ← ตั้งค่า environment variables
│   ├── deployment.md            ← คู่มือ deploy บน Vercel
│   └── testing.md               ← คู่มือการทดสอบ
│
├── api/                         ← เอกสาร API
│   └── calculate-endpoint.md   ← POST /api/calculate
│
├── database/                    ← เอกสารฐานข้อมูล
│   └── schema.md                ← โครงสร้างตาราง Supabase
│
└── architecture/                ← เอกสารสถาปัตยกรรม
    └── system-overview.md       ← ภาพรวมระบบและ data flow
```

---

## 🚀 เริ่มต้นอย่างรวดเร็ว (Quick Start)

| กลุ่มผู้ใช้ | เอกสารที่ควรอ่านก่อน |
|---|---|
| **นักพัฒนาใหม่** | [Getting Started](./developer/getting-started.md) → [Environment Setup](./developer/environment-setup.md) |
| **AGY Agent** | [AGENTS.md](./agent/AGENTS.md) → [Project Context](./agent/project-context.md) |
| **DevOps / Deploy** | [Deployment Guide](./developer/deployment.md) |
| **QA / Testing** | [Testing Guide](./developer/testing.md) |
| **DBA** | [Database Schema](./database/schema.md) |

---

## 🔑 ข้อมูลสำคัญของโครงการ

| รายการ | ค่า |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Language** | TypeScript |
| **Node Version** | ≥ 18.x |

---

## ⚠️ กฎเหล็กของโครงการ

> [!CAUTION]
> หากพบ error ระหว่าง run code และไม่สามารถแก้ไขได้ภายใน 2 รอบ  
> **ให้หยุดทันทีและรายงานให้ผู้พัฒนาตรวจสอบ**

> [!IMPORTANT]
> - ห้ามแก้ไขไฟล์ `.env.local` โดยตรง — ใช้ Vercel Dashboard เท่านั้น
> - ห้าม commit ข้อมูลส่วนบุคคล (เลขบัตรประชาชน, บัญชีธนาคาร) ลง Git
> - ทุก UI component ต้องรองรับ touch target ≥ 44px (mobile-first)
> - ฟอนต์หลักต้องเป็น TH Sarabun สำหรับเอกสารราชการ
