---
title: Get started
contentType: Tutorial
goal: Run the salary document app locally
audience: Developers joining the repository
overview: Install dependencies, configure environment variables, and start Next.js
contentPlan: Set up prerequisites, local configuration, and the development server
openQuestions: []
---

# Get started

Follow this guide to run the Next.js app on your workstation. Use a Supabase project only after reviewing the [database setup guide](../database/schema.md).

## Requirements

- Node.js 18 or later
- npm
- Git

Check installed versions with `node --version`, `npm --version`, and `git --version`.

## Install and configure

Run these commands from the repository root:

```powershell
npm install
Copy-Item .env.example .env.local
```

Replace the placeholders in `.env.local` with values from your Supabase project. Keep the service-role key and session secret private. See [environment setup](./environment-setup.md) for all variable scopes.

## Create the database

For a new Supabase project, follow [database setup](../database/schema.md) and run only `supabase/manual-setup/initial-schema.sql` in the Supabase SQL Editor. Do not run `supabase db push` against this repository's legacy migration directory.

## Start the app

```powershell
npm run dev
```

Open `http://localhost:3000`. If a page reports missing configuration, check `.env.local` and restart the development server.

## Validate the installation

```powershell
npm run type-check
npm run lint
npm run build
```

For test commands, see [testing](./testing.md).
