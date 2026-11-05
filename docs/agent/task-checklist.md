# Task Checklist — salary-doc-web

## ✅ รายการตรวจสอบก่อนเริ่มงาน (Pre-Task Checklist)

### สำหรับทุก Task

- [ ] อ่าน [AGENTS.md](./AGENTS.md) และเข้าใจกฎเหล็ก
- [ ] อ่าน [project-context.md](./project-context.md) เพื่อเข้าใจโดเมนธุรกิจ
- [ ] ระบุไฟล์ที่ต้องแก้ไขก่อนลงมือ
- [ ] ตรวจสอบว่า TypeScript types ที่เกี่ยวข้องอยู่ที่ไหน

### สำหรับ Task ที่เกี่ยวกับ Calculation

- [ ] อ่าน `src/lib/calculation/salaryEngine.ts` ให้ครบ
- [ ] เข้าใจสูตร daily_rate = salary / 30 (ไม่ใช่วันจริง)
- [ ] เข้าใจ invariant ของ workload matrix (วันหยุด = 0)

### สำหรับ Task ที่เกี่ยวกับ Database

- [ ] อ่าน `supabase/migrations/20261102000000_init_schema.sql`
- [ ] ตรวจสอบ RLS policies ที่เกี่ยวข้อง
- [ ] ห้ามใช้ `auth.role()` — ใช้ `TO authenticated` แทน

### สำหรับ Task ที่เกี่ยวกับ UI

- [ ] ตรวจสอบ touch target ≥ 44px
- [ ] ตรวจสอบ mobile-first (ไม่มี hardcode ความกว้าง)
- [ ] เอกสาร print ต้องใช้ฟอนต์ TH Sarabun

---

## ✅ รายการตรวจสอบหลังทำงานเสร็จ (Post-Task Checklist)

### บังคับทุก Task

- [ ] รัน `npm run type-check` ผ่าน (0 errors)
- [ ] รัน `npm run build` ผ่าน (build สำเร็จ)
- [ ] ไม่มี `any` type ที่เพิ่มเข้ามาใหม่
- [ ] ไม่มีข้อมูลส่วนบุคคลใน code หรือ comment

### สำหรับ Task ที่แก้ Calculation

- [ ] รัน unit tests ใน `src/lib/calculation/__tests__/`
- [ ] ตรวจสอบว่า grand_total === target_tasks
- [ ] ตรวจสอบว่า วันหยุดมีค่า 0 ในทุก cell

### สำหรับ Task ที่แก้ Database

- [ ] Migration file มี `IF NOT EXISTS` ป้องกัน error ซ้ำ
- [ ] RLS policies ทุกตารางเปิดใช้งาน
- [ ] Foreign key indexes มีครบ

### สำหรับ Task ที่แก้ UI

- [ ] ทดสอบ responsive บน breakpoint sm, md, lg
- [ ] ทดสอบ print preview ด้วย `window.print()`
- [ ] ตัวเลขไทยแสดงถูกต้องใน DOC-01

---

## 🚨 เงื่อนไขหยุดงาน (Stop Conditions)

Agent ต้องหยุดและรายงานทันทีเมื่อ:

1. **Runtime Error** — พบ error ระหว่าง run และแก้ไขไม่ได้หลัง 2 ครั้ง
2. **Type Error > 5 รายการ** — มี TypeScript errors มากเกินกว่าจะจัดการในครั้งเดียว
3. **Build Failure** — `npm run build` ล้มเหลวและสาเหตุไม่ชัดเจน
4. **Migration Conflict** — พบ conflict กับ schema ที่มีอยู่แล้ว
5. **ข้อมูลส่วนบุคคล** — พบว่าต้องจัดการข้อมูล sensitive โดยไม่ได้รับอนุญาต

### Template รายงานเมื่อหยุดงาน

```
🚨 หยุดงาน — ต้องการการตรวจสอบ

**Error:** [error message]
**ไฟล์:** [path:line]
**สิ่งที่ลองแล้ว:**
1. ...
2. ...

**ต้องการให้ตรวจสอบ:**
- [ ] ...
- [ ] ...
```

---

## 📊 สถานะงาน (Work Status Tracking)

| ฟีเจอร์ | สถานะ | หมายเหตุ |
|---|---|---|
| Authentication (Login/Signup) | ✅ เสร็จ | |
| Calculation Engine | ✅ เสร็จ | salaryEngine.ts |
| POST /api/calculate | ✅ เสร็จ | |
| Zustand Store | ✅ เสร็จ | useSalaryStore.ts |
| Supabase Adapter | ✅ เสร็จ | |
| Database Migration | ✅ เสร็จ | init_schema.sql |
| Vercel Config | ✅ เสร็จ | vercel.json |
| Document Templates (DOC-01~05) | 🔄 บางส่วน | ต้องตรวจสอบ |
| Unit Tests | ✅ เสร็จ | salaryEngine.test.ts |
| Integration Tests | ✅ เสร็จ | tests/ |
| Live Supabase Credentials | ⏳ รอผู้ใช้ | .env.local ยังเป็น placeholder |
| Print Preview | 🔄 บางส่วน | ต้องยืนยัน |
