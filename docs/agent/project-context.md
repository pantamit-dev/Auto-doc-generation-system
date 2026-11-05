---
title: Project context
contentType: Conceptual
goal: Apply the salary and document rules correctly
audience: Developers and coding agents
overview: Business domain, implemented workflows, and calculation invariants
contentPlan: Define the app domain and rules without recording personal fixtures
openQuestions: []
---

# Project context

This app prepares salary, contract, attendance, and workload documents for service contractors in Thai public-sector organizations. It stores contractor and contract data, calculates pay by monthly period, and renders documents for printing.

## Main workflows

1. Sign in with an available email/password or LINE LIFF flow.
2. Maintain contractor, agency, and contract details.
3. Select a monthly period and enter holidays or absences.
4. Calculate pay and workload.
5. Preview and print the available document types.
6. Use administration pages to manage members, options, or settings when authorized.

The current UI and API routes are the source of truth for implemented behavior. Dated specifications under `docs/superpowers/` describe earlier plans.

## Business rules

| Rule               | Calculation                                               |
| ------------------ | --------------------------------------------------------- |
| Daily rate         | Monthly salary divided by 30                              |
| Deduction          | Absent working days multiplied by daily rate              |
| Net payable        | Monthly salary minus deduction                            |
| Contract amount    | Monthly salary multiplied by contract periods             |
| Workload target    | Defaults to 110 tasks per period                          |
| Workload matrix    | 18 task rows and up to 31 day columns                     |
| Non-working days   | Holiday, weekend, or absence cells contain zero workload  |
| Thai calendar year | Convert Buddhist Era to Gregorian year by subtracting 543 |

Use the calculation engine in `src/lib/calculation/` as the implementation source. Do not copy formulas into components.

## Data sensitivity

Contractor records can contain citizen IDs, contact details, addresses, salaries, and bank information. Treat all of these fields as sensitive. The database schema does not implement application-level encryption for these columns.

## Persistence boundary

The Zustand store uses a Supabase adapter and local storage. The current adapter can return local data after a remote error. Confirm database results before describing a write as durable. See [database setup](../database/schema.md) for the current access limitation and SQL setup.
