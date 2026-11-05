# 📄 salary-doc-web

> **ระบบจัดการเอกสารสัญญาจ้างและเงินเดือน — กระทรวงสาธารณสุข**  
> Thai Government Contractor Salary & Document Management System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://typescriptlang.org)

---

## 🚀 Quick Start

```powershell
# 1. เข้าโฟลเดอร์โปรเจค
cd g:\REA-Working\Salary_Doc_app\salary-doc-web

# 2. ติดตั้ง dependencies
npm install

# 3. ตั้งค่า environment variables
# สร้างไฟล์ .env.local และใส่ค่าจาก Supabase Dashboard:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 4. รัน dev server
npm run dev
```

เปิดที่ `http://localhost:3000`

> ⚠️ **Windows PowerShell:** ใช้ `;` แทน `&&` เสมอ

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | คำอธิบาย |
|---|---|
| 🔐 Authentication | Login/Signup ด้วย Supabase Auth |
| 💰 Calculation Engine | คำนวณเงินเดือน, อัตราวันทำงาน, เงินหัก อัตโนมัติ |
| 📊 Workload Matrix | สร้างตาราง 110 ชิ้นงาน × 18 รายการ × 31 วัน |
| 🗓️ Calendar | ระบุวันหยุดราชการ, วันลา, วันทำงานอัตโนมัติ |
| 📄 Document Preview | ดูตัวอย่างและพิมพ์เอกสาร 5 ประเภท |
| 🔢 Thai Numerals | แปลงตัวเลขเป็นตัวหนังสือภาษาไทยอัตโนมัติ |
| 📝 Audit Log | บันทึกประวัติการเปลี่ยนแปลงทุกรายการ |

---

## 📚 เอกสารโครงการ

| เอกสาร | เส้นทาง |
|---|---|
| 📖 Developer Guide | [docs/developer/getting-started.md](docs/developer/getting-started.md) |
| ⚙️ Environment Setup | [docs/developer/environment-setup.md](docs/developer/environment-setup.md) |
| 🚀 Deployment | [docs/developer/deployment.md](docs/developer/deployment.md) |
| 🧪 Testing | [docs/developer/testing.md](docs/developer/testing.md) |
| 🤖 Agent Rules | [docs/agent/AGENTS.md](docs/agent/AGENTS.md) |
| 🏢 Project Context | [docs/agent/project-context.md](docs/agent/project-context.md) |
| 🌐 API Reference | [docs/api/calculate-endpoint.md](docs/api/calculate-endpoint.md) |
| 🗄️ Database Schema | [docs/database/schema.md](docs/database/schema.md) |
| 🏗️ Architecture | [docs/architecture/system-overview.md](docs/architecture/system-overview.md) |

---

## 🛠️ Commands

```powershell
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check

# Tests
npx tsx tests/runner.ts                              # All integration tests
npx tsx src/lib/calculation/__tests__/salaryEngine.test.ts  # Unit tests
```

---

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL) + Row Level Security
- **State:** Zustand
- **Styling:** Tailwind CSS (mobile-first, touch ≥ 44px)
- **Hosting:** Vercel
- **Font:** TH Sarabun New (เอกสารราชการ)

---

## 📂 Project Structure

```
src/
├── app/                    # Next.js pages & API routes
│   ├── api/calculate/      # POST /api/calculate
│   ├── auth/               # login, signup
│   └── preview/[docId]/    # document preview
├── components/             # React components
├── lib/
│   ├── calculation/        # salaryEngine.ts (business logic)
│   ├── store/              # useSalaryStore.ts (Zustand)
│   ├── audit/              # auditLogger.ts
│   └── utils/              # thaiNumerals.ts
└── types/                  # TypeScript types
supabase/migrations/        # Database migrations
tests/                      # Integration tests
docs/                       # 📚 All documentation
```

---

## 🔑 Environment Variables

```bash
# .env.local (ต้องสร้างเอง ห้าม commit)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

ดูรายละเอียด: [docs/developer/environment-setup.md](docs/developer/environment-setup.md)

---

## 📋 ข้อมูลสัญญาตัวอย่าง

| รายการ | ค่า |
|---|---|
| หน่วยงาน | วิทยาลัยนักบริหารสาธารณสุข |
| เงินเดือน | 19,800 บาท/เดือน |
| ระยะสัญญา | 1 ต.ค. 2569 – 30 ก.ย. 2570 (12 เดือน) |
| มูลค่าสัญญา | 237,600 บาท |
| อัตราวันทำงาน | 660 บาท/วัน |
| ชิ้นงาน | 110 ชิ้น/งวด |

---

## 🤝 สำหรับ AGY Agent

อ่าน [AGENTS.md](AGENTS.md) และ [docs/agent/AGENTS.md](docs/agent/AGENTS.md) ก่อนเริ่มงานทุกครั้ง
"# Auto-doc-generation-system" 
