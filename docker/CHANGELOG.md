## 1.2.1 — 2026-10-07

- Studio: SMS / Phone OTP settings (Twilio, Fast2SMS, MSG91)
- Self-backend: auth admin config fields for SMS providers and phone OTP
# Changelog

All notable changes to the WoWSQL self-hosted setup will be documented here.

## [1.2.0] - 2026-10-07

### Optional RLS (parity with hosted)

- Create-table RLS is opt-in (checkbox off by default). ENABLE only â€” never FORCE.
- Disable RLS from Studio always issues `NO FORCE` then `DISABLE`, so owners can turn it off.
- Event trigger `wowsql_grant_api_roles` grants PostgREST roles on `CREATE TABLE` without enabling RLS.
- Backend startup and DDL paths heal grants, drop FORCE RLS, and notify PostgREST to reload schema.
- Studio policies accept `auth.uid()` / `auth.role()` (helpers shipped in init SQL).
- Batch `/api/v1/db/execute` returns `{ results: [...] }` so the table editor can read RLS status.

## [1.1.0] - 2026-08-08

### Studio UI parity with cloud dashboard

- Ported blue `ui-*` theme tokens, solid primary buttons, and dark-first theme
- Synced Table Editor with main dashboard (AppSelect, FilterPanel, PostgresTypePicker, EditRowModal, column display utils)
- Added Skeleton loading states used by the modern table editor

### Real data-plane services

- Auth, Storage, and Realtime now build from monorepo `services/wowsql-*` (same code as cloud)
- Storage uses Postgres BYTEA (no filesystem volume); Realtime uses LISTEN/NOTIFY with `PG_*` env

### Auth Studio parity

- Ported live Auth UI (Providers, Email, Policies, Sessions, MFA, Rate Limits, Hooks, Attack Protection, Performance, Disable)
- Extended self-hosted backend with cloud-compatible auth admin APIs (`PATCH /auth/config`, oauth-providers, sessions, stats)

## [1.0.0] - 2026-06-12

### Initial Release

- PostgreSQL 18 with extensions (uuid-ossp, pgcrypto, vector)
- PostgREST v14 for instant REST APIs
- WoWSQL Auth with email/password + OAuth support
- WoWSQL Storage for file management
- WoWSQL Realtime for WebSocket subscriptions
- Kong 3.9 API Gateway with key-auth and JWT injection
- WoWSQL Studio dashboard
- Row Level Security helpers (auth.uid(), auth.role(), auth.jwt())
- Docker Compose single-command deployment
