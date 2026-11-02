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
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
