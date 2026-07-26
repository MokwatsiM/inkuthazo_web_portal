# Multi-Tenancy — Feasibility Analysis

**Status:** exploratory. No implementation planned yet.
**Assumption locked in:** one person belongs to exactly **one** club (no multi-club accounts).

## Where the app is today

The portal is **single-tenant by assumption**. There is no `org_id` / `club_id`
anywhere:

- **0** tenant-scoping references in `firestore.rules`.
- **~20** top-level collections (`members`, `contributions`, `payouts`,
  `credits`, `claims`, `donations`, `expenses`, `hostAssignments`,
  `configurations`, `audit_logs`, `notifications`, …), all global.
- **122** `collection(db, …)` + **77** `doc(db, …)` call sites, every one of
  which implicitly means "*the* club's data".
- Custom claims already exist (`syncMemberClaims` sets `role` + `status` on the
  auth token) — the identity plumbing is partly built.
- `members/{docId}` is keyed by the **auth uid** (signup writes
  `members/{request.auth.uid}`), and storage rules + claims depend on that.

Multi-tenancy = teaching all of the above that data belongs to a specific club.
It is a **re-architecture**, not a feature toggle.

## The three isolation models

| | A. Project-per-tenant | B. Shared DB + `org_id` | C. Subcollection-per-tenant |
|---|---|---|---|
| **Shape** | One Firebase project per club | One project; every doc has `org_id` | `clubs/{clubId}/members/...` |
| **Isolation** | Physical — impossible to leak | Logical — rules + claim enforce it | Structural — path is the boundary |
| **Code change** | ~None (add a config resolver) | High — audit all ~200 query sites | Highest — every path string changes |
| **Rules change** | None | Every rule gains an `org_id` check | Rewrap under `match /clubs/{id}` |
| **New-club cost** | Provision a project (heavy) | Self-serve signup (cheap) | Self-serve signup (cheap) |
| **Scales to** | ~5–20 clubs comfortably | Hundreds+ | Hundreds+ |
| **Leak risk** | ~zero | One missed filter = cross-tenant leak | Lower than B (path-scoped) |

## Recommendation for this context

Because the goal is *feasibility* and the app has **zero** tenant scaffolding:

- **If it ever becomes a few clubs you onboard yourself → Option A
  (project-per-tenant).** Your existing, tested code — rules, functions, the
  credit/arrears/notification work — runs **unchanged**. You build only a
  tenant registry + a "which Firebase config do I load" resolver at boot + a
  provisioning script. This is the cheapest safe path *precisely because* the
  code is tenant-unaware today.

- **If it becomes a self-serve SaaS with many clubs → Option B (`org_id` +
  claim).** This is the "real SaaS" build. The `one person / one club` decision
  makes it tractable: `org_id` becomes a custom claim alongside `role`/`status`
  (reusing `syncMemberClaims`), so the token carries the tenant and rules read
  `request.auth.token.org_id` with **zero extra reads** — the same pattern the
  custom-claims migration already established.

**Avoid the trap:** do **not** add `org_id` to a handful of collections ad hoc.
Partial tenancy *looks* isolated while leaking through every collection you
missed. It is worse than staying single-tenant.

## If Option B is ever chosen — shape of the work (not a plan)

This is the outline so the size is clear, not an execution spec.

1. **Identity:** a `clubs/{clubId}` doc per tenant; `org_id` added to every
   member doc; `syncMemberClaims` extended to mirror `org_id` into the token;
   backfill script for existing users (mirrors `scripts/backfillClaims.cjs`).
2. **Signup / onboarding:** "create a club" flow (first user becomes admin,
   gets a fresh `org_id`); invite flow already carries the inviter's club, so
   invited members inherit `org_id`.
3. **Writes:** every create stamps `org_id` from the caller's claim (enforced in
   rules: `request.resource.data.org_id == request.auth.token.org_id`).
4. **Reads:** every query gains `where('org_id','==', myOrg)` — a **typed
   collection helper** (extend `src/utils/firestoreConverter.ts`) so the filter
   is applied in one place, not sprinkled across 122 sites.
5. **Rules:** every `match` block gains an `org_id` ownership check; new
   composite indexes (`org_id` + existing sort fields) for each collection.
6. **Config:** `configurations`, roles, and the Cloud Functions (arrears,
   credit, hosting-reminder, statement) all become per-club — e.g. the sender
   name/email in `functions/src/notifications/brevo.ts` is currently the one
   hard-coded club; it would need to come from the club doc.
7. **Migration:** assign every existing document an `org_id` (all one club to
   start) in a single backfill, behind a maintenance window.
8. **Mandatory security review** of the final rules — cross-tenant isolation is
   the entire value proposition; a rules gap is a data breach.

**Rough size:** Option B is a multi-month effort dominated by the query/rules
audit and the migration, gated on a clean type/lint baseline (the ~90
pre-existing type errors and lint debt should be cleared first, so the audit
isn't fighting noise). Option A is weeks.

## Prerequisite either way

Two current items make *any* tenancy work riskier and should land first:
- The `tsc` type-check currently validates nothing in CI (solution-style root
  tsconfig) and there are ~90 real type errors — fix before an audit of 200
  call sites.
- No integration tests around cross-collection reads; the rules test suite
  (`npm run test:rules`) is the main safety net and would need heavy expansion
  for tenant isolation cases.
