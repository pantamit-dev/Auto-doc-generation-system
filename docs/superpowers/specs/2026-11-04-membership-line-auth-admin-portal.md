# Specification: Membership System, LINE Auth, Admin Panel, Dynamic Dropdowns & Form UX Enhancement

## 1. Executive Summary & Goals
This specification defines the extension of the Thai Government Contractor Salary & Document System (`salary-doc-web`).
The system is upgraded from a single-contractor prototype into a secure, multi-tenant web application supporting:
1. **LINE Authentication & Registration**: Users sign up and sign in using LINE Login v2.1 (OAuth 2.0 / OpenID Connect) to retrieve `line_user_id`, `display_name`, and `picture_url` as profile identity, backed by Supabase with a local Dev/Mock fallback mode.
2. **Multi-Tenant User Isolation**: Authenticated members manage and persist their own contractor profile, agency settings, contracts, and monthly periods.
3. **Admin Panel & Membership Management (CRUD + Search)**: Dedicated administrative dashboard with member list, fast real-time search & filter, role switching (`admin` vs `member`), status toggle (`active` vs `suspended`), and contractor profile editing.
4. **Dynamic Dropdown Options & Management**: Centralized `system_options` table allowing Administrators to add, update, sort, toggle, and delete options for all form dropdowns (titles, positions, agency names, payer agencies, bank names, leave types) without code redeployment.
5. **System Settings Management**: Centralized `system_settings` table in Supabase for global defaults (statutory divisor 30, target 110 tasks, default work hours 07:30-08:30 / 16:30-19:00).
6. **Form UX Optimization (UI/UX Pro Max)**: Streamlined forms minimizing manual typing by introducing radio groups, searchable comboboxes with custom "อื่นๆ" fallback, auto-complete, and responsive layouts adhering to accessibility standards (WCAG AAA/AA, touch targets >= 44px).

---

## 2. User Personas & Permissions (RBAC)

| Role | Permissions |
|---|---|
| **Guest / Anonymous** | - Can view landing/login page<br>- Can initiate LINE Login / Signup or Dev Mock Login |
| **Member (`member`)** | - Edit personal profile (`contractor`)<br>- View and update their contracts, agency signers, and monthly workloads<br>- Generate, preview, and print 5 government documents<br>- View their personal audit trail |
| **Admin (`admin`)** | - All Member capabilities<br>- Access `/admin` route (Admin Panel)<br>- Member Management (Search, view, edit all members, toggle role `admin`/`member`, toggle status `active`/`suspended`)<br>- Dynamic Dropdown Options Management (Add/Edit/Delete options across all categories)<br>- System Settings Management (Configure global application parameters) |

---

## 3. Architecture & Data Flow

```
[User Browser]
      │
      ├── (Click: เข้าสู่ระบบด้วย LINE) ──────────┐
      │                                            ▼
      │                                  [/api/auth/line/login]
      │                                            │
      │                                     (Redirect to LINE)
      │                                            ▼
      │                                  [LINE OAuth 2.0 Auth Server]
      │                                            │
      │                                     (Redirect with code)
      │                                            ▼
      ├── (Callback with code & state) ──> [/api/auth/line/callback]
      │                                            │
      │                                    (Exchange code -> token & profile)
      │                                            │
      │                                    (Supabase: Upsert member & session)
      │                                            ▼
      │                                    (Redirect to /profile or /)
      ▼
[Member Experience]
  ├── Profile / Agency / Contract Forms (with Dynamic Comboboxes & Radio Groups)
  ├── Workload Matrix (18 tasks x 31 days)
  ├── Document Center (DOC-01, DOC-02A, DOC-02B, DOC-03, DOC-04)
  └── [Admin Only] ──> Admin Panel (/admin/members, /admin/options, /admin/settings)
```

---

## 4. Database Schema Extensions (Supabase PostgreSQL)

### 4.1 Update `contractors` Table
- Add columns:
  - `line_user_id VARCHAR(100) UNIQUE`: LINE user ID (`U...`)
  - `role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member'))`
  - `status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'))`
  - `avatar_url TEXT`: URL to LINE profile picture
  - `display_name VARCHAR(255)`: LINE display name

### 4.2 New Table: `system_options`
Stores configurable dropdown options categorized for forms:
```sql
CREATE TABLE IF NOT EXISTS system_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'title', 'position', 'agency', 'payer_agency', 'bank', 'leave_type'
  label VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_system_options_category ON system_options(category, is_active, sort_order);
```

### 4.3 New Table: `system_settings`
Stores global application settings:
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  label VARCHAR(255) NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. API Endpoints Specification

