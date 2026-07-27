# Local development against the Firebase Emulator Suite

For debugging/testing without touching the production Firestore, Auth,
Storage, or Functions, run the app against the local emulators. Data is
fully isolated — nothing you do locally reaches the real project.

## Run it

Two terminals:

```bash
# 1. Start the emulators (Firestore, Auth, Storage, Functions + UI).
#    Data is imported from and saved to ./.emulator-data (gitignored),
#    so your local dev data survives restarts.
npm run emulators

# 2. Start the app pointed at the emulators.
npm run dev:emulators
```

### First-run seeding (once per fresh/reset emulator)

A brand-new emulator has no `roles/*` documents, so `usePermissions` logs
"Role document not found" and members see an empty menu. Seed the system
roles (with the emulators running):

```bash
npm run seed:emulator
```

This writes `roles/admin`, `roles/member`, `roles/dc_member`,
`roles/chairperson` using the **same** permission definitions as the app
(imported from `src/constants/permissions.ts`, via the Admin SDK which
bypasses rules). It targets the app's project id (`inkuthazo-a0ac7`) — the
emulator partitions data by project, so this must match. Once seeded, the
export in `./.emulator-data` keeps the roles across restarts; only re-run
after deleting that folder.

**Become admin:** sign up a member, then in the Emulator UI
(http://127.0.0.1:4000) open your `members/{uid}` doc and change `role` to
`admin`.

- Emulator UI: http://127.0.0.1:4000 (browse/edit Firestore data, see
  Auth users, inspect function logs).
- Ports: Auth 9099, Firestore 8080, Storage 9199, Functions 5001.

A plain `npm run dev` still talks to the **real cloud** project — the
emulator connection only happens when `VITE_USE_EMULATORS=true` (which
`dev:emulators` sets) **and** the build is a dev build. Production builds
can never connect to emulators.

## Notes

- **App Check is skipped** in emulator mode (it would reject emulator
  traffic), so you don't need the reCAPTCHA/debug-token dance locally.
- **Functions run locally too** — triggers like `syncMemberClaims`,
  notification emails, and the arrears/credit callables execute against
  the emulated data. Brevo emails won't actually send unless the
  `BREVO_API_KEY` secret is available to the emulator; the in-app
  notification docs still get written.
- **Google popup sign-in** uses the Auth emulator's fake sign-in screen
  (you pick/enter a test identity), not the real Google chooser.
- **Seeding:** the first run starts empty. Create data via the app or the
  Emulator UI; on exit it's exported to `./.emulator-data` and re-imported
  next time. Delete that folder to reset.
- **Rules/indexes:** the emulator loads `firestore.rules` and
  `storage.rules` automatically, so you can test rule changes locally
  before deploying.
