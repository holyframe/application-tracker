// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

const DEFAULT_SPREADSHEET_ID = "1xnKuvM0DGDYWsBtRF6Az1nNwf1OOEh36LoitK8WUBoY";
const DEFAULT_SHEET_NAME = "Sheet1";
const DEFAULT_RESUME_TEMPLATE_ID = "1oF1GQJ6bTEli1548HVyI91O803oQaeP8ec8Y81bj5zM";
const DEFAULT_AI_PROVIDER_ID = "chatgpt";
const AI_PROVIDERS = Object.freeze({
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    homeUrl: "https://chatgpt.com",
    contentScript: "content/chatgpt.js"
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    homeUrl: "https://chat.deepseek.com",
    contentScript: "content/ai-provider.js",
    waitForFullPageLoad: false,
    promptSettleDelayMs: { min: 0, max: 0 },
    requiredMode: "Expert",
    maxConnectionAttempts: 60
  },
  // Sends nothing to a chat site. The assembled context becomes a Google Doc and
  // that doc URL takes the place of the conversation URL everywhere downstream.
  none: {
    id: "none",
    label: "No Model",
    urlLabel: "Context Doc",
    contextDocOnly: true
  }
});
const SHEET_CONFIG_STORAGE_KEY = "sheetConfig";
const PROMPT_RESUME_SELECTION_STORAGE_KEY = "promptResumeSelection";
const LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY = "resumeSelection";
const PROFILE_SELECTION_STORAGE_KEY = "profileSelection";
const DEFAULT_PROFILE_NAME = "Default";
const PROMPT_SELECTION_STORAGE_KEY = "promptSelection";
const JOB_DESCRIPTION_SELECTION_STORAGE_KEY = "jobDescriptionSelection";
const SAVE_POST_PROCESS_ALARM_NAME = "save-current-tab-post-process";
const SAVE_POST_PROCESS_STORAGE_KEY = "savePostProcess";
// Side panel mirrors of per-tab workspace/process state. Kept until the Chrome
// tab closes so reopening the panel still restores each tab's details.
const TAB_SESSION_STORAGE_KEY = "tabSessionById";
const activeSaveProcessControllers = new Map();
let activeSaveRunId = "";
// Every run is owned by the tab it was started from, so the side panel can file
// its logs and progress against that tab instead of a single global slot.
const runOwnerTabIds = new Map();
const savePostProcessCleanupPromisesByTabId = new Map();
// Tabs we have explicitly disabled the side panel on, so the common case can
// skip setOptions entirely.
const sidePanelDisabledTabIds = new Set();

function registerRunOwnerTab(runId, tabId) {
  const normalizedRunId = String(runId || "");
  if (!normalizedRunId || !Number.isInteger(tabId)) {
    return;
  }

  runOwnerTabIds.set(normalizedRunId, tabId);
}

function getRunOwnerTabId(runId) {
  const ownerTabId = runOwnerTabIds.get(String(runId || ""));
  return Number.isInteger(ownerTabId) ? ownerTabId : null;
}

function releaseRunOwnerTab(runId) {
  runOwnerTabIds.delete(String(runId || ""));
}

async function getSavePostProcessStates() {
  const stored = await chrome.storage.local.get(SAVE_POST_PROCESS_STORAGE_KEY);
  const states = stored[SAVE_POST_PROCESS_STORAGE_KEY];
  return states && typeof states === "object" && !Array.isArray(states)
    ? states
    : {};
}

function findSavePostProcessEntry(states, runId, ownerTabId) {
  const normalizedRunId = String(runId || "");

  if (Number.isInteger(ownerTabId) && states[ownerTabId]) {
    return { tabId: ownerTabId, state: states[ownerTabId] };
  }

  const match = Object.entries(states).find(
    ([, state]) => String(state?.runId || "") === normalizedRunId
  );

  return match ? { tabId: Number(match[0]), state: match[1] } : null;
}
const SAVE_PROCESS_CANCELLED_CODE = "SAVE_PROCESS_CANCELLED";
const SAVE_PROCESS_BUSY_CODE = "SAVE_PROCESS_BUSY";
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
  "AI conversation URL",
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
  resumeUrl
}) {
  return [
    String(timestamp || ""),
    String(jobTitle || ""),
    String(profileName || ""),
    String(chatGptUrl || ""),
    String(jobUrl || ""),
    String(resumeUrl || ""),
    ""
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

function isJobrightUrl(url = "") {
  try {
    const parsed = new URL(String(url || ""));
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "jobright.ai" ||
        parsed.hostname.endsWith(".jobright.ai"))
    );
  } catch (_error) {
    return false;
  }
}

