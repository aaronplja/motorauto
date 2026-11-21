/* MOTORAUTO — service worker : notifications push (FCM) + site installable.
 * Les messages sont envoyés « data-only » par la Cloud Function pushOnNotification : on affiche la notification ici. */
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyA_0Y40KgUm20M4lowGCx9QG8C6CDwYhbE",
  authDomain: "motorautoireyv.firebaseapp.com",
  projectId: "motorautoireyv",
  storageBucket: "motorautoireyv.firebasestorage.app",
  messagingSenderId: "163440700630",
  appId: "1:163440700630:web:83bc46e3cf474bd490ad77"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  return self.registration.showNotification(d.title || "MOTORAUTO", {
    body: d.body || "", icon: "/assets/icon-192.png", badge: "/assets/icon-192.png", tag: d.tag || undefined, renotify: !!d.tag,
    data: { link: d.link || "/" }
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate ? c.navigate(link).catch(() => {}) : null; return c.focus(); } }
    return self.clients.openWindow ? self.clients.openWindow(link) : null;
  }));
});
// ---- Mode hors-ligne (ADD-103) : coquille de l'app + pages déjà vues, mises en cache à la volée.
const CACHE = "ma-offline-45db731925";
const SHELL = ["/", "/index.html", "/css/bundle.min.css", "/manifest.webmanifest"];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))));
});
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("ma-offline-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                 // Firebase, polices, API : jamais interceptés
  if (/^\/(__|api\/)/.test(url.pathname) || url.pathname === "/firebase-messaging-sw.js") return;
  const nav = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (nav) {
    // réseau d'abord ; hors-ligne : la page déjà vue, sinon la coquille de l'app (le routeur lit l'adresse)
    e.respondWith(fetch(req).then((r) => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req).then((m) => m || caches.match("/index.html") || caches.match("/"))));
    return;
  }
  // fichiers statiques : on sert le cache tout de suite et on le rafraîchit en arrière-plan
  e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r && r.ok && r.type === "basic") c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
