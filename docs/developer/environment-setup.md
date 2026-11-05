---
title: Configure environment variables
contentType: How-to
goal: Configure local and Vercel environments without exposing secrets
audience: Developers and deployment maintainers
overview: Supabase, session, and optional LINE configuration
contentPlan: Describe each variable, local setup, and Vercel setup
openQuestions: []
---

# Configure environment variables

Use `.env.example` as the variable-name template. Copy it to `.env.local` for local development, then add the production values in Vercel. The app reads these variables at build or server runtime, so restart the server after changing them.

## Variables

| Variable                        | Scope              | Purpose                                                     |
| ------------------------------- | ------------------ | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser and server | Supabase project URL                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Public/anon key used by the current browser client          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only        | Privileged access used by server-side authentication routes |
| `SESSION_SECRET`                | Server only        | HMAC signing secret for the app session cookie              |
| `NEXT_PUBLIC_LIFF_ID`           | Browser and server | Optional LINE LIFF application ID                           |

The code currently accepts legacy anon keys and publishable keys in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This key is public. Database permissions and RLS must protect the tables.

## Configure local development

1. Copy `.env.example` to `.env.local`.
2. In Supabase, open **Project settings** and copy the project URL and public API key.
3. Set a random session secret with at least 32 bytes.
4. Copy the service-role key only into this ignored local file.
5. Restart `npm run dev`.

Generate a session secret with PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The current session module has a hard-coded fallback when `SESSION_SECRET` is absent. Always set a unique secret and treat removal of that fallback as a production security requirement.

## Configure Vercel

Add the same required values in the Vercel project's **Settings** → **Environment Variables**. Set `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` as encrypted server-side variables for the environments that need them. Keep only the Supabase URL and public key under `NEXT_PUBLIC_` names.

Redeploy after changing variables. Do not paste credentials into source files, commits, issues, or chat.

## Database access warning

The secure setup SQL revokes direct table access from `anon` and `authenticated`. The current `supabaseAdapter` still sends some reads and writes from the browser using the public key. Those operations will fail against the secure schema until they move behind authenticated server handlers. Do not use real contractor data with the current direct-client persistence path.
