const noteInput = document.querySelector("#noteInput");
const saveAllTabsButton = document.querySelector("#saveAllTabsButton");
const saveButton = document.querySelector("#saveButton");
const removeDuplicatesButton = document.querySelector("#removeDuplicatesButton");
const checkCompanyDuplicatesButton = document.querySelector("#checkCompanyDuplicatesButton");
const statusCard = document.querySelector("#statusCard");
const statusTitle = document.querySelector("#statusTitle");
const status = document.querySelector("#status");
const deletedRowsCard = document.querySelector("#deletedRowsCard");
const deletedRowsList = document.querySelector("#deletedRowsList");
const emptyDeletedRows = document.querySelector("#emptyDeletedRows");
const logsList = document.querySelector("#logsList");
const emptyLogs = document.querySelector("#emptyLogs");
const clearLogsButton = document.querySelector("#clearLogsButton");
const clearNoteButton = document.querySelector("#clearNoteButton");
const configToggleButton = document.querySelector("#configToggleButton");
const configPanel = document.querySelector("#configPanel");
const spreadsheetIdInput = document.querySelector("#spreadsheetIdInput");
const sheetNameInput = document.querySelector("#sheetNameInput");
const resumeTemplateInput = document.querySelector("#resumeTemplateInput");
const saveConfigButton = document.querySelector("#saveConfigButton");
const configStatus = document.querySelector("#configStatus");
const NOTE_DRAFT_STORAGE_KEY = "saveCurrentTabNoteDraft";

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
  if (removeDuplicatesButton) removeDuplicatesButton.disabled = disabled;
  if (checkCompanyDuplicatesButton) checkCompanyDuplicatesButton.disabled = disabled;
  if (saveConfigButton) saveConfigButton.disabled = disabled;
}

function showConfigStatus(type, message) {
  if (!configStatus) return;

  configStatus.classList.remove("is-hidden", "is-error", "is-success");
  configStatus.textContent = message;

  if (type === "error") {
    configStatus.classList.add("is-error");
    return;
  }

  configStatus.classList.add("is-success");
}

function clearConfigStatus() {
  configStatus?.classList.add("is-hidden");
  configStatus?.classList.remove("is-error", "is-success");
  if (configStatus) configStatus.textContent = "";
}

function setConfigPanelOpen(isOpen) {
  if (!configToggleButton || !configPanel) return;

  configToggleButton.setAttribute("aria-expanded", String(isOpen));
  configPanel.classList.toggle("is-open", isOpen);
  configToggleButton.classList.toggle("is-open", isOpen);
}

async function loadSheetConfig() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_SHEET_CONFIG"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load configuration.");
    }

    if (spreadsheetIdInput) {
      spreadsheetIdInput.value = response.spreadsheetId || "";
    }
    if (sheetNameInput) {
      sheetNameInput.value = response.sheetName || "";
    }
    if (resumeTemplateInput) {
      resumeTemplateInput.value = response.resumeTemplateId || "";
    }
  } catch (error) {
    console.error(error);
    showConfigStatus("error", error.message || "Could not load configuration.");
  }
}

async function saveSheetConfig() {
  clearConfigStatus();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_SHEET_CONFIG",
      spreadsheetId: spreadsheetIdInput?.value.trim() || "",
      sheetName: sheetNameInput?.value.trim() || "",
      resumeTemplateId: resumeTemplateInput?.value.trim() || ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save configuration.");
    }

    if (spreadsheetIdInput) {
      spreadsheetIdInput.value = response.spreadsheetId || "";
    }
    if (sheetNameInput) {
      sheetNameInput.value = response.sheetName || "";
    }
    if (resumeTemplateInput) {
      resumeTemplateInput.value = response.resumeTemplateId || "";
    }

    showConfigStatus(
      "success",
      `Saved. Sheet tab "${response.sheetName}", Resume template configured.`
    );
  } catch (error) {
    console.error(error);
    showConfigStatus("error", error.message || "Could not save configuration.");
  }
}

