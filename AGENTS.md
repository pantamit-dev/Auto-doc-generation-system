# Agent instructions for salary-doc-web

## Project

This repository contains a Next.js 14 App Router application for Thai government contractor salary and document workflows. It uses React 18, TypeScript, Zustand, Supabase, and Vercel.

## Required practices

- Communicate summaries in Thai. Keep code, errors, and paths in English.
- Keep code comments in English and add them only when they clarify non-obvious behavior.
- Do not log or commit personal data, including citizen IDs and bank account numbers.
- Ask before destructive database or file operations.
- If a runtime error remains after two focused attempts, stop and report the full error, file and line, attempts, and required user action.
- Never treat a local or in-memory fallback as proof that a database write succeeded.
- Keep the Supabase service-role key and session secret server-side. Never prefix them with `NEXT_PUBLIC_`.
- Enable RLS on every exposed table. Do not grant table access to `anon` for personal or financial data.
- Do not run every file in `supabase/migrations/` against a new project. Use the reviewed manual setup instructions in [Database setup](docs/database/schema.md).

## Read by task

- Read [agent rules](docs/agent/AGENTS.md) and [project context](docs/agent/project-context.md) before changing application behavior.
- Read [database setup](docs/database/schema.md) before changing SQL, Supabase access, or RLS.
- Read [API reference](docs/api/calculate-endpoint.md) before changing `/api/calculate`.
- Read [environment setup](docs/developer/environment-setup.md) before changing credentials or deployment configuration.

## Verify changes

Use the smallest relevant test first. Before handing off a code change, run:

```powershell
npm run type-check
npm run lint
```

Run `npm run build` for changes that affect application compilation or routing. Run `npx tsx tests/runner.ts` for storage, authentication, or calculation behavior. Report any check that could not run.
