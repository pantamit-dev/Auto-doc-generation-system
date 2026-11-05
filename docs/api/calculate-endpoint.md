---
title: Calculate contract values
contentType: Reference
goal: Call and interpret POST /api/calculate
audience: Frontend developers and API consumers
overview: Request fields, derived values, and error behavior
contentPlan: Define the endpoint contract and provide request examples
openQuestions: []
---

# Calculate contract values

`POST /api/calculate` calculates derived contract values in a Next.js route. It does not read or write Supabase data.

## Endpoint

```http
POST /api/calculate
Content-Type: application/json
```

Implementation: [`src/app/api/calculate/route.ts`](../../src/app/api/calculate/route.ts).

## Request body

The route accepts `ContractInput` from `src/lib/calculation/salaryEngine.ts`.

| Field                             | Type           | Meaning                                         |
| --------------------------------- | -------------- | ----------------------------------------------- |
| `startDate` or `start_date`       | string         | Contract start date                             |
| `endDate` or `end_date`           | string         | Contract end date                               |
| `monthlyWage` or `monthly_salary` | number         | Monthly salary                                  |
| `yearBE` or `year_be`             | number         | Calendar year, default `2569`                   |
| `month`                           | number         | Month from 1 to 12, default `10`                |
| `holidays` or `public_holidays`   | number array   | Holiday day numbers                             |
| `leaveDays` or `absent_days`      | number array   | Absence day numbers                             |
| `tasks`                           | task-row array | Optional workload task values                   |
| `targetGrandTotal`                | number         | Expected workload total when `tasks` is present |

Date strings are parsed by JavaScript `Date`. The endpoint does not validate the input schema before calculation.

## Success response

The route returns HTTP 200 with `{ "success": true, "data": ... }`.

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

`workload` appears only when the request includes `tasks` and a numeric `targetGrandTotal`.

## Error response

Any thrown error, including invalid JSON or an invalid date, returns HTTP 400:

```json
{
  "success": false,
  "error": "Invalid date string: invalid_date"
}
```

An end date before the start date is not an error. The calculation returns zero months and zero installments.

## Request example

Send a non-sensitive test request from PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/calculate" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"startDate":"2026-10-01","endDate":"2027-09-30","monthlyWage":19800,"yearBE":2569,"month":10}'
```

## Calculation rules

- Contract months count inclusively according to the day-of-month comparison.
- Contract amount equals monthly salary multiplied by installments.
- Daily rate in the salary workflow uses monthly salary divided by 30.
- Buddhist Era years convert to Gregorian years by subtracting 543.
- Workload calculation is included only when both workload inputs are supplied.
