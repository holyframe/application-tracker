const noteInput = document.querySelector("#noteInput");
const saveAllTabsButton = document.querySelector("#saveAllTabsButton");
const saveButton = document.querySelector("#saveButton");
const statusCard = document.querySelector("#statusCard");
const statusTitle = document.querySelector("#statusTitle");
const status = document.querySelector("#status");
const logsList = document.querySelector("#logsList");
const emptyLogs = document.querySelector("#emptyLogs");
const clearLogsButton = document.querySelector("#clearLogsButton");

let activeRunId = null;

function createRunId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setSaveButtonsDisabled(disabled) {
  if (saveButton) saveButton.disabled = disabled;
  if (saveAllTabsButton) saveAllTabsButton.disabled = disabled;
}

function showStatus(type, message) {
  if (!statusCard || !status || !statusTitle) return;

  statusCard.classList.remove("is-hidden", "is-error");

  if (type === "error") {
    statusCard.classList.add("is-error");
    statusTitle.textContent = "Error:";
    status.textContent = message;
    return;
  }

  statusTitle.textContent = "Saved:";
  status.textContent = message;
}

function clearStatus() {
  statusCard?.classList.add("is-hidden");
  statusCard?.classList.remove("is-error");
  if (status) status.textContent = "";
}

function updateLogsState() {
  if (!logsList || !emptyLogs) return;

  const hasItems = logsList.children.length > 0;

  logsList.classList.toggle("has-items", hasItems);
  emptyLogs.classList.toggle("is-hidden", hasItems);
}

function addLog(level, message, timestamp = new Date().toLocaleTimeString()) {
  if (!logsList) {
    console.log(`[${level}] ${message}`);
    return;
  }

  const item = document.createElement("li");
  item.className = `log-item log-${level}`;

  item.innerHTML = `
    <span class="log-time">${timestamp}</span>
    <span class="log-level">${level.toUpperCase()}</span>
    <span class="log-message"></span>
  `;

  item.querySelector(".log-message").textContent = message;
  logsList.appendChild(item);

  updateLogsState();
  logsList.scrollTop = logsList.scrollHeight;
}

function clearLogs() {
  if (!logsList) return;
  logsList.innerHTML = "";
  updateLogsState();
}

async function saveCurrentTabUrl() {
  activeRunId = createRunId();

  clearStatus();
  clearLogs();

  setSaveButtonsDisabled(true);
  addLog("info", "Button clicked. Starting process...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_CURRENT_TAB_URL_TO_SHEET",
      runId: activeRunId,
      note: noteInput?.value.trim() || ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save URL.");
    }

    showStatus("success", response.url);
    addLog("success", "Process completed successfully.");
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Something went wrong.");
    addLog("error", error.message || "Something went wrong.");
  } finally {
    setSaveButtonsDisabled(false);
  }
}

async function saveAllOpenTabUrls() {
  activeRunId = createRunId();

  clearStatus();
  clearLogs();

  setSaveButtonsDisabled(true);
  addLog("info", "Save all tabs clicked. Starting process...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_ALL_OPEN_TABS_URLS_TO_SHEET",
      runId: activeRunId,
      note: noteInput?.value.trim() || ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save URLs.");
    }

    const count = response.count ?? 0;
    showStatus(
      "success",
      `${count} tab URL${count === 1 ? "" : "s"} saved to Google Sheet.`
    );
    addLog("success", "Process completed successfully.");
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Something went wrong.");
    addLog("error", error.message || "Something went wrong.");
  } finally {
    setSaveButtonsDisabled(false);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "SAVE_PROCESS_LOG") {
    return;
  }

  if (message.runId !== activeRunId) {
    return;
  }

  addLog(message.level, message.message, message.timestamp);
});

saveButton?.addEventListener("click", saveCurrentTabUrl);
saveAllTabsButton?.addEventListener("click", saveAllOpenTabUrls);

clearLogsButton?.addEventListener("click", () => {
  clearLogs();
});

updateLogsState();
