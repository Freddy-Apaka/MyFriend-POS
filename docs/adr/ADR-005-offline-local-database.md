# ADR-005 — Offline Local Database: Dexie.js (IndexedDB)

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-005                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted — spike passed 2026-09-19          |
| **Deciders**| Engineering                                 |
| **DL Ref**  | DEC-003 / DL-109                            |

---

## Context

MyFriend POS must continue operating during network interruptions. The following
POS flows are required to work fully offline:

- Creating and completing a sale with multiple line items
- Recording a cash payment and calculating change
- Maintaining an open cash session
- Printing a receipt via connected hardware

When the network restores, all offline-created operations must be pushed to the
server idempotently — meaning the same operation submitted twice must never
create a duplicate financial effect.

Because the mobile strategy is PWA-first (ADR-002), the local storage technology
must run in a browser environment (Android Chrome and iOS Safari) without native
compilation.

Technologies evaluated:

| Technology | Browser-native | TypeScript | Schema migrations | Sync-friendly | Complexity |
|---|---|---|---|---|---|
| **Dexie.js** (IndexedDB) | ✓ | ✓ (first-class) | ✓ | ✓ | Low |
| Raw IndexedDB | ✓ | Manual | Manual | Possible | High |
| SQLite via WASM | Partial | ✓ | ✓ | ✓ | High (WASM bundle, threading) |
| PouchDB | ✓ | Partial | ✓ | Built-in (CouchDB-style) | Medium |
| Dexie Cloud | ✓ | ✓ | ✓ | Built-in | Vendor lock-in |

Dexie.js is the leading TypeScript-native wrapper over IndexedDB. It provides
a clean declarative schema, versioned migrations, and a query API that maps
naturally to the domain objects defined in the MyFriend POS schema. SQLite via
WASM was ruled out due to the significant bundle size, threading complexity, and
limited Safari support without additional configuration.

---

## Spike Results (Passed: 2026-09-19)

A 10-step technical spike was run to validate Dexie.js for this use case before
committing to it. All 10 steps passed.

| Step | Scenario | Result |
|---|---|---|
| 1 | Create a Dexie database in a React + Vite PWA | ✓ Pass |
| 2 | Go offline; create a sale with 2 line items; confirm saved to IndexedDB | ✓ Pass |
| 3 | Close/reopen the browser tab; confirm pending sale is recovered from IndexedDB | ✓ Pass |
| 4 | Restore network; confirm Dexie queue pushes operation to the API | ✓ Pass |
| 5 | Submit the same sale twice; confirm server idempotency key blocks duplicate | ✓ Pass |
| 6 | Server sends acknowledgement; confirm local record marked SYNCED | ✓ Pass |
| 7 | Simulate server failure mid-sync; confirm record stays in RETRY state, not lost | ✓ Pass |
| 8 | Verify server audit log contains sync event with correct device context | ✓ Pass |
| 9 | Verify failure UX shows FAILED/RETRY state clearly — no silent failure | ✓ Pass |
| 10 | Confirm schema migration runs on version bump without data loss | ✓ Pass |

---

## Decision

**Dexie.js (IndexedDB wrapper) is selected as the offline local database
technology for the MyFriend POS PWA.**

**Local schema structure (implemented in `apps/pwa/src/db/`):**
- `syncQueue` — pending operations awaiting server confirmation, with state
  machine: `LOCAL_ONLY → QUEUED → UPLOADING → SYNCED | RETRY | FAILED`
- `cachedCatalog` — locally cached product/pricing data for offline lookup
- `cachedOrders` — locally created and held orders pending sync
- `deviceMeta` — device registration, last sync cursor, active session context
- `cashSession` — local cash session state for offline cash operations

**Sync identity:** Every offline operation is assigned a stable
`client_operation_id` (UUID v4, generated on first write) before it enters
the sync queue. This ID is sent to the server on every retry and used to
deduplicate repeated submissions.

**Conflict handling:** Non-financial master-data conflicts (e.g. catalog
updates from another device) are surfaced to the user as visible conflict
records. Financial records are never silently overwritten by sync — any
financial conflict is held as CONFLICT state for explicit resolution.

---

## Consequences

**Positive:**
- No WASM compilation or native modules — the PWA installs and runs on Android
  Chrome and iOS Safari without additional configuration.
- Dexie's TypeScript-first API means local DB types can be derived from or
  aligned with the shared `packages/contracts/` schema definitions.
- Schema migrations are versioned and run automatically on app update, matching
  the same upgrade-safe pattern used for the server-side Supabase migrations.
- Offline financial safety rules (no offline refunds, no offline void without
  server authority) are enforced in the sync push validation layer, not left
  to the local DB schema.

**Negative / Trade-offs:**
- IndexedDB storage quotas are browser/OS-managed and can be evicted under
  storage pressure on low-storage Android devices. The sync queue must be
  flushed promptly to minimise the local storage footprint.
- Dexie Cloud (built-in sync) was not selected — sync is implemented via the
  custom `POST /api/v1/sync/push` and `GET /api/v1/sync/pull` endpoints
  defined in the API Specification, giving full control over conflict resolution
  and financial integrity rules.

**Constraints:**
- `SYNC-001` through `SYNC-010` in the Engineering Backlog are the implementation
  items for this architecture.
- The local schema must be versioned from `version: 1` on first release.
  Downgrade paths are not supported — schema version must only increase.
- Safari PWA storage restrictions on iOS must be validated on a real iOS device
  during M4 (Offline POS milestone) before iOS is listed as a supported platform.
