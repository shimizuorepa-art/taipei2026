/* ── name-input.js: 氏名入力フォーム (Cloud Functions DB API) ── */

"use strict";

const PERSON_NAMES_API_URL = window.PERSON_NAMES_API_URL
  || "https://asia-northeast1-orepasystem-343204.cloudfunctions.net/district-night-name-input";
const PERSON_NAMES_EVENT_ID = "district-night-2026";

function requestJson(url, options) {
  const opts = options || {};
  if (typeof fetch === "function") {
    return fetch(url, opts).then((response) => {
      if (!response.ok) throw new Error(`氏名APIリクエストに失敗しました (${response.status})`);
      return response.json();
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method || "GET", url, true);
    if (opts.headers) {
      for (const [key, value] of Object.entries(opts.headers)) xhr.setRequestHeader(key, value);
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`氏名APIリクエストに失敗しました (${xhr.status})`));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText || "{}"));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("氏名APIリクエストに失敗しました"));
    xhr.send(opts.body || null);
  });
}

/* ── Data (sourced from app.js; kept in sync manually) ── */

const NI_EXCLUDED_TABLES = { "2": true, "3": true, "4": true };

const NI_CLUB_SEATING = {
  "愛知三州": {"38":[6,7,8,9,10]},
  "愛知長久手": {"20":[1,2,3,4,5,6],"26":[1,2,3,4,5]},
  "渥美": {"57":[6,7,8,9,10]},
  "あま": {"19":[3,4]},
  "一宮中央": {"23":[1,2,3,4,5,6,7,8]},
  "稲沢": {"10":[1,2,3,4,5,6,7,8]},
  "犬山": {"22":[1,2,3,4,5,6,7,8,9,10],"28":[1,2]},
  "岩倉": {"28":[5,6,7,8,9,10]},
  "岡崎": {"25":[1,2,3,4,5,6,7,8,9,10],"31":[1,2,3,4,5,6,7,8,9]},
  "岡崎南": {"29":[1,2,3,4,5,6,7]},
  "尾張旭": {"23":[9,10]},
  "尾張中央": {"5":[4,5,6,7,8,9,10],"11":[1,2,3,4,5,6,7,8,9,10]},
  "春日井": {"36":[1,2,3,4,5],"42":[1,2,3,4,5,6]},
  "刈谷": {"44":[1,2,3,4,5]},
  "江南": {"16":[5,6,7,8,9,10]},
  "小牧": {"28":[3,4]},
  "新城": {"43":[10]},
  "瀬戸": {"16":[1,2,3,4],"17":[1,2,3,4,5,6,7,8,9,10]},
  "瀬戸北": {"9":[6,7,8,9],"10":[9,10],"15":[7,8,9,10],"21":[1,2,3,4,5,6,7,8,9,10],"27":[1,2,3,4]},
  "高浜": {"35":[6,7,8,9,10],"41":[5,6,7,8,9,10]},
  "田原": {"57":[2,3,4,5]},
  "田原パシフィック": {"47":[8,9,10]},
  "知立": {"46":[8,9,10],"51":[1,2,3,4,5,6,7,8,9,10],"52":[1,2,3,4,5,6,7,8,9,10]},
  "豊川": {"53":[1,2,3,4,5,6,7,8,9,10]},
  "豊川宝飯": {"56":[1,2,3,4,5,6,7]},
  "豐田": {"32":[1,2,3,4,5,6,7,8,9,10],"37":[1,2,3,4,5,6,7],"38":[1,2,3,4,5],"43":[1,2,3,4,5,6,7,8,9]},
  "豊田中": {"37":[8,9,10]},
  "豊田西": {"33":[1,2,3,4,5,6,7],"34":[1,2,3,4,5,6,7,8,9,10]},
  "豐田東": {"31":[10]},
  "豊田三好": {"33":[8,9,10]},
  "豊橋": {"49":[1,2,3,4,5,6,7,8,9,10],"50":[1,2,3,4,5,6,7,8,9,10],"54":[1,2,3,4,5,6],"55":[1,2,3,4,5]},
  "豊橋北": {"57":[1]},
  "豊橋東": {"56":[8,9,10]},
  "豊橋南": {"54":[7,8,9,10],"55":[6,7,8,9,10]},
  "名古屋アイリス": {"26":[10]},
  "名古屋北": {"14":[1,2,3]},
  "名古屋清須": {"1":[8]},
  "名古屋空港": {"9":[1,2,3,4,5],"15":[1,2,3,4,5,6]},
  "名古屋栄": {"1":[1,2,3,4]},
  "名古屋城北": {"27":[5,6,7,8,9,10]},
  "名古屋昭和": {"19":[9,10]},
  "名古屋千種": {"45":[1,2,3,4,5,6,7,8,9,10],"46":[1,2,3,4,5,6,7]},
  "名古屋東南": {"24":[7,8,9,10],"30":[1,2,3,4,5,6,7,8,9,10]},
  "名古屋中": {"18":[6,7,8,9,10]},
  "名古屋錦": {"19":[5],"48":[6,7,8,9,10]},
  "名古屋東": {"13":[1,2,3,4,5,6,7,8,9,10],"14":[4,5,6,7,8,9,10]},
  "名古屋東山": {"19":[6]},
  "名古屋瑞穂": {"19":[1,2]},
  "名古屋みなと": {"18":[1,2,3,4,5],"24":[1,2,3,4,5,6]},
  "名古屋南": {"1":[5,6,7],"6":[1,2,3,4,5,6,7,8,9,10],"7":[1,2,3,4,5,6,7,8,9,10],"12":[1,2,3,4,5,6,7,8,9,10]},
  "名古屋名駅": {"8":[1,2,3,4,5,6,7,8,9,10]},
  "名古屋名東": {"47":[1,2,3,4,5,6,7]},
  "名古屋名北": {"19":[7,8]},
  "名古屋守山": {"36":[6,7,8,9,10],"42":[7,8,9,10],"48":[1,2,3,4,5]},
  "名古屋和合": {"20":[7,8,9,10],"26":[6,7,8,9]},
  "西尾": {"39":[1,2,3,4,5,6],"40":[1,2,3,4,5,6,7,8,9,10],"44":[6,7,8,9,10]},
  "西尾一色": {"29":[8,9,10],"35":[1,2,3,4,5],"41":[1,2,3,4]},
  "西尾KIRARA": {"39":[7,8,9,10]},
  "半田": {"1":[9,10],"5":[1,2]},
  "半田南": {"5":[3]},
  "東知多": {"9":[10]},
  "蒲郡": {"S1":[1,2,3,4,5,6,7,8,9,10],"S2":[1,2,3,4,5,6,7,8,9,10],"S3":[1,2,3,4,5,6,7,8,9,10],"S4":[1,2,3,4,5,6,7,8,9,10],"S5":[1,2,3,4,5,6,7,8,9,10]},
};

