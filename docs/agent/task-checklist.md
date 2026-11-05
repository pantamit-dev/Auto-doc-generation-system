---
title: Task checklist
contentType: How-to
goal: Verify a change before handing it off
audience: Developers and coding agents
overview: Focused pre-change and post-change checks
contentPlan: Select checks by the surface being changed
openQuestions: []
---

# Task checklist

Use this checklist to identify affected surfaces and verify the requested behavior without running unrelated checks.

## Before editing

- Read the root [AGENTS.md](../../AGENTS.md) and [agent instructions](./AGENTS.md).
- Identify the relevant implementation, tests, and current documentation.
- Check the worktree before editing. Preserve unrelated user changes.
- For Supabase work, inspect RLS, grants, schema, and migration history first.

## After editing

- Run `npm run type-check` for TypeScript changes.
- Run `npm run lint` for code or documentation samples that affect linted source.
- Run `npm run build` for routing, module, or framework changes.
- Run the relevant tests. Use `npx tsx tests/runner.ts` for the integration test runner.
- Verify the exact output shape, persistence result, or security condition changed by the task.
- Report skipped checks and their reasons.

## Database changes

- Use `supabase/manual-setup/initial-schema.sql` only for an empty project.
- Do not run the legacy migration directory as a batch.
- Confirm that all exposed tables have RLS enabled.
- Confirm that `anon` and `authenticated` cannot access sensitive tables directly.
- Do not seed example or personal data unless the user requests it.
- Inspect SQL statically before asking the user to run it. Do not execute it against hosted data without explicit authorization.

## Sensitive data

- Keep citizen IDs, bank account numbers, passwords, tokens, and real contractor records out of logs, fixtures, and commits.
- Confirm local and production environment variables separately.
