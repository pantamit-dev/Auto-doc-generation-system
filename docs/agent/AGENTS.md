# Agent Rules — salary-doc-web
# ไฟล์นี้เป็นกฎสำหรับ AGY Agent เมื่อทำงานในโปรเจค salary-doc-web

## 🎯 วัตถุประสงค์ของโครงการ

ระบบสร้างเอกสารราชการ (ใบส่งมอบงาน, ใบเสร็จรับเงิน, ตารางภาระงาน ฯลฯ) สำหรับผู้รับจ้างเหมาบริการ สังกัดกระทรวงสาธารณสุข โดยคำนวณอัตราค่าจ้าง วันทำงาน และจำนวนชิ้นงานอัตโนมัติ

---

## 🚨 กฎบังคับ (Mandatory Rules)

### กฎที่ 1: หยุดและรายงานเมื่อแก้ error ไม่ได้
```
หากพบ runtime error หรือ test failure และไม่สามารถแก้ไขได้หลังจากลองแล้ว 2 ครั้ง
→ หยุดทันที
→ รายงานให้ผู้ใช้ทราบพร้อมระบุ:
   1. Error message เต็ม
   2. ไฟล์และ line number ที่เกิด error
   3. สิ่งที่ลองแก้ไขแล้ว
   4. สิ่งที่ต้องการให้ผู้ใช้ตรวจสอบ
```

### กฎที่ 2: ภาษา
- ตอบเป็นภาษาไทยสำหรับการสื่อสารทั่วไปและสรุปผล
- ใช้ภาษาอังกฤษสำหรับ code, error messages, file paths
- Comment ในโค้ดใช้ภาษาอังกฤษ

### กฎที่ 3: ไม่แตะข้อมูลส่วนบุคคล
- ห้าม log หรือ print ข้อมูล citizen_id, bank_account_no ใน console
- ห้าม commit ข้อมูลจริงลง Git

### กฎที่ 4: สอบถามก่อนลบหรือ reset
- ก่อน reset, drop table หรือ delete ข้อมูล ต้องขออนุญาตจากผู้ใช้ก่อนเสมอ

---

## 📁 โครงสร้างโค้ดที่ Agent ต้องรู้จัก

```
salary-doc-web/
├── src/
│   ├── app/                     ← Next.js App Router pages & API routes
│   │   ├── api/calculate/       ← POST /api/calculate (calculation engine)
│   │   ├── auth/login/          ← หน้า login
│   │   ├── auth/signup/         ← หน้า signup
│   │   └── preview/[docId]/     ← หน้า print preview เอกสาร
│   ├── lib/
│   │   ├── calculation/
│   │   │   ├── salaryEngine.ts  ← 🔑 engine หลักคำนวณเงินเดือน
│   │   │   ├── types.ts         ← TypeScript types สำหรับ calculation
│   │   │   └── useCalculate.ts  ← React hook เรียก API
│   │   ├── store/
│   │   │   ├── useSalaryStore.ts ← 🔑 Zustand store หลัก (state management)
│   │   │   ├── supabaseAdapter.ts ← adapter ระหว่าง store กับ Supabase
│   │   │   ├── storageAdapter.ts  ← localStorage fallback
│   │   │   ├── defaultData.ts    ← ค่า default ทั้งหมด
│   │   │   └── types.ts          ← TypeScript types สำหรับ store
│   │   ├── audit/
│   │   │   └── auditLogger.ts   ← บันทึก audit log
│   │   ├── utils/
│   │   │   └── thaiNumerals.ts  ← แปลงตัวเลขเป็นตัวหนังสือไทย
│   │   ├── supabaseClient.ts    ← Supabase client initialization
│   │   └── requireAuth.ts       ← Auth guard hook
│   ├── components/
│   │   ├── ProfileForm.tsx      ← ฟอร์มข้อมูลผู้รับจ้าง
│   │   ├── ContractForm.tsx     ← ฟอร์มข้อมูลสัญญา
│   │   └── AgencyForm.tsx       ← ฟอร์มข้อมูลหน่วยงาน
│   └── types/
│       ├── database.ts          ← Supabase generated types
│       ├── schema.ts            ← schema types
│       └── index.ts             ← re-exports
├── supabase/
│   └── migrations/
│       └── 20261102000000_init_schema.sql ← 🔑 database migration
├── tests/                       ← integration & stress tests
├── docs/                        ← เอกสารทั้งหมด (โฟลเดอร์นี้)
├── vercel.json                  ← Vercel deployment config
└── package.json
```

---

## 🧠 Domain Knowledge ที่ Agent ต้องเข้าใจ

### Business Logic หลัก

| สูตร | ความหมาย |
|---|---|
| `daily_rate = monthly_salary / 30` | อัตราค่าจ้างรายวันตามกฎราชการ |
| `deduction = absent_days × daily_rate` | หักค่าจ้างตามวันขาดงาน |
| `net_payable = monthly_salary - deduction` | เงินที่ต้องจ่ายจริง |
| `total_contract = monthly_salary × total_periods` | มูลค่าสัญญารวม |
| `target_tasks = 110` (ค่า default) | จำนวนชิ้นงานต่องวด |

### ประเภทเอกสาร (Document Types)

| รหัส | ชื่อเอกสาร | หมายเหตุ |
|---|---|---|
| DOC-01 | ใบส่งมอบงาน (Delivery Invoice) | ใช้ตัวเลขไทย |
| DOC-02 | ใบเสร็จรับเงิน (Receipt Voucher) | ใช้ตัวเลขอารบิก |
| DOC-03 | ตารางภาระงาน (Workload Matrix) | matrix 18×31 |
| DOC-04 | ตารางเวลาเข้า-ออกงาน (Attendance) | timestamp |
| DOC-05 | สรุปสัญญา (Contract Summary) | |

### การคำนวณภาระงาน (Workload Distribution)

- เป้าหมาย: **110 ชิ้นงาน** ต่อเดือน (กำหนดได้)
- ภาระงาน: **18 รายการ** (กำหนดได้)
- matrix ขนาด: **18 rows × 31 cols** (งาน × วัน)
- วันหยุด/ลา: ต้องมีค่า 0 เสมอ (ห้ามมีงาน)
- grand_total ต้องตรงกับ target_tasks เสมอ

### ปีปฏิทิน

- ระบบรองรับทั้งปี พ.ศ. (BE) และ ค.ศ. (AD)
- แปลง: `AD = BE - 543`
- ฟังก์ชัน `toGregorianYear()` จัดการโดยอัตโนมัติ

---

## 🛠️ คำสั่งที่ใช้บ่อย

```powershell
# รัน dev server
cd g:\REA-Working\Salary_Doc_app\salary-doc-web
npm run dev

# Build production
npm run build

# Type check
npm run type-check

# Run tests
npx tsx tests/runner.ts
```

> [!WARNING]
> Windows PowerShell ไม่รองรับ `&&` — ใช้ `;` แทน  
> ตัวอย่าง: `cd salary-doc-web; npm run dev`

---

## 🔗 ลิงก์สำคัญ

- [Project Context](./project-context.md)
- [Code Conventions](./code-conventions.md)
- [Task Checklist](./task-checklist.md)
- [Developer: Getting Started](../developer/getting-started.md)
- [API: Calculate Endpoint](../api/calculate-endpoint.md)
- [Database Schema](../database/schema.md)
