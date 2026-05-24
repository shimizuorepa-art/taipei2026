/* dev-preview.js — Development-only switch and data reflection helper */
/* Loaded by both index.html and name-input.html in the preview package */

(function () {
  "use strict";

  const DEV_KEY = "rotary_dev_switch";
  const UPDATE_KEY = "rotary_person_names_updated_at";
  const CHANNEL_NAME = "rotary_person_names";

  function isDevMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") {
      localStorage.setItem(DEV_KEY, "1");
      return true;
    }
    return localStorage.getItem(DEV_KEY) === "1";
  }

  function buildToolbar() {
    if (!isDevMode()) return;

    const bar = document.createElement("div");
    bar.id = "dev-toolbar";
    bar.setAttribute("aria-label", "開発専用ツールバー");
    bar.style.cssText = [
      "position:fixed;bottom:0;left:0;right:0;z-index:9999",
      "display:flex;align-items:center;gap:6px;padding:6px 10px",
      "background:rgba(30,30,30,.92);color:#ccc;font-size:12px",
      "font-family:system-ui,sans-serif;max-width:100%;overflow-x:auto",
      "box-shadow:0 -1px 4px rgba(0,0,0,.3)",
    ].join(";");

    const label = document.createElement("span");
    label.textContent = "DEV";
    label.style.cssText = "font-weight:800;color:#f7a81b;flex-shrink:0";

    const btnStyle =
      "padding:4px 10px;border:1px solid #555;border-radius:4px;background:#333;color:#eee;font-size:11px;cursor:pointer;white-space:nowrap;flex-shrink:0";

    const btnDistrict = document.createElement("a");
    btnDistrict.textContent = "地区ナイト";
    btnDistrict.href = "/index.html?dev=1";
    btnDistrict.style.cssText = btnStyle + ";text-decoration:none";

    const btnInput = document.createElement("a");
    btnInput.textContent = "入力画面";
    btnInput.href = "/name-input.html?dev=1";
    btnInput.style.cssText = btnStyle + ";text-decoration:none";

    const btnReload = document.createElement("button");
    btnReload.textContent = "データ再読込";
    btnReload.type = "button";
    btnReload.style.cssText = btnStyle;
    btnReload.addEventListener("click", function () {
      if (typeof window.__devReloadPersonNames === "function") {
        window.__devReloadPersonNames();
        btnReload.textContent = "再読込中…";
        setTimeout(function () { btnReload.textContent = "データ再読込"; }, 1500);
      } else {
        window.location.reload();
      }
    });

    const btnOff = document.createElement("button");
    btnOff.textContent = "OFF";
    btnOff.type = "button";
    btnOff.style.cssText = btnStyle + ";color:#f55";
    btnOff.addEventListener("click", function () {
      localStorage.removeItem(DEV_KEY);
      bar.remove();
    });

    bar.appendChild(label);
    bar.appendChild(btnDistrict);
    bar.appendChild(btnInput);
    bar.appendChild(btnReload);
    bar.appendChild(btnOff);
    document.body.appendChild(bar);
  }

  /* ── Data Reflection: sender (name-input side) ── */

  window.__devNotifyPersonNamesUpdated = function () {
    localStorage.setItem(UPDATE_KEY, String(Date.now()));
    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.postMessage({ type: "updated" });
      ch.close();
    } catch (_) { /* BroadcastChannel not supported */ }
  };

  /* ── Data Reflection: receiver (district-night side) ── */

  function setupReceiver() {
    if (typeof window.__devReloadPersonNames !== "function") return;

    window.addEventListener("storage", function (e) {
      if (e.key === UPDATE_KEY && e.newValue) {
        window.__devReloadPersonNames();
      }
    });

    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.addEventListener("message", function (e) {
        if (e.data && e.data.type === "updated") {
          window.__devReloadPersonNames();
        }
      });
    } catch (_) { /* BroadcastChannel not supported */ }
  }

  /* ── Init ── */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      buildToolbar();
      setupReceiver();
    });
  } else {
    buildToolbar();
    setupReceiver();
  }
})();
