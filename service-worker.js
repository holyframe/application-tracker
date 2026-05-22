// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const DEFAULT_SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
const DEFAULT_SHEET_NAME = "Sheet1";
const DEFAULT_RESUME_TEMPLATE_ID = "1oF1GQJ6bTEli1548HVyI91O803oQaeP8ec8Y81bj5zM";
const NOTE_DRAFT_STORAGE_KEY = "saveCurrentTabNoteDraft";
const SHEET_CONFIG_STORAGE_KEY = "sheetConfig";
const TRACKING_PARAM_KEYS = new Set([
  "source",
  "src",
  "ref",
  "referrer",
  "trk",
  "tracking",
  "fbclid",
  "gclid",
  "msclkid"
]);

function parseSpreadsheetId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  const urlMatch = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return raw;
}

function parseGoogleDocId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  const urlMatch = raw.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return raw;
}

async function getSheetConfig() {
  const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
  const config = stored[SHEET_CONFIG_STORAGE_KEY] || {};

  const spreadsheetId = parseSpreadsheetId(
    config.spreadsheetId || DEFAULT_SPREADSHEET_ID
  );
  const sheetName = String(config.sheetName || DEFAULT_SHEET_NAME).trim();
  const resumeTemplateId = parseGoogleDocId(
    config.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID
  );

  if (!spreadsheetId) {
    throw new Error("Google Sheet ID is not configured.");
  }

  if (!sheetName) {
    throw new Error("Sheet tab name is not configured.");
  }

  if (!resumeTemplateId) {
    throw new Error("Resume Google Doc template is not configured.");
  }

  return { spreadsheetId, sheetName, resumeTemplateId };
}