function isPinnedTabSupportedUrl(url = "") {
  return isGoogleSheetsDocumentUrl(url) || isJobrightUrl(url);
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

function buildResumeDownloadTitle(profileName = "") {
  const raw = String(profileName || "").trim();
  if (!raw) {
    return "Resume";
  }

  const parts = sanitizeDownloadFilename(raw)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "Resume";
  }

  return `${parts.join("_")}_Resume`;
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

function createPromptId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `prompt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  const normalized = normalizeLabeledTextEntry(entry, createPromptResumeId);
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    autoSelect: Boolean(entry?.autoSelect)
  };
}

function enforceSingleAutoSelectPromptResume(promptResumes) {
  let foundAuto = false;

  return promptResumes.map((entry) => {
    if (!entry.autoSelect) {
      return entry;
    }

    if (foundAuto) {
      return { ...entry, autoSelect: false };
    }

    foundAuto = true;
    return entry;
  });
}

function getAutoSelectedPromptResumeId(promptResumes) {
  return (
    promptResumes.find((entry) => entry.autoSelect)?.id || ""
  );
}

function normalizePromptResumeSelection(selection, { applyAutoSelect = false } = {}) {
  let promptResumes = (
    Array.isArray(selection?.promptResumes) ? selection.promptResumes : []
  )
    .map(normalizePromptResume)
    .filter(Boolean);

  promptResumes = enforceSingleAutoSelectPromptResume(promptResumes);

  let selectedPromptResumeId =
    promptResumes.some(
      (entry) => entry.id === selection?.selectedPromptResumeId
    )
      ? selection.selectedPromptResumeId
      : "";

  if (applyAutoSelect && !selectedPromptResumeId) {
    selectedPromptResumeId = getAutoSelectedPromptResumeId(promptResumes);
  }

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
  const { promptResumes, selectedPromptResumeId } =
    normalizePromptResumeSelection(
      {
        promptResumes: promptResumesInput,
        selectedPromptResumeId: selectedPromptResumeIdInput
      },
      { applyAutoSelect: true }
    );

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
    profiles: profileState.profiles.map((profile) => {
      const resumes = normalizePromptResumeSelection(
        {
          promptResumes: profile.promptResumes,
          selectedPromptResumeId: ""
        },
        { applyAutoSelect: true }
      );

      return {
        ...profile,
        promptResumes: resumes.promptResumes,
        selectedPromptResumeId: resumes.selectedPromptResumeId
      };
    })
  });
  await saveJobDescriptionSelectionState("");

  const message =
    "Cleared job description and restored auto-selected prompt resumes for the next application.";

  if (runId) {
    sendLog(runId, "info", message);
  }

  chrome.runtime
    .sendMessage({
      type: "APPLICATION_INPUTS_RESET",
      runId,
      ownerTabId: getRunOwnerTabId(runId),
      message
    })
    .catch(() => {});
}

async function loadPromptSelectionRecord() {
  const stored = await chrome.storage.local.get(PROMPT_SELECTION_STORAGE_KEY);
  return normalizePromptSelectionState(stored[PROMPT_SELECTION_STORAGE_KEY]);
}

function normalizePromptEntry(entry) {
  const content = normalizePromptContent(entry?.content);
  if (!content) {
    return null;
  }

  return {
    id: String(entry?.id || createPromptId()),
    content,
    updatedAt: normalizeUpdatedAt(entry?.updatedAt) || new Date().toISOString(),
    label: String(entry?.label || "").trim() || "GPT Prompt"
  };
}

function normalizePromptSelectionState(selection) {
  if (!selection || typeof selection !== "object") {
    return {
      prompts: [],
      selectedPromptId: "",
      content: "",
      updatedAt: ""
    };
  }

  let prompts = [];

  if (Array.isArray(selection.prompts)) {
    prompts = selection.prompts
      .map((entry) => normalizePromptEntry(entry))
      .filter(Boolean);
  } else if (typeof selection.content === "string" && selection.content.trim()) {
    prompts = [
      normalizePromptEntry({
        id: selection.selectedPromptId || createPromptId(),
        content: selection.content,
        updatedAt: selection.updatedAt,
        label: "GPT Prompt"
      })
    ].filter(Boolean);
  }

  let selectedPromptId = String(selection.selectedPromptId || "").trim();
  if (!prompts.some((entry) => entry.id === selectedPromptId)) {
    selectedPromptId = prompts[0]?.id || "";
  }

  const selected =
    prompts.find((entry) => entry.id === selectedPromptId) || null;

  return {
    prompts,
    selectedPromptId,
    content: selected?.content || "",
    updatedAt: selected?.updatedAt || ""
  };
}

async function getPromptSelectionState() {
  return loadPromptSelectionRecord();
}

async function persistPromptSelectionState(state) {
  const normalized = normalizePromptSelectionState(state);
  await chrome.storage.local.set({
    [PROMPT_SELECTION_STORAGE_KEY]: {
      prompts: normalized.prompts,
      selectedPromptId: normalized.selectedPromptId
    }
  });
  return normalized;
}

async function savePromptSelectionState(contentInput) {
  const content = normalizePromptContent(contentInput);
  const current = await loadPromptSelectionRecord();

  if (!content) {
    if (!current.selectedPromptId) {
      return persistPromptSelectionState({ prompts: [], selectedPromptId: "" });
    }

    const prompts = current.prompts.filter(
      (entry) => entry.id !== current.selectedPromptId
    );
    return persistPromptSelectionState({
      prompts,
      selectedPromptId: prompts[0]?.id || ""
    });
  }

  const updatedAt = new Date().toISOString();
  if (current.selectedPromptId) {
    const prompts = current.prompts.map((entry) =>
      entry.id === current.selectedPromptId
        ? { ...entry, content, updatedAt }
        : entry
    );
    return persistPromptSelectionState({
      prompts,
      selectedPromptId: current.selectedPromptId
    });
  }

  const prompt = {
    id: createPromptId(),
    content,
    updatedAt,
    label: "GPT Prompt"
  };
  return persistPromptSelectionState({
    prompts: [prompt],
    selectedPromptId: prompt.id
  });
}

async function forkPromptSelectionState(contentInput) {
  const content = normalizePromptContent(contentInput);
  if (!content) {
    throw new Error("Prompt text is required.");
  }

  const current = await loadPromptSelectionRecord();
  const selected = current.prompts.find(
    (entry) => entry.id === current.selectedPromptId
  );

  if (selected && selected.content === content) {
    return current;
  }

  const prompt = {
    id: createPromptId(),
    content,
    updatedAt: new Date().toISOString(),
    label: `GPT Prompt ${current.prompts.length + 1}`
  };

  return persistPromptSelectionState({
    prompts: [...current.prompts, prompt],
    selectedPromptId: prompt.id
  });
}

async function selectPromptSelectionState(promptId) {
  const current = await loadPromptSelectionRecord();
  const nextId = String(promptId || "").trim();
  if (!current.prompts.some((entry) => entry.id === nextId)) {
    throw new Error("That GPT prompt could not be found.");
  }

  return persistPromptSelectionState({
    prompts: current.prompts,
    selectedPromptId: nextId
  });
}

async function removePromptSelectionState(promptId) {
  const current = await loadPromptSelectionRecord();
  const removeId = String(promptId || "").trim();
  const prompts = current.prompts.filter((entry) => entry.id !== removeId);
  const selectedPromptId =
    current.selectedPromptId === removeId
      ? prompts[0]?.id || ""
      : current.selectedPromptId;

  return persistPromptSelectionState({
    prompts,
    selectedPromptId
  });
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
  const aiProviderId = normalizeAiProviderId(config.aiProviderId);

  if (!spreadsheetId) {
    throw new Error("Google Sheet ID is not configured.");
  }

  if (!sheetName) {
    throw new Error("Sheet tab name is not configured.");
  }

  return { spreadsheetId, sheetName, aiProviderId };
}

const APP_DATA_BACKUP_KIND = "application-helper-backup";
const APP_DATA_BACKUP_VERSION = 1;

async function readSheetConfigForBackup() {
  try {
    return await getSheetConfig();
  } catch (_error) {
    const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
    const config = stored[SHEET_CONFIG_STORAGE_KEY] || {};
    return {
      spreadsheetId:
        parseSpreadsheetId(config.spreadsheetId || DEFAULT_SPREADSHEET_ID) ||
        DEFAULT_SPREADSHEET_ID,
      sheetName:
        String(config.sheetName || DEFAULT_SHEET_NAME).trim() || DEFAULT_SHEET_NAME,
      aiProviderId: normalizeAiProviderId(config.aiProviderId)
    };
  }
}

function stripPromptResumesFromProfileSelection(selection) {
  const state = normalizeProfileSelectionState({
    ...selection,
    profiles: (Array.isArray(selection?.profiles) ? selection.profiles : []).map(
      (profile) => ({
        ...profile,
        promptResumes: [],
        selectedPromptResumeId: ""
      })
    )
  });

  return state;
}

function mergeProfilesPreservingPromptResumes(incomingSelection, currentSelection) {
  const currentById = new Map(
    (Array.isArray(currentSelection?.profiles) ? currentSelection.profiles : []).map(
      (profile) => [profile.id, profile]
    )
  );

  const profiles = (
    Array.isArray(incomingSelection?.profiles) ? incomingSelection.profiles : []
  ).map((profile) => {
    const existing = currentById.get(String(profile?.id || ""));
    if (existing) {
      return {
        ...profile,
        promptResumes: existing.promptResumes,
        selectedPromptResumeId: existing.selectedPromptResumeId
      };
    }

    return {
      ...profile,
      promptResumes: [],
      selectedPromptResumeId: ""
    };
  });

  return normalizeProfileSelectionState({
    ...incomingSelection,
    profiles
  });
}

function buildPromptSelectionState(selection) {
  return normalizePromptSelectionState(selection);
}

function buildTextSelectionState(selection) {
  const content = normalizePromptContent(selection?.content);
  return {
    content,
    updatedAt: content
      ? normalizeUpdatedAt(selection?.updatedAt) || new Date().toISOString()
      : ""
  };
}

async function exportAppData({ includePromptResumes = true } = {}) {
  const [
    sheetConfig,
    promptSelection,
    jobDescriptionSelection,
    profileSelection
  ] = await Promise.all([
    readSheetConfigForBackup(),
    getPromptSelectionState(),
    getJobDescriptionSelectionState(),
    getProfileSelectionState()
  ]);

  const includeResumes = Boolean(includePromptResumes);
  const exportedProfiles = includeResumes
    ? profileSelection
    : stripPromptResumesFromProfileSelection(profileSelection);

  return {
    kind: APP_DATA_BACKUP_KIND,
    version: APP_DATA_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    includesPromptResumes: includeResumes,
    sheetConfig,
    promptSelection,
    jobDescriptionSelection,
    profileSelection: exportedProfiles
  };
}

async function importAppData(payload, { includePromptResumes = true } = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Backup file is empty or invalid.");
  }

  if (payload.kind !== APP_DATA_BACKUP_KIND) {
    throw new Error("This file is not an Application Helper backup.");
  }

  const includeResumes = Boolean(includePromptResumes);
  const storagePayload = {};

  if (payload.sheetConfig) {
    const spreadsheetId = parseSpreadsheetId(payload.sheetConfig.spreadsheetId);
    const sheetName = String(payload.sheetConfig.sheetName ?? "").trim();

    if (!spreadsheetId || !sheetName) {
      throw new Error("Backup sheet configuration is invalid.");
    }

    const stored = await chrome.storage.local.get(SHEET_CONFIG_STORAGE_KEY);
    const existing = stored[SHEET_CONFIG_STORAGE_KEY] || {};

    storagePayload[SHEET_CONFIG_STORAGE_KEY] = {
      spreadsheetId,
      sheetName,
      aiProviderId: normalizeAiProviderId(
        payload.sheetConfig.aiProviderId || existing.aiProviderId
      ),
      resumeTemplateId: existing.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID
    };
  }

  if (payload.promptSelection) {
    const normalizedPromptSelection = buildPromptSelectionState(
      payload.promptSelection
    );
    storagePayload[PROMPT_SELECTION_STORAGE_KEY] = {
      prompts: normalizedPromptSelection.prompts,
      selectedPromptId: normalizedPromptSelection.selectedPromptId
    };
  }

  if (payload.jobDescriptionSelection) {
    storagePayload[JOB_DESCRIPTION_SELECTION_STORAGE_KEY] =
      buildTextSelectionState(payload.jobDescriptionSelection);
  }

  if (payload.profileSelection) {
    const currentProfileSelection = await getProfileSelectionState();
    let nextProfileSelection = normalizeProfileSelectionState(payload.profileSelection);

    if (!includeResumes || payload.includesPromptResumes === false) {
      nextProfileSelection = mergeProfilesPreservingPromptResumes(
        nextProfileSelection,
        currentProfileSelection
      );
    }

    storagePayload[PROFILE_SELECTION_STORAGE_KEY] = nextProfileSelection;
  }

  if (Object.keys(storagePayload).length === 0) {
    throw new Error("Backup file does not contain any app data.");
  }

  await chrome.storage.local.set(storagePayload);

  // Drop legacy prompt-resume keys so profile-owned resumes stay authoritative.
  await chrome.storage.local.remove([
    PROMPT_RESUME_SELECTION_STORAGE_KEY,
    LEGACY_PROMPT_RESUME_SELECTION_STORAGE_KEY
  ]);

  return {
    sheetConfig: storagePayload[SHEET_CONFIG_STORAGE_KEY] || null,
    promptSelection: storagePayload[PROMPT_SELECTION_STORAGE_KEY] || null,
    jobDescriptionSelection:
      storagePayload[JOB_DESCRIPTION_SELECTION_STORAGE_KEY] || null,
    profileSelection: storagePayload[PROFILE_SELECTION_STORAGE_KEY] || null,
    includesPromptResumes:
      includeResumes && payload.includesPromptResumes !== false
  };
}

async function saveSheetConfig(
  spreadsheetIdInput,
  sheetNameInput,
  aiProviderInput
) {
  const spreadsheetId = parseSpreadsheetId(spreadsheetIdInput);
  const sheetName = String(sheetNameInput ?? "").trim();
  const aiProviderId = normalizeAiProviderId(aiProviderInput);

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
      aiProviderId,
      resumeTemplateId: existing.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID
    }
  });

  return { spreadsheetId, sheetName, aiProviderId };
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

const AI_CHAT_NEW_TAB_SETTLE_MS = { min: 3000, max: 5000 };

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

function waitForTabComplete(
  tabId,
  timeoutMs = 30000,
  signal,
  tabLabel = "AI provider"
) {
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
          finish(reject, new Error(`${tabLabel} tab took too long to load.`));
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

async function ensureAiProviderContentScript(tabId, runId, aiProviderInput) {
  const aiProvider = getAiProviderConfig(aiProviderInput);
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [aiProvider.contentScript]
    });
    sendLog(runId, "info", `Injected ${aiProvider.label} content script.`);
    return true;
  } catch (error) {
    sendLog(
      runId,
      "error",
      `Could not inject ${aiProvider.label} content script: ${error.message || error}`
    );
    return false;
  }
}

async function waitForAiProviderConnection(tabId, runId, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || 24);
  const { signal } = options;
  const aiProvider = getAiProviderConfig(options.aiProviderId);
  let lastError = new Error(`Could not reach the ${aiProvider.label} page.`);
  let didInject = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    throwIfSaveProcessCancelled(signal);
    try {
      const response = await waitForSaveProcessOperation(
        () => chrome.tabs.sendMessage(tabId, { type: "PING_AI_PROVIDER" }),
        signal
      );
      if (response?.ok) {
        return;
      }
      lastError = new Error(
        response?.error || `${aiProvider.label} page is not ready.`
      );
    } catch (error) {
      lastError = error;
      if (!didInject && isReceivingEndMissingError(error)) {
        didInject = true;
        sendLog(
          runId,
          "info",
          `${aiProvider.label} page not connected. Injecting content script...`
        );
        await waitForSaveProcessOperation(
          () => ensureAiProviderContentScript(tabId, runId, aiProvider.id),
          signal
        );
        continue;
      }
    }

    if (attempt < maxAttempts) {
      await sleep(500, signal);
    }
  }

  throw lastError;
}

async function ensureRequiredModeInTab(tabId, runId, options = {}) {
  const { signal } = options;
  const aiProvider = getAiProviderConfig(options.aiProviderId);
  throwIfSaveProcessCancelled(signal);
  const response = await waitForSaveProcessOperation(
    () =>
      chrome.tabs.sendMessage(tabId, {
        type: "ENSURE_REQUIRED_MODE"
      }),
    signal
  );
  if (!response?.ok) {
    throw new Error(
      response?.error ||
        `Could not select ${aiProvider.requiredMode} mode in ${aiProvider.label}.`
    );
  }
  sendLog(
    runId,
    "info",
    `${aiProvider.label} ${aiProvider.requiredMode} mode is ready.`
  );
}

async function sendFillAndSendToTab(tabId, text, runId, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || 24);
  const { signal } = options;
  const aiProvider = getAiProviderConfig(options.aiProviderId);
  throwIfSaveProcessCancelled(signal);
  let lastError = new Error(`Could not reach the ${aiProvider.label} page.`);
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

      lastError = new Error(
        response?.error || `Could not fill the ${aiProvider.label} prompt.`
      );
    } catch (error) {
      lastError = error;

      if (!didInject && isReceivingEndMissingError(error)) {
        didInject = true;
        sendLog(
          runId,
          "info",
          `${aiProvider.label} page not connected. Injecting content script...`
        );
        await waitForSaveProcessOperation(
          () => ensureAiProviderContentScript(tabId, runId, aiProvider.id),
          signal
        );
        continue;
      }
    }

    if (attempt < maxAttempts) {
      sendLog(
        runId,
        "info",
        `Waiting for ${aiProvider.label} page (${attempt}/${maxAttempts})...`
      );
      await sleep(500, signal);
    }
  }

  throw lastError;
}

function isTabInGroup(tab) {
  return typeof tab?.groupId === "number" && tab.groupId !== -1;
}

function assertActiveJobTabUsable(tab, { allowGrouped = false } = {}) {
  if (!tab) {
    throw new Error("No active tab found.");
  }

  if (!tab.url) {
    throw new Error("Current tab does not have a URL.");
  }

  if (tab.pinned && !isPinnedTabSupportedUrl(tab.url)) {
    throw new Error(
      "Pinned tabs are supported only for Google Sheets and Jobright. Unpin this tab and try again."
    );
  }

  if (!allowGrouped && isTabInGroup(tab)) {
    throw new Error(
      "Grouped tabs are not supported. Ungroup the tab or open it outside a tab group and try again."
    );
  }
}

function shouldEnableSidePanelForTab(tab) {
  // The extension UI remains available while the user moves between any tabs.
  // Individual actions still validate whether the active page can support them.
  return Number.isInteger(tab?.id);
}

async function syncSidePanelForTab(tab) {
  if (!Number.isInteger(tab?.id)) {
    return;
  }

  const enabled = shouldEnableSidePanelForTab(tab);
  const wasDisabled = sidePanelDisabledTabIds.has(tab.id);
  // Desired state already matches what we last applied when enabled XOR
  // wasDisabled — i.e. enabled tabs are not in the disabled set.
  const alreadySynced = enabled !== wasDisabled;

  // Calling setOptions for a tab binds a tab-scoped side panel, and Chrome then
  // remounts the panel document whenever that tab is activated. That would wipe
  // in-memory UI, so only touch tabs whose enabled state actually needs to
  // change; everything else stays on the window-level panel. Per-tab process /
  // workspace details still survive panel close via chrome.storage.session.
  if (!alreadySynced) {
    try {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: "sidepanel/sidepanel.html",
        enabled
      });

      if (enabled) {
        sidePanelDisabledTabIds.delete(tab.id);
      } else {
        sidePanelDisabledTabIds.add(tab.id);
      }
    } catch (error) {
      console.error("Could not sync side panel availability for tab:", error);
    }
  }

}

async function syncSidePanelForAllTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map(async (tab) => {
      if (!Number.isInteger(tab?.id)) {
        return;
      }

      // Chrome keeps per-tab options across service worker restarts, so learn
      // the existing state before deciding whether anything needs changing.
      try {
        const options = await chrome.sidePanel.getOptions({ tabId: tab.id });
        if (options?.enabled === false) {
          sidePanelDisabledTabIds.add(tab.id);
        }
      } catch (_error) {
        // No per-tab override recorded for this tab.
      }

      await syncSidePanelForTab(tab);
    })
  );
}

async function configureSidePanelBehavior() {
  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
  await syncSidePanelForAllTabs();
}

function normalizeAiProviderId(value) {
  const providerId = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(AI_PROVIDERS, providerId)
    ? providerId
    : DEFAULT_AI_PROVIDER_ID;
}

function getAiProviderConfig(value) {
  return AI_PROVIDERS[normalizeAiProviderId(value)];
}

function getAiProviderUrlLabel(value) {
  const provider = getAiProviderConfig(value);
  return provider.urlLabel || provider.label;
}

function isAiConversationUrl(url = "", providerId = DEFAULT_AI_PROVIDER_ID) {
  try {
    const provider = getAiProviderConfig(providerId);
    if (provider.contextDocOnly) {
      return isGoogleDocsDocumentUrl(url);
    }

    const parsed = new URL(String(url || "").trim());
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (provider.id === "chatgpt") {
      const isChatGptHost =
        hostname === "chatgpt.com" ||
        hostname.endsWith(".chatgpt.com") ||
        hostname === "chat.openai.com" ||
        hostname.endsWith(".chat.openai.com");
      return (
        isChatGptHost &&
        /^\/c\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/?$/i.test(pathname)
      );
    }

    if (provider.id === "deepseek") {
      return (
        hostname === "chat.deepseek.com" &&
        /^\/a\/chat\/s\/[a-z0-9_-]{8,}\/?$/i.test(pathname)
      );
    }

    return false;
  } catch (_error) {
    return false;
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

async function validateApplicationInputsForSave() {
  const [promptState, jobDescriptionState, profileState, sheetConfig] = await Promise.all([
    getPromptSelectionState(),
    getJobDescriptionSelectionState(),
    getProfileSelectionState(),
    getSheetConfig()
  ]);

  const missing = [];
  const selectedProfiles = getSelectedProfilesFromState(profileState);

  if (!promptState.content?.trim()) {
    missing.push("AI prompt");
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

  if (missing.length === 0) {
    return {
      ok: true,
      profileState,
      selectedProfiles,
      promptContent: promptState.content.trim(),
      jobDescriptionContent: jobDescriptionState.content.trim(),
      aiProviderId: sheetConfig.aiProviderId
    };
  }

  return {
    ok: false,
    missing,
    error: formatSaveValidationError(missing)
  };
}

async function buildChatGptMessageFromStorage(profile = null, snapshot = null) {
  const [promptState, jobDescriptionState] = snapshot
    ? [
        { content: String(snapshot.promptContent || "") },
        { content: String(snapshot.jobDescriptionContent || "") }
      ]
    : await Promise.all([
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

async function openNewAiChatTab(runId, {
  active = true,
  signal,
  aiProviderId = DEFAULT_AI_PROVIDER_ID
} = {}) {
  const aiProvider = getAiProviderConfig(aiProviderId);
  sendLog(runId, "info", `Opening ${aiProvider.label} in a new tab...`);
  const tab = await waitForSaveProcessOperation(
    () => chrome.tabs.create({ url: aiProvider.homeUrl, active }),
    signal
  );
  if (aiProvider.waitForFullPageLoad !== false) {
    await waitForTabComplete(tab.id, 30000, signal, aiProvider.label);
  }

  return {
    url: aiProvider.homeUrl,
    tabId: typeof tab.id === "number" ? tab.id : null,
    aiProviderId: aiProvider.id
  };
}

async function openAiChatInExistingTab(tabId, runId, options = {}) {
  if (typeof tabId !== "number") {
    throw new Error("Current job tab does not have a valid tab ID.");
  }

  const aiProvider = getAiProviderConfig(options.aiProviderId);
  sendLog(runId, "info", `Opening ${aiProvider.label} in the current job tab...`);
  await waitForSaveProcessOperation(
    () => chrome.tabs.update(tabId, {
      url: aiProvider.homeUrl,
      active: true
    }),
    options.signal
  );
  if (aiProvider.waitForFullPageLoad !== false) {
    await waitForTabComplete(tabId, 30000, options.signal, aiProvider.label);
  }

  return {
    url: aiProvider.homeUrl,
    tabId,
    aiProviderId: aiProvider.id
  };
}

async function resolveAiConversationUrlAfterSend(tabId, runId, options = {}) {
  const { signal } = options;
  const aiProvider = getAiProviderConfig(options.aiProviderId);
  const startedAt = Date.now();
  const timeoutMs = 60000;

  while (Date.now() - startedAt < timeoutMs) {
    throwIfSaveProcessCancelled(signal);
    const tab = await waitForSaveProcessOperation(
      () => chrome.tabs.get(tabId),
      signal
    );
    const url = tab.url || "";

    if (isAiConversationUrl(url, aiProvider.id)) {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
    }

    await sleep(500, signal);
  }

  sendLog(
    runId,
    "error",
    `Permanent ${aiProvider.label} conversation URL was not available after 60 seconds.`
  );
  throw new Error(
    `Could not get the permanent ${aiProvider.label} conversation URL. ` +
      "The temporary URL was not saved."
  );
}

async function sendToAiAndGetUrl(text, runId, options = {}) {
  const promptText = String(text ?? "").trim();
  const aiProvider = getAiProviderConfig(options.aiProviderId);
  if (!promptText) {
    throw new Error(`Nothing to send to ${aiProvider.label}.`);
  }

  const targetTab =
    typeof options.tabId === "number"
      ? await openAiChatInExistingTab(options.tabId, runId, {
          signal: options.signal,
          aiProviderId: aiProvider.id
        })
      : await openNewAiChatTab(runId, {
          active: true,
          signal: options.signal,
          aiProviderId: aiProvider.id
        });
  const { tabId } = targetTab;
  if (typeof tabId !== "number") {
    throw new Error(`Could not open ${aiProvider.label}.`);
  }

  const settleRange =
    aiProvider.promptSettleDelayMs || AI_CHAT_NEW_TAB_SETTLE_MS;
  const settleMs = randomDelayMs(settleRange.min, settleRange.max);

  if (settleMs > 0) {
    sendLog(
      runId,
      "info",
      `Waiting ${(settleMs / 1000).toFixed(1)}s before filling prompt...`
    );
    await sleep(settleMs, options.signal);
  } else {
    sendLog(
      runId,
      "info",
      aiProvider.requiredMode
        ? `Connecting to ${aiProvider.label}...`
        : `Waiting for ${aiProvider.label} composer and send button...`
    );
  }

  if (aiProvider.requiredMode) {
    await waitForAiProviderConnection(tabId, runId, {
      signal: options.signal,
      aiProviderId: aiProvider.id,
      maxAttempts: aiProvider.maxConnectionAttempts
    });
    sendLog(
      runId,
      "info",
      `Checking ${aiProvider.label} ${aiProvider.requiredMode} mode...`
    );
    await ensureRequiredModeInTab(tabId, runId, {
      signal: options.signal,
      aiProviderId: aiProvider.id
    });
  }

  sendLog(runId, "info", `Sending prompt to ${aiProvider.label}...`);
  await sendFillAndSendToTab(tabId, promptText, runId, {
    signal: options.signal,
    aiProviderId: aiProvider.id,
    maxAttempts: aiProvider.requiredMode ? 1 : aiProvider.maxFillAttempts
  });

  const aiConversationUrl = await resolveAiConversationUrlAfterSend(
    tabId,
    runId,
    { signal: options.signal, aiProviderId: aiProvider.id }
  );
  sendLog(
    runId,
    "success",
    `Prompt sent to ${aiProvider.label}: ${aiConversationUrl}`
  );

  return {
    url: aiConversationUrl,
    tabId,
    aiProviderId: aiProvider.id
  };
}

async function createEmptyGoogleDoc(token, title, options = {}) {
  return fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  });
}

async function saveContextToGoogleDoc(text, runId, options = {}) {
  const contextText = String(text ?? "").trim();
  if (!contextText) {
    throw new Error("Nothing to save to Google Docs.");
  }

  const title = String(options.title || "").trim() || "Application context";
  let token =
    options.token ||
    (await waitForSaveProcessOperation(
      () => getGoogleAccessToken(),
      options.signal
    ));

  sendLog(runId, "info", `Creating context Google Doc "${title}"...`);
  let response = await waitForSaveProcessOperation(
    () => createEmptyGoogleDoc(token, title, { signal: options.signal }),
    options.signal
  );

  if (response.status === 401 || response.status === 403) {
    sendLog(
      runId,
      "info",
      "Context doc auth error. Refreshing token and retrying..."
    );
    await clearCachedGoogleAccessToken(token);
    token = await waitForSaveProcessOperation(
      () => getGoogleAccessToken({ interactive: true }),
      options.signal
    );
    response = await waitForSaveProcessOperation(
      () => createEmptyGoogleDoc(token, title, { signal: options.signal }),
      options.signal
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      formatGoogleApiError(
        errorText,
        "Could not create the context Google Doc. Make sure your Google account granted Google Docs access."
      )
    );
  }

  const file = await response.json();
  const documentId = file.documentId;
  if (!documentId) {
    throw new Error(
      "Google Docs API did not return a document ID for the context doc."
    );
  }

  throwIfSaveProcessCancelled(options.signal);
  await batchUpdateGoogleDocWithAuthRetry(
    token,
    documentId,
    [
      {
        insertText: {
          location: { index: 1 },
          text: contextText
        }
      }
    ],
    runId,
    "Could not write the context into the new Google Doc."
  );

  const url = `https://docs.google.com/document/d/${documentId}/edit`;
  sendLog(runId, "success", `Context saved to Google Docs: ${url}`);

  return { url, documentId };
}

