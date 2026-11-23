/* Berlin crime map loader (Phase 2). Loads BERLIN data.json with fetch(); when the page is opened from
   file:// (offline zip) fetch is blocked, so it loads the same data from BERLIN data.js. Then it runs BERLIN app.js. */
(function () {
  "use strict";
  var DATAV = "18bfda3abce4", APPV = "ce196fab5ff5";
  var box = document.getElementById("berlin-boot");
  function fail(msg) {
    var d = document.createElement("div");
    d.setAttribute("role", "alert");
    d.className = "berlin-boot-error";
    d.textContent = "The map could not start: " + msg + " Keep all BERLIN files of this set together in one folder.";
    document.body.insertBefore(d, document.body.firstChild);
    if (box) box.hidden = true;
  }
  function run(J) {
    if (!J || J.v !== DATAV) { fail("BERLIN data.json does not match this page (version " + (J && J.v) + ", expected " + DATAV + ")."); return; }
    window.BERLIN_DATA_JSON = J;
    var s = document.createElement("script");
    s.src = "BERLIN%20app.js?v=" + APPV;
    s.onload = function () { if (box) box.hidden = true; document.documentElement.setAttribute("data-berlin-ready", "1"); };
    s.onerror = function () { fail("BERLIN app.js is missing."); };
    document.body.appendChild(s);
  }
  function fallback() {
    var s = document.createElement("script");
    s.src = "BERLIN%20data.js?v=" + DATAV;
    s.onload = function () { run(window.BERLIN_DATA_JSON); };
    s.onerror = function () { fail("BERLIN data.json / BERLIN data.js are missing."); };
    document.head.appendChild(s);
  }
  window.BERLIN_BOOT = {data: DATAV, app: APPV, source: ""};
  if ((location.protocol === "http:" || location.protocol === "https:") && window.fetch) {
    fetch("BERLIN%20data.json?v=" + DATAV, {credentials: "same-origin"})
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (J) { window.BERLIN_BOOT.source = "fetch"; run(J); })
      .catch(function () { window.BERLIN_BOOT.source = "script"; fallback(); });
  } else {
    window.BERLIN_BOOT.source = "script";
    fallback();
  }
})();
