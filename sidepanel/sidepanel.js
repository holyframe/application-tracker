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
const promptResumeList = document.querySelector("#promptResumeList");
const addPromptResumeButton = document.querySelector("#addPromptResumeButton");
const editSelectedPromptResumeButton = document.querySelector("#editSelectedPromptResumeButton");
const promptResumeSelectionStatus = document.querySelector("#promptResumeSelectionStatus");
const promptResumeFormModal = document.querySelector("#promptResumeFormModal");
const promptResumeFormModalTitle = document.querySelector("#promptResumeFormModalTitle");
const promptResumeFormModalHelp = document.querySelector("#promptResumeFormModalHelp");
const promptResumeFormModalBackdrop = document.querySelector("#promptResumeFormModalBackdrop");
const promptResumeFormModalCloseButton = document.querySelector("#promptResumeFormModalCloseButton");
const promptResumeFormModalCancelButton = document.querySelector("#promptResumeFormModalCancelButton");
const promptResumeFormModalSubmitButton = document.querySelector("#promptResumeFormModalSubmitButton");
const promptResumeFormModalStatus = document.querySelector("#promptResumeFormModalStatus");
const promptResumeLabelInput = document.querySelector("#promptResumeLabelInput");
const promptResumeContentInput = document.querySelector("#promptResumeContentInput");
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
  if (addPromptResumeButton) addPromptResumeButton.disabled = disabled;
  if (editSelectedPromptResumeButton) editSelectedPromptResumeButton.disabled = disabled;
  if (promptResumeFormModalSubmitButton) promptResumeFormModalSubmitButton.disabled = disabled;
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

function showPromptResumeSelectionStatus(type, message) {
  if (!promptResumeSelectionStatus) return;

  promptResumeSelectionStatus.classList.remove("is-hidden", "is-error", "is-success");
  promptResumeSelectionStatus.textContent = message;

  if (type === "error") {
    promptResumeSelectionStatus.classList.add("is-error");
    return;
  }

  promptResumeSelectionStatus.classList.add("is-success");
}

function clearPromptResumeSelectionStatus() {
  promptResumeSelectionStatus?.classList.add("is-hidden");
  promptResumeSelectionStatus?.classList.remove("is-error", "is-success");
  if (promptResumeSelectionStatus) promptResumeSelectionStatus.textContent = "";
}

function showPromptResumeFormModalStatus(type, message) {
  if (!promptResumeFormModalStatus) return;

  promptResumeFormModalStatus.classList.remove("is-hidden", "is-error", "is-success");
  promptResumeFormModalStatus.textContent = message;
  promptResumeFormModalStatus.classList.add(type === "error" ? "is-error" : "is-success");
}

function clearPromptResumeFormModalStatus() {
  promptResumeFormModalStatus?.classList.add("is-hidden");
  promptResumeFormModalStatus?.classList.remove("is-error", "is-success");
  if (promptResumeFormModalStatus) promptResumeFormModalStatus.textContent = "";
}

function resetPromptResumeFormModal() {
  if (promptResumeLabelInput) promptResumeLabelInput.value = "";
  if (promptResumeContentInput) promptResumeContentInput.value = "";
  clearPromptResumeFormModalStatus();
}

let promptResumeFormMode = "add";
let editingPromptResumeId = null;

