// Betiganu service worker: lets the app open from the home screen and keeps
// files it has already downloaded, so recordings load faster next time.
const VERSION = 'betiganu-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // YouTube etc. go straight to the network
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isPage) {
    // newest page when online, saved page when offline
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(VERSION).then((ca) => ca.put(req, c)); return r; }).catch(() => caches.match(req).then((m) => m || caches.match('./'))));
    return;
  }
  // recordings and other files: saved copy first, else download and save
  e.respondWith(caches.open(VERSION).then((ca) => ca.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok) ca.put(req, r.clone()); return r; }))));
});
