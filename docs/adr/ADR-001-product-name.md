# ADR-001 — Production Product Name

| Field       | Value                                      |
|-------------|---------------------------------------------|
| **ID**      | ADR-001                                     |
| **Date**    | 2026-09-19                                  |
| **Status**  | Accepted                                    |
| **Deciders**| Product Owner                               |
| **DL Ref**  | DEC-001                                     |

---

## Context

During the planning and specification phase, the working name for this product was
**"MyFriend POS"** — a name chosen to align with the parent services brand,
*Fred my Friend*, which provides creative, data, and technology services to clients
worldwide.

Before repository scaffolding, package identifiers, app store listings, domains,
and external-facing documentation could be created, the production name needed to
be formally confirmed so it could be used consistently across all artifacts from
day one — avoiding costly renames mid-development.

---

## Decision

**"MyFriend POS"** is confirmed as the production name for this product.

This name will be used consistently in:
- Git repository name and GitHub organization
- npm package scopes (e.g. `@myfriend-pos/*`)
- Application bundle/package identifiers (e.g. `com.myfriendpos.app`)
- Domain names (e.g. `app.myfriendpos.com`, `admin.myfriendpos.com`)
- App store listings (Google Play, Apple App Store — deferred to post-PWA-MVP)
- All user-facing documentation, onboarding flows, and marketing materials
- The document header of all future specification updates

---

## Consequences

**Positive:**
- All artifacts — code, configs, domains, docs — share a single coherent identity
  from the start.
- No rename operations needed mid-development.
- Brand alignment with the *Fred my Friend* parent business is established.

**Neutral:**
- Domain registration and app store developer accounts must be set up under this
  name before public launch.
- Any future brand change would require a coordinated rename across all listed
  artifacts.

**Constraints:**
- The name must be checked for trademark conflicts in target markets (DRC, South
  Africa, and any planned expansion jurisdictions) before public launch.
