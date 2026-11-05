# Environment Setup — salary-doc-web

> คู่มือการตั้งค่า Environment Variables สำหรับ local development และ Vercel deployment

---

## 🔑 Environment Variables ที่จำเป็น

| ตัวแปร | ต้องการ | ขอบเขต | คำอธิบาย |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ บังคับ | Public (client) | URL ของ Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ บังคับ | Public (client) | Anon/Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Optional | Server only | Service role key (admin access) |
| `ADMIN_EMAIL` | เฉพาะสคริปต์ | Local only | อีเมลสำหรับบัญชี admin ใน `scripts/createAdmin.ts` |
| `ADMIN_PASSWORD` | เฉพาะสคริปต์ | Local only | รหัสผ่านสำหรับบัญชี admin ใน `scripts/createAdmin.ts` |

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` มีสิทธิ์ admin เต็มรูปแบบ — **ห้ามใช้ใน client-side code เด็ดขาด**

---

## 📁 การตั้งค่า Local Development

### สร้างไฟล์ `.env.local`

```bash
# G:\REA-Working\Salary_Doc_app\salary-doc-web\.env.local

# ======================================================
# Supabase Configuration
# ======================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: ใช้เฉพาะใน server-side API routes
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### หา Credentials ใน Supabase Dashboard

1. เปิด [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. เลือก project ของคุณ
3. ไปที่ **Settings** → **API**
4. Copy ค่าต่อไปนี้:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ☁️ การตั้งค่า Vercel

### วิธีที่ 1: ผ่าน Vercel Dashboard

1. เปิด [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. เลือก project `salary-doc-web`
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่มตัวแปรทีละตัว:

| Variable Name | Environment | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | `eyJ...` |

### วิธีที่ 2: ผ่าน Vercel CLI

```powershell
# Login Vercel (ถ้ายังไม่ได้ login)
npx vercel login

# Link กับ project
npx vercel link

# Pull env vars ลงมา local
npx vercel env pull .env.local

# เพิ่ม env var ใหม่
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

---

## 🔒 `.env.example` (Template สำหรับทีม)

ไฟล์นี้ **ควร commit** ลง Git เพื่อให้ทีมรู้ว่าต้องตั้งค่าอะไร:

```bash
# .env.example — Copy ไฟล์นี้เป็น .env.local แล้วใส่ค่าจริง

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🔍 ตรวจสอบการเชื่อมต่อ

### ทดสอบ Supabase Connection

```typescript
// ทดสอบได้ใน browser console หลังรัน npm run dev
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const { data, error } = await supabase.from('contractors').select('id').limit(1);
console.log(data, error);
```

### ตรวจสอบใน Next.js

```powershell
# ดู env ที่ถูก load (development only)
npm run dev
# ไปที่ http://localhost:3000/api/health (ถ้ามี)
```

---

## 🛡️ Security Best Practices

### ✅ ทำ

- ใช้ `NEXT_PUBLIC_` prefix เฉพาะ keys ที่ต้องการใน client-side
- เก็บ `SERVICE_ROLE_KEY` ไว้ใน server-side เท่านั้น
- Rotate keys เมื่อสงสัยว่า leaked
- ใช้ RLS (Row Level Security) ใน Supabase เสมอ

### ❌ ห้าม

- ไม่ commit `.env.local` ลง Git (มีใน `.gitignore` แล้ว)
- ไม่ใส่ credentials ใน source code
- ไม่ใช้ Service Role Key ใน client component
- ไม่ share API keys ผ่าน chat หรือ email

---

## 📋 `.gitignore` ที่เกี่ยวข้อง

```gitignore
# Environment files (ต้องมีใน .gitignore)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

> [!TIP]
> ตรวจสอบด้วย `git status` ว่า `.env.local` ไม่ถูก track

สำหรับ `scripts/createAdmin.ts` ให้กำหนด `ADMIN_EMAIL` และ `ADMIN_PASSWORD` ใน `.env.local` โดยใช้บัญชีของคุณเอง ห้ามใส่ข้อมูลบัญชีจริงใน source code หรือ commit ลง Git