async function saveContextToGoogleDocAndOpen(text, runId, options = {}) {
  const { url } = await saveContextToGoogleDoc(text, runId, options);
  let tabId = Number.isInteger(options.tabId) ? options.tabId : null;

  if (tabId === null) {
    sendLog(runId, "info", "Opening the context Google Doc in a new tab...");
    const tab = await waitForSaveProcessOperation(
      () => chrome.tabs.create({ url, active: true }),
      options.signal
    );
    tabId = typeof tab.id === "number" ? tab.id : null;
  } else {
    sendLog(
      runId,
      "info",
      "Opening the context Google Doc in the current job tab..."
    );
    await waitForSaveProcessOperation(
      () => chrome.tabs.update(tabId, { url, active: true }),
      options.signal
    );
  }

  if (Number.isInteger(tabId)) {
    try {
      await waitForTabComplete(tabId, 30000, options.signal, "Google Docs");
    } catch (error) {
      if (isSaveProcessCancelledError(error)) {
        throw error;
      }
      sendLog(
        runId,
        "info",
        `Context Google Doc tab is still loading: ${error.message || error}`
      );
    }
  }

  return {
    url,
    tabId,
    aiProviderId: "none"
  };
}

async function downloadGoogleDocUrlAsPdf(
  runId,
  { documentUrl = "", documentTitle = "", profileName = "" } = {}
) {
  const normalizedDocumentUrl = String(documentUrl || "").trim();
  if (!isGoogleDocsDocumentUrl(normalizedDocumentUrl)) {
    throw new Error("The resume URL is not a Google Docs document.");
  }

  const documentId = parseGoogleDocId(normalizedDocumentUrl);
  if (!documentId || documentId === normalizedDocumentUrl) {
    throw new Error("Could not find a Google Docs document ID in the resume URL.");
  }

  const resolvedTitle =
    String(documentTitle || "").trim() || buildResumeDownloadTitle(profileName);
  const filename = `${sanitizeDownloadFilename(resolvedTitle)}.pdf`;
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

async function downloadResumeAsPdf(runId, options = {}) {
  sendLog(runId, "info", "Starting resume PDF download...");
  if (String(options.documentUrl || "").trim()) {
    return downloadGoogleDocUrlAsPdf(runId, {
      documentUrl: options.documentUrl,
      documentTitle: options.documentTitle,
      profileName: options.profileName
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

function getUrlComparisonKey(value) {
  try {
    const parsedUrl = new URL(String(value || "").trim());
    parsedUrl.hash = "";
    return parsedUrl.href.replace(/\/$/, "");
  } catch {
    return String(value || "").trim().replace(/\/$/, "");
  }
}

async function findExistingRightWindowForUrl(url, sourceWindowId) {
  const targetKey = getUrlComparisonKey(url);
  if (!targetKey) {
    return null;
  }

  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["normal"]
  });

  for (const win of windows) {
    if (!Number.isInteger(win?.id) || win.id === sourceWindowId) {
      continue;
    }

    for (const tab of win.tabs || []) {
      if (!Number.isInteger(tab?.id)) {
        continue;
      }
      if (getUrlComparisonKey(tab.url || tab.pendingUrl || "") !== targetKey) {
        continue;
      }

      return {
        windowId: win.id,
        tabId: tab.id
      };
    }
  }

  return null;
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

  const existingWindow = await findExistingRightWindowForUrl(
    url,
    sourceWindow?.id
  );
  if (existingWindow) {
    sendLog(runId, "info", "Reopening the existing right-side window...");
    await chrome.windows.update(existingWindow.windowId, { focused: true });
    if (Number.isInteger(existingWindow.tabId)) {
      await chrome.tabs.update(existingWindow.tabId, { active: true });
    }
    sendLog(runId, "success", "Existing right-side window focused.");
    return {
      url,
      windowId: existingWindow.windowId,
      tabId: existingWindow.tabId,
      reused: true
    };
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
    tabId: Number.isInteger(openedTab?.id) ? openedTab.id : null,
    reused: false
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
  runId = "",
  ownerTabId = null
} = {}) {
  const states = await getSavePostProcessStates();
  const requestedRunId = String(runId || "");
  const entry = findSavePostProcessEntry(states, requestedRunId, ownerTabId);
  const state = entry?.state || null;
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

  // Only drop this tab's entry; other tabs may still have a run in flight.
  if (entry) {
    delete states[entry.tabId];
    if (Object.keys(states).length === 0) {
      await chrome.alarms.clear(SAVE_POST_PROCESS_ALARM_NAME);
      await chrome.storage.local.remove(SAVE_POST_PROCESS_STORAGE_KEY);
    } else {
      await chrome.storage.local.set({
        [SAVE_POST_PROCESS_STORAGE_KEY]: states
      });
    }
  }

  if (!state) {
    if (controllerRunId) {
      activeSaveProcessControllers.delete(controllerRunId);
      releaseRunOwnerTab(controllerRunId);
    }
    return {
      active: false,
      completed: false,
      cancelled: reason === "cancelled"
    };
  }

  if (resetInputs) {
    await resetApplicationInputsAfterSave(controllerRunId);
  }

  if (controllerRunId) {
    activeSaveProcessControllers.delete(controllerRunId);
  }

  if (runId) {
    const message =
      reason === "cancelled"
        ? "Save process cancelled. Application inputs cleared."
        : "Google Sheet saving finished. Save process completed and application inputs cleared.";
    sendLog(runId, "info", message);
  }

  return {
    active: false,
    completed: reason === "completed",
    cancelled: reason === "cancelled"
  };
}

// Cleanups are serialised per owning tab so a run finishing in one tab cannot
// tear down a run that is still going in another.
async function clearSavePostProcess(options = {}) {
  const cleanupKey = Number.isInteger(options.ownerTabId)
    ? options.ownerTabId
    : String(options.runId || "");

  let cleanupPromise = savePostProcessCleanupPromisesByTabId.get(cleanupKey);
  if (!cleanupPromise) {
    cleanupPromise = performSavePostProcessCleanup(options);
    savePostProcessCleanupPromisesByTabId.set(cleanupKey, cleanupPromise);
  }

  try {
    return await cleanupPromise;
  } finally {
    if (savePostProcessCleanupPromisesByTabId.get(cleanupKey) === cleanupPromise) {
      savePostProcessCleanupPromisesByTabId.delete(cleanupKey);
    }
  }
}

async function scheduleSavePostProcess(
  { mode = "save", profileCount = 1, ownerTabId = null } = {},
  runId
) {
  const normalizedRunId = String(runId || "");
  const resolvedOwnerTabId = Number.isInteger(ownerTabId)
    ? ownerTabId
    : getRunOwnerTabId(normalizedRunId);

  // Replace only the run this tab already had in flight.
  await clearSavePostProcess({
    resetInputs: false,
    reason: "replaced",
    ownerTabId: resolvedOwnerTabId
  });
  await chrome.alarms.clear("save-current-tab-check-reminder");
  await chrome.storage.local.remove([
    "saveCheckReminder",
    "extensionUiLockedUntilNotification"
  ]);

  const controller = new AbortController();
  activeSaveProcessControllers.set(normalizedRunId, controller);

  const state = {
    runId: normalizedRunId,
    ownerTabId: resolvedOwnerTabId,
    mode: "save",
    profileCount: Math.max(1, Number(profileCount) || 1),
    completedCount: 0,
    involvedTabIds: Number.isInteger(resolvedOwnerTabId)
      ? [resolvedOwnerTabId]
      : [],
    startedAt: Date.now()
  };

  try {
    const states = await getSavePostProcessStates();
    if (Number.isInteger(resolvedOwnerTabId)) {
      states[resolvedOwnerTabId] = state;
    }
    await chrome.storage.local.set({
      [SAVE_POST_PROCESS_STORAGE_KEY]: states
    });
  } catch (error) {
    activeSaveProcessControllers.delete(normalizedRunId);
    throw error;
  }

  sendLog(runId, "info", "Save progress started.");

  return state;
}

async function updateSavePostProcessProgress({
  runId = "",
  ownerTabId = null,
  completedCount = null,
  profileCount = null,
  involvedTabIds = null
} = {}) {
  const states = await getSavePostProcessStates();
  const entry = findSavePostProcessEntry(states, runId, ownerTabId);
  if (!entry?.state) {
    return null;
  }

  const nextInvolved = Array.isArray(involvedTabIds)
    ? [
        ...new Set(
          involvedTabIds.filter((tabId) => Number.isInteger(tabId))
        )
      ]
    : Array.isArray(entry.state.involvedTabIds)
      ? entry.state.involvedTabIds
      : [];

  const nextState = {
    ...entry.state,
    completedCount:
      completedCount == null
        ? Math.max(0, Number(entry.state.completedCount) || 0)
        : Math.max(0, Number(completedCount) || 0),
    profileCount:
      profileCount == null
        ? Math.max(1, Number(entry.state.profileCount) || 1)
        : Math.max(1, Number(profileCount) || 1),
    involvedTabIds: nextInvolved
  };

  states[entry.tabId] = nextState;
  await chrome.storage.local.set({
    [SAVE_POST_PROCESS_STORAGE_KEY]: states
  });
  return nextState;
}

function getActiveSaveProcessSignal(runId) {
  return activeSaveProcessControllers.get(String(runId || ""))?.signal;
}

async function completeSavePostProcess(runId = "", ownerTabId = null) {
  return clearSavePostProcess({
    resetInputs: true,
    reason: "completed",
    runId,
    ownerTabId: Number.isInteger(ownerTabId)
      ? ownerTabId
      : getRunOwnerTabId(runId)
  });
}

async function cancelSavePostProcess(runId = "", ownerTabId = null) {
  return clearSavePostProcess({
    resetInputs: true,
    reason: "cancelled",
    runId,
    ownerTabId: Number.isInteger(ownerTabId)
      ? ownerTabId
      : getRunOwnerTabId(runId)
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await configureSidePanelBehavior();

  await chrome.alarms.clear("group-job-gpt-tabs-after-save");
  await chrome.alarms.clear("save-current-tab-check-reminder");
  await chrome.alarms.clear(SAVE_POST_PROCESS_ALARM_NAME);
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
      aiProviderId: normalizeAiProviderId(config.aiProviderId),
      resumeTemplateId:
        config.resumeTemplateId || DEFAULT_RESUME_TEMPLATE_ID
    }
  });

});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanelBehavior().catch((error) => {
    console.error("Could not configure side panel on startup:", error);
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  syncSidePanelForTab(tab);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await syncSidePanelForTab(tab);
  } catch (error) {
    console.error("Could not sync side panel after tab activation:", error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    Object.prototype.hasOwnProperty.call(changeInfo, "pinned") ||
    changeInfo.url ||
    changeInfo.status === "complete"
  ) {
    syncSidePanelForTab(tab);
  }
});

configureSidePanelBehavior().catch((error) => {
  console.error("Could not configure side panel:", error);
});

const APP_ACTION_COMMANDS = {
  "save-app": "save-app",
  "make-resume": "make-resume",
  "open-jobright": "open-jobright",
  "download-resume": "download-resume"
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

async function getSidePanelStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SIDE_PANEL_PING"
    });
    return {
      open: response?.open === true,
      saveActionPending: response?.saveActionPending === true
    };
  } catch (error) {
    if (isReceivingEndMissingError(error)) {
      return { open: false, saveActionPending: false };
    }

    throw error;
  }
}