/* Reading-based sort (synced from app.js clubNameReadings) */
const NI_CLUB_READINGS = {
  "愛知三州": "あいちさんしゅう",
  "愛知長久手": "あいちながくて",
  "渥美": "あつみ",
  "あま": "あま",
  "一宮中央": "いちのみやちゅうおう",
  "稲沢": "いなざわ",
  "犬山": "いぬやま",
  "岩倉": "いわくら",
  "岡崎": "おかざき",
  "岡崎南": "おかざきみなみ",
  "尾張旭": "おわりあさひ",
  "尾張中央": "おわりちゅうおう",
  "春日井": "かすがい",
  "蒲郡": "がまごおり",
  "刈谷": "かりや",
  "江南": "こうなん",
  "小牧": "こまき",
  "新城": "しんしろ",
  "瀬戸": "せと",
  "瀬戸北": "せときた",
  "高浜": "たかはま",
  "田原": "たはら",
  "田原パシフィック": "たはらぱしふぃっく",
  "知立": "ちりゅう",
  "豊川": "とよかわ",
  "豊川宝飯": "とよかわほい",
  "豐田": "とよた",
  "豊田中": "とよたなか",
  "豊田西": "とよたにし",
  "豐田東": "とよたひがし",
  "豊田三好": "とよたみよし",
  "豊橋": "とよはし",
  "豊橋北": "とよはしきた",
  "豊橋東": "とよはしひがし",
  "豊橋南": "とよはしみなみ",
  "名古屋アイリス": "なごやあいりす",
  "名古屋北": "なごやきた",
  "名古屋清須": "なごやきよす",
  "名古屋空港": "なごやくうこう",
  "名古屋栄": "なごやさかえ",
  "名古屋城北": "なごやじょうほく",
  "名古屋昭和": "なごやしょうわ",
  "名古屋千種": "なごやちくさ",
  "名古屋東南": "なごやとうなん",
  "名古屋中": "なごやなか",
  "名古屋錦": "なごやにしき",
  "名古屋東": "なごやひがし",
  "名古屋東山": "なごやひがしやま",
  "名古屋瑞穂": "なごやみずほ",
  "名古屋みなと": "なごやみなと",
  "名古屋南": "なごやみなみ",
  "名古屋名駅": "なごやめいえき",
  "名古屋名東": "なごやめいとう",
  "名古屋名北": "なごやめいほく",
  "名古屋守山": "なごやもりやま",
  "名古屋和合": "なごやわごう",
  "西尾": "にしお",
  "西尾一色": "にしおいっしき",
  "西尾KIRARA": "にしおきらら",
  "半田": "はんだ",
  "半田南": "はんだみなみ",
  "東知多": "ひがしちた",
};

const NI_COLLATOR = new Intl.Collator("ja", { usage: "sort", sensitivity: "base", numeric: true });

function niClubSortKey(name) {
  if (name === "あま") return "ああま";
  return NI_CLUB_READINGS[name] || name;
}

/* table 1 seat display names (from specialTableData["1"]) */
const NI_TABLE1_NAMES = {
  1: "名古屋栄", 2: "名古屋栄", 3: "名古屋栄", 4: "名古屋栄",
  5: "名古屋南", 6: "名古屋南", 7: "名古屋南",
  8: "名古屋清須", 9: "半田", 10: "半田",
};

/* Venue map layout (from app.js) */
const NI_TABLE_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29],
  [30, 31, 32, 33, 34, 35],
  [36, 37, 38, 39, 40, 41],
  [42, 43, 44, 45, 46, 47],
  [48, 49, 50, 51, 52, 53],
  [54, 55, 56, 57],
];
const NI_SKY_TABLES = ["S1", "S2", "S3", "S4", "S5"];

/* ── State ── */

const STORAGE_KEY = "rotary_name_input_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveState(st) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  } catch (_) { /* ignore quota errors */ }
}

/* state shape: { "tableId-seat": { surname: "", given: "" } } */
let state = loadState();
let remoteBaseline = {};
let isRemoteLoading = false;
let isSaving = false;
let remoteError = "";

/* ── Helpers ── */

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stateKey(tableId, seat) {
  return `${tableId}-${seat}`;
}

function splitStateKey(k) {
  const [tableId, seatStr] = k.split("-");
  return { tableId, seat: parseInt(seatStr, 10) };
}

