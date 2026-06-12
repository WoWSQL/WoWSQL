# Changelog

All notable changes to the WoWSQL self-hosted setup will be documented here.

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
