# ADR-008 — Development Stack & Repository Tooling

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-008                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Engineering                                 |
| **DL Ref**  | DEC-007 / DEC-008 (partial) / DL-118        |

---

## Context

Before repository initialization (FND-001) can begin, the full development
stack must be locked so that the monorepo structure, tooling configs,
CI/CD pipeline, and shared packages are built on a consistent foundation
from day one.

The stack must support:
- A TypeScript-first codebase across all apps (web, PWA, API, worker)
- A monorepo with five apps and shared packages that can build independently
  and in parallel
- Fast local development feedback loops
- A shared contract package consumed by both backend and all frontends
- A CI pipeline that can run linting, type-checking, unit tests, and builds
  across all packages efficiently
- Consistent code style enforced automatically

---

## Decision

### Language
**TypeScript (strict mode)** across all apps and packages.
`tsconfig.json` with `"strict": true` is defined in `packages/config/typescript/`
and extended by each app. No plain JavaScript files in the source tree.

### Frontend Framework
**React 18 + Vite** for all four web applications and the POS PWA.

React is the established framework for the project and is well-understood by
the team. Vite provides the fastest local development HMR experience and
production build output. All five frontend apps (`pwa`, `web-business`,
`web-platform`, `web-customer`) use the same framework configuration baseline
from `packages/config/vite/`.

### Backend Runtime and Framework
**Node.js (LTS) + Hono**

Hono is a lightweight, TypeScript-native web framework designed for modern
JavaScript runtimes. It has significantly lower overhead than Express, is
type-safe at the routing layer, and produces small bundle sizes. It runs
natively on Node.js (via the `@hono/node-server` adapter) and is compatible
with edge runtimes if the architecture ever migrates in that direction.

### ORM and Database Migrations
**Drizzle ORM + Supabase CLI (migrations)**

Drizzle provides TypeScript-native schema definitions that generate both
type-safe query builders and plain SQL migration files. Migration files are
stored in `supabase/migrations/` and applied via the Supabase CLI in CI/CD.
The combination of Drizzle (schema + queries) and Supabase CLI (migration
runner) is the recommended pairing for Supabase PostgreSQL projects.

### Monorepo Tooling
**Turborepo + pnpm workspaces**

| Tool | Role |
|---|---|
| **pnpm** | Package manager. Faster than npm, native workspace support, strict dependency isolation via symlinks |
| **Turborepo** | Monorepo task runner. Parallelizes builds/tests/lint across packages; caches task outputs to skip unchanged work |

Workspace layout:
```
apps/
  api/          ← Node.js + Hono backend
  worker/       ← Node.js + pg-boss background jobs
  pwa/          ← React + Vite POS PWA (Dexie.js offline)
  web-business/ ← React + Vite Business Web
  web-platform/ ← React + Vite Platform Admin Web
  web-customer/ ← React + Vite Customer Web

packages/
  contracts/    ← Shared API types, enums, error codes, Zod schemas
  ui/           ← Shared React component library
  config/       ← Shared ESLint, TypeScript, Vite, Vitest configs
```

### Testing
| Layer | Tool | Scope |
|---|---|---|
| Unit / integration | **Vitest** | Domain logic, service functions, API handlers, DB queries |
| End-to-end | **Playwright** | Full browser flows across web apps and PWA |
| Contract tests | **Vitest + Zod** | API contract validation from `packages/contracts/` |

Vitest is Vite-native and uses the same TypeScript config as the application
code — no separate Jest config or Babel transform needed. Playwright runs
against the staging environment in CI on every release candidate.

### Code Quality
| Tool | Purpose |
|---|---|
| **ESLint** | Linting (TypeScript, React, import rules) |
| **Prettier** | Code formatting |
| **TypeScript compiler** | Type checking (via `tsc --noEmit` in CI) |

All three run as Turborepo tasks and are enforced as required CI checks on
every pull request. Configs live in `packages/config/` and are extended by each
app's own config file.

### CI/CD
**GitHub Actions**

Three workflow files:

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | Every PR to `dev` | install → lint → typecheck → unit tests → build → migration dry-run |
| `deploy-staging.yml` | Push to `dev` | CI steps → migrate staging Supabase → deploy to Railway staging → deploy to Vercel staging |
| `deploy-production.yml` | Push to `main` (manual approval required) | CI steps → migrate prod Supabase → deploy to Railway production → deploy to Vercel production |

Turborepo remote caching (via Vercel Remote Cache) is used in CI to skip
rebuilding unchanged packages between runs.

### Branch Strategy

| Branch | Purpose | Protection |
|---|---|---|
| `main` | Production-ready code | Protected: requires PR + approval + passing CI |
| `dev` | Staging integration | Protected: requires PR + passing CI |
| `feature/*` | Individual work items | No protection; PR into `dev` |
| `fix/*` | Bug fixes | No protection; PR into `dev` |
| `release/*` | Release candidates (post-MVP) | Protected when created |

Direct pushes to `main` and `dev` are blocked. All changes enter via pull
request. Hotfixes to production go through an expedited PR to `main` and are
immediately back-merged to `dev`.

---

## Consequences

**Positive:**
- A single language (TypeScript) and a single framework (React) across all
  five frontends means no context switching between codebases.
- Turborepo task caching makes CI runs fast — unchanged packages are not
  rebuilt. A change to `apps/api/` only rebuilds `api` and the `contracts`
  package that it depends on.
- `packages/contracts/` is the single source of truth for API request/response
  shapes, shared by the backend and all clients. A type error in the contract
  propagates as a TypeScript compile error in all consumers simultaneously.
- pnpm's strict isolation prevents phantom dependency bugs that are common with
  npm hoisting.

**Negative / Trade-offs:**
- pnpm's strict mode may require explicit dependency declarations in packages
  that were previously relying on hoisted transitive dependencies. This is a
  one-time setup cost that pays off in reliability.
- Turborepo remote caching requires a Vercel account (free tier sufficient).
  If Vercel is ever removed from the hosting stack, the cache backend must be
  migrated.

**Constraints:**
- `FND-001` through `FND-006` and `DEV-001` through `DEV-007` in the Engineering
  Backlog are the implementation items for this decision.
- The Node.js LTS version must be pinned in `.nvmrc` and in the Railway
  deployment configuration. All developers must use the same version locally.
- The `packages/contracts/` package must be the only place where API types
  are defined. Clients must not define their own local copies of API shapes.
- Playwright E2E tests run against the staging environment, not against a
  local test server. They are part of the release gate, not the PR gate.
