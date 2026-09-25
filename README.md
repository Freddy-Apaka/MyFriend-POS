# MyFriend POS

Multi-tenant, offline-first Point of Sale and Business Management SaaS platform.
Built for the DRC market first, designed to expand across Africa and internationally.

---

## What This Is

MyFriend POS supports multiple business types (retail, restaurant, service) across
multiple stores and organizations on one platform — with full offline capability,
bilingual support (French/English), and multi-currency handling (CDF/USD).

**Platforms:** Android (PWA), iOS (PWA), Business Web, Platform Admin Web, Customer Web

---

## Architecture at a Glance

- **Frontend:** React + Vite across all five client apps
- **Backend:** Node.js + Hono modular monolith
- **Database:** Supabase PostgreSQL (with Row Level Security)
- **Offline storage:** Dexie.js (IndexedDB) for the POS PWA
- **Hosting:** Vercel (web apps) + Railway (API + workers) + Supabase (data)
- **Monorepo:** Turborepo + pnpm workspaces

For the full reasoning behind every architectural decision, see
[`docs/adr/`](./docs/adr/README.md).

---

## Repository Structure

```
myfriend-pos/
├── apps/
│   ├── api/              ← Backend API (Node.js + Hono)
│   ├── worker/            ← Background job runner (pg-boss)
│   ├── pwa/                ← POS Progressive Web App
│   ├── web-business/       ← Business Web (org/store management)
│   ├── web-platform/       ← Platform Admin Web
│   └── web-customer/       ← Customer-facing Web
├── packages/
│   ├── contracts/          ← Shared API types, enums, error codes
│   ├── ui/                 ← Shared React component library
│   └── config/             ← Shared ESLint, TypeScript, Vite, Vitest configs
├── supabase/
│   └── migrations/         ← Database migration files
└── docs/
    ├── adr/                 ← Architecture Decision Records
    ├── LOCAL_SETUP.md        ← Local development guide
    └── DEPLOYMENT.md         ← Deployment procedures
```

---

## Getting Started

Prerequisites: **Node.js 20+**, **pnpm 8+**, **Docker** (for local Supabase)

```bash
# Install dependencies
pnpm install

# Start local Supabase stack
docker-compose up -d

# Run all apps in development mode
pnpm dev
```

See [`docs/LOCAL_SETUP.md`](./docs/LOCAL_SETUP.md) for the full local development guide.

---

## Documentation

| Document | Purpose |
|---|---|
| [`docs/adr/`](./docs/adr/README.md) | Why every major technical decision was made |
| [`docs/LOCAL_SETUP.md`](./docs/LOCAL_SETUP.md) | How to run this project locally |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | How staging and production deployments work |

---

## Development Workflow

| Branch | Purpose |
|---|---|
| `main` | Production. Protected — requires PR + approval + passing CI |
| `dev` | Staging integration. Protected — requires PR + passing CI |
| `feature/*` | Individual work items. PR into `dev` |
| `fix/*` | Bug fixes. PR into `dev` |

All changes go through pull requests. Direct pushes to `main` and `dev` are blocked.

---

## Status

Currently in **M1 — Foundation & Engineering Setup**. See the project's Engineering
Backlog and Decision Lock documents for the full milestone roadmap (M0 → M7).
