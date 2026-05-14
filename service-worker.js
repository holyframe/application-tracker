// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
// const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const SHEET_NAME = "Sheet1";
const NOTE_DRAFT_STORAGE_KEY = "saveCurrentTabNoteDraft";

function normalizeUrlForStorage(url) {
  const raw = String(url ?? "").trim();
  if (!raw) {
    return "";
  }
  try {
    const parsed = new URL(raw);
    const originalParams = Array.from(parsed.searchParams.entries());
    if (originalParams.length === 0) {
      return parsed.toString();
    }

    const normalizedParams = new URLSearchParams();
    for (const [key, value] of originalParams) {
      if (key.toLowerCase().startsWith("utm_")) {
        break;
      }
      normalizedParams.append(key, value);
    }

    const normalizedSearch = normalizedParams.toString();
    parsed.search = normalizedSearch ? `?${normalizedSearch}` : "";

    return parsed.toString();
  } catch (_error) {
    return raw;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "save-current-tab") {
    return;
  }

  const runId = `shortcut-${Date.now()}`;
  (async () => {
    await chrome.runtime.sendMessage({
      type: "HOTKEY_SAVE_STARTED",
      runId
    });

    const stored = await chrome.storage.local.get(NOTE_DRAFT_STORAGE_KEY);
    const noteValue =
      typeof stored[NOTE_DRAFT_STORAGE_KEY] === "string"
        ? stored[NOTE_DRAFT_STORAGE_KEY].trim()
        : "";

    const result = await saveCurrentTabUrlToSheet(noteValue, runId);
    await chrome.storage.local.remove(NOTE_DRAFT_STORAGE_KEY);

    await chrome.runtime.sendMessage({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ok: true,
      url: result?.url || ""
    });
  })().catch((error) => {
    console.error("Hotkey save failed:", error);
    sendLog(runId, "error", error.message || "Hotkey save failed.");

    chrome.runtime.sendMessage({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ok: false,
      error: error.message || "Hotkey save failed."
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    SAVE_CURRENT_TAB_URL_TO_SHEET: saveCurrentTabUrlToSheet,
    SAVE_ALL_OPEN_TABS_URLS_TO_SHEET: saveAllOpenTabsUrlsToSheet,
    REMOVE_DUPLICATE_URLS_FROM_SHEET: removeDuplicateUrlsFromSheet
  };

  const run = handlers[message.type];
  if (!run) {
    return;
  }

  run(message.note, message.runId)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => {
      console.error(error);

      sendLog(message.runId, "error", error.message || "Unknown error");

      sendResponse({
        ok: false,
        error: error.message || "Unknown error"
      });
    });

  return true;
});

async function saveCurrentTabUrlToSheet(note = "", runId) {
  sendLog(runId, "info", "Starting save process...");

  sendLog(runId, "info", "Checking current active tab...");

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab) {
    throw new Error("No active tab found.");
  }

  if (!tab.url) {
    throw new Error("Current tab does not have a URL.");
  }
  if (tab.pinned) {
    throw new Error("Pinned tabs are skipped. Unpin the tab to save and close it.");
  }

  const urlForSheet = normalizeUrlForStorage(tab.url);

  sendLog(runId, "success", `Found tab URL: ${tab.url}`);

  const row = [
    new Date().toISOString(),
    tab.title || "",
    urlForSheet,
    note || ""
  ];

  sendLog(runId, "info", "Preparing row for Google Sheet...");

  await appendRowsToGoogleSheet([row], runId);
  sendLog(runId, "success", "URL saved to Google Sheet.");

  if (typeof tab.id !== "number") {
    throw new Error("Current tab does not have a valid tab ID.");
  }

  sendLog(runId, "info", "Closing current tab...");
  await chrome.tabs.remove(tab.id);
  sendLog(runId, "success", "Current tab closed.");

  sendLog(runId, "success", "Finished. URL saved and tab closed.");

  return {
    url: urlForSheet
  };
}

async function saveAllOpenTabsUrlsToSheet(note = "", runId) {
  sendLog(runId, "info", "Starting save-all-tabs process...");

  const tabs = await chrome.tabs.query({});
  const unpinnedWithUrl = tabs.filter((t) => t.url && !t.pinned);

  if (unpinnedWithUrl.length === 0) {
    throw new Error(
      "No tabs to save: need at least one non-pinned tab with a URL."
    );
  }

  sendLog(
    runId,
    "info",
    `Found ${unpinnedWithUrl.length} non-pinned tab(s) with a URL (pinned tabs skipped).`
  );

  const timestamp = new Date().toISOString();
  const rows = unpinnedWithUrl.map((t) => [
    timestamp,
    t.title || "",
    normalizeUrlForStorage(t.url),
    note || ""
  ]);

  sendLog(runId, "info", "Preparing rows for Google Sheet...");

  await appendRowsToGoogleSheet(rows, runId);

  const tabIdsToClose = unpinnedWithUrl
    .map((t) => t.id)
    .filter((id) => typeof id === "number");

  if (tabIdsToClose.length > 0) {
    sendLog(
      runId,
      "info",
      `Closing ${tabIdsToClose.length} saved unpinned tab(s)...`
    );
    await chrome.tabs.remove(tabIdsToClose);
    sendLog(runId, "success", "Saved unpinned tabs closed.");
  }

  sendLog(
    runId,
    "success",
    `Finished. ${unpinnedWithUrl.length} URL(s) saved to Google Sheet.`
  );

  return { count: unpinnedWithUrl.length };
}