function truncatePreviewText(text = "", maxLength = 60) {
  const singleLine = String(text).replace(/\s+/g, " ").trim();

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.slice(0, maxLength - 3)}...`;
}

function updatePromptResumeFormModalCopy() {
  const isEdit = promptResumeFormMode === "edit";

  if (promptResumeFormModalTitle) {
    promptResumeFormModalTitle.textContent = isEdit
      ? "Edit Prompt Resume"
      : "Add a Prompt Resume";
  }

  if (promptResumeFormModalHelp) {
    promptResumeFormModalHelp.textContent = isEdit
      ? "View or update the prompt resume text."
      : "Add a label and the prompt resume text.";
  }

  if (promptResumeFormModalSubmitButton) {
    promptResumeFormModalSubmitButton.textContent = isEdit
      ? "Save Changes"
      : "Add a Prompt Resume";
  }

  if (promptResumeFormModalBackdrop) {
    promptResumeFormModalBackdrop.setAttribute(
      "aria-label",
      isEdit ? "Close edit prompt resume dialog" : "Close add prompt resume dialog"
    );
  }
}

function setPromptResumeFormModalOpen(isOpen) {
  if (!promptResumeFormModal) return;

  promptResumeFormModal.classList.toggle("is-hidden", !isOpen);
  promptResumeFormModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    updatePromptResumeFormModalCopy();
    clearPromptResumeFormModalStatus();
    promptResumeLabelInput?.focus();
    return;
  }

  promptResumeFormMode = "add";
  editingPromptResumeId = null;
  resetPromptResumeFormModal();
  updatePromptResumeFormModalCopy();
  editSelectedPromptResumeButton?.focus();
}

function openAddPromptResumeModal() {
  promptResumeFormMode = "add";
  editingPromptResumeId = null;
  resetPromptResumeFormModal();
  setPromptResumeFormModalOpen(true);
}

function openEditPromptResumeModal(promptResumeId) {
  const promptResume = promptResumeSelectionState.promptResumes.find(
    (entry) => entry.id === promptResumeId
  );

  if (!promptResume) {
    showPromptResumeSelectionStatus("error", "Selected prompt resume could not be found.");
    return;
  }

  promptResumeFormMode = "edit";
  editingPromptResumeId = promptResume.id;

  if (promptResumeLabelInput) promptResumeLabelInput.value = promptResume.label;
  if (promptResumeContentInput) {
    promptResumeContentInput.value = promptResume.content || "";
  }

  setPromptResumeFormModalOpen(true);
}

function openEditSelectedPromptResumeModal() {
  if (!promptResumeSelectionState.selectedPromptResumeId) {
    return;
  }

  openEditPromptResumeModal(promptResumeSelectionState.selectedPromptResumeId);
}

function updateEditSelectedPromptResumeButton() {
  if (!editSelectedPromptResumeButton) return;

  const hasSelection = promptResumeSelectionState.promptResumes.some(
    (entry) => entry.id === promptResumeSelectionState.selectedPromptResumeId
  );

  editSelectedPromptResumeButton.classList.toggle("is-hidden", !hasSelection);
  editSelectedPromptResumeButton.disabled = !hasSelection;
}

let promptResumeSelectionState = {
  promptResumes: [],
  selectedPromptResumeId: ""
};

function renderPromptResumeList() {
  if (!promptResumeList) return;

  promptResumeList.innerHTML = "";

  if (promptResumeSelectionState.promptResumes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "prompt-resume-list-empty";
    empty.textContent = "No prompt resumes yet. Add one below.";
    promptResumeList.appendChild(empty);
    updateEditSelectedPromptResumeButton();
    return;
  }

  const canRemove = promptResumeSelectionState.promptResumes.length > 1;

  promptResumeSelectionState.promptResumes.forEach((promptResume) => {
    const item = document.createElement("li");
    item.className = "prompt-resume-item";
    item.classList.toggle(
      "is-selected",
      promptResume.id === promptResumeSelectionState.selectedPromptResumeId
    );

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "promptResume";
    radio.value = promptResume.id;
    radio.checked =
      promptResume.id === promptResumeSelectionState.selectedPromptResumeId;
    radio.setAttribute("aria-label", `Use ${promptResume.label}`);

    const copy = document.createElement("div");
    copy.className = "prompt-resume-copy";

    const label = document.createElement("span");
    label.className = "prompt-resume-label";
    label.textContent = promptResume.label;

    const preview = document.createElement("span");
    preview.className = "prompt-resume-preview";
    preview.textContent = truncatePreviewText(promptResume.content);

    copy.append(label, preview);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "prompt-resume-remove";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${promptResume.label}`);
    removeButton.disabled = !canRemove;
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      removePromptResume(promptResume.id);
    });

    item.addEventListener("click", () => {
      selectPromptResume(promptResume.id);
    });

    radio.addEventListener("click", (event) => {
      event.stopPropagation();
      selectPromptResume(promptResume.id);
    });

    item.append(radio, copy, removeButton);
    promptResumeList.appendChild(item);
  });

  updateEditSelectedPromptResumeButton();
}

async function loadPromptResumeSelection() {
  clearPromptResumeSelectionStatus();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_PROMPT_RESUME_SELECTION"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load prompt resumes.");
    }

    promptResumeSelectionState = {
      promptResumes: Array.isArray(response.promptResumes)
        ? response.promptResumes
        : [],
      selectedPromptResumeId: response.selectedPromptResumeId || ""
    };
    renderPromptResumeList();
  } catch (error) {
    console.error(error);
    showPromptResumeSelectionStatus(
      "error",
      error.message || "Could not load prompt resumes."
    );
  }
}

