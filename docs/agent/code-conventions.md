# Code Conventions — salary-doc-web

## TypeScript

### Naming Conventions

| สิ่ง | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Component | PascalCase | `ProfileForm`, `ContractForm` |
| Hook | camelCase + `use` prefix | `useSalaryStore`, `useCalculate` |
| Type / Interface | PascalCase | `ContractInput`, `CalendarDay` |
| Utility function | camelCase | `bahtText`, `toThaiDigits` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_TASKS_18`, `THAI_PUBLIC_HOLIDAYS_BY_MONTH` |
| API route file | `route.ts` | `src/app/api/calculate/route.ts` |

### Import Order (ลำดับ import)

```typescript
// 1. Node built-ins (ถ้ามี)
import { readFileSync } from 'fs';

// 2. External packages
import { NextResponse } from 'next/server';
import { create } from 'zustand';

// 3. Internal aliases (@ path)
import { calculateContract } from '@/lib/calculation/salaryEngine';
import type { ContractInput } from '@/lib/calculation/types';

// 4. Relative imports
import { helper } from './utils';
```

### Type Annotations

```typescript
// ✅ ถูกต้อง — ใช้ explicit type ใน function signatures
export function calculateContract(input: ContractInput): ContractDerived { ... }

// ✅ ถูกต้อง — ใช้ type สำหรับ union types
type DocumentType = 'DOC-01' | 'DOC-02' | 'DOC-03' | 'DOC-04' | 'DOC-05';

// ✅ ถูกต้อง — ใช้ interface สำหรับ object shapes
export interface ContractInput {
  startDate?: string;
  endDate?: string;
  monthlyWage?: number;
}

// ❌ หลีกเลี่ยง any
const data: any = ...; // ห้ามใช้
```

---

## React / Next.js

### Server vs Client Components

```typescript
// Server Component (default) — ใช้เมื่อ:
// - ไม่มี useState, useEffect
// - ไม่มี event listeners
// - fetch data โดยตรง

// Client Component — ต้องระบุ
'use client';
// - ใช้ useState, useEffect
// - ใช้ Zustand store
// - ใช้ event handlers
```

### ตัวอย่างโครงสร้าง Component

```typescript
'use client';

import { useSalaryStore } from '@/lib/store/useSalaryStore';

interface ProfileFormProps {
  className?: string;
}

export function ProfileForm({ className }: ProfileFormProps) {
  const { contractor, setContractor } = useSalaryStore();
  
  return (
    // touch target ≥ 44px เสมอ
    <button
      onClick={() => setContractor({ ... })}
      className="min-h-[44px] min-w-[44px] ..."
    >
      บันทึก
    </button>
  );
}
```

---

## Tailwind CSS

### Breakpoints (Mobile-First)

```
sm:  ≥ 640px
md:  ≥ 768px
lg:  ≥ 1024px
xl:  ≥ 1280px
```

### ฟอนต์สำหรับเอกสารราชการ

```html
<!-- เอกสาร print ต้องใช้ TH Sarabun -->
<style>
  @print {
    * { font-family: 'TH Sarabun New', 'TH Sarabun', serif; }
  }
</style>
```

### Touch Target (สำคัญมาก)

```html
<!-- ✅ ถูกต้อง — ≥ 44px -->
<button class="min-h-[44px] px-4 py-3">...</button>

<!-- ❌ ผิด — เล็กเกินไป -->
<button class="h-8 px-2">...</button>
```

---

## Supabase / API

### Error Handling Pattern

```typescript
// ✅ ถูกต้อง — always handle Supabase errors
const { data, error } = await supabase.from('contractors').select('*');
if (error) {
  console.error('Supabase error:', error.message);
  throw new Error(error.message);
}
```

### ห้ามใช้ auth.role() (deprecated)

```sql
-- ❌ ผิด
USING (auth.role() = 'authenticated')

-- ✅ ถูกต้อง — ใช้ TO clause แทน
CREATE POLICY "..." ON table
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
```

---

## การทดสอบ (Testing)

### Unit Tests

```typescript
// ไฟล์: src/lib/calculation/__tests__/salaryEngine.test.ts
// Run: npx tsx src/lib/calculation/__tests__/salaryEngine.test.ts

import { calculateContract } from '../salaryEngine';

// ตั้งชื่อ test ให้ชัดเจน
const result = calculateContract({ startDate: '2026-10-01', endDate: '2027-09-30', monthlyWage: 19800 });
console.assert(result.totalMonths === 12, 'totalMonths should be 12');
```

### Integration Tests

```
tests/
├── challenger_m2_recheck.test.ts
├── challenger_m2_stress.test.ts
├── storage_adapter.test.ts
├── supabase_adapter.test.ts
└── runner.ts
```

---

## Git Commit Messages

```
feat: เพิ่มฟีเจอร์ใหม่
fix: แก้บัค
docs: อัปเดตเอกสาร
refactor: ปรับโครงสร้างโค้ด (ไม่เปลี่ยน behavior)
test: เพิ่ม/แก้ไข tests
chore: งาน maintenance

ตัวอย่าง:
feat: เพิ่มการคำนวณวันหยุดนักขัตฤกษ์อัตโนมัติ
fix: แก้บัคการแปลงตัวเลขภาษาไทยเกิน 1 ล้าน
```
