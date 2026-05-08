const noteInput = document.querySelector("#noteInput");
const saveButton = document.querySelector("#saveButton");
const statusCard = document.querySelector("#statusCard");
const statusLabel = document.querySelector("#statusLabel");
const status = document.querySelector("#status");
const statusSuccessIcon = document.querySelector("#statusSuccessIcon");
const statusErrorIcon = document.querySelector("#statusErrorIcon");
const logsList = document.querySelector("#logsList");
const logsEmptyState = document.querySelector("#logsEmptyState");
const clearLogsButton = document.querySelector("#clearLogsButton");

let activeRunId = null;

function createRunId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showStatus(type, message) {
  if (!statusCard || !status || !statusLabel) return;

  statusCard.classList.remove("hidden", "error");

  if (type === "error") {
    statusCard.classList.add("error");
    statusLabel.textContent = "Error:";
    status.textContent = message;
    statusSuccessIcon?.classList.add("hidden");
    statusErrorIcon?.classList.remove("hidden");
    return;
  }

  statusLabel.textContent = "Saved:";
  status.textContent = message;
  statusSuccessIcon?.classList.remove("hidden");
  statusErrorIcon?.classList.add("hidden");
}

function clearStatus() {
  statusCard?.classList.add("hidden");
  statusCard?.classList.remove("error");
  if (status) status.textContent = "";
}

function updateLogsState() {
  if (!logsList || !logsEmptyState) return;

  const hasItems = logsList.children.length > 0;

  logsList.classList.toggle("has-items", hasItems);
  logsEmptyState.classList.toggle("hidden", hasItems);
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

  saveButton.disabled = true;
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
    saveButton.disabled = false;
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

clearLogsButton?.addEventListener("click", () => {
  clearLogs();
});

updateLogsState();