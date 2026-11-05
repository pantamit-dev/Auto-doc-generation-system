# Getting Started — salary-doc-web

> คู่มือเริ่มต้นสำหรับนักพัฒนาที่ต้องการรัน หรือพัฒนาต่อบนโครงการนี้

---

## 📋 ข้อกำหนดเบื้องต้น (Prerequisites)

| เครื่องมือ | เวอร์ชันที่ต้องการ | ตรวจสอบ |
|---|---|---|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 9.x | `npm --version` |
| Git | ≥ 2.x | `git --version` |
| Supabase CLI | ล่าสุด | `supabase --version` |

---

## 🚀 ขั้นตอนเริ่มต้น

### ขั้นที่ 1: Clone หรือเข้าถึงโปรเจค

```powershell
cd g:\REA-Working\Salary_Doc_app\salary-doc-web
```

### ขั้นที่ 2: ติดตั้ง dependencies

```powershell
npm install
```

### ขั้นที่ 3: ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจค:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role (ใช้เฉพาะ server-side เท่านั้น)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> [!IMPORTANT]
> ดูรายละเอียดเพิ่มเติมที่ [Environment Setup Guide](./environment-setup.md)

### ขั้นที่ 4: รัน Development Server

```powershell
npm run dev
```

เปิด browser ที่ `http://localhost:3000`

---

## 📂 โครงสร้างโปรเจค (Project Structure)

```
salary-doc-web/
├── src/
│   ├── app/                    ← Next.js App Router
│   │   ├── (auth)/             ← Auth group routes
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── api/
│   │   │   └── calculate/route.ts  ← Calculation API endpoint
│   │   ├── preview/
│   │   │   └── [docId]/page.tsx    ← Document preview
│   │   ├── layout.tsx
│   │   └── page.tsx            ← หน้าแรก
│   ├── components/             ← Reusable React components
│   │   ├── ProfileForm.tsx
│   │   ├── ContractForm.tsx
│   │   └── AgencyForm.tsx
│   ├── lib/
│   │   ├── calculation/        ← Business logic engine
│   │   │   ├── salaryEngine.ts
│   │   │   ├── types.ts
│   │   │   └── useCalculate.ts
│   │   ├── store/              ← Zustand state management
│   │   │   ├── useSalaryStore.ts
│   │   │   ├── supabaseAdapter.ts
│   │   │   ├── storageAdapter.ts
│   │   │   ├── defaultData.ts
│   │   │   └── types.ts
│   │   ├── audit/
│   │   │   └── auditLogger.ts
│   │   ├── utils/
│   │   │   └── thaiNumerals.ts
│   │   ├── supabaseClient.ts
│   │   └── requireAuth.ts
│   └── types/
│       ├── database.ts
│       ├── schema.ts
│       └── index.ts
├── supabase/
│   └── migrations/             ← Database migrations
├── tests/                      ← Integration tests
├── docs/                       ← เอกสารทั้งหมด (คุณอยู่ที่นี่)
├── public/                     ← Static assets
├── .env.local                  ← ⚠️ ไม่ commit — local only
├── vercel.json                 ← Vercel config
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔧 คำสั่งที่ใช้บ่อย

```powershell
# Development
npm run dev          # รัน dev server (http://localhost:3000)

# Build & Production
npm run build        # build สำหรับ production
npm run start        # รัน production build locally

# Code Quality
npm run lint         # ESLint check
npm run type-check   # TypeScript type check (no emit)

# Tests
npx tsx tests/runner.ts   # รัน integration tests
npx tsx src/lib/calculation/__tests__/salaryEngine.test.ts  # unit tests
```

> [!WARNING]
> **Windows PowerShell:** ใช้ `;` แทน `&&` สำหรับ chaining commands  
> ✅ `cd salary-doc-web; npm run dev`  
> ❌ `cd salary-doc-web && npm run dev`

---

## 🗄️ Database Setup

### เชื่อมต่อ Supabase

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก project หรือสร้าง project ใหม่
3. ไปที่ Settings → API → copy `Project URL` และ `anon public key`
4. วางใน `.env.local`

### รัน Database Migration

```powershell
# Login Supabase CLI
supabase login

# Link กับ project (ใช้ project ref จาก dashboard)
supabase link --project-ref your-project-ref

# รัน migration
supabase db push
```

หรือ copy เนื้อหาจาก `supabase/migrations/20261102000000_init_schema.sql`  
แล้ว paste ใน Supabase SQL Editor โดยตรง

---

## 🧪 ทดสอบว่าทุกอย่างทำงาน

หลังจากตั้งค่าเสร็จ ทดสอบด้วย:

```powershell
# 1. TypeScript ผ่าน
npm run type-check   # ต้องไม่มี error

# 2. Build ผ่าน
npm run build        # ต้องจบด้วย "✓ Compiled successfully"

# 3. API ทำงาน (รัน dev server ก่อน แล้ว test)
curl -X POST http://localhost:3000/api/calculate `
  -H "Content-Type: application/json" `
  -d '{"startDate":"2026-10-01","endDate":"2027-09-30","monthlyWage":19800}'
# ต้อง return {"success":true,"data":{...}}
```

---

## 🔗 ลิงก์เพิ่มเติม

- [Environment Setup](./environment-setup.md)
- [Deployment Guide](./deployment.md)
- [Testing Guide](./testing.md)
- [API Reference](../api/calculate-endpoint.md)
- [Database Schema](../database/schema.md)