async function closePersistedPickupWindowsForTab(tabId) {
  if (!Number.isInteger(tabId)) {
    return;
  }

  const stored = await chrome.storage.session.get(TAB_SESSION_STORAGE_KEY);
  const session = stored[TAB_SESSION_STORAGE_KEY];
  if (!session || typeof session !== "object") {
    return;
  }

  const tabState = session.tabStates?.[String(tabId)];
  const windowIds = Array.isArray(tabState?.pickupWindowIds)
    ? [...new Set(tabState.pickupWindowIds.map(Number).filter(Number.isInteger))]
    : [];

  if (windowIds.length === 0) {
    return;
  }

  await Promise.all(
    windowIds.map(async (windowId) => {
      try {
        await chrome.windows.remove(windowId);
      } catch {
        // Window may already be closed by the side panel or the user.
      }
    })
  );
}

async function forgetPersistedTabSession(tabId) {
  if (!Number.isInteger(tabId)) {
    return;
  }

  const stored = await chrome.storage.session.get(TAB_SESSION_STORAGE_KEY);
  const session = stored[TAB_SESSION_STORAGE_KEY];
  if (!session || typeof session !== "object") {
    return;
  }

  const tabKey = String(tabId);
  let changed = false;

  if (session.workspaces && Object.prototype.hasOwnProperty.call(session.workspaces, tabKey)) {
    delete session.workspaces[tabKey];
    changed = true;
  }

  if (session.tabStates && Object.prototype.hasOwnProperty.call(session.tabStates, tabKey)) {
    delete session.tabStates[tabKey];
    changed = true;
  }

  if (!changed) {
    return;
  }

  const hasWorkspaces =
    session.workspaces && Object.keys(session.workspaces).length > 0;
  const hasTabStates =
    session.tabStates && Object.keys(session.tabStates).length > 0;

  if (!hasWorkspaces && !hasTabStates) {
    await chrome.storage.session.remove(TAB_SESSION_STORAGE_KEY);
    return;
  }

  await chrome.storage.session.set({
    [TAB_SESSION_STORAGE_KEY]: session
  });
}

