# Inkuthazo Web Portal — Enhancement & Improvement Plan

**Date:** 8 July 2026
**Scope:** Full-project review of the React 19 + Vite + Firebase social club portal (frontend `src/`, Cloud Functions `functions/`, Firestore rules, build/tooling).
**Codebase snapshot:** ~30 pages, ~30 services/hooks, RBAC permission system, QR attendance, credits, donations, payouts, claims, host assignments, analytics/reporting. Sentry error tracking was removed on this date.

This document is organised by priority. Each item states the problem, why it matters, and a recommended fix.

---

## 1. Critical — Security (act before the next release)

### 1.1 `.env` is tracked in git
- `.env` has been committed since early in the project. The Firebase web config values it holds are designed to be public (protection comes from rules and App Check, not key secrecy), but a tracked `.env` is a standing hazard: any secret added to it later (as happened briefly with a Sentry auth token) would be published on the next commit.
- **Fix:** `git rm --cached .env`, add `.env` to `.gitignore`, and keep a committed `.env.example` with empty values. Rotate any secret that ever passed through the file.

### 1.2 No Firebase Storage rules in the repo/deploy pipeline
- Storage is actively used (avatars, claim documents, contribution proof-of-payment, dependant documents — see [avatarService.ts](../src/services/avatarService.ts), [claimService.ts](../src/services/claimService.ts), [contributionService/storage.ts](../src/services/contributionService/storage.ts)), but `firebase.json` deploys only Firestore rules — there is no `storage.rules` file. Rules are either console-managed (undocumented, unreviewable) or permissive.
- **Fix:** Add a `storage.rules` file to the repo, register it in `firebase.json`, and lock paths by owner/permission (e.g. only the member or users with `claims:view` can read claim documents). Proof-of-payment and ID documents are sensitive personal data.

### 1.3 `firebase-admin` is a frontend dependency
- `firebase-admin@^10` is listed in the root [package.json](../package.json) dependencies. The Admin SDK bypasses security rules and must never ship near client code; it also drags a large, old dependency tree into installs. It appears to be used only by `scripts/updateUserEmail.js`.
- **Fix:** Remove it from the root package.json. If admin scripts are kept, give `scripts/` its own `package.json` (and note that `serviceAccountKey.json` in the project root — correctly gitignored and never committed — should ideally live outside the repo folder or in a secrets manager).

### 1.4 Firestore rules gaps
Current [firestore.rules](../firestore.rules) are generally well structured (permission-catalogue model), but several holes remain:

| Collection | Issue | Recommendation |
|---|---|---|
| `contributions` | Members can create their own contribution with **no field validation** — a member could write any `amount`, `status: approved`, or backdate it. | Mirror the `claims` pattern: require `status == 'pending'`, validate required keys and types, disallow self-approval fields. |
| `contributions`, `payouts` | Readable by *any* signed-in user, including `status: pending` (unapproved) accounts. | If transparency is intentional, at least gate on approved membership (`status in ['approved','active']`). |
| `audit_logs` | Any signed-in user may create logs with arbitrary content (spoofable), and logs are deletable. | Validate `user_id == request.auth.uid` and required keys on create; consider writing logs from a Cloud Function instead and setting `allow delete: if false` with TTL-based cleanup. |
| `members` (signup) | `isValidNewMember` checks types but not that `email == request.auth.token.email`. | Bind the document email to the auth token. |
| Rules performance | `hasPermission()` performs up to 3 `get()`/`exists()` calls per check → extra billed reads and latency on every operation. | Move role (and optionally a permissions hash) into **custom claims** set by a Cloud Function when roles change; rules then read `request.auth.token.role` with zero document reads. This also removes the client-side permission-cache/encryption complexity. |

### 1.5 Enable Firebase App Check
- Nothing prevents scripted abuse of the public Firebase config against Firestore/Storage/Functions. App Check (reCAPTCHA v3 / Enterprise provider) is a low-effort, high-value hardening step for all three services.

### 1.6 `xlsx` (SheetJS) 0.18.5 has known unpatched CVEs on npm
- The npm-registry build of `xlsx@0.18.5` has publicly known prototype-pollution and ReDoS vulnerabilities; fixed builds are only distributed from the SheetJS CDN.
- **Fix:** Point the dependency at the official CDN tarball (`https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`) or migrate to `exceljs`. Run `npm audit` in CI (see §2.2).

---

## 2. High — Reliability & correctness

### 2.1 Zero automated tests
- There is no test framework, no test script, and no test files anywhere in `src/`. For an app that moves member money (contributions, payouts, credits with payment schedules), this is the single biggest reliability risk.
- **Fix (incremental, highest-value-first):**
  1. Add **Vitest + React Testing Library** (natural fit for Vite).
  2. Start with pure logic: `src/utils/statistics.ts`, `contributionValidation.ts`, `dateUtils.ts`, credit balance/schedule maths in `creditService.ts`, and `permissionService.ts`.
  3. Add **Firestore rules tests** with `@firebase/rules-unit-testing` — the rules encode the real security model and change often (see recent commits).
  4. Later: component tests for critical flows (login, contribution submit, credit review).

