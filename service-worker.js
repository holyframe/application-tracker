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
const SAVE_POST_PROCESS_ALARM_NAME = "save-current-tab-post-process";
const SAVE_POST_PROCESS_STORAGE_KEY = "savePostProcess";
const SAVE_POST_PROCESS_DURATION_MINUTES = 2;
let savePostProcessCleanupPromise = null;
const activeSaveProcessControllers = new Map();
const SAVE_PROCESS_CANCELLED_CODE = "SAVE_PROCESS_CANCELLED";
const PROFILE_SELECTION_VERSION = 3;
const GOOGLE_DOC_WRITABLE_TEXT_STYLE_FIELDS = Object.freeze([
  "backgroundColor",
  "baselineOffset",
  "bold",
  "fontSize",
  "foregroundColor",
  "italic",
  "link",
  "smallCaps",
  "strikethrough",
  "underline",
  "weightedFontFamily"
]);
const APPLICATION_SHEET_HEADERS = Object.freeze([
  "ISO timestamp",
  "Job-page title",
  "Profile name",
  "ChatGPT conversation URL",
  "Normalized job URL",
  "Copied resume Google Doc URL",
  "Apply Now"
]);
const LEGACY_APPLICATION_SHEET_HEADERS = Object.freeze([
  "ISO timestamp",
  "Job-page title",
  "ChatGPT conversation URL",
  "Job URL",
  "Copied resume-document URL",
  "Apply Now"
]);
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

function formatSheetRange(sheetName, cellRange) {
  const normalizedSheetName = String(sheetName ?? "").trim();
  const normalizedCellRange = String(cellRange ?? "").trim();

  if (!normalizedSheetName) {
    throw new Error("Sheet tab name is required.");
  }

  if (!normalizedCellRange) {
    throw new Error("Sheet cell range is required.");
  }

  const escapedSheetName = normalizedSheetName.replace(/'/g, "''");
  return `'${escapedSheetName}'!${normalizedCellRange}`;
}

function buildApplicationSheetRow({
  timestamp,
  jobTitle,
  profileName,
  jobUrl,
  chatGptUrl,
  resumeUrl,
  applyNow = false
}) {
  return [
    String(timestamp || ""),
    String(jobTitle || ""),
    String(profileName || ""),
    String(chatGptUrl || ""),
    String(jobUrl || ""),
    String(resumeUrl || ""),
    applyNow ? "Yes" : ""
  ];
}

function hasSheetHeaders(row, headers) {
  return (
    Array.isArray(row) &&
    headers.every(
      (header, index) => String(row[index] ?? "").trim() === header
    )
  );
}

function hasApplicationSheetHeaders(row) {
  return hasSheetHeaders(row, APPLICATION_SHEET_HEADERS);
}

function hasLegacyApplicationSheetHeaders(row) {
  return hasSheetHeaders(row, LEGACY_APPLICATION_SHEET_HEADERS);
}

function createUniqueSheetId(sheets = []) {
  const usedSheetIds = new Set(
    sheets
      .map((sheet) => sheet?.properties?.sheetId)
      .filter((sheetId) => Number.isInteger(sheetId))
  );

  let sheetId;
  do {
    sheetId = Math.floor(Math.random() * 2147483647);
  } while (usedSheetIds.has(sheetId));

  return sheetId;
}

function buildApplicationSheetInitializationRequests(sheetId) {
  const columnCount = APPLICATION_SHEET_HEADERS.length;

  return [
    {
      updateCells: {
        start: {
          sheetId,
          rowIndex: 0,
          columnIndex: 0
        },
        rows: [
          {
            values: APPLICATION_SHEET_HEADERS.map((header) => ({
              userEnteredValue: {
                stringValue: header
              }
            }))
          }
        ],
        fields: "userEnteredValue"
      }
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startColumnIndex: 0,
          endColumnIndex: columnCount
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: "CLIP"
          }
        },
        fields: "userEnteredFormat.wrapStrategy"
      }
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: columnCount
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            }
          }
        },
        fields: "userEnteredFormat.textFormat.bold"
      }
    }
  ];
}

function parseGoogleDocId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  const urlMatch = raw.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return raw;
}

function isGoogleDocsDocumentUrl(url = "") {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.hostname !== "docs.google.com") {
      return false;
    }

    return /\/document\/(?:u\/\d+\/)?d\/[a-zA-Z0-9-_]+/.test(parsed.pathname);
  } catch (_error) {
    return false;
  }
}

function isGoogleSheetsDocumentUrl(url = "") {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.hostname !== "docs.google.com") {
      return false;
    }

    return /\/spreadsheets\/(?:u\/\d+\/)?d\/[a-zA-Z0-9-_]+/.test(
      parsed.pathname
    );
  } catch (_error) {
    return false;
  }
}

async function checkOpenGoogleSheet() {
  const [sheetTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });
  const isCurrentTabGoogleSheet =
    Number.isInteger(sheetTab?.id) &&
    isGoogleSheetsDocumentUrl(sheetTab.url || "");

  return {
    open: isCurrentTabGoogleSheet,
    tabId: isCurrentTabGoogleSheet ? sheetTab.id : null,
    url: isCurrentTabGoogleSheet ? sheetTab.url || "" : ""
  };
}

