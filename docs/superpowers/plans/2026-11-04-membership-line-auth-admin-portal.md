# Membership System, LINE Auth, Admin Panel & Dynamic Dropdown Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## Architecture & Codebase Design

This plan extends `salary-doc-web` following the principles of deep module interfaces and single responsibility:
- **`src/lib/auth/lineAuth.ts`**: Deep module encapsulating LINE OAuth v2.1 code exchange, state verification, user profile fetching, and mock session generator.
- **`src/lib/auth/session.ts`**: Session token management (cookie-based secure JWT/Session verification for Next.js App Router).
- **`src/lib/systemOptions/`**: Repository and hook for loading and caching dynamic dropdown options and system settings from Supabase.
- **`src/components/ui/ComboboxSelect.tsx`**: Reusable Accessible Searchable Combobox with custom text fallback.
- **`src/app/admin/`**: Admin Panel routes for Membership Management (`/admin/members`), Dynamic Options (`/admin/options`), and System Settings (`/admin/settings`).
- **`src/app/api/`**: Next.js route handlers for LINE Auth, Admin Member CRUD & Search, and Dynamic Options CRUD.

---

## File Structure Map

| File Path | Responsibility |
|---|---|
| `supabase/migrations/20261104000000_membership_and_dynamic_options.sql` | Supabase migration adding `system_options`, `system_settings`, and extending `contractors` with `line_user_id`, `role`, `status`, `avatar_url`. |
| `src/types/auth.ts` | TypeScript interfaces for User, Session, Role, and LINE Profile. |
| `src/types/systemOptions.ts` | TypeScript interfaces for `SystemOption`, `SystemSetting`, and Option Categories. |
| `src/lib/auth/lineAuth.ts` | LINE OAuth v2.1 handshake, profile fetcher, and Mock Dev login. |
| `src/lib/auth/session.ts` | Server and client session resolution, cookie management, role guards. |
| `src/app/api/auth/line/login/route.ts` | Initiates LINE OAuth redirect. |
| `src/app/api/auth/line/callback/route.ts` | Handles OAuth redirect, profile upsert, and session cookie. |
| `src/app/api/auth/line/mock/route.ts` | Fast Dev login switch for Member / Admin testing. |
| `src/app/api/auth/me/route.ts` | Returns active user session info. |
| `src/app/api/auth/logout/route.ts` | Destroys session. |
| `src/app/api/admin/members/route.ts` | Member list retrieval with search, filter, pagination, and member creation. |
| `src/app/api/admin/members/[id]/route.ts` | Member profile fetch, update (role/status/details), delete. |
| `src/app/api/system-options/route.ts` | Fetch active options by category, Add new option (Admin). |
| `src/app/api/system-options/[id]/route.ts` | Update option, Delete option (Admin). |
| `src/app/api/system-settings/route.ts` | Fetch and update system settings. |
| `src/components/ui/ComboboxSelect.tsx` | Accessible Combobox component with real-time search & custom text entry. |
| `src/components/ui/RadioGroup.tsx` | Accessible styled Radio button group. |
| `src/app/auth/login/page.tsx` | Redesigned login page with LINE Green button + Dev mode switcher. |
| `src/app/admin/layout.tsx` | Admin layout with authentication guard and sub-navigation tabs. |
| `src/app/admin/page.tsx` | Admin overview dashboard. |
| `src/app/admin/members/page.tsx` | Membership Management (Search, CRUD, role switch, status toggle). |
| `src/app/admin/options/page.tsx` | Dynamic Dropdown Options manager per category. |
| `src/app/admin/settings/page.tsx` | Global System Settings manager. |
| `src/components/layout/Header.tsx` | Header updated with user identity pill, role badge, Admin button, and logout. |
| `src/components/layout/DesktopSidebar.tsx` | Sidebar updated with Admin Panel entry (visible to Admins). |
| `src/components/forms/ProfileForm.tsx` | Upgraded with Title radio group, Position combobox, Bank combobox. |
| `src/components/forms/AgencyForm.tsx` | Upgraded with Agency and Payer Agency comboboxes. |
| `tests/auth_line.test.ts` | Unit/integration test for LINE Auth and Session handling. |
| `tests/admin_members.test.ts` | Test for Admin Member CRUD and Search. |
| `tests/system_options.test.ts` | Test for Dynamic Options CRUD and fallback. |

---

## Tasks & Tickets

### Task 1: Database Migration for Membership & Dynamic Options
- [ ] Create `supabase/migrations/20261104000000_membership_and_dynamic_options.sql`
- [ ] Add columns to `contractors`: `line_user_id`, `role`, `status`, `avatar_url`, `display_name`
- [ ] Create `system_options` table with indexes on `(category, is_active, sort_order)`
- [ ] Create `system_settings` table
- [ ] Seed default dynamic options for: `title`, `position`, `agency`, `payer_agency`, `bank`, `leave_type`
- [ ] Verify DDL syntax and test compatibility

