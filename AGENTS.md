# AGENTS.md — salary-doc-web
# Project-Level Agent Instructions for AGY / Antigravity

> ไฟล์นี้จะถูกอ่านโดย AGY Agent อัตโนมัติเมื่อทำงานในโปรเจค salary-doc-web

---

## 🎯 บริบทโครงการ

ระบบสร้างเอกสารราชการสำหรับผู้รับจ้างเหมาบริการ กระทรวงสาธารณสุข ประกอบด้วย:
- คำนวณเงินเดือน/ค่าจ้าง อัตราวันทำงาน และเงินหัก
- สร้างตารางภาระงาน 18 รายการ × 31 วัน
- ออกเอกสาร 5 ประเภท (ใบส่งมอบงาน, ใบเสร็จ, ตารางงาน, เวลาปฏิบัติงาน, สรุปสัญญา)

---

## 🚨 กฎบังคับ (MUST FOLLOW)

### กฎที่ 1: หยุดและรายงานเมื่อแก้ error ไม่ได้
**หากพบ runtime error และแก้ไม่ได้หลังลอง 2 ครั้ง → หยุดทันที และรายงานให้ผู้ใช้**

```
รายงานต้องระบุ:
1. Error message เต็ม
2. ไฟล์ + line number  
3. สิ่งที่ลองแก้แล้ว
4. สิ่งที่ต้องการให้ตรวจสอบ
```

### กฎที่ 2: ภาษาในการสื่อสาร
- ตอบสรุปเป็น **ภาษาไทย**
- Code, errors, paths ใช้ **ภาษาอังกฤษ**
- Comments ในโค้ดใช้ **ภาษาอังกฤษ**

### กฎที่ 3: ห้ามแตะข้อมูลส่วนบุคคลโดยไม่จำเป็น
- citizen_id, bank_account_no → ห้าม log
- ห้าม commit ข้อมูลจริง

### กฎที่ 4: สอบถามก่อน destructive operations
- Reset, Drop, Delete → ต้องขออนุญาตก่อนเสมอ

---

## 📁 ไฟล์สำคัญ

| ไฟล์ | บทบาท |
|---|---|
| `src/lib/calculation/salaryEngine.ts` | 🔑 Calculation engine หลัก |
| `src/lib/store/useSalaryStore.ts` | 🔑 Zustand store + state |
| `src/app/api/calculate/route.ts` | POST /api/calculate |
| `src/lib/supabaseClient.ts` | Supabase client init |
| `supabase/migrations/20261102000000_init_schema.sql` | Database schema |
| `docs/` | 📚 เอกสารทั้งหมด |

---

## 💼 Business Rules สำคัญ

| กฎ | สูตร |
|---|---|
| อัตราค่าจ้างรายวัน | `salary ÷ 30` (ไม่ใช่วันจริง) |
| หักเงิน | `absent_days × daily_rate` |
| เงินสุทธิ | `salary - deduction` |
| ชิ้นงาน target | `110 ต่องวด` (default) |
| matrix invariant | วันหยุด = 0 เสมอ |
| ปีไทย | `BE - 543 = AD` |

---

## 🛠️ คำสั่ง PowerShell (Windows)

```powershell
# ⚠️ ใช้ ; แทน && เสมอ
npm run dev           # dev server
npm run build         # production build
npm run type-check    # TypeScript check (ต้องผ่านก่อน commit)
npm run lint          # ESLint
npx tsx tests/runner.ts  # integration tests
```

---

## 📚 เอกสารเพิ่มเติม

- **Agent:** [docs/agent/AGENTS.md](docs/agent/AGENTS.md) — กฎละเอียด
- **Context:** [docs/agent/project-context.md](docs/agent/project-context.md) — business domain
- **Conventions:** [docs/agent/code-conventions.md](docs/agent/code-conventions.md) — coding style
- **Dev Start:** [docs/developer/getting-started.md](docs/developer/getting-started.md)
- **API:** [docs/api/calculate-endpoint.md](docs/api/calculate-endpoint.md)
- **DB Schema:** [docs/database/schema.md](docs/database/schema.md)
- **Architecture:** [docs/architecture/system-overview.md](docs/architecture/system-overview.md)
