# Phase 3 — CI/CD Setup Guide

The three workflow files handle automation. Everything in this document is
manual configuration inside GitHub's web UI — these steps cannot be committed
as files, so walk through them once, carefully.

---

## Part 1 — Add Repository Secrets

Go to: **Repo → Settings → Secrets and variables → Actions → New repository secret**

Add each of these. You'll gather the actual values as you provision Supabase,
Railway, and Vercel in Phase 4 — for now, create the secret names so the
workflows don't fail with "secret not found" the moment they run.

| Secret Name | Where to get it | Used by |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens | Both deploy workflows |
| `SUPABASE_STAGING_PROJECT_ID` | Supabase staging project → Settings → General → Reference ID | deploy-staging.yml |
| `SUPABASE_STAGING_DB_PASSWORD` | Set when creating the staging project | deploy-staging.yml |
| `SUPABASE_PROD_PROJECT_ID` | Supabase production project → Settings → General → Reference ID | deploy-production.yml |
| `SUPABASE_PROD_DB_PASSWORD` | Set when creating the production project | deploy-production.yml |
| `RAILWAY_API_TOKEN` | Railway Dashboard → Account Settings → Tokens | Both deploy workflows |
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens | Both deploy workflows |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General | Both deploy workflows |

**Do not** add these as plain repository variables — they must be **secrets**,
not variables, so their values never appear in logs.

---

## Part 2 — Protect the `main` Branch

Go to: **Repo → Settings → Branches → Add branch protection rule**

- Branch name pattern: `main`
- ✅ Require a pull request before merging
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Search for and select: `Lint, Type-check, Test, Build` (this appears after the CI workflow runs once)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings (applies rules to admins too)
- ❌ Do NOT allow force pushes
- ❌ Do NOT allow deletions

---

## Part 3 — Protect the `dev` Branch

Same path: **Repo → Settings → Branches → Add branch protection rule**

- Branch name pattern: `dev`
- ✅ Require a pull request before merging
  - ✅ Require approvals: **1**
- ✅ Require status checks to pass before merging
  - Select: `Lint, Type-check, Test, Build`
- ❌ Do NOT allow force pushes
- ❌ Do NOT allow deletions

---

## Part 4 — Create the `production` Environment (Manual Approval Gate)

This is what makes `deploy-production.yml` pause and wait for a human before
touching production.

Go to: **Repo → Settings → Environments → New environment**

- Name: `production` (must match exactly — this is referenced in
  `deploy-production.yml` under `environment: name: production`)
- ✅ Required reviewers → add yourself (and anyone else who should approve
  production deploys)
- ✅ Wait timer: 0 minutes (or add a delay if you want a cooling-off period)
- Deployment branches: restrict to `main` only

Once this exists, every push to `main` will trigger the workflow, run CI,
then **pause** at the `approval-gate` job until a required reviewer approves
it from the Actions tab.

---

## Part 5 — Verify the Setup

You won't be able to fully test the deploy workflows until Phase 4
(infrastructure provisioning) gives the secrets real values. But you can
verify the CI workflow right now:

1. Push this Phase 3 branch
2. Open a PR into `dev`
3. Watch the **Actions** tab — `CI` should trigger automatically
4. Confirm the `Lint, Type-check, Test, Build` job appears and runs
   (it may fail right now since Phase 6 app scaffolds don't exist yet —
   that's expected until Phase 6 is merged)
5. Confirm the required status check now shows up as an option in
   Part 2 and Part 3 above, and select it if you hadn't yet

---

## What Happens at Each Stage of the Pipeline

```
Developer opens PR → dev
        ↓
  ci.yml runs (lint, type-check, test, build, migration dry-run)
        ↓
  PR approved + CI green → merge to dev
        ↓
  deploy-staging.yml triggers automatically
        ↓
  Supabase staging migrated → Railway staging deployed → Vercel staging deployed
        ↓
  (later, when ready for a release)
        ↓
  PR opened: dev → main
        ↓
  ci.yml runs again
        ↓
  PR approved + CI green → merge to main
        ↓
  deploy-production.yml triggers, runs CI again, then PAUSES
        ↓
  Reviewer manually approves in the Actions tab
        ↓
  Supabase production migrated → Railway production deployed → Vercel production deployed
```

---

## Known Limitation Right Now

The `migration-dry-run` job in `ci.yml` and the `migrate-database` jobs in
both deploy workflows will effectively no-op until `supabase/migrations/`
has real `.sql` files in it — which starts in M2. This is expected and not
a bug. The pipeline is built to handle an empty migrations folder gracefully
so it doesn't block Phase 3–6 work.