### Task 2: Type Definitions & Session Layer
- [ ] Create `src/types/auth.ts` defining `UserRole`, `UserStatus`, `AuthUser`, `LineProfile`, `SessionPayload`
- [ ] Create `src/types/systemOptions.ts` defining `SystemOption`, `OptionCategory`, `SystemSetting`
- [ ] Implement `src/lib/auth/session.ts` for cookie encryption/decryption, session retrieval, and permission checks
- [ ] Implement `src/lib/auth/lineAuth.ts` supporting standard LINE OAuth v2.1 URL generation, token exchange, and Mock profile creation
- [ ] Write unit test `tests/auth_line.test.ts` to verify session and token logic

### Task 3: Authentication API Routes
- [ ] Create `/api/auth/line/login/route.ts` (generates LINE OAuth redirect)
- [ ] Create `/api/auth/line/callback/route.ts` (token exchange, upserts contractor in Supabase, sets session cookie)
- [ ] Create `/api/auth/line/mock/route.ts` (mock login for local development as Member or Admin)
- [ ] Create `/api/auth/me/route.ts` (returns current user session)
- [ ] Create `/api/auth/logout/route.ts` (clears cookie)
- [ ] Run test to verify auth routes

### Task 4: Dynamic System Options & Settings API Routes
- [ ] Create `/api/system-options/route.ts` (GET active options by category, POST new option for admin)
- [ ] Create `/api/system-options/[id]/route.ts` (PATCH update, DELETE option for admin)
- [ ] Create `/api/system-settings/route.ts` (GET all, PATCH update for admin)
- [ ] Write test `tests/system_options.test.ts`

### Task 5: Admin Membership Management API (CRUD + Search)
- [ ] Create `/api/admin/members/route.ts` with query parameters `search`, `role`, `status`, `page`, `limit`
- [ ] Create `/api/admin/members/[id]/route.ts` for GET, PATCH (update profile, toggle role/status), and DELETE
- [ ] Ensure non-admin users are rejected with HTTP 403 Forbidden
- [ ] Write test `tests/admin_members.test.ts`

### Task 6: UI Components (ComboboxSelect & RadioGroup)
- [ ] Create `src/components/ui/ComboboxSelect.tsx` with search filter, keyboard navigation, and custom text input option
- [ ] Create `src/components/ui/RadioGroup.tsx` with accessible government aesthetic
- [ ] Verify accessibility, keyboard navigation, and responsive touch targets (>= 44px)

### Task 7: Redesign Login & Register Page (`/auth/login`)
- [ ] Update `src/app/auth/login/page.tsx` with UI/UX Pro Max standards
- [ ] Implement official LINE Login button (Green `#06C755`, hover `#05b34c`, LINE branding)
- [ ] Implement Developer Mock Login presets (1-click login as Member or Admin)
- [ ] Handle error query parameters and redirect to `/profile` or return URL upon login

### Task 8: Admin Panel Pages (`/admin`)
- [ ] Create `src/app/admin/layout.tsx` with admin authentication guard and tab navigation
- [ ] Create `src/app/admin/page.tsx` with summary stats (total members, active, admins, dynamic options count)
- [ ] Create `src/app/admin/members/page.tsx` with:
  - Search input with debounce
  - Filter chips (All, Active, Suspended, Admin, Member)
  - Member table with avatars, role toggle, status toggle, edit modal, delete confirmation
- [ ] Create `src/app/admin/options/page.tsx` with:
  - Category selector tabs (คำนำหน้า, ตำแหน่ง, ส่วนราชการ, ผู้จ่ายเงิน, ธนาคาร, ประเภทการลา)
  - Add option input form
  - List of options with inline edit, active switch, and delete
- [ ] Create `src/app/admin/settings/page.tsx` with system settings controls

### Task 9: Header & Navigation Integration
- [ ] Update `src/components/layout/Header.tsx` to display user profile, role badge, Admin Panel button (for admins), and Logout
- [ ] Update `src/components/layout/DesktopSidebar.tsx` to include Admin Panel link with shield icon when user is admin
- [ ] Update `src/components/layout/MobileBottomNav.tsx` if appropriate

### Task 10: Form UX Enhancements with Dynamic Options
- [ ] Update `src/components/forms/ProfileForm.tsx`:
  - Title selector using RadioGroup / Combobox from dynamic options
  - Position combobox loaded from dynamic options with "อื่นๆ" fallback
  - Bank name combobox loaded from dynamic options
- [ ] Update `src/components/forms/AgencyForm.tsx`:
  - Agency name combobox loaded from dynamic options
  - Payer agency combobox loaded from dynamic options
- [ ] Update `src/components/forms/HolidayLeaveManager.tsx`:
  - Leave type selector from dynamic options

### Task 11: Verification, Integration Testing & Build
- [ ] Run `npm run type-check` (strict TypeScript validation)
- [ ] Run test suite with new tests added (`tests/runner.ts`)
- [ ] Ensure all 183 existing tests continue to pass without regression
- [ ] End-to-end verification of LINE login, Admin Panel, Member Search & CRUD, and Dynamic Dropdowns
