// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const DEFAULT_SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
const DEFAULT_SHEET_NAME = "Sheet1";
const DEFAULT_RESUME_TEMPLATE_ID = "1oF1GQJ6bTEli1548HVyI91O803oQaeP8ec8Y81bj5zM";
const CHATGPT_URL = "https://chatgpt.com";
const SHEET_CONFIG_STORAGE_KEY = "sheetConfig";
const PROMPT_RESUME_SELECTION_STORAGE_KEY = "promptResumeSelection";
const LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY = "resumeSelection";
const PROFILE_SELECTION_STORAGE_KEY = "profileSelection";
const DEFAULT_PROFILE_NAME = "Default";
const PROMPT_SELECTION_STORAGE_KEY = "promptSelection";
const HUMANIZE_PROMPT_SELECTION_STORAGE_KEY = "humanizePromptSelection";
const JOB_DESCRIPTION_SELECTION_STORAGE_KEY = "jobDescriptionSelection";
const DEFAULT_HUMANIZE_PROMPT =
  "humanize your answer shortening it as one sentence story telling and using gen y us native style. don't be so streamlined usually can't be expected from human's impromptu";
const SAVE_CHECK_REMINDER_ALARM_NAME = "save-current-tab-check-reminder";
const SAVE_CHECK_REMINDER_STORAGE_KEY = "saveCheckReminder";
const SAVE_CHECK_REMINDER_DELAY_MINUTES = 2;
const SAVE_CHECK_REMINDER_NOTIFICATION_ID = "application-helper-check-reminder";
const JOB_GPT_TAB_GROUP_ALARM_NAME = "group-job-gpt-tabs-after-save";
const JOB_GPT_TAB_GROUP_STORAGE_KEY = "pendingJobGptTabGroup";
const JOB_GPT_TAB_GROUP_DELAY_MINUTES = 1.9;
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

function createProfileId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function normalizePromptResumeSelection(selection) {
  const promptResumes = (
    Array.isArray(selection?.promptResumes) ? selection.promptResumes : []
  )
    .map(normalizePromptResume)
    .filter(Boolean);

  const selectedPromptResumeId =
    selection?.selectedPromptResumeId === ""
      ? ""
      : promptResumes.some(
            (entry) => entry.id === selection?.selectedPromptResumeId
          )
        ? selection.selectedPromptResumeId
        : promptResumes[0]?.id || "";

  return { promptResumes, selectedPromptResumeId };
}

function createDefaultProfile(
  promptResumeSelection = null,
  resumeTemplateId = ""
) {
  const resumes = normalizePromptResumeSelection(promptResumeSelection);

  return {
    id: createProfileId(),
    name: DEFAULT_PROFILE_NAME,
    resumeTemplateId: parseGoogleDocId(resumeTemplateId) || DEFAULT_RESUME_TEMPLATE_ID,
    promptResumes: resumes.promptResumes,
    selectedPromptResumeId: resumes.selectedPromptResumeId
  };
}

function normalizeProfile(entry) {
  const name = String(entry?.name ?? "").trim();
  if (!name) {
    return null;
  }

  const resumes = normalizePromptResumeSelection(entry);

  return {
    id: String(entry?.id || createProfileId()),
    name,
    resumeTemplateId: parseGoogleDocId(entry?.resumeTemplateId) || "",
    promptResumes: resumes.promptResumes,
    selectedPromptResumeId: resumes.selectedPromptResumeId
  };
}

function normalizeProfileSelectionState(selection) {
  const profiles = (Array.isArray(selection?.profiles) ? selection.profiles : [])
    .map(normalizeProfile)
    .filter(Boolean);

  if (profiles.length === 0) {
    const defaultProfile = createDefaultProfile();
    return {
      profiles: [defaultProfile],
      selectedProfileId: defaultProfile.id
    };
  }

  const selectedProfileId =
    selection?.selectedProfileId === ""
      ? ""
      : profiles.some((entry) => entry.id === selection?.selectedProfileId)
        ? selection.selectedProfileId
        : profiles[0].id;

  return { profiles, selectedProfileId };
}

