# Testing Guide — salary-doc-web

> คู่มือการทดสอบระบบ ครอบคลุม unit tests, integration tests, และ manual testing

---

## 🧪 โครงสร้างการทดสอบ

```
salary-doc-web/
├── src/lib/calculation/
│   └── __tests__/
│       └── salaryEngine.test.ts   ← Unit tests (Calculation Engine)
└── tests/
    ├── runner.ts                  ← Test runner
    ├── storage_adapter.test.ts    ← Storage adapter tests
    ├── supabase_adapter.test.ts   ← Supabase adapter tests
    ├── challenger_m2_recheck.test.ts    ← Stress tests
    ├── challenger_m2_stress.test.ts     ← Advanced stress tests
    ├── storage_recheck_adversarial.test.ts
    └── storage_stress_corruption.challenge.ts
```

---

## ▶️ การรัน Tests

### Unit Tests (Calculation Engine)

```powershell
cd g:\REA-Working\Salary_Doc_app\salary-doc-web

# รัน unit tests โดยตรง
npx tsx src/lib/calculation/__tests__/salaryEngine.test.ts
```

### Integration Tests

```powershell
# รัน integration test suite ทั้งหมด
npx tsx tests/runner.ts

# รันเฉพาะ storage tests
npx tsx tests/storage_adapter.test.ts

# รันเฉพาะ Supabase adapter tests
npx tsx tests/supabase_adapter.test.ts
```

### Type Checking (ไม่ใช่ test แต่สำคัญเท่ากัน)

```powershell
npm run type-check   # ต้องไม่มี error เลย
npm run lint         # ต้องผ่าน ESLint
npm run build        # ต้อง build สำเร็จ
```

---

## 📐 Unit Tests: Calculation Engine

### สิ่งที่ทดสอบใน `salaryEngine.test.ts`

| ฟังก์ชัน | สิ่งที่ตรวจสอบ |
|---|---|
| `totalMonths()` | นับเดือนระหว่างวันที่ (inclusive) |
| `totalInstallments()` | จำนวนงวด = จำนวนเดือน |
| `totalContractAmount()` | มูลค่าสัญญา = เงินเดือน × งวด |
| `amountToThaiBahtText()` | แปลงตัวเลขเป็นตัวหนังสือบาทไทย |
| `daysInMonth()` | จำนวนวันในเดือน (รองรับปี พ.ศ.) |
| `workDaysInMonth()` | วันทำงานจริง (หักวันหยุด) |
| `distributeWorkload()` | กระจายชิ้นงานใน matrix |
| `calculateContract()` | orchestrator รวมทุกฟังก์ชัน |

### ตัวอย่าง Test Cases

```typescript
// ตัวอย่างจาก salaryEngine.test.ts

// Test: totalMonths
const months = totalMonths('2026-10-01', '2027-09-30');
console.assert(months === 12, `Expected 12, got ${months}`);

// Test: amountToThaiBahtText
const text = amountToThaiBahtText(19800);
console.assert(text.includes('สิบเก้าพัน') || text.includes('หนึ่งหมื่น'));

// Test: workload matrix invariants
const result = distributeWorkload(calendarDays, 110, 18);
console.assert(result.grand_total === 110, 'Grand total must equal target');
// วันหยุดต้องมีค่า 0
nonWorkingDays.forEach(day => {
  result.matrix.forEach(row => {
    console.assert(row[day] === 0, `Holiday day ${day} must be 0`);
  });
});
```

---

## 🏋️ Workload Matrix Invariants

ทุก test เกี่ยวกับ `distributeWorkload()` ต้องตรวจสอบ:

### Invariant 1: Grand Total ถูกต้อง

```typescript
assert(result.grand_total === targetTasks);
```

### Invariant 2: วันหยุดต้องมีค่า 0

```typescript
calendarDays.forEach((day, colIndex) => {
  if (!day.is_working_day) {
    result.matrix.forEach(row => {
      assert(row[colIndex] === 0);
    });
  }
});
```

### Invariant 3: ค่าใน matrix เป็น binary (0 หรือ 1)

```typescript
result.matrix.forEach(row => {
  row.forEach(cell => {
    assert(cell === 0 || cell === 1);
  });
});
```

### Invariant 4: task_totals และ daily_sums ถูกต้อง

```typescript
const calculatedGrandTotal = result.task_totals.reduce((a, b) => a + b, 0);
assert(calculatedGrandTotal === result.grand_total);
```

---

## 🌐 Manual Testing Checklist

### Authentication Flow

- [ ] เปิด `http://localhost:3000`
- [ ] กด Sign Up → กรอก email/password → ต้องสร้าง account ได้
- [ ] กด Sign In → ต้อง login สำเร็จ และ redirect ไปหน้าหลัก
- [ ] กด Sign Out → ต้อง redirect กลับหน้า login

### Calculation Flow

- [ ] กรอกข้อมูลสัญญา (วันที่ เงินเดือน)
- [ ] กด "คำนวณ" → ต้องแสดงผลภายใน 2 วินาที
- [ ] ตรวจสอบ: `total_months = 12` (สำหรับ Oct 2569 – Sep 2570)
- [ ] ตรวจสอบ: `daily_rate = 660` (19800 ÷ 30)
- [ ] ตรวจสอบ: ตัวเลขแสดงเป็นภาษาไทยถูกต้อง

### Document Preview

- [ ] เลือกงวดที่ 1
- [ ] กด "ดูตัวอย่างเอกสาร" → ต้อง load ได้
- [ ] ตรวจสอบ: ตัวเลขไทยใน DOC-01
- [ ] ตรวจสอบ: ตัวเลขอารบิกใน DOC-02
- [ ] กด Print → dialog print ต้องเปิดขึ้น

### Mobile Responsiveness

- [ ] เปิด DevTools → Toggle Device Toolbar
- [ ] ตรวจสอบบน iPhone SE (375px)
- [ ] ตรวจสอบบน iPad (768px)
- [ ] Button ทุกปุ่มต้องมี height ≥ 44px

---

## 🐛 Debugging Tips

### หา TypeScript Errors

```powershell
npm run type-check 2>&1 | Select-String "error"
```

### ดู API Response

```powershell
# ทดสอบ API calculate
Invoke-WebRequest -Uri "http://localhost:3000/api/calculate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"startDate":"2026-10-01","endDate":"2027-09-30","monthlyWage":19800}' |
  Select-Object -ExpandProperty Content
```

### ดู Supabase Logs

เปิด Supabase Dashboard → **Logs** → **API**

---

## ✅ Definition of Done (สำหรับทุก Feature)

Feature ถือว่า "เสร็จ" เมื่อ:

1. ✅ `npm run type-check` ผ่าน (0 errors)
2. ✅ `npm run build` ผ่าน
3. ✅ Unit tests ที่เกี่ยวข้องผ่าน
4. ✅ Manual testing checklist ผ่าน
5. ✅ ไม่มี console.error ใน browser
6. ✅ Mobile layout แสดงถูกต้อง
