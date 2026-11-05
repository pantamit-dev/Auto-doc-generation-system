---
title: Project documentation
contentType: Landing
goal: Find the current development, database, API, and agent guides
audience: Developers and maintainers
overview: Index of the active salary-doc-web documentation
contentPlan: Route readers to the guide for their task
openQuestions: []
---

# Project documentation

This index links to the current guides for developing, testing, deploying, and maintaining the salary document web app.

## Choose a guide

- **New developer**: [Get started](./developer/getting-started.md)
- **Environment setup**: [Configure local and production variables](./developer/environment-setup.md)
- **Database setup**: [Create the Supabase schema](./database/schema.md)
- **Deployment**: [Deploy to Vercel](./developer/deployment.md)
- **Testing**: [Run project checks](./developer/testing.md)
- **API**: [Calculate contract values](./api/calculate-endpoint.md)
- **Architecture**: [Review the implemented system](./architecture/system-overview.md)
- **Agent instructions**: [Work safely in this repository](./agent/AGENTS.md)
- **Business rules**: [Project context](./agent/project-context.md)
- **Code style**: [Code conventions](./agent/code-conventions.md)
- **Task workflow**: [Task checklist](./agent/task-checklist.md)

## Current application

The app uses Next.js 14 App Router, React 18, TypeScript, Zustand, Supabase, and Vercel. Its calculator and document views run in the web app. Supabase setup is a manual SQL Editor task because the repository contains legacy migrations that must not be applied as a batch.

## Historical design records

The dated files under [`superpowers/`](./superpowers/) record earlier plans and specifications. Treat them as historical context, not as the current implementation.
