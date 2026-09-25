# ADR-003 — Backend Architecture: Modular Monolith

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-003                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Product Owner + Engineering                 |
| **DL Ref**  | DEC-005 (partial)                           |

---

## Context

MyFriend POS requires a backend that serves multiple first-party clients:
the POS PWA, Business Web, Platform Admin Web, Customer Web, and background
workers for async jobs (exports, imports, reporting, notifications, sync).

The backend must enforce:
- Multi-tenant isolation (organization → store scope) on every request
- Append-oriented financial and inventory integrity
- Idempotent handling of retried and offline-originated operations
- Subscription entitlement gating per organization
- Server-side authorization on every protected action

Three architectural patterns were considered:

**Option A — Microservices**
- Independent deployable services per domain (identity, catalog, orders,
  payments, inventory, etc.)
- Strong isolation between domains
- Significant operational overhead: service discovery, inter-service auth,
  distributed tracing, complex deployment at MVP scale
- Premature for a team starting from zero with an unvalidated product

**Option B — Modular Monolith**
- All domain modules run inside one deployable Node.js process
- Modules have explicit internal boundaries (no cross-module direct DB access)
- Single deployment unit, single CI pipeline, single observability context
- Can be extracted into separate services later if load or team size demands it

**Option C — Serverless Functions (e.g. Vercel Functions)**
- Zero infrastructure to manage
- Cold start latency is problematic for POS operations
- Function timeout limits are incompatible with long-running sync, export, and
  import jobs
- Stateless model conflicts with the WebSocket-adjacent sync push/pull flows

---

## Decision

**The backend is a modular monolith** deployed as a persistent Node.js process
on Railway (ADR-006).

Domain modules are:
`identity` · `organization` · `store` · `catalog` · `orders` · `payments`
`inventory` · `cash` · `crm` · `reporting` · `sync` · `platform` · `integrations`

**Module rules (enforced by code review and, where possible, tooling):**
1. Each module owns its database tables. No other module queries those tables
   directly — all cross-module data access goes through the owning module's
   internal service interface.
2. Shared infrastructure (database connection, request context, error codes,
   audit service, transaction boundaries) lives in a `core/` layer that all
   modules import from.
3. The HTTP router registers each module's routes. Modules do not reference
   each other's routes directly.
4. A separate `worker` process imports the same module services and runs
   background jobs (exports, imports, async reports, notifications). It shares
   the codebase but runs as an independent Railway service.

**API style:** REST, API-first, versioned under `/api/v1/`. Request/response
contracts are defined in the shared `packages/contracts/` package and consumed
by both the backend and all first-party clients.

---

## Consequences

**Positive:**
- One deployable unit means one set of Railway environment variables, one
  CI/CD pipeline to manage, one structured log stream to read during debugging.
- Cross-module operations (e.g. sale → payment → inventory → audit) execute
  within a single database transaction boundary — no distributed transaction
  complexity.
- Tenant isolation is enforced at the request context middleware layer and
  validated in one place.
- Modules can be tested in isolation with mocked service interfaces.

**Negative / Trade-offs:**
- A bug in one module can affect the entire process. Mitigated by module
  boundary enforcement and comprehensive automated tests.
- Horizontal scaling means scaling all modules together even if only one
  is under load. Acceptable at MVP scale.

**Future path:**
- If specific modules (e.g. reporting, sync) require independent scaling,
  they can be extracted into separate Railway services sharing the same
  database and contract package. This extraction is architecturally safe
  because module boundaries are enforced from day one.
