<p align="center">
  <a href="https://wowsql.com">
    <img src="https://wowsql.com/logo/wowbaselogo.png" alt="WoWSQL" width="320" />
  </a>
</p>

<h3 align="center">The Open Source Firebase Alternative for PostgreSQL</h3>

<p align="center">
  Auto REST API · Auth · Storage · Realtime · MCP · SDK · VS Code Extension
</p>

<p align="center">
  <a href="https://wowsql.com"><img src="https://img.shields.io/badge/wowsql.com-000000?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6Ii8+PC9zdmc+" alt="Website"></a>
  <a href="https://wowsql.com/docs"><img src="https://img.shields.io/badge/docs-wowsql.com%2Fdocs-5865F2?style=flat-square" alt="Docs"></a>
  <a href="https://github.com/WoWSQL/wowsql/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-22c55e?style=flat-square" alt="License"></a>
  <a href="https://hub.docker.com/u/wowsql"><img src="https://img.shields.io/badge/docker-hub-0ea5e9?style=flat-square&logo=docker&logoColor=white" alt="Docker Hub"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=wowsql.wowsql"><img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code"></a>
  <a href="https://discord.gg/wowsql"><img src="https://img.shields.io/badge/discord-join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord"></a>
</p>

<br />

<p align="center">
  <a href="https://wowsql.com">Website</a> ·
  <a href="https://wowsql.com/docs">Documentation</a> ·
  <a href="https://wowsql.com/docs/self-hosting">Self-Hosting</a> ·
  <a href="https://discord.gg/wowsql">Discord</a> ·
  <a href="https://x.com/wowsql">X / Twitter</a>
</p>

---

## What is WoWSQL?

**WoWSQL** is a batteries-included PostgreSQL backend — open source, self-hostable, and production-ready. One `docker compose up` gives you a full backend stack with everything you need to build modern applications.

```bash
git clone https://github.com/WoWSQL/wowsql.git
cd wowsql/docker && docker compose up -d
# → Dashboard at http://localhost:3000
# → REST API at http://localhost:8080
```

---

## Features

| | |
|---|---|
| **Table Editor** | Create and manage tables visually — no SQL required |
| **SQL Editor** | Write and run queries right from the dashboard |
| **REST API** | Auto-generated PostgREST API from your schema |
| **Auth** | Built-in user management with Row Level Security |
| **Storage** | File uploads, bucket management, and access policies |
| **Realtime** | WebSocket subscriptions for live database changes |
| **API Docs** | Auto-generated docs for every endpoint |
| **MCP Server** | Connect Claude and other AI agents directly to your database |
| **SDK** | TypeScript/JavaScript client — works like a charm |
| **VS Code Extension** | Query, browse, and manage your database from your editor |

---

## Use WoWSQL From Anywhere

### 🟦 JavaScript / TypeScript SDK

Install and connect in seconds:

```bash
npm install @wowsql/sdk
```

```typescript
import { createClient } from '@wowsql/sdk'

const wowsql = createClient('https://your-project.wowsqlconnect.com', 'YOUR_ANON_KEY')

// Read
const { data, error } = await wowsql.from('users').select('*')

// Insert
await wowsql.from('users').insert({ name: 'Saravana', role: 'admin' })

// Filter
await wowsql.from('products').select('*').eq('category', 'electronics').limit(10)

// Realtime
wowsql
  .channel('orders')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
    console.log('New order:', payload.new)
  })
  .subscribe()
```

> Works in Node.js, the browser, React, Next.js, Expo, and anywhere JS runs.

---

### 🤖 MCP — AI Agents & Claude Integration

WoWSQL ships with a **Model Context Protocol (MCP) server** — giving AI assistants like Claude direct, structured access to your database. Query tables, run SQL, inspect schemas, and build data-driven AI workflows without writing glue code.

```json
// Claude Desktop — claude_desktop_config.json
{
  "mcpServers": {
    "wowsql": {
      "command": "npx",
      "args": ["-y", "@wowsql/mcp"],
      "env": {
        "WOWSQL_URL": "https://your-project.wowsqlconnect.com",
        "WOWSQL_SERVICE_KEY": "YOUR_SERVICE_ROLE_KEY"
      }
    }
  }
}
```

Once connected, Claude can:

- `list_tables` — see your full schema
- `execute_sql` — run any query
- `select_rows` / `insert_rows` / `update_rows` / `delete_rows` — CRUD without raw SQL
- `get_table_schema` — introspect columns, types, and constraints

```
You: "Show me all orders placed in the last 7 days with total > 500"
Claude: [calls execute_sql] → returns results instantly
```

> MCP turns your database into a first-class AI tool. No more copy-pasting schema into prompts.

**MCP packages:**
- [`@wowsql/mcp`](https://npmjs.com/package/@wowsql/mcp) — standalone MCP server for Claude Desktop, Cursor, and any MCP client
- Cloud MCP URL available on all WoWSQL Cloud projects

---

### 🔵 VS Code Extension

Browse tables, run queries, and inspect your schema — all without leaving your editor.

<p>
  <a href="https://marketplace.visualstudio.com/items?itemName=wowsql.wowsql">
    <img src="https://img.shields.io/badge/Install%20on%20VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Install VS Code Extension" />
  </a>
</p>

**What it gives you:**

- 🗂 **Database Explorer** — browse projects, tables, and columns in the sidebar
- ✏️ **Inline SQL Editor** — write and run queries with syntax highlighting and autocomplete
- 📊 **Result Grid** — paginated results rendered in a table view
- 🔑 **Multi-project support** — switch between projects from the status bar
- 🔐 **Secure auth** — authenticates with your WoWSQL account, no manual key management

> Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=wowsql.wowsql) or search `WoWSQL` inside VS Code.

