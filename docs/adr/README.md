# Architecture Decision Records — MyFriend POS

This directory contains Architecture Decision Records (ADRs) for the MyFriend POS platform.

An ADR documents a significant technical or product decision: what was decided,
why it was decided, and what the consequences are. Once accepted, an ADR is
immutable — if a decision changes, a new ADR is written that supersedes the old
one (the old one is not deleted or edited).

---

## Format

Each ADR follows this structure:

```
# ADR-XXX — Title

| Field | Value |
| Status | Proposed | Accepted | Superseded by ADR-XXX |
| Date | YYYY-MM-DD |
| Deciders | Who made the call |
| DL Ref | Corresponding Decision Lock ID |

## Context
Why this decision needed to be made.

## Decision
What was decided, stated clearly and directly.

## Consequences
What becomes easier, harder, or constrained as a result.
```

---

## Status values

| Status | Meaning |
|---|---|
| **Proposed** | Decision is under discussion |
| **Accepted** | Decision is locked and in effect |
| **Superseded by ADR-XXX** | A later ADR replaced this one; link to the new one |
| **Deprecated** | No longer relevant; not superseded by a specific ADR |

---

## Index

| ID | Title | Status | Date |
|---|---|---|---|
| [ADR-001](./ADR-001-product-name.md) | Production Product Name | Accepted | 2026-09-19 |
| [ADR-002](./ADR-002-mobile-strategy.md) | Mobile Delivery Strategy: PWA-First for MVP | Accepted | 2026-09-19 |
| [ADR-003](./ADR-003-backend-architecture.md) | Backend Architecture: Modular Monolith | Accepted | 2026-09-19 |
| [ADR-004](./ADR-004-database-provider.md) | Database Provider: Supabase PostgreSQL | Accepted | 2026-09-19 |
| [ADR-005](./ADR-005-offline-local-database.md) | Offline Local Database: Dexie.js (IndexedDB) | Accepted | 2026-09-19 |
| [ADR-006](./ADR-006-hosting-topology.md) | Hosting Topology: Vercel + Railway + Supabase | Accepted | 2026-09-19 |
| [ADR-007](./ADR-007-authentication.md) | Authentication: Supabase Auth + MFA for Platform Admin | Accepted | 2026-09-19 |
| [ADR-008](./ADR-008-development-stack.md) | Development Stack & Repository Tooling | Accepted | 2026-09-19 |

---

## How to add a new ADR

1. Copy the format above into a new file: `ADR-009-short-title.md`
2. Assign the next sequential ID
3. Set status to `Proposed` while under discussion
4. Change to `Accepted` when the decision is locked by the product owner
   or engineering lead
5. Add the entry to the index table in this README
6. If this ADR supersedes an earlier one, update the older ADR's status
   to `Superseded by ADR-XXX`

---

## Source authority

These ADRs are derived from and consistent with the MyFriend POS specification
baseline (v0.1, September 2026). In the event of a conflict between an ADR and
a source specification document, the source specification takes precedence and
the ADR must be updated to reflect the resolution.