function getEntry(tableId, seat) {
  return state[stateKey(tableId, seat)] || { surname: "", given: "" };
}

function setEntry(tableId, seat, surname, given) {
  const k = stateKey(tableId, seat);
  if (!surname && !given) {
    const next = Object.assign({}, state);
    delete next[k];
    state = next;
  } else {
    state = Object.assign({}, state, { [k]: { surname: surname.trim(), given: given.trim() } });
  }
  lastEditedTable = tableId;
  saveState(state);
}

function clearEntry(tableId, seat) {
  setEntry(tableId, seat, "", "");
}

function getPhysicalSeatCount(tableId) {
  let max = 0;
  for (const tables of Object.values(NI_CLUB_SEATING)) {
    const seats = tables[tableId];
    if (seats) for (const s of seats) { if (s > max) max = s; }
  }
  return max < 10 ? 10 : max;
}

function eligibleClubs() {
  const clubs = [];
  for (const [club, tables] of Object.entries(NI_CLUB_SEATING)) {
    const hasEligible = Object.keys(tables).some((t) => !NI_EXCLUDED_TABLES[t]);
    if (hasEligible) clubs.push(club);
  }
  return clubs.sort((a, b) => {
    const byReading = NI_COLLATOR.compare(niClubSortKey(a), niClubSortKey(b));
    return byReading || NI_COLLATOR.compare(a, b);
  });
}

function seatDisplayName(tableId, seat) {
  if (tableId === "1") return NI_TABLE1_NAMES[seat] || "";
  return "";
}

function clubEligibleSeats(club) {
  const tables = NI_CLUB_SEATING[club] || {};
  const result = {};
  for (const [t, seats] of Object.entries(tables)) {
    if (!NI_EXCLUDED_TABLES[t]) result[t] = seats;
  }
  return result;
}

function clubStateKeys(club) {
  const keys = [];
  for (const [tableId, seats] of Object.entries(clubEligibleSeats(club))) {
    for (const seat of seats) keys.push(stateKey(tableId, seat));
  }
  return keys;
}

function payloadToState(payload) {
  const next = {};
  if (!payload || !payload.tables) return next;
  for (const [tableId, entries] of Object.entries(payload.tables)) {
    if (NI_EXCLUDED_TABLES[tableId] || !Array.isArray(entries)) continue;
    for (const entry of entries) {
      const seat = parseInt(entry.seat, 10);
      if (!seat) continue;
      const surname = String(entry.surname || "").trim();
      const given = String(entry.given || "").trim();
      if (!surname && !given && entry.person) {
        next[stateKey(tableId, seat)] = { surname: String(entry.person).trim(), given: "" };
      } else if (surname || given) {
        next[stateKey(tableId, seat)] = { surname, given };
      }
    }
  }
  return next;
}

async function refreshRemoteNames() {
  isRemoteLoading = true;
  remoteError = "";
  try {
    const payload = await requestJson(PERSON_NAMES_API_URL, {
      method: "GET",
      cache: "no-store",
    });
    remoteBaseline = payloadToState(payload);
    state = Object.assign({}, remoteBaseline);
    saveState(state);
  } catch (err) {
    remoteError = err && err.message ? err.message : "氏名データ取得に失敗しました";
    console.warn(err);
  } finally {
    isRemoteLoading = false;
  }
}

async function openEditorForClub(club) {
  selectedClub = club;
  clubFilter = "";
  focusedTable = null;
  focusedSeat = null;
  currentScreen = "loading";
  render();
  await refreshRemoteNames();
  currentScreen = "editor";
  render();
}

function entryCount() {
  return Object.values(state).filter((e) => e.surname || e.given).length;
}

/* ── Export ── */

function buildExportJson(club) {
  const allowedKeys = club ? new Set(clubStateKeys(club)) : null;
  const tables = {};
  for (const [k, entry] of Object.entries(state)) {
    if (allowedKeys && !allowedKeys.has(k)) continue;
    if (!entry.surname && !entry.given) continue;
    const [tableId, seatStr] = k.split("-");
    if (NI_EXCLUDED_TABLES[tableId]) continue;
    const seat = parseInt(seatStr, 10);
    const surname = String(entry.surname || "").trim();
    const given = String(entry.given || "").trim();
    const person = [surname, given].filter(Boolean).join(" ");
    if (!tables[tableId]) tables[tableId] = [];
    tables[tableId].push({ seat, surname, given, person });
  }
  for (const entries of Object.values(tables)) {
    entries.sort((a, b) => a.seat - b.seat);
  }
  return {
    version: 1,
    generated_at: new Date().toISOString(),
    tables,
  };
}

function buildPostJson(club) {
  const exported = buildExportJson(club);
  return {
    event_id: PERSON_NAMES_EVENT_ID,
    club,
    tables: exported.tables,
  };
}

function deletedRemoteEntriesForClub(club) {
  return clubStateKeys(club)
    .filter((k) => remoteBaseline[k] && !state[k])
    .map(splitStateKey);
}

