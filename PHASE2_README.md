# Phase 2 — Shared Configuration Packages

This delivers `packages/config`, `packages/contracts`, and a minimal
`packages/ui` scaffold.

---

## What Was Built

### `packages/config`
The single source of truth for tooling across every app and package.
Nothing configures ESLint, TypeScript, Vite, Vitest, or Prettier on its own —
everything extends from here.

| File | What it does |
|---|---|
| `eslint.config.js` | Flat-config ESLint rules: TypeScript, React, hooks, accessibility, import ordering |
| `typescript.json` | Base strict TypeScript config (Node/backend targets) |
| `typescript-react.json` | Extends the base config, adds JSX + DOM types for frontend apps |
| `vite.config.base.ts` | Base Vite config (React plugin, path aliases, build target) |
| `vitest.config.base.ts` | Base Vitest config (coverage thresholds, globals) |
| `prettier.config.js` | Formatting rules (no semicolons, single quotes, 90 char width) |

### `packages/contracts`
The single source of truth for what the backend accepts and returns.
Built with **Zod** so every schema doubles as runtime validation AND a
TypeScript type — one definition, no drift between them.

| File | What it does |
|---|---|
| `src/enums/index.ts` | Shared enums: `UserRole`, `OrderStatus`, `PaymentMethod`, `Currency`, `SyncState`, etc. |
| `src/errors/index.ts` | `AppError` base class + subclasses (`ValidationError`, `NotFoundError`, `ForbiddenError`, etc.) + `ErrorCode` enum |
| `src/api/index.ts` | Zod schemas for API requests/responses — includes two **worked examples** (Order, Payment) to establish the pattern |
| `src/__tests__/contracts.test.ts` | Sanity tests proving the schemas and errors actually work |

**This package is intentionally not fully populated yet.** It has the
pattern established (two worked examples) but the real request/response
schemas for every endpoint get filled in module-by-module during M2–M7,
built directly from `MyFriend_POS_API_Specification_v0_1.docx`. Adding a
schema here that isn't backed by the API Spec would create drift between
the documentation and the code — don't do it.

### `packages/ui`
Minimal scaffold only. No real components yet — those start in M2 once
screens are being built against the UI/UX Screen Specification.

---

## Why This Order Matters

`packages/config` has zero dependencies on anything else in the monorepo —
it must exist before any other package or app can lint, type-check, or
build. `packages/contracts` depends on `packages/config` (for its own
tsconfig/eslint) but nothing else does yet. Both must exist before Phase 6
(app scaffolds), because every app's `package.json` will declare
`@myfriend-pos/config` and `@myfriend-pos/contracts` as workspace
dependencies.

```
packages/config        ← no internal dependencies
      ↑
packages/contracts      ← depends on config
packages/ui              ← depends on config
      ↑
apps/*                    ← depend on config + contracts + ui (Phase 6)
```

---

## How to Apply This

1. Unzip `MyFriend_POS_Phase2_Shared_Packages.zip`
2. Copy the contents into your repo's `packages/` folder, replacing the
   `.gitkeep` placeholders from Phase 1
3. From the repo root, run `pnpm install` — this links the workspace
   packages together
4. Run `pnpm --filter @myfriend-pos/contracts test` to confirm the
   sanity tests pass
5. Commit on a new branch off `dev`:
   ```bash
   git checkout dev
   git checkout -b feature/phase-2-shared-packages
   git add .
   git commit -m "Phase 2: shared config and contracts packages"
   git push -u origin feature/phase-2-shared-packages
   ```
6. Open a PR into `dev`

---

## What You Can't Fully Verify Yet

`pnpm install` and the Vitest tests will work standing alone, but the full
monorepo build (`pnpm build`, `pnpm lint` across everything) won't succeed
end-to-end until Phase 6 adds the actual apps that consume these packages.
That's expected — Phase 2 is a piece of the foundation, not the whole
foundation. Phase 7 is where everything gets verified together.
