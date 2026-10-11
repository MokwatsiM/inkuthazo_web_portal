# PWA — Tasks

Implements [`requirements.md`](./requirements.md) using [`design.md`](./design.md).
Each task lists the requirements (R) and design decisions (D) it covers.
Tick tasks as they land; a phase is done when its verification passes.

## Phase 0 — Spec

- [x] **T0.1** Write `requirements.md`, `design.md`, `tasks.md`.
- [ ] **T0.2** Review the spec with the committee / maintainers; resolve open questions.

## Prerequisites (blocking)

- [x] **P1** Provide a high-resolution logo (≥1024×1024 PNG or SVG). *Blocks T1.2.*
- [ ] **P2** Generate the Web Push VAPID key in Firebase Console; add
  `VITE_FIREBASE_VAPID_KEY` to `.env` (local) and Vercel (prod). *Blocks Phase 3.*
  _Vercel: done. Local `.env`: key name added, value still empty (needed only to test push locally)._

## Phase 1 — Installable app shell (R1, R2, R4, R8)

- [x] **T1.1** Add `vite-plugin-pwa` + Workbox packages; configure `VitePWA`
  in `vite.config.ts` (`injectManifest`, `registerType: 'prompt'`, manifest,
  raised `maximumFileSizeToCacheInBytes`). Keep existing `manualChunks`. *(R1, R2 · D1, D8)*
- [x] **T1.2** Generate `public/icons/` (192, 512, maskable-512, apple-touch 180,
  iOS splash images) from the hi-res logo. *(R1 · D8)*
- [x] **T1.3** `src/sw.ts`: precache `self.__WB_MANIFEST`, `NavigationRoute` to
  `index.html` (denylist `/__/`), runtime cache for icons/fonts only, no
  Firebase API or Storage caching, `cleanupOutdatedCaches()`. *(R2, R7 · D3)*
- [x] **T1.4** `src/components/pwa/UpdatePrompt.tsx` using `useRegisterSW`;
  mount in `App.tsx`. *(R4 · D2)*
- [x] **T1.5** `src/components/pwa/InstallPrompt.tsx` (Android button, iOS
  instructions, 30-day dismissal); mount on `LandingPage.tsx`. *(R1 · D7)*
- [x] **T1.6** `index.html`: add iOS meta tags; remove duplicate viewport and
  empty `<link>`. *(R1 · D8)*
- [x] **T1.7** `vercel.json` headers: `no-cache`/`must-revalidate` for
  `/sw.js` and `/manifest.webmanifest`. *(R4 · D2)*
- [x] **T1.8** Add types (`vite-plugin-pwa/react`, `/client`) to `src/vite-env.d.ts`. *(D1)*

**Verify Phase 1:** `npm run build && npm run preview` → DevTools ›
Application shows manifest + active SW; Lighthouse "Installable" passes;
offline reload shows the app shell; rebuild + reload shows the update toast;
`npm test` and build green.

## Phase 2 — Offline read access (R3, R7, R8)

- [ ] **T2.1** Enable `persistentLocalCache` + `persistentMultipleTabManager`
  in `src/config/firebase.ts`; memory cache when using emulators; fall back
  gracefully if IndexedDB is unavailable. *(R3 · D4)*
- [ ] **T2.2** `src/utils/network.ts` `assertOnline()`; call it before submit
  in contribution, credit, donation, asset/rental and claim modals; keep the
  form open with a friendly message. *(R3 AC3.3 · D4)*
- [ ] **T2.3** Update `useAuth.signOut`: `terminate(db)` +
  `clearIndexedDbPersistence(db)` + reload to `/auth/login`. *(R7 AC7.1 · D5)*
- [ ] **T2.4** Unit test `assertOnline`.

**Verify Phase 2:** load member pages online, go offline (DevTools + phone
airplane mode) → data still visible, offline banner shows, writes blocked
with message; back online → data refreshes; sign out → IndexedDB cleared;
30-min idle timeout still signs out.

## Phase 3 — Push notifications (R5, R6, R7)

- [ ] **T3.1** `firestore.rules`: `members/{uid}/push_tokens/{token}` owner
  read/write; add rules tests. *(R5 · D6)*
- [ ] **T3.2** `Member.push_notifications?: boolean` in `src/types/index.ts`. *(R5 · D6)*
- [ ] **T3.3** `src/services/pushService.ts`: `isPushSupported`,
  `enablePush`, `disablePush`, `listenForegroundMessages`; unit tests for
  platform detection. *(R5, R6 AC6.4 · D6)*
- [ ] **T3.4** Push toggle on the member's own profile in `MemberDetail.tsx`
  (on / off / unsupported-iOS / blocked states). *(R5 · D6)*
- [ ] **T3.5** `src/sw.ts`: `onBackgroundMessage` + `notificationclick`
  (focus or open `link`). *(R6 AC6.2, AC6.3 · D6)*
- [ ] **T3.6** `notify.ts`: FCM fan-out to the member's tokens when
  `push_notifications !== false`; best effort; prune invalid tokens; unit
  tests with mocked `getMessaging`. *(R6 · D6)*
- [ ] **T3.7** Sign-out removes this device's token (extend T2.3). *(R7 AC7.2 · D5)*
- [ ] **T3.8** Deploy functions + rules.

**Verify Phase 3:** enable push on Android Chrome and an installed iPhone
app → as admin approve that member's contribution → push arrives with the app
closed; tap opens `/my-contributions`; app open → toast instead; disable →
no push; invalid token pruned; sign out → token doc deleted.

## Phase 4 — Hardening and release (R8)

- [ ] **T4.1** Lighthouse PWA + performance audit on production; record scores here.
- [ ] **T4.2** Device test pass — Android Chrome, iPhone Safari (installed), desktop Chrome/Edge:
  - [ ] Install and launch standalone (AC1.3, AC1.4, AC1.6)
  - [ ] Offline shell + offline read (AC2.1, AC3.1)
  - [ ] Update prompt after a deploy (AC4.1–AC4.3)
  - [ ] Push on/off, closed/open, deep link (AC5.x, AC6.x)
  - [ ] Sign-out clears cache + token (AC7.1, AC7.2)
  - [ ] Google sign-in, App Check, idle timeout in installed mode (AC8.1, AC8.2)
- [ ] **T4.3** Document the service-worker kill-switch procedure (design.md › Risks) in `docs/`.
- [ ] **T4.4** Mark spec status **Implemented**.