async function saveSheetConfig(
  spreadsheetIdInput,
  sheetNameInput,
  resumeTemplateInput
) {
  const spreadsheetId = parseSpreadsheetId(spreadsheetIdInput);
  const sheetName = String(sheetNameInput ?? "").trim();
  const resumeTemplateId = parseGoogleDocId(resumeTemplateInput);

  if (!spreadsheetId) {
    throw new Error("Enter a valid Google Sheet URL or spreadsheet ID.");
  }

  if (!sheetName) {
    throw new Error("Enter a sheet tab name.");
  }

  if (!resumeTemplateId) {
    throw new Error("Enter a valid Resume Google Doc URL or document ID.");
  }

  await chrome.storage.local.set({
    [SHEET_CONFIG_STORAGE_KEY]: {
      spreadsheetId,
      sheetName,
      resumeTemplateId
    }
  });

  return { spreadsheetId, sheetName, resumeTemplateId };
}

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
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith("utm_")) {
        break;
      }
      if (TRACKING_PARAM_KEYS.has(normalizedKey)) {
        continue;
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

chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });

  const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
  const config = stored[SHEET_CONFIG_STORAGE_KEY] || {};
  await chrome.storage.local.set({
    [SHEET_CONFIG_STORAGE_KEY]: {
      spreadsheetId: config.spreadsheetId || DEFAULT_SPREADSHEET_ID,
      sheetName: config.sheetName || DEFAULT_SHEET_NAME,
      resumeTemplateId:
        config.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID
    }
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
  if (message.type === "GET_SHEET_CONFIG") {
    getSheetConfig()
      .then((config) => sendResponse({ ok: true, ...config }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not load sheet configuration."
        });
      });
    return true;
  }

  if (message.type === "SAVE_SHEET_CONFIG") {
    saveSheetConfig(
      message.spreadsheetId,
      message.sheetName,
      message.resumeTemplateId
    )
      .then((config) => sendResponse({ ok: true, ...config }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save sheet configuration."
        });
      });
    return true;
  }

  const handlers = {
    SAVE_CURRENT_TAB_URL_TO_SHEET: saveCurrentTabUrlToSheet,
    SAVE_ALL_OPEN_TABS_URLS_TO_SHEET: saveAllOpenTabsUrlsToSheet,
    REMOVE_DUPLICATE_URLS_FROM_SHEET: removeDuplicateUrlsFromSheet,
    CHECK_COMPANY_DUPLICATES: checkCompanyDuplicatesInSheet,
    CREATE_GOOGLE_DOC: createGoogleDoc
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

  const { resumeTemplateId } = await getSheetConfig();
  const token = await getGoogleAccessToken();

  const docTitle = tab.title || `Application ${new Date().toLocaleDateString()}`;
  sendLog(runId, "info", "Creating resume copy...");
  const resumeUrl = await copyResumeAndGetUrl(token, docTitle, resumeTemplateId, runId);
  sendLog(runId, "success", `Resume copy created: ${resumeUrl}`);

  const row = [
    new Date().toISOString(),
    tab.title || "",
    urlForSheet,
    resumeUrl,
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

  const { resumeTemplateId } = await getSheetConfig();
  const token = await getGoogleAccessToken();
  const timestamp = new Date().toISOString();
  const rows = [];

  for (const t of unpinnedWithUrl) {
    const docTitle = t.title || `Application ${new Date().toLocaleDateString()}`;
    sendLog(runId, "info", `Creating resume copy for: ${t.title || t.url}`);
    const resumeUrl = await copyResumeAndGetUrl(token, docTitle, resumeTemplateId, runId);
    rows.push([
      timestamp,
      t.title || "",
      normalizeUrlForStorage(t.url),
      resumeUrl,
      note || ""
    ]);
  }

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

function extractCompanyKey(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // Greenhouse: job-boards.greenhouse.io/<company>/jobs/...
    if (host === "job-boards.greenhouse.io" || host === "boards.greenhouse.io") {
      const match = path.match(/^\/([^/]+)\//);
      if (match) return `greenhouse:${match[1]}`;
    }

    // Lever: jobs.lever.co/<company>/...
    if (host === "jobs.lever.co") {
      const match = path.match(/^\/([^/]+)/);
      if (match) return `lever:${match[1]}`;
    }

    // Workday: <company>.wd1.myworkdayjobs.com / <company>.wd5.myworkdayjobs.com etc.
    const workdayMatch = host.match(/^([^.]+)\.wd\d+\.myworkdayjobs\.com$/);
    if (workdayMatch) return `workday:${workdayMatch[1]}`;

    // Ashby: jobs.ashbyhq.com/<company>/...
    if (host === "jobs.ashbyhq.com") {
      const match = path.match(/^\/([^/]+)/);
      if (match) return `ashby:${match[1]}`;
    }

    // SmartRecruiters: jobs.smartrecruiters.com/<company>/...
    if (host === "jobs.smartrecruiters.com") {
      const match = path.match(/^\/([^/]+)/);
      if (match) return `smartrecruiters:${match[1]}`;

    }

    // Brassring / Kenexa: <company>.brassring.com or sjobs.brassring.com?partnerid=...&siteid=...
    if (host.endsWith(".brassring.com")) {
      const partnerId = parsed.searchParams.get("partnerid");
      const siteId = parsed.searchParams.get("siteid");
      if (partnerId && siteId) return `brassring:${partnerId}:${siteId}`;
      const companyMatch = host.match(/^([^.]+)\.brassring\.com$/);
      if (companyMatch) return `brassring:${companyMatch[1]}`;
    }

    // Fallback: use registrable domain (e.g. grafanalabs.com, datadog.com)
    const parts = host.split(".");
    const registrable = parts.slice(-2).join(".");
    return `domain:${registrable}`;
  } catch (_error) {
    return null;
  }
}

async function checkCompanyDuplicatesInSheet(_note, runId) {
  sendLog(runId, "info", "Starting company duplicate check...");

  const token = await getGoogleAccessToken();
  sendLog(runId, "success", "Google authorization token received.");

  const sheetConfig = await getSheetConfig();
  const sheetId = await getSheetIdByTitle(
    token,
    sheetConfig.spreadsheetId,
    sheetConfig.sheetName
  );
  const values = await readSheetValuesAD(token, runId, sheetConfig);

  if (values.length === 0) {
    sendLog(runId, "info", "Sheet has no rows. Nothing to do.");
    return { duplicateCompanyCount: 0, highlightedRowCount: 0, rowCount: 0 };
  }

  // Build map: companyKey -> list of zero-based row indices
  const companyRowMap = new Map();
  for (let i = 0; i < values.length; i++) {
    const url = (values[i][2] || "").trim();
    const key = extractCompanyKey(url);
    if (!key) continue;
    if (!companyRowMap.has(key)) companyRowMap.set(key, []);
    companyRowMap.get(key).push(i);
  }

  // Collect row indices where company appears more than once
  const rowsToHighlight = [];
  for (const [key, indices] of companyRowMap.entries()) {
    if (indices.length > 1) {
      sendLog(runId, "info", `Company "${key}" found in ${indices.length} rows: ${indices.map((i) => i + 1).join(", ")}`);
      for (const idx of indices) rowsToHighlight.push(idx);
    }
  }

  const duplicateCompanyCount = [...companyRowMap.values()].filter((v) => v.length > 1).length;

  if (rowsToHighlight.length === 0) {
    sendLog(runId, "success", "No company duplicates found.");
    return { duplicateCompanyCount: 0, highlightedRowCount: 0, rowCount: values.length };
  }

  sendLog(runId, "info", `Highlighting ${rowsToHighlight.length} row(s) yellow in the sheet...`);

  await batchHighlightSheetRows(
    token,
    sheetConfig.spreadsheetId,
    sheetId,
    rowsToHighlight,
    runId
  );

  sendLog(runId, "success", `Done. ${duplicateCompanyCount} company duplicate group(s), ${rowsToHighlight.length} row(s) highlighted.`);

  return {
    duplicateCompanyCount,
    highlightedRowCount: rowsToHighlight.length,
    rowCount: values.length
  };
}

async function batchHighlightSheetRows(token, spreadsheetId, sheetId, rowIndicesZeroBased, runId) {
  const YELLOW = { red: 1, green: 0.93, blue: 0.24 };
  const chunkSize = 100;

  for (let i = 0; i < rowIndicesZeroBased.length; i += chunkSize) {
    const chunk = rowIndicesZeroBased.slice(i, i + chunkSize);
    const requests = chunk.map((rowIndex) => ({
      repeatCell: {
          range: {
          sheetId,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 3
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: YELLOW
          }
        },
        fields: "userEnteredFormat.backgroundColor"
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

    sendLog(runId, "info", `Highlight batch response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets batchUpdate error: ${errorText}`);
    }
  }
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

async function readSheetValuesAD(token, runId, sheetConfig) {
  const { spreadsheetId, sheetName } = sheetConfig;
  const range = encodeURIComponent(`${sheetName}!A:D`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  sendLog(runId, "info", `Reading rows from ${sheetName}...`);

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

  const sheetConfig = await getSheetConfig();
  const sheetId = await getSheetIdByTitle(
    token,
    sheetConfig.spreadsheetId,
    sheetConfig.sheetName
  );

  const values = await readSheetValuesAD(token, runId, sheetConfig);

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
    sheetConfig.spreadsheetId,
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
  const sheetConfig = await getSheetConfig();

  sendLog(runId, "success", "Google authorization token received.");

  const range = encodeURIComponent(`${sheetConfig.sheetName}!A1`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetConfig.spreadsheetId}` +
    `/values/${range}:append?valueInputOption=USER_ENTERED` +
    `&insertDataOption=INSERT_ROWS`;

  sendLog(runId, "info", `Sending data to sheet: ${sheetConfig.sheetName}`);

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

async function getGoogleAccessToken(options = {}) {
  const authResult = await chrome.identity.getAuthToken({
    interactive: options.interactive ?? true
  });

  if (!authResult || !authResult.token) {
    throw new Error("Could not get Google access token.");
  }

  return authResult.token;
}

async function clearCachedGoogleAccessToken(token) {
  if (!token) {
    return;
  }

  await new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

function formatGoogleApiError(errorText, fallbackMessage) {
  try {
    const parsed = JSON.parse(errorText);
    const message = parsed?.error?.message;
    if (message) {
      return message;
    }
  } catch (_error) {
    // Keep fallback message for non-JSON responses.
  }

  return fallbackMessage;
}

async function copyGoogleDocTemplate(token, title, templateId) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: title })
    }
  );

  return response;
}

async function copyResumeAndGetUrl(token, title, resumeTemplateId, runId) {
  let response = await copyGoogleDocTemplate(token, title, resumeTemplateId);

  if (response.status === 401 || response.status === 403) {
    sendLog(runId, "info", "Resume copy auth error. Refreshing token and retrying...");
    await clearCachedGoogleAccessToken(token);
    const freshToken = await getGoogleAccessToken({ interactive: true });
    response = await copyGoogleDocTemplate(freshToken, title, resumeTemplateId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      formatGoogleApiError(errorText, "Could not copy resume template. Make sure your Google account can access the configured Resume Template doc.")
    );
  }

  const file = await response.json();
  if (!file.id) {
    throw new Error("Google Drive API did not return a document ID for the resume copy.");
  }

  return `https://docs.google.com/document/d/${file.id}/edit`;
}

async function createGoogleDoc(_note, runId) {
  sendLog(runId, "info", "Starting Google Doc creation...");

  const { resumeTemplateId } = await getSheetConfig();
  sendLog(runId, "info", `Using resume template: ${resumeTemplateId}`);

  let token = await getGoogleAccessToken();
  sendLog(runId, "success", "Google authorization token received.");

  const title = `Application Doc ${new Date().toLocaleString()}`;

  sendLog(runId, "info", `Copying template document: ${title}`);

  let response = await copyGoogleDocTemplate(token, title, resumeTemplateId);
  sendLog(runId, "info", `Google Drive response status: ${response.status}`);

  if (response.status === 401 || response.status === 403) {
    sendLog(
      runId,
      "info",
      "Copy failed with auth/permission error. Refreshing Google token and retrying once..."
    );
    await clearCachedGoogleAccessToken(token);
    token = await getGoogleAccessToken({ interactive: true });
    response = await copyGoogleDocTemplate(token, title, resumeTemplateId);
    sendLog(runId, "info", `Google Drive retry response status: ${response.status}`);

    if (!response.ok) {
      const retryErrorText = await response.text();
      throw new Error(
        formatGoogleApiError(
          retryErrorText,
          "Could not copy the template Google Doc. Make sure your signed-in Google account can open and copy that template, then reload the extension and approve Google Drive access."
        )
      );
    }
  } else if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      formatGoogleApiError(errorText, "Google Drive API error.")
    );
  }

  const file = await response.json();
  const documentId = file.id;

  if (!documentId) {
    throw new Error("Google Drive API did not return a document ID.");
  }

  const url = `https://docs.google.com/document/d/${documentId}/edit`;

  sendLog(runId, "info", "Opening copied Google Doc in a tab...");

  const [currentTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  await chrome.tabs.create({
    url,
    active: true,
    index: typeof currentTab?.index === "number" ? currentTab.index : undefined
  });

  sendLog(runId, "success", "Google Doc copy created and opened.");

  return {
    url,
    title: file.name || title
  };
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