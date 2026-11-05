# API Reference: POST /api/calculate

> Endpoint สำหรับคำนวณฟิลด์ที่ derived จากข้อมูลสัญญา

---

## Endpoint

```
POST /api/calculate
Content-Type: application/json
```

**ไฟล์ Implementation:** [`src/app/api/calculate/route.ts`](../../src/app/api/calculate/route.ts)

---

## Request Body (`ContractInput`)

```typescript
interface ContractInput {
  // วันที่สัญญา (รองรับทั้ง 2 รูปแบบ)
  startDate?: string;       // ISO: "2026-10-01"
  start_date?: string;      // alias
  
  endDate?: string;         // ISO: "2027-09-30"
  end_date?: string;        // alias

  // เงินเดือน
  monthlyWage?: number;     // ตัวเลข: 19800
  monthly_salary?: number;  // alias

  // สำหรับคำนวณวันทำงาน
  yearBE?: number;          // ปี พ.ศ.: 2569 (จะแปลงเป็น ค.ศ. อัตโนมัติ)
  year_be?: number;         // alias
  month?: number;           // เดือน 1-12

  // วันหยุดและวันลา (เป็นเลขวัน ไม่ใช่วันที่)
  holidays?: number[];          // เช่น [13, 23]
  public_holidays?: number[];   // alias
  leaveDays?: number[];         // เช่น [5]
  absent_days?: number[];       // alias

  // Optional: workload matrix calculation
  tasks?: TaskRow[];
  targetGrandTotal?: number;
}

interface TaskRow {
  dailyCounts: number[];  // array ขนาด ≤ 31
}
```

---

## Response

### Success (HTTP 200)

```typescript
{
  success: true,
  data: {
    // จำนวนเดือนระหว่างวันที่ (inclusive)
    totalMonths: number;        // 12

    // จำนวนงวดการชำระเงิน (= totalMonths)
    totalInstallments: number;  // 12

    // มูลค่าสัญญารวม (เงินเดือน × งวด)
    totalContractAmount: number;    // 237600

    // ตัวหนังสือจำนวนเงินภาษาไทย
    amountThaiBahtText: string;     // "สองแสนสามหมื่นเจ็ดพันหกร้อยบาทถ้วน"

    // จำนวนวันในเดือน
    daysInMonth: number;        // 31

    // วันทำงานจริง (หักเสาร์-อาทิตย์, วันหยุด, วันลา)
    workDays: number;           // 20

    // Optional: ถ้าส่ง tasks มาด้วย
    workload?: {
      tasksRowTotal: number[];  // รวมต่อแถวงาน
      dailyTotals: number[];    // รวมต่อวัน
      grandTotal: number;       // รวมทั้งหมด
      isBalanced: boolean;      // grand_total === targetGrandTotal
    }
  }
}
```

### Error (HTTP 400)

```typescript
{
  success: false,
  error: "Invalid date string: xxx"
}
```

---

## ตัวอย่างการเรียกใช้

### cURL

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-10-01",
    "endDate": "2027-09-30",
    "monthlyWage": 19800,
    "yearBE": 2569,
    "month": 10,
    "holidays": [13, 23]
  }'
```

### PowerShell

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/calculate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "startDate": "2026-10-01",
    "endDate": "2027-09-30",
    "monthlyWage": 19800
  }' | Select-Object -ExpandProperty Content
```

### TypeScript (Client-side)

```typescript
// ผ่าน hook
import { useCalculate } from '@/lib/calculation/useCalculate';

// หรือโดยตรง
const response = await fetch('/api/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: '2026-10-01',
    endDate: '2027-09-30',
    monthlyWage: 19800,
    yearBE: 2569,
    month: 10,
    holidays: [13, 23],
  }),
});

const { success, data } = await response.json();
```

---

## ตัวอย่าง Response จริง

```json
{
  "success": true,
  "data": {
    "totalMonths": 12,
    "totalInstallments": 12,
    "totalContractAmount": 237600,
    "amountThaiBahtText": "สองแสนสามหมื่นเจ็ดพันหกร้อยบาทถ้วน",
    "daysInMonth": 31,
    "workDays": 20
  }
}
```

---

## Business Rules ใน Engine

| Rule | สูตร | ตัวอย่าง |
|---|---|---|
| ระยะเวลาสัญญา | inclusive end month | Oct–Sep = 12 |
| มูลค่าสัญญา | `salary × periods` | 19800 × 12 = 237,600 |
| อัตราค่าจ้างรายวัน | `salary ÷ 30` (ไม่ใช่วันจริง) | 19800 ÷ 30 = 660 |
| วันทำงาน | หักเสาร์-อาทิตย์ + holidays + leaveDays | — |
| ปีไทย | ถ้า yearBE > 2400 จะ - 543 อัตโนมัติ | 2569 → 2026 |

---

## Error Cases

| กรณี | HTTP Status | Error Message |
|---|---|---|
| startDate format ผิด | 400 | `Invalid date string: xxx` |
| JSON body ผิดรูปแบบ | 400 | `Unexpected token...` |
| endDate ก่อน startDate | 200 | `totalMonths: 0` (ไม่ error แต่ผลเป็น 0) |
