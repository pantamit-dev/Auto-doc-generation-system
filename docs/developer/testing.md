---
title: Test the application
contentType: How-to
goal: Run the checks that cover a code change
audience: Developers and QA
overview: Type checking, linting, build, and the existing test runner
contentPlan: Select targeted commands and manual checks by feature
openQuestions: []
---

# Test the application

Run the narrowest checks that cover your change, then run broader checks when the change affects shared behavior.

## Run automated checks

Run these commands from the repository root:

```powershell
npm run type-check
npm run lint
npm run build
```

Run the integration test runner with:

```powershell
npx tsx tests/runner.ts
```

Run focused tests directly, for example:

```powershell
npx tsx tests/storage_adapter.test.ts
npx tsx tests/supabase_adapter.test.ts
npx tsx tests/auth_line.test.ts
npx tsx tests/system_options.test.ts
```

The repository also contains challenge and stress test files. Check `tests/runner.ts` before assuming every standalone file is part of the default suite.

## Verify calculation behavior

When changing salary or workload calculations, test these invariants:

- Daily rate equals monthly salary divided by 30.
- Deduction equals absent working days multiplied by daily rate.
- Net payable equals monthly salary minus deduction.
- Non-working-day workload cells equal zero.
- Workload grand total equals the configured target.
- Buddhist Era years convert to Gregorian years by subtracting 543.

## Verify persistence behavior

Use test records and a non-production Supabase project. Confirm both the response and the stored row. A local-storage or in-memory fallback does not verify a database write.

The current secure setup revokes browser access to data tables. End-to-end persistence checks require a server-side access path that validates the application session and authorization.

## Report results

Include each command, pass or fail status, and any skipped checks. Do not include secrets or personal data in test output.
