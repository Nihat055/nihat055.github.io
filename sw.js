/* Qaib Jurnali - sade oflayn kes.
   Sened sorgulari sebekadan gelir (yenilikler derhal gorunsun),
   sebeka yoxdursa kesdeki nusxa verilir. */
const CACHE = "qaib-20261005-0014";
const SHELL = ["./", "./index.html", "./manifest.json",
               "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ---- Proqramin oz bildirisleri ----
   GitHub-dakı avtomatika gonderir: gunluk ders xulasesi ve imtahan xeberdarligi. */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (x) { d = { body: e.data ? e.data.text() : "" }; }
  const title = d.title || "Qaib Jurnalı";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: d.tag || "qaib",
    renotify: true,
    data: { url: d.url || "./" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
      for (const w of ws) { if ("focus" in w) return w.focus(); }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.url.indexOf("version.json") >= 0) return;   // hemise sebekeden
  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    e.respondWith(
      fetch(req).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
        return r;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r && r.ok && r.type === "basic") {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return r;
    }))
  );
});
