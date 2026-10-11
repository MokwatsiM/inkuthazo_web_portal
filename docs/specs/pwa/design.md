# PWA — Design

Implements [`requirements.md`](./requirements.md). Tasks are in [`tasks.md`](./tasks.md).

## Architecture overview

```
Browser / installed app
 ├─ index.html  ── links manifest.webmanifest, iOS meta tags
 ├─ React app
 │   ├─ UpdatePrompt      (R4)  useRegisterSW → "New version — Refresh"
 │   ├─ InstallPrompt     (R1)  beforeinstallprompt / iOS instructions
 │   ├─ ConnectionStatus  (R3)  existing offline banner
 │   ├─ Firestore SDK     (R3)  persistentLocalCache (IndexedDB)
 │   └─ pushService       (R5)  getToken → members/{uid}/push_tokens/{token}
 └─ Service worker  src/sw.ts  (one SW, scope "/")
     ├─ Workbox precache + SPA navigation fallback   (R2)
     ├─ Runtime cache: icons, logo, fonts only       (R2, R7)
     └─ Firebase Messaging background handler        (R6)

Cloud Functions
 └─ notify()  in-app doc + Brevo email + FCM push fan-out (R6)
```

## Decisions

### D1 — `vite-plugin-pwa` with `injectManifest` and one custom service worker

`vite-plugin-pwa` generates the manifest, injects the precache list and
registers the service worker. We use the **`injectManifest`** strategy with a
hand-written `src/sw.ts` (rather than the generated `generateSW`) because
Firebase Cloud Messaging needs code in the service worker. Keeping
precaching and messaging in **one** service worker avoids two workers
competing for scope `/` (Firebase's default `firebase-messaging-sw.js` would
otherwise need its own registration).

Rejected: separate `firebase-messaging-sw.js` + generated Workbox SW — two
registrations on the same scope, harder update logic.

### D2 — Update strategy: prompt, never auto-reload (R4)

`registerType: 'prompt'`. The plugin's `useRegisterSW` hook (from
`virtual:pwa-register/react`) exposes `needRefresh`; `UpdatePrompt` shows a
toast with **Refresh**, which calls `updateServiceWorker(true)` (skip waiting
+ reload). The SW does **not** call `skipWaiting()` on install. This prevents
a member being reloaded mid-form (e.g. while recording a contribution).

Hosting: `vercel.json` sends `Cache-Control: public, max-age=0,
must-revalidate` for `/sw.js` and `/manifest.webmanifest` so the browser
always checks for a new worker. Hashed assets keep long cache lifetimes.
This complements the existing clean `vercel-build`.

### D3 — What the service worker caches (R2, R7)

| Content | Strategy | Why |
| --- | --- | --- |
| Build output (JS/CSS/HTML, hashed) | Precache | Instant, offline shell |
| SPA navigations | `NavigationRoute` → cached `index.html`, denylist `/__/` (Firebase auth handler) | Deep links work offline |
| `/icons/*`, `/logo.png`, favicons | CacheFirst, 30 days | Static, non-sensitive |
| Google Fonts | StaleWhileRevalidate / CacheFirst | Static |
| `firestore.googleapis.com`, `identitytoolkit`, `securetoken`, `firebaseappcheck`, `cloudfunctions.net` | **Not cached** (NetworkOnly / not intercepted) | Firestore has its own offline store; auth must never be stale |
| `firebasestorage.googleapis.com` | **Not cached** | Proofs of payment and signed documents are sensitive |

Large lazy chunks (xlsx, jspdf, nivo, html2canvas) are precached so report
and chart pages work offline; `maximumFileSizeToCacheInBytes` is raised to
~3 MB to allow them. Re-evaluate if install size becomes a concern.

### D4 — Offline data via Firestore persistence (R3)

Change `src/config/firebase.ts`:

```ts
initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

The SDK then serves the last-known results of any query from IndexedDB when
offline and syncs automatically when back online (AC3.1, AC3.4). No page
code changes are needed for reads.

When using the emulator (`VITE_USE_EMULATORS`), keep memory cache to avoid
stale emulator data persisting between runs.

**Writes offline (AC3.3):** Firestore would normally queue writes offline,
which is unsafe for money flows (and file uploads would fail anyway). A small
`assertOnline()` helper (reads `navigator.onLine` / `useFirebaseStatus`) is
called at the top of submit handlers in the contribution, credit, donation,
asset and claim modals; when offline it shows a friendly error and keeps the
form open.

### D5 — Sign-out clears local data (R7)

`useAuth.signOut` (src/hooks/useAuth.tsx) becomes:

1. Remove this device's push token doc (D6) — best effort.
2. `firebaseSignOut(auth)`.
3. `terminate(db)` then `clearIndexedDbPersistence(db)`.
4. Hard reload to `/auth/login` (Firestore can't be reused after `terminate`).

The session timeout (`useSession.handleSessionExpired`) calls `signOut`, so
it inherits this behaviour (AC8.1).

### D6 — Push notifications via Firebase Cloud Messaging (R5, R6)

**Token storage:** `members/{uid}/push_tokens/{token}` with
`{ token, platform, user_agent, created_at, updated_at }`. Using the token as
the doc id makes writes idempotent and supports several devices (AC5.5).

**Preference:** new optional `push_notifications?: boolean` on `Member`
(unset = enabled once a token exists), mirroring `email_notifications`.

**Client — `src/services/pushService.ts`:**

- `isPushSupported()` — `'Notification' in window`, service worker + PushManager
  available, and on iOS only when `matchMedia('(display-mode: standalone)')`.
- `enablePush(uid)` — `Notification.requestPermission()` (from the toggle's
  click handler), `getToken(getMessaging(app), { vapidKey,
  serviceWorkerRegistration })`, write token doc, set
  `push_notifications: true`.
- `disablePush(uid)` — `deleteToken`, delete token doc, set
  `push_notifications: false`.
- `listenForegroundMessages()` — `onMessage` → existing `showSuccess`/toast
  (AC6.4).

**Profile toggle:** next to the email-notifications switch in
`src/pages/MemberDetail.tsx`, shown only on the member's own profile. States:
on / off / unsupported (iOS not installed, AC5.3) / blocked (AC5.4).

**Service worker (`src/sw.ts`):** `onBackgroundMessage` shows a notification
with the payload's title/body/icon and stores `link` in `data`;
`notificationclick` focuses an existing client and navigates it to `link`, or
opens a new window (AC6.3).

**Server — `functions/src/notifications/notify.ts`:** after writing the
in-app doc and attempting email, if `member.push_notifications !== false`,
read `members/{id}/push_tokens`, call
`getMessaging().sendEachForMulticast({ tokens, notification: { title, body },
data: { link }, webpush: { fcmOptions: { link } } })`. Best effort: errors are
logged, never thrown (AC6.6). Tokens whose result error is
`messaging/registration-token-not-registered` or
`messaging/invalid-registration-token` are deleted (AC6.7). The push payload
reuses `renderNotification` output, so every existing and future notification
type gets push automatically.

**Security rules (`firestore.rules`):**

```
match /members/{userId}/push_tokens/{tokenId} {
  allow read, write: if isOwner(userId);
}
```

Cloud Functions read tokens with the Admin SDK (bypasses rules).

**Config:** `VITE_FIREBASE_VAPID_KEY` in `.env` / Vercel. The VAPID key is a
public key (safe in the client bundle).

### D7 — Install prompt (R1)

`src/components/pwa/InstallPrompt.tsx`, shown on the landing page:

- **Android/Chromium:** capture `beforeinstallprompt`, show "Install app";
  on tap call `prompt()`.
- **iOS Safari:** detect iOS + not standalone, show a short sheet with
  Share → Add to Home Screen steps.
- Hidden when already installed (`display-mode: standalone` /
  `navigator.standalone`). Dismissal stored in `localStorage` for 30 days
  (wrapped in try/catch).

### D8 — Manifest and icons (R1)

Generated by `vite-plugin-pwa` from `vite.config.ts`:

- `name`, `short_name`, `description`, `start_url: '/'`, `scope: '/'`,
  `display: 'standalone'`, `theme_color` (match the `<meta theme-color>`),
  `background_color`.
- Icons in `public/icons/`: `icon-192.png`, `icon-512.png`,
  `maskable-512.png` (logo inside the ~80% safe zone on a solid background).
- iOS: keep `apple-touch-icon` (regenerated from the hi-res logo at
  180×180), add `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, and
  splash images for common iPhone sizes.

`index.html` cleanup: remove the duplicate viewport meta and the empty
`<link rel="" href="#">`.

## Files

| File | Change |
| --- | --- |
| `package.json` | add `vite-plugin-pwa`, `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-expiration` |
| `vite.config.ts` | `VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts', registerType: 'prompt', manifest, injectManifest: { maximumFileSizeToCacheInBytes } })`, keep `manualChunks` |
| `src/sw.ts` | new — precache, routes, messaging handlers |
| `src/vite-env.d.ts` | add `vite-plugin-pwa/react` + `vite-plugin-pwa/client` types |
| `src/components/pwa/UpdatePrompt.tsx` | new (R4) |
| `src/components/pwa/InstallPrompt.tsx` | new (R1) |
| `src/App.tsx` | mount `UpdatePrompt` beside `VercelAnalytics` |
| `src/pages/LandingPage.tsx` | mount `InstallPrompt` |
| `index.html` | iOS meta, cleanup |
| `public/icons/*` | generated icons + splash images |
| `vercel.json` | `headers` for `/sw.js`, `/manifest.webmanifest` |
| `src/config/firebase.ts` | persistent cache; export `messaging` lazily |
| `src/hooks/useAuth.tsx` | sign-out clears cache + token (D5) |
| `src/utils/network.ts` | new `assertOnline()` |
| contribution / credit / donation / asset / claim modals | call `assertOnline()` before submit |
| `src/services/pushService.ts` | new (D6) |
| `src/pages/MemberDetail.tsx` | push toggle |
| `src/types/index.ts` | `push_notifications?: boolean` |
| `firestore.rules` | `push_tokens` rule |
| `functions/src/notifications/notify.ts` | FCM fan-out + token pruning |

## Risks

| Risk | Mitigation |
| --- | --- |
| Stale app after deploy (seen before on Vercel) | Prompt-based updates (D2), `no-cache` on `sw.js`, clean build stays |
| A bad service worker "sticks" on devices | Keep the SW minimal; document a kill-switch: deploy an `sw.ts` that unregisters itself and clears caches |
| Shared phones leaking data | Clear IndexedDB + token on sign-out (D5); idle timeout already enforced |
| iOS push limitations (installed-only, iOS 16.4+) | Detect and explain in the toggle (AC5.3) |
| Offline queued writes for money flows | Block writes offline with `assertOnline()` (D4) |
| Install size from large lazy chunks | Monitor precache size; exclude rarely used report chunks if needed |
| Firestore multi-tab persistence edge cases | Use `persistentMultipleTabManager`; fall back to memory cache if IndexedDB is unavailable (private mode) |

## Testing approach

- **Unit (Vitest):** `pushService` platform detection; `assertOnline`;
  `notify()` push fan-out and invalid-token pruning with a mocked
  `getMessaging` (functions tests).
- **Rules (emulator):** a member can read/write only their own
  `push_tokens`.
- **Manual / device:** Lighthouse PWA audit; Android Chrome and installed
  iPhone app for install, offline read, update prompt, push open/closed,
  sign-out cleanup, idle timeout. Checklist lives in `tasks.md` Phase 4.
