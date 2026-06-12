<p align="center">
  <img src="https://wowsql.com/logo/wowbaselogo.png" alt="WoWSQL" width="400" />
</p>

<h1 align="center">WoWSQL — Self-Hosted</h1>

<p align="center">
  Run your own PostgreSQL backend with a full REST API, Auth, Storage, Realtime, and a beautiful Dashboard — all in one <code>docker compose up</code>.
</p>

<p align="center">
  <a href="https://github.com/WoWSQL/wowsql/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://hub.docker.com/u/wowsql"><img src="https://img.shields.io/badge/docker-hub-blue?logo=docker" alt="Docker Hub"></a>
</p>

---

## What is this?

This is the **self-hosted edition** of [WoWSQL](https://wowsql.com) — a Postgres-centric backend-as-a-service. It gives you:

| Feature | Description |
|---------|------------|
| **Table Editor** | Browse, create, and edit tables visually |
| **SQL Editor** | Run queries directly from the dashboard |
| **REST API** | Auto-generated from your schema via PostgREST |
| **Auth** | Row Level Security + user management |
| **Storage** | File uploads with bucket management |
| **Realtime** | WebSocket subscriptions for live data |
| **API Docs** | Auto-generated documentation for your REST API |

All running locally on your machine. No cloud account needed. No data leaves your network.

---

## Quickstart

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- 4 GB RAM minimum

### 1. Clone this repo

```bash
git clone https://github.com/WoWSQL/wowsql.git
cd wowsql/docker
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and change at minimum:
- `POSTGRES_PASSWORD` — your database password
- `JWT_SECRET` — at least 32 characters, used for API authentication

### 3. Start everything

```bash
docker compose up -d
```

That's it. Wait ~30 seconds for all services to become healthy.

### 4. Open the Dashboard

Visit **http://localhost:3000** in your browser.

On first launch you'll be prompted to create an admin account (email + password). This is your single admin user for the self-hosted instance.

### 5. Use the REST API

```bash
# List all tables
curl http://localhost:8080/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Query a table
curl http://localhost:8080/rest/v1/todos \
  -H "apikey: YOUR_ANON_KEY"

# Insert a row
curl http://localhost:8080/rest/v1/todos \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello from WoWSQL!"}'
```

Replace `YOUR_ANON_KEY` with the `ANON_KEY` value from your `.env` file.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Browser                          │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
        :3000 (Dashboard)          :8080 (API Gateway)
             │                          │
┌────────────┴──────────┐    ┌─────────┴──────────────────┐
│   WoWSQL Studio       │    │      Kong Gateway           │
│   (Next.js)           │    │                             │
└───────────────────────┘    │  /rest/v1/* → PostgREST     │
                             │  /auth/v1/* → Auth Service  │
                             │  /storage/* → Storage       │
                             │  /realtime/*→ Realtime      │
                             │  /api/v1/*  → Mini Backend  │
                             └─────────┬──────────────────┘
                                       │
                    ┌──────────────────┬┴────────────────┐
                    │                  │                  │
              ┌─────┴─────┐    ┌──────┴──────┐   ┌──────┴──────┐
              │ PostgreSQL │    │    Redis    │   │  Storage FS │
              │   :5432    │    │   :6379    │   │  /data/     │
              └────────────┘    └────────────┘   └─────────────┘
```

---

## Services

| Container | Port | Purpose |
|-----------|------|---------|
| `wowsql-db` | 5432 | PostgreSQL 18 with extensions |
| `wowsql-redis` | 6379 | Cache + pub/sub for Realtime |
| `wowsql-rest` | (internal) | PostgREST — auto REST API |
| `wowsql-auth` | (internal) | Authentication + RLS |
| `wowsql-storage` | (internal) | File storage service |
| `wowsql-realtime` | (internal) | WebSocket subscriptions |
| `wowsql-backend` | (internal) | Dashboard auth (login/register) |
| `wowsql-kong` | 8080 | API gateway (single entry point) |
| `wowsql-studio` | 3000 | Dashboard UI |

---

## Configuration

All configuration is in the `.env` file:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database superuser password |
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars) |
| `ANON_KEY` | Yes | Public API key for anonymous access |
| `SERVICE_ROLE_KEY` | Yes | Admin API key (bypasses RLS) |
| `AUTHENTICATOR_PASSWORD` | No | PostgREST db role password |
| `API_EXTERNAL_URL` | No | Kong URL if behind reverse proxy |
| `STUDIO_EXTERNAL_URL` | No | Dashboard URL if behind reverse proxy |

---

## Connecting with SDKs

Point any WoWSQL-compatible SDK to your local instance:

```javascript
import { createClient } from '@wowsql/sdk'

const wowsql = createClient('http://localhost:8080', 'YOUR_ANON_KEY')

// Now use it like normal
const { data } = await wowsql.from('todos').select('*')
```

---

## Self-Hosted vs Cloud

| Feature | Self-Hosted | Cloud (wowsql.com) |
|---------|-------------|---------------------|
| Your data stays local | ✅ | — |
| Single user, single project | ✅ | Multi-tenant |
| Free forever | ✅ | Free tier + paid |
| Auto-scaling | — | ✅ |
| Managed backups | — | ✅ |
| Team collaboration | — | ✅ |
| Custom domains | DIY | ✅ |

---

## Upgrading

```bash
cd docker
docker compose pull
docker compose up -d
```

Your data is stored in Docker volumes and persists across upgrades.

---

## Stopping

```bash
docker compose down       # Stop (keeps data)
docker compose down -v    # Stop and DELETE all data
```

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with ❤️ by the <a href="https://wowsql.com">WoWSQL</a> team
</p>
