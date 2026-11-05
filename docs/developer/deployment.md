---
title: Deploy to Vercel
contentType: How-to
goal: Configure and verify a Vercel deployment
audience: Deployment maintainers
overview: Vercel project setup, environment variables, and post-deploy checks
contentPlan: Configure the project, provision secrets, deploy, and validate routes
openQuestions: []
---

# Deploy to Vercel

Use this guide to deploy the Next.js app from the repository root. Add environment variables before the first production build.

## Configure the Vercel project

1. Import the GitHub repository connected to this application.
2. Select the repository root as the Root Directory.
3. Keep the Next.js framework preset and default output settings.
4. Use `npm install` and `npm run build`.
5. Add the environment variables listed in [environment setup](./environment-setup.md).

The public Supabase URL and key are client configuration. Store `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` as server-side environment variables. Never add either secret to a `NEXT_PUBLIC_` variable.

## Configure the Supabase project

For a new, empty project, run only `supabase/manual-setup/initial-schema.sql` in the Supabase SQL Editor. The script creates tables, indexes, triggers, and RLS settings without inserting rows. Review [database setup](../database/schema.md) before running it.

The files in `supabase/migrations/` include older policies, seed data, and destructive data changes. Do not run the migration directory as a batch or use `supabase db push` for initial production setup.

## Deploy and verify

Deploy from the Vercel dashboard or use the configured Git integration. After deployment:

- Confirm the home page and authentication pages load.
- Send a non-sensitive test request to `POST /api/calculate`.
- Check Vercel function logs for errors without printing tokens or personal data.
- Verify Supabase table access and RLS with a test project and test account.

The secure database script intentionally blocks browser-role CRUD. The current browser adapter is not yet compatible with those grants. Keep production personal data disabled until its database operations use authenticated server routes and pass authorization tests.

## Change environment variables

After adding or changing an environment variable, redeploy the affected Vercel environment. Keep Preview and Production credentials separated when they target different Supabase projects.
