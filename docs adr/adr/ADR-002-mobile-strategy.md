# ADR-002 — Mobile Delivery Strategy: PWA-First for MVP

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-002                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Product Owner + Engineering                 |
| **DL Ref**  | DEC-002                                     |

---

## Context

MyFriend POS requires a mobile client that runs on Android and iOS devices used
by cashiers and store operators in DRC environments. The product must support:

- Offline-capable POS operations (sales, cart, cash sessions)
- Hardware peripherals (receipt printer, barcode scanner, cash drawer)
- A reliable experience on mid-range Android tablets (the primary pilot device)
- Bilingual UI (French / English)

Two categories of mobile delivery strategy were evaluated:

**Option A — Native / Cross-Platform App (React Native or Flutter)**
- Full access to device APIs and native hardware integrations
- Requires separate build pipelines for Android and iOS
- Requires app store submission and approval cycles for every release
- Higher development cost and longer time-to-first-pilot

**Option B — Progressive Web App (PWA), installed via browser**
- Runs in Chromium on Android; can be added to home screen
- Shares 100% of the codebase with the web frontend (React + Vite)
- Offline capability via Service Worker + local storage (Dexie.js — ADR-005)
- Hardware integration via Web Bluetooth and Web USB APIs
- No app store submission for MVP; updates deploy instantly via web
- Limitation: iOS Safari has more restricted PWA support than Android Chrome

The project's core constraint at MVP stage is **speed to pilot with a real
business**, not feature parity with a full native experience.

---

## Decision

**PWA-first is the selected mobile delivery strategy for MVP.**

The POS client (`apps/pwa/`) will be built as a Progressive Web App using
React + Vite, targeting installation on Android Chrome as the primary MVP
platform. iOS is a supported secondary target within the constraints of Safari's
PWA implementation.

Hardware peripherals (receipt printer, barcode scanner, cash drawer) will be
integrated via Web Bluetooth and Web USB where the target device and browser
support it. For the pilot hardware matrix (Epson TM-T20III printer via
Bluetooth/USB, Zebra DS2208 scanner via USB HID), these APIs are sufficient.

**A native app build (React Native or alternative) is explicitly deferred
to post-MVP** and would require a separate ADR and engineering spike before
being prioritized.

---

## Consequences

**Positive:**
- Single shared React codebase across POS PWA and web apps — no duplicated
  domain logic across platforms.
- No app store approval cycle for MVP; cashier devices receive updates
  immediately on next launch.
- Offline capability is delivered through the same Dexie.js layer used for
  the web POS, not a separate native storage path.
- CI/CD pipeline is simpler — one web build pipeline covers PWA and web apps.

**Negative / Trade-offs:**
- iOS Safari imposes restrictions on Service Worker storage quotas and
  background sync that do not apply on Android Chrome. The pilot will target
  Android primarily.
- Web Bluetooth and Web USB are not available on all Android browsers — the
  pilot device must run Chrome 85+ or equivalent.
- Push notifications on iOS require iOS 16.4+ and PWA installed to home screen.

**Constraints introduced:**
- The offline local database technology selection (ADR-005) must be compatible
  with browser-based storage (IndexedDB) — native SQLite is not available in
  this architecture.
- Hardware QA (ADR-013 in the Decision Lock) must confirm Web Bluetooth/USB
  compatibility with the pilot printer and scanner models before hardware
  integration work begins.
- DEV-005 (mobile build pipeline) is deferred to post-MVP. The PWA is deployed
  as a web asset via Vercel (ADR-006).