// A closed tab can no longer show status, so drop its run, progress, and
// persisted workspace/process details.
chrome.tabs.onRemoved.addListener((tabId) => {
  sidePanelDisabledTabIds.delete(tabId);

  const ownedRunIds = [...runOwnerTabIds.entries()]
    .filter(([, ownerTabId]) => ownerTabId === tabId)
    .map(([runId]) => runId);

  ownedRunIds.forEach((runId) => {
    activeSaveProcessControllers.get(runId)?.abort();
    activeSaveProcessControllers.delete(runId);
    releaseRunOwnerTab(runId);
  });

  closePersistedPickupWindowsForTab(tabId)
    .catch((error) => {
      console.error("Could not close pickup windows for the closed tab:", error);
    })
    .finally(() => {
      forgetPersistedTabSession(tabId).catch((error) => {
        console.error("Could not clear persisted tab session for the closed tab:", error);
      });
    });

  getSavePostProcessStates()
    .then(async (states) => {
      if (!states[tabId]) {
        return;
      }

      delete states[tabId];
      if (Object.keys(states).length === 0) {
        await chrome.storage.local.remove(SAVE_POST_PROCESS_STORAGE_KEY);
        return;
      }

      await chrome.storage.local.set({
        [SAVE_POST_PROCESS_STORAGE_KEY]: states
      });
    })
    .catch((error) => {
      console.error("Could not clear save progress for the closed tab:", error);
    });
});

