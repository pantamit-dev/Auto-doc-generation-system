---
title: Agent instructions
contentType: Reference
goal: Make safe and verifiable changes to the application
audience: Coding agents working in this repository
overview: Repository rules and task-specific context pointers
contentPlan: State hard constraints, point to domain guidance, define verification
openQuestions: []
---

# Agent instructions

Use this guide to make changes that preserve the app's business rules and protect contractor data. The root [AGENTS.md](../../AGENTS.md) contains repository-wide safeguards.

## Before changing code

- Read [project context](./project-context.md) for calculation and document rules.
- Read [code conventions](./code-conventions.md) for local TypeScript and Next.js patterns.
- Read [task checklist](./task-checklist.md) for focused validation.
- For database work, read [database setup](../database/schema.md) and inspect the exact SQL file you plan to change.

## Protect data

- Do not print, log, or commit citizen IDs, bank account numbers, credentials, or real contractor records.
- Keep server credentials in server-only code and environment variables. A `NEXT_PUBLIC_` variable is visible to browsers.
- Preserve RLS on every table in the exposed `public` schema.
- Keep `anon` and `authenticated` table privileges revoked until reviewed policies and a compatible access path exist.
- Treat legacy migrations as historical. The setup script in `supabase/manual-setup/` is the current clean-project schema reference.
- Ask before dropping, resetting, or deleting a database or user data.

## Handle persistence failures

Local storage and in-memory fallbacks do not prove that Supabase saved a change. Check the returned error and communicate whether data is local-only, pending, or persisted.

## Verify the change

Run the narrowest relevant test first. Run `npm run type-check` and `npm run lint` for code changes. Run `npm run build` when changing routes, imports, or framework behavior. Report checks you could not run and their errors.

## Stop on unresolved runtime errors

After two focused attempts, stop if a runtime error remains. Report the full error, file and line, attempts, and what needs user investigation.