async function postClubNames(club) {
  const body = buildPostJson(club);
  const hasRows = Object.values(body.tables).some((rows) => rows.length > 0);
  if (!hasRows) return { ok: true, skippedPost: true };
  return requestJson(PERSON_NAMES_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
}

async function deleteSeatName(tableId, seat) {
  const url = new URL(PERSON_NAMES_API_URL);
  url.searchParams.set("table", tableId);
  url.searchParams.set("seat", String(seat));
  return requestJson(url.toString(), { method: "DELETE" });
}

async function submitSelectedClub() {
  if (!selectedClub || isSaving) return;
  isSaving = true;
  remoteError = "";
  renderConfirm();
  try {
    await postClubNames(selectedClub);
    const deletes = deletedRemoteEntriesForClub(selectedClub);
    for (const item of deletes) {
      await deleteSeatName(item.tableId, item.seat);
    }
    await refreshRemoteNames();
    if (typeof window.__devNotifyPersonNamesUpdated === "function") {
      window.__devNotifyPersonNamesUpdated();
    }
    currentScreen = "complete";
    render();
  } catch (err) {
    remoteError = err && err.message ? err.message : "登録に失敗しました";
    console.warn(err);
    renderConfirm();
  } finally {
    isSaving = false;
  }
}

/* ── DOM refs ── */

const niApp = document.getElementById("ni-app");
const niSide = document.getElementById("ni-side");
const niDrawer = document.getElementById("ni-drawer");
let currentScreen = "search";
let selectedClub = null;
let clubFilter = "";
let focusedTable = null;
let focusedSeat = null;
let mapOpen = true;
let drawerExpanded = false;
let lastEditedTable = null;

function isMobile() {
  return window.innerWidth < 860;
}

function render() {
  if (currentScreen === "search") renderSearch();
  else if (currentScreen === "loading") renderLoading();
  else if (currentScreen === "editor") renderEditor();
  else if (currentScreen === "confirm") renderConfirm();
  else if (currentScreen === "complete") renderComplete();
}

/* ── Venue Map Builder ── */

function buildInlineMap() {
  const clubTables = selectedClub ? new Set(Object.keys(clubEligibleSeats(selectedClub))) : null;
  const clubAllTables = selectedClub && NI_CLUB_SEATING[selectedClub] ? new Set(Object.keys(NI_CLUB_SEATING[selectedClub])) : null;

  function cellHtml(num) {
    const id = String(num);
    const isHighlighted = clubTables && clubTables.has(id);
    const isClubAll = clubAllTables && clubAllTables.has(id);
    const isSelected = focusedTable === id;
    let cls = "ni-map-cell";
    if (isSelected) cls += " is-selected";
    else if (isHighlighted || isClubAll) cls += " is-highlighted";

    let seatChips = "";
    if (isSelected) {
      const clubSeats = (selectedClub && NI_CLUB_SEATING[selectedClub] && NI_CLUB_SEATING[selectedClub][id]) || [];
      const clubSeatSet = new Set(clubSeats);
      const maxSeats = 10;
      const radius = 38;
      const chips = [];
      for (let s = 1; s <= maxSeats; s++) {
        const angle = (2 * Math.PI * (s - 1)) / maxSeats - Math.PI / 2;
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius);
        const entry = getEntry(id, s);
        const hasName = !!(entry.surname || entry.given);
        const isActive = s === focusedSeat;
        const isClubSeat = clubSeatSet.has(s);
        let chipCls = "ni-seat-chip";
        if (isActive) chipCls += " is-active";
        else if (hasName) chipCls += " has-name";
        else if (isClubSeat) chipCls += " is-club";
        else chipCls += " is-muted";
        chips.push(`<span class="${chipCls}" style="transform:translate(${x}px,${y}px)">${s}</span>`);
      }
      seatChips = `<div class="ni-seat-chips">${chips.join("")}</div>`;
    }

    return `<div class="${cls}" data-map-table="${escHtml(id)}">${id}${seatChips}</div>`;
  }

  const mainRows = NI_TABLE_ROWS.map((row) => {
    const cells = row.map(cellHtml).join("");
    return `<div class="ni-map-row ni-map-row-${row.length}">${cells}</div>`;
  });

  function skyCellHtml(id) {
    const isHighlighted = clubAllTables && clubAllTables.has(id);
    const isSelected = focusedTable === id;
    let cls = "ni-map-cell";
    if (isSelected) cls += " is-selected";
    else if (isHighlighted) cls += " is-highlighted";

    let seatChips = "";
    if (isSelected) {
      const clubSeats = (selectedClub && NI_CLUB_SEATING[selectedClub] && NI_CLUB_SEATING[selectedClub][id]) || [];
      const clubSeatSet = new Set(clubSeats);
      const maxSeats = 10;
      const radius = 38;
      const chips = [];
      for (let s = 1; s <= maxSeats; s++) {
        const angle = (2 * Math.PI * (s - 1)) / maxSeats - Math.PI / 2;
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius);
        const entry = getEntry(id, s);
        const hasName = !!(entry.surname || entry.given);
        const isActive = s === focusedSeat;
        const isClubSeat = clubSeatSet.has(s);
        let chipCls = "ni-seat-chip";
        if (isActive) chipCls += " is-active";
        else if (hasName) chipCls += " has-name";
        else if (isClubSeat) chipCls += " is-club";
        else chipCls += " is-muted";
        chips.push(`<span class="${chipCls}" style="transform:translate(${x}px,${y}px)">${s}</span>`);
      }
      seatChips = `<div class="ni-seat-chips">${chips.join("")}</div>`;
    }

    return `<div class="${cls}" data-map-table="${escHtml(id)}" style="position:relative">${id}${seatChips}</div>`;
  }
  /* 3-column grid matching app.js canonical layout: S2 above S1, S4 above S3, spacer/S5 */
  const skyCells = [
    skyCellHtml("S2"), skyCellHtml("S4"), `<div class="ni-sky-spacer" aria-hidden="true"></div>`,
    skyCellHtml("S1"), skyCellHtml("S3"), skyCellHtml("S5"),
  ].join("");

  const selectionInfo = focusedTable
    ? `<div class="ni-map-selection">
        <span class="ni-map-selection-badge">${escHtml(focusedTable)}</span>
        現在選択中: ${selectedClub ? `${escHtml(selectedClub)} / ` : ""}${escHtml(focusedTable)}番テーブル${focusedSeat !== null ? ` / ${focusedSeat}番席` : ""}
      </div>`
    : (selectedClub ? `<div class="ni-map-selection">表示中: ${escHtml(selectedClub)} の対象テーブル</div>` : "");

  return `
    <div class="ni-map-panel">
      <div class="ni-map-header" id="ni-map-toggle">
        会場図${focusedTable ? ` — ${focusedTable}番` : ""}
        <span class="ni-map-header-arrow${mapOpen ? " is-open" : ""}">▼</span>
      </div>
      ${mapOpen ? `
        <div class="ni-map-body">
          ${selectionInfo}
          <div class="ni-map-scroll" id="ni-map-scroll">
            <div class="ni-map-inner">
              <div class="ni-map-label">ステージ側</div>
              <div class="ni-map-main">${mainRows.join("")}</div>
              <div class="ni-map-markers">
                <span class="ni-map-marker ni-map-marker-toilet">↓ トイレ</span>
                <span class="ni-map-marker ni-map-marker-entrance-top">出入り口 →</span>
                <span class="ni-map-marker ni-map-marker-entrance-bottom">出入り口 →</span>
              </div>
              <div class="ni-map-label ni-map-label-sky">Sky Lounge</div>
              <div class="ni-sky-layout">
                <div class="ni-sky-stage-label">ステージ</div>
                <div class="ni-sky-grid">${skyCells}</div>
              </div>
            </div>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function bindMapEvents(container) {
  const toggle = container.querySelector("#ni-map-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      mapOpen = !mapOpen;
      renderSide();
    });
  }

  /* Map cells are read-only — no click handlers. Selection is controlled only from seat row clicks. */
}

