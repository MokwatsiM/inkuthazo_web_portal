# Inkuthazo Web Portal

Management portal for the Inkuthazo burial society: member registration and
approvals, monthly contributions with proof of payment, claims, payouts,
credits, donations, expenses, QR-code meeting attendance, host assignments,
analytics/reporting, and a permission-based role system.

**Stack:** React 19 + TypeScript + Vite · Tailwind CSS · Firebase (Auth,
Firestore, Storage, Cloud Functions, App Check) · TanStack Query · nivo
charts · Vitest.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase web config
npm run dev
```

Cloud Functions live in `functions/` with their own `package.json`
(`cd functions && npm install`).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint (`--max-warnings 0`) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:rules` | Firestore security-rules tests against the emulator |
| `npm run preview` | Serve the production build locally |

## Environment variables

See [.env.example](.env.example). The Firebase web config values are public
by design (security comes from Firestore/Storage rules and App Check).
`VITE_RECAPTCHA_SITE_KEY` enables App Check; leave it empty to disable
locally. The app version shown in the UI comes from `package.json` (injected
by [vite.config.ts](vite.config.ts)).

**Never commit secrets.** `serviceAccountKey.json` (used by admin scripts in
`scripts/`) is gitignored and must stay that way.

## Architecture notes

- **Routing:** all pages are lazy-loaded route chunks ([src/App.tsx](src/App.tsx)).
- **Data layer:** newer hooks use TanStack Query (`useMembers`, `usePayouts`,
  `useDashboardData`); older hooks still hand-roll fetch state and are being
  migrated incrementally. Typed Firestore reads go through
  [src/utils/firestoreConverter.ts](src/utils/firestoreConverter.ts).
- **Authorization:** a permission catalogue lives in the `roles` Firestore
  collection; security rules authorize from ID-token **custom claims**
  (`role`, `status`) kept in sync by the `syncMemberClaims` Cloud Function —
  see [docs/CUSTOM_CLAIMS_MIGRATION.md](docs/CUSTOM_CLAIMS_MIGRATION.md).
- **Rules:** `firestore.rules` and `storage.rules` are versioned here and
  deployed via `firebase deploy --only firestore:rules,storage`; they are
  covered by `npm run test:rules`.
- **Reports:** PDF/Excel/CSV generation is split per report type under
  [src/services/reportGenerationService/](src/services/reportGenerationService/).

## Testing & CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs
type-check, lint (report-only until the legacy lint debt is cleared), unit
tests, Firestore rules tests, `npm audit`, and the production build on every
push/PR to `dev`/`main`.

## Docs

Design and feature documents live in [docs/](docs/); superseded/historical
write-ups are under [docs/archive/](docs/archive/). Key ones:

- [docs/APPLICATION_DOCUMENTATION.md](docs/APPLICATION_DOCUMENTATION.md) — feature overview
- [docs/ENHANCEMENT_IMPROVEMENT_PLAN.md](docs/ENHANCEMENT_IMPROVEMENT_PLAN.md) — roadmap & tech-debt plan
- [docs/CUSTOM_CLAIMS_MIGRATION.md](docs/CUSTOM_CLAIMS_MIGRATION.md) — auth claims rollout
