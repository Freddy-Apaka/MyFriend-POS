# ADR-004 — Database Provider: Supabase PostgreSQL

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-004                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Product Owner + Engineering                 |
| **DL Ref**  | DEC-004 / DL-106                            |

---

## Context

MyFriend POS requires a production-grade relational database that can support:

- Multi-tenant data isolation (organization → store → user scope)
- Append-oriented financial and inventory ledger semantics (no silent overwrites)
- 60+ tables as defined in the Database Schema Specification v0.1
- Automated managed backups with point-in-time recovery (PITR)
- A local development experience that closely mirrors production
- Managed authentication that integrates with the same platform
- Object storage for imports, exports, and generated files
- Cost-effective operation for an MVP-stage product serving DRC and
  international clients

Providers evaluated:

| Provider | PostgreSQL | Managed | Auth built-in | Storage | RLS | Team familiarity |
|---|---|---|---|---|---|---|
| **Supabase** | ✓ | ✓ | ✓ | ✓ | ✓ | High (used in prior projects) |
| AWS RDS | ✓ | ✓ | ✗ | ✗ | Partial | Medium |
| PlanetScale | MySQL | ✓ | ✗ | ✗ | ✗ | Low |
| Neon | ✓ | ✓ | ✗ | ✗ | ✓ | Low |
| Railway PostgreSQL | ✓ | ✓ | ✗ | ✗ | ✓ | Medium |

Supabase uniquely consolidates the database, authentication, object storage,
and Row Level Security policy enforcement into one platform — eliminating
separate vendors for three of the four core infrastructure concerns.

---

## Decision

**Supabase PostgreSQL is the confirmed production database provider.**

**Two separate Supabase projects will be maintained:**
- `myfriend-pos-staging` — used for all development, integration testing, and
  pre-release validation. Contains only synthetic or sanitized data.
- `myfriend-pos-prod` — live customer data. Credentials are never shared with
  non-production environments.

**ORM / migration tool:** Drizzle ORM.
Drizzle is TypeScript-native, generates type-safe query builders directly from
schema definitions, and produces plain SQL migration files that are portable and
reviewable. Migration files live in `supabase/migrations/` and are run via the
Supabase CLI in CI/CD.

**Tenant isolation strategy:**
- Primary enforcement: application-layer organization/store scope resolution on
  every request (middleware in `core/context`).
- Secondary enforcement: Supabase Row Level Security (RLS) policies on all
  tables that hold tenant data, as a defence-in-depth measure. RLS is not a
  substitute for application-layer enforcement — both layers are required.

**Backup and recovery:**
- PITR (Point-in-Time Recovery) enabled on `myfriend-pos-prod`.
- 30-day rolling backup retention.
- Target RPO: 1 hour. Target RTO: 4 hours. To be reviewed after pilot launch.

**Object storage:**
- Supabase Storage is used for all private application files (exports, imports,
  generated receipts). Time-limited signed URLs for all private file access.
- Export file retention: 30 days. Import file retention: 7 days after processing.

---

## Consequences

**Positive:**
- Single vendor covers database, auth, storage — fewer accounts, billing items,
  and integration surfaces to manage.
- Supabase CLI enables reproducible local development against a local Supabase
  stack (Docker-based) that matches the production schema and RLS policies.
- Team familiarity with Supabase from prior projects (DRC mining management
  system) reduces onboarding risk.
- RLS adds a tenant isolation safety net that would catch an application-layer
  scope bug before it exposes cross-tenant data.

**Negative / Trade-offs:**
- Supabase's managed plans have resource limits that may require a plan upgrade
  as transaction volume grows. Must be monitored.
- RLS policy maintenance adds overhead when schema changes. Every new table
  that holds tenant data requires a corresponding RLS policy review.

**Constraints:**
- The first database migration against `myfriend-pos-staging` formally
  confirms this decision (checklist item E in the Decision Lock moves from △ to ✓).
- All migration files must be reviewed for RLS policy coverage before being
  applied to production.
- Production Supabase credentials must be stored in Railway's secret manager
  and never in source code or `.env` files committed to the repository.
