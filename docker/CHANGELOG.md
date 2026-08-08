# Changelog

All notable changes to the WoWSQL self-hosted setup will be documented here.

## [1.1.0] - 2026-08-08

### Studio UI parity with cloud dashboard

- Ported blue `ui-*` theme tokens, solid primary buttons, and dark-first theme
- Synced Table Editor with main dashboard (AppSelect, FilterPanel, PostgresTypePicker, EditRowModal, column display utils)
- Added Skeleton loading states used by the modern table editor

### Real data-plane services

- Auth, Storage, and Realtime now build from monorepo `services/wowsql-*` (same code as cloud)
- Storage uses Postgres BYTEA (no filesystem volume); Realtime uses LISTEN/NOTIFY with `PG_*` env

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
