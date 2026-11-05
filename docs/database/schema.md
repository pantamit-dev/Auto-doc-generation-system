---
title: Create the Supabase schema
contentType: How-to
goal: Create an empty, RLS-protected schema for a new Supabase project
audience: Project administrators and developers
overview: Manual setup SQL, tables, grants, and verification checks
contentPlan: State prerequisites, run the schema, verify its access model, and explain app compatibility
openQuestions: []
---

# Create the Supabase schema

Run [`supabase/manual-setup/initial-schema.sql`](../../supabase/manual-setup/initial-schema.sql) in the SQL Editor for a new, empty Supabase project. It creates eight tables, indexes, update triggers, and RLS settings. It inserts no rows and grants no table access to `anon` or `authenticated`.

## Before you run the script

- Confirm that this is the intended Supabase project.
- Use a new project with no application tables from these migrations.
- Open the Supabase Dashboard and select **SQL Editor**.
- Review the complete SQL file before you run it.

The script contains no `DROP TABLE`, `DELETE`, `UPDATE`, or seed statements. It is not a migration for an existing database and does not reconcile partially created objects.

## Run the setup

1. Open `supabase/manual-setup/initial-schema.sql`.
2. Copy the full file into a new SQL Editor query.
3. Run it once.
4. Save the query in your project records.
5. Run the verification queries below.

Do not run the files in `supabase/migrations/` as a batch. They include older broad RLS policies, sample data, and destructive data changes. Do not use `supabase db push` for initial setup.

## Tables and relationships

| Table             | Purpose                                           | Relationship                      |
| ----------------- | ------------------------------------------------- | --------------------------------- |
| `users`           | LINE profile and role information                 | Independent LINE identity record  |
| `contractors`     | Contractor identity, contact, and payment details | Optional link to `auth.users`     |
| `agencies`        | Organization and signer details                   | Shared organization configuration |
| `contracts`       | Contract terms and salary values                  | Optional link to `contractors`    |
| `monthly_periods` | Monthly attendance, workload, and pay calculation | Required link to `contracts`      |
| `system_options`  | Dynamic form options                              | Empty after setup                 |
| `system_settings` | Global application settings                       | Empty after setup                 |
| `audit_logs`      | Application audit events                          | Optional link to `auth.users`     |

The schema includes `audit_action_type` and `period_status_type` enums, foreign-key indexes, and update-time triggers. See the SQL file for column definitions and constraints.

## Access model

RLS is enabled on all eight tables. The script creates no row policies and revokes table, sequence, and function privileges from `PUBLIC`, `anon`, and `authenticated`. It grants access to the Supabase `service_role` for server-side code only.

The service-role key bypasses RLS. Keep it in `SUPABASE_SERVICE_ROLE_KEY` on the server. Never include it in browser bundles or any `NEXT_PUBLIC_` variable.

The current browser storage adapter still queries tables directly with the public key. Those requests will be denied by this schema. Do not use real contractor data until sensitive CRUD runs through authenticated server handlers and passes authorization tests.

## Verify the schema

Check that all application tables have RLS enabled:

```sql
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'users', 'contractors', 'agencies', 'contracts',
    'monthly_periods', 'system_options', 'system_settings',
    'audit_logs'
  )
ORDER BY c.relname;
```

Check that browser roles have no table grants:

```sql
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, table_name, privilege_type;
```

The second query should return no rows for these application tables.

Confirm that the script did not seed dynamic options:

```sql
SELECT COUNT(*) AS system_option_rows
FROM public.system_options;
```

The result should be `0`. Add production options only after the application has an authorized server-side write path.

## Connection variables

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the public client. Set `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` only in server environments. See [environment setup](../developer/environment-setup.md).