async function loadLegacyPromptResumeSelectionRecord() {
  const stored = await chrome.storage.local.get([
    PROMPT_RESUME_SELECTION_STORAGE_KEY,
    LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY
  ]);

  if (stored[PROMPT_RESUME_SELECTION_STORAGE_KEY]) {
    return stored[PROMPT_RESUME_SELECTION_STORAGE_KEY];
  }

  if (stored[LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY]) {
    const legacy = stored[LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY];
    return {
      promptResumes: legacy.promptResumes ?? legacy.templates ?? [],
      selectedPromptResumeId:
        legacy.selectedPromptResumeId ?? legacy.selectedId ?? ""
    };
  }

  return null;
}

async function getLegacyResumeTemplateId() {
  const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
  const config = stored[SHEET_CONFIG_STORAGE_KEY] || {};
  return parseGoogleDocId(config.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID);
}

async function getProfileSelectionState() {
  const stored = await chrome.storage.local.get([
    PROFILE_SELECTION_STORAGE_KEY,
    PROMPT_RESUME_SELECTION_STORAGE_KEY,
    LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY,
    SHEET_CONFIG_STORAGE_KEY
  ]);

  let state = normalizeProfileSelectionState(
    stored[PROFILE_SELECTION_STORAGE_KEY]
  );
  let didChange = !stored[PROFILE_SELECTION_STORAGE_KEY];

  const legacyResumes = await loadLegacyPromptResumeSelectionRecord();
  const normalizedLegacy = legacyResumes
    ? normalizePromptResumeSelection(legacyResumes)
    : null;
  const hasLegacyResumes = Boolean(normalizedLegacy?.promptResumes?.length);
  const legacyResumeTemplateId = await getLegacyResumeTemplateId();

  const defaultProfile =
    state.profiles.find((entry) => entry.name === DEFAULT_PROFILE_NAME) ||
    state.profiles[0];

  if (defaultProfile) {
    let nextDefault = defaultProfile;

    if (hasLegacyResumes && defaultProfile.promptResumes.length === 0) {
      nextDefault = {
        ...nextDefault,
        promptResumes: normalizedLegacy.promptResumes,
        selectedPromptResumeId: normalizedLegacy.selectedPromptResumeId
      };
      didChange = true;
    }

    if (!nextDefault.resumeTemplateId && legacyResumeTemplateId) {
      nextDefault = {
        ...nextDefault,
        resumeTemplateId: legacyResumeTemplateId
      };
      didChange = true;
    }

    if (nextDefault !== defaultProfile) {
      state = {
        ...state,
        profiles: state.profiles.map((entry) =>
          entry.id === defaultProfile.id ? nextDefault : entry
        )
      };
    }
  }

  if (didChange) {
    await chrome.storage.local.set({
      [PROFILE_SELECTION_STORAGE_KEY]: state
    });
  }

  if (hasLegacyResumes) {
    await chrome.storage.local.remove([
      PROMPT_RESUME_SELECTION_STORAGE_KEY,
      LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY
    ]);
  }

  return state;
}

async function saveProfileSelectionState(selection) {
  const state = normalizeProfileSelectionState(selection);

  await chrome.storage.local.set({
    [PROFILE_SELECTION_STORAGE_KEY]: state
  });

  return state;
}

function getSelectedProfileFromState(state) {
  return (
    state.profiles.find((entry) => entry.id === state.selectedProfileId) ||
    state.profiles[0] ||
    null
  );
}

