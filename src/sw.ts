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
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

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

// ---- Push notifications (R6) ------------------------------------------------
// notify() sends data-only messages ({ title, body, link }) so this worker is
// the single place that displays them (a `notification` payload would also be
// auto-displayed by the browser and show twice). Only the public web config is
// needed here; foreground messages are handled in the page (PushManager).
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

onBackgroundMessage(getMessaging(firebaseApp), (payload) => {
  const data = payload.data ?? {};
  return self.registration.showNotification(data.title || 'Inkuthazo', {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // Same-key notifications replace each other instead of stacking
    tag: data.tag || undefined,
    data: { link: data.link || '/home' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link: string = event.notification.data?.link || '/home';
  const target = new URL(link, self.location.origin);
  // Only ever open pages of this app, whatever the payload says
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target.href);
          return;
        }
      }
      await self.clients.openWindow(target.href);
    })()
  );
});
