/* Berlin crime map service worker (Phase 3, 21g). Offline copy of the page's own files only.
   Same-origin GET requests: cache first, network fallback; page navigations: network first, cached copy offline.
   Cross-origin requests (map tiles) are not intercepted. No push, no background sync, no notifications. */
"use strict";
var CACHE = "berlin-map-18bfda3abce4-ce196fab";
var PRECACHE = [
 "BERLIN%20vendor-leaflet.js?v=db49d009c8",
 "BERLIN%20vendor-awesome-markers.js?v=8b0382d98e",
 "BERLIN%20vendor-fullscreen.js?v=0269d641bd",
 "BERLIN%20vendor-minimap.js?v=d28d76fb31",
 "BERLIN%20vendor-leaflet.css?v=89f66625bf",
 "BERLIN%20vendor-bootstrap.css?v=2143941c03",
 "BERLIN%20vendor-fontawesome.css?v=137b1cf3ce",
 "BERLIN%20vendor-fa-solid.css?v=21db79f9a5",
 "BERLIN%20vendor-awesome-markers.css?v=c97fa2134d",
 "BERLIN%20vendor-awesome-rotate.css?v=35aaa393c0",
 "BERLIN%20vendor-fullscreen.css?v=8c5a942008",
 "BERLIN%20vendor-minimap.css?v=17f3ff10a5",
 "BERLIN%20app.css?v=ae8307efc9",
 "BERLIN%20boot.js?v=44bbebff00",
 "BERLIN%20app.js?v=ce196fab5ff5",
 "BERLIN%20data.json?v=18bfda3abce4",
 "BERLIN%20data.js?v=18bfda3abce4",
 "BERLIN%20vendor-fa-solid-900.woff2",
 "BERLIN%20vendor-leaflet-layers.png",
 "BERLIN%20vendor-leaflet-layers-2x.png",
 "BERLIN%20vendor-leaflet-marker-icon.png",
 "BERLIN%20vendor-awesome-markers-soft.png",
 "BERLIN%20vendor-awesome-markers-soft@2x.png",
 "BERLIN%20vendor-awesome-markers-shadow.png",
 "BERLIN%20vendor-awesome-markers-shadow@2x.png",
 "BERLIN%20vendor-fullscreen-icon.svg",
 "BERLIN%20vendor-minimap-toggle.svg",
 "BERLIN%20vendor-minimap-toggle.png",
 "BERLIN%20manifest.webmanifest",
 "BERLIN%20icon-192.png",
 "BERLIN%20icon-512.png"
];
var PAGES = ["./", "./index.html", "./BERLIN%20index.html"];
self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(PRECACHE).then(function () {
      // the page itself is index.html on Pages and "BERLIN index.html" in a stage folder: cache whichever exists
      return Promise.all(PAGES.map(function (u) {
        return fetch(u, {cache: "no-cache"}).then(function (r) {
          if (r.ok && (r.headers.get("content-type") || "").indexOf("text/html") === 0) return c.put(u, r);
          return null;
        }).catch(function () { return null; });
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("berlin-map-") === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // tiles and anything external: browser default
  if (/\/BERLIN%20osint_unconfirmed\.json$/.test(url.pathname)) {  // 21g2: live file, network first, cached copy offline
    ev.respondWith(fetch(req).then(function (r) {
      if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    }).catch(function () { return caches.match(req, {ignoreSearch: true}); }));
    return;
  }
  if (req.mode === "navigate") {
    ev.respondWith(fetch(req).then(function (r) {
      if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    }).catch(function () {
      return caches.match(req, {ignoreSearch: true}).then(function (hit) {
        if (hit) return hit;
        return caches.open(CACHE).then(function (c) {
          return c.match("./index.html").then(function (a) { return a || c.match("./BERLIN%20index.html"); })
            .then(function (b) { return b || c.match("./"); });
        });
      });
    }));
    return;
  }
  ev.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      if (r.ok && r.type === "basic") { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    });
  }));
});