chrome.commands.onCommand.addListener((command) => {
  const action = APP_ACTION_COMMANDS[command];
  if (!action) {
    return;
  }

  const runId = `shortcut-${Date.now()}`;
  (async () => {
    const sidePanelStatus = await getSidePanelStatus();
    if (!sidePanelStatus.open) {
      console.info(`Ignoring "${command}" because the side panel is closed.`);
      return;
    }

    if (action === "save-app" && sidePanelStatus.saveActionPending) {
      console.info("Ignoring Save App hotkey because a save action is already pending.");
      return;
    }

    if (action !== "save-app") {
      await notifyExtensionPages({
        type: "HOTKEY_ACTION",
        action
      });
      return;
    }
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    // The tab the shortcut fired on owns the run's status.
    registerRunOwnerTab(runId, tab?.id);
    const ownerTabId = getRunOwnerTabId(runId);

    const validation = await validateApplicationInputsForSave();
    if (!validation.ok) {
      sendLog(runId, "error", validation.error);
      await notifyExtensionPages({
        type: "HOTKEY_SAVE_REJECTED",
        runId,
        ownerTabId,
        ok: false,
        error: validation.error
      });
      return;
    }

    try {
      assertActiveJobTabUsable(tab, {
        allowGrouped: true
      });
    } catch (error) {
      sendLog(runId, "error", error.message);
      await notifyExtensionPages({
        type: "HOTKEY_SAVE_REJECTED",
        runId,
        ownerTabId,
        ok: false,
        error: error.message
      });
      return;
    }

    const result = await saveCurrentTabUrlToSheet(runId, {
      ownerTabId,
      notifyHotkeyStarted: true
    });

    await notifyExtensionPages({
      type: "HOTKEY_SAVE_FINISHED",
      runId,
      ownerTabId,
      ok: true,
      url: result?.url || ""
    });
  })().catch((error) => {
    const isBusy = isSaveProcessBusyError(error);
    if (isBusy) {
      console.info(error.message);
    } else {
      console.error("Hotkey app action failed:", error);
      sendLog(runId, "error", error.message || "Hotkey app action failed.");
    }

    notifyExtensionPages({
      type: isBusy ? "HOTKEY_SAVE_REJECTED" : "HOTKEY_SAVE_FINISHED",
      runId,
      ownerTabId: getRunOwnerTabId(runId),
      ok: false,
      code: error.code || "",
      activeOwnerTabId: error.activeOwnerTabId ?? null,
      error: error.message || "Hotkey app action failed."
    }).catch((notificationError) => {
      console.error("Could not notify extension pages:", notificationError);
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NORMALIZE_URL") {
    sendResponse({
      ok: true,
      url: normalizeUrlForStorage(message.url)
    });
    return;
  }
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
      message.aiProviderId
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

  if (message.type === "FORK_PROMPT_SELECTION") {
    forkPromptSelectionState(message.content)
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not save the updated prompt."
        });
      });
    return true;
  }

  if (message.type === "SELECT_PROMPT_SELECTION") {
    selectPromptSelectionState(message.promptId)
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not select that prompt."
        });
      });
    return true;
  }

  if (message.type === "REMOVE_PROMPT_SELECTION") {
    removePromptSelectionState(message.promptId)
      .then((state) => sendResponse({ ok: true, ...state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not remove that prompt."
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

  if (message.type === "EXPORT_APP_DATA") {
    exportAppData({
      includePromptResumes: message.includePromptResumes !== false
    })
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not export app data."
        });
      });
    return true;
  }

  if (message.type === "IMPORT_APP_DATA") {
    importAppData(message.data, {
      includePromptResumes: message.includePromptResumes !== false
    })
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not import app data."
        });
      });
    return true;
  }

  const handlers = {
    SAVE_CURRENT_TAB_URL_TO_SHEET: saveCurrentTabUrlToSheet,
    REMOVE_DUPLICATE_URLS_FROM_SHEET: removeDuplicateUrlsFromSheet,
    DELETE_APPLICATION_RECORD: deleteApplicationRecord,
    DOWNLOAD_RESUME_PDF: downloadResumeAsPdf,
    READ_GOOGLE_DOC_TEXT: readGoogleDocText,
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

  // Remember which tab started this run so its logs and progress can be routed
  // back to that tab's status in the side panel.
  registerRunOwnerTab(
    message.runId,
    Number.isInteger(message.ownerTabId) ? message.ownerTabId : sender?.tab?.id
  );

  const runPromise =
    message.type === "SAVE_CURRENT_TAB_URL_TO_SHEET"
      ? run(message.runId, {
          ownerTabId: message.ownerTabId
        })
      : message.type === "CANCEL_SAVE_POST_PROCESS"
        ? run(message.runId, message.ownerTabId)
      : message.type === "DOWNLOAD_RESUME_PDF"
        ? run(message.runId, {
            documentUrl: message.documentUrl,
            documentTitle: message.documentTitle,
            profileName: message.profileName
          })
      : message.type === "READ_GOOGLE_DOC_TEXT"
        ? run(message.runId, {
            documentUrl: message.documentUrl
          })
        : message.type === "DELETE_APPLICATION_RECORD"
          ? run(message.runId, {
              profileName: message.profileName,
              jobUrl: message.jobUrl,
              resumeUrl: message.resumeUrl,
              chatGptUrl: message.chatGptUrl,
              trashResume: message.trashResume
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
      const busy = isSaveProcessBusyError(error);
      if (cancelled) {
        console.info(error.message || "Save process cancelled.");
      } else if (busy) {
        console.info(error.message);
      } else {
        console.error(error);
      }

      sendLog(
        message.runId,
        cancelled || busy ? "info" : "error",
        error.message || "Unknown error"
      );

      sendResponse({
        ok: false,
        cancelled,
        code: error.code || "",
        activeOwnerTabId: error.activeOwnerTabId ?? null,
        error: error.message || "Unknown error"
      });
    });

  return true;
});

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
      throw new Error("Could not create an AI target tab for every profile.");
    }
    targetTabIds.push(duplicateTab.id);
  }

  return targetTabIds;
}