async function getPromptResumeSelectionState() {
  const profileState = await getProfileSelectionState();
  const selectedProfile = getSelectedProfileFromState(profileState);

  if (!selectedProfile) {
    return { promptResumes: [], selectedPromptResumeId: "" };
  }

  return {
    promptResumes: selectedProfile.promptResumes,
    selectedPromptResumeId: selectedProfile.selectedPromptResumeId
  };
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

  const profileState = await getProfileSelectionState();
  const selectedProfile = getSelectedProfileFromState(profileState);

  if (!selectedProfile) {
    throw new Error("No profile is selected.");
  }

  const state = await saveProfileSelectionState({
    ...profileState,
    profiles: profileState.profiles.map((entry) =>
      entry.id === selectedProfile.id
        ? {
            ...entry,
            promptResumes,
            selectedPromptResumeId
          }
        : entry
    )
  });

  const updatedProfile = getSelectedProfileFromState(state);

  return {
    promptResumes: updatedProfile?.promptResumes || [],
    selectedPromptResumeId: updatedProfile?.selectedPromptResumeId || ""
  };
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

async function loadHumanizePromptSelectionRecord() {
  const stored = await chrome.storage.local.get(HUMANIZE_PROMPT_SELECTION_STORAGE_KEY);
  const selection = stored[HUMANIZE_PROMPT_SELECTION_STORAGE_KEY];

  if (!selection || typeof selection.content !== "string") {
    return null;
  }

  return {
    content: normalizePromptContent(selection.content),
    updatedAt: normalizeUpdatedAt(selection.updatedAt)
  };
}

async function getHumanizePromptSelectionState() {
  const selection = await loadHumanizePromptSelectionRecord();

  if (selection?.content?.trim()) {
    return selection;
  }

  if (selection) {
    return selection;
  }

  return saveHumanizePromptSelectionState(DEFAULT_HUMANIZE_PROMPT);
}

async function saveHumanizePromptSelectionState(contentInput) {
  const content = normalizePromptContent(contentInput);
  const state = {
    content,
    updatedAt: content ? new Date().toISOString() : ""
  };

  await chrome.storage.local.set({
    [HUMANIZE_PROMPT_SELECTION_STORAGE_KEY]: state
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

async function getSelectedProfileResumeTemplateId() {
  const profileState = await getProfileSelectionState();
  const selectedProfile = getSelectedProfileFromState(profileState);
  const resumeTemplateId = parseGoogleDocId(selectedProfile?.resumeTemplateId);

  if (!resumeTemplateId) {
    throw new Error(
      "Resume Google Doc template is not configured for the selected profile."
    );
  }

  return resumeTemplateId;
}

async function getSheetConfig() {
  const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
  const config = stored[SHEET_CONFIG_STORAGE_KEY] || {};

  const spreadsheetId = parseSpreadsheetId(
    config.spreadsheetId || DEFAULT_SPREADSHEET_ID
  );
  const sheetName = String(config.sheetName || DEFAULT_SHEET_NAME).trim();

  if (!spreadsheetId) {
    throw new Error("Google Sheet ID is not configured.");
  }

  if (!sheetName) {
    throw new Error("Sheet tab name is not configured.");
  }

  return { spreadsheetId, sheetName };
}

async function saveSheetConfig(spreadsheetIdInput, sheetNameInput) {
  const spreadsheetId = parseSpreadsheetId(spreadsheetIdInput);
  const sheetName = String(sheetNameInput ?? "").trim();

  if (!spreadsheetId) {
    throw new Error("Enter a valid Google Sheet URL or spreadsheet ID.");
  }

  if (!sheetName) {
    throw new Error("Enter a sheet tab name.");
  }

  const token = await getGoogleAccessToken();
  await ensureSheetExists(token, spreadsheetId, sheetName);

  const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
  const existing = stored[SHEET_CONFIG_STORAGE_KEY] || {};

  await chrome.storage.local.set({
    [SHEET_CONFIG_STORAGE_KEY]: {
      spreadsheetId,
      sheetName,
      resumeTemplateId: existing.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID
    }
  });

  return { spreadsheetId, sheetName };
}

async function saveSelectedProfileResumeTemplate(resumeTemplateInput) {
  const resumeTemplateId = parseGoogleDocId(resumeTemplateInput);

  if (!resumeTemplateId) {
    throw new Error("Enter a valid Resume Google Doc URL or document ID.");
  }

  const profileState = await getProfileSelectionState();
  const selectedProfile = getSelectedProfileFromState(profileState);

  if (!selectedProfile) {
    throw new Error("No profile is selected.");
  }

  const state = await saveProfileSelectionState({
    ...profileState,
    profiles: profileState.profiles.map((entry) =>
      entry.id === selectedProfile.id
        ? {
            ...entry,
            resumeTemplateId
          }
        : entry
    )
  });

  const updatedProfile = getSelectedProfileFromState(state);

  return {
    resumeTemplateId: updatedProfile?.resumeTemplateId || resumeTemplateId
  };
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
const CHATGPT_EXISTING_TAB_SETTLE_MS = { min: 2000, max: 4000 };
const CHATGPT_TAB_URL_PATTERNS = [
  "https://chatgpt.com/*",
  "https://chat.openai.com/*"
];

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

function isReceivingEndMissingError(error) {
  const message = String(error?.message ?? error ?? "");
  return (
    message.includes("Receiving end does not exist") ||
    message.includes("Could not establish connection")
  );
}

async function ensureChatGptContentScript(tabId, runId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/chatgpt.js"]
    });
    sendLog(runId, "info", "Injected ChatGPT content script.");
    return true;
  } catch (error) {
    sendLog(
      runId,
      "error",
      `Could not inject ChatGPT content script: ${error.message || error}`
    );
    return false;
  }
}

async function sendFillAndSendToTab(tabId, text, runId, maxAttempts = 24) {
  let lastError = new Error("Could not reach ChatGPT page.");
  let didInject = false;

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

      if (!didInject && isReceivingEndMissingError(error)) {
        didInject = true;
        sendLog(
          runId,
          "info",
          "ChatGPT page not connected. Injecting content script..."
        );
        await ensureChatGptContentScript(tabId, runId);
        continue;
      }
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

async function resolveChatGptTabForHumanize(runId) {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (activeTab?.id && isChatGptUrl(activeTab.url || "")) {
    sendLog(runId, "info", "Using active ChatGPT tab.");
    return activeTab;
  }

  const tabs = await chrome.tabs.query({ url: CHATGPT_TAB_URL_PATTERNS });
  const sortedTabs = tabs
    .filter((tab) => typeof tab.id === "number")
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  if (sortedTabs[0]) {
    sendLog(runId, "info", "Using most recent ChatGPT tab.");
    return sortedTabs[0];
  }

  throw new Error("No open ChatGPT tab found. Open a ChatGPT conversation first.");
}

async function sendHumanizePromptToChatGpt(runId) {
  const { content } = await getHumanizePromptSelectionState();
  const promptText = String(content ?? "").trim();

  if (!promptText) {
    throw new Error("Humanize prompt is not configured.");
  }

  sendLog(runId, "info", "Looking for an open ChatGPT tab...");
  const tab = await resolveChatGptTabForHumanize(runId);

  await chrome.tabs.update(tab.id, { active: true });

  if (tab.status !== "complete") {
    await waitForTabComplete(tab.id);
  }

  const settleMs = randomDelayMs(
    CHATGPT_EXISTING_TAB_SETTLE_MS.min,
    CHATGPT_EXISTING_TAB_SETTLE_MS.max
  );

  sendLog(
    runId,
    "info",
    `Waiting ${(settleMs / 1000).toFixed(1)}s before filling humanize prompt...`
  );
  await sleep(settleMs);

  sendLog(runId, "info", "Sending humanize prompt to ChatGPT...");
  await sendFillAndSendToTab(tab.id, promptText, runId);

  const chatGptUrl = await resolveChatGptUrlAfterSend(tab.id, runId);
  sendLog(runId, "success", `Humanize prompt sent to ChatGPT: ${chatGptUrl}`);

  return {
    url: chatGptUrl,
    tabId: tab.id
  };
}

async function humanizeChatGptConversation(runId) {
  sendLog(runId, "info", "Starting Humanize...");
  return sendHumanizePromptToChatGpt(runId);
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

async function groupJobAndGptTabs({
  jobTabId,
  chatGptTabId,
  groupTitle = "Application",
  runId = null
}) {
  if (typeof jobTabId !== "number" || typeof chatGptTabId !== "number") {
    throw new Error("Job and ChatGPT tabs must have valid tab IDs.");
  }

  let jobTab;
  let gptTab;

  try {
    jobTab = await chrome.tabs.get(jobTabId);
    gptTab = await chrome.tabs.get(chatGptTabId);
  } catch (_error) {
    sendLog(
      runId,
      "info",
      "One or both tabs were closed before grouping could run."
    );
    return null;
  }

  if (gptTab.windowId !== jobTab.windowId) {
    try {
      await chrome.tabs.move(chatGptTabId, { windowId: jobTab.windowId, index: -1 });
    } catch (error) {
      sendLog(
        runId,
        "error",
        `Could not move ChatGPT tab for grouping: ${error.message || error}`
      );
      return null;
    }
  }

  sendLog(runId, "info", "Grouping job and ChatGPT tabs...");
  const groupId = await chrome.tabs.group({ tabIds: [jobTabId, chatGptTabId] });

  await chrome.tabGroups.update(groupId, {
    title: String(groupTitle || "Application").trim().slice(0, 100) || "Application",
    color: "green"
  });

  sendLog(runId, "success", "Job and ChatGPT tabs grouped.");
  return groupId;
}

async function scheduleJobAndGptTabGroup(
  chatGptTabId,
  runId,
  { jobTabId = null, groupTitle = "Application" } = {}
) {
  if (typeof jobTabId !== "number" || typeof chatGptTabId !== "number") {
    sendLog(runId, "info", "Skipping tab grouping because a tab ID is missing.");
    return;
  }

  await chrome.storage.local.set({
    [JOB_GPT_TAB_GROUP_STORAGE_KEY]: {
      jobTabId,
      chatGptTabId,
      groupTitle: String(groupTitle || "Application").trim() || "Application",
      scheduledAt: Date.now()
    }
  });

  await chrome.alarms.clear(JOB_GPT_TAB_GROUP_ALARM_NAME);
  await chrome.alarms.create(JOB_GPT_TAB_GROUP_ALARM_NAME, {
    delayInMinutes: JOB_GPT_TAB_GROUP_DELAY_MINUTES
  });

  sendLog(
    runId,
    "info",
    `Job and ChatGPT tabs will be grouped in ${JOB_GPT_TAB_GROUP_DELAY_MINUTES} minutes.`
  );
}

async function groupScheduledJobAndGptTabs() {
  const stored = await chrome.storage.local.get([
    JOB_GPT_TAB_GROUP_STORAGE_KEY,
    SAVE_CHECK_REMINDER_STORAGE_KEY
  ]);
  const pending = stored[JOB_GPT_TAB_GROUP_STORAGE_KEY];

  if (!pending) {
    await chrome.storage.local.remove(JOB_GPT_TAB_GROUP_STORAGE_KEY);
    return;
  }

  const groupId = await groupJobAndGptTabs({
    jobTabId: pending.jobTabId,
    chatGptTabId: pending.chatGptTabId,
    groupTitle: pending.groupTitle
  });

  if (groupId != null && stored[SAVE_CHECK_REMINDER_STORAGE_KEY]) {
    await chrome.storage.local.set({
      [SAVE_CHECK_REMINDER_STORAGE_KEY]: {
        ...stored[SAVE_CHECK_REMINDER_STORAGE_KEY],
        groupId
      }
    });
  }

  await chrome.storage.local.remove(JOB_GPT_TAB_GROUP_STORAGE_KEY);
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
    requireInteraction: false,
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

  if (alarm.name === JOB_GPT_TAB_GROUP_ALARM_NAME) {
    try {
      await groupScheduledJobAndGptTabs();
    } catch (error) {
      console.error("Could not group scheduled job and ChatGPT tabs:", error);
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
    const action =
      reminder.mode === "apply" || typeof reminder.groupId === "number"
        ? "dismiss"
        : "openUrls";
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
    const action =
      reminder.mode === "apply" || typeof reminder.groupId === "number"
        ? "openGroup"
        : "focusWindow";
    await dismissSaveCheckReminderNotification(notificationId, { action });
  } catch (error) {
    console.error("Could not handle save check reminder notification click:", error);
  }
});

chrome.notifications.onClosed.addListener(async (notificationId) => {
  if (notificationId !== SAVE_CHECK_REMINDER_NOTIFICATION_ID) {
    return;
  }

  await chrome.storage.local.remove(SAVE_CHECK_REMINDER_STORAGE_KEY);
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

const APP_ACTION_COMMANDS = {
  "apply-now": { groupTabs: true },
  "save-app": { groupTabs: false }
};

chrome.commands.onCommand.addListener((command) => {
  const action = APP_ACTION_COMMANDS[command];
  if (!action) {
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

    const result = await saveCurrentTabUrlToSheet(runId, {
      groupTabs: action.groupTabs
    });

    await chrome.runtime.sendMessage({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ok: true,
      url: result?.url || ""
    });
  })().catch((error) => {
    console.error("Hotkey app action failed:", error);
    sendLog(runId, "error", error.message || "Hotkey app action failed.");

    chrome.runtime.sendMessage({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ok: false,
      error: error.message || "Hotkey app action failed."
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
    saveSheetConfig(message.spreadsheetId, message.sheetName)
      .then((config) => sendResponse({ ok: true, ...config }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save sheet configuration."
        });
      });
    return true;
  }

  if (message.type === "SAVE_PROFILE_RESUME_TEMPLATE") {
    saveSelectedProfileResumeTemplate(message.resumeTemplateId)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save resume template."
        });
      });
    return true;
  }

  if (message.type === "GET_PROFILE_SELECTION") {
    getProfileSelectionState()
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not load profile selection."
        });
      });
    return true;
  }

  if (message.type === "SAVE_PROFILE_SELECTION") {
    saveProfileSelectionState({
      profiles: message.profiles,
      selectedProfileId: message.selectedProfileId
    })
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save profile selection."
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

  if (message.type === "GET_HUMANIZE_PROMPT_SELECTION") {
    getHumanizePromptSelectionState()
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not load humanize prompt."
        });
      });
    return true;
  }

  if (message.type === "SAVE_HUMANIZE_PROMPT_SELECTION") {
    saveHumanizePromptSelectionState(message.content)
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save humanize prompt."
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
    REMOVE_DUPLICATE_URLS_FROM_SHEET: removeDuplicateUrlsFromSheet,
    HUMANIZE_CHATGPT: humanizeChatGptConversation,
    CREATE_GOOGLE_DOC: createGoogleDoc
  };

  const run = handlers[message.type];
  if (!run) {
    return;
  }

  const runPromise =
    message.type === "SAVE_CURRENT_TAB_URL_TO_SHEET"
      ? run(message.runId, {
          groupTabs: message.mode === "apply"
        })
      : message.type === "CREATE_GOOGLE_DOC"
        ? run(message.runId, {
            resumeText: message.resumeText
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

async function saveCurrentTabUrlToSheet(runId, options = {}) {
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

    const profileState = await getProfileSelectionState();
    const selectedProfile = getSelectedProfileFromState(profileState);
    const profileName = String(selectedProfile?.name || "").trim() || DEFAULT_PROFILE_NAME;
    const resumeTemplateId = await getSelectedProfileResumeTemplateId();
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
      profileName,
      resumeUrl,
      chatGptUrl,
      groupTabsInsteadOfClosing ? "Yes" : ""
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
      if (typeof chatGptTabId === "number") {
        await scheduleJobAndGptTabGroup(chatGptTabId, runId, {
          jobTabId: tab.id,
          groupTitle: tab.title || "Application"
        });
      } else {
        sendLog(runId, "info", "ChatGPT tab unavailable. Leaving job tab open.");
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
        : `Finished. Job and ChatGPT tabs will be grouped in ${JOB_GPT_TAB_GROUP_DELAY_MINUTES} minutes.`
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
  const range = encodeURIComponent(`${sheetName}!A:G`);
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
    const profileKey = String(row[3] ?? "").trim().toLowerCase();
    const dedupeKey = `${urlKey}||${profileKey}`;
    if (seen.has(dedupeKey)) {
      duplicateRowIndices.push(i);
    } else {
      seen.add(dedupeKey);
    }
  }

  const deletedRows = duplicateRowIndices.map((rowIndex) => {
    const row = values[rowIndex] || [];
    return {
      rowNumber: rowIndex + 1,
      timestamp: row[0] || "",
      title: row[1] || "",
      url: row[2] || "",
      profileName: row[3] || "",
      resumeUrl: row[4] || "",
      chatGptUrl: row[5] || "",
      note: row[6] || ""
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

async function batchUpdateGoogleDoc(token, documentId, requests) {
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requests })
    }
  );

  return response;
}

async function getGoogleDocBodyEndIndex(token, documentId) {
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}?fields=body(content(endIndex))`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      formatGoogleApiError(errorText, "Could not read the copied Google Doc.")
    );
  }

  const document = await response.json();
  const content = document.body?.content || [];
  const endIndex = content[content.length - 1]?.endIndex;

  if (typeof endIndex !== "number" || endIndex <= 1) {
    return 1;
  }

  return endIndex;
}

async function batchUpdateGoogleDocWithAuthRetry(token, documentId, requests, runId, errorMessage) {
  let activeToken = token;
  let response = await batchUpdateGoogleDoc(activeToken, documentId, requests);

  if (response.status === 401 || response.status === 403) {
    sendLog(runId, "info", "Google Doc update auth error. Refreshing token and retrying...");
    await clearCachedGoogleAccessToken(activeToken);
    activeToken = await getGoogleAccessToken({ interactive: true });
    response = await batchUpdateGoogleDoc(activeToken, documentId, requests);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(formatGoogleApiError(errorText, errorMessage));
  }

  return {
    activeToken,
    data: await response.json()
  };
}

async function replaceGoogleDocBodyWithText(token, documentId, resumeText, runId) {
  const trimmedText = String(resumeText ?? "").trim();
  const bodyEndIndex = await getGoogleDocBodyEndIndex(token, documentId);
  const requests = [];

  if (bodyEndIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: bodyEndIndex - 1
        }
      }
    });
  }

  requests.push({
    insertText: {
      location: { index: 1 },
      text: trimmedText
    }
  });

  const { activeToken } = await batchUpdateGoogleDocWithAuthRetry(
    token,
    documentId,
    requests,
    runId,
    "Could not write resume text into Google Doc."
  );

  sendLog(runId, "success", "Resume text written into Google Doc.");
  return activeToken;
}

async function insertResumeTextIntoGoogleDoc(token, documentId, resumeText, runId) {
  const trimmedText = String(resumeText ?? "").trim();
  if (!trimmedText) {
    return token;
  }

  sendLog(runId, "info", "Writing resume text into Google Doc...");

  const { activeToken, data } = await batchUpdateGoogleDocWithAuthRetry(
    token,
    documentId,
    [
      {
        replaceAllText: {
          containsText: {
            text: "{{RESUME}}",
            matchCase: true
          },
          replaceText: trimmedText
        }
      }
    ],
    runId,
    "Could not insert resume text into Google Doc."
  );

  const occurrencesChanged =
    data.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;

  if (occurrencesChanged > 0) {
    sendLog(runId, "success", "Resume text inserted using {{RESUME}} placeholder.");
    return activeToken;
  }

  return replaceGoogleDocBodyWithText(activeToken, documentId, trimmedText, runId);
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

async function createGoogleDoc(runId, options = {}) {
  const resumeText = String(options.resumeText ?? "").trim();
  if (!resumeText) {
    throw new Error("Resume text is required before creating a Google Doc.");
  }

  sendLog(runId, "info", "Starting Google Doc creation...");

  const resumeTemplateId = await getSelectedProfileResumeTemplateId();
  sendLog(runId, "info", `Using resume template: ${resumeTemplateId}`);

  let token = await getGoogleAccessToken();
  sendLog(runId, "success", "Google authorization token received.");

  const title = "Robert_Coan_Resume";

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

  token = await insertResumeTextIntoGoogleDoc(token, documentId, resumeText, runId);

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