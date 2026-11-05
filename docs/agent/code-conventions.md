---
title: Code conventions
contentType: Reference
goal: Follow the patterns already used in the codebase
audience: Developers and coding agents
overview: Naming, imports, React boundaries, persistence, and validation rules
contentPlan: Record conventions that cannot be inferred reliably from tooling
openQuestions: []
---

# Code conventions

Follow these conventions when editing TypeScript, React, API routes, and Supabase access. Check nearby code before introducing a new pattern.

## TypeScript and naming

- Use `PascalCase` for components and public type names.
- Use `camelCase` for functions, variables, and hooks. Prefix React hooks with `use`.
- Use `UPPER_SNAKE_CASE` for module-level constants.
- Give exported functions explicit input and output types.
- Prefer narrow types and input validation over `any`.
- Mark type-only imports with `import type`.

## Next.js and React

- Keep pages and components as Server Components unless they need browser state, effects, or event handlers.
- Add `'use client'` only to the client boundary that needs it.
- Put App Router handlers in `src/app/api/<path>/route.ts`.
- Keep business calculations in `src/lib/calculation/`, not in presentation components.

## Supabase and persistence

- Handle every Supabase `error` explicitly.
- Do not report a successful durable write when only local storage or an in-memory fallback changed.
- Keep service-role access in server-only modules.
- Keep RLS enabled and grants limited to the reviewed access model.
- Never log sensitive record values or secrets.

## Accessibility and documents

- Preserve keyboard access and visible focus states.
- Keep interactive controls large enough for touch use, targeting at least 44 CSS pixels.
- Use the project's Thai government document typography and print styles when editing printable documents.

## Tests

Keep tests close to the project’s existing style. Add assertions for calculation invariants, API error paths, and persistence failures when changing those behaviors.