async function persistPromptResumeSelection(successMessage) {
  const response = await chrome.runtime.sendMessage({
    type: "SAVE_PROMPT_RESUME_SELECTION",
    promptResumes: promptResumeSelectionState.promptResumes,
    selectedPromptResumeId: promptResumeSelectionState.selectedPromptResumeId
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Could not save prompt resume selection.");
  }

  promptResumeSelectionState = {
    promptResumes: Array.isArray(response.promptResumes)
      ? response.promptResumes
      : [],
    selectedPromptResumeId: response.selectedPromptResumeId || ""
  };
  renderPromptResumeList();

  if (successMessage) {
    showPromptResumeSelectionStatus("success", successMessage);
  }
}

async function selectPromptResume(promptResumeId) {
  if (promptResumeId === promptResumeSelectionState.selectedPromptResumeId) {
    return;
  }

  clearPromptResumeSelectionStatus();
  promptResumeSelectionState.selectedPromptResumeId = promptResumeId;

  try {
    await persistPromptResumeSelection("Prompt resume selection updated.");
  } catch (error) {
    console.error(error);
    showPromptResumeSelectionStatus("error", error.message || "Could not update selection.");
    await loadPromptResumeSelection();
  }
}

async function removePromptResume(promptResumeId) {
  clearPromptResumeSelectionStatus();

  if (promptResumeSelectionState.promptResumes.length <= 1) {
    showPromptResumeSelectionStatus("error", "Keep at least one prompt resume.");
    return;
  }

  promptResumeSelectionState.promptResumes =
    promptResumeSelectionState.promptResumes.filter(
      (entry) => entry.id !== promptResumeId
    );

  if (promptResumeSelectionState.selectedPromptResumeId === promptResumeId) {
    promptResumeSelectionState.selectedPromptResumeId =
      promptResumeSelectionState.promptResumes[0]?.id || "";
  }

  try {
    await persistPromptResumeSelection("Prompt resume removed.");
  } catch (error) {
    console.error(error);
    showPromptResumeSelectionStatus("error", error.message || "Could not remove prompt resume.");
    await loadPromptResumeSelection();
  }
}

async function submitPromptResumeForm() {
  clearPromptResumeFormModalStatus();

  const label = promptResumeLabelInput?.value.trim() || "";
  const content = promptResumeContentInput?.value.trim() || "";

  if (!label) {
    showPromptResumeFormModalStatus("error", "Enter a label for the prompt resume.");
    promptResumeLabelInput?.focus();
    return;
  }

  if (!content) {
    showPromptResumeFormModalStatus("error", "Enter the prompt resume text.");
    promptResumeContentInput?.focus();
    return;
  }

  if (promptResumeFormModalSubmitButton) {
    promptResumeFormModalSubmitButton.disabled = true;
  }

  const isEdit = promptResumeFormMode === "edit" && editingPromptResumeId;
  const promptResumes = isEdit
    ? promptResumeSelectionState.promptResumes.map((entry) =>
        entry.id === editingPromptResumeId
          ? { id: entry.id, label, content }
          : entry
      )
    : [...promptResumeSelectionState.promptResumes, { label, content }];

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_PROMPT_RESUME_SELECTION",
      promptResumes,
      selectedPromptResumeId: promptResumeSelectionState.selectedPromptResumeId
    });

    if (!response?.ok) {
      throw new Error(
        response?.error ||
          (isEdit ? "Could not update prompt resume." : "Could not add prompt resume.")
      );
    }

    promptResumeSelectionState = {
      promptResumes: Array.isArray(response.promptResumes)
        ? response.promptResumes
        : [],
      selectedPromptResumeId: response.selectedPromptResumeId || ""
    };

    setPromptResumeFormModalOpen(false);
    renderPromptResumeList();
    showPromptResumeSelectionStatus(
      "success",
      isEdit ? `"${label}" updated.` : `"${label}" added.`
    );
  } catch (error) {
    console.error(error);
    showPromptResumeFormModalStatus(
      "error",
      error.message ||
        (isEdit ? "Could not update prompt resume." : "Could not add prompt resume.")
    );
  } finally {
    if (promptResumeFormModalSubmitButton) {
      promptResumeFormModalSubmitButton.disabled = false;
    }
  }
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

addPromptResumeButton?.addEventListener("click", openAddPromptResumeModal);
editSelectedPromptResumeButton?.addEventListener("click", openEditSelectedPromptResumeModal);
promptResumeFormModalBackdrop?.addEventListener("click", () =>
  setPromptResumeFormModalOpen(false)
);
promptResumeFormModalCloseButton?.addEventListener("click", () =>
  setPromptResumeFormModalOpen(false)
);
promptResumeFormModalCancelButton?.addEventListener("click", () =>
  setPromptResumeFormModalOpen(false)
);
promptResumeFormModalSubmitButton?.addEventListener("click", submitPromptResumeForm);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || promptResumeFormModal?.classList.contains("is-hidden")) {
    return;
  }

  setPromptResumeFormModalOpen(false);
});

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
loadPromptResumeSelection();
