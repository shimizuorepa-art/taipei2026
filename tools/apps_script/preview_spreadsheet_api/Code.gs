/**
 * Preview Spreadsheet API — Apps Script Web App
 *
 * Provides a sandbox API for the Vercel preview of Rotary District Night app.
 * Reads/writes to a Google Spreadsheet instead of production Cloud Functions.
 *
 * Setup:
 * 1. Create a Google Spreadsheet with tabs: person_names, checkins, meta
 * 2. Set SPREADSHEET_ID below to the spreadsheet's ID
 * 3. Deploy as Web App: Execute as "Me", Access "Anyone"
 * 4. Set the deployed URL as PREVIEW_PERSON_NAMES_API_URL in preview-config.js
 */

var SPREADSHEET_ID = "1f9u0pLReRFhhGqR--6tD0jvxPuCTHUQ2dVnVHvzJIS4";
var EVENT_ID = "district-night-2026-preview";

/* ── Helpers ── */

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function corsHeaders(output) {
  /* Apps Script Web App handles CORS automatically when deployed as "Anyone" */
  return output;
}

/* ── GET Handler ── */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "get_names";

  if (action === "get_names") {
    return corsHeaders(jsonResponse(getPersonNames()));
  }
  if (action === "get_checkins") {
    return corsHeaders(jsonResponse(getCheckins()));
  }

  return corsHeaders(jsonResponse({ error: "Unknown action: " + action }));
}

/* ── POST Handler ── */

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return corsHeaders(jsonResponse({ error: "Invalid JSON" }));
  }

  var action = body.action || "upsert_names";

  if (action === "upsert_names") {
    return corsHeaders(jsonResponse(upsertPersonNames(body)));
  }
  if (action === "delete_name") {
    return corsHeaders(jsonResponse(deletePersonName(body)));
  }
  if (action === "register_checkins") {
    return corsHeaders(jsonResponse(registerCheckins(body)));
  }
  if (action === "unregister_checkins") {
    return corsHeaders(jsonResponse(unregisterCheckins(body)));
  }

  return corsHeaders(jsonResponse({ error: "Unknown action: " + action }));
}

/* ── Person Names ── */

function getPersonNames() {
  var sheet = getSheet("person_names");
  if (!sheet) return { version: 1, generated_at: new Date().toISOString(), tables: {} };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tables = {};

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    if (row.event_id !== EVENT_ID) continue;
    var tableId = String(row.table_id);
    var seat = parseInt(row.seat, 10);
    if (!seat) continue;

    if (!tables[tableId]) tables[tableId] = [];
    tables[tableId].push({
      seat: seat,
      surname: String(row.surname || ""),
      given: String(row.given || ""),
      person: String(row.person || "")
    });
  }

  /* Sort seats within each table */
  for (var t in tables) {
    tables[t].sort(function (a, b) { return a.seat - b.seat; });
  }

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    tables: tables
  };
}

function upsertPersonNames(body) {
  var sheet = getSheet("person_names");
  if (!sheet) return { error: "person_names sheet not found" };

  var tables = body.tables || {};
  var club = body.club || "";
  var now = new Date().toISOString();
  var upserted = 0;

  for (var tableId in tables) {
    var rows = tables[tableId];
    for (var i = 0; i < rows.length; i++) {
      var entry = rows[i];
      var seat = parseInt(entry.seat, 10);
      var surname = String(entry.surname || "");
      var given = String(entry.given || "");
      var person = [surname, given].filter(Boolean).join(" ");

      /* Find existing row */
      var existingRow = findPersonNameRow(sheet, tableId, seat);
      if (existingRow > 0) {
        /* Update */
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colMap = {};
        for (var c = 0; c < headers.length; c++) colMap[headers[c]] = c + 1;

        sheet.getRange(existingRow, colMap["surname"]).setValue(surname);
        sheet.getRange(existingRow, colMap["given"]).setValue(given);
        sheet.getRange(existingRow, colMap["person"]).setValue(person);
        sheet.getRange(existingRow, colMap["club"]).setValue(club);
        sheet.getRange(existingRow, colMap["updated_at"]).setValue(now);
      } else {
        /* Insert */
        sheet.appendRow([EVENT_ID, tableId, seat, surname, given, person, club, now, ""]);
      }
      upserted++;
    }
  }

  return { ok: true, upserted: upserted };
}

function deletePersonName(body) {
  var sheet = getSheet("person_names");
  if (!sheet) return { error: "person_names sheet not found" };

  var tableId = String(body.table || "");
  var seat = parseInt(body.seat, 10);
  if (!tableId || !seat) return { error: "table and seat required" };

  var row = findPersonNameRow(sheet, tableId, seat);
  if (row > 0) {
    sheet.deleteRow(row);
    return { ok: true, deleted: true };
  }
  return { ok: true, deleted: false };
}

function findPersonNameRow(sheet, tableId, seat) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colEvent = headers.indexOf("event_id");
  var colTable = headers.indexOf("table_id");
  var colSeat = headers.indexOf("seat");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colEvent]) === EVENT_ID &&
        String(data[i][colTable]) === String(tableId) &&
        parseInt(data[i][colSeat], 10) === seat) {
      return i + 1; /* 1-based row number */
    }
  }
  return -1;
}

/* ── Checkins (documented, minimal implementation) ── */

function getCheckins() {
  var sheet = getSheet("checkins");
  if (!sheet) return { event_id: EVENT_ID, checkins: [] };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var checkins = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    if (row.event_id !== EVENT_ID) continue;
    if (row.status !== "checked_in") continue;
    checkins.push({
      table_id: String(row.table_id),
      seat: parseInt(row.seat, 10),
      status: String(row.status),
      club: String(row.club || ""),
      person: String(row.person || ""),
      registered_at: String(row.registered_at || "")
    });
  }

  return { event_id: EVENT_ID, checkins: checkins };
}

function registerCheckins(body) {
  var sheet = getSheet("checkins");
  if (!sheet) return { error: "checkins sheet not found" };

  var entries = body.entries || [];
  var now = new Date().toISOString();
  var registered = 0;

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var tableId = String(e.table_id);
    var seat = parseInt(e.seat, 10);
    sheet.appendRow([EVENT_ID, tableId, seat, "checked_in", e.club || "", e.person || "", now, "", now]);
    registered++;
  }

  return { ok: true, registered: registered };
}

function unregisterCheckins(body) {
  var sheet = getSheet("checkins");
  if (!sheet) return { error: "checkins sheet not found" };

  var entries = body.entries || [];
  var now = new Date().toISOString();
  var unregistered = 0;

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var tableId = String(e.table_id);
    var seat = parseInt(e.seat, 10);

    /* Find and update status */
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][headers.indexOf("event_id")]) === EVENT_ID &&
          String(data[r][headers.indexOf("table_id")]) === tableId &&
          parseInt(data[r][headers.indexOf("seat")], 10) === seat &&
          String(data[r][headers.indexOf("status")]) === "checked_in") {
        var statusCol = headers.indexOf("status") + 1;
        var cancelCol = headers.indexOf("cancelled_at") + 1;
        var updateCol = headers.indexOf("updated_at") + 1;
        sheet.getRange(r + 1, statusCol).setValue("not_checked_in");
        sheet.getRange(r + 1, cancelCol).setValue(now);
        sheet.getRange(r + 1, updateCol).setValue(now);
        unregistered++;
        break;
      }
    }
  }

  return { ok: true, unregistered: unregistered };
}