### 2.2 No CI/CD pipeline
- No `.github/workflows/`. Lint, type-check, build, and rules deploys are all manual.
- **Fix:** Add a GitHub Actions workflow running `npm ci`, `tsc --noEmit`, `npm run lint`, `npm run build`, `npm audit --audit-level=high`, and (once added) `vitest run` on PRs to `dev`. Add a deploy workflow (Firebase Hosting + rules + functions) triggered from `main`/`dev`.

### 2.3 No error monitoring (post-Sentry removal)
- With Sentry removed, production errors are only visible if a user reports them; `logger` and `ErrorBoundary` log locally but nothing is collected.
- **Options when ready:** re-introduce a tracker with a simpler setup (Sentry DSN-only without the build plugin, Bugsnag, or GlitchTip self-hosted), or at minimum have `ErrorBoundary`/`logger.error` write to a Firestore `client_errors` collection (rate-limited) so admins can see crash reports in-app.

### 2.4 Unbounded Firestore queries
- `getDocs` is used ~40+ times across hooks/services with only 8 `limit()` calls in total, and only one `onSnapshot` listener. Most list pages fetch **entire collections** (members, contributions, audit logs, donations) on every mount, with client-side pagination via the `Pagination` component.
- **Impact:** read costs and load time grow linearly with club history; analytics pages already aggregate whole collections client-side.
- **Fix:**
  - Add `limit()` + cursor (`startAfter`) pagination to the heavy lists (audit logs, contributions, donations first).
  - Introduce **TanStack Query** as the data layer (see §4.1) so results are cached across page navigations instead of refetched.
  - For dashboard/analytics aggregates, use Firestore **aggregation queries** (`getCountFromServer`, `sum`, `average`) or maintain counters in a `stats` document updated by Cloud Functions, instead of downloading every contribution to compute totals.

### 2.5 `signUp` failure path can delete the wrong session
- In [useAuth.tsx](../src/hooks/useAuth.tsx), any error during signup triggers `auth.currentUser.delete()`. If the failure happened *before* user creation (or after a different session state change), this can throw a secondary error or require recent re-auth. Wrap it in its own try/catch and only delete the user created in this call (`result.user`).

### 2.6 Error-handling consistency
- 16 raw `console.*` calls remain despite the `logger` utility; several catch blocks swallow errors and only toast. Standardise on `logger` so a future error-collection backend (§2.3) sees everything.

### 2.7 Cloud Functions housekeeping
- `functions/` has both a legacy `index.js` at its root and the real TypeScript source in `functions/src/index.ts` (compiled to `lib/`, which is the `main`). Delete the stale root `index.js`, and stop tracking `functions/lib/` build output (the deleted `lib/index.js.map` in git status suggests it is partially tracked).
- Functions use the **v1 API** (`functions.firestore.document`, `functions.auth.user()`). Migrate to **v2** (`onDocumentUpdated`, `onCall`) — v1 is in maintenance mode; note `functions.auth.user().onDelete` has no direct v2 equivalent, so plan that migration deliberately.
- Add structured error logging/alerting to functions — nothing monitors them today.

---

## 3. High — Performance

### 3.1 No route-level code splitting; every page loads up front
- [App.tsx](../src/App.tsx) statically imports all ~30 pages, which transitively pull **five `@nivo/*` packages, recharts, FullCalendar (5 packages), jspdf + autotable, html2canvas, xlsx, and html5-qrcode** into one bundle. The production build currently emits a **single 4.4 MB JS chunk (1.25 MB gzipped)** — a member logging in to check contributions downloads the entire admin analytics/reporting stack.
- **Fix:**
  - Convert page imports to `React.lazy()` + `<Suspense>` (the existing `LoadingSpinner` is a ready fallback).
  - Dynamically import heavy libs at point of use: `jspdf`/`xlsx` inside export handlers, `html5-qrcode` inside the QR scanner modal.
  - Verify results with `rollup-plugin-visualizer`; add `manualChunks` only if route splitting leaves large shared chunks.

### 3.2 Two charting libraries
- Both `@nivo/*` and `recharts` are dependencies. Pick one (nivo appears more used) and migrate the remainder — likely several hundred KB of duplicate charting code. Note the nivo 0.90 packages also pin React 18 peer deps (npm warns on every install against React 19); upgrading nivo or consolidating on recharts would clean this up.

### 3.3 Permission checks and role fetch on every session
- Role/permissions are fetched per login and cached with a bespoke encrypted-localStorage cache (`cacheService.ts` + crypto-js). Client-side encryption with a bundled key adds complexity without real security (the key ships in the bundle). Moving the role to **custom claims** (§1.4) makes the token itself the cache and lets you delete the crypto-js dependency and the cache-invalidation logic.

---

## 4. Medium — Architecture & code quality