### 5.1 LINE Authentication
- `GET /api/auth/line/login`: Generates LINE OAuth URL with CSRF state and redirects to LINE.
- `GET /api/auth/line/callback`: Handles authorization code from LINE, fetches user profile from `https://api.line.me/v2/profile`, syncs user record into Supabase, and sets auth cookie/session.
- `POST /api/auth/line/mock`: Dev/Mock login endpoint allowing instant login as Member or Admin during development without external LINE credentials.
- `POST /api/auth/logout`: Clears session cookie and logs out.
- `GET /api/auth/me`: Returns current user session info (`user_id`, `role`, `status`, `display_name`, `avatar_url`).

### 5.2 Membership Management (Admin Only)
- `GET /api/admin/members?search=&role=&status=&page=&limit=`: Search and paginate members.
- `GET /api/admin/members/[id]`: Retrieve full profile of a specific member.
- `PATCH /api/admin/members/[id]`: Update member details, role, or status.
- `DELETE /api/admin/members/[id]`: Delete a member.

### 5.3 Dynamic System Options & Settings
- `GET /api/system-options?category=`: Public/authenticated retrieval of active dropdown options.
- `POST /api/system-options`: (Admin) Add new dropdown option.
- `PATCH /api/system-options/[id]`: (Admin) Update label, value, sort_order, or is_active.
- `DELETE /api/system-options/[id]`: (Admin) Delete dropdown option.
- `GET /api/system-settings`: Retrieve global settings.
- `PATCH /api/system-settings`: (Admin) Update global settings.

---

## 6. UI / UX Specifications (`/ui-ux-pro-max`)

### 6.1 Authentication Experience
- Modern dual-card authentication page (`/auth/login`).
- Primary CTA: **"เข้าสู่ระบบด้วย LINE"** with official LINE Green (`#06C755`), white text, LINE icon, hover state (`#05b34c`), active state (`#049b42`), WCAG AAA contrast compliant.
- Secondary Dev Mode toggle: "เข้าสู่ระบบโหมดทดสอบ (Developer Mock Mode)" with 1-click presets:
  - 👤 เข้าใช้งานเป็น สมาชิกทั่วไป (Member)
  - 🛡️ เข้าใช้งานเป็น ผู้ดูแลระบบ (Admin)

### 6.2 Navigation & Header Updates
- Top Header:
  - Shows logged-in user avatar and display name with role badge (e.g. `[Admin]` in sky-600 pill or `[Member]` in slate-600 pill).
  - Admin button: "จัดการระบบ (Admin Panel)" visible in header and desktop sidebar when user has `admin` role.
  - Logout action in user dropdown menu.

### 6.3 Admin Panel Layout (`/admin`)
- Accessible only to users with role `admin` (redirects unauthorized users to `/` with alert).
- Sub-pages with modern tabbed sidebar or top pill navigation:
  1. `/admin/members`: **ระบบจัดการสมาชิก (Membership Management)**
     - Search bar (instant debounce search across Name, Citizen ID, Email, LINE Name).
     - Filter chips: All, Active, Suspended, Admin, Member.
     - Table with Avatar, Name, LINE Username, Citizen ID, Role (inline switcher), Status (toggle badge), Action buttons (Edit Profile, Delete).
     - "เพิ่มสมาชิกใหม่" modal.
  2. `/admin/options`: **จัดการตัวเลือก Dropdown (Dynamic Options)**
     - Category selector tabs: คำนำหน้าชื่อ (title), ตำแหน่งงาน (position), ส่วนราชการ (agency), ส่วนราชการผู้จ่ายเงิน (payer_agency), ธนาคาร (bank), ประเภทการลา (leave_type).
     - Quick Add Option bar with label, value, and sort order.
     - List/Table of options with drag or sort order, Active/Inactive switch, and Delete button.
  3. `/admin/settings`: **การตั้งค่าระบบ (System Settings)**
     - Config card for calculation parameters (Default statutory divisor = 30, Target tasks = 110).
     - Config card for working hours windows (07:30 - 08:30, 16:30 - 19:00).
     - Save button with toast notification.

### 6.4 Form UX Optimization (Minimal Typing)
- **Searchable Combobox Component (`ComboboxSelect`)**:
  - Replaces plain text inputs for Position, Agency Name, Payer Agency, Bank Name, and Leave Type.
  - Features real-time typeahead filter and keyboard navigation (Arrow Up/Down, Enter).
  - Includes `+ ระบุค่าอื่น ๆ...` option allowing custom entry if not in preset.
- **Radio Button Groups**:
  - Used for short lists (e.g., Title: นาย / นาง / นางสาว / อื่นๆ).
- **Auto-Fill & Derivation**:
  - Retains automated Thai numeral conversion for address and dates.
  - Auto-synchronizes contractor full name across signers.