---

## Self-Hosting

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- 4 GB RAM minimum

### Quickstart

```bash
# 1. Clone
git clone https://github.com/WoWSQL/wowsql.git
cd wowsql/docker

# 2. Configure
cp .env.example .env
# → Edit .env: set POSTGRES_PASSWORD and JWT_SECRET

# 3. Launch
docker compose up -d

# 4. Open Dashboard
open http://localhost:3000
```

Done. The full stack — Postgres, REST API, Auth, Storage, Realtime, and Dashboard — is running locally.

### REST API

```bash
# List tables
curl http://localhost:8080/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Query
curl http://localhost:8080/rest/v1/users \
  -H "apikey: YOUR_ANON_KEY"

# Insert
curl -X POST http://localhost:8080/rest/v1/users \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane", "email": "jane@example.com"}'
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Your Browser                         │
└────────────┬─────────────────────────────┬───────────────┘
             │                             │
       :3000 (Dashboard)             :8080 (API)
             │                             │
   ┌─────────┴──────────┐     ┌────────────┴──────────────┐
   │   WoWSQL Studio    │     │       Kong Gateway         │
   │   (Next.js)        │     │                            │
   └────────────────────┘     │  /rest/v1/* → PostgREST    │
                              │  /auth/v1/* → Auth         │
                              │  /storage/* → Storage      │
                              │  /realtime/*→ Realtime     │
                              └────────────┬──────────────┘
                                           │
                       ┌───────────────────┼──────────────┐
                       │                   │              │
               ┌───────┴──────┐   ┌────────┴──────┐  ┌───┴──────────┐
               │  PostgreSQL  │   │     Redis      │  │  Storage FS  │
               │    :5432     │   │    :6379       │  │   /data/     │
               └──────────────┘   └───────────────┘  └──────────────┘
```

### Services

| Container | Port | Purpose |
|---|---|---|
| `wowsql-db` | 5432 | PostgreSQL 18 with extensions |
| `wowsql-redis` | 6379 | Cache + pub/sub for Realtime |
| `wowsql-rest` | internal | PostgREST — auto REST API |
| `wowsql-auth` | internal | Authentication + RLS |
| `wowsql-storage` | internal | File storage service |
| `wowsql-realtime` | internal | WebSocket subscriptions |
| `wowsql-kong` | 8080 | API gateway |
| `wowsql-studio` | 3000 | Dashboard UI |

---

## Configuration

All configuration lives in `.env`:

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | ✅ | Database superuser password |
| `JWT_SECRET` | ✅ | JWT signing key (min 32 chars) |
| `ANON_KEY` | ✅ | Public API key for anonymous access |
| `SERVICE_ROLE_KEY` | ✅ | Admin API key — bypasses RLS |
| `AUTHENTICATOR_PASSWORD` | — | PostgREST db role password |
| `API_EXTERNAL_URL` | — | Kong URL when behind a reverse proxy |
| `STUDIO_EXTERNAL_URL` | — | Dashboard URL when behind a reverse proxy |

---

## Self-Hosted vs Cloud

| | Self-Hosted | Cloud |
|---|---|---|
| Your data stays local | ✅ | — |
| Free forever | ✅ | Free tier + paid plans |
| Auto-scaling | — | ✅ |
| Managed backups | — | ✅ |
| Team collaboration | — | ✅ |
| Custom domains | DIY | ✅ |
| MCP Server | ✅ | ✅ |
| SDK support | ✅ | ✅ |
| VS Code Extension | ✅ | ✅ |

[→ Start for free on WoWSQL Cloud](https://wowsql.com)

---

## Upgrading

```bash
cd docker
docker compose pull
docker compose up -d
```

Data persists in Docker volumes across upgrades.

---

## Other WoWSQL Products

| Product | Description |
|---|---|
| [**WoWCare**](https://wowcare.pro) | Healthcare management platform |
| [**WoWFolio**](https://wowfolio.in) | Portfolio builder |
| [**WoWCloud**](https://wowcloud.io) | Cloud infrastructure tools |
| [**WoWSocials**](https://wowsocials.app) | Social Media Manager |
| [**DataSpeak**](https://dataspeak.me) | Speak with your database |

---

## Community

- 💬 [Discord](https://discord.com/invite/AnBzbqRFU9) — get help, share what you're building
- 🐦 [X / Twitter](https://x.com/wowsql) — updates and announcements
- 🐙 [GitHub](https://github.com/WoWSQL) — source code, issues, contributions
- 📺 [YouTube](https://youtube.com/@wowsql) — tutorials and walkthroughs
- 💬 [WoWSQL Community](https://wowsql.com/community) — Offical WoWSQL community for all products

---

## Contributing

We welcome contributions of all kinds — bug fixes, docs, new features, and ideas.

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes
4. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with ❤️ by the <a href="https://wowsql.com">WoWSQL</a> team
  <br /><br />
  <a href="https://wowsql.com">wowsql.com</a> · <a href="https://wowcare.pro">wowcare.pro</a> · <a href="https://wowfolio.in">wowfolio.in</a> · <a href="https://wowcloud.io">wowcloud.io</a>
</p>