function buildDrawerSummary() {
  if (focusedTable) {
    const text = `${selectedClub ? `${escHtml(selectedClub)} / ` : ""}${escHtml(focusedTable)}番テーブル${focusedSeat !== null ? ` / ${focusedSeat}番席` : ""}`;
    return text;
  }
  if (selectedClub) return `${escHtml(selectedClub)} の対象テーブル`;
  return "会場図";
}

function renderDrawer() {
  if (currentScreen !== "search" && currentScreen !== "editor") {
    niDrawer.innerHTML = "";
    niDrawer.className = "ni-drawer";
    niApp.classList.remove("has-drawer");
    return;
  }
  niApp.classList.add("has-drawer");
  const arrowCls = drawerExpanded ? " is-open" : "";
  const drawerCls = drawerExpanded ? "ni-drawer is-expanded" : "ni-drawer is-collapsed";
  const mapHtml = buildInlineMap();

  niDrawer.className = drawerCls;
  niDrawer.innerHTML = `
    <div class="ni-drawer-header" id="ni-drawer-toggle">
      <span class="ni-drawer-header-text">${buildDrawerSummary()}</span>
      <span class="ni-drawer-header-arrow${arrowCls}">▲</span>
    </div>
    ${drawerExpanded ? `<div class="ni-drawer-body">${mapHtml}</div>` : ""}
  `;

  const toggle = niDrawer.querySelector("#ni-drawer-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      drawerExpanded = !drawerExpanded;
      renderDrawer();
    });
  }
  if (drawerExpanded) {
    bindMapEvents(niDrawer);
    if (!focusedTable) centerMapScroll(niDrawer);
  }
}

function renderSide() {
  if (isMobile()) {
    niSide.innerHTML = "";
    renderDrawer();
    return;
  }
  niDrawer.innerHTML = "";
  niDrawer.className = "ni-drawer";
  niApp.classList.remove("has-drawer");

  if (currentScreen === "search") {
    niSide.innerHTML = buildInlineMap();
    bindMapEvents(niSide);
    if (!focusedTable) centerMapScroll(niSide);
    return;
  }
  if (currentScreen === "editor") {
    niSide.innerHTML = buildInlineMap();
    bindMapEvents(niSide);
    if (!focusedTable) centerMapScroll(niSide);
    return;
  }
  niSide.innerHTML = "";
}

function highlightEditorRows() {
  niApp.querySelectorAll(".ni-seat-row").forEach((row) => {
    const k = row.dataset.key;
    if (!k) return;
    const [tId, sStr] = k.split("-");
    const s = parseInt(sStr, 10);
    const isFocused = focusedTable === tId && (focusedSeat === null || focusedSeat === s);
    row.classList.toggle("is-focused", isFocused);
  });
}

function centerMapScroll(container) {
  const mapScroll = container ? container.querySelector("#ni-map-scroll") : document.getElementById("ni-map-scroll");
  if (!mapScroll) return;
  mapScroll.scrollLeft = (mapScroll.scrollWidth - mapScroll.clientWidth) / 2;
}

function scrollMapToTable(tableId) {
  const mapScroll = document.getElementById("ni-map-scroll");
  if (!mapScroll) return;
  const cell = mapScroll.querySelector(`[data-map-table="${tableId}"]`);
  if (!cell) return;
  cell.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}

/* ── Screen: Club Search ── */

function remoteNoticeHtml() {
  if (remoteError) return `<p class="ni-notice">${escHtml(remoteError)}</p>`;
  return "";
}

let clubSearchMode = "select"; /* "select" or "type" */

