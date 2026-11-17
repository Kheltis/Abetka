/* Service Worker für Dinos Abetka
   Macht die App offline nutzbar.

   WICHTIG: Bei jeder Änderung an index.html (oder einer anderen Datei)
   die Versionsnummer hier um 1 erhöhen, z. B. "abetka-v2" -> "abetka-v3".
   Sonst behalten iPad, Handy und Notebook die alte Version. */
const CACHE = "abetka-v1";

const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

// Beim Installieren alle App-Dateien auf dem Gerät speichern
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Alte Versionen aufräumen
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google-Schriften: aus dem Speicher, sonst laden und merken (offline gibt es eine Ersatzschrift)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      }).catch(() => hit)))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Eigene Dateien: zuerst aus dem Speicher, das ist schnell und klappt offline
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => req.mode === "navigate" ? caches.match("./index.html") : undefined))
  );
});