function sanitizeDownloadFilename(name) {
  const cleaned = String(name || "")
    .replace(/\s*-\s*Google Docs\s*$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "document";
}

function normalizeHttpUrl(value, label = "Web") {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error(`${label} URL is required.`);
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (hasScheme && !/^https?:\/\//i.test(raw)) {
    throw new Error(`${label} URL must use http:// or https://.`);
  }

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch (_error) {
    throw new Error(`${label} URL is not valid.`);
  }

  if (!parsed.hostname || !["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${label} URL must be a valid web address.`);
  }

  return parsed.href;
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
    promptResumes.some(
      (entry) => entry.id === selection?.selectedPromptResumeId
    )
      ? selection.selectedPromptResumeId
      : "";

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
    notes: "",
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
    notes: String(entry?.notes ?? "").trim(),
    promptResumes: resumes.promptResumes,
    selectedPromptResumeId: resumes.selectedPromptResumeId
  };
}

function normalizeProfileSelectionState(selection) {
  const hasCurrentSelectionVersion =
    selection?.selectionVersion === PROFILE_SELECTION_VERSION;
  const profiles = (Array.isArray(selection?.profiles) ? selection.profiles : [])
    .map(normalizeProfile)
    .filter(Boolean)
    .map((profile) =>
      hasCurrentSelectionVersion
        ? profile
        : { ...profile, selectedPromptResumeId: "" }
    );

  if (profiles.length === 0) {
    const defaultProfile = createDefaultProfile();
    return {
      profiles: [defaultProfile],
      selectedProfileId: defaultProfile.id,
      selectedProfileIds: [],
      selectionVersion: PROFILE_SELECTION_VERSION
    };
  }

  const selectedProfileId =
    profiles.some((entry) => entry.id === selection?.selectedProfileId)
      ? selection.selectedProfileId
      : profiles[0].id;

  const selectedProfileIds = profiles
    .filter((profile) => Boolean(profile.selectedPromptResumeId))
    .map((profile) => profile.id);

  return {
    profiles,
    selectedProfileId,
    selectedProfileIds,
    selectionVersion: PROFILE_SELECTION_VERSION
  };
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
  let didChange =
    !stored[PROFILE_SELECTION_STORAGE_KEY] ||
    stored[PROFILE_SELECTION_STORAGE_KEY]?.selectionVersion !==
      PROFILE_SELECTION_VERSION ||
    !Array.isArray(
      stored[PROFILE_SELECTION_STORAGE_KEY]?.selectedProfileIds
    );

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
        selectedPromptResumeId: ""
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

function getSelectedProfilesFromState(state) {
  const selectedIds = new Set(state.selectedProfileIds);
  return state.profiles.filter((entry) => selectedIds.has(entry.id));
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
    promptResumes.some((entry) => entry.id === selectedPromptResumeIdInput)
      ? selectedPromptResumeIdInput
      : "";

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
  const profileState = await getProfileSelectionState();
  await saveProfileSelectionState({
    ...profileState,
    selectedProfileIds: [],
    profiles: profileState.profiles.map((profile) => ({
      ...profile,
      selectedPromptResumeId: ""
    }))
  });
  await saveJobDescriptionSelectionState("");

  const message =
    "Cleared saved profile selections, prompt resume selections, and job description.";

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

function getProfileResumeTemplateId(profile) {
  const resumeTemplateId = parseGoogleDocId(profile?.resumeTemplateId);

  if (!resumeTemplateId) {
    throw new Error(
      `Resume Google Doc template is not configured for "${
        String(profile?.name || DEFAULT_PROFILE_NAME).trim() || DEFAULT_PROFILE_NAME
      }".`
    );
  }

  return resumeTemplateId;
}

async function getSelectedProfileResumeTemplateId() {
  const profileState = await getProfileSelectionState();
  return getProfileResumeTemplateId(getSelectedProfileFromState(profileState));
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
        continue;
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

function createSaveProcessCancelledError(
  message = "Save process cancelled."
) {
  const error = new Error(message);
  error.name = "AbortError";
  error.code = SAVE_PROCESS_CANCELLED_CODE;
  return error;
}

function isSaveProcessCancelledError(error) {
  return (
    error?.code === SAVE_PROCESS_CANCELLED_CODE ||
    error?.name === "AbortError"
  );
}

function throwIfSaveProcessCancelled(signal) {
  if (signal?.aborted) {
    throw createSaveProcessCancelledError();
  }
}

function waitForSaveProcessOperation(operation, signal) {
  throwIfSaveProcessCancelled(signal);

  const operationPromise = Promise.resolve().then(operation);
  if (!signal) {
    return operationPromise;
  }

  return new Promise((resolve, reject) => {
    let isSettled = false;
    const finish = (callback, value) => {
      if (isSettled) {
        return;
      }
      isSettled = true;
      signal.removeEventListener("abort", handleAbort);
      callback(value);
    };
    const handleAbort = () => {
      finish(reject, createSaveProcessCancelledError());
    };

    signal.addEventListener("abort", handleAbort, { once: true });
    operationPromise.then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error)
    );
  });
}

function sleep(ms, signal) {
  throwIfSaveProcessCancelled(signal);

  return new Promise((resolve, reject) => {
    let timeoutId = null;
    const handleAbort = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      reject(createSaveProcessCancelledError());
    };

    timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function waitForTabComplete(tabId, timeoutMs = 30000, signal) {
  throwIfSaveProcessCancelled(signal);

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let timeoutId = null;
    let isSettled = false;

    const finish = (callback, value) => {
      if (isSettled) {
        return;
      }
      isSettled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      signal?.removeEventListener("abort", handleAbort);
      callback(value);
    };

    const handleAbort = () => {
      finish(reject, createSaveProcessCancelledError());
    };

    const checkStatus = async () => {
      if (isSettled) {
        return;
      }

      try {
        throwIfSaveProcessCancelled(signal);
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === "complete") {
          finish(resolve, tab);
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          finish(reject, new Error("ChatGPT tab took too long to load."));
          return;
        }

        timeoutId = setTimeout(checkStatus, 250);
      } catch (error) {
        finish(reject, error);
      }
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
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

async function sendFillAndSendToTab(tabId, text, runId, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || 24);
  const { signal } = options;
  throwIfSaveProcessCancelled(signal);
  let lastError = new Error("Could not reach ChatGPT page.");
  let didInject = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    throwIfSaveProcessCancelled(signal);
    try {
      const response = await waitForSaveProcessOperation(
        () => chrome.tabs.sendMessage(tabId, {
          type: "FILL_AND_SEND",
          text
        }),
        signal
      );

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
        await waitForSaveProcessOperation(
          () => ensureChatGptContentScript(tabId, runId),
          signal
        );
        continue;
      }
    }

    if (attempt < maxAttempts) {
      sendLog(
        runId,
        "info",
        `Waiting for ChatGPT page (${attempt}/${maxAttempts})...`
      );
      await sleep(500, signal);
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

function assertActiveJobTabUsable(tab, { allowGrouped = false } = {}) {
  if (!tab) {
    throw new Error("No active tab found.");
  }

  if (!tab.url) {
    throw new Error("Current tab does not have a URL.");
  }

  if (tab.pinned) {
    throw new Error("Pinned tabs are not supported. Unpin the tab and try again.");
  }

  if (!allowGrouped && isTabInGroup(tab)) {
    throw new Error(
      "Grouped tabs are not supported. Ungroup the tab or open it outside a tab group and try again."
    );
  }
}

function isChatGptConversationUrl(url = "") {
  try {
    const parsed = new URL(url);
    return /^\/c\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/?$/i.test(
      parsed.pathname
    );
  } catch (_error) {
    return false;
  }
}

function formatSaveValidationError(missing) {
  if (missing.length === 1) {
    return `${missing[0]} is required before saving.`;
  }

  return `These are required before saving: ${missing.join(", ")}.`;
}

async function validateApplicationInputsForSave({ groupTabs = false } = {}) {
  const [promptState, jobDescriptionState, profileState] = await Promise.all([
    getPromptSelectionState(),
    getJobDescriptionSelectionState(),
    getProfileSelectionState()
  ]);

  const missing = [];
  const selectedProfiles = getSelectedProfilesFromState(profileState);

  if (!promptState.content?.trim()) {
    missing.push("GPT prompt");
  }

  if (!jobDescriptionState.content?.trim()) {
    missing.push("job description");
  }

  if (selectedProfiles.length === 0) {
    missing.push("profile selection");
  }

  const profilesMissingResume = selectedProfiles.filter(
    (profile) =>
      !profile.selectedPromptResumeId ||
      !profile.promptResumes.some(
        (entry) => entry.id === profile.selectedPromptResumeId
      )
  );

  if (profilesMissingResume.length > 0) {
    const profileNames = profilesMissingResume.map(
      (profile) => `"${profile.name}"`
    );
    missing.push(
      profileNames.length === 1
        ? `prompt resume for ${profileNames[0]}`
        : `one prompt resume for each of ${profileNames.join(", ")}`
    );
  }

  if (groupTabs && selectedProfiles.length > 1) {
    return {
      ok: false,
      error:
        "Apply Now currently supports one profile. Keep one profile checked or use Save App for the selected profiles."
    };
  }

  if (missing.length === 0) {
    return { ok: true, profileState, selectedProfiles };
  }

  return {
    ok: false,
    missing,
    error: formatSaveValidationError(missing)
  };
}

async function buildChatGptMessageFromStorage(profile = null) {
  const [promptState, jobDescriptionState] = await Promise.all([
    getPromptSelectionState(),
    getJobDescriptionSelectionState()
  ]);

  let targetProfile = profile;
  if (!targetProfile) {
    const profileState = await getProfileSelectionState();
    targetProfile = getSelectedProfileFromState(profileState);
  }

  const selectedResume = targetProfile?.promptResumes.find(
    (entry) => entry.id === targetProfile.selectedPromptResumeId
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

async function openNewChatGptTab(runId, { active = true, signal } = {}) {
  sendLog(runId, "info", "Opening ChatGPT in a new tab...");
  const tab = await waitForSaveProcessOperation(
    () => chrome.tabs.create({ url: CHATGPT_URL, active }),
    signal
  );
  await waitForTabComplete(tab.id, 30000, signal);

  return {
    url: CHATGPT_URL,
    tabId: typeof tab.id === "number" ? tab.id : null
  };
}

async function openChatGptInExistingTab(tabId, runId, options = {}) {
  if (typeof tabId !== "number") {
    throw new Error("Current job tab does not have a valid tab ID.");
  }

  sendLog(runId, "info", "Opening ChatGPT in the current job tab...");
  await waitForSaveProcessOperation(
    () => chrome.tabs.update(tabId, {
      url: CHATGPT_URL,
      active: true
    }),
    options.signal
  );
  await waitForTabComplete(tabId, 30000, options.signal);

  return {
    url: CHATGPT_URL,
    tabId
  };
}

async function resolveChatGptUrlAfterSend(tabId, runId, options = {}) {
  const { signal } = options;
  const startedAt = Date.now();
  const timeoutMs = 60000;

  while (Date.now() - startedAt < timeoutMs) {
    throwIfSaveProcessCancelled(signal);
    const tab = await waitForSaveProcessOperation(
      () => chrome.tabs.get(tabId),
      signal
    );
    const url = tab.url || "";

    if (isChatGptConversationUrl(url)) {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
    }

    await sleep(500, signal);
  }

  sendLog(
    runId,
    "error",
    "Permanent ChatGPT conversation URL was not available after 60 seconds."
  );
  throw new Error(
    "Could not get the permanent ChatGPT conversation URL. The temporary URL was not saved."
  );
}

async function sendToChatGptAndGetUrl(text, runId, options = {}) {
  const promptText = String(text ?? "").trim();
  if (!promptText) {
    throw new Error("Nothing to send to ChatGPT.");
  }

  const targetTab =
    typeof options.tabId === "number"
      ? await openChatGptInExistingTab(options.tabId, runId, {
          signal: options.signal
        })
      : await openNewChatGptTab(runId, { active: true, signal: options.signal });
  const { tabId } = targetTab;
  if (typeof tabId !== "number") {
    throw new Error("Could not open ChatGPT.");
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
  await sleep(settleMs, options.signal);

  sendLog(runId, "info", "Sending prompt to ChatGPT...");
  await sendFillAndSendToTab(tabId, promptText, runId, { signal: options.signal });

  const chatGptUrl = await resolveChatGptUrlAfterSend(tabId, runId, {
    signal: options.signal
  });
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

async function downloadGoogleDocUrlAsPdf(
  runId,
  { documentUrl = "", documentTitle = "resume" } = {}
) {
  const normalizedDocumentUrl = String(documentUrl || "").trim();
  if (!isGoogleDocsDocumentUrl(normalizedDocumentUrl)) {
    throw new Error("The resume URL is not a Google Docs document.");
  }

  const documentId = parseGoogleDocId(normalizedDocumentUrl);
  if (!documentId || documentId === normalizedDocumentUrl) {
    throw new Error("Could not find a Google Docs document ID in the resume URL.");
  }

  const filename = `${sanitizeDownloadFilename(documentTitle)}.pdf`;
  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`;

  sendLog(runId, "info", `Downloading Google Doc as PDF: ${filename}`);

  const downloadId = await chrome.downloads.download({
    url: exportUrl,
    filename,
    saveAs: false,
    conflictAction: "uniquify"
  });

  if (typeof downloadId !== "number") {
    throw new Error("Could not start the PDF download.");
  }

  sendLog(runId, "success", `PDF download started: ${filename}`);

  return {
    documentId,
    filename,
    downloadId,
    url: normalizedDocumentUrl
  };
}

async function downloadActiveGoogleDocAsPdf(runId) {
  sendLog(runId, "info", "Checking active tab for Google Docs...");

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab?.url) {
    throw new Error("No active tab with a URL found.");
  }

  if (!isGoogleDocsDocumentUrl(tab.url)) {
    throw new Error("Current tab is not a Google Docs document.");
  }

  return downloadGoogleDocUrlAsPdf(runId, {
    documentUrl: tab.url,
    documentTitle: tab.title
  });
}

async function humanizeChatGptConversation(runId) {
  sendLog(runId, "info", "Starting Humanize...");
  return sendHumanizePromptToChatGpt(runId);
}

async function downloadResumeAsPdf(runId, options = {}) {
  sendLog(runId, "info", "Starting resume PDF download...");
  if (String(options.documentUrl || "").trim()) {
    return downloadGoogleDocUrlAsPdf(runId, {
      documentUrl: options.documentUrl,
      documentTitle: "resume"
    });
  }

  return downloadActiveGoogleDocAsPdf(runId);
}

async function openUrlInNewTab(runId, options = {}) {
  const url = normalizeHttpUrl(options.url, "Page");
  const sourceWindow = await chrome.windows.getLastFocused({
    windowTypes: ["normal"]
  });
  const [returnTab] = await chrome.tabs.query(
    Number.isInteger(sourceWindow?.id)
      ? {
          active: true,
          windowId: sourceWindow.id
        }
      : {
          active: true,
          lastFocusedWindow: true
        }
  );

  if (!Number.isInteger(returnTab?.id)) {
    throw new Error("Could not identify the tab to return to.");
  }

  sendLog(runId, "info", "Opening URL in a new Chrome tab...");

  const createOptions = {
    url,
    active: true
  };
  if (Number.isInteger(sourceWindow?.id)) {
    createOptions.windowId = sourceWindow.id;
  }

  const tab = await chrome.tabs.create(createOptions);
  if (!Number.isInteger(tab?.id)) {
    throw new Error("Chrome did not return the newly opened tab.");
  }

  sendLog(runId, "success", "URL opened in a new Chrome tab.");

  return {
    url,
    tabId: tab.id,
    windowId: tab.windowId ?? sourceWindow?.id ?? null,
    returnTabId: returnTab.id,
    returnUrl: returnTab.url || ""
  };
}

async function openUrlInRightWindow(runId, options = {}) {
  const url = normalizeHttpUrl(options.url, "Page");
  let sourceWindow = null;

  if (Number.isInteger(options.sourceWindowId)) {
    try {
      sourceWindow = await chrome.windows.get(options.sourceWindowId);
    } catch {
      sourceWindow = null;
    }
  }
  if (!sourceWindow || sourceWindow.type !== "normal") {
    sourceWindow = await chrome.windows.getLastFocused({
      windowTypes: ["normal"]
    });
  }

  const sourceLeft = Number.isFinite(sourceWindow?.left)
    ? sourceWindow.left
    : 0;
  const sourceTop = Number.isFinite(sourceWindow?.top)
    ? sourceWindow.top
    : 0;
  const sourceWidth = Math.max(720, Number(sourceWindow?.width) || 1200);
  const sourceHeight = Math.max(500, Number(sourceWindow?.height) || 800);
  const rightWindowWidth = Math.max(480, Math.floor(sourceWidth / 2));

  sendLog(runId, "info", "Opening the remaining URL in a right-side window...");

  const createdWindow = await chrome.windows.create({
    url,
    type: "normal",
    focused: true,
    left: sourceLeft + sourceWidth - rightWindowWidth,
    top: sourceTop,
    width: rightWindowWidth,
    height: sourceHeight
  });
  const openedTab = createdWindow?.tabs?.[0];

  if (!Number.isInteger(createdWindow?.id)) {
    throw new Error("Chrome did not return the newly opened window.");
  }

  sendLog(runId, "success", "Remaining URL opened in a right-side window.");

  return {
    url,
    windowId: createdWindow.id,
    tabId: Number.isInteger(openedTab?.id) ? openedTab.id : null
  };
}

async function closeTabsAndReturn(runId, options = {}) {
  const openedTabIds = [
    ...new Set(
      (Array.isArray(options.openedTabIds) ? options.openedTabIds : [])
        .map(Number)
        .filter(Number.isInteger)
    )
  ];
  const returnTabId = Number(options.returnTabId);

  if (openedTabIds.length === 0 || !Number.isInteger(returnTabId)) {
    throw new Error("Opened tab IDs and a return tab ID are required.");
  }

  if (openedTabIds.includes(returnTabId)) {
    throw new Error("Opened tabs cannot include the return tab.");
  }

  let returnTab;
  try {
    returnTab = await chrome.tabs.get(returnTabId);
  } catch (_error) {
    throw new Error("The previous tab is no longer open.");
  }

  sendLog(runId, "info", "Returning to the previous tab...");
  await chrome.tabs.update(returnTabId, { active: true });

  if (Number.isInteger(returnTab.windowId)) {
    await chrome.windows.update(returnTab.windowId, { focused: true });
  }

  const closedTabIds = [];
  for (const tabId of openedTabIds) {
    try {
      await chrome.tabs.remove(tabId);
      closedTabIds.push(tabId);
    } catch (_error) {
      // The requested return still succeeds if a created tab was already closed.
    }
  }

  sendLog(runId, "success", "Created tabs closed and previous tab restored.");

  return {
    closedTabIds,
    returnTabId,
    url: returnTab.url || ""
  };
}

async function performSavePostProcessCleanup({
  resetInputs = false,
  reason = "cleared",
  runId = ""
} = {}) {
  const stored = await chrome.storage.local.get(
    SAVE_POST_PROCESS_STORAGE_KEY
  );
  const state = stored[SAVE_POST_PROCESS_STORAGE_KEY];
  const requestedRunId = String(runId || "");
  const stateRunId = String(state?.runId || "");

  if (state && requestedRunId && stateRunId !== requestedRunId) {
    return {
      active: true,
      completed: false,
      cancelled: false
    };
  }

  const controllerRunId = stateRunId || requestedRunId;
  const controller = activeSaveProcessControllers.get(controllerRunId);
  if (reason !== "completed") {
    controller?.abort();
  }

  await chrome.alarms.clear(SAVE_POST_PROCESS_ALARM_NAME);
  await chrome.storage.local.remove(SAVE_POST_PROCESS_STORAGE_KEY);

  if (!state) {
    if (controllerRunId) {
      activeSaveProcessControllers.delete(controllerRunId);
    }
    return {
      active: false,
      completed: false,
      cancelled: reason === "cancelled" || reason === "timed-out"
    };
  }

  if (resetInputs) {
    await resetApplicationInputsAfterSave();
  }

  if (controllerRunId) {
    activeSaveProcessControllers.delete(controllerRunId);
  }

  if (runId) {
    const message =
      reason === "cancelled"
        ? "Save process cancelled. Application inputs cleared."
        : reason === "timed-out"
          ? "Save process timed out. Application inputs cleared."
          : "Google Sheet saving finished. Save process completed and application inputs cleared.";
    sendLog(runId, "info", message);
  }

  return {
    active: false,
    completed: reason === "completed",
    cancelled: reason === "cancelled" || reason === "timed-out",
    timedOut: reason === "timed-out"
  };
}

async function clearSavePostProcess(options = {}) {
  if (!savePostProcessCleanupPromise) {
    savePostProcessCleanupPromise =
      performSavePostProcessCleanup(options);
  }

  const cleanupPromise = savePostProcessCleanupPromise;
  try {
    return await cleanupPromise;
  } finally {
    if (savePostProcessCleanupPromise === cleanupPromise) {
      savePostProcessCleanupPromise = null;
    }
  }
}

async function scheduleSavePostProcess(
  { mode = "save", profileCount = 1 } = {},
  runId
) {
  await clearSavePostProcess({
    resetInputs: false,
    reason: "replaced"
  });
  await chrome.alarms.clear("save-current-tab-check-reminder");
  await chrome.storage.local.remove([
    "saveCheckReminder",
    "extensionUiLockedUntilNotification"
  ]);

  const normalizedRunId = String(runId || "");
  const controller = new AbortController();
  activeSaveProcessControllers.set(normalizedRunId, controller);

  const startedAt = Date.now();
  const endsAt =
    startedAt + SAVE_POST_PROCESS_DURATION_MINUTES * 60 * 1000;
  const state = {
    runId: normalizedRunId,
    mode: mode === "apply" ? "apply" : "save",
    profileCount: Math.max(1, Number(profileCount) || 1),
    startedAt,
    endsAt
  };

  try {
    await chrome.storage.local.set({
      [SAVE_POST_PROCESS_STORAGE_KEY]: state
    });
    await chrome.alarms.create(SAVE_POST_PROCESS_ALARM_NAME, {
      when: endsAt
    });
  } catch (error) {
    activeSaveProcessControllers.delete(normalizedRunId);
    throw error;
  }

  sendLog(
    runId,
    "info",
    `Save progress started with a ${SAVE_POST_PROCESS_DURATION_MINUTES}-minute limit.`
  );

  return state;
}

function getActiveSaveProcessSignal(runId) {
  return activeSaveProcessControllers.get(String(runId || ""))?.signal;
}

async function completeSavePostProcess(runId = "") {
  return clearSavePostProcess({
    resetInputs: true,
    reason: "completed",
    runId
  });
}

async function cancelSavePostProcess(runId = "", options = {}) {
  return clearSavePostProcess({
    resetInputs: true,
    reason: options.reason === "timed-out" ? "timed-out" : "cancelled",
    runId
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== SAVE_POST_PROCESS_ALARM_NAME) {
    return;
  }

  try {
    await cancelSavePostProcess("", { reason: "timed-out" });
  } catch (error) {
    console.error("Could not stop the timed-out save process:", error);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });

  await chrome.alarms.clear("group-job-gpt-tabs-after-save");
  await chrome.alarms.clear("save-current-tab-check-reminder");
  await chrome.storage.local.remove([
    "pendingJobGptTabGroup",
    "saveCheckReminder",
    "extensionUiLockedUntilNotification"
  ]);

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

async function notifyExtensionPages(message) {
  try {
    await chrome.runtime.sendMessage(message);
    return true;
  } catch (error) {
    if (isReceivingEndMissingError(error)) {
      return false;
    }

    throw error;
  }
}

async function isSidePanelOpen() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SIDE_PANEL_PING"
    });
    return response?.open === true;
  } catch (error) {
    if (isReceivingEndMissingError(error)) {
      return false;
    }

    throw error;
  }
}

chrome.commands.onCommand.addListener((command) => {
  const action = APP_ACTION_COMMANDS[command];
  if (!action) {
    return;
  }

  const runId = `shortcut-${Date.now()}`;
  (async () => {
    if (!(await isSidePanelOpen())) {
      console.info(`Ignoring "${command}" because the side panel is closed.`);
      return;
    }


    const validation = await validateApplicationInputsForSave({
      groupTabs: action.groupTabs
    });
    if (!validation.ok) {
      sendLog(runId, "error", validation.error);
      await notifyExtensionPages({
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
      assertActiveJobTabUsable(tab, {
        allowGrouped: !action.groupTabs
      });
    } catch (error) {
      sendLog(runId, "error", error.message);
      await notifyExtensionPages({
        type: "HOTKEY_SAVE_FINISHED",
        runId,
        ok: false,
        error: error.message
      });
      return;
    }

    await notifyExtensionPages({
      type: "HOTKEY_SAVE_STARTED",
      runId
    });

    const result = await saveCurrentTabUrlToSheet(runId, {
      groupTabs: action.groupTabs
    });

    await notifyExtensionPages({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ok: true,
      url: result?.url || ""
    });
  })().catch((error) => {
    console.error("Hotkey app action failed:", error);
    sendLog(runId, "error", error.message || "Hotkey app action failed.");

    notifyExtensionPages({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ok: false,
      error: error.message || "Hotkey app action failed."
    }).catch((notificationError) => {
      console.error("Could not notify extension pages:", notificationError);
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
      selectedProfileId: message.selectedProfileId,
      selectedProfileIds: message.selectedProfileIds,
      selectionVersion: message.selectionVersion
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
    DOWNLOAD_RESUME_PDF: downloadResumeAsPdf,
    CHECK_GOOGLE_SHEET_OPEN: checkOpenGoogleSheet,
    OPEN_URL_IN_NEW_TAB: openUrlInNewTab,
    OPEN_URL_IN_RIGHT_WINDOW: openUrlInRightWindow,
    CLOSE_TABS_AND_RETURN: closeTabsAndReturn,
    UPDATE_WORKSPACE_RESUME_CONTEXT: updateWorkspaceResumeContext,
    CREATE_GOOGLE_DOC: createGoogleDoc,
    CANCEL_SAVE_POST_PROCESS: cancelSavePostProcess
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
      : message.type === "DOWNLOAD_RESUME_PDF"
        ? run(message.runId, {
            documentUrl: message.documentUrl
          })
        : message.type === "OPEN_URL_IN_NEW_TAB"
          ? run(message.runId, {
              url: message.url
            })
          : message.type === "OPEN_URL_IN_RIGHT_WINDOW"
            ? run(message.runId, {
                url: message.url,
                sourceWindowId: message.sourceWindowId
              })
          : message.type === "CLOSE_TABS_AND_RETURN"
            ? run(message.runId, {
                openedTabIds: message.openedTabIds,
                returnTabId: message.returnTabId
              })
            : message.type === "UPDATE_WORKSPACE_RESUME_CONTEXT"
              ? run(message.runId, {
                  resumeUrl: message.resumeUrl,
                  resumeText: message.resumeText
                })
            : message.type === "CREATE_GOOGLE_DOC"
              ? run(message.runId, {
                  resumeText: message.resumeText
                })
              : run(message.runId);

  runPromise
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => {
      const cancelled = isSaveProcessCancelledError(error);
      if (cancelled) {
        console.info(error.message || "Save process cancelled.");
      } else {
        console.error(error);
      }

      sendLog(
        message.runId,
        cancelled ? "info" : "error",
        error.message || "Unknown error"
      );

      sendResponse({
        ok: false,
        cancelled,
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

async function createSaveProfileTargetTabIds(sourceTab, profileCount, runId, options = {}) {
  const { signal } = options;
  if (typeof sourceTab?.id !== "number") {
    throw new Error("Current tab does not have a valid tab ID.");
  }

  const targetTabIds = [sourceTab.id];
  const additionalTabCount = Math.max(0, profileCount - 1);
  if (additionalTabCount === 0) {
    return targetTabIds;
  }

  sendLog(
    runId,
    "info",
    `Opening ${additionalTabCount} additional job ${
      additionalTabCount === 1 ? "tab" : "tabs"
    } for the selected profiles...`
  );

  for (let index = 0; index < additionalTabCount; index += 1) {
    throwIfSaveProcessCancelled(signal);
    const createProperties = {
      url: sourceTab.url,
      active: false,
      windowId: sourceTab.windowId
    };
    if (Number.isInteger(sourceTab.index)) {
      createProperties.index = sourceTab.index + index + 1;
    }

    const duplicateTab = await waitForSaveProcessOperation(
      () => chrome.tabs.create(createProperties),
      signal
    );
    if (typeof duplicateTab.id !== "number") {
      throw new Error("Could not create a ChatGPT target tab for every profile.");
    }
    targetTabIds.push(duplicateTab.id);
  }

  return targetTabIds;
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


  const validation = await validateApplicationInputsForSave({
    groupTabs: groupTabsInsteadOfClosing
  });
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  assertActiveJobTabUsable(tab, {
    allowGrouped: !groupTabsInsteadOfClosing
  });

  const selectedProfiles = validation.selectedProfiles;
  await scheduleSavePostProcess(
    {
      mode: groupTabsInsteadOfClosing ? "apply" : "save",
      profileCount: selectedProfiles.length
    },
    runId
  );
  const signal = getActiveSaveProcessSignal(runId);
  throwIfSaveProcessCancelled(signal);

  try {
    sendLog(runId, "info", "Checking current active tab...");

    const urlForSheet = normalizeUrlForStorage(tab.url);

    sendLog(runId, "success", `Found tab URL: ${tab.url}`);

    const resumeTemplateIds = new Map(
      selectedProfiles.map((profile) => [
        profile.id,
        getProfileResumeTemplateId(profile)
      ])
    );
    const token = await waitForSaveProcessOperation(
      () => getGoogleAccessToken(),
      signal
    );
    throwIfSaveProcessCancelled(signal);

    if (typeof tab.id !== "number") {
      throw new Error("Current tab does not have a valid tab ID.");
    }

    const targetTabIds = groupTabsInsteadOfClosing
      ? []
      : await createSaveProfileTargetTabIds(
          tab,
          selectedProfiles.length,
          runId,
          { signal }
        );
    const results = [];

    for (let index = 0; index < selectedProfiles.length; index += 1) {
      throwIfSaveProcessCancelled(signal);
      const profile = selectedProfiles[index];
      const profileName =
        String(profile?.name || "").trim() || DEFAULT_PROFILE_NAME;
      const resumeTemplateId = resumeTemplateIds.get(profile.id);
      const positionLabel = `${index + 1}/${selectedProfiles.length}`;

      sendLog(
        runId,
        "info",
        `Processing profile ${positionLabel}: ${profileName}`
      );

      const baseDocTitle =
        tab.title || `Application ${new Date().toLocaleDateString()}`;
      const docTitle =
        selectedProfiles.length > 1
          ? `${baseDocTitle} - ${profileName}`
          : baseDocTitle;
      sendLog(runId, "info", `Creating resume copy for "${profileName}"...`);
      const resumeUrl = await copyResumeAndGetUrl(
        token,
        docTitle,
        resumeTemplateId,
        runId, { signal }
      );
      sendLog(runId, "success", `Resume copy created: ${resumeUrl}`);

      sendLog(runId, "info", `Preparing ChatGPT prompt for "${profileName}"...`);
      const chatGptMessage = await buildChatGptMessageFromStorage(profile);
      throwIfSaveProcessCancelled(signal);
      let chatGptUrl = CHATGPT_URL;
      let chatGptTabId = null;
      const targetTabId = groupTabsInsteadOfClosing
        ? null
        : targetTabIds[index];

      if (!groupTabsInsteadOfClosing) {
        await notifyExtensionPages({
          type: "SHOW_SAVE_WORKSPACE",
          runId,
          batchStart: index === 0,
          batchIndex: index,
          batchCount: selectedProfiles.length,
          jobTitle: tab.title || "Job page",
          jobUrl: tab.url,
          profileName,
          resumeUrl,
          chatGptTabId: targetTabId
        });
      }

      if (chatGptMessage) {
        const chatGptResult = await sendToChatGptAndGetUrl(
          chatGptMessage,
          runId,
          groupTabsInsteadOfClosing
            ? { signal }
            : { tabId: targetTabId, signal }
        );
        chatGptUrl = chatGptResult.url;
        chatGptTabId = chatGptResult.tabId;
      } else {
        sendLog(
          runId,
          "info",
          `No ChatGPT message content was available for "${profileName}".`
        );
        const chatGptResult = groupTabsInsteadOfClosing
          ? await openNewChatGptTab(runId, { signal })
          : await openChatGptInExistingTab(targetTabId, runId, { signal });
        chatGptUrl = chatGptResult.url;
        chatGptTabId = chatGptResult.tabId;
      }

      const row = buildApplicationSheetRow({
        timestamp: new Date().toISOString(),
        jobTitle: tab.title,
        profileName,
        jobUrl: urlForSheet,
        chatGptUrl,
        resumeUrl,
        applyNow: groupTabsInsteadOfClosing
      });

      sendLog(
        runId,
        "info",
        `Preparing row for profile sheet tab "${profileName}"...`
      );

      await appendRowsToGoogleSheet([row], runId, {
        sheetName: profileName,
        signal
      });
      sendLog(
        runId,
        "success",
        `URL saved to profile sheet tab "${profileName}".`
      );

      if (index === selectedProfiles.length - 1) {
        await completeSavePostProcess(runId);
      }

      if (!groupTabsInsteadOfClosing) {
        await notifyExtensionPages({
          type: "SAVE_WORKSPACE_READY",
          runId,
          profileName,
          chatGptUrl,
          chatGptTabId
        });
      }

      results.push({
        profileId: profile.id,
        profileName,
        resumeUrl,
        chatGptUrl,
        chatGptTabId
      });
      sendLog(runId, "success", `Finished profile ${positionLabel}: ${profileName}`);
    }


    let applicationGroupId = null;

    if (groupTabsInsteadOfClosing) {
      const result = results[0];
      applicationGroupId = await groupApplicationTabs({
        jobTabId: tab.id,
        resumeUrl: result.resumeUrl,
        chatGptUrl: result.chatGptUrl,
        chatGptTabId: result.chatGptTabId,
        groupTitle: tab.title || "Application",
        runId
      });
    }

    const finalResult = results[results.length - 1];


    sendLog(
      runId,
      "success",
      groupTabsInsteadOfClosing
        ? "Finished. Application tabs grouped."
        : `Finished. Opened ${selectedProfiles.length} ChatGPT ${
            selectedProfiles.length === 1 ? "tab" : "tabs"
          } for the selected profiles; no tab group was created.`
    );

    return {
      url: urlForSheet,
      chatGptUrl: finalResult.chatGptUrl,
      chatGptTabId: finalResult.chatGptTabId,
      jobTitle: tab.title || "Job page",
      jobUrl: tab.url,
      profileName: finalResult.profileName,
      resumeUrl: finalResult.resumeUrl,
      profileCount: selectedProfiles.length,
      results,
      grouped: groupTabsInsteadOfClosing
    };
  } catch (error) {
    if (isSaveProcessCancelledError(error)) {
      await clearSavePostProcess({
        resetInputs: true,
        reason: "cancelled",
        runId
      }).catch((cleanupError) => {
        console.error("Could not clean up the cancelled save process:", cleanupError);
      });
      throw createSaveProcessCancelledError();
    }

    await clearSavePostProcess({
      resetInputs: false,
      reason: "failed",
      runId
    }).catch((cleanupError) => {
      console.error("Could not clean up the failed save process:", cleanupError);
    });
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

async function ensureSheetExists(
  token,
  spreadsheetId,
  sheetTitle,
  runId,
  options = {}
) {
  const fields = encodeURIComponent("sheets(properties(sheetId,title))");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=${fields}`;

  const response = await fetch(url, {
    signal: options.signal,
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
    const sheetId = sheet.properties.sheetId;
    if (options.initializeApplicationSheet === true) {
      await ensureApplicationSheetSchema(
        token,
        spreadsheetId,
        sheetTitle,
        sheetId,
        runId,
        { signal: options.signal }
      );
    }
    return sheetId;
  }

  if (runId) {
    sendLog(runId, "info", `Sheet "${sheetTitle}" not found. Creating it...`);
  }

  const newSheetId = createUniqueSheetId(data.sheets || []);
  const requests = [
    {
      addSheet: {
        properties: {
          sheetId: newSheetId,
          title: sheetTitle
        }
      }
    }
  ];

  if (options.initializeApplicationSheet === true) {
    requests.push(...buildApplicationSheetInitializationRequests(newSheetId));
  }

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const createResponse = await fetch(batchUrl, {
    method: "POST",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Google Sheets batchUpdate error: ${errorText}`);
  }

  const createData = await createResponse.json();
  const createdSheetId =
    createData.replies?.[0]?.addSheet?.properties?.sheetId ?? newSheetId;

  if (createdSheetId == null) {
    throw new Error(`Failed to create sheet "${sheetTitle}".`);
  }

  if (runId) {
    sendLog(
      runId,
      "success",
      options.initializeApplicationSheet === true
        ? `Created and initialized sheet tab "${sheetTitle}".`
        : `Created sheet tab "${sheetTitle}".`
    );
  }

  return createdSheetId;
}

async function ensureApplicationSheetSchema(
  token,
  spreadsheetId,
  sheetName,
  sheetId,
  runId,
  options = {}
) {
  const headerRange = encodeURIComponent(formatSheetRange(sheetName, "A1:G1"));
  const headerUrl =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    `/values/${headerRange}`;
  const headerResponse = await fetch(headerUrl, {
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!headerResponse.ok) {
    const errorText = await headerResponse.text();
    throw new Error(`Google Sheets API error: ${errorText}`);
  }

  const headerData = await headerResponse.json();
  const header = headerData.values?.[0] ?? [];

  if (hasApplicationSheetHeaders(header)) {
    return;
  }

  const isExactLegacySchema = hasLegacyApplicationSheetHeaders(header);
  const hasHeaderValues = header.some((cell) => String(cell ?? "").trim());
  const shouldInsertProfileColumn =
    isExactLegacySchema ||
    (hasHeaderValues && header.length <= LEGACY_APPLICATION_SHEET_HEADERS.length);

  const requests = [];
  let existingRowCount = 0;

  if (shouldInsertProfileColumn) {
    const existingValues = await readSheetValues(
      token,
      runId,
      {
        spreadsheetId,
        sheetName
      },
      { signal: options.signal }
    );
    existingRowCount = Math.max(0, existingValues.length - 1);
    requests.push({
      insertDimension: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: 2,
          endIndex: 3
        },
        inheritFromBefore: false
      }
    });
  }

  requests.push(...buildApplicationSheetInitializationRequests(sheetId));

  if (shouldInsertProfileColumn && existingRowCount > 0) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: existingRowCount + 1,
          startColumnIndex: 2,
          endColumnIndex: 3
        },
        cell: {
          userEnteredValue: {
            stringValue: sheetName
          }
        },
        fields: "userEnteredValue"
      }
    });
  }

  const batchUrl =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const response = await fetch(batchUrl, {
    method: "POST",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets batchUpdate error: ${errorText}`);
  }

  if (runId) {
    sendLog(
      runId,
      "success",
      shouldInsertProfileColumn
        ? `Migrated sheet tab "${sheetName}" to the seven-column layout.`
        : hasHeaderValues
          ? `Normalized application headers in sheet tab "${sheetName}".`
          : `Initialized sheet tab "${sheetName}" with application headers.`
    );
  }
}

async function readSheetValues(token, runId, sheetConfig, options = {}) {
  const { spreadsheetId, sheetName } = sheetConfig;
  const range = encodeURIComponent(formatSheetRange(sheetName, "A:G"));
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  sendLog(runId, "info", `Reading rows from ${sheetName}...`);

  const response = await fetch(url, {
    signal: options.signal,
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

  const baseSheetConfig = await getSheetConfig();
  const profileState = await getProfileSelectionState();
  const selectedProfile = getSelectedProfileFromState(profileState);
  const profileName =
    String(selectedProfile?.name || "").trim() || DEFAULT_PROFILE_NAME;
  const sheetConfig = {
    ...baseSheetConfig,
    sheetName: profileName
  };
  const sheetId = await ensureSheetExists(
    token,
    sheetConfig.spreadsheetId,
    profileName,
    runId,
    {
      initializeApplicationSheet: true
    }
  );

  const values = await readSheetValues(token, runId, sheetConfig);

  if (values.length === 0) {
    sendLog(runId, "info", "Sheet has no rows. Nothing to do.");
    return { removed: 0, rowCount: 0 };
  }

  const seen = new Set();
  const duplicateRowIndices = [];
  const firstDataRowIndex = hasApplicationSheetHeaders(values[0]) ? 1 : 0;
  const dataRowCount = values.length - firstDataRowIndex;

  for (let i = firstDataRowIndex; i < values.length; i++) {
    const row = values[i];
    const urlKey = normalizeUrlKeyForDedupe(row[4]);

    if (!urlKey) {
      continue;
    }

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
      profileName: row[2] || "",
      chatGptUrl: row[3] || "",
      url: row[4] || "",
      resumeUrl: row[5] || "",
      applyNow: row[6] || ""
    };
  });

  if (duplicateRowIndices.length === 0) {
    sendLog(runId, "success", "No duplicate URLs found.");
    return { removed: 0, rowCount: dataRowCount, deletedRows: [] };
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
    rowCount: dataRowCount,
    deletedRows
  };
}

async function appendRowsToGoogleSheet(rows, runId, options = {}) {
  sendLog(runId, "info", "Requesting Google authorization token...");

  const token = await waitForSaveProcessOperation(
    () => getGoogleAccessToken(),
    options.signal
  );
  throwIfSaveProcessCancelled(options.signal);
  const sheetConfig = await getSheetConfig();
  const sheetName =
    String(options.sheetName || sheetConfig.sheetName || "").trim();

  sendLog(runId, "success", "Google authorization token received.");

  await ensureSheetExists(
    token,
    sheetConfig.spreadsheetId,
    sheetName,
    runId,
    {
      initializeApplicationSheet: true,
      signal: options.signal
    }
  );

  const range = encodeURIComponent(formatSheetRange(sheetName, "A1"));
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetConfig.spreadsheetId}` +
    `/values/${range}:append?valueInputOption=USER_ENTERED` +
    `&insertDataOption=INSERT_ROWS`;

  sendLog(runId, "info", `Sending data to sheet: ${sheetName}`);

  const response = await fetch(url, {
    method: "POST",
    signal: options.signal,
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

async function copyGoogleDocTemplate(token, title, templateId, options = {}) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
    {
      method: "POST",
      signal: options.signal,
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

async function getGoogleDocWithAuthRetry(token, documentId, runId) {
  let activeToken = token;
  let response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`,
    {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    }
  );

  if (response.status === 401 || response.status === 403) {
    sendLog(
      runId,
      "info",
      "Google Doc read auth error. Refreshing token and retrying..."
    );
    await clearCachedGoogleAccessToken(activeToken);
    activeToken = await getGoogleAccessToken({ interactive: true });
    response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      formatGoogleApiError(errorText, "Could not read the copied Google Doc.")
    );
  }

  return {
    activeToken,
    document: await response.json()
  };
}

function getFirstGoogleDocTabId(tabs = []) {
  for (const tab of tabs) {
    const tabId = tab?.tabProperties?.tabId;
    if (tabId) {
      return tabId;
    }

    const childTabId = getFirstGoogleDocTabId(tab?.childTabs || []);
    if (childTabId) {
      return childTabId;
    }
  }

  return "";
}

function createGoogleDocParagraphRecord(structuralElement) {
  const paragraph = structuralElement?.paragraph;
  const elements = paragraph?.elements || [];
  if (!paragraph || elements.length === 0) {
    return null;
  }

  // Avoid touching images, equations, page breaks, and other non-text content.
  if (elements.some((element) => !element.textRun)) {
    return null;
  }

  const textElements = elements
    .map((element) => ({
      startIndex: element.startIndex,
      content: element.textRun?.content,
      textStyle: element.textRun?.textStyle || {}
    }))
    .filter(
      (element) =>
        Number.isInteger(element.startIndex) &&
        typeof element.content === "string"
    );
  if (textElements.length === 0) {
    return null;
  }

  const fullText = textElements.map((element) => element.content).join("");
  const trailingNewlineLength = fullText.endsWith("\n") ? 1 : 0;
  const currentText = trailingNewlineLength
    ? fullText.slice(0, -trailingNewlineLength)
    : fullText;
  const startIndex = textElements[0].startIndex;
  const endIndex = startIndex + currentText.length;
  const styleRuns = [];
  let remainingTextLength = currentText.length;
  let relativeOffset = 0;

  for (const textElement of textElements) {
    const runLength = Math.min(
      textElement.content.length,
      remainingTextLength
    );
    if (runLength > 0) {
      styleRuns.push({
        startOffset: relativeOffset,
        endOffset: relativeOffset + runLength,
        textStyle: textElement.textStyle
      });
      relativeOffset += runLength;
      remainingTextLength -= runLength;
    }
  }

  return {
    startIndex,
    endIndex,
    currentText,
    styleRuns,
    hasBullet: Boolean(paragraph.bullet)
  };
}

function collectGoogleDocTextParagraphs(structuralElements, paragraphs = []) {
  for (const structuralElement of structuralElements || []) {
    const paragraph = createGoogleDocParagraphRecord(structuralElement);
    if (paragraph && paragraph.currentText.trim()) {
      paragraphs.push(paragraph);
    }

    for (const tableRow of structuralElement.table?.tableRows || []) {
      for (const tableCell of tableRow.tableCells || []) {
        collectGoogleDocTextParagraphs(tableCell.content, paragraphs);
      }
    }
  }

  return paragraphs.sort(
    (left, right) => left.startIndex - right.startIndex
  );
}

function normalizeResumeContextLines(resumeText) {
  return String(resumeText ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^```(?:[a-z0-9_-]+)?$/i.test(line));
}

function normalizeResumeLineForParagraph(line, paragraph) {
  let normalizedLine = String(line || "")
    .trim()
    .replace(/^#{1,6}\s+/, "");

  if (paragraph.hasBullet) {
    normalizedLine = normalizedLine.replace(
      /^(?:(?:[-*+•◦▪‣])|(?:\d+[.)]))\s+/,
      ""
    );
  }

  const wrappedBoldMatch = normalizedLine.match(/^(\*\*|__)(.+)\1$/);
  if (wrappedBoldMatch) {
    normalizedLine = wrappedBoldMatch[2].trim();
  }

  return normalizedLine;
}

function getWritableGoogleDocTextStyle(textStyle = {}) {
  return GOOGLE_DOC_WRITABLE_TEXT_STYLE_FIELDS.reduce((style, field) => {
    if (
      Object.prototype.hasOwnProperty.call(textStyle, field) &&
      textStyle[field] !== undefined
    ) {
      style[field] = textStyle[field];
    }
    return style;
  }, {});
}

function buildMappedGoogleDocTextStyleRequests(
  paragraph,
  replacementText,
  tabId
) {
  const replacementLength = replacementText.length;
  const originalLength = paragraph.currentText.length;
  if (
    replacementLength === 0 ||
    originalLength === 0 ||
    paragraph.styleRuns.length === 0
  ) {
    return [];
  }

  return paragraph.styleRuns.flatMap((styleRun, index) => {
    const rangeStart =
      index === 0
        ? 0
        : Math.round(
            (styleRun.startOffset / originalLength) * replacementLength
          );
    const rangeEnd =
      index === paragraph.styleRuns.length - 1
        ? replacementLength
        : Math.round(
            (styleRun.endOffset / originalLength) * replacementLength
          );
    const textStyle = getWritableGoogleDocTextStyle(styleRun.textStyle);
    const fields = Object.keys(textStyle);

    if (rangeEnd <= rangeStart || fields.length === 0) {
      return [];
    }

    return [
      {
        updateTextStyle: {
          range: {
            startIndex: paragraph.startIndex + rangeStart,
            endIndex: paragraph.startIndex + rangeEnd,
            ...(tabId ? { tabId } : {})
          },
          textStyle,
          fields: fields.join(",")
        }
      }
    ];
  });
}

function buildResumeParagraphUpdateRequests(document, resumeText) {
  const paragraphs = collectGoogleDocTextParagraphs(
    document.body?.content
  );
  const resumeLines = normalizeResumeContextLines(resumeText);
  const tabId = getFirstGoogleDocTabId(document.tabs);

  if (paragraphs.length === 0) {
    throw new Error(
      "The current copied resume does not contain editable text paragraphs."
    );
  }
  if (resumeLines.length === 0) {
    throw new Error("Resume context is required.");
  }
  if (resumeLines.length > paragraphs.length) {
    throw new Error(
      `The submitted resume has ${resumeLines.length} non-empty lines, but the current copied resume has only ${paragraphs.length} styled text paragraphs. Keep the same line order and shorten or combine the extra lines so the existing styles can be retained.`
    );
  }

  const requests = [];
  let changedParagraphCount = 0;

  for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
    const paragraph = paragraphs[index];
    const replacementText =
      index < resumeLines.length
        ? normalizeResumeLineForParagraph(resumeLines[index], paragraph)
        : "";

    if (replacementText === paragraph.currentText) {
      continue;
    }

    changedParagraphCount += 1;
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: paragraph.startIndex,
          endIndex: paragraph.endIndex,
          ...(tabId ? { tabId } : {})
        }
      }
    });

    if (!replacementText) {
      continue;
    }

    requests.push({
      insertText: {
        location: {
          index: paragraph.startIndex,
          ...(tabId ? { tabId } : {})
        },
        text: replacementText
      }
    });
    requests.push(
      ...buildMappedGoogleDocTextStyleRequests(
        paragraph,
        replacementText,
        tabId
      )
    );
  }

  return {
    requests,
    changedParagraphCount,
    inputParagraphCount: resumeLines.length,
    templateParagraphCount: paragraphs.length
  };
}

async function replaceResumeContextPreservingStyles(
  token,
  documentId,
  resumeText,
  runId
) {
  const trimmedText = String(resumeText ?? "").trim();
  if (!trimmedText) {
    throw new Error("Resume context is required.");
  }

  sendLog(
    runId,
    "info",
    "Reading the current copied resume structure and styles..."
  );
  const {
    activeToken: readToken,
    document
  } = await getGoogleDocWithAuthRetry(token, documentId, runId);
  const {
    requests,
    changedParagraphCount,
    inputParagraphCount,
    templateParagraphCount
  } = buildResumeParagraphUpdateRequests(document, trimmedText);

  if (requests.length === 0) {
    sendLog(runId, "success", "The copied resume already matches the submitted text.");
    return readToken;
  }

  const { activeToken } = await batchUpdateGoogleDocWithAuthRetry(
    readToken,
    documentId,
    requests,
    runId,
    "Could not update the current copied resume in Google Docs."
  );

  sendLog(
    runId,
    "success",
    `Updated ${changedParagraphCount} of ${templateParagraphCount} styled text paragraphs from ${inputParagraphCount} submitted lines.`
  );
  return activeToken;
}

async function copyResumeAndGetUrl(
  token,
  title,
  resumeTemplateId,
  runId,
  options = {}
) {
  let response = await copyGoogleDocTemplate(
    token,
    title,
    resumeTemplateId,
    options
  );

  if (response.status === 401 || response.status === 403) {
    sendLog(runId, "info", "Resume copy auth error. Refreshing token and retrying...");
    await clearCachedGoogleAccessToken(token);
    const freshToken = await waitForSaveProcessOperation(
      () => getGoogleAccessToken({ interactive: true }),
      options.signal
    );
    throwIfSaveProcessCancelled(options.signal);
    response = await copyGoogleDocTemplate(
      freshToken,
      title,
      resumeTemplateId,
      options
    );
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

async function updateWorkspaceResumeContext(runId, options = {}) {
  const resumeUrl = String(options.resumeUrl || "").trim();
  const resumeText = String(options.resumeText || "").trim();
  const documentId = parseGoogleDocId(resumeUrl);

  if (!documentId) {
    throw new Error("The workspace resume URL is not a Google Docs document.");
  }
  if (!resumeText) {
    throw new Error("Resume context is required.");
  }

  sendLog(runId, "info", "Building the copied resume document...");
  const token = await getGoogleAccessToken();
  await replaceResumeContextPreservingStyles(
    token,
    documentId,
    resumeText,
    runId
  );
  sendLog(runId, "success", "Copied resume document updated.");

  return {
    url: `https://docs.google.com/document/d/${documentId}/edit`
  };
}

async function createGoogleDoc(runId, options = {}) {
  const resumeText = String(options.resumeText ?? "").trim();
  if (!resumeText) {
    throw new Error("Resume text is required before creating a Google Doc.");
  }

  sendLog(runId, "info", "Starting Google Doc creation...");

  const resumeTemplateId = await getSelectedProfileResumeTemplateId();
  sendLog(runId, "info", `Using resume template: ${resumeTemplateId}`);

  const profileState = await getProfileSelectionState();
  const selectedProfile = getSelectedProfileFromState(profileState);
  const profileName = sanitizeDownloadFilename(
    selectedProfile?.name || DEFAULT_PROFILE_NAME
  ).replace(/\s+/g, "_");

  let token = await getGoogleAccessToken();
  sendLog(runId, "success", "Google authorization token received.");

  const title = `${profileName}_Resume`;

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

  token = await replaceResumeContextPreservingStyles(
    token,
    documentId,
    resumeText,
    runId
  );

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