function renderSearch() {
  const clubs = eligibleClubs();

  function buildClubListHtml(filter) {
    const query = (filter || "").toLowerCase();
    const filtered = query ? clubs.filter((c) => c.toLowerCase().includes(query)) : clubs;
    return filtered.length
      ? filtered.map((c) => `<li class="ni-club-item${c === selectedClub ? " selected" : ""}" data-club="${escHtml(c)}">${escHtml(c)}</li>`).join("")
      : `<li class="ni-empty">該当するクラブがありません</li>`;
  }

  const selectChecked = clubSearchMode === "select" ? "checked" : "";
  const typeChecked = clubSearchMode === "type" ? "checked" : "";

  const selectorHtml = clubSearchMode === "select"
    ? `<ul class="ni-club-list" id="ni-club-list">${buildClubListHtml("")}</ul>`
    : `<input id="ni-club-search" class="field-input" type="search" placeholder="クラブ名を検索または選択" autocomplete="off" value="${escHtml(clubFilter)}" />
       <ul class="ni-club-list" id="ni-club-list">${buildClubListHtml(clubFilter)}</ul>`;

  niApp.innerHTML = `
    <h2 class="ni-page-title">氏名入力</h2>
    <p class="ni-page-sub">クラブを選択して氏名を入力</p>
    ${remoteNoticeHtml()}
    <div class="search-mode-group">
      <label class="search-mode-option">
        <input type="radio" name="ni-club-mode" value="select" class="search-mode-radio" ${selectChecked} />
        <span class="search-mode-label">クラブ名から選ぶ</span>
      </label>
      <label class="search-mode-option">
        <input type="radio" name="ni-club-mode" value="type" class="search-mode-radio" ${typeChecked} />
        <span class="search-mode-label">クラブ名を入力</span>
      </label>
    </div>
    ${selectorHtml}
    <div class="ni-actions">
      <button class="ni-btn ni-btn-primary" id="ni-to-editor" ${selectedClub ? "" : "disabled"}>
        ${selectedClub ? `${escHtml(selectedClub)} の席を入力` : "クラブを選択"}
      </button>
    </div>
  `;

  /* Mode switch */
  niApp.querySelectorAll('input[name="ni-club-mode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      clubSearchMode = e.target.value;
      clubFilter = "";
      renderSearch();
    });
  });

  /* Search input (type mode only) */
  const searchInput = document.getElementById("ni-club-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clubFilter = e.target.value;
      const listEl = document.getElementById("ni-club-list");
      if (listEl) listEl.innerHTML = buildClubListHtml(clubFilter);
      const toEditor = document.getElementById("ni-to-editor");
      if (toEditor) {
        toEditor.disabled = !selectedClub;
        toEditor.textContent = selectedClub ? `${selectedClub} の席を入力` : "クラブを選択";
      }
    });
  }

  document.getElementById("ni-club-list").addEventListener("click", (e) => {
    const item = e.target.closest(".ni-club-item");
    if (!item || !item.dataset.club) return;
    openEditorForClub(item.dataset.club);
  });
  const toEditor = document.getElementById("ni-to-editor");
  if (toEditor) {
    toEditor.addEventListener("click", () => {
      if (!selectedClub) return;
      openEditorForClub(selectedClub);
    });
  }
  renderSide();
}

function renderLoading() {
  niApp.innerHTML = `
    <h2 class="ni-page-title">氏名入力</h2>
    <p class="ni-page-sub">最新の氏名データを取得しています</p>
    <p class="ni-notice">${escHtml(selectedClub || "")} の席情報を読み込み中です。</p>
  `;
  renderSide();
}

/* ── Screen: Seat Editor ── */

