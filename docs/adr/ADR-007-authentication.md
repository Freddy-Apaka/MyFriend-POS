# ADR-007 — Authentication: Supabase Auth + MFA for Platform Admin

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-007                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Product Owner + Engineering                 |
| **DL Ref**  | DEC-006 / DL-108                            |

---

## Context

MyFriend POS has two distinct authentication contexts that must be kept
clearly separated:

**Organization context** — Cashiers, managers, inventory staff, finance roles,
and org owners accessing the POS PWA and Business Web. These users belong to
one or more organizations and always operate within an organization/store scope.

**Platform Admin context** — The small group of MyFriend POS platform operators
who manage organization lifecycle, subscriptions, billing, and platform-level
operations via the Platform Admin Web. This is a separately secured surface
that must not be reachable under normal organization credentials.

The authentication system must support:
- Email/password sign-in as the baseline credential method
- JWT-based sessions with configurable expiry
- Session revocation (device/session management for offline-capable clients)
- Mandatory MFA for Platform Admin context
- Optional MFA for organization users (enforced by subscription tier)
- Multi-organization user identity (one user can belong to multiple organizations)
- Language/locale context carried on the authenticated session
- Credential change events triggering session invalidation

Technologies evaluated:

| Option | Managed | JWT support | MFA | Supabase integration | Complexity |
|---|---|---|---|---|---|
| **Supabase Auth** | ✓ | ✓ | ✓ (TOTP) | Native | Low |
| Auth0 | ✓ | ✓ | ✓ | Manual | Medium + cost |
| Custom JWT (passport.js) | ✗ | Manual | Manual | Manual | High |
| Clerk | ✓ | ✓ | ✓ | Possible | Medium + cost |

Given that Supabase is already selected as the database and storage provider
(ADR-004), Supabase Auth is the natural choice — it is natively integrated with
the same project, shares the same service role key infrastructure, and is already
familiar from prior projects.

---

## Decision

**Supabase Auth is used as the managed identity provider for all authentication.**

### How it works

1. Users authenticate via Supabase Auth (email/password for MVP; OAuth providers
   can be added post-MVP).
2. Supabase issues a JWT access token and a refresh token.
3. The backend API (`apps/api/`) validates the JWT on every protected request
   using the Supabase JWT secret. User identity (`sub` / `user_id`) is
   extracted and used to resolve organization/store scope in the request context
   middleware (`core/context`).
4. Organization membership, role assignments, and store access are stored in
   the application database (`org_memberships`, `store_assignments` tables) —
   not in the JWT claims. The JWT proves identity; the database resolves scope.

### Session and device management

- JWT access tokens expire after **1 hour**.
- Refresh tokens are long-lived and stored securely in the client.
- The device/session registry (`IAM-004` in the Engineering Backlog) tracks
  each registered device with a `device_id`. This `device_id` is sent on sync
  push requests to identify the source device of offline operations.
- On credential change (password reset, email change) or explicit revocation,
  Supabase Auth invalidates the refresh token. The backend invalidation hook
  (`IAM-005`) ensures the device/session registry is updated.

### Multi-Factor Authentication

**Platform Admin context — MFA is mandatory.**
- Platform Admin users must complete TOTP (Time-based One-Time Password)
  enrollment before accessing any Platform Admin route.
- The Platform Admin Web (`apps/web-platform/`) blocks navigation to any
  administrative screen until MFA state is confirmed for the current session.
- The backend `PLAT-001` guard verifies Platform Admin context and MFA state
  on every Platform Admin API request.

**Organization context — MFA is configurable.**
- Organizations on supported subscription tiers may enforce MFA for their users.
- This is a platform entitlement, not a hardcoded behavior.

### Separation of Platform Admin from Organization users

Platform Admin users are identified by a dedicated claim or role in the
`platform_admins` table. The application middleware rejects any request to
Platform Admin routes where the authenticated user is not in this table —
regardless of what organization roles they hold. An organization owner cannot
access the Platform Admin surface.

---

## Consequences

**Positive:**
- Supabase Auth handles token issuance, rotation, refresh, and revocation —
  no custom JWT implementation to maintain.
- MFA (TOTP) is built into Supabase Auth and requires no third-party
  authenticator service.
- Auth and database share the same Supabase project — one connection string,
  one service role key, one console.
- JWTs are validated without a network call (symmetric signature verification),
  keeping POS request latency unaffected by auth overhead.

**Negative / Trade-offs:**
- Organization-level scope (which org/store a user is accessing) is resolved
  from the application database, not from the JWT. This means every protected
  request makes at least one database lookup for scope resolution. Mitigated
  by caching the resolved context for the request lifetime and using connection
  pooling.
- Supabase Auth does not natively support hardware security keys (WebAuthn) at
  the plan level used for MVP. If Platform Admin requires FIDO2/WebAuthn in
  future, this would require a custom implementation or a plan upgrade.

**Constraints:**
- `IAM-001` and `IAM-006` in the Engineering Backlog are the implementation
  items for this decision.
- The Supabase JWT secret must be treated as a production secret and rotated
  only via a coordinated release that includes updated Railway environment
  variables.
- Platform Admin MFA enrollment must be completed before any real organization
  data is accessible in production. There is no bypass path.
- OAuth social login (Google, Microsoft) is explicitly deferred to post-MVP
  and will require a separate ADR when prioritized.
