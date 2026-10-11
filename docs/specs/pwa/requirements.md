# PWA — Requirements

Status: **Draft** · Owner: Motebang Mokwatsi · Spec set: `requirements.md` · `design.md` · `tasks.md`

## Background

Most members use the portal on their phones, but it is a plain website: it
can't be installed, shows nothing without signal, and notifications only
arrive in-app or by email. This spec turns the portal into a Progressive Web
App (PWA) that installs on Android and iPhone, keeps working for reading when
offline, and sends phone push notifications.

## Goals

- Members can install the portal to their home screen on Android and iPhone.
- The app opens instantly after the first visit, even with no signal.
- Members can read their last-loaded data offline.
- Members receive push notifications for the same events they get in-app today.
- New versions roll out without surprise reloads or stale code.

## Non-goals

- **Offline writes.** Recording contributions, credits, donations or uploads
  while offline is out of scope. Money flows stay online-only.
- Native app-store apps (iOS App Store / Google Play).
- Background sync or periodic background refresh of data.

## Users

- **Member** — mostly on a phone; reads statements, contributions, credit,
  documents; receives notifications.
- **Admin / Chairperson** — mostly on desktop or phone; records and reviews.
  Benefits from the same install, offline-read and push behaviour.

## Requirements

Each requirement has acceptance criteria in Given / When / Then form. Task IDs
in `tasks.md` reference these requirement numbers.

### R1 — Installable

The portal provides a valid web app manifest and icons so browsers treat it as
installable.

- **AC1.1** Given the production site, when audited with Lighthouse, then the
  "Installable" check passes.
- **AC1.2** The manifest declares: `name` "Inkuthazo Social Club",
  `short_name` "Inkuthazo", `start_url` `/`, `scope` `/`, `display`
  `standalone`, `theme_color`, `background_color`, and icons at 192×192,
  512×512 and a 512×512 maskable icon.
- **AC1.3** Given an Android Chrome user who has not installed the app, when
  they open the landing page, then an "Install app" button is shown; tapping
  it shows the browser's install prompt.
- **AC1.4** Given an iPhone Safari user who has not installed the app, when
  they open the landing page, then they see short "Share → Add to Home Screen"
  instructions (iOS has no install-prompt API).
- **AC1.5** Given a user dismisses the install prompt or instructions, then
  they are not shown again on that device for 30 days.
- **AC1.6** Given the app is installed, when launched from the home screen,
  then it opens full-screen (no browser address bar) with the club's name,
  icon and theme colour.

### R2 — Fast and offline app shell

- **AC2.1** Given a member has opened the portal once, when they open it again
  with no network, then the app shell (layout, navigation, login screen or
  dashboard frame) loads instead of the browser's offline error.
- **AC2.2** Given no network, when the member navigates to any in-app route,
  then the cached app shell is served (single-page navigation fallback).
- **AC2.3** All built JavaScript, CSS, fonts and icons are precached, so
  repeat visits load without downloading them again.

### R3 — Offline read access

- **AC3.1** Given a signed-in member who has viewed a page while online, when
  they reopen that page offline, then they see the last-loaded data for
  their contributions, credit, documents and notifications.
- **AC3.2** Given the member is offline, then the existing "You're offline"
  banner is visible.
- **AC3.3** Given the member is offline, when they try to submit a write
  (record a contribution, create a credit, record a donation, upload a file),
  then the action is blocked with a clear message ("You're offline — connect
  to the internet to submit this") and no data is lost from the form.
- **AC3.4** Given the member comes back online, then data refreshes
  automatically without a manual reload.

### R4 — Update prompt

- **AC4.1** Given a new version has been deployed, when a member has the app
  open, then a toast appears: "A new version is available" with a
  **Refresh** button.
- **AC4.2** The app never reloads itself automatically. Until the member taps
  Refresh, the current version keeps working.
- **AC4.3** When the member taps Refresh, the new version activates and the
  page reloads into it (the bundle hash changes).
- **AC4.4** The service worker file and manifest are never served from a
  stale HTTP cache (so updates are detected on the next visit).

### R5 — Push notification opt-in

- **AC5.1** A member can turn phone notifications on or off from their profile,
  next to the existing email-notifications setting.
- **AC5.2** The browser permission request is only triggered by the member
  tapping the toggle, never automatically on page load.
- **AC5.3** Given an iPhone, when the app is **not** installed, then the toggle
  explains that notifications need the app added to the Home Screen
  (iOS 16.4+), instead of failing.
- **AC5.4** Given the member denies permission, then the toggle shows
  "Blocked in browser settings" with guidance, and nothing else breaks.
- **AC5.5** A member can have push enabled on several devices at once.

### R6 — Push delivery

- **AC6.1** Given a member has push enabled, when any notification event is
  raised through `notify()` (e.g. contribution approved, document to sign,
  arrears notice), then they receive a phone notification with the same
  title and body as the in-app notification.
- **AC6.2** Given the app is closed, the notification is still delivered.
- **AC6.3** When the member taps the notification, then the app opens (or
  focuses an open window) at the notification's link (e.g. `/my-contributions`).
- **AC6.4** Given the app is open in the foreground, then the message appears
  as an in-app toast rather than a duplicate system notification.
- **AC6.5** Given a member has push turned off, then no push is sent.
- **AC6.6** A failed push never blocks the in-app notification or email.
- **AC6.7** Device tokens that the push service reports as invalid are removed
  automatically.

### R7 — Privacy and sign-out

- **AC7.1** When a member signs out, the offline data cache on that device is
  cleared, so the next person using the phone can't read it.
- **AC7.2** When a member signs out, that device's push token is removed, so
  the device stops receiving their notifications.
- **AC7.3** The service worker never caches sensitive files: proof-of-payment
  uploads, signed documents, statements, or any Firebase Storage download.
- **AC7.4** The service worker never caches Firestore, Auth, App Check or Cloud
  Functions API responses.

### R8 — No regressions

- **AC8.1** The 30-minute idle timeout and 24-hour maximum session still sign
  members out when using the installed app.
- **AC8.2** App Check, email/password and Google sign-in keep working in the
  installed app.
- **AC8.3** Vercel deploys keep using the clean build and serve the new
  version (see R4).
- **AC8.4** The Firebase emulator development workflow keeps working.
- **AC8.5** Existing unit tests, rules tests and builds stay green.

## Prerequisites

| Item | Needed for | Owner |
| --- | --- | --- |
| High-resolution logo (≥1024×1024 PNG or SVG, solid background) | R1 icons, iOS splash screens | Club |
| Firebase Web Push VAPID key (Firebase Console → Project settings → Cloud Messaging → Web Push certificates), set as `VITE_FIREBASE_VAPID_KEY` in Vercel | R5, R6 | Admin |

The current `public/logo.png` is 180×180; scaling it up to 512px would look
blurry, so icons are blocked on the high-resolution logo.

## Open questions

- Should admins be able to send a manual push announcement to all members
  (e.g. meeting reminder)? Not in this spec; candidate follow-up.
- Should push preferences be per notification type (e.g. reminders off,
  approvals on)? This spec uses a single on/off toggle.