function renderEditor() {
  const eligibleSeats = clubEligibleSeats(selectedClub);
  const tableIds = Object.keys(eligibleSeats).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b, "ja");
  });

  const tableSections = tableIds.map((tableId) => {
    const seats = eligibleSeats[tableId];
    const rows = seats.map((seat) => {
      const entry = getEntry(tableId, seat);
      const displayName = tableId === "1" ? seatDisplayName(tableId, seat) : selectedClub;
      const k = `${tableId}-${seat}`;
      const hasVal = entry.surname || entry.given;
      const isFocused = focusedTable === tableId && (focusedSeat === null || focusedSeat === seat);
      return `
        <div class="ni-seat-row${isFocused ? " is-focused" : ""}" data-key="${escHtml(k)}">
          <span class="ni-seat-num">${seat}</span>
          <span class="ni-seat-name" title="${escHtml(displayName)}">${escHtml(displayName)}</span>
          <div class="ni-name-inputs">
            <div class="ni-name-field">
              <input type="text" class="ni-surname${hasVal ? " has-value" : ""}" data-key="${escHtml(k)}" value="${escHtml(entry.surname)}" placeholder="姓" inputmode="text" autocomplete="off" />
            </div>
            <div class="ni-name-field">
              <input type="text" class="ni-given${hasVal ? " has-value" : ""}" data-key="${escHtml(k)}" value="${escHtml(entry.given)}" placeholder="名" inputmode="text" autocomplete="off" />
            </div>
          </div>
          <button class="ni-clear-btn" data-key="${escHtml(k)}" title="クリア">✕</button>
        </div>`;
    }).join("");
    return `
      <div class="ni-table-section">
        <p class="ni-table-label">${tableId}番テーブル</p>
        ${rows}
      </div>`;
  }).join("");

  niApp.innerHTML = `
    <h2 class="ni-page-title">氏名入力</h2>
    <div class="ni-selected-club-bar">
      <strong>${escHtml(selectedClub)}</strong>
      <button id="ni-change-club">クラブ変更</button>
    </div>
    ${tableSections}
    <div class="ni-actions">
      <button class="ni-btn ni-btn-primary" id="ni-to-confirm">更新</button>
      <button class="ni-btn ni-btn-danger" id="ni-clear-all">全体クリア</button>
    </div>
  `;

  function updateInputState(input) {
      const k = input.dataset.key;
      const [tableId, seatStr] = k.split("-");
      const seat = parseInt(seatStr, 10);
      const row = niApp.querySelector(`.ni-seat-row[data-key="${k}"]`);
      const surname = row.querySelector(".ni-surname").value;
      const given = row.querySelector(".ni-given").value;
      setEntry(tableId, seat, surname, given);
      const hasVal = surname || given;
      row.querySelector(".ni-surname").classList.toggle("has-value", !!hasVal);
      row.querySelector(".ni-given").classList.toggle("has-value", !!hasVal);
      renderSide();
  }

  /* Bind input events */
  niApp.querySelectorAll(".ni-surname, .ni-given").forEach((input) => {
    input.addEventListener("input", () => updateInputState(input));
    input.addEventListener("change", () => updateInputState(input));
  });

  /* Individual clear buttons */
  niApp.querySelectorAll(".ni-clear-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const k = btn.dataset.key;
      const [tableId, seatStr] = k.split("-");
      clearEntry(tableId, parseInt(seatStr, 10));
      const row = niApp.querySelector(`.ni-seat-row[data-key="${k}"]`);
      row.querySelector(".ni-surname").value = "";
      row.querySelector(".ni-given").value = "";
      row.querySelector(".ni-surname").classList.remove("has-value");
      row.querySelector(".ni-given").classList.remove("has-value");
      renderSide();
    });
  });

  /* Input focus/blur to highlight only the active seat */
  niApp.querySelectorAll(".ni-surname, .ni-given").forEach((input) => {
    input.addEventListener("focus", () => {
      const k = input.dataset.key;
      const [tableId, seatStr] = k.split("-");
      focusedTable = tableId;
      focusedSeat = parseInt(seatStr, 10);
      highlightEditorRows();
      renderSide();
    });
    input.addEventListener("blur", () => {
      focusedTable = null;
      focusedSeat = null;
      highlightEditorRows();
      renderSide();
    });
  });

  /* Row tap to focus */
  niApp.querySelectorAll(".ni-seat-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("input") || e.target.closest("button")) return;
      const k = row.dataset.key;
      const [tableId, seatStr] = k.split("-");
      focusedTable = tableId;
      focusedSeat = parseInt(seatStr, 10);
      if (!mapOpen) mapOpen = true;
      if (isMobile()) drawerExpanded = true;
      renderSide();
      highlightEditorRows();
      setTimeout(() => scrollMapToTable(tableId), 100);
    });
  });

  document.getElementById("ni-change-club").addEventListener("click", () => {
    currentScreen = "search";
    focusedTable = null;
    focusedSeat = null;
    render();
  });
  document.getElementById("ni-to-confirm").addEventListener("click", () => {
    currentScreen = "confirm";
    render();
  });
  document.getElementById("ni-clear-all").addEventListener("click", () => {
    if (!confirm(`${selectedClub} の入力データをクリアしますか？確定するとサーバー上の氏名も削除されます。`)) return;
    const next = Object.assign({}, state);
    for (const k of clubStateKeys(selectedClub)) delete next[k];
    state = next;
    saveState(state);
    render();
  });

  renderSide();
}

/* ── Screen: Confirm ── */