function normalizeUrlKeyForDedupe(cellValue) {
  const raw = String(cellValue ?? "").trim();
  if (!raw) {
    return "";
  }
  return normalizeUrlForStorage(raw);
}

async function getSheetIdByTitle(token, spreadsheetId, sheetTitle) {
  const fields = encodeURIComponent("sheets(properties(sheetId,title))");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=${fields}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${errorText}`);
  }

  const data = await response.json();
  const sheet = data.sheets?.find(
    (s) => s.properties?.title === sheetTitle
  );

  if (sheet?.properties?.sheetId == null) {
    throw new Error(`Sheet "${sheetTitle}" not found in spreadsheet.`);
  }

  return sheet.properties.sheetId;
}

async function readSheetValuesAD(token, runId) {
  const range = encodeURIComponent(`${SHEET_NAME}!A:D`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

  sendLog(runId, "info", `Reading rows from ${SHEET_NAME}...`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  sendLog(runId, "info", `Read response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${errorText}`);
  }

  const data = await response.json();
  return data.values ?? [];
}

async function batchDeleteSheetRows(token, spreadsheetId, sheetId, rowIndicesZeroBased, runId) {
  const sortedHighToLow = [...rowIndicesZeroBased].sort((a, b) => b - a);
  const chunkSize = 100;

  for (let i = 0; i < sortedHighToLow.length; i += chunkSize) {
    const chunk = sortedHighToLow.slice(i, i + chunkSize);
    const requests = chunk.map((rowIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: rowIndex,
          endIndex: rowIndex + 1
        }
      }
    }));

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    const response = await fetch(batchUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requests })
    });

    sendLog(runId, "info", `Batch delete response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets batchUpdate error: ${errorText}`);
    }
  }
}

async function removeDuplicateUrlsFromSheet(_note, runId) {
  sendLog(runId, "info", "Starting duplicate URL removal...");

  const token = await getGoogleAccessToken();
  sendLog(runId, "success", "Google authorization token received.");

  const sheetId = await getSheetIdByTitle(token, SPREADSHEET_ID, SHEET_NAME);

  const values = await readSheetValuesAD(token, runId);

  if (values.length === 0) {
    sendLog(runId, "info", "Sheet has no rows. Nothing to do.");
    return { removed: 0, rowCount: 0 };
  }

  const seen = new Set();
  const duplicateRowIndices = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const urlKey = normalizeUrlKeyForDedupe(row[2]);
    if (seen.has(urlKey)) {
      duplicateRowIndices.push(i);
    } else {
      seen.add(urlKey);
    }
  }

  const deletedRows = duplicateRowIndices.map((rowIndex) => {
    const row = values[rowIndex] || [];
    return {
      rowNumber: rowIndex + 1,
      timestamp: row[0] || "",
      title: row[1] || "",
      url: row[2] || "",
      note: row[3] || ""
    };
  });

  if (duplicateRowIndices.length === 0) {
    sendLog(runId, "success", "No duplicate URLs found.");
    return { removed: 0, rowCount: values.length, deletedRows: [] };
  }

  sendLog(
    runId,
    "info",
    `Removing ${duplicateRowIndices.length} duplicate row(s), keeping first occurrence of each URL...`
  );

  await batchDeleteSheetRows(
    token,
    SPREADSHEET_ID,
    sheetId,
    duplicateRowIndices,
    runId
  );

  sendLog(
    runId,
    "success",
    `Done. Removed ${duplicateRowIndices.length} row(s). ${seen.size} unique URL key(s) remain.`
  );

  return {
    removed: duplicateRowIndices.length,
    rowCount: values.length,
    deletedRows
  };
}

async function appendRowsToGoogleSheet(rows, runId) {
  sendLog(runId, "info", "Requesting Google authorization token...");

  const token = await getGoogleAccessToken();

  sendLog(runId, "success", "Google authorization token received.");

  const range = encodeURIComponent(`${SHEET_NAME}!A:D`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${range}:append?valueInputOption=USER_ENTERED` +
    `&insertDataOption=INSERT_ROWS`;

  sendLog(runId, "info", `Sending data to sheet: ${SHEET_NAME}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: rows
    })
  });

  sendLog(runId, "info", `Google Sheets response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${errorText}`);
  }

  const result = await response.json();

  sendLog(runId, "success", "Google Sheet row appended successfully.");

  return result;
}

async function getGoogleAccessToken() {
  const authResult = await chrome.identity.getAuthToken({
    interactive: true
  });

  if (!authResult || !authResult.token) {
    throw new Error("Could not get Google access token.");
  }

  return authResult.token;
}

async function sendLog(runId, level, message) {
  try {
    await chrome.runtime.sendMessage({
      type: "SAVE_PROCESS_LOG",
      runId,
      level,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
  } catch (error) {
    console.log(`[${level}] ${message}`);
  }
}