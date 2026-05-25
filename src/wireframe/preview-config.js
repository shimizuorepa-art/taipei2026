/* preview-config.js — Preview-only production data isolation layer */
/* Must be loaded BEFORE app.js and name-input.js */

(function () {
  "use strict";

  var PRODUCTION_HOST = "asia-northeast1-orepasystem-343204.cloudfunctions.net";
  var PREVIEW_STORAGE_KEY = "rotary_preview_person_names_v1";
  var PREVIEW_EVENT_ID = "district-night-2026-preview";
  var PREVIEW_LOCAL_BASE = window.location.origin + "/__preview_api__";
  var PREVIEW_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNNHtS2yW0fOTIoPN3f1G43kHUeqzdNmWk2LGw2IXal6mhnzPTUZmSPXABhd-rXm5hRw/exec";

  function isProductionUrl(url) {
    return String(url).indexOf(PRODUCTION_HOST) !== -1;
  }

  /* ── Phase 1: Block production Cloud Functions ── */

  /* If owner has deployed an Apps Script Web App, set this URL */
  var configuredEndpoint = window.PREVIEW_PERSON_NAMES_API_URL || PREVIEW_APPS_SCRIPT_URL || "";

  if (configuredEndpoint && !isProductionUrl(configuredEndpoint)) {
    /* Use configured preview endpoint (Apps Script sandbox) */
    window.PERSON_NAMES_API_URL = configuredEndpoint;
    console.info("[preview] Using configured preview endpoint:", configuredEndpoint);
  } else {
    if (configuredEndpoint && isProductionUrl(configuredEndpoint)) {
      console.error("[preview] BLOCKED: PREVIEW_PERSON_NAMES_API_URL points to production. Falling back to localStorage.");
    }
    /* No valid preview endpoint — use same-origin placeholder for safe URL parsing */
    window.PERSON_NAMES_API_URL = PREVIEW_LOCAL_BASE;
    console.info("[preview] No preview endpoint configured. Using localStorage fallback.");
  }

  /* ── Phase 4: localStorage adapter for name-input ── */

  function loadPreviewNames() {
    try {
      var raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function savePreviewNames(data) {
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(data));
    } catch (_) { /* ignore quota */ }
  }

  function buildPayloadFromStorage() {
    var stored = loadPreviewNames();
    var tables = {};
    for (var k in stored) {
      if (!stored.hasOwnProperty(k)) continue;
      var parts = k.split("-");
      var tableId = parts[0];
      var seat = parseInt(parts[1], 10);
      var entry = stored[k];
      if (!entry.surname && !entry.given) continue;
      if (!tables[tableId]) tables[tableId] = [];
      var person = [entry.surname, entry.given].filter(Boolean).join(" ");
      tables[tableId].push({ seat: seat, surname: entry.surname || "", given: entry.given || "", person: person });
    }
    for (var t in tables) {
      if (tables.hasOwnProperty(t)) {
        tables[t].sort(function (a, b) { return a.seat - b.seat; });
      }
    }
    return { version: 1, generated_at: new Date().toISOString(), tables: tables };
  }

  function handleLocalPost(body) {
    var data = typeof body === "string" ? JSON.parse(body) : body;
    var stored = loadPreviewNames();
    if (data.tables) {
      for (var tableId in data.tables) {
        if (!data.tables.hasOwnProperty(tableId)) continue;
        var rows = data.tables[tableId];
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var key = tableId + "-" + row.seat;
          stored[key] = { surname: row.surname || "", given: row.given || "" };
        }
      }
    }
    savePreviewNames(stored);
    return { ok: true };
  }

  function handleLocalDelete(tableId, seat) {
    if (tableId && seat) {
      var stored = loadPreviewNames();
      delete stored[tableId + "-" + seat];
      savePreviewNames(stored);
    }
    return { ok: true };
  }

  function parseDeleteParams(url) {
    /* Extract table and seat from URL query string or POST body */
    try {
      var u = new URL(url);
      return { table: u.searchParams.get("table"), seat: u.searchParams.get("seat") };
    } catch (_) {
      return { table: null, seat: null };
    }
  }

  /* Override fetch for preview-local mode */
  var isLocalMode = window.PERSON_NAMES_API_URL === PREVIEW_LOCAL_BASE;
  if (isLocalMode) {
    var originalFetch = window.fetch;

    window.fetch = function (url, opts) {
      var urlStr = typeof url === "string" ? url : url.toString();

      /* Guard: never allow production URL (covers query string variants) */
      if (isProductionUrl(urlStr)) {
        console.error("[preview] BLOCKED: attempt to call production Cloud Functions");
        return Promise.reject(new Error("Production API is blocked in preview mode"));
      }

      /* Intercept preview-local requests */
      if (urlStr.indexOf("/__preview_api__") !== -1) {
        var method = (opts && opts.method) ? opts.method.toUpperCase() : "GET";

        if (method === "GET") {
          var payload = buildPayloadFromStorage();
          return Promise.resolve(new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }));
        }
        if (method === "POST") {
          var result = handleLocalPost(opts.body);
          return Promise.resolve(new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }));
        }
        if (method === "DELETE") {
          var params = parseDeleteParams(urlStr);
          var delResult = handleLocalDelete(params.table, params.seat);
          return Promise.resolve(new Response(JSON.stringify(delResult), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }));
        }
      }

      /* Pass through all other requests */
      return originalFetch.apply(window, arguments);
    };

    /* Also intercept XMLHttpRequest for name-input.js requestJson fallback */
    var OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      var xhr = new OrigXHR();
      var origOpen = xhr.open.bind(xhr);
      var origSend = xhr.send.bind(xhr);
      var intercepted = false;
      var interceptMethod = "GET";
      var interceptUrl = "";

      xhr.open = function (method, url) {
        var urlStr = String(url);
        if (isProductionUrl(urlStr)) {
          console.error("[preview] BLOCKED: XHR attempt to call production Cloud Functions");
          intercepted = true;
          return;
        }
        if (urlStr.indexOf("/__preview_api__") !== -1) {
          intercepted = true;
          interceptMethod = method.toUpperCase();
          interceptUrl = urlStr;
          return;
        }
        return origOpen.apply(xhr, arguments);
      };

      xhr.send = function (body) {
        if (intercepted) {
          var responseData;
          if (interceptMethod === "GET") {
            responseData = buildPayloadFromStorage();
          } else if (interceptMethod === "POST") {
            responseData = handleLocalPost(body);
          } else if (interceptMethod === "DELETE") {
            var delParams = parseDeleteParams(interceptUrl);
            responseData = handleLocalDelete(delParams.table, delParams.seat);
          } else {
            responseData = { ok: true };
          }
          Object.defineProperty(xhr, "readyState", { get: function () { return 4; } });
          Object.defineProperty(xhr, "status", { get: function () { return 200; } });
          Object.defineProperty(xhr, "responseText", { get: function () { return JSON.stringify(responseData); } });
          setTimeout(function () {
            if (typeof xhr.onreadystatechange === "function") xhr.onreadystatechange();
          }, 0);
          return;
        }
        return origSend.apply(xhr, arguments);
      };

      return xhr;
    };

    /* Show preview notice */
    document.addEventListener("DOMContentLoaded", function () {
      var notice = document.createElement("div");
      notice.style.cssText = [
        "position:fixed;top:0;left:0;right:0;z-index:9998",
        "padding:4px 12px;text-align:center",
        "background:#fff3cd;color:#856404;font-size:11px;font-weight:700",
        "border-bottom:1px solid #ffc107",
      ].join(";");
      notice.textContent = "PREVIEW MODE — データはこのブラウザのlocalStorageに保存されます（本番データには影響しません）";
      document.body.appendChild(notice);
    });
  }

  /* ── Apps Script endpoint mode: convert DELETE to POST action ── */
  if (!isLocalMode && configuredEndpoint && !isProductionUrl(configuredEndpoint)) {
    var origFetchForEndpoint = window.fetch;
    window.fetch = function (url, opts) {
      var urlStr = typeof url === "string" ? url : url.toString();

      /* Guard: block production even in endpoint mode */
      if (isProductionUrl(urlStr)) {
        console.error("[preview] BLOCKED: attempt to call production Cloud Functions");
        return Promise.reject(new Error("Production API is blocked in preview mode"));
      }

      /* Convert HTTP DELETE to POST { action: "delete_name" } for Apps Script */
      var method = (opts && opts.method) ? opts.method.toUpperCase() : "GET";
      if (method === "DELETE" && urlStr.indexOf(configuredEndpoint) !== -1) {
        var params = parseDeleteParams(urlStr);
        return origFetchForEndpoint(configuredEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ action: "delete_name", table: params.table, seat: parseInt(params.seat, 10) })
        });
      }

      return origFetchForEndpoint.apply(window, arguments);
    };

    window.__devReloadPersonNames = function () {
      if (typeof window.loadPersonNamesFromApi === "function") {
        return window.loadPersonNamesFromApi();
      }
      window.location.reload();
      return Promise.resolve();
    };
  }

  /* ── Also expose preview data for district-night app.js ── */

  /* app.js checks window.PERSON_NAMES_PAYLOAD — provide it from preview storage */
  if (isLocalMode) {
    window.PERSON_NAMES_PAYLOAD = buildPayloadFromStorage();

    /* Reload hook for dev-preview.js */
    window.__devReloadPersonNames = function () {
      window.PERSON_NAMES_PAYLOAD = buildPayloadFromStorage();
      if (typeof window.applyPersonNamePayload === "function") {
        window.applyPersonNamePayload(window.PERSON_NAMES_PAYLOAD);
      }
      if (typeof window.render === "function") {
        window.render();
      }
    };
  }
})();