function renderConfirm() {
  const json = buildExportJson(selectedClub);
  const deletes = deletedRemoteEntriesForClub(selectedClub);
  const entries = [];
  for (const [tableId, rows] of Object.entries(json.tables)) {
    for (const row of rows) {
      entries.push({ tableId, seat: row.seat, person: row.person });
    }
  }
  entries.sort((a, b) => {
    const na = parseInt(a.tableId, 10);
    const nb = parseInt(b.tableId, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return a.tableId.localeCompare(b.tableId) || a.seat - b.seat;
  });

  const confirmRows = entries.length
    ? entries.map((e) => `
        <div class="ni-confirm-row">
          <span class="ni-confirm-key">${escHtml(e.tableId)}番 席${e.seat}</span>
          <span class="ni-confirm-val">${escHtml(e.person)}</span>
        </div>`).join("")
    : `<p class="ni-notice">入力されたデータがありません。</p>`;
  const deleteRows = deletes.length
    ? `<p class="ni-section-title">削除する氏名 <span class="ni-entry-count">${deletes.length}</span></p>
      <div class="ni-confirm-section">
        ${deletes.map((e) => `
          <div class="ni-confirm-row">
            <span class="ni-confirm-key">${escHtml(e.tableId)}番 席${e.seat}</span>
            <span class="ni-confirm-val">空欄に戻す</span>
          </div>`).join("")}
      </div>`
    : "";

  niApp.innerHTML = `
    <h2 class="ni-page-title">確認</h2>
    <p class="ni-page-sub">${escHtml(selectedClub || "")} の内容で登録します</p>
    ${remoteNoticeHtml()}
    <p class="ni-section-title">入力済み氏名 <span class="ni-entry-count">${entries.length}</span></p>
    <div class="ni-confirm-section">${confirmRows}</div>
    ${deleteRows}
    <div class="ni-actions">
      <button class="ni-btn ni-btn-primary" id="ni-do-confirm" ${isSaving ? "disabled" : ""}>${isSaving ? "登録中" : "確定"}</button>
      <button class="ni-btn ni-btn-secondary" id="ni-back-to-editor" ${isSaving ? "disabled" : ""}>戻る</button>
    </div>
  `;

  niSide.innerHTML = "";
  renderSide();

  document.getElementById("ni-do-confirm").addEventListener("click", submitSelectedClub);
  document.getElementById("ni-back-to-editor").addEventListener("click", () => {
    currentScreen = "editor";
    render();
  });
}

/* ── Screen: Complete ── */

let completeViewTable = null;

function buildCompleteSeatList(club, tableId) {
  const seats = (NI_CLUB_SEATING[club] && NI_CLUB_SEATING[club][tableId]) || [];
  if (!seats.length) return "";
  const rows = seats.map((s) => {
    const entry = getEntry(tableId, s);
    const name = [entry.surname, entry.given].filter(Boolean).join(" ");
    const cls = name ? "ni-confirm-row has-name" : "ni-confirm-row";
    return `<div class="${cls}">
      <span class="ni-confirm-key">${s}番席</span>
      <span class="ni-confirm-val">${name ? escHtml(name) : '<span style="color:var(--muted)">未入力</span>'}</span>
    </div>`;
  }).join("");
  return `<div class="ni-confirm-section">${rows}</div>`;
}

function buildCompleteSeatDiagram(club, tableId) {
  const seats = (NI_CLUB_SEATING[club] && NI_CLUB_SEATING[club][tableId]) || [];
  const maxSeats = getPhysicalSeatCount(tableId);
  const clubSeatSet = new Set(seats);
  const radius = 70;
  const chips = [];
  for (let s = 1; s <= maxSeats; s++) {
    const angle = (2 * Math.PI * (s - 1)) / maxSeats - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    const entry = getEntry(tableId, s);
    const hasName = !!(entry.surname || entry.given);
    const isClubSeat = clubSeatSet.has(s);
    let chipCls = "ni-seat-chip";
    if (isClubSeat && hasName) chipCls += " has-name";
    else if (isClubSeat) chipCls += " is-club";
    else chipCls += " is-muted";
    chips.push(`<span class="${chipCls}" style="transform:translate(${x}px,${y}px)">${s}</span>`);
  }
  return `
    <div style="display:flex;flex-direction:column;align-items:center;margin:16px 0;">
      <div style="position:relative;width:220px;height:220px;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;background:var(--blue);color:var(--paper);display:grid;place-items:center;font-size:20px;font-weight:800;">${escHtml(tableId)}</div>
        <div style="position:absolute;top:50%;left:50%;width:0;height:0;">${chips.join("")}</div>
      </div>
      <div style="display:flex;gap:16px;margin-top:10px;font-size:13px;font-weight:600;align-items:center;">
        <span style="display:inline-flex;align-items:center;gap:4px;"><span class="ni-seat-legend-chip has-name">1</span>入力済</span>
        <span style="display:inline-flex;align-items:center;gap:4px;"><span class="ni-seat-legend-chip is-club">2</span>未入力</span>
      </div>
    </div>`;
}

function renderComplete() {
  const club = selectedClub;
  const eligibleSeats = club ? clubEligibleSeats(club) : {};
  const tableIds = Object.keys(eligibleSeats).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b, "ja");
  });

  if (!completeViewTable && tableIds.length > 0) {
    if (lastEditedTable && tableIds.includes(lastEditedTable)) {
      completeViewTable = lastEditedTable;
    } else {
      /* Find first table with any entered value */
      const firstChanged = tableIds.find((t) => {
        const seats = eligibleSeats[t] || [];
        return seats.some((s) => {
          const e = getEntry(t, s);
          return e.surname || e.given;
        });
      });
      completeViewTable = firstChanged || tableIds[0];
    }
  }
  const activeTable = completeViewTable || (tableIds.length > 0 ? tableIds[0] : null);

  const tableChips = tableIds.length > 1
    ? `<div class="vsm-table-chips" style="margin-bottom:10px;">${tableIds.map((t) =>
        `<button class="vsm-table-chip${t === activeTable ? " is-current" : ""}" data-complete-table="${escHtml(t)}">${escHtml(t)}番</button>`
      ).join("")}</div>`
    : "";

  const seatList = activeTable ? buildCompleteSeatList(club, activeTable) : "";
  const seatDiagram = activeTable ? buildCompleteSeatDiagram(club, activeTable) : "";

  niApp.innerHTML = `
    <h2 class="ni-page-title">登録完了</h2>
    <div class="ni-complete-message">
      <p>${escHtml(club)} の席の登録を完了しました。</p>
      <p>修正する場合はもう一度、対象のテーブルを選択して入力してください。</p>
    </div>
    ${tableChips}
    ${activeTable ? `<p class="ni-section-title">${escHtml(activeTable)}番テーブルの状況</p>` : ""}
    ${seatDiagram}
    ${seatList}
    <div class="ni-actions">
      <button class="ni-btn ni-btn-primary" id="ni-back-to-search">クラブ名検索画面に戻る</button>
    </div>
  `;

  niSide.innerHTML = "";
  renderSide();

  /* Table chip switching */
  niApp.querySelectorAll("[data-complete-table]").forEach((chip) => {
    chip.addEventListener("click", () => {
      completeViewTable = chip.dataset.completeTable;
      renderComplete();
    });
  });

  document.getElementById("ni-back-to-search").addEventListener("click", () => {
    selectedClub = null;
    focusedTable = null;
    focusedSeat = null;
    clubFilter = "";
    completeViewTable = null;
    currentScreen = "search";
    render();
  });
}

/* ── Init ── */

render();
refreshRemoteNames().then(() => {
  if (currentScreen === "search") render();
});
