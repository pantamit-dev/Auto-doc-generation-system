# Deployment Guide — salary-doc-web

> คู่มือ deploy โครงการบน Vercel เชื่อมต่อกับ Supabase

---

## 🏗️ โครงสร้าง Infrastructure

```
┌─────────────────────────────────────────────────────┐
│                    Vercel                           │
│   ┌─────────────────┐   ┌─────────────────────┐   │
│   │  Next.js App    │   │  Edge / Serverless  │   │
│   │  (Static + SSR) │   │  Functions (API)    │   │
│   └────────┬────────┘   └──────────┬──────────┘   │
└────────────┼─────────────────────────────────────── ┘
             │ HTTPS                 │ Supabase Client
             ▼                       ▼
     ┌───────────────┐    ┌─────────────────────┐
     │  User Browser │    │      Supabase       │
     └───────────────┘    │  (PostgreSQL + Auth)│
                          └─────────────────────┘
```

---

## 🚀 การ Deploy ครั้งแรก

### ขั้นที่ 1: เตรียม Vercel Account

1. ไปที่ [https://vercel.com](https://vercel.com)
2. Sign in ด้วย GitHub account
3. Import repository `Salary_Doc_app`

### ขั้นที่ 2: ตั้งค่า Project

ใน Vercel Dashboard ระหว่าง import:

| Setting | ค่า |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `salary-doc-web` |
| Build Command | `npm run build` |
| Output Directory | `.next` (auto-detect) |
| Install Command | `npm install` |

### ขั้นที่ 3: เพิ่ม Environment Variables

ก่อน deploy ต้องใส่ ENV vars (ดูรายละเอียดที่ [environment-setup.md](./environment-setup.md)):

```
NEXT_PUBLIC_SUPABASE_URL     = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```

### ขั้นที่ 4: Deploy

```powershell
# หรือ deploy ผ่าน CLI
npx vercel --prod
```

---

## 📄 vercel.json Configuration

ไฟล์ `vercel.json` ที่ root ของโปรเจค:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key"
  }
}
```

> [!NOTE]
> `@variable_name` หมายถึง Vercel Secret ที่ตั้งค่าผ่าน Dashboard

---

## 🔄 การ Deploy อัตโนมัติ (CI/CD)

Vercel จะ deploy อัตโนมัติเมื่อ:

| Branch | Environment | URL |
|---|---|---|
| `main` | Production | `https://salary-doc-web.vercel.app` |
| `develop` | Preview | `https://salary-doc-web-git-develop-xxx.vercel.app` |
| PR branches | Preview | Auto-generated URL |

---

## 🗄️ Database Migration บน Production

### วิธีที่แนะนำ: Supabase Dashboard SQL Editor

1. เปิด Supabase Dashboard → SQL Editor
2. Paste เนื้อหา `supabase/migrations/20261102000000_init_schema.sql`
3. กด **Run**

### วิธีที่ 2: Supabase CLI (ถ้า link project แล้ว)

```powershell
supabase db push
```

> [!WARNING]
> การรัน migration ซ้ำบน production database ที่มีข้อมูลอยู่แล้ว  
> ควรตรวจสอบว่า migration ใช้ `IF NOT EXISTS` และ `ON CONFLICT DO NOTHING`

---

## 🔍 ตรวจสอบหลัง Deploy

### Checklist หลัง Production Deploy

- [ ] เปิด URL หน้าแรก ต้อง load ได้ปกติ
- [ ] ทดสอบ `/auth/login` — form แสดงถูกต้อง
- [ ] ทดสอบ POST `/api/calculate` ด้วย curl หรือ Postman
- [ ] ตรวจสอบ Vercel Function Logs ว่าไม่มี error

```powershell
# ทดสอบ API หลัง deploy
curl -X POST https://salary-doc-web.vercel.app/api/calculate `
  -H "Content-Type: application/json" `
  -d '{"startDate":"2026-10-01","endDate":"2027-09-30","monthlyWage":19800}'
```

### ดู Vercel Logs

```powershell
npx vercel logs salary-doc-web --follow
```

---

## ♻️ Rollback

หาก production มีปัญหา:

### ผ่าน Vercel Dashboard
1. ไปที่ project → **Deployments**
2. เลือก deployment ที่ stable
3. กด **Promote to Production**

### ผ่าน CLI
```powershell
npx vercel rollback
```

---

## 🌍 Custom Domain (ถ้ามี)

```powershell
# เพิ่ม custom domain
npx vercel domains add yourdomain.com

# ตรวจสอบ DNS
npx vercel domains inspect yourdomain.com
```

---

## 📊 Performance Tips

1. **Image Optimization** — ใช้ `<Image>` จาก `next/image` แทน `<img>` ทั่วไป
2. **Font Loading** — ใช้ `next/font` เพื่อโหลด TH Sarabun
3. **Code Splitting** — Next.js จัดการให้อัตโนมัติ
4. **Caching** — กำหนด `cache: 'force-cache'` สำหรับ static data