async function saveCurrentTabUrlToSheet(runId, options = {}) {
  const lockedRunId = acquireSaveProcessLock(runId);

  try {
    if (options.notifyHotkeyStarted === true) {
      await notifyExtensionPages({
        type: "HOTKEY_SAVE_STARTED",
        runId,
        ownerTabId: options.ownerTabId
      });
    }

    return await runSaveCurrentTabUrlToSheet(runId, options);
  } finally {
    releaseSaveProcessLock(lockedRunId);
  }
}

async function runSaveCurrentTabUrlToSheet(runId, options = {}) {
  const ownerTabId = Number.isInteger(options.ownerTabId)
    ? options.ownerTabId
    : getRunOwnerTabId(runId);
  sendLog(runId, "info", "Starting save process...");

  const validation = await validateApplicationInputsForSave();
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  if (!Number.isInteger(ownerTabId)) {
    throw new Error("Could not identify the tab that started Save App.");
  }

  let tab = null;
  try {
    tab = await chrome.tabs.get(ownerTabId);
  } catch (_error) {
    throw new Error("The tab that started Save App is no longer open.");
  }

  assertActiveJobTabUsable(tab, {
    allowGrouped: true
  });

  const selectedProfiles = validation.selectedProfiles;
  const aiProvider = getAiProviderConfig(validation.aiProviderId);
  const aiProviderUrlLabel = getAiProviderUrlLabel(aiProvider.id);
  const inputSnapshot = {
    promptContent: validation.promptContent,
    jobDescriptionContent: validation.jobDescriptionContent
  };
  await scheduleSavePostProcess(
    {
      mode: "save",
      profileCount: selectedProfiles.length,
      ownerTabId
    },
    runId
  );
  const signal = getActiveSaveProcessSignal(runId);
  throwIfSaveProcessCancelled(signal);

  try {
    sendLog(runId, "info", "Checking current active tab...");

    // Snapshot before any profile tab is navigated to the selected AI provider — the live tab
    // URL changes mid-batch and must not rewrite later workspaces' job pages.
    const jobUrl = tab.url;
    const jobTitle = tab.title || "Job page";
    const urlForSheet = normalizeUrlForStorage(jobUrl);

    sendLog(runId, "success", `Found tab URL: ${jobUrl}`);

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

    const targetTabIds = await createSaveProfileTargetTabIds(
      tab,
      selectedProfiles.length,
      runId,
      { signal }
    );
    const results = [];
    const involvedTabIds = targetTabIds;

    await updateSavePostProcessProgress({
      runId,
      ownerTabId,
      completedCount: 0,
      profileCount: selectedProfiles.length,
      involvedTabIds
    });

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
        jobTitle || `Application ${new Date().toLocaleDateString()}`;
      const docTitle =
        selectedProfiles.length > 1
          ? `${baseDocTitle} - ${profileName}`
          : baseDocTitle;
      sendLog(runId, "info", `Creating resume copy for "${profileName}"...`);
      const resumeUrl = await copyResumeAndGetUrl(
        token,
        docTitle,
        resumeTemplateId,
        runId,
        { signal }
      );
      sendLog(runId, "success", `Resume copy created: ${resumeUrl}`);

      sendLog(
        runId,
        "info",
        aiProvider.contextDocOnly
          ? `Preparing context for "${profileName}"...`
          : `Preparing ${aiProvider.label} prompt for "${profileName}"...`
      );
      const aiMessage = await buildChatGptMessageFromStorage(
        profile,
        inputSnapshot
      );
      throwIfSaveProcessCancelled(signal);
      let chatGptUrl = aiProvider.homeUrl || "";
      let chatGptTabId = null;
      const targetTabId = targetTabIds[index];

      await notifyExtensionPages({
        type: "SHOW_SAVE_WORKSPACE",
        runId,
        ownerTabId,
        batchIndex: index,
        batchCount: selectedProfiles.length,
        jobTitle,
        jobUrl,
        profileName,
        resumeUrl,
        chatGptTabId: targetTabId,
        aiProviderId: aiProvider.id,
        aiProviderLabel: aiProviderUrlLabel
      });

      if (aiProvider.contextDocOnly) {
        const contextResult = await saveContextToGoogleDocAndOpen(
          aiMessage,
          runId,
          {
            tabId: targetTabId,
            title: `${docTitle} - Context`,
            token,
            signal
          }
        );
        chatGptUrl = contextResult.url;
        chatGptTabId = contextResult.tabId;
      } else if (aiMessage) {
        const aiResult = await sendToAiAndGetUrl(aiMessage, runId, {
          tabId: targetTabId,
          signal,
          aiProviderId: aiProvider.id
        });
        chatGptUrl = aiResult.url;
        chatGptTabId = aiResult.tabId;
      } else {
        sendLog(
          runId,
          "info",
          `No AI message content was available for "${profileName}".`
        );
        const aiResult = await openAiChatInExistingTab(targetTabId, runId, {
          signal,
          aiProviderId: aiProvider.id
        });
        chatGptUrl = aiResult.url;
        chatGptTabId = aiResult.tabId;
      }

      const hasExactAiUrl = isAiConversationUrl(
        chatGptUrl,
        aiProvider.id
      );
      if (hasExactAiUrl) {
        await notifyExtensionPages({
          type: "SAVE_WORKSPACE_AI_URL_AVAILABLE",
          runId,
          ownerTabId,
          profileName,
          chatGptUrl,
          chatGptTabId,
          aiProviderId: aiProvider.id,
          aiProviderLabel: aiProviderUrlLabel,
          hasExactAiUrl
        });
      }

      const row = buildApplicationSheetRow({
        timestamp: new Date().toISOString(),
        jobTitle,
        profileName,
        jobUrl: urlForSheet,
        chatGptUrl,
        resumeUrl
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

      await notifyExtensionPages({
        type: "SAVE_WORKSPACE_READY",
        runId,
        ownerTabId,
        profileName,
        chatGptUrl,
        chatGptTabId,
        aiProviderId: aiProvider.id,
        aiProviderLabel: aiProviderUrlLabel,
        hasExactAiUrl
      });

      results.push({
        profileId: profile.id,
        profileName,
        resumeUrl,
        chatGptUrl,
        chatGptTabId,
        aiProviderId: aiProvider.id,
        aiProviderLabel: aiProvider.label,
        hasExactAiUrl
      });
      sendLog(
        runId,
        "success",
        `Finished profile ${positionLabel}: ${profileName}`
      );

      const nextInvolvedTabIds = [
        ...new Set(
          [
            ...involvedTabIds,
            chatGptTabId,
            ...results.map((entry) => entry.chatGptTabId)
          ].filter((tabId) => Number.isInteger(tabId))
        )
      ];
      await updateSavePostProcessProgress({
        runId,
        ownerTabId,
        completedCount: index + 1,
        profileCount: selectedProfiles.length,
        involvedTabIds: nextInvolvedTabIds
      });
    }

    // Clear inputs only after every profile workspace is shown. Doing this
    // inside the last profile wiped job description / selections while the
    // second tab's sidebar was still binding, so it looked like data loss.
    await completeSavePostProcess(runId, ownerTabId);

    const finalResult = results[results.length - 1];

    sendLog(
      runId,
      "success",
      aiProvider.contextDocOnly
        ? `Finished. Saved ${selectedProfiles.length} context Google ${
            selectedProfiles.length === 1 ? "Doc" : "Docs"
          } for the selected profiles; no tab group was created.`
        : `Finished. Opened ${selectedProfiles.length} ${aiProvider.label} ${
            selectedProfiles.length === 1 ? "tab" : "tabs"
          } for the selected profiles; no tab group was created.`
    );

    return {
      url: urlForSheet,
      chatGptUrl: finalResult.chatGptUrl,
      chatGptTabId: finalResult.chatGptTabId,
      jobTitle,
      aiProviderId: aiProvider.id,
      aiProviderLabel: aiProvider.label,
      jobUrl,
      profileName: finalResult.profileName,
      resumeUrl: finalResult.resumeUrl,
      profileCount: selectedProfiles.length,
      results,
      grouped: false
    };
  } catch (error) {
    if (isSaveProcessCancelledError(error)) {
      await clearSavePostProcess({
        resetInputs: true,
        reason: "cancelled",
        runId,
        ownerTabId
      }).catch((cleanupError) => {
        console.error("Could not clean up the cancelled save process:", cleanupError);
      });
      throw createSaveProcessCancelledError();
    }

    await clearSavePostProcess({
      resetInputs: false,
      reason: "failed",
      runId,
      ownerTabId
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

function applicationSheetRowMatchesRecord(row, {
  jobUrl = "",
  resumeUrl = "",
  chatGptUrl = ""
} = {}) {
  const resumeKey = normalizeUrlKeyForDedupe(resumeUrl);
  const rowResumeKey = normalizeUrlKeyForDedupe(row?.[5]);
  if (resumeKey && rowResumeKey && resumeKey === rowResumeKey) {
    return true;
  }

  const jobKey = normalizeUrlKeyForDedupe(jobUrl);
  const rowJobKey = normalizeUrlKeyForDedupe(row?.[4]);
  if (!jobKey || !rowJobKey || jobKey !== rowJobKey) {
    return false;
  }

  const chatKey = normalizeUrlKeyForDedupe(chatGptUrl);
  if (!chatKey) {
    return true;
  }

  const rowChatKey = normalizeUrlKeyForDedupe(row?.[3]);
  return !rowChatKey || rowChatKey === chatKey;
}

async function trashGoogleDocByUrl(runId, documentUrl) {
  const normalizedDocumentUrl = String(documentUrl || "").trim();
  if (!isGoogleDocsDocumentUrl(normalizedDocumentUrl)) {
    throw new Error("The resume URL is not a Google Docs document.");
  }

  const documentId = parseGoogleDocId(normalizedDocumentUrl);
  if (!documentId) {
    throw new Error("Could not find a Google Docs document ID in the resume URL.");
  }

  sendLog(runId, "info", "Moving the copied resume Doc to Google Drive trash...");
  let token = await getGoogleAccessToken();
  let response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ trashed: true })
    }
  );

  if (response.status === 401 || response.status === 403) {
    sendLog(runId, "info", "Drive trash auth error. Refreshing token and retrying...");
    await clearCachedGoogleAccessToken(token);
    token = await getGoogleAccessToken({ interactive: true });
    response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trashed: true })
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      formatGoogleApiError(
        errorText,
        "Could not move the copied resume Doc to Google Drive trash."
      )
    );
  }

  sendLog(runId, "success", "Copied resume Doc moved to Google Drive trash.");
  return { documentId };
}

