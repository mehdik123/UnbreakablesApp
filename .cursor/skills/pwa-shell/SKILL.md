---
name: pwa-shell
description: Turn the app into a real, installable, offline-capable PWA. Use whenever setting up the manifest, service worker, install prompt, iOS home-screen support, offline behavior, app icons/splash screens, standalone display, or caching strategy. CRITICAL for a gym app: it must keep working with no signal. Trigger this for "make it installable", "add to home screen", "work offline", "service worker", "manifest", "PWA setup", or "app icon". Web/PWA.
---

# PWA shell (installable + offline)

A fitness app is used in basements and gyms with dead signal. Offline is a feature, not an edge case. Recommended tooling: **vite-plugin-pwa** (wraps Workbox) with `idb` for offline data.

## 1. Web app manifest (`manifest.webmanifest`)
```json
{
  "name": "Hybrid Athlete",
  "short_name": "Hybrid",
  "description": "Your 12-week hybrid training program.",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0A0A0B",
  "theme_color": "#0A0A0B",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Start workout", "url": "/workout/today" }
  ]
}
```
Provide a 192 and 512 icon plus a **maskable** 512 (safe zone padded) so Android does not crop the logo.

## 2. index.html head (iOS needs the meta tags, it ignores the manifest for a lot)
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0A0A0B" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Hybrid" />
<!-- add apple-touch-startup-image splash <link>s per device for a native launch -->
```

## 3. Service worker (vite-plugin-pwa)
```ts
VitePWA({
  registerType: "prompt",              // show an update toast, do not silently reload mid-workout
  manifest: false,                      // using the file above
  workbox: {
    globPatterns: ["**/*.{js,css,html,woff2}"],   // precache the app shell
    runtimeCaching: [
      { urlPattern: ({request}) => request.destination === "image",
        handler: "CacheFirst", options: { cacheName: "images", expiration: { maxEntries: 120 } } },
      { urlPattern: ({url}) => url.pathname.startsWith("/api/"),
        handler: "NetworkFirst", options: { cacheName: "api", networkTimeoutSeconds: 3 } },
    ],
    navigateFallback: "/offline.html",
  },
});
```

## 4. Custom install prompt (do not rely on the browser mini-infobar)
```ts
let deferred: any;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; showInstallButton(); });
async function install() { deferred?.prompt(); await deferred?.userChoice; deferred = null; }
```
iOS gives no `beforeinstallprompt`. Detect iOS + not standalone and show a small "Add to Home Screen via the Share button" hint instead.

## 5. Update flow
With `registerType: "prompt"`, on a new SW waiting, show a toast: "New version available -> Reload". On tap, `skipWaiting()` then reload. Never auto-reload while a workout is in progress.

## 6. Offline data (the important part)
Store workouts, logs, and program state in **IndexedDB** via `idb`. Write locally first; queue any server sync and flush on `window.addEventListener("online", ...)` (or the Background Sync API where available). The user must be able to open the app, run today's session, and log every set fully offline, with sync happening later.

## 7. Verify
Run the Lighthouse PWA audit: installable, offline-capable, correct theme/manifest. Test: install to home screen, turn on airplane mode, complete a full workout.
