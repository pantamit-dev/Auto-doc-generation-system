---
title: Salary document web app
contentType: Landing
goal: Understand the app and find setup instructions
audience: Developers and maintainers
overview: Thai-language salary, contract, and government-document web application
contentPlan: Summarize the application, setup, commands, and documentation
openQuestions: []
---

# Salary document web app

This Next.js application calculates contractor pay, attendance, and workload, then prepares five government-document views for printing. Read the [documentation index](./docs/README.md) for setup, database, deployment, and implementation guides.

## Features

- Calculates contract amounts, daily rates, deductions, and net pay
- Builds an 18-task workload matrix across up to 31 days
- Tracks contractor, agency, contract, monthly-period, and audit data
- Supports email/password and LINE LIFF authentication flows
- Provides profile, attendance, workload, administration, and document-preview pages
- Renders five document types for browser printing

## Start locally

Use Node.js 18 or later and npm. Set the required environment variables before starting the app.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Follow [environment setup](./docs/developer/environment-setup.md) and [database setup](./docs/database/schema.md) before connecting to a real project.

## Commands

| Command                   | Purpose                         |
| ------------------------- | ------------------------------- |
| `npm run dev`             | Start the development server    |
| `npm run build`           | Create a production build       |
| `npm run start`           | Serve the production build      |
| `npm run lint`            | Run Next.js lint checks         |
| `npm run type-check`      | Run the TypeScript compiler     |
| `npx tsx tests/runner.ts` | Run the integration test runner |

## Stack

- Next.js 14 App Router, React 18, and TypeScript
- Supabase Auth and PostgreSQL
- Zustand state management
- Tailwind CSS
- Vercel hosting

## Documentation

Start at [docs/README.md](./docs/README.md). The dated files in `docs/superpowers/` are historical plans and specifications, not implementation guarantees.
