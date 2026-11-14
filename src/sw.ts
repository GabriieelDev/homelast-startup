/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

const DAY = 60 * 60 * 24;

// "prompt" flow: the new worker waits until PwaUpdatePrompt asks it to take over.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// App shell only (hashed JS/CSS/HTML), so the app opens without network.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

// Only these runtime rules exist. Anything not matched here (Supabase
// /rest/v1, /auth/v1, /realtime/v1, /functions/v1, avatars) goes straight
// to the network and is never stored by the service worker.

// Google Fonts CSS: small and can change, so serve cached and refresh in background.
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "google-fonts-styles",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 30 * DAY }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// Font files are immutable (versioned URLs), so cache-first for a year.
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-files",
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * DAY }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// Public product/banner images only. Upload paths are unique
// (timestamp + random, upsert:false), so a URL never changes content.
// The `avatares` bucket does not match and is never cached.
registerRoute(
  /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/(?:produtos|banners)\/.*/i,
  new CacheFirst({
    cacheName: "supabase-public-images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 14 * DAY, purgeOnQuotaError: true }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// ---- Push notifications ----

type PushPayload = { title?: string; body?: string; url?: string; tag?: string; renotify?: boolean };

const ICON = "/pwa-192x192.png";
// No monochrome badge in /public yet; Android shows the badge as a white silhouette.
const BADGE = "/pwa-192x192.png";

self.addEventListener("push", (event) => {
  let data: PushPayload = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  const title = data.title || "HomeLast";
  // renotify is only valid together with a tag.
  const options: NotificationOptions & { renotify?: boolean } = {
    body: data.body ?? "",
    icon: ICON,
    badge: BADGE,
    tag: data.tag,
    renotify: Boolean(data.tag && data.renotify),
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Prefer a window already on the target; otherwise reuse any app window.
      const exact = windows.find((c) => c.url === target);
      if (exact) return exact.focus();
      const any = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (any) {
        await any.focus();
        return any.navigate(target).catch(() => self.clients.openWindow(target));
      }
      return self.clients.openWindow(target);
    })(),
  );
});
