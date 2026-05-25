// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const DEFAULT_SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
const DEFAULT_SHEET_NAME = "Sheet1";
const DEFAULT_RESUME_TEMPLATE_ID = "1oF1GQJ6bTEli1548HVyI91O803oQaeP8ec8Y81bj5zM";
const CHATGPT_URL = "https://chatgpt.com";
const NOTE_DRAFT_STORAGE_KEY = "saveCurrentTabNoteDraft";
const SHEET_CONFIG_STORAGE_KEY = "sheetConfig";
const PROMPT_RESUME_SELECTION_STORAGE_KEY = "promptResumeSelection";
const LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY = "resumeSelection";
const PROMPT_SELECTION_STORAGE_KEY = "promptSelection";
const JOB_DESCRIPTION_SELECTION_STORAGE_KEY = "jobDescriptionSelection";
const SAVE_CHECK_REMINDER_ALARM_NAME = "save-current-tab-check-reminder";
const SAVE_CHECK_REMINDER_STORAGE_KEY = "saveCheckReminder";
const SAVE_CHECK_REMINDER_DELAY_MINUTES = 2;
const SAVE_CHECK_REMINDER_NOTIFICATION_ID = "application-helper-check-reminder";
const CHATGPT_TAB_CLOSE_ALARM_NAME = "close-chatgpt-tab-after-save";
const CHATGPT_TAB_CLOSE_STORAGE_KEY = "pendingChatGptTabClose";
const CHATGPT_TAB_CLOSE_DELAY_MINUTES = 1.9;
const EXTENSION_UI_LOCK_STORAGE_KEY = "extensionUiLockedUntilNotification";
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

function createPromptResumeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `prompt-resume-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeUpdatedAt(value) {
  const date = new Date(value ?? "");
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function normalizePromptContent(value) {
  return String(value ?? "").trim();
}

function normalizeLabeledTextEntry(entry, createId) {
  const label = String(entry?.label ?? entry?.name ?? "").trim();
  const content = String(entry?.content ?? entry?.docInput ?? "").trim();

  if (!label || !content) {
    return null;
  }

  const isNew = !entry?.id;
  const id = String(entry?.id || createId());
  const storedUpdatedAt = normalizeUpdatedAt(entry?.updatedAt);
  const updatedAt = storedUpdatedAt || (isNew ? new Date().toISOString() : "");

  return {
    id,
    label,
    content,
    updatedAt
  };
}

function normalizePromptResume(entry) {
  return normalizeLabeledTextEntry(entry, createPromptResumeId);
}

async function loadPromptResumeSelectionRecord() {
  const stored = await chrome.storage.local.get([
    PROMPT_RESUME_SELECTION_STORAGE_KEY,
    LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY
  ]);

  if (stored[PROMPT_RESUME_SELECTION_STORAGE_KEY]) {
    return stored[PROMPT_RESUME_SELECTION_STORAGE_KEY];
  }

  if (stored[LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY]) {
    const legacy = stored[LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY];
    const migrated = {
      promptResumes: legacy.promptResumes ?? legacy.templates ?? [],
      selectedPromptResumeId:
        legacy.selectedPromptResumeId ?? legacy.selectedId ?? ""
    };

    await chrome.storage.local.set({
      [PROMPT_RESUME_SELECTION_STORAGE_KEY]: migrated
    });

    return migrated;
  }

  return null;
}

async function getPromptResumeSelectionState() {
  const selection = await loadPromptResumeSelectionRecord();

  if (selection) {
    const promptResumes = (
      Array.isArray(selection.promptResumes) ? selection.promptResumes : []
    )
      .map(normalizePromptResume)
      .filter(Boolean);

    const selectedPromptResumeId =
      selection.selectedPromptResumeId === ""
        ? ""
        : promptResumes.some(
              (entry) => entry.id === selection.selectedPromptResumeId
            )
          ? selection.selectedPromptResumeId
          : promptResumes[0]?.id || "";

    return { promptResumes, selectedPromptResumeId };
  }

  return { promptResumes: [], selectedPromptResumeId: "" };
}

async function savePromptResumeSelectionState(
  promptResumesInput,
  selectedPromptResumeIdInput
) {
  const promptResumes = (
    Array.isArray(promptResumesInput) ? promptResumesInput : []
  )
    .map(normalizePromptResume)
    .filter(Boolean);

  const selectedPromptResumeId =
    selectedPromptResumeIdInput === ""
      ? ""
      : promptResumes.some((entry) => entry.id === selectedPromptResumeIdInput)
        ? selectedPromptResumeIdInput
        : promptResumes[0]?.id || "";

  const state = { promptResumes, selectedPromptResumeId };

  await chrome.storage.local.set({
    [PROMPT_RESUME_SELECTION_STORAGE_KEY]: state
  });

  return state;
}

async function resetApplicationInputsAfterSave(runId = "") {
  const resumeState = await getPromptResumeSelectionState();

  await savePromptResumeSelectionState(resumeState.promptResumes, "");
  await saveJobDescriptionSelectionState("");

  const message = "Cleared prompt resume selection and job description.";

  if (runId) {
    sendLog(runId, "info", message);
    return;
  }

  chrome.runtime
    .sendMessage({
      type: "APPLICATION_INPUTS_RESET",
      message
    })
    .catch(() => {});
}

async function loadPromptSelectionRecord() {
  const stored = await chrome.storage.local.get(PROMPT_SELECTION_STORAGE_KEY);
  const selection = stored[PROMPT_SELECTION_STORAGE_KEY];

  if (!selection) {
    return null;
  }

  if (typeof selection.content === "string") {
    return {
      content: normalizePromptContent(selection.content),
      updatedAt: normalizeUpdatedAt(selection.updatedAt)
    };
  }

  const prompts = Array.isArray(selection.prompts) ? selection.prompts : [];
  const selected =
    prompts.find((entry) => entry.id === selection.selectedPromptId) || prompts[0];

  if (!selected) {
    return { content: "", updatedAt: "" };
  }

  const migrated = {
    content: normalizePromptContent(selected.content),
    updatedAt: normalizeUpdatedAt(selected.updatedAt)
  };

  await chrome.storage.local.set({
    [PROMPT_SELECTION_STORAGE_KEY]: migrated
  });

  return migrated;
}

async function getPromptSelectionState() {
  const selection = await loadPromptSelectionRecord();

  if (selection) {
    return selection;
  }

  return { content: "", updatedAt: "" };
}

async function savePromptSelectionState(contentInput) {
  const content = normalizePromptContent(contentInput);
  const state = {
    content,
    updatedAt: content ? new Date().toISOString() : ""
  };

  await chrome.storage.local.set({
    [PROMPT_SELECTION_STORAGE_KEY]: state
  });

  return state;
}

async function loadJobDescriptionSelectionRecord() {
  const stored = await chrome.storage.local.get(JOB_DESCRIPTION_SELECTION_STORAGE_KEY);
  const selection = stored[JOB_DESCRIPTION_SELECTION_STORAGE_KEY];

  if (!selection) {
    return null;
  }

  if (typeof selection.content === "string") {
    return {
      content: normalizePromptContent(selection.content),
      updatedAt: normalizeUpdatedAt(selection.updatedAt)
    };
  }

  return { content: "", updatedAt: "" };
}

async function getJobDescriptionSelectionState() {
  const selection = await loadJobDescriptionSelectionRecord();

  if (selection) {
    return selection;
  }

  return { content: "", updatedAt: "" };
}

async function saveJobDescriptionSelectionState(contentInput) {
  const content = normalizePromptContent(contentInput);
  const state = {
    content,
    updatedAt: content ? new Date().toISOString() : ""
  };

  await chrome.storage.local.set({
    [JOB_DESCRIPTION_SELECTION_STORAGE_KEY]: state
  });

  return state;
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

  const token = await getGoogleAccessToken();
  await ensureSheetExists(token, spreadsheetId, sheetName);

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

const CHATGPT_NEW_TAB_SETTLE_MS = { min: 3000, max: 5000 };

function randomDelayMs(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForTabComplete(tabId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const checkStatus = async () => {
      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === "complete") {
          resolve(tab);
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error("ChatGPT tab took too long to load."));
          return;
        }

        setTimeout(checkStatus, 250);
      } catch (error) {
        reject(error);
      }
    };

    checkStatus();
  });
}

async function sendFillAndSendToTab(tabId, text, runId, maxAttempts = 24) {
  let lastError = new Error("Could not reach ChatGPT page.");

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "FILL_AND_SEND",
        text
      });

      if (response?.ok) {
        return response;
      }

      lastError = new Error(response?.error || "Could not fill ChatGPT prompt.");
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxAttempts) {
      sendLog(
        runId,
        "info",
        `Waiting for ChatGPT page (${attempt}/${maxAttempts})...`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError;
}

function isChatGptUrl(url = "") {
  return /^https:\/\/(chatgpt\.com|chat\.openai\.com)/.test(url);
}

function isTabInGroup(tab) {
  return (
    typeof tab?.groupId === "number" &&
    tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
  );
}

function assertActiveJobTabUsable(tab) {
  if (!tab) {
    throw new Error("No active tab found.");
  }

  if (!tab.url) {
    throw new Error("Current tab does not have a URL.");
  }

  if (tab.pinned) {
    throw new Error("Pinned tabs are not supported. Unpin the tab and try again.");
  }

  if (isTabInGroup(tab)) {
    throw new Error(
      "Grouped tabs are not supported. Ungroup the tab or open it outside a tab group and try again."
    );
  }
}

function isChatGptConversationUrl(url = "") {
  return /\/c\/[a-zA-Z0-9-]+/.test(url);
}

function formatSaveValidationError(missing) {
  if (missing.length === 1) {
    return `${missing[0]} is required before saving.`;
  }

  return `These are required before saving: ${missing.join(", ")}.`;
}

async function validateApplicationInputsForSave() {
  const [promptState, jobDescriptionState, resumeState] = await Promise.all([
    getPromptSelectionState(),
    getJobDescriptionSelectionState(),
    getPromptResumeSelectionState()
  ]);

  const missing = [];

  if (!promptState.content?.trim()) {
    missing.push("GPT prompt");
  }

  if (!jobDescriptionState.content?.trim()) {
    missing.push("job description");
  }

  const hasSelectedResume =
    Boolean(resumeState.selectedPromptResumeId) &&
    resumeState.promptResumes.some(
      (entry) => entry.id === resumeState.selectedPromptResumeId
    );

  if (!hasSelectedResume) {
    missing.push("prompt resume selection");
  }

  if (missing.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    missing,
    error: formatSaveValidationError(missing)
  };
}

async function buildChatGptMessageFromStorage() {
  const [promptState, jobDescriptionState, resumeState] = await Promise.all([
    getPromptSelectionState(),
    getJobDescriptionSelectionState(),
    getPromptResumeSelectionState()
  ]);

  const selectedResume = resumeState.promptResumes.find(
    (entry) => entry.id === resumeState.selectedPromptResumeId
  );

  const parts = [];

  if (promptState.content?.trim()) {
    parts.push(promptState.content.trim());
  }

  if (jobDescriptionState.content?.trim()) {
    parts.push(`Job description:\n${jobDescriptionState.content.trim()}`);
  }

  if (selectedResume?.content?.trim()) {
    parts.push(`Resume:\n${selectedResume.content.trim()}`);
  }

  return parts.join("\n\n");
}

async function openNewChatGptTab(runId, { active = true } = {}) {
  sendLog(runId, "info", "Opening ChatGPT in a new tab...");
  const tab = await chrome.tabs.create({ url: CHATGPT_URL, active });
  await waitForTabComplete(tab.id);

  return {
    url: CHATGPT_URL,
    tabId: typeof tab.id === "number" ? tab.id : null
  };
}

async function resolveChatGptUrlAfterSend(tabId, runId) {
  const startedAt = Date.now();
  const timeoutMs = 20000;

  while (Date.now() - startedAt < timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || "";

    if (isChatGptConversationUrl(url)) {
      return url;
    }

    await sleep(500);
  }

  const tab = await chrome.tabs.get(tabId);
  if (tab.url && isChatGptUrl(tab.url)) {
    sendLog(
      runId,
      "info",
      "Conversation URL not detected yet. Using current ChatGPT tab URL."
    );
    return tab.url;
  }

  return CHATGPT_URL;
}

async function sendToChatGptAndGetUrl(text, runId) {
  const promptText = String(text ?? "").trim();
  if (!promptText) {
    throw new Error("Nothing to send to ChatGPT.");
  }

  const { tabId } = await openNewChatGptTab(runId, { active: true });
  if (typeof tabId !== "number") {
    throw new Error("Could not open a new ChatGPT tab.");
  }

  const settleMs = randomDelayMs(
    CHATGPT_NEW_TAB_SETTLE_MS.min,
    CHATGPT_NEW_TAB_SETTLE_MS.max
  );

  sendLog(
    runId,
    "info",
    `Waiting ${(settleMs / 1000).toFixed(1)}s before filling prompt...`
  );
  await sleep(settleMs);

  sendLog(runId, "info", "Sending prompt to ChatGPT...");
  await sendFillAndSendToTab(tabId, promptText, runId);

  const chatGptUrl = await resolveChatGptUrlAfterSend(tabId, runId);
  sendLog(runId, "success", `Prompt sent to ChatGPT: ${chatGptUrl}`);

  return {
    url: chatGptUrl,
    tabId
  };
}

async function scheduleSaveCheckReminder(
  {
    jobTitle = "",
    jobUrl = "",
    chatGptUrl = "",
    windowId = null,
    mode = "save",
    groupId = null
  } = {},
  runId
) {
  await chrome.storage.local.set({
    [SAVE_CHECK_REMINDER_STORAGE_KEY]: {
      jobTitle: String(jobTitle || "Application").trim() || "Application",
      jobUrl: String(jobUrl || "").trim(),
      chatGptUrl: String(chatGptUrl || CHATGPT_URL).trim() || CHATGPT_URL,
      windowId: typeof windowId === "number" ? windowId : null,
      mode: mode === "apply" ? "apply" : "save",
      groupId: typeof groupId === "number" ? groupId : null,
      scheduledAt: Date.now()
    }
  });

  await chrome.alarms.clear(SAVE_CHECK_REMINDER_ALARM_NAME);
  await chrome.alarms.create(SAVE_CHECK_REMINDER_ALARM_NAME, {
    delayInMinutes: SAVE_CHECK_REMINDER_DELAY_MINUTES
  });

  sendLog(
    runId,
    "info",
    `Check reminder scheduled in ${SAVE_CHECK_REMINDER_DELAY_MINUTES} minutes.`
  );
}

async function isExtensionUiLockedForNotification() {
  const stored = await chrome.storage.local.get(EXTENSION_UI_LOCK_STORAGE_KEY);
  return Boolean(stored[EXTENSION_UI_LOCK_STORAGE_KEY]?.locked);
}

async function lockExtensionUiUntilNotification(runId) {
  await chrome.storage.local.set({
    [EXTENSION_UI_LOCK_STORAGE_KEY]: {
      locked: true,
      lockedAt: Date.now()
    }
  });

  sendLog(
    runId,
    "info",
    "Extension locked until check notification. Process logs only."
  );
}

async function unlockExtensionUi() {
  await chrome.storage.local.remove(EXTENSION_UI_LOCK_STORAGE_KEY);
}

async function openReminderUrls(jobUrl, chatGptUrl) {
  const normalizedJobUrl = String(jobUrl || "").trim();
  const normalizedChatGptUrl = String(chatGptUrl || CHATGPT_URL).trim() || CHATGPT_URL;

  if (normalizedJobUrl) {
    await chrome.tabs.create({ url: normalizedJobUrl, active: false });
  }

  await chrome.tabs.create({ url: normalizedChatGptUrl, active: true });
}

async function focusReminderSourceWindow(windowId) {
  if (typeof windowId !== "number") {
    return;
  }

  try {
    await chrome.windows.update(windowId, { focused: true });
  } catch (_error) {
    // Window may have been closed.
  }
}

async function focusApplicationTabGroup(groupId, windowId) {
  if (typeof groupId !== "number") {
    await focusReminderSourceWindow(windowId);
    return;
  }

  try {
    const group = await chrome.tabGroups.get(groupId);

    if (group.collapsed) {
      await chrome.tabGroups.update(groupId, { collapsed: false });
    }

    const tabs = await chrome.tabs.query({ groupId });
    const tabToActivate = tabs.find((tab) => tab.active) || tabs[0];

    if (tabToActivate?.id != null) {
      await chrome.tabs.update(tabToActivate.id, { active: true });

      if (typeof tabToActivate.windowId === "number") {
        await chrome.windows.update(tabToActivate.windowId, { focused: true });
        return;
      }
    }

    if (typeof group.windowId === "number") {
      await chrome.windows.update(group.windowId, { focused: true });
    }
  } catch (_error) {
    await focusReminderSourceWindow(windowId);
  }
}

async function scheduleChatGptTabClose(tabId, runId) {
  await chrome.storage.local.set({
    [CHATGPT_TAB_CLOSE_STORAGE_KEY]: {
      tabId,
      scheduledAt: Date.now()
    }
  });

  await chrome.alarms.clear(CHATGPT_TAB_CLOSE_ALARM_NAME);
  await chrome.alarms.create(CHATGPT_TAB_CLOSE_ALARM_NAME, {
    delayInMinutes: CHATGPT_TAB_CLOSE_DELAY_MINUTES
  });

  sendLog(
    runId,
    "info",
    `ChatGPT tab will close in ${CHATGPT_TAB_CLOSE_DELAY_MINUTES} minutes.`
  );
}

async function closeScheduledChatGptTab() {
  const stored = await chrome.storage.local.get(CHATGPT_TAB_CLOSE_STORAGE_KEY);
  const pending = stored[CHATGPT_TAB_CLOSE_STORAGE_KEY];

  if (!pending || typeof pending.tabId !== "number") {
    await chrome.storage.local.remove(CHATGPT_TAB_CLOSE_STORAGE_KEY);
    return;
  }

  try {
    await chrome.tabs.remove(pending.tabId);
  } catch (_error) {
    // Tab may already be closed manually.
  }

  await chrome.storage.local.remove(CHATGPT_TAB_CLOSE_STORAGE_KEY);
}

async function showSaveCheckReminderNotification() {
  const stored = await chrome.storage.local.get(SAVE_CHECK_REMINDER_STORAGE_KEY);
  const reminder = stored[SAVE_CHECK_REMINDER_STORAGE_KEY] || {};
  const jobTitle = reminder.jobTitle || "your saved application";
  const isApplyMode = reminder.mode === "apply";

  await chrome.notifications.create(SAVE_CHECK_REMINDER_NOTIFICATION_ID, {
    type: "basic",
    iconUrl: "assets/icon128.png",
    title: "Application Helper",
    message: `Time to check ChatGPT for: ${jobTitle}`,
    priority: 2,
    requireInteraction: true,
    buttons: [{ title: isApplyMode ? "Close" : "Check" }]
  });

  await resetApplicationInputsAfterSave();
  await unlockExtensionUi();
}

async function getSaveCheckReminderState() {
  const stored = await chrome.storage.local.get(SAVE_CHECK_REMINDER_STORAGE_KEY);
  return stored[SAVE_CHECK_REMINDER_STORAGE_KEY] || {};
}

async function dismissSaveCheckReminderNotification(
  notificationId,
  { action = "dismiss" } = {}
) {
  const reminder = await getSaveCheckReminderState();

  if (action === "openUrls") {
    await openReminderUrls(reminder.jobUrl, reminder.chatGptUrl);
  } else if (action === "focusWindow") {
    await focusReminderSourceWindow(reminder.windowId);
  } else if (action === "openGroup") {
    await focusApplicationTabGroup(reminder.groupId, reminder.windowId);
  }

  await chrome.storage.local.remove(SAVE_CHECK_REMINDER_STORAGE_KEY);
  await chrome.notifications.clear(notificationId);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SAVE_CHECK_REMINDER_ALARM_NAME) {
    try {
      await showSaveCheckReminderNotification();
    } catch (error) {
      console.error("Could not show save check reminder:", error);
    }
    return;
  }

  if (alarm.name === CHATGPT_TAB_CLOSE_ALARM_NAME) {
    try {
      await closeScheduledChatGptTab();
    } catch (error) {
      console.error("Could not close scheduled ChatGPT tab:", error);
    }
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId !== SAVE_CHECK_REMINDER_NOTIFICATION_ID) {
    return;
  }

  if (buttonIndex !== 0) {
    return;
  }

  try {
    const reminder = await getSaveCheckReminderState();
    const action = reminder.mode === "apply" ? "dismiss" : "openUrls";
    await dismissSaveCheckReminderNotification(notificationId, { action });
  } catch (error) {
    console.error("Could not handle save check reminder notification button:", error);
  }
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId !== SAVE_CHECK_REMINDER_NOTIFICATION_ID) {
    return;
  }

  try {
    const reminder = await getSaveCheckReminderState();
    const action = reminder.mode === "apply" ? "openGroup" : "focusWindow";
    await dismissSaveCheckReminderNotification(notificationId, { action });
  } catch (error) {
    console.error("Could not handle save check reminder notification click:", error);
  }
});

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  if (notificationId !== SAVE_CHECK_REMINDER_NOTIFICATION_ID) {
    return;
  }

  if (byUser) {
    await chrome.storage.local.remove(SAVE_CHECK_REMINDER_STORAGE_KEY);
    return;
  }

  const stored = await chrome.storage.local.get(SAVE_CHECK_REMINDER_STORAGE_KEY);
  if (stored[SAVE_CHECK_REMINDER_STORAGE_KEY]) {
    await showSaveCheckReminderNotification();
  }
});

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
    if (await isExtensionUiLockedForNotification()) {
      sendLog(runId, "error", "Please wait for the check notification before starting another save.");
      await chrome.runtime.sendMessage({
        type: "HOTKEY_SAVE_FINISHED",
        runId,
        ok: false,
        error: "Please wait for the check notification before starting another save."
      });
      return;
    }

    const validation = await validateApplicationInputsForSave();
    if (!validation.ok) {
      sendLog(runId, "error", validation.error);
      await chrome.runtime.sendMessage({
        type: "HOTKEY_SAVE_FINISHED",
        runId,
        ok: false,
        error: validation.error
      });
      return;
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    try {
      assertActiveJobTabUsable(tab);
    } catch (error) {
      sendLog(runId, "error", error.message);
      await chrome.runtime.sendMessage({
        type: "HOTKEY_SAVE_FINISHED",
        runId,
        ok: false,
        error: error.message
      });
      return;
    }

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

  if (message.type === "GET_PROMPT_RESUME_SELECTION") {
    getPromptResumeSelectionState()
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not load prompt resume selection."
        });
      });
    return true;
  }

  if (message.type === "SAVE_PROMPT_RESUME_SELECTION") {
    savePromptResumeSelectionState(
      message.promptResumes ?? message.templates,
      message.selectedPromptResumeId ?? message.selectedId
    )
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save prompt resume selection."
        });
      });
    return true;
  }

  if (message.type === "GET_PROMPT_SELECTION") {
    getPromptSelectionState()
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not load prompt selection."
        });
      });
    return true;
  }

  if (message.type === "SAVE_PROMPT_SELECTION") {
    savePromptSelectionState(message.content)
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save prompt selection."
        });
      });
    return true;
  }

  if (message.type === "GET_JOB_DESCRIPTION_SELECTION") {
    getJobDescriptionSelectionState()
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not load job description selection."
        });
      });
    return true;
  }

  if (message.type === "SAVE_JOB_DESCRIPTION_SELECTION") {
    saveJobDescriptionSelectionState(message.content)
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save job description selection."
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

  const runPromise =
    message.type === "SAVE_CURRENT_TAB_URL_TO_SHEET"
      ? run(message.note, message.runId, {
          groupTabs: message.mode === "apply"
        })
      : run(message.runId);

  runPromise
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

async function groupApplicationTabs({
  jobTabId,
  resumeUrl,
  chatGptUrl,
  chatGptTabId,
  groupTitle,
  runId
}) {
  if (typeof jobTabId !== "number") {
    throw new Error("Job tab does not have a valid tab ID.");
  }

  const jobTab = await chrome.tabs.get(jobTabId);

  sendLog(runId, "info", "Opening resume copy in a new tab...");
  const resumeTab = await chrome.tabs.create({
    url: resumeUrl,
    active: false,
    windowId: jobTab.windowId
  });

  let gptTabId = chatGptTabId;

  if (typeof gptTabId !== "number") {
    sendLog(runId, "info", "Opening ChatGPT in a new tab...");
    const gptTab = await chrome.tabs.create({
      url: chatGptUrl || CHATGPT_URL,
      active: false,
      windowId: jobTab.windowId
    });
    gptTabId = gptTab.id;
  } else {
    try {
      const gptTab = await chrome.tabs.get(gptTabId);

      if (chatGptUrl && gptTab.url !== chatGptUrl) {
        await chrome.tabs.update(gptTabId, { url: chatGptUrl });
      }

      if (gptTab.windowId !== jobTab.windowId) {
        await chrome.tabs.move(gptTabId, { windowId: jobTab.windowId, index: -1 });
      }
    } catch (_error) {
      const gptTab = await chrome.tabs.create({
        url: chatGptUrl || CHATGPT_URL,
        active: false,
        windowId: jobTab.windowId
      });
      gptTabId = gptTab.id;
    }
  }

  const tabIds = [jobTabId, resumeTab.id, gptTabId].filter((id) => typeof id === "number");

  if (tabIds.length < 3) {
    throw new Error("Could not group all application tabs.");
  }

  sendLog(runId, "info", "Grouping job, resume, and ChatGPT tabs...");
  const groupId = await chrome.tabs.group({ tabIds });

  await chrome.tabGroups.update(groupId, {
    title: String(groupTitle || "Application").trim().slice(0, 100) || "Application",
    color: "green"
  });

  sendLog(runId, "success", "Application tabs grouped.");

  return groupId;
}

async function saveCurrentTabUrlToSheet(note = "", runId, options = {}) {
  const groupTabsInsteadOfClosing = options.groupTabs === true;
  sendLog(
    runId,
    "info",
    groupTabsInsteadOfClosing
      ? "Starting apply process..."
      : "Starting save process..."
  );

  if (await isExtensionUiLockedForNotification()) {
    throw new Error(
      "Please wait for the check notification before starting another save."
    );
  }

  const validation = await validateApplicationInputsForSave();
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  assertActiveJobTabUsable(tab);

  await lockExtensionUiUntilNotification(runId);

  try {
    sendLog(runId, "info", "Checking current active tab...");

    const urlForSheet = normalizeUrlForStorage(tab.url);

    sendLog(runId, "success", `Found tab URL: ${tab.url}`);

    const { resumeTemplateId } = await getSheetConfig();
    const token = await getGoogleAccessToken();

    const docTitle = tab.title || `Application ${new Date().toLocaleDateString()}`;
    sendLog(runId, "info", "Creating resume copy...");
    const resumeUrl = await copyResumeAndGetUrl(token, docTitle, resumeTemplateId, runId);
    sendLog(runId, "success", `Resume copy created: ${resumeUrl}`);

    sendLog(runId, "info", "Preparing ChatGPT prompt...");
    const chatGptMessage = await buildChatGptMessageFromStorage();
    let chatGptUrl = CHATGPT_URL;
    let chatGptTabId = null;

    if (chatGptMessage) {
      const chatGptResult = await sendToChatGptAndGetUrl(chatGptMessage, runId);
      chatGptUrl = chatGptResult.url;
      chatGptTabId = chatGptResult.tabId;
    } else {
      sendLog(
        runId,
        "info",
        "No GPT prompt, job description, or prompt resume configured."
      );
      const chatGptResult = await openNewChatGptTab(runId);
      chatGptUrl = chatGptResult.url;
      chatGptTabId = chatGptResult.tabId;
    }

    const row = [
      new Date().toISOString(),
      tab.title || "",
      urlForSheet,
      resumeUrl,
      chatGptUrl,
      note || ""
    ];

    sendLog(runId, "info", "Preparing row for Google Sheet...");

    await appendRowsToGoogleSheet([row], runId);
    sendLog(runId, "success", "URL saved to Google Sheet.");

    if (typeof tab.id !== "number") {
      throw new Error("Current tab does not have a valid tab ID.");
    }

    let applicationGroupId = null;

    if (groupTabsInsteadOfClosing) {
      applicationGroupId = await groupApplicationTabs({
        jobTabId: tab.id,
        resumeUrl,
        chatGptUrl,
        chatGptTabId,
        groupTitle: tab.title || "Application",
        runId
      });
    } else {
      sendLog(runId, "info", "Closing current tab...");
      await chrome.tabs.remove(tab.id);
      sendLog(runId, "success", "Current tab closed.");

      if (typeof chatGptTabId === "number") {
        await scheduleChatGptTabClose(chatGptTabId, runId);
      }
    }

    await scheduleSaveCheckReminder(
      {
        jobTitle: tab.title || "",
        jobUrl: urlForSheet,
        chatGptUrl,
        windowId: tab.windowId,
        mode: groupTabsInsteadOfClosing ? "apply" : "save",
        groupId: applicationGroupId
      },
      runId
    );

    sendLog(
      runId,
      "success",
      groupTabsInsteadOfClosing
        ? "Finished. Application tabs grouped."
        : "Finished. Job tab closed."
    );

    return {
      url: urlForSheet,
      chatGptUrl,
      grouped: groupTabsInsteadOfClosing
    };
  } catch (error) {
    await unlockExtensionUi();
    throw error;
  }
}

async function saveAllOpenTabsUrlsToSheet(runId) {
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
      CHATGPT_URL,
      ""
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

async function checkCompanyDuplicatesInSheet(runId) {
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

async function ensureSheetExists(token, spreadsheetId, sheetTitle, runId) {
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

  if (sheet?.properties?.sheetId != null) {
    return sheet.properties.sheetId;
  }

  if (runId) {
    sendLog(runId, "info", `Sheet "${sheetTitle}" not found. Creating it...`);
  }

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const createResponse = await fetch(batchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: { title: sheetTitle }
          }
        }
      ]
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Google Sheets batchUpdate error: ${errorText}`);
  }

  const createData = await createResponse.json();
  const newSheetId = createData.replies?.[0]?.addSheet?.properties?.sheetId;

  if (newSheetId == null) {
    throw new Error(`Failed to create sheet "${sheetTitle}".`);
  }

  if (runId) {
    sendLog(runId, "success", `Created sheet tab "${sheetTitle}".`);
  }

  return newSheetId;
}

async function readSheetValuesAD(token, runId, sheetConfig) {
  const { spreadsheetId, sheetName } = sheetConfig;
  const range = encodeURIComponent(`${sheetName}!A:F`);
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

async function removeDuplicateUrlsFromSheet(runId) {
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
      resumeUrl: row[3] || "",
      chatGptUrl: row[4] || "",
      note: row[5] || ""
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

async function createGoogleDoc(runId) {
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