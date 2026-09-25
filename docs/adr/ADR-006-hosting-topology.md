# ADR-006 — Hosting Topology: Vercel + Railway + Supabase

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-006                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Product Owner + Engineering                 |
| **DL Ref**  | DEC-005 / DL-107                            |

---

## Context

MyFriend POS has five first-party client applications and a backend that spans
an API process, background workers, a relational database, and object storage.
Each component has different runtime characteristics:

- **Web frontends** (Business Web, Platform Admin Web, Customer Web, POS PWA)
  are static React + Vite build outputs that need CDN delivery, preview URLs
  for pull request review, and instant rollbacks.
- **Backend API** is a persistent Node.js process (modular monolith, ADR-003)
  that handles long-lived connections from sync clients and must not suffer
  cold start latency on POS-critical endpoints.
- **Background workers** run long-running jobs (CSV exports, imports, async
  reports, notifications) and must not share process or resource limits with
  the API.
- **Database + Auth + Storage** require managed PostgreSQL with PITR, built-in
  auth, and private object storage (ADR-004).

The chosen topology must cover all four concerns with minimal operational
overhead for an MVP-stage product.

---

## Decision

**Three providers form the complete hosting topology:**

### Vercel — Web Frontends

All four web applications are deployed to Vercel as independent projects:

| Vercel Project | App | Branch → Environment |
|---|---|---|
| `myfriend-pos-pwa` | POS PWA (`apps/pwa/`) | `dev` → staging, `main` → production |
| `myfriend-pos-web-business` | Business Web (`apps/web-business/`) | `dev` → staging, `main` → production |
| `myfriend-pos-web-platform` | Platform Admin Web (`apps/web-platform/`) | `dev` → staging, `main` → production |
| `myfriend-pos-web-customer` | Customer Web (`apps/web-customer/`) | `dev` → staging, `main` → production |

Rationale: Vercel provides automatic CDN delivery, global edge caching, preview
deployment URLs on every pull request (required for UI review), and zero-config
integration with the Turborepo monorepo build.

### Railway — Backend API + Workers

Two Railway services run within one Railway project:

| Railway Service | Role | Runtime |
|---|---|---|
| `api` | Modular monolith HTTP server | Node.js persistent process |
| `worker` | Background job runner | Node.js persistent process |

Two Railway environments per service:

| Environment | Connected to |
|---|---|
| `staging` | `myfriend-pos-staging` Supabase project |
| `production` | `myfriend-pos-prod` Supabase project |

Rationale: Railway provides persistent Node.js processes with no cold start,
horizontal scaling via replicas, built-in environment variable management,
deployment logs, and health check configuration. Keeping the `worker` as a
separate Railway service ensures that a spike in export/import jobs does not
consume the same CPU/memory as live POS API requests.

### Supabase — Database, Auth, Storage

As defined in ADR-004:
- `myfriend-pos-staging` Supabase project → staging environment
- `myfriend-pos-prod` Supabase project → production environment

### Queue / Background Job Technology

**pg-boss** running on the Supabase PostgreSQL database.

pg-boss uses the existing PostgreSQL database as a durable job queue. This
eliminates the need for a separate Redis instance or external queue service at
MVP scale. pg-boss provides:
- Durable job persistence (jobs survive worker restarts)
- Configurable retry with exponential backoff
- Job deduplication by key (idempotency)
- Completion/failure visibility via the same Supabase dashboard

### Monitoring / Observability

- **Railway built-in metrics and log streaming** — infrastructure and process
  observability for API and worker services.
- **Sentry** — application error tracking, performance monitoring, and alerting
  for both frontend and backend. Sufficient for MVP.
- A dedicated observability stack (Grafana, Datadog, etc.) is deferred to
  post-launch if Sentry + Railway metrics prove insufficient.

---

## Environment Summary

| Environment | Supabase Project | Railway Env | Vercel Branch |
|---|---|---|---|
| Local | Local Supabase CLI (Docker) | — | localhost |
| Development | Staging Supabase project | Staging | Feature branch preview |
| Staging | Staging Supabase project | Staging | `dev` branch |
| Production | Production Supabase project | Production | `main` branch |

---

## Consequences

**Positive:**
- Each layer (web, API, DB) is independently deployable and can be updated
  without coordinating a full-stack release.
- Vercel preview URLs mean every PR gets a live deployable link automatically —
  useful for UI review and QA.
- Railway's persistent process model eliminates cold-start latency on POS API
  endpoints, which is critical for offline-to-online sync push flows.
- pg-boss on Supabase PostgreSQL means zero additional infrastructure for
  the job queue — one fewer vendor, one fewer billing item.

**Negative / Trade-offs:**
- Three separate providers mean three billing accounts and three sets of
  credentials to manage. Mitigated by Railway secret manager and Vercel
  environment variable isolation.
- Railway does not provide a managed global CDN for API responses. POS
  performance in DRC depends on Railway's nearest region selection. This must
  be reviewed when the production Railway project is created (select the
  region closest to DRC — likely a European region given Railway's availability).

**Constraints:**
- Production Railway and Vercel deployments must require explicit approval
  before applying (DEV-004). Never auto-deploy to production on push.
- Staging and production Supabase projects must never share a connection string
  or service role key.
- All secrets (Supabase service role keys, Railway tokens, Sentry DSNs) must
  be stored in the respective platform's secret manager and injected at runtime.
  No secrets in source code or committed `.env` files.