### 4.1 Introduce a server-state library (TanStack Query)
- Data hooks (`useMembers`, `useContributions`, `usePayouts`, …) each hand-roll `useState` + `useEffect` + manual refetch functions. This produces duplicated loading/error handling, no cross-page caching, no request de-duplication, and stale lists after mutations unless a manual `fetch*` is called.
- TanStack Query gives caching, invalidation after mutations, retry, and background refresh with far less code. Adopt incrementally: wrap existing service functions as query/mutation functions, one page at a time.

### 4.2 Break up oversized modules
| File | Lines | Suggested split |
|---|---|---|
| [reportGenerationService.ts](../src/services/reportGenerationService.ts) | 1,983 | One module per report type + shared PDF/table helpers |
| [predictiveAnalyticsService.ts](../src/services/predictiveAnalyticsService.ts) | 1,330 | Separate data-prep, models/heuristics, formatting |
| [Analytics.tsx](../src/pages/Analytics.tsx) | 881 | Extract chart section components + a data hook |
| [Dashboard.tsx](../src/pages/Dashboard.tsx) | 664 | Extract KPI/widget components |

### 4.3 TypeScript strictness debt
- 109 occurrences of `: any` / `as any` across `src/`. Firestore document mapping (`doc.data() as X`) is the main source. Add a typed converter (`withConverter`) per collection so reads/writes are typed once, then burn down `any` usage; block new ones via ESLint (`@typescript-eslint/no-explicit-any: error`).

### 4.4 Small consistency cleanups
- Duplicate context folders: `src/context/` (NotificationContext) and `src/contexts/` (ThemeContext) — merge into one.
- Root directory holds ~12 feature/status markdown files (`PHASE_*_COMPLETE.md`, `UI_REDESIGN_COMPLETE.md`, …) — move into `docs/` and add a proper `README.md` (setup, env vars, deploy, architecture overview). There is currently **no README**.
- Two version sources exist: `VITE_APP_VERSION` in `.env` and `packageJson.version` injected by `vite.config.ts` (the injected define wins). Drop the env var and use package.json alone.
- Only one `onSnapshot` usage — decide deliberately where realtime matters (e.g. attendance check-ins during a live session, credit review queues) and where one-shot reads are fine.
- Stale docs: `docs/PERMISSION_CACHE_ENCRYPTION.md` and friends will need updates if §3.3's custom-claims migration lands.

---

## 5. Feature enhancements (roadmap candidates)

Ordered by expected member/admin value relative to effort:

1. **Push/email notifications for lifecycle events** — contribution approved/rejected, claim status, credit review outcome, upcoming hosting month. Infrastructure exists (Mailjet in functions for invitations; a notifications type/service in src). Add FCM web push + a Cloud Function fan-out on status changes.
2. **Scheduled Firestore backups** — scheduled export to a GCS bucket (or console-level scheduled backups). Currently a bad deploy or rules mistake could silently destroy financial history. Cheap and high value.
3. **Member statements** — self-service annual/period statement PDF per member (contributions, credits, payouts) reusing the existing jspdf invoice generator. Reduces admin queries.
4. **PWA + offline hardening for QR attendance** — meetings often happen where connectivity is poor; a service worker with cached shell plus Firestore offline persistence would make check-in robust, and gives "install to home screen".
5. **Bank-statement import for contributions** — the bulk import path exists (`contributionService/bulkImport.ts`); extend with CSV bank-statement import and matching heuristics to reduce manual capture.
6. **WhatsApp integration** — analysis doc already exists (`whatsapp_integration_analysis.md`); scope phase 1 to outbound notifications via the WhatsApp Business API for the same events as item 1.
7. **i18n** — externalise strings (react-i18next) and add isiZulu/Sesotho translations for member-facing pages; admin pages can remain English initially.
8. **Dashboards on aggregates, not raw scans** — once §2.4's counter documents exist, the dashboard renders instantly and trend charts run off monthly rollup docs.

---

## 6. Suggested sequencing

**Week 1 (security sprint):**
- Untrack `.env` (§1.1)
- Remove `firebase-admin` from frontend deps (§1.3)
- Add `storage.rules` to repo + deploy pipeline (§1.2)
- Patch the `contributions` create rule and `audit_logs` rules (§1.4)

**Weeks 2–3 (safety net):**
- CI workflow: typecheck, lint, build, audit (§2.2)
- Vitest + first tests on money-math utilities and Firestore rules (§2.1)
- README + docs consolidation (§4.4)

**Weeks 4–6 (performance & platform):**
- Route-level lazy loading + dynamic import of heavy libs (§3.1)
- Custom-claims role migration (removes rules `get()` overhead and cache encryption) (§1.4/§3.3)
- Pagination + aggregation queries on the heaviest lists (§2.4)
- Functions v2 migration + stale file cleanup (§2.7)

**Ongoing:**
- TanStack Query adoption page-by-page (§4.1)
- `any` burn-down and large-file splits (§4.2/§4.3)
- Lightweight error monitoring decision (§2.3)
- Feature roadmap items from §5 as capacity allows

---

*Generated from a static review on branch `fix/contribution-admin-permission`. Line counts, bundle sizes, and dependency versions reflect the working tree on 8 July 2026.*