async function deleteApplicationRecord(runId, options = {}) {
  const profileName =
    String(options.profileName || "").trim() || DEFAULT_PROFILE_NAME;
  const jobUrl = String(options.jobUrl || "").trim();
  const resumeUrl = String(options.resumeUrl || "").trim();
  const chatGptUrl = String(options.chatGptUrl || "").trim();
  const trashResume = options.trashResume !== false && Boolean(resumeUrl);

  if (!jobUrl && !resumeUrl) {
    throw new Error("A job URL or resume URL is required to delete the application.");
  }

  sendLog(runId, "info", `Deleting application record for profile "${profileName}"...`);

  const token = await getGoogleAccessToken();
  sendLog(runId, "success", "Google authorization token received.");

  const baseSheetConfig = await getSheetConfig();
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
  const firstDataRowIndex =
    values.length > 0 && hasApplicationSheetHeaders(values[0]) ? 1 : 0;
  const matchingRowIndices = [];
  const deletedRows = [];

  for (let i = firstDataRowIndex; i < values.length; i++) {
    const row = values[i] || [];
    if (
      !applicationSheetRowMatchesRecord(row, {
        jobUrl,
        resumeUrl,
        chatGptUrl
      })
    ) {
      continue;
    }

    matchingRowIndices.push(i);
    deletedRows.push({
      rowNumber: i + 1,
      timestamp: row[0] || "",
      title: row[1] || "",
      profileName: row[2] || "",
      chatGptUrl: row[3] || "",
      url: row[4] || "",
      resumeUrl: row[5] || "",
      applyNow: row[6] || ""
    });
  }

  if (matchingRowIndices.length === 0) {
    sendLog(
      runId,
      "info",
      `No matching Google Sheet rows found in "${profileName}".`
    );
  } else {
    sendLog(
      runId,
      "info",
      `Removing ${matchingRowIndices.length} matching Google Sheet row(s)...`
    );
    await batchDeleteSheetRows(
      token,
      sheetConfig.spreadsheetId,
      sheetId,
      matchingRowIndices,
      runId
    );
    sendLog(
      runId,
      "success",
      `Removed ${matchingRowIndices.length} Google Sheet row(s).`
    );
  }

  let trashedDocumentId = null;
  if (trashResume) {
    const trashResult = await trashGoogleDocByUrl(runId, resumeUrl);
    trashedDocumentId = trashResult.documentId;
  } else if (resumeUrl) {
    sendLog(
      runId,
      "info",
      "Skipping Google Docs trash because this resume was not a Save App copy."
    );
  }

  return {
    removed: matchingRowIndices.length,
    deletedRows,
    trashedDocumentId,
    profileName,
    jobUrl,
    resumeUrl
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

async function getGoogleDocWithAuthRetry(
  token,
  documentId,
  runId,
  { includeTabsContent = false } = {}
) {
  let activeToken = token;
  const documentUrl =
    "https://docs.googleapis.com/v1/documents/" +
    documentId +
    (includeTabsContent ? "?includeTabsContent=true" : "");
  let response = await fetch(documentUrl, {
    headers: {
      Authorization: "Bearer " + activeToken
    }
  });

  if (response.status === 401 || response.status === 403) {
    sendLog(
      runId,
      "info",
      "Google Doc read auth error. Refreshing token and retrying..."
    );
    await clearCachedGoogleAccessToken(activeToken);
    activeToken = await getGoogleAccessToken({ interactive: true });
    response = await fetch(documentUrl, {
      headers: {
        Authorization: "Bearer " + activeToken
      }
    });
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

function extractGoogleDocStructuralText(structuralElements) {
  const chunks = [];

  for (const structuralElement of structuralElements || []) {
    if (structuralElement?.paragraph) {
      chunks.push(
        (structuralElement.paragraph.elements || [])
          .map((element) =>
            String(
              element?.textRun?.content ||
                element?.autoText?.content ||
                element?.person?.personProperties?.name ||
                element?.richLink?.richLinkProperties?.title ||
                ""
            )
          )
          .join("")
      );
    }

    if (structuralElement?.table) {
      for (const tableRow of structuralElement.table.tableRows || []) {
        const cellTexts = (tableRow.tableCells || []).map((tableCell) =>
          extractGoogleDocStructuralText(tableCell.content).replace(/\n+$/g, "")
        );
        chunks.push(cellTexts.join("\t") + "\n");
      }
    }

    if (structuralElement?.tableOfContents) {
      chunks.push(
        extractGoogleDocStructuralText(
          structuralElement.tableOfContents.content
        )
      );
    }
  }

  return chunks.join("");
}

function collectGoogleDocTabText(tabs, tabTexts = []) {
  for (const tab of tabs || []) {
    const tabText = extractGoogleDocStructuralText(
      tab?.documentTab?.body?.content
    ).trim();
    if (tabText) {
      tabTexts.push(tabText);
    }
    collectGoogleDocTabText(tab?.childTabs, tabTexts);
  }

  return tabTexts;
}

function extractGoogleDocPlainText(googleDocument) {
  const tabTexts = collectGoogleDocTabText(googleDocument?.tabs);
  const text = tabTexts.length
    ? tabTexts.join("\n\n")
    : extractGoogleDocStructuralText(googleDocument?.body?.content);

  return text.replace(/\r\n?/g, "\n").trim();
}

async function readGoogleDocText(runId, options = {}) {
  const documentUrl = String(options.documentUrl || "").trim();
  if (!isGoogleDocsDocumentUrl(documentUrl)) {
    throw new Error("The selected URL is not a Google Docs document.");
  }

  const documentId = parseGoogleDocId(documentUrl);
  if (!documentId) {
    throw new Error("Could not find a Google Docs document ID.");
  }

  sendLog(runId, "info", "Reading Google Docs content for the clipboard...");
  const token = await getGoogleAccessToken();
  const { document } = await getGoogleDocWithAuthRetry(
    token,
    documentId,
    runId,
    { includeTabsContent: true }
  );
  const text = extractGoogleDocPlainText(document);
  if (!text) {
    throw new Error("The Google Doc does not contain copyable text.");
  }

  sendLog(runId, "success", "Google Docs text is ready to copy.");
  return {
    documentId,
    title: String(document?.title || "Google Doc").trim() || "Google Doc",
    text
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
      ownerTabId: getRunOwnerTabId(runId),
      level,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
  } catch (error) {
    console.log(`[${level}] ${message}`);
  }
}

function createSaveProcessBusyError() {
  const error = new Error(
    "Save App is already running. Wait for it to finish or cancel it before starting another save."
  );
  error.code = SAVE_PROCESS_BUSY_CODE;
  error.activeRunId = activeSaveRunId;
  error.activeOwnerTabId = getRunOwnerTabId(activeSaveRunId);
  return error;
}

function isSaveProcessBusyError(error) {
  return error?.code === SAVE_PROCESS_BUSY_CODE;
}

function acquireSaveProcessLock(runId) {
  const normalizedRunId = String(runId || "");
  if (!normalizedRunId) {
    throw new Error("Save App run ID is required.");
  }
  if (activeSaveRunId) {
    throw createSaveProcessBusyError();
  }
  activeSaveRunId = normalizedRunId;
  return normalizedRunId;
}

function releaseSaveProcessLock(runId) {
  const normalizedRunId = String(runId || "");
  if (activeSaveRunId === normalizedRunId) {
    activeSaveRunId = "";
  }
}