function showStatus(type, message, titleText) {
  if (!statusCard || !status || !statusTitle) return;

  statusCard.classList.remove("is-hidden", "is-error");

  if (type === "error") {
    statusCard.classList.add("is-error");
    statusTitle.textContent = "Error:";
    status.textContent = message;
    return;
  }

  statusTitle.textContent = titleText || "Saved:";
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

function updateDeletedRowsState() {
  if (!deletedRowsCard || !deletedRowsList || !emptyDeletedRows) return;

  const hasItems = deletedRowsList.children.length > 0;
  deletedRowsCard.classList.toggle("is-hidden", !hasItems);
  emptyDeletedRows.classList.toggle("is-hidden", hasItems);
}

function clearDeletedRows() {
  if (!deletedRowsList) return;
  deletedRowsList.innerHTML = "";
  updateDeletedRowsState();
}

function renderDeletedRows(deletedRows = []) {
  if (!deletedRowsList) return;

  deletedRowsList.innerHTML = "";

  deletedRows.forEach((row) => {
    const item = document.createElement("li");
    item.className = "deleted-row-item";

    const rowNumber = row.rowNumber ?? "?";
    const url = row.url || "(empty URL)";
    item.textContent = `Row ${rowNumber}: ${url}`;
    deletedRowsList.appendChild(item);
  });

  updateDeletedRowsState();
}

function updateClearNoteButtonState() {
  if (!clearNoteButton) return;

  const hasText = Boolean(noteInput?.value.trim());
  clearNoteButton.classList.toggle("is-hidden", !hasText);
}

async function saveCurrentTabUrl() {
  activeRunId = createRunId();

  clearStatus();
  clearLogs();
  clearDeletedRows();

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

    if (noteInput) {
      noteInput.value = "";
      updateClearNoteButtonState();
      chrome.storage.local.remove(NOTE_DRAFT_STORAGE_KEY).catch((error) => {
        console.error("Could not clear note draft:", error);
      });
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

async function loadNoteDraftFromStorage() {
  try {
    const stored = await chrome.storage.local.get(NOTE_DRAFT_STORAGE_KEY);
    const draft =
      typeof stored[NOTE_DRAFT_STORAGE_KEY] === "string"
        ? stored[NOTE_DRAFT_STORAGE_KEY]
        : "";

    if (noteInput) {
      noteInput.value = draft;
      updateClearNoteButtonState();
    }
  } catch (error) {
    console.error("Could not load note draft:", error);
  }
}

async function removeDuplicateSheetRows() {
  activeRunId = createRunId();

  clearStatus();
  clearLogs();
  clearDeletedRows();

  setSaveButtonsDisabled(true);
  addLog("info", "Remove Duplicate clicked. Scanning sheet...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "REMOVE_DUPLICATE_URLS_FROM_SHEET",
      runId: activeRunId
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not remove duplicates.");
    }

    const removed = response.removed ?? 0;
    const rowCount = response.rowCount ?? 0;
    const deletedRows = Array.isArray(response.deletedRows)
      ? response.deletedRows
      : [];

    if (rowCount === 0) {
      showStatus(
        "success",
        "The sheet has no rows yet.",
        "Done:"
      );
    } else if (removed === 0) {
      showStatus(
        "success",
        `No duplicate URLs found among ${rowCount} row(s).`,
        "Done:"
      );
      clearDeletedRows();
    } else {
      showStatus(
        "success",
        `Removed ${removed} duplicate row${removed === 1 ? "" : "s"} (${rowCount} row(s) scanned). First row for each URL was kept.`,
        "Done:"
      );
      renderDeletedRows(deletedRows);
    }
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
  clearDeletedRows();

  const noteValue = noteInput?.value.trim() || "";
  if (noteValue) {
    showStatus(
      "error",
      "Clear the note input before using Save all tabs."
    );
    addLog("error", "Save all tabs blocked because note input has text.");
    return;
  }

  setSaveButtonsDisabled(true);
  addLog("info", "Save all tabs clicked. Starting process...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_ALL_OPEN_TABS_URLS_TO_SHEET",
      runId: activeRunId
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
  if (message.type === "HOTKEY_SAVE_STARTED") {
    activeRunId = message.runId;
    clearStatus();
    clearLogs();
    clearDeletedRows();
    setSaveButtonsDisabled(true);
    addLog("info", "Hotkey detected. Starting save process...");
    return;
  }

  if (message.type === "HOTKEY_SAVE_FINISHED") {
    if (message.runId !== activeRunId) {
      return;
    }

    if (message.ok) {
      showStatus("success", message.url || "", "Saved:");
      addLog("success", "Process completed successfully.");
    } else {
      showStatus("error", message.error || "Something went wrong.");
      addLog("error", message.error || "Something went wrong.");
    }

    setSaveButtonsDisabled(false);
    return;
  }

  if (message.type !== "SAVE_PROCESS_LOG") {
    return;
  }

  if (message.runId !== activeRunId) {
    return;
  }

  addLog(message.level, message.message, message.timestamp);
});

async function checkCompanyDuplicates() {
  activeRunId = createRunId();

  clearStatus();
  clearLogs();
  clearDeletedRows();

  setSaveButtonsDisabled(true);
  addLog("info", "Check Company Duplicates clicked. Scanning sheet...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "CHECK_COMPANY_DUPLICATES",
      runId: activeRunId
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not check company duplicates.");
    }

    const duplicateCompanyCount = response.duplicateCompanyCount ?? 0;
    const highlightedRowCount = response.highlightedRowCount ?? 0;
    const rowCount = response.rowCount ?? 0;

    if (rowCount === 0) {
      showStatus("success", "The sheet has no rows yet.", "Done:");
    } else if (duplicateCompanyCount === 0) {
      showStatus(
        "success",
        `No company duplicates found among ${rowCount} row(s).`,
        "Done:"
      );
    } else {
      showStatus(
        "success",
        `Found ${duplicateCompanyCount} company${duplicateCompanyCount === 1 ? "" : "s"} with multiple applications. ${highlightedRowCount} row${highlightedRowCount === 1 ? "" : "s"} highlighted yellow in the sheet.`,
        "Done:"
      );
    }

    addLog("success", "Process completed successfully.");
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Something went wrong.");
    addLog("error", error.message || "Something went wrong.");
  } finally {
    setSaveButtonsDisabled(false);
  }
}

saveButton?.addEventListener("click", saveCurrentTabUrl);
saveAllTabsButton?.addEventListener("click", saveAllOpenTabUrls);
removeDuplicatesButton?.addEventListener("click", removeDuplicateSheetRows);
checkCompanyDuplicatesButton?.addEventListener("click", checkCompanyDuplicates);

configToggleButton?.addEventListener("click", () => {
  const isOpen = configToggleButton.getAttribute("aria-expanded") === "true";
  setConfigPanelOpen(!isOpen);
});

saveConfigButton?.addEventListener("click", saveSheetConfig);

clearLogsButton?.addEventListener("click", () => {
  clearLogs();
});

clearNoteButton?.addEventListener("click", () => {
  if (!noteInput) return;
  noteInput.value = "";
  noteInput.focus();
  updateClearNoteButtonState();
  chrome.storage.local.remove(NOTE_DRAFT_STORAGE_KEY).catch((error) => {
    console.error("Could not clear note draft:", error);
  });
});

noteInput?.addEventListener("input", () => {
  updateClearNoteButtonState();
  chrome.storage.local
    .set({
      [NOTE_DRAFT_STORAGE_KEY]: noteInput.value
    })
    .catch((error) => {
      console.error("Could not persist note draft:", error);
    });
});

noteInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) {
    return;
  }

  event.preventDefault();

  if (saveButton?.disabled) {
    return;
  }

  saveCurrentTabUrl();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[NOTE_DRAFT_STORAGE_KEY] || !noteInput) {
    return;
  }

  const nextValue = changes[NOTE_DRAFT_STORAGE_KEY].newValue;
  noteInput.value = typeof nextValue === "string" ? nextValue : "";
  updateClearNoteButtonState();
});

updateLogsState();
updateDeletedRowsState();
updateClearNoteButtonState();
loadNoteDraftFromStorage();
loadSheetConfig();
