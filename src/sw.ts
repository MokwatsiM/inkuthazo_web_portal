/// <reference lib="webworker" />
/**
 * Inkuthazo portal service worker — see docs/specs/pwa/design.md (D1–D3).
 *
 * What this worker does:
 *  - Precaches the built app shell so the portal opens with no signal (R2).
 *  - Serves the cached index.html for in-app navigations (SPA fallback).
 *  - Runtime-caches static, non-sensitive images and fonts only.
 *  - Waits for the member to tap "Refresh" before activating an update (R4).
 *
 * What it deliberately does NOT do (R7):
 *  - It never intercepts Firestore, Auth, App Check or Cloud Functions calls
 *    (Firestore keeps its own offline data in IndexedDB).
 *  - It never caches Firebase Storage downloads (proofs of payment, signed
 *    documents, statements are sensitive).
 * Any request without a matching route below simply goes to the network.
 *
 * Kill switch: if a bad worker ever ships, replace this file with one that
 * calls `self.registration.unregister()` and deletes all caches, then deploy.
 */
import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

// ---- Precache (build output, injected at build time) ----------------------
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ---- SPA navigation fallback ------------------------------------------------
// Any page navigation (e.g. /my-contributions) gets the cached app shell.
// Excluded: Firebase's reserved /__/ paths (auth handler) and URLs that look
// like files (e.g. /sw.js, /manifest.webmanifest, /icons/x.png).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/__\//, /\/[^/?]+\.[a-z0-9]+$/i],
  })
);

// ---- Runtime caching: static, non-sensitive assets only --------------------
const sameOriginStaticImage = ({ url, request }: { url: URL; request: Request }) =>
  url.origin === self.location.origin &&
  request.destination === 'image' &&
  (url.pathname.startsWith('/icons/') || /\.(png|jpe?g|webp|svg|ico)$/i.test(url.pathname));

registerRoute(
  sameOriginStaticImage,
  new CacheFirst({
    cacheName: 'static-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Lazy-loaded JS/CSS chunks left out of the precache (see globIgnores in
// vite.config.ts). File names are content-hashed, so cache-first is safe.
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/assets/') &&
    (request.destination === 'script' || request.destination === 'style'),
  new CacheFirst({
    cacheName: 'lazy-chunks',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Google Fonts (stylesheets revalidate; font files are immutable)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// ---- Updates (R4) -----------------------------------------------------------
// A new worker installs and then WAITS. It only activates when the member taps
// "Refresh" in UpdatePrompt, which posts SKIP_WAITING via updateServiceWorker().
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// On the very first install, take control of open tabs right away (there is
// no older version to protect, and nothing reloads).
clientsClaim();
