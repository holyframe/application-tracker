// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

// const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const SHEET_NAME = "Sheet1";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SAVE_CURRENT_TAB_URL_TO_SHEET") {
    return;
  }

  saveCurrentTabUrlToSheet(message.note, message.runId)
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

  await appendRowToGoogleSheet(row, runId);

  sendLog(runId, "success", "Finished. URL saved to Google Sheet.");

  return {
    url: tab.url
  };
}

async function appendRowToGoogleSheet(row, runId) {
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
      values: [row]
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