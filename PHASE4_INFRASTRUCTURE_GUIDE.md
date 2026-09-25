# Phase 4 — Infrastructure Provisioning

This phase is different from Phases 1–3. There is no code to commit that
creates cloud accounts for you — Supabase, Railway, and Vercel projects are
created by hand, once, in each provider's dashboard. What I've prepared
below is the exact sequence, exact settings, and exact naming so nothing
is ambiguous when you sit down to do it.

**Time estimate: 3–4 hours.** Budget it as one uninterrupted session —
switching between three dashboards while half-configured is where mistakes
happen.

---

## Before You Start

You'll need to create (if you don't already have them):
- A Supabase account — https://supabase.com
- A Railway account — https://railway.app
- A Vercel account — https://vercel.com

All three offer free tiers sufficient for MVP/pilot stage. Sign up with the
same GitHub account you used to create the `MyFriend-POS` repository —
this makes the GitHub integration steps below trivial.

---

## Part 1 — Supabase (Database, Auth, Storage)

### 1.1 Create the staging project

1. Supabase Dashboard → **New Project**
2. Organization: create one if you don't have one, e.g. `myfriend-pos`
3. Project name: `myfriend-pos-staging`
4. Database password: generate a strong one — **save it in a password
   manager immediately**, you'll need it for `SUPABASE_STAGING_DB_PASSWORD`
5. Region: choose the closest available region to DRC. As of now Supabase
   doesn't have an African region — pick **Europe (Frankfurt or London)**
   as the lowest-latency option for DRC users
6. Pricing plan: **Free** is fine for staging
7. Click **Create new project** and wait ~2 minutes for provisioning

### 1.2 Create the production project

Repeat the exact same steps with:
- Project name: `myfriend-pos-prod`
- **A different, separately generated database password** — never reuse the
  staging password
- Same region as staging (consistency matters for latency comparisons later)
- Pricing plan: **Pro** — required for Point-in-Time Recovery (PITR), which
  ADR-004 locks as a requirement for production

### 1.3 Enable PITR on production only

1. Open `myfriend-pos-prod` → **Settings → Add-ons → Point in Time Recovery**
2. Enable it. Set retention to the maximum available on your plan (aim for
   the 30-day rolling backup window specified in ADR-004 / ADR-006)

Do **not** enable this on staging — it's an unnecessary cost for a project
that only holds synthetic test data.

### 1.4 Collect your credentials

For **both** projects, go to **Settings → API** and record:
- `Project URL` → this is `SUPABASE_URL`
- `anon public` key → this is `SUPABASE_ANON_KEY`
- `service_role` key (click "reveal") → this is `SUPABASE_SERVICE_ROLE_KEY`
  — **treat this like a root password, never expose it client-side**

Then go to **Settings → API → JWT Settings**:
- `JWT Secret` → this is `SUPABASE_JWT_SECRET`, used by the backend to
  verify tokens (per ADR-007)

Then go to **Settings → Database**:
- `Reference ID` → this is your `SUPABASE_STAGING_PROJECT_ID` or
  `SUPABASE_PROD_PROJECT_ID`
- Connection string → this is your `DATABASE_URL` (use the "URI" format,
  select "Session pooler" mode for the migration/CLI connection)

### 1.5 Generate a Supabase access token (for CI/CD)

This is different from the project-level keys above — it's an account-level
token that lets the Supabase CLI act on your behalf from GitHub Actions.

1. Supabase Dashboard → **Account → Access Tokens → Generate new token**
2. Name it `github-actions-ci`
3. Copy it immediately (shown once) → this is `SUPABASE_ACCESS_TOKEN`

### 1.6 Add all Supabase values to GitHub Secrets

Go back to your repo → **Settings → Secrets and variables → Actions** and
fill in the values you just collected for the six Supabase-related secrets
listed in `GITHUB_SETUP_GUIDE.md` from Phase 3.

### 1.7 RLS reference pattern

I've included `config-templates/rls_pattern_reference.sql` in this package.
It is **not a migration file** — it's a documented pattern you'll copy from
when you write real table migrations in M2. Read it now so the pattern is
familiar before you're deep in Epic 04 (Identity) work.

---

## Part 2 — Railway (API + Worker)

### 2.1 Create the project

1. Railway Dashboard → **New Project → Empty Project**
2. Name it `myfriend-pos`
3. Region: pick the closest to your Supabase region (Europe) to minimize
   cross-region latency between API and database

### 2.2 Create the `api` service

1. Inside the project → **New → GitHub Repo** → select `MyFriend-POS`
2. Name the service `api`
3. Go to **Settings → Source** and set:
   - Root directory: `/` (Railway needs repo root to run the pnpm monorepo
     install; the build command scopes to `apps/api`)
4. Copy `config-templates/railway.api.json` from this package into
   `apps/api/railway.json` in your repo (do this now, before deploying,
   so Railway picks up the build/start commands automatically)
5. Go to **Settings → Networking** → **Generate Domain** — this gives you
   a public URL to test `/health` against once the API is built (Phase 6)

### 2.3 Create the `worker` service

1. Inside the same project → **New → GitHub Repo** → select `MyFriend-POS`
   again (yes, twice — same repo, second service)
2. Name the service `worker`
3. Same root directory setting as above
4. Copy `config-templates/railway.worker.json` into `apps/worker/railway.json`
5. **Do not** generate a public domain for the worker — it has no HTTP
   surface, it only processes background jobs

### 2.4 Create environments

1. Project → **Settings → Environments**
2. You'll have a `production` environment by default — rename it or confirm
   it's named `production`
3. Create a second environment named `staging`
4. For **each service** (`api` and `worker`), in **each environment**
   (`staging` and `production`), set these variables under the service's
   **Variables** tab:

   | Variable | Staging value | Production value |
   |---|---|---|
   | `SUPABASE_URL` | staging project URL | prod project URL |
   | `SUPABASE_ANON_KEY` | staging anon key | prod anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | staging service role key | prod service role key |
   | `SUPABASE_JWT_SECRET` | staging JWT secret | prod JWT secret |
   | `DATABASE_URL` | staging connection string | prod connection string |
   | `NODE_ENV` | `staging` | `production` |
   | `API_LOG_LEVEL` | `debug` | `info` |

   **Never let staging and production environments share a value.** This is
   the single most important rule in this entire phase — a shared credential
   between environments defeats the entire point of having two of them.

### 2.5 Generate a Railway API token (for CI/CD)

1. Railway Dashboard → **Account Settings → Tokens → Create Token**
2. Name it `github-actions-ci`
3. Copy it → this is `RAILWAY_API_TOKEN`
4. Add it to GitHub Secrets (same location as before)

### 2.6 Disable auto-deploy from Railway directly

Since deployment is handled by your GitHub Actions workflows (Phase 3), turn
off Railway's own auto-deploy-on-push to avoid double deployments:

1. Each service → **Settings → Source → Deploy Triggers**
2. Turn off "Deploy on push" — deployments will only happen via the
   `railway up` command inside your GitHub Actions workflow

---

## Part 3 — Vercel (Web Frontends)

You're creating **four separate Vercel projects**, one per web app. This is
intentional — each has its own domain, its own environment variables, and
independent deploy history.

### 3.1 Create each project

Repeat this four times, once per app:

| App | Vercel project name | Root Directory |
|---|---|---|
| POS PWA | `myfriend-pos-pwa` | `apps/pwa` |
| Business Web | `myfriend-pos-web-business` | `apps/web-business` |
| Platform Admin Web | `myfriend-pos-web-platform` | `apps/web-platform` |
| Customer Web | `myfriend-pos-web-customer` | `apps/web-customer` |

For each:

1. Vercel Dashboard → **Add New → Project**
2. Import the `MyFriend-POS` GitHub repository
3. Set **Root Directory** to the app's path from the table above (click
   "Edit" next to Root Directory during import)
4. Framework Preset: **Vite** (Vercel should auto-detect this)
5. Build settings: leave defaults for now — Vercel's Vite preset handles
   monorepo builds correctly when Root Directory is set properly
6. Before clicking Deploy, go to **Environment Variables** and add:
   - `VITE_API_URL` → your Railway `api` service's public URL (staging
     domain from step 2.2, or a placeholder like
     `https://api-staging.railway.app` if not generated yet)
   - `VITE_SUPABASE_URL` → staging Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → staging Supabase anon key
7. Click **Deploy**. It will likely **fail right now** — that's expected,
   because `apps/pwa/` etc. don't have real app code yet (that's Phase 6).
   A failed first deploy here is fine; you're just registering the project.

### 3.2 Configure branch-based environments

For each of the four projects:

1. **Settings → Git**
2. Production Branch: `main`
3. Under **Ignored Build Step**, leave default (build every push) for now
4. Preview deployments are enabled by default — every PR branch will get
   its own preview URL automatically, which is useful for design review
   during later phases

### 3.3 Add production environment variables

For each project, go to **Settings → Environment Variables** and add a
**second set** of the three variables, scoped to **Production** only:

- `VITE_API_URL` → Railway `api` service's **production** public URL
- `VITE_SUPABASE_URL` → **production** Supabase project URL
- `VITE_SUPABASE_ANON_KEY` → **production** Supabase anon key

Make sure the first set (from step 3.1) is scoped to **Preview** and
**Development** only, not Production — Vercel lets you scope each variable
per environment. This keeps staging and production cleanly separated, same
principle as the Railway setup.

### 3.4 Generate a Vercel token (for CI/CD)

1. Vercel Dashboard → **Settings → Tokens → Create**
2. Name it `github-actions-ci`
3. Scope: full account access (or scope to the team if you're on a Team plan)
4. Copy it → this is `VERCEL_TOKEN`

### 3.5 Find your Vercel Org ID

1. Vercel Dashboard → **Settings → General**
2. Copy the **Team ID** (or **User ID** if on a personal account) → this is
   `VERCEL_ORG_ID`

### 3.6 Add both to GitHub Secrets

Same location as before — add `VERCEL_TOKEN` and `VERCEL_ORG_ID`.

### 3.7 Disable Vercel's own auto-deploy (optional but recommended)

Since your GitHub Actions workflow already handles deployment explicitly,
you can leave Vercel's native Git integration on (it's harmless — it'll just
also deploy on push, essentially duplicating your Actions-driven deploy).
For MVP simplicity, it's fine to leave both active; if you want single-path
deploys only through GitHub Actions, disable the Git integration under
**Settings → Git → Disconnect**, and rely solely on the `vercel deploy`
commands inside `deploy-staging.yml` / `deploy-production.yml`.

---

## Part 4 — Local Environment File

1. Copy `.env.example` (included in this package) to your repo root
2. Copy it again as `.env.local` (already gitignored)
3. Fill `.env.local` with your **staging** credentials — this is what you'll
   use for day-to-day local development
4. Never put production credentials in `.env.local` on your development
   machine

---

## Verification Checklist — Gate Check for Phase 4

- [ ] `myfriend-pos-staging` Supabase project exists, credentials collected
- [ ] `myfriend-pos-prod` Supabase project exists, PITR enabled, credentials collected
- [ ] Supabase access token generated and added to GitHub Secrets
- [ ] Railway project `myfriend-pos` exists with `api` and `worker` services
- [ ] Railway `staging` and `production` environments both configured with
      correct, non-shared variables
- [ ] Railway API token generated and added to GitHub Secrets
- [ ] Four Vercel projects exist, each with correct Root Directory set
- [ ] Vercel environment variables scoped correctly (Preview/Dev vs Production)
- [ ] Vercel token and Org ID added to GitHub Secrets
- [ ] `.env.local` exists locally with staging credentials, is gitignored
- [ ] All 8 GitHub Secrets from Phase 3's guide are now filled with real values

Once every box is checked, all three providers exist and are wired to your
GitHub Actions workflows from Phase 3 — even though nothing meaningful can
deploy yet because there's no app code. That's exactly right for this stage.

---

## What's Still Expected to Fail

Vercel's first deploy attempt for each app **will fail** — there's no
`package.json` or source code in `apps/pwa/` etc. yet. Railway's first
deploy will also fail for the same reason. **Do not troubleshoot these
failures now.** They resolve themselves the moment Phase 6 lands real
app scaffolds. Trying to "fix" a Vercel/Railway deploy before Phase 6
exists is chasing a problem that isn't real yet.

---

## Next: Phase 5

Once this checklist is complete, we move to Phase 5 — the local development
documentation (`docs/LOCAL_SETUP.md`) that ties everything from Phases 1–4
into a guide any future developer (including you, in six months) can follow
to get the whole stack running on their machine.
