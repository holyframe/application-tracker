// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
// const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const SHEET_NAME = "Sheet1";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    SAVE_CURRENT_TAB_URL_TO_SHEET: saveCurrentTabUrlToSheet,
    SAVE_ALL_OPEN_TABS_URLS_TO_SHEET: saveAllOpenTabsUrlsToSheet
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

  sendLog(runId, "success", `Found tab URL: ${tab.url}`);

  const row = [
    new Date().toISOString(),
    tab.title || "",
    tab.url,
    note || ""
  ];

  sendLog(runId, "info", "Preparing row for Google Sheet...");

  await appendRowsToGoogleSheet([row], runId);

  sendLog(runId, "success", "Finished. URL saved to Google Sheet.");

  return {
    url: tab.url
  };
}

async function saveAllOpenTabsUrlsToSheet(note = "", runId) {
  sendLog(runId, "info", "Starting save-all-tabs process...");

  const tabs = await chrome.tabs.query({});
  const withUrl = tabs.filter((t) => t.url && !t.pinned);

  if (withUrl.length === 0) {
    throw new Error(
      "No tabs to save: need at least one non-pinned tab with a URL."
    );
  }

  sendLog(
    runId,
    "info",
    `Found ${withUrl.length} non-pinned tab(s) with a URL (pinned tabs skipped).`
  );

  const timestamp = new Date().toISOString();
  const rows = withUrl.map((t) => [
    timestamp,
    t.title || "",
    t.url,
    note || ""
  ]);

  sendLog(runId, "info", "Preparing rows for Google Sheet...");

  await appendRowsToGoogleSheet(rows, runId);

  sendLog(
    runId,
    "success",
    `Finished. ${withUrl.length} URL(s) saved to Google Sheet.`
  );

  return { count: withUrl.length };
}

async function appendRowsToGoogleSheet(rows, runId) {
  sendLog(runId, "info", "Requesting Google authorization token...");

  const token = await getGoogleAccessToken();

  sendLog(runId, "success", "Google authorization token received.");

  const range = encodeURIComponent(`${SHEET_NAME}!A:D`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${range}:append?valueInputOption=USER_ENTERED`;

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