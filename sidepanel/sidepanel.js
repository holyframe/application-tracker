const saveButton = document.querySelector("#saveButton");
const applyNowButton = document.querySelector("#applyNowButton");
const humanizeButton = document.querySelector("#humanizeButton");
const openSplitWindowsButton = document.querySelector("#openSplitWindowsButton");
const splitWindowsModal = document.querySelector("#splitWindowsModal");
const splitWindowsModalBackdrop = document.querySelector("#splitWindowsModalBackdrop");
const splitWindowsModalCloseButton = document.querySelector("#splitWindowsModalCloseButton");
const homeWorkspaceSwitcher = document.querySelector("#homeWorkspaceSwitcher");
const homeWorkspaceExchangeButton = document.querySelector(
  "#homeWorkspaceExchangeButton"
);
const homeCancelProcessButton = document.querySelector("#homeCancelProcessButton");
const applicationCancelProcessButton = document.querySelector(
  "#applicationCancelProcessButton"
);
const homeSavePostProcessTime = document.querySelector("#homeSavePostProcessTime");
const applicationSavePostProcessTime = document.querySelector(
  "#applicationSavePostProcessTime"
);
const splitWindowsModalCancelButton = document.querySelector("#splitWindowsModalCancelButton");
const splitWindowsModalOpenButton = document.querySelector("#splitWindowsModalOpenButton");
const splitWindowUrlsInput = document.querySelector("#splitWindowUrlsInput");
const splitWindowsModalTitle = document.querySelector("#splitWindowsModalTitle");
const splitWindowsInputView = document.querySelector("#splitWindowsInputView");
const splitWindowsPreviewView = document.querySelector("#splitWindowsPreviewView");
const splitWindowsPreviewTabs = document.querySelector("#splitWindowsPreviewTabs");
const splitWindowsJobTabButton = document.querySelector("#splitWindowsJobTabButton");
const splitWindowsResumeTabButton = document.querySelector(
  "#splitWindowsResumeTabButton"
);
const splitWindowsPreviewUrl = document.querySelector("#splitWindowsPreviewUrl");
const applicationWorkspaceUrlInput = document.querySelector(
  "#applicationWorkspaceUrlInput"
);
const applicationWorkspaceRefreshButton = document.querySelector(
  "#applicationWorkspaceRefreshButton"
);
const applicationWorkspacePickupButton = document.querySelector(
  "#applicationWorkspacePickupButton"
);
const applicationWorkspaceNotesButton = document.querySelector(
  "#applicationWorkspaceNotesButton"
);
const applicationWorkspaceCopyUrlButton = document.querySelector(
  "#applicationWorkspaceCopyUrlButton"
);
const splitWindowsPreviewFrame = document.querySelector("#splitWindowsPreviewFrame");
const splitWindowsPreviewEmptyState = document.querySelector(
  "#splitWindowsPreviewEmptyState"
);
const splitWindowsPreviewEmptyTitle = document.querySelector(
  "#splitWindowsPreviewEmptyTitle"
);
const splitWindowsPreviewEmptyHelp = document.querySelector(
  "#splitWindowsPreviewEmptyHelp"
);
const applicationWorkspaceProfileNote = document.querySelector(
  "#applicationWorkspaceProfileNote"
);
const applicationWorkspaceProfileNoteTitle = document.querySelector(
  "#applicationWorkspaceProfileNoteTitle"
);
const applicationWorkspaceProfileNoteText = document.querySelector(
  "#applicationWorkspaceProfileNoteText"
);
const splitWindowsPreviewHelp = document.querySelector(
  ".split-windows-preview-help"
);
const splitWindowsPreviewBackButton = document.querySelector("#splitWindowsPreviewBackButton");
const splitWindowsPreviewDownloadButton = document.querySelector(
  "#splitWindowsPreviewDownloadButton"
);
const splitWindowsBatchActions = document.querySelector(
  "#splitWindowsBatchActions"
);
const saveWorkspaceActions = document.querySelector("#saveWorkspaceActions");
const saveWorkspaceBuildButton = document.querySelector(
  "#saveWorkspaceBuildButton"
);
const saveWorkspaceDownloadButton = document.querySelector(
  "#saveWorkspaceDownloadButton"
);
const saveWorkspaceExchangeButton = document.querySelector(
  "#saveWorkspaceExchangeButton"
);
const buildResumeContextModal = document.querySelector(
  "#buildResumeContextModal"
);
const buildResumeContextModalBackdrop = document.querySelector(
  "#buildResumeContextModalBackdrop"
);
const buildResumeContextModalCloseButton = document.querySelector(
  "#buildResumeContextModalCloseButton"
);
const buildResumeContextCancelButton = document.querySelector(
  "#buildResumeContextCancelButton"
);
const buildResumeContextSubmitButton = document.querySelector(
  "#buildResumeContextSubmitButton"
);
const buildResumeContextStatus = document.querySelector(
  "#buildResumeContextStatus"
);
const buildResumeContextInput = document.querySelector(
  "#buildResumeContextInput"
);
const workspaceHeaderStatuses = document.querySelectorAll(
  ".workspace-header-status"
);
const deletedRowsCard = document.querySelector("#deletedRowsCard");
const deletedRowsList = document.querySelector("#deletedRowsList");
const emptyDeletedRows = document.querySelector("#emptyDeletedRows");
const logsList = document.querySelector("#logsList");
const emptyLogs = document.querySelector("#emptyLogs");
const clearLogsButton = document.querySelector("#clearLogsButton");
const configToggleButton = document.querySelector("#configToggleButton");
const configModal = document.querySelector("#configModal");
const configModalBackdrop = document.querySelector("#configModalBackdrop");
const configModalCloseButton = document.querySelector("#configModalCloseButton");
const configModalCancelButton = document.querySelector("#configModalCancelButton");
const spreadsheetIdInput = document.querySelector("#spreadsheetIdInput");
const sheetNameInput = document.querySelector("#sheetNameInput");
const resumeTemplateInput = document.querySelector("#resumeTemplateInput");
const saveConfigButton = document.querySelector("#saveConfigButton");
const includePromptResumeInfoCheckbox = document.querySelector(
  "#includePromptResumeInfoCheckbox"
);
const exportAppDataButton = document.querySelector("#exportAppDataButton");
const importAppDataButton = document.querySelector("#importAppDataButton");
const importAppDataFileInput = document.querySelector("#importAppDataFileInput");
const appDataTransferStatus = document.querySelector("#appDataTransferStatus");
const promptResumeList = document.querySelector("#promptResumeList");
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
const promptList = document.querySelector("#promptList");
const humanizePromptList = document.querySelector("#humanizePromptList");
const humanizeFormModal = document.querySelector("#humanizeFormModal");
const humanizeFormModalBackdrop = document.querySelector("#humanizeFormModalBackdrop");
const humanizeFormModalCloseButton = document.querySelector("#humanizeFormModalCloseButton");
const humanizeFormModalCancelButton = document.querySelector("#humanizeFormModalCancelButton");
const humanizeFormModalSubmitButton = document.querySelector("#humanizeFormModalSubmitButton");
const humanizeContentInput = document.querySelector("#humanizeContentInput");
const promptFormModal = document.querySelector("#promptFormModal");
const promptFormModalBackdrop = document.querySelector("#promptFormModalBackdrop");
const promptFormModalCloseButton = document.querySelector("#promptFormModalCloseButton");
const promptFormModalCancelButton = document.querySelector("#promptFormModalCancelButton");
const promptFormModalSubmitButton = document.querySelector("#promptFormModalSubmitButton");
const promptContentInput = document.querySelector("#promptContentInput");
const jobDescriptionList = document.querySelector("#jobDescriptionList");
const jobDescriptionFormModal = document.querySelector("#jobDescriptionFormModal");
const jobDescriptionFormModalBackdrop = document.querySelector("#jobDescriptionFormModalBackdrop");
const jobDescriptionFormModalCloseButton = document.querySelector("#jobDescriptionFormModalCloseButton");
const jobDescriptionFormModalCancelButton = document.querySelector("#jobDescriptionFormModalCancelButton");
const jobDescriptionFormModalSubmitButton = document.querySelector("#jobDescriptionFormModalSubmitButton");
const jobDescriptionContentInput = document.querySelector("#jobDescriptionContentInput");
const profileList = document.querySelector("#profileList");
const profilePromptResumeSection = document.querySelector("#profilePromptResumeSection");
const addProfileButton = document.querySelector("#addProfileButton");
const profileFormModal = document.querySelector("#profileFormModal");
const profileFormModalTitle = document.querySelector("#profileFormModalTitle");
const profileFormModalHelp = document.querySelector("#profileFormModalHelp");
const profileFormModalBackdrop = document.querySelector("#profileFormModalBackdrop");
const profileFormModalCloseButton = document.querySelector("#profileFormModalCloseButton");
const profileFormModalCancelButton = document.querySelector("#profileFormModalCancelButton");
const profileFormModalSubmitButton = document.querySelector("#profileFormModalSubmitButton");
const profileFormModalStatus = document.querySelector("#profileFormModalStatus");
const profileNameInput = document.querySelector("#profileNameInput");
const profileNotesModal = document.querySelector("#profileNotesModal");
const profileNotesModalTitle = document.querySelector("#profileNotesModalTitle");
const profileNotesModalHelp = document.querySelector("#profileNotesModalHelp");
const profileNotesModalBackdrop = document.querySelector("#profileNotesModalBackdrop");
const profileNotesModalCloseButton = document.querySelector("#profileNotesModalCloseButton");
const profileNotesModalCancelButton = document.querySelector("#profileNotesModalCancelButton");
const profileNotesModalSubmitButton = document.querySelector("#profileNotesModalSubmitButton");
const profileNotesInput = document.querySelector("#profileNotesInput");
const appRoot = document.querySelector(".app");
const PROMPT_RESUME_SELECTION_STORAGE_KEY = "promptResumeSelection";
const JOB_DESCRIPTION_SELECTION_STORAGE_KEY = "jobDescriptionSelection";
const SAVE_POST_PROCESS_STORAGE_KEY = "savePostProcess";
const PROFILE_SELECTION_STORAGE_KEY = "profileSelection";
const PROFILE_SELECTION_VERSION = 3;
const DEFAULT_PROFILE_NAME = "Default";

let activeRunId = null;
let savePostProcessState = null;
let isSavePostProcessRequestPending = false;
let currentSplitWindowDownloadUrl = "";
let currentSplitWindowPairs = [];
let currentSplitWindowReturnTabId = null;
let currentSplitWindowSessionType = "make-resume";
let currentSaveWorkspace = null;
const saveWorkspacesByTabId = new Map();
let currentSaveWorkspaceSidePanelView = "workspace";
let currentDefaultSidePanelView = "home";
let currentEmptyWorkspaceTab = "job";
let currentEmptyWorkspaceUrls = {
  job: "",
  resume: ""
};
let isSplitWindowsDialogOpen = false;
let areActionButtonsDisabled = false;
let isCurrentTabGoogleSheet = false;
let makeResumeAvailabilityRequestId = 0;
let isMakeResumeOpening = false;
let isBuildResumeContextModalOpen = false;
let logEntries = [];
let deletedRowEntries = [];
let headerStatusState = null;
let splitWindowsDraft = "";
let buildResumeContextDraft = "";
let openManagedModalId = "";
let managedModalDrafts = {};

// The side panel is a single document shared by every tab in its window, so each
// tab's status lives in tabStateById and the module-level variables above act as
// the register file for whichever tab is currently active.
const MAX_TAB_LOG_ENTRIES = 400;
const tabStateById = new Map();
const runTabIdsByRunId = new Map();
let activeTabId = null;
let panelWindowId = null;

function createTabState() {
  return {
    runId: null,
    logs: [],
    deletedRows: [],
    headerStatus: null,
    savePostProcessState: null,
    isSavePostProcessRequestPending: false,
    areActionButtonsDisabled: false,
    splitWindowDownloadUrl: "",
    splitWindowPairs: [],
    splitWindowReturnTabId: null,
    splitWindowSessionType: "make-resume",
    saveWorkspaceSidePanelView: "workspace",
    defaultSidePanelView: "home",
    emptyWorkspaceTab: "job",
    emptyWorkspaceUrls: { job: "", resume: "" },
    isSplitWindowsDialogOpen: false,
    isBuildResumeContextModalOpen: false,
    isMakeResumeOpening: false,
    splitWindowsDraft: "",
    buildResumeContextDraft: "",
    openManagedModalId: "",
    managedModalDrafts: {},
    profileFormMode: "add",
    editingProfileId: null,
    notesProfileId: null,
    promptResumeFormMode: "add",
    editingPromptResumeId: null
  };
}

function getTabState(tabId) {
  if (!Number.isInteger(tabId)) {
    return null;
  }

  let state = tabStateById.get(tabId);
  if (!state) {
    state = createTabState();
    tabStateById.set(tabId, state);
  }

  return state;
}

function captureActiveTabState() {
  const state = getTabState(activeTabId);
  if (!state) return;

  state.runId = activeRunId;
  state.logs = logEntries;
  state.deletedRows = deletedRowEntries;
  state.headerStatus = headerStatusState;
  state.savePostProcessState = savePostProcessState;
  state.isSavePostProcessRequestPending = isSavePostProcessRequestPending;
  state.areActionButtonsDisabled = areActionButtonsDisabled;
  state.splitWindowDownloadUrl = currentSplitWindowDownloadUrl;
  state.splitWindowPairs = currentSplitWindowPairs;
  state.splitWindowReturnTabId = currentSplitWindowReturnTabId;
  state.splitWindowSessionType = currentSplitWindowSessionType;
  state.saveWorkspaceSidePanelView = currentSaveWorkspaceSidePanelView;
  state.defaultSidePanelView = currentDefaultSidePanelView;
  state.emptyWorkspaceTab = currentEmptyWorkspaceTab;
  state.emptyWorkspaceUrls = currentEmptyWorkspaceUrls;
  state.isSplitWindowsDialogOpen = isSplitWindowsDialogOpen;
  state.isBuildResumeContextModalOpen = isBuildResumeContextModalOpen;
  state.isMakeResumeOpening = isMakeResumeOpening;
  state.splitWindowsDraft = splitWindowUrlsInput?.value ?? splitWindowsDraft;
  state.buildResumeContextDraft =
    buildResumeContextInput?.value ?? buildResumeContextDraft;
  state.openManagedModalId = readOpenManagedModalId();
  state.managedModalDrafts = readManagedModalDrafts(state.openManagedModalId);
  state.profileFormMode = profileFormMode;
  state.editingProfileId = editingProfileId;
  state.notesProfileId = notesProfileId;
  state.promptResumeFormMode = promptResumeFormMode;
  state.editingPromptResumeId = editingPromptResumeId;
}

function loadTabStateIntoRegisters(tabId) {
  const state = getTabState(tabId) || createTabState();

  activeRunId = state.runId;
  logEntries = state.logs;
  deletedRowEntries = state.deletedRows;
  headerStatusState = state.headerStatus;
  savePostProcessState = state.savePostProcessState;
  isSavePostProcessRequestPending = state.isSavePostProcessRequestPending;
  areActionButtonsDisabled = state.areActionButtonsDisabled;
  currentSplitWindowDownloadUrl = state.splitWindowDownloadUrl;
  currentSplitWindowPairs = state.splitWindowPairs;
  currentSplitWindowReturnTabId = state.splitWindowReturnTabId;
  currentSplitWindowSessionType = state.splitWindowSessionType;
  currentSaveWorkspaceSidePanelView = state.saveWorkspaceSidePanelView;
  currentDefaultSidePanelView = state.defaultSidePanelView;
  currentEmptyWorkspaceTab = state.emptyWorkspaceTab;
  currentEmptyWorkspaceUrls = state.emptyWorkspaceUrls;
  isSplitWindowsDialogOpen = state.isSplitWindowsDialogOpen;
  isBuildResumeContextModalOpen = state.isBuildResumeContextModalOpen;
  isMakeResumeOpening = state.isMakeResumeOpening;
  splitWindowsDraft = state.splitWindowsDraft;
  buildResumeContextDraft = state.buildResumeContextDraft;
  openManagedModalId = state.openManagedModalId;
  managedModalDrafts = state.managedModalDrafts;
  profileFormMode = state.profileFormMode;
  editingProfileId = state.editingProfileId;
  notesProfileId = state.notesProfileId;
  promptResumeFormMode = state.promptResumeFormMode;
  editingPromptResumeId = state.editingPromptResumeId;
}

function switchActiveTab(tabId) {
  if (!Number.isInteger(tabId) || tabId === activeTabId) {
    return false;
  }

  captureActiveTabState();
  activeTabId = tabId;
  loadTabStateIntoRegisters(activeTabId);
  renderActiveTabState();
  return true;
}

function forgetTabState(tabId) {
  tabStateById.delete(tabId);
  runTabIdsByRunId.forEach((tabIds, runId) => {
    tabIds.delete(tabId);
    if (tabIds.size === 0) {
      runTabIdsByRunId.delete(runId);
    }
  });
}

// A run starts on one tab but can adopt the tabs it opens (for example the
// ChatGPT tab created for a profile), and every adopted tab mirrors its status.
function registerRunTab(runId, tabId = activeTabId) {
  if (!runId || !Number.isInteger(tabId)) {
    return runId;
  }

  let tabIds = runTabIdsByRunId.get(runId);
  if (!tabIds) {
    tabIds = new Set();
    runTabIdsByRunId.set(runId, tabIds);
  }
  tabIds.add(tabId);

  return runId;
}

// Resolves which tabs a service worker message applies to. Messages carry the
// owning tab id when the service worker knows it; otherwise fall back to the
// run registry the side panel built when it started the run.
function resolveRunTabIds(message) {
  const tabIds = new Set();

  if (Number.isInteger(message?.ownerTabId)) {
    tabIds.add(message.ownerTabId);
  }

  runTabIdsByRunId.get(message?.runId)?.forEach((tabId) => tabIds.add(tabId));

  if (
    tabIds.size === 0 &&
    message?.runId &&
    message.runId === activeRunId &&
    Number.isInteger(activeTabId)
  ) {
    tabIds.add(activeTabId);
  }

  return [...tabIds];
}

function setRunIdForTab(tabId, runId) {
  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.runId = runId;
    }
    return runId;
  }

  activeRunId = runId;
  return runId;
}

// Starts a run owned by the tab the user is looking at and returns that tab id
// so async handlers keep reporting to it even if the user switches tabs.
function beginRunForActiveTab() {
  const ownerTabId = activeTabId;
  const runId = createRunId();

  registerRunTab(runId, ownerTabId);
  setRunIdForTab(ownerTabId, runId);

  return { ownerTabId, runId };
}

function renderActiveTabState() {
  syncCurrentSaveWorkspace();
  renderLogEntries();
  renderDeletedRowEntries();
  renderHeaderStatus();
  restoreManagedModalState();
  if (isSplitWindowsDialogOpen) {
    // Another tab may have left the shared region showing a workspace preview.
    setSplitWindowsPreview("");
    splitWindowsPreviewTabs?.classList.add("is-hidden");
  }
  if (splitWindowUrlsInput) splitWindowUrlsInput.value = splitWindowsDraft;
  if (buildResumeContextInput) {
    buildResumeContextInput.value = buildResumeContextDraft;
  }
  setSaveButtonsDisabled(areActionButtonsDisabled);
  renderSaveWorkspaceSidePanelView();
}

async function initActiveTabTracking() {
  try {
    const currentWindow = await chrome.windows.getCurrent();
    panelWindowId = Number.isInteger(currentWindow?.id) ? currentWindow.id : null;

    const [tab] = await chrome.tabs.query(
      panelWindowId === null
        ? { active: true, lastFocusedWindow: true }
        : { active: true, windowId: panelWindowId }
    );

    if (Number.isInteger(tab?.id)) {
      activeTabId = tab.id;
      captureActiveTabState();
    }
  } catch (error) {
    console.error("Could not determine the active tab for the side panel:", error);
  }
}

// Modals share one DOM node across every tab, so opening one is recorded against
// the active tab and replayed when that tab comes back into focus.
function getManagedModals() {
  return [
    {
      // Sheet configuration is global app data rather than per-tab work, so only
      // the open state is tracked; the inputs keep whatever is loaded.
      id: "config",
      element: configModal,
      setOpen: (isOpen) => setConfigModalOpen(isOpen, { returnFocus: false }),
      fields: []
    },
    {
      id: "profileForm",
      element: profileFormModal,
      setOpen: setProfileFormModalOpen,
      fields: [profileNameInput, resumeTemplateInput]
    },
    {
      id: "profileNotes",
      element: profileNotesModal,
      setOpen: setProfileNotesModalOpen,
      fields: [profileNotesInput]
    },
    {
      id: "promptResumeForm",
      element: promptResumeFormModal,
      setOpen: setPromptResumeFormModalOpen,
      fields: [promptResumeLabelInput, promptResumeContentInput]
    },
    {
      id: "promptForm",
      element: promptFormModal,
      setOpen: setPromptFormModalOpen,
      fields: [promptContentInput]
    },
    {
      id: "humanizeForm",
      element: humanizeFormModal,
      setOpen: setHumanizeFormModalOpen,
      fields: [humanizeContentInput]
    },
    {
      id: "jobDescriptionForm",
      element: jobDescriptionFormModal,
      setOpen: setJobDescriptionFormModalOpen,
      fields: [jobDescriptionContentInput]
    }
  ];
}

function readOpenManagedModalId() {
  const openModal = getManagedModals().find(
    (modal) => modal.element && !modal.element.classList.contains("is-hidden")
  );

  return openModal ? openModal.id : "";
}

function readManagedModalDrafts(modalId) {
  const modal = getManagedModals().find((entry) => entry.id === modalId);
  if (!modal) {
    return {};
  }

  const drafts = {};
  modal.fields.forEach((field) => {
    if (field?.id) {
      drafts[field.id] = field.value;
    }
  });

  return drafts;
}

function restoreManagedModalState() {
  const targetModalId = openManagedModalId;
  const drafts = managedModalDrafts || {};
  const preservedProfileFormMode = profileFormMode;
  const preservedEditingProfileId = editingProfileId;
  const preservedNotesProfileId = notesProfileId;
  const preservedPromptResumeFormMode = promptResumeFormMode;
  const preservedEditingPromptResumeId = editingPromptResumeId;

  getManagedModals().forEach((modal) => {
    if (!modal.element) return;

    const isOpen = !modal.element.classList.contains("is-hidden");
    const shouldOpen = modal.id === targetModalId;
    if (isOpen !== shouldOpen) {
      modal.setOpen(shouldOpen);
    }
  });

  // Closing a modal resets its companion form mode, so put the active tab's
  // values back after the DOM has settled.
  profileFormMode = preservedProfileFormMode;
  editingProfileId = preservedEditingProfileId;
  notesProfileId = preservedNotesProfileId;
  promptResumeFormMode = preservedPromptResumeFormMode;
  editingPromptResumeId = preservedEditingPromptResumeId;

  getManagedModals()
    .find((modal) => modal.id === targetModalId)
    ?.fields.forEach((field) => {
      if (field?.id && Object.prototype.hasOwnProperty.call(drafts, field.id)) {
        field.value = drafts[field.id];
      }
    });
}

function syncCurrentSaveWorkspace() {
  currentSaveWorkspace = Number.isInteger(activeTabId)
    ? saveWorkspacesByTabId.get(activeTabId) || null
    : null;

  if (currentSaveWorkspace?.sessionType) {
    currentSplitWindowSessionType = currentSaveWorkspace.sessionType;
  }

  return currentSaveWorkspace;
}

function createRunId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createProfileId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

let profileSelectionState = {
  profiles: [],
  selectedProfileId: "",
  selectedProfileIds: [],
  selectionVersion: PROFILE_SELECTION_VERSION
};

let expandedProfileIds = new Set();
let draggedProfileId = "";
let profileFormMode = "add";
let editingProfileId = null;
let notesProfileId = null;

function moveProfileBeforeTarget(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) {
    return false;
  }

  const items = [...profileSelectionState.profiles];
  const fromIndex = items.findIndex((entry) => entry.id === draggedId);
  const toIndex = items.findIndex((entry) => entry.id === targetId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return false;
  }

  const [movedItem] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, movedItem);
  profileSelectionState.profiles = items;
  return true;
}

function clearProfileDragState() {
  draggedProfileId = "";

  profileList
    ?.querySelectorAll(".profile-item.is-dragging, .profile-item.is-drag-over")
    .forEach((item) => {
      item.classList.remove("is-dragging", "is-drag-over");
    });
}

async function reorderProfile(draggedId, targetId) {

  const didMove = moveProfileBeforeTarget(draggedId, targetId);
  if (!didMove) {
    return;
  }

  renderProfileList();

  try {
    await persistProfileSelection();
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not save profile order.");
    await loadProfileSelection();
  }
}

function normalizePromptResumeEntry(entry) {
  const label = String(entry?.label ?? entry?.name ?? "").trim();
  const content = String(entry?.content ?? entry?.docInput ?? "").trim();

  if (!label || !content) {
    return null;
  }

  return {
    id: String(entry?.id || createProfileId()),
    label,
    content,
    updatedAt: String(entry?.updatedAt || "")
  };
}

function normalizePromptResumeSelection(selection) {
  const promptResumes = (
    Array.isArray(selection?.promptResumes) ? selection.promptResumes : []
  )
    .map(normalizePromptResumeEntry)
    .filter(Boolean);

  const selectedPromptResumeId =
    promptResumes.some(
      (entry) => entry.id === selection?.selectedPromptResumeId
    )
      ? selection.selectedPromptResumeId
      : "";

  return { promptResumes, selectedPromptResumeId };
}

function createDefaultProfile(promptResumeSelection = null, resumeTemplateId = "") {
  const resumes = normalizePromptResumeSelection(promptResumeSelection);

  return {
    id: createProfileId(),
    name: DEFAULT_PROFILE_NAME,
    resumeTemplateId: String(resumeTemplateId || "").trim(),
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
    resumeTemplateId: String(entry?.resumeTemplateId || "").trim(),
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

function getProfileSelectionStateSignature(selection) {
  return JSON.stringify(normalizeProfileSelectionState(selection));
}

function isCurrentProfileSelectionState(selection) {
  return (
    getProfileSelectionStateSignature(selection) ===
    getProfileSelectionStateSignature(profileSelectionState)
  );
}

function getSelectedProfile() {
  return (
    profileSelectionState.profiles.find(
      (entry) => entry.id === profileSelectionState.selectedProfileId
    ) ||
    profileSelectionState.profiles[0] ||
    null
  );
}

function getProfileByName(profileName) {
  const normalizedName = String(profileName || "").trim().toLocaleLowerCase();
  if (!normalizedName) {
    return null;
  }

  return (
    profileSelectionState.profiles.find(
      (profile) =>
        String(profile?.name || "").trim().toLocaleLowerCase() === normalizedName
    ) || null
  );
}

function getSelectedProfiles() {
  const selectedIds = new Set(profileSelectionState.selectedProfileIds);
  return profileSelectionState.profiles.filter((entry) => selectedIds.has(entry.id));
}

function syncPromptResumeStateFromSelectedProfile() {
  const selectedProfile = getSelectedProfile();
  const resumes = normalizePromptResumeSelection(selectedProfile);

  promptResumeSelectionState = {
    promptResumes: resumes.promptResumes,
    selectedPromptResumeId: resumes.selectedPromptResumeId
  };
  renderPromptResumeList();
}

function applyPromptResumeStateToSelectedProfile(
  promptResumes,
  selectedPromptResumeId
) {
  const selectedProfile = getSelectedProfile();
  if (!selectedProfile) {
    return;
  }

  const resumes = normalizePromptResumeSelection({
    promptResumes,
    selectedPromptResumeId
  });

  const profiles = profileSelectionState.profiles.map((entry) =>
    entry.id === selectedProfile.id
      ? {
          ...entry,
          promptResumes: resumes.promptResumes,
          selectedPromptResumeId: resumes.selectedPromptResumeId
        }
      : entry
  );

  profileSelectionState = {
    ...profileSelectionState,
    profiles,
    selectedProfileIds: profiles
      .filter((profile) => Boolean(profile.selectedPromptResumeId))
      .map((profile) => profile.id)
  };
}

function showProfileFormModalStatus(type, message) {
  if (!profileFormModalStatus) return;

  profileFormModalStatus.classList.remove("is-hidden", "is-error", "is-success");
  profileFormModalStatus.textContent = message;
  profileFormModalStatus.classList.add(type === "error" ? "is-error" : "is-success");
}

function clearProfileFormModalStatus() {
  profileFormModalStatus?.classList.add("is-hidden");
  profileFormModalStatus?.classList.remove("is-error", "is-success");
  if (profileFormModalStatus) profileFormModalStatus.textContent = "";
}

function resetProfileFormModal() {
  if (profileNameInput) profileNameInput.value = "";
  if (resumeTemplateInput) resumeTemplateInput.value = "";
  clearProfileFormModalStatus();
}

function updateProfileFormModalCopy() {
  const isEdit = profileFormMode === "edit";

  if (profileFormModalTitle) {
    profileFormModalTitle.textContent = isEdit ? "Edit profile" : "Add profile";
  }

  if (profileFormModalHelp) {
    profileFormModalHelp.textContent = isEdit
      ? "Update this profile name and resume template."
      : "Set the profile name and resume template.";
  }

  if (profileFormModalSubmitButton) {
    profileFormModalSubmitButton.textContent = isEdit ? "Save Changes" : "Add profile";
  }

  if (profileFormModalBackdrop) {
    profileFormModalBackdrop.setAttribute(
      "aria-label",
      isEdit ? "Close edit profile dialog" : "Close add profile dialog"
    );
  }
}

function setProfileFormModalOpen(isOpen) {
  if (!profileFormModal) return;

  profileFormModal.classList.toggle("is-hidden", !isOpen);
  profileFormModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    updateProfileFormModalCopy();
    clearProfileFormModalStatus();
    profileNameInput?.focus();
    return;
  }

  profileFormMode = "add";
  editingProfileId = null;
  resetProfileFormModal();
  updateProfileFormModalCopy();
  addProfileButton?.focus();
}

function setProfileNotesModalOpen(isOpen) {
  if (!profileNotesModal) return;

  profileNotesModal.classList.toggle("is-hidden", !isOpen);
  profileNotesModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    profileNotesInput?.focus();
    return;
  }

  notesProfileId = null;
  if (profileNotesInput) {
    profileNotesInput.value = "";
    profileNotesInput.readOnly = false;
  }
  if (profileNotesModalSubmitButton) {
    profileNotesModalSubmitButton.hidden = false;
    profileNotesModalSubmitButton.disabled = false;
  }
  profileList
    ?.querySelector(".profile-item.is-expanded .profile-notes")
    ?.focus();
}

function openProfileNotesModal(profileId) {

  const profile = profileSelectionState.profiles.find((entry) => entry.id === profileId);
  if (!profile) {
    addLog("error", "Selected profile could not be found.");
    return;
  }

  notesProfileId = profile.id;

  if (profileNotesModalTitle) {
    profileNotesModalTitle.textContent = `Notes · ${profile.name}`;
  }

  if (profileNotesModalHelp) {
    profileNotesModalHelp.textContent = `Keep notes for ${profile.name}.`;
  }

  if (profileNotesInput) {
    profileNotesInput.value = profile.notes || "";
    profileNotesInput.readOnly = false;
  }
  if (profileNotesModalSubmitButton) {
    profileNotesModalSubmitButton.hidden = false;
    profileNotesModalSubmitButton.disabled = false;
  }

  setProfileNotesModalOpen(true);
}

function openApplicationWorkspaceNotesModal() {
  if (!hasActiveSaveWorkspaceForCurrentTab()) {
    showStatus("error", "No active Application workspace profile.");
    return;
  }

  const workspace = currentSaveWorkspace;
  const profileName = String(
    workspace.profileName || DEFAULT_PROFILE_NAME
  ).trim();
  const savedProfile = getProfileByName(profileName);

  if (savedProfile) {
    openProfileNotesModal(savedProfile.id);
    return;
  }

  notesProfileId = null;
  if (profileNotesModalTitle) {
    profileNotesModalTitle.textContent = `Notes - ${profileName}`;
  }
  if (profileNotesModalHelp) {
    profileNotesModalHelp.textContent =
      "This workspace profile is not saved, so its notes are read-only.";
  }
  if (profileNotesInput) {
    profileNotesInput.value =
      String(workspace.profileNotes || "").trim() ||
      "No notes are available for this profile.";
    profileNotesInput.readOnly = true;
  }
  if (profileNotesModalSubmitButton) {
    profileNotesModalSubmitButton.hidden = true;
  }
  setProfileNotesModalOpen(true);
}

async function submitProfileNotesForm() {
  if (!notesProfileId) {
    addLog("error", "No profile selected for notes.");
    return;
  }

  const notes = profileNotesInput?.value.trim() || "";
  const profile = profileSelectionState.profiles.find(
    (entry) => entry.id === notesProfileId
  );

  if (!profile) {
    addLog("error", "Selected profile could not be found.");
    return;
  }

  if (profileNotesModalSubmitButton) {
    profileNotesModalSubmitButton.disabled = true;
  }

  try {
    profileSelectionState.profiles = profileSelectionState.profiles.map((entry) =>
      entry.id === notesProfileId ? { ...entry, notes } : entry
    );

    await persistProfileSelection(`Notes saved for "${profile.name}".`);
    setProfileNotesModalOpen(false);
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not save profile notes.");
  } finally {
    if (profileNotesModalSubmitButton) {
      profileNotesModalSubmitButton.disabled = false;
    }
  }
}

function openAddProfileModal() {

  profileFormMode = "add";
  editingProfileId = null;
  resetProfileFormModal();
  setProfileFormModalOpen(true);
}

function openEditProfileModal(profileId) {

  const profile = profileSelectionState.profiles.find((entry) => entry.id === profileId);
  if (!profile) {
    addLog("error", "Selected profile could not be found.");
    return;
  }

  profileFormMode = "edit";
  editingProfileId = profile.id;

  if (profileNameInput) profileNameInput.value = profile.name;
  if (resumeTemplateInput) {
    resumeTemplateInput.value = profile.resumeTemplateId || "";
  }
  setProfileFormModalOpen(true);
}

function parkProfilePromptResumeSection() {
  if (!profilePromptResumeSection || !profileList?.parentElement) {
    return;
  }

  profilePromptResumeSection.classList.add("is-hidden");
  profilePromptResumeSection.hidden = true;
  profileList.parentElement.insertBefore(
    profilePromptResumeSection,
    profileList.nextSibling
  );
}

function mountProfilePromptResumeSection(body) {
  if (!profilePromptResumeSection || !body) {
    return;
  }

  profilePromptResumeSection.classList.remove("is-hidden");
  profilePromptResumeSection.hidden = false;
  body.append(profilePromptResumeSection);
}

async function activateProfilePromptResume(profileId, promptResumeId) {

  if (profileSelectionState.selectedProfileId !== profileId) {
    await selectProfile(profileId);
  }

  if (profileSelectionState.selectedProfileId === profileId) {
    await selectPromptResume(promptResumeId);
  }
}

function renderProfilePromptResumeMirror(profile, body) {
  const list = document.createElement("ul");
  list.className = "prompt-resume-list profile-prompt-resume-mirror";
  list.setAttribute("aria-label", `${profile.name} prompt resumes`);

  if (profile.promptResumes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "prompt-resume-list-empty";
    empty.textContent = "No prompt resumes yet. Add one above.";
    list.appendChild(empty);
    body.appendChild(list);
    return;
  }

  profile.promptResumes.forEach((promptResume) => {
    const isSelected = promptResume.id === profile.selectedPromptResumeId;
    const item = document.createElement("li");
    item.className = "prompt-resume-item";
    item.classList.toggle("is-selected", isSelected);

    const dragSpacer = document.createElement("span");
    dragSpacer.className = "prompt-resume-drag-spacer";
    dragSpacer.setAttribute("aria-hidden", "true");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `promptResume-${profile.id}`;
    radio.value = promptResume.id;
    radio.checked = isSelected;
    radio.setAttribute("aria-label", `Use ${promptResume.label} for ${profile.name}`);

    const copy = document.createElement("div");
    copy.className = "prompt-resume-copy";

    const label = document.createElement("span");
    label.className = "prompt-resume-label";
    label.textContent = promptResume.label;

    const preview = document.createElement("span");
    preview.className = "prompt-resume-preview";
    preview.textContent = truncatePreviewText(promptResume.content);
    copy.append(label, preview);

    const updatedAtText = formatPromptResumeUpdatedAt(promptResume.updatedAt);
    if (updatedAtText) {
      const updated = document.createElement("span");
      updated.className = "prompt-resume-updated";
      updated.textContent = updatedAtText;
      copy.append(updated);
    }

    const actions = document.createElement("span");
    actions.className = "prompt-resume-actions";
    actions.setAttribute("aria-hidden", "true");

    item.addEventListener("click", () => {
      activateProfilePromptResume(profile.id, promptResume.id);
    });
    radio.addEventListener("click", (event) => {
      event.stopPropagation();
      activateProfilePromptResume(profile.id, promptResume.id);
    });

    item.append(dragSpacer, radio, copy, actions);
    list.appendChild(item);
  });

  body.appendChild(list);
}

function renderProfileList() {
  if (!profileList) return;

  parkProfilePromptResumeSection();
  profileList.innerHTML = "";

  if (profileSelectionState.profiles.length === 0) {
    const empty = document.createElement("p");
    empty.className = "profile-list-empty";
    empty.textContent = "No profiles yet. Add one below.";
    profileList.appendChild(empty);
    return;
  }

  profileSelectionState.profiles.forEach((profile) => {
    const isExpanded = expandedProfileIds.has(profile.id);
    const isSelected = profileSelectionState.selectedProfileIds.includes(profile.id);
    const bodyId = `profile-body-${profile.id}`;

    const item = document.createElement("li");
    item.className = "profile-item";
    item.dataset.profileId = profile.id;
    item.classList.toggle("is-expanded", isExpanded);
    item.classList.toggle("is-selected", isSelected);

    const header = document.createElement("div");
    header.className = "profile-item-header";

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "profile-drag-handle";
    dragHandle.draggable = true;
    dragHandle.setAttribute("aria-label", `Reorder ${profile.name}`);
    dragHandle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
      </svg>
    `;
    dragHandle.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    dragHandle.addEventListener("dragstart", (event) => {

      draggedProfileId = profile.id;
      item.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", profile.id);
    });
    dragHandle.addEventListener("dragend", () => {
      clearProfileDragState();
    });

    const selectionCheckbox = document.createElement("input");
    const hasSelectedPromptResume = Boolean(profile.selectedPromptResumeId);
    selectionCheckbox.type = "checkbox";
    selectionCheckbox.className = "profile-selection-checkbox";
    selectionCheckbox.checked = isSelected;
    selectionCheckbox.dataset.hasSelectedPromptResume = String(
      hasSelectedPromptResume
    );
    selectionCheckbox.disabled =
      areActionButtonsDisabled || !hasSelectedPromptResume;
    selectionCheckbox.setAttribute(
      "aria-label",
      `${isSelected ? "Remove" : "Add"} ${profile.name} ${
        isSelected ? "from" : "to"
      } this application`
    );
    selectionCheckbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    selectionCheckbox.addEventListener("change", async () => {

      await toggleProfileSelection(profile.id);
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      if (draggedProfileId && draggedProfileId !== profile.id) {
        item.classList.add("is-drag-over");
      }
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("is-drag-over");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.classList.remove("is-drag-over");

      const draggedId = event.dataTransfer.getData("text/plain") || draggedProfileId;
      reorderProfile(draggedId, profile.id);
      clearProfileDragState();
    });

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "profile-item-toggle";
    toggle.setAttribute("aria-expanded", String(isExpanded));
    toggle.setAttribute("aria-controls", bodyId);
    toggle.setAttribute(
      "aria-label",
      isExpanded ? `${profile.name} (expanded)` : `Expand ${profile.name}`
    );

    const copy = document.createElement("div");
    copy.className = "profile-copy";

    const label = document.createElement("span");
    label.className = "profile-label";
    label.textContent = profile.name;
    copy.append(label);

    const chevron = document.createElement("span");
    chevron.className = "profile-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    `;

    toggle.append(copy, chevron);
    toggle.addEventListener("click", () => {
      toggleProfileExpand(profile.id);
    });

    const actions = document.createElement("div");
    actions.className = "profile-actions";

    const addPromptResumeButton = document.createElement("button");
    addPromptResumeButton.type = "button";
    addPromptResumeButton.className = "profile-add-prompt-resume";
    addPromptResumeButton.textContent = "+";
    addPromptResumeButton.setAttribute(
      "aria-label",
      `Add a prompt resume to ${profile.name}`
    );
    addPromptResumeButton.addEventListener("click", async (event) => {
      event.stopPropagation();


      if (profile.id !== profileSelectionState.selectedProfileId) {
        await selectProfile(profile.id);
      }

      openAddPromptResumeModal();
    });

    const notesButton = document.createElement("button");
    notesButton.type = "button";
    notesButton.className = "profile-notes";
    notesButton.setAttribute("aria-label", `Notes for ${profile.name}`);
    notesButton.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    `;
    notesButton.addEventListener("click", async (event) => {
      event.stopPropagation();


      if (profile.id !== profileSelectionState.selectedProfileId) {
        await selectProfile(profile.id);
      }

      openProfileNotesModal(profile.id);
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "profile-edit";
    editButton.setAttribute("aria-label", `Edit ${profile.name}`);
    editButton.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    `;
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openEditProfileModal(profile.id);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "profile-remove";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${profile.name}`);
    removeButton.disabled = profileSelectionState.profiles.length <= 1;
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      removeProfile(profile.id);
    });

    actions.append(addPromptResumeButton, notesButton, editButton, removeButton);
    header.append(dragHandle, selectionCheckbox, toggle, actions);

    const body = document.createElement("div");
    body.id = bodyId;
    body.className = "profile-item-body";
    body.hidden = !isExpanded;

    if (isExpanded && profile.id === profileSelectionState.selectedProfileId) {
      mountProfilePromptResumeSection(body);
    } else if (isExpanded) {
      renderProfilePromptResumeMirror(profile, body);
    }

    item.append(header, body);
    profileList.appendChild(item);
  });
}

async function persistProfileSelection(successMessage) {
  const response = await chrome.runtime.sendMessage({
    type: "SAVE_PROFILE_SELECTION",
    profiles: profileSelectionState.profiles,
    selectedProfileId: profileSelectionState.selectedProfileId,
    selectedProfileIds: profileSelectionState.selectedProfileIds,
    selectionVersion: profileSelectionState.selectionVersion
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Could not save profile selection.");
  }

  profileSelectionState = normalizeProfileSelectionState(response);

  const validProfileIds = new Set(
    profileSelectionState.profiles.map((entry) => entry.id)
  );
  expandedProfileIds = new Set(
    [
      ...Array.from(expandedProfileIds).filter((id) => validProfileIds.has(id)),
      ...profileSelectionState.selectedProfileIds
    ]
  );

  syncPromptResumeStateFromSelectedProfile();
  renderProfileList();

  if (successMessage) {
    addLog("success", successMessage);
  }
}

async function toggleProfileSelection(profileId) {
  const profile = profileSelectionState.profiles.find(
    (entry) => entry.id === profileId
  );
  if (!profile) {
    return;
  }

  const selectedIds = new Set(profileSelectionState.selectedProfileIds);
  const willSelect = !selectedIds.has(profileId);
  if (willSelect && !profile.selectedPromptResumeId) {
    renderProfileList();
    return;
  }

  if (willSelect) {
    selectedIds.add(profileId);
    profileSelectionState.selectedProfileId = profileId;
    expandedProfileIds.add(profileId);
  } else {
    selectedIds.delete(profileId);
    expandedProfileIds.delete(profileId);
    profileSelectionState.profiles = profileSelectionState.profiles.map(
      (entry) =>
        entry.id === profileId
          ? { ...entry, selectedPromptResumeId: "" }
          : entry
    );
  }

  profileSelectionState.selectedProfileIds = profileSelectionState.profiles
    .map((entry) => entry.id)
    .filter((id) => selectedIds.has(id));

  try {
    await persistProfileSelection(
      willSelect
        ? `Added "${profile.name}" to this application.`
        : `Removed "${profile.name}" from this application.`
    );
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not update profile selection.");
    await loadProfileSelection();
  }
}

async function loadProfileSelection() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_PROFILE_SELECTION"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load profiles.");
    }

    profileSelectionState = normalizeProfileSelectionState(response);
    expandedProfileIds = new Set(profileSelectionState.selectedProfileIds);
    syncPromptResumeStateFromSelectedProfile();
    renderProfileList();
  } catch (error) {
    console.error(error);
    profileSelectionState = normalizeProfileSelectionState(null);
    expandedProfileIds = new Set();
    syncPromptResumeStateFromSelectedProfile();
    renderProfileList();
    addLog("error", error.message || "Could not load profiles.");
  }
}

async function toggleProfileExpand(profileId) {

  const isSelected = profileSelectionState.selectedProfileIds.includes(profileId);
  if (expandedProfileIds.has(profileId)) {
    if (isSelected) {
      if (profileId !== profileSelectionState.selectedProfileId) {
        await selectProfile(profileId);
      }
      return;
    }

    expandedProfileIds.delete(profileId);
    renderProfileList();
    return;
  }

  expandedProfileIds.add(profileId);

  if (profileId !== profileSelectionState.selectedProfileId) {
    await selectProfile(profileId);
    return;
  }

  syncPromptResumeStateFromSelectedProfile();
  renderProfileList();
}

async function selectProfile(profileId) {

  expandedProfileIds.add(profileId);

  if (profileId === profileSelectionState.selectedProfileId) {
    syncPromptResumeStateFromSelectedProfile();
    renderProfileList();
    return;
  }

  const profile = profileSelectionState.profiles.find((entry) => entry.id === profileId);
  profileSelectionState.selectedProfileId = profileId;

  try {
    await persistProfileSelection(`Editing profile: ${profile?.name || profileId}`);
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not update profile selection.");
    await loadProfileSelection();
  }
}

async function removeProfile(profileId) {

  if (profileSelectionState.profiles.length <= 1) {
    addLog("error", "At least one profile is required.");
    return;
  }

  const removed = profileSelectionState.profiles.find((entry) => entry.id === profileId);
  profileSelectionState.profiles = profileSelectionState.profiles.filter(
    (entry) => entry.id !== profileId
  );
  profileSelectionState.selectedProfileIds =
    profileSelectionState.selectedProfileIds.filter((id) => id !== profileId);

  if (profileSelectionState.selectedProfileId === profileId) {
    profileSelectionState.selectedProfileId =
      profileSelectionState.profiles[0]?.id || "";
  }

  expandedProfileIds.delete(profileId);

  try {
    await persistProfileSelection(
      removed ? `"${removed.name}" removed.` : "Profile removed."
    );
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not remove profile.");
    await loadProfileSelection();
  }
}

async function submitProfileForm() {
  clearProfileFormModalStatus();

  const name = profileNameInput?.value.trim() || "";
  const resumeTemplateId = resumeTemplateInput?.value.trim() || "";

  if (!name) {
    const message = "Enter a profile name.";
    showProfileFormModalStatus("error", message);
    profileNameInput?.focus();
    return;
  }

  if (!resumeTemplateId) {
    const message = "Enter a Resume Google Doc URL or document ID.";
    showProfileFormModalStatus("error", message);
    resumeTemplateInput?.focus();
    return;
  }

  const isEdit = profileFormMode === "edit" && editingProfileId;

  if (profileFormModalSubmitButton) {
    profileFormModalSubmitButton.disabled = true;
  }

  try {
    if (isEdit) {
      profileSelectionState.profiles = profileSelectionState.profiles.map((entry) =>
        entry.id === editingProfileId
          ? { ...entry, name, resumeTemplateId }
          : entry
      );
    } else {
      const profile = {
        id: createProfileId(),
        name,
        resumeTemplateId,
        notes: "",
        promptResumes: [],
        selectedPromptResumeId: ""
      };
      profileSelectionState.profiles = [...profileSelectionState.profiles, profile];
      profileSelectionState.selectedProfileId = profile.id;
      expandedProfileIds.add(profile.id);
    }

    await persistProfileSelection(
      isEdit ? `"${name}" updated.` : `"${name}" added.`
    );
    setProfileFormModalOpen(false);
  } catch (error) {
    console.error(error);
    const message =
      error.message || (isEdit ? "Could not update profile." : "Could not add profile.");
    showProfileFormModalStatus("error", message);
    addLog("error", message);
  } finally {
    if (profileFormModalSubmitButton) {
      profileFormModalSubmitButton.disabled = false;
    }
  }
}

function isGoogleSheetsDocumentUrl(url = "") {
  try {
    const parsed = new URL(String(url || ""));
    return (
      parsed.hostname === "docs.google.com" &&
      /\/spreadsheets\/(?:u\/\d+\/)?d\/[a-zA-Z0-9-_]+/.test(parsed.pathname)
    );
  } catch (_error) {
    return false;
  }
}

function updateSaveButtonDisabledState() {
  if (!saveButton) {
    return;
  }

  const isDisabled = areActionButtonsDisabled || isCurrentTabGoogleSheet;
  saveButton.disabled = isDisabled;
  saveButton.setAttribute("aria-disabled", String(isDisabled));

  if (isCurrentTabGoogleSheet) {
    saveButton.title = "Save App is unavailable while the current tab is a Google Sheet.";
  } else {
    saveButton.removeAttribute("title");
  }
}

function updateMakeResumeButtonDisabledState() {
  if (!openSplitWindowsButton) {
    return;
  }

  const isDisabled =
    areActionButtonsDisabled || isMakeResumeOpening || !isCurrentTabGoogleSheet;
  openSplitWindowsButton.disabled = isDisabled;
  openSplitWindowsButton.setAttribute("aria-disabled", String(isDisabled));

  if (isCurrentTabGoogleSheet) {
    openSplitWindowsButton.removeAttribute("title");
  } else {
    openSplitWindowsButton.title =
      "Make a resume is available only when the current tab is a Google Sheet.";
  }
}

async function refreshMakeResumeButtonAvailability() {
  const requestId = ++makeResumeAvailabilityRequestId;

  try {
    const [tab] = Number.isInteger(activeTabId)
      ? [await chrome.tabs.get(activeTabId)]
      : await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        });

    if (requestId !== makeResumeAvailabilityRequestId) {
      return;
    }

    isCurrentTabGoogleSheet = isGoogleSheetsDocumentUrl(tab?.url || "");
  } catch (error) {
    if (requestId !== makeResumeAvailabilityRequestId) {
      return;
    }

    console.error("Could not check the current tab for Google Sheets:", error);
    isCurrentTabGoogleSheet = false;
  }

  updateMakeResumeButtonDisabledState();
  updateSaveButtonDisabledState();
}

function setSaveButtonsDisabled(disabled) {
  areActionButtonsDisabled = Boolean(disabled);

  updateSaveButtonDisabledState();
  updateMakeResumeButtonDisabledState();
  updateSaveWorkspaceActions();
  renderSavePostProcessControls();
  if (splitWindowsModalOpenButton) splitWindowsModalOpenButton.disabled = disabled;
  if (splitWindowsPreviewBackButton) {
    splitWindowsPreviewBackButton.disabled =
      disabled && currentSplitWindowSessionType !== "save-workspace";
  }
  if (splitWindowsPreviewDownloadButton) {
    splitWindowsPreviewDownloadButton.disabled = disabled;
  }
  if (saveConfigButton) saveConfigButton.disabled = disabled;
  if (exportAppDataButton) exportAppDataButton.disabled = disabled;
  if (importAppDataButton) importAppDataButton.disabled = disabled;
  if (includePromptResumeInfoCheckbox) {
    includePromptResumeInfoCheckbox.disabled = disabled;
  }
  if (addProfileButton) addProfileButton.disabled = disabled;
  profileList
    ?.querySelectorAll(
      ".profile-add-prompt-resume, .profile-notes, .profile-selection-checkbox"
    )
    .forEach((control) => {
      const isUnavailableProfileCheckbox =
        control.classList.contains("profile-selection-checkbox") &&
        control.dataset.hasSelectedPromptResume !== "true";
      control.disabled = disabled || isUnavailableProfileCheckbox;
    });
  if (profileFormModalSubmitButton) profileFormModalSubmitButton.disabled = disabled;
  if (profileNotesModalSubmitButton) profileNotesModalSubmitButton.disabled = disabled;
  if (promptResumeFormModalSubmitButton) promptResumeFormModalSubmitButton.disabled = disabled;
  if (promptFormModalSubmitButton) promptFormModalSubmitButton.disabled = disabled;
  if (humanizeFormModalSubmitButton) humanizeFormModalSubmitButton.disabled = disabled;
  if (jobDescriptionFormModalSubmitButton) jobDescriptionFormModalSubmitButton.disabled = disabled;
}

function setSaveButtonsDisabledForTab(tabId, disabled) {
  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.areActionButtonsDisabled = Boolean(disabled);
    }
    return;
  }

  setSaveButtonsDisabled(disabled);
}

function isSavePostProcessActive(state = savePostProcessState) {
  return Boolean(state && typeof state === "object" && state.runId);
}

function renderSavePostProcessControls() {
  const hasState = isSavePostProcessActive();
  const applicationControlsVisible = hasState && !isSplitWindowsDialogOpen;
  const exchangeDisabled = hasState;

  const progressStatuses = [
    {
      element: homeSavePostProcessTime,
      visible: hasState
    },
    {
      element: applicationSavePostProcessTime,
      visible: applicationControlsVisible
    }
  ];

  progressStatuses.forEach(({ element, visible }) => {
    if (!element) return;
    element.classList.toggle("is-hidden", !visible);
    element.textContent = "Save progress";
    element.setAttribute("aria-label", "Save progress");
  });

  homeCancelProcessButton?.classList.toggle("is-hidden", !hasState);
  applicationCancelProcessButton?.classList.toggle(
    "is-hidden",
    !applicationControlsVisible
  );

  if (homeCancelProcessButton) {
    homeCancelProcessButton.disabled = isSavePostProcessRequestPending;
  }
  if (applicationCancelProcessButton) {
    applicationCancelProcessButton.disabled = isSavePostProcessRequestPending;
  }
  if (homeWorkspaceExchangeButton) {
    homeWorkspaceExchangeButton.disabled = exchangeDisabled;
  }
  if (splitWindowsModalCloseButton) {
    splitWindowsModalCloseButton.disabled =
      !isSplitWindowsDialogOpen && exchangeDisabled;
  }

}

function setSavePostProcessStateForTab(tabId, state) {
  const normalized = state && typeof state === "object" ? state : null;

  if (!isActiveTab(tabId)) {
    const tabState = getTabState(tabId);
    if (tabState) {
      tabState.savePostProcessState = normalized;
    }
    return;
  }

  savePostProcessState = normalized;
  renderSavePostProcessControls();
}

// The service worker stores one save-progress record per owning tab, so spread
// the stored map back across the per-tab states.
function applySavePostProcessStates(statesByTabId) {
  const map =
    statesByTabId && typeof statesByTabId === "object" ? statesByTabId : {};
  const presentTabIds = new Set();

  Object.entries(map).forEach(([key, value]) => {
    const tabId = Number(key);
    if (!Number.isInteger(tabId)) {
      return;
    }

    presentTabIds.add(tabId);
    setSavePostProcessStateForTab(tabId, value);
  });

  tabStateById.forEach((_state, tabId) => {
    if (!presentTabIds.has(tabId)) {
      setSavePostProcessStateForTab(tabId, null);
    }
  });

  if (Number.isInteger(activeTabId) && !presentTabIds.has(activeTabId)) {
    setSavePostProcessStateForTab(activeTabId, null);
  }
}

function setSavePostProcessRequestPendingForTab(tabId, isPending) {
  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.isSavePostProcessRequestPending = Boolean(isPending);
    }
    return;
  }

  isSavePostProcessRequestPending = Boolean(isPending);
  renderSavePostProcessControls();
}

async function cancelSavePostProcess() {
  if (isSavePostProcessRequestPending || !savePostProcessState) {
    return;
  }

  const ownerTabId = activeTabId;
  const runId = savePostProcessState?.runId || activeRunId;
  setSavePostProcessRequestPendingForTab(ownerTabId, true);

  try {
    const response = await chrome.runtime.sendMessage({
      type: "CANCEL_SAVE_POST_PROCESS",
      runId,
      ownerTabId
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not cancel the save process.");
    }
    setSavePostProcessStateForTab(ownerTabId, null);
    addLogForTab(
      ownerTabId,
      "info",
      "Save process cancelled. Any completed tabs and saved application data were kept."
    );
  } catch (error) {
    console.error("Could not cancel the save process:", error);
    addLogForTab(
      ownerTabId,
      "error",
      error.message || "Could not cancel the save process."
    );
  } finally {
    setSavePostProcessRequestPendingForTab(ownerTabId, false);
  }
}

async function loadSavePostProcessState() {
  try {
    const stored = await chrome.storage.local.get(
      SAVE_POST_PROCESS_STORAGE_KEY
    );
    applySavePostProcessStates(stored[SAVE_POST_PROCESS_STORAGE_KEY]);
  } catch (error) {
    console.error("Could not load save progress:", error);
    applySavePostProcessStates(null);
  }
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

function normalizeJobDescriptionPreview(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function formatPromptResumeUpdatedAt(updatedAt = "") {
  const iso = normalizePromptResumeUpdatedAtForDisplay(updatedAt);
  if (!iso) {
    return "";
  }

  return `Updated ${new Date(iso).toLocaleString()}`;
}

function normalizePromptResumeUpdatedAtForDisplay(value) {
  const date = new Date(value ?? "");
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
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
  profileList
    ?.querySelector(".profile-item.is-expanded .profile-add-prompt-resume")
    ?.focus();
}

function openAddPromptResumeModal() {

  addLog("info", "Add a Prompt Resume clicked.");
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
    const message = "Selected prompt resume could not be found.";
    addLog("error", message);
    return;
  }

  addLog("info", `Editing prompt resume: ${promptResume.label}`);

  promptResumeFormMode = "edit";
  editingPromptResumeId = promptResume.id;

  if (promptResumeLabelInput) promptResumeLabelInput.value = promptResume.label;
  if (promptResumeContentInput) {
    promptResumeContentInput.value = promptResume.content || "";
  }

  setPromptResumeFormModalOpen(true);
}

let promptResumeSelectionState = {
  promptResumes: [],
  selectedPromptResumeId: ""
};

let draggedPromptResumeId = "";

function movePromptResumeBeforeTarget(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) {
    return false;
  }

  const items = [...promptResumeSelectionState.promptResumes];
  const fromIndex = items.findIndex((entry) => entry.id === draggedId);
  const toIndex = items.findIndex((entry) => entry.id === targetId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return false;
  }

  const [movedItem] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, movedItem);
  promptResumeSelectionState.promptResumes = items;
  return true;
}

function clearPromptResumeDragState() {
  draggedPromptResumeId = "";

  promptResumeList
    ?.querySelectorAll(".prompt-resume-item.is-dragging, .prompt-resume-item.is-drag-over")
    .forEach((item) => {
      item.classList.remove("is-dragging", "is-drag-over");
    });
}

async function reorderPromptResume(draggedId, targetId) {
  const didMove = movePromptResumeBeforeTarget(draggedId, targetId);
  if (!didMove) {
    return;
  }

  renderPromptResumeList();

  try {
    await persistPromptResumeSelection();
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not save prompt resume order.");
    await loadPromptResumeSelection();
  }
}

function renderPromptResumeList() {
  if (!promptResumeList) return;

  promptResumeList.innerHTML = "";

  if (promptResumeSelectionState.promptResumes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "prompt-resume-list-empty";
    empty.textContent = "No prompt resumes yet. Add one below.";
    promptResumeList.appendChild(empty);
    return;
  }

  promptResumeSelectionState.promptResumes.forEach((promptResume) => {
    const item = document.createElement("li");
    item.className = "prompt-resume-item";
    item.dataset.promptResumeId = promptResume.id;
    item.classList.toggle(
      "is-selected",
      promptResume.id === promptResumeSelectionState.selectedPromptResumeId
    );

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "prompt-resume-drag-handle";
    dragHandle.draggable = true;
    dragHandle.setAttribute("aria-label", `Reorder ${promptResume.label}`);
    dragHandle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
      </svg>
    `;
    dragHandle.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    dragHandle.addEventListener("dragstart", (event) => {
      draggedPromptResumeId = promptResume.id;
      item.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", promptResume.id);
    });
    dragHandle.addEventListener("dragend", () => {
      clearPromptResumeDragState();
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      if (draggedPromptResumeId && draggedPromptResumeId !== promptResume.id) {
        item.classList.add("is-drag-over");
      }
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("is-drag-over");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.classList.remove("is-drag-over");

      const draggedId =
        event.dataTransfer.getData("text/plain") || draggedPromptResumeId;
      reorderPromptResume(draggedId, promptResume.id);
      clearPromptResumeDragState();
    });

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

    const updatedAtText = formatPromptResumeUpdatedAt(promptResume.updatedAt);
    if (updatedAtText) {
      const updated = document.createElement("span");
      updated.className = "prompt-resume-updated";
      updated.textContent = updatedAtText;
      copy.append(updated);
    }

    const actions = document.createElement("div");
    actions.className = "prompt-resume-actions";

    const isSelected =
      promptResume.id === promptResumeSelectionState.selectedPromptResumeId;

    if (isSelected) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "prompt-resume-edit";
      editButton.setAttribute("aria-label", `View or edit ${promptResume.label}`);
      editButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      `;
      editButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openEditPromptResumeModal(promptResume.id);
      });
      actions.append(editButton);
    }

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "prompt-resume-remove";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${promptResume.label}`);
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      removePromptResume(promptResume.id);
    });

    actions.append(removeButton);

    item.addEventListener("click", () => {
      selectPromptResume(promptResume.id);
    });

    radio.addEventListener("click", (event) => {
      event.stopPropagation();
      selectPromptResume(promptResume.id);
    });

    item.append(dragHandle, radio, copy, actions);
    promptResumeList.appendChild(item);
  });
}

async function loadPromptResumeSelection() {
  try {
    if (!profileSelectionState.profiles.length) {
      await loadProfileSelection();
      return;
    }

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
    applyPromptResumeStateToSelectedProfile(
      promptResumeSelectionState.promptResumes,
      promptResumeSelectionState.selectedPromptResumeId
    );
    renderPromptResumeList();
    renderProfileList();
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not load prompt resumes.";
    addLog("error", message);
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
  applyPromptResumeStateToSelectedProfile(
    promptResumeSelectionState.promptResumes,
    promptResumeSelectionState.selectedPromptResumeId
  );
  renderPromptResumeList();
  renderProfileList();

  if (successMessage) {
    addLog("success", successMessage);
  }
}

async function selectPromptResume(promptResumeId) {
  const selectedProfile = getSelectedProfile();
  const isProfileChecked = Boolean(
    selectedProfile &&
      profileSelectionState.selectedProfileIds.includes(selectedProfile.id)
  );
  if (
    promptResumeId === promptResumeSelectionState.selectedPromptResumeId &&
    isProfileChecked
  ) {
    return;
  }

  const promptResume = promptResumeSelectionState.promptResumes.find(
    (entry) => entry.id === promptResumeId
  );
  if (!promptResume || !selectedProfile) {
    addLog("error", "Could not find the selected profile resume.");
    return;
  }

  promptResumeSelectionState.selectedPromptResumeId = promptResumeId;
  applyPromptResumeStateToSelectedProfile(
    promptResumeSelectionState.promptResumes,
    promptResumeId
  );

  if (!isProfileChecked) {
    const selectedIds = new Set([
      ...profileSelectionState.selectedProfileIds,
      selectedProfile.id
    ]);
    profileSelectionState.selectedProfileIds = profileSelectionState.profiles
      .map((entry) => entry.id)
      .filter((id) => selectedIds.has(id));
  }

  addLog("info", `Selected prompt resume: ${promptResume?.label || promptResumeId}`);

  try {
    await persistProfileSelection(
      isProfileChecked
        ? "Prompt resume selection updated."
        : `Prompt resume selected and "${selectedProfile.name}" added to this application.`
    );
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not update selection.";
    addLog("error", message);
    await loadProfileSelection();
  }
}

async function removePromptResume(promptResumeId) {
  const removed = promptResumeSelectionState.promptResumes.find(
    (entry) => entry.id === promptResumeId
  );
  addLog("info", `Removing prompt resume: ${removed?.label || promptResumeId}`);

  promptResumeSelectionState.promptResumes =
    promptResumeSelectionState.promptResumes.filter(
      (entry) => entry.id !== promptResumeId
    );

  if (promptResumeSelectionState.selectedPromptResumeId === promptResumeId) {
    promptResumeSelectionState.selectedPromptResumeId = "";
  }

  try {
    const message =
      promptResumeSelectionState.promptResumes.length === 0
        ? "All prompt resumes removed."
        : "Prompt resume removed.";
    await persistPromptResumeSelection(message);
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not remove prompt resume.";
    addLog("error", message);
    await loadPromptResumeSelection();
  }
}

async function submitPromptResumeForm() {
  clearPromptResumeFormModalStatus();

  const label = promptResumeLabelInput?.value.trim() || "";
  const content = promptResumeContentInput?.value.trim() || "";

  if (!label) {
    const message = "Enter a label for the prompt resume.";
    showPromptResumeFormModalStatus("error", message);
    addLog("error", message);
    promptResumeLabelInput?.focus();
    return;
  }

  if (!content) {
    const message = "Enter the prompt resume text.";
    showPromptResumeFormModalStatus("error", message);
    addLog("error", message);
    promptResumeContentInput?.focus();
    return;
  }

  const isEdit = promptResumeFormMode === "edit" && editingPromptResumeId;
  addLog(
    "info",
    isEdit ? `Saving prompt resume changes: ${label}` : `Adding prompt resume: ${label}`
  );

  if (promptResumeFormModalSubmitButton) {
    promptResumeFormModalSubmitButton.disabled = true;
  }

  const updatedAt = new Date().toISOString();
  const promptResumes = isEdit
    ? promptResumeSelectionState.promptResumes.map((entry) =>
        entry.id === editingPromptResumeId
          ? { id: entry.id, label, content, updatedAt }
          : entry
      )
    : [...promptResumeSelectionState.promptResumes, { label, content, updatedAt }];

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
    applyPromptResumeStateToSelectedProfile(
      promptResumeSelectionState.promptResumes,
      promptResumeSelectionState.selectedPromptResumeId
    );

    setPromptResumeFormModalOpen(false);
    renderPromptResumeList();
    renderProfileList();
    const successMessage = isEdit ? `"${label}" updated.` : `"${label}" added.`;
    addLog("success", successMessage);
  } catch (error) {
    console.error(error);
    const message =
      error.message ||
      (isEdit ? "Could not update prompt resume." : "Could not add prompt resume.");
    showPromptResumeFormModalStatus("error", message);
    addLog("error", message);
  } finally {
    if (promptResumeFormModalSubmitButton) {
      promptResumeFormModalSubmitButton.disabled = false;
    }
  }
}

let promptState = {
  content: "",
  updatedAt: ""
};

function setPromptFormModalOpen(isOpen) {
  if (!promptFormModal) return;

  promptFormModal.classList.toggle("is-hidden", !isOpen);
  promptFormModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    if (promptContentInput) {
      promptContentInput.value = promptState.content || "";
    }
    promptContentInput?.focus();
    return;
  }

  if (promptContentInput) promptContentInput.value = "";
  promptList
    ?.querySelector(".prompt-selection-edit, .prompt-selection-list-empty-action")
    ?.focus();
}

function openEditPromptModal() {
  setPromptFormModalOpen(true);
}

function renderPromptCard() {
  if (!promptList) return;

  promptList.innerHTML = "";

  if (!promptState.content) {
    const empty = document.createElement("p");
    empty.className = "prompt-selection-list-empty prompt-selection-list-empty-action";
    empty.textContent = "No GPT prompt yet.";
    empty.addEventListener("click", openEditPromptModal);
    promptList.appendChild(empty);
    return;
  }

  const item = document.createElement("li");
  item.className = "prompt-selection-item is-selected";

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "prompt";
  radio.value = "gpt-prompt";
  radio.checked = true;
  radio.setAttribute("aria-label", "Use GPT Prompt");

  const copy = document.createElement("div");
  copy.className = "prompt-selection-copy";

  const label = document.createElement("span");
  label.className = "prompt-selection-label";
  label.textContent = "GPT Prompt";

  copy.append(label);

  const updatedAtText = formatPromptResumeUpdatedAt(promptState.updatedAt);
  if (updatedAtText) {
    const updated = document.createElement("span");
    updated.className = "prompt-selection-updated";
    updated.textContent = updatedAtText;
    copy.append(updated);
  }

  const actions = document.createElement("div");
  actions.className = "prompt-selection-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "prompt-selection-edit";
  editButton.setAttribute("aria-label", "View or edit GPT Prompt");
  editButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  `;
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditPromptModal();
  });

  actions.append(editButton);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "prompt-selection-remove";
  clearButton.textContent = "×";
  clearButton.setAttribute("aria-label", "Clear GPT Prompt");
  clearButton.addEventListener("click", (event) => {
    event.stopPropagation();
    clearPrompt();
  });
  actions.append(clearButton);

  item.append(radio, copy, actions);
  promptList.appendChild(item);
}

async function clearPrompt() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_PROMPT_SELECTION",
      content: ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not clear prompt.");
    }

    promptState = {
      content: "",
      updatedAt: ""
    };
    renderPromptCard();
  } catch (error) {
    console.error(error);
  }
}

async function loadPromptSelection() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_PROMPT_SELECTION"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load prompt.");
    }

    promptState = {
      content: typeof response.content === "string" ? response.content : "",
      updatedAt: response.updatedAt || ""
    };
    renderPromptCard();
  } catch (error) {
    console.error(error);
  }
}

let humanizePromptState = {
  content: "",
  updatedAt: ""
};

function setHumanizeFormModalOpen(isOpen) {
  if (!humanizeFormModal) return;

  humanizeFormModal.classList.toggle("is-hidden", !isOpen);
  humanizeFormModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    if (humanizeContentInput) {
      humanizeContentInput.value = humanizePromptState.content || "";
    }
    humanizeContentInput?.focus();
    return;
  }

  if (humanizeContentInput) humanizeContentInput.value = "";
  humanizePromptList
    ?.querySelector(".prompt-selection-edit, .prompt-selection-list-empty-action")
    ?.focus();
}

function openEditHumanizePromptModal() {
  setHumanizeFormModalOpen(true);
}

function renderHumanizePromptCard() {
  if (!humanizePromptList) return;

  humanizePromptList.innerHTML = "";

  if (!humanizePromptState.content) {
    const empty = document.createElement("p");
    empty.className = "prompt-selection-list-empty prompt-selection-list-empty-action";
    empty.textContent = "No humanize prompt yet.";
    empty.addEventListener("click", openEditHumanizePromptModal);
    humanizePromptList.appendChild(empty);
    return;
  }

  const item = document.createElement("li");
  item.className = "prompt-selection-item is-selected";

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "humanize-prompt";
  radio.value = "humanize-prompt";
  radio.checked = true;
  radio.setAttribute("aria-label", "Use Humanize Prompt");

  const copy = document.createElement("div");
  copy.className = "prompt-selection-copy";

  const label = document.createElement("span");
  label.className = "prompt-selection-label";
  label.textContent = "Humanize Prompt";

  copy.append(label);

  const updatedAtText = formatPromptResumeUpdatedAt(humanizePromptState.updatedAt);
  if (updatedAtText) {
    const updated = document.createElement("span");
    updated.className = "prompt-selection-updated";
    updated.textContent = updatedAtText;
    copy.append(updated);
  }

  const actions = document.createElement("div");
  actions.className = "prompt-selection-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "prompt-selection-edit";
  editButton.setAttribute("aria-label", "View or edit Humanize Prompt");
  editButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  `;
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditHumanizePromptModal();
  });

  actions.append(editButton);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "prompt-selection-remove";
  clearButton.textContent = "×";
  clearButton.setAttribute("aria-label", "Clear Humanize Prompt");
  clearButton.addEventListener("click", (event) => {
    event.stopPropagation();
    clearHumanizePrompt();
  });
  actions.append(clearButton);

  item.append(radio, copy, actions);
  humanizePromptList.appendChild(item);
}

async function clearHumanizePrompt() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_HUMANIZE_PROMPT_SELECTION",
      content: ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not clear humanize prompt.");
    }

    humanizePromptState = {
      content: "",
      updatedAt: ""
    };
    renderHumanizePromptCard();
  } catch (error) {
    console.error(error);
  }
}

async function loadHumanizePromptSelection() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_HUMANIZE_PROMPT_SELECTION"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load humanize prompt.");
    }

    humanizePromptState = {
      content: typeof response.content === "string" ? response.content : "",
      updatedAt: response.updatedAt || ""
    };
    renderHumanizePromptCard();
  } catch (error) {
    console.error(error);
  }
}

async function submitHumanizeForm() {
  const content = humanizeContentInput?.value.trim() || "";

  if (!content) {
    humanizeContentInput?.focus();
    return;
  }

  if (humanizeFormModalSubmitButton) {
    humanizeFormModalSubmitButton.disabled = true;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_HUMANIZE_PROMPT_SELECTION",
      content
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save humanize prompt.");
    }

    humanizePromptState = {
      content: typeof response.content === "string" ? response.content : content,
      updatedAt: response.updatedAt || ""
    };

    setHumanizeFormModalOpen(false);
    renderHumanizePromptCard();
  } catch (error) {
    console.error(error);
  } finally {
    if (humanizeFormModalSubmitButton) {
      humanizeFormModalSubmitButton.disabled = false;
    }
  }
}

async function submitPromptForm() {
  const content = promptContentInput?.value.trim() || "";

  if (!content) {
    promptContentInput?.focus();
    return;
  }

  if (promptFormModalSubmitButton) {
    promptFormModalSubmitButton.disabled = true;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_PROMPT_SELECTION",
      content
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save prompt.");
    }

    promptState = {
      content: typeof response.content === "string" ? response.content : content,
      updatedAt: response.updatedAt || ""
    };

    setPromptFormModalOpen(false);
    renderPromptCard();
  } catch (error) {
    console.error(error);
  } finally {
    if (promptFormModalSubmitButton) {
      promptFormModalSubmitButton.disabled = false;
    }
  }
}

let jobDescriptionState = {
  content: "",
  updatedAt: ""
};

function setJobDescriptionFormModalOpen(isOpen) {
  if (!jobDescriptionFormModal) return;

  jobDescriptionFormModal.classList.toggle("is-hidden", !isOpen);
  jobDescriptionFormModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    if (jobDescriptionContentInput) {
      jobDescriptionContentInput.value = jobDescriptionState.content || "";
    }
    jobDescriptionContentInput?.focus();
    return;
  }

  if (jobDescriptionContentInput) jobDescriptionContentInput.value = "";
  jobDescriptionList?.querySelector(".job-description-selection-edit")?.focus();
}

function openEditJobDescriptionModal() {
  setJobDescriptionFormModalOpen(true);
}

function renderJobDescriptionCard() {
  if (!jobDescriptionList) return;

  jobDescriptionList.innerHTML = "";

  const item = document.createElement("li");
  item.className = "job-description-selection-item is-selected is-single";

  const copy = document.createElement("div");
  copy.className = "job-description-selection-copy";

  const preview = document.createElement("span");
  preview.className = "job-description-selection-preview";
  preview.textContent = jobDescriptionState.content
    ? normalizeJobDescriptionPreview(jobDescriptionState.content)
    : "No job description yet.";

  copy.append(preview);

  const actions = document.createElement("div");
  actions.className = "job-description-selection-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "job-description-selection-edit";
  editButton.setAttribute("aria-label", "View or edit job description");
  editButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  `;
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditJobDescriptionModal();
  });

  actions.append(editButton);

  if (jobDescriptionState.content) {
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "job-description-selection-remove";
    clearButton.textContent = "×";
    clearButton.setAttribute("aria-label", "Clear job description");
    clearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      clearJobDescription();
    });
    actions.append(clearButton);
  }

  item.addEventListener("click", () => {
    openEditJobDescriptionModal();
  });

  item.append(copy, actions);
  jobDescriptionList.appendChild(item);
}

async function clearJobDescription() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_JOB_DESCRIPTION_SELECTION",
      content: ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not clear job description.");
    }

    jobDescriptionState = {
      content: "",
      updatedAt: ""
    };
    renderJobDescriptionCard();
  } catch (error) {
    console.error(error);
  }
}

async function loadJobDescriptionSelection() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_JOB_DESCRIPTION_SELECTION"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not load job description.");
    }

    jobDescriptionState = {
      content: typeof response.content === "string" ? response.content : "",
      updatedAt: response.updatedAt || ""
    };
    renderJobDescriptionCard();
  } catch (error) {
    console.error(error);
  }
}

async function submitJobDescriptionForm() {
  const content = jobDescriptionContentInput?.value.trim() || "";

  if (!content) {
    jobDescriptionContentInput?.focus();
    return;
  }

  if (jobDescriptionFormModalSubmitButton) {
    jobDescriptionFormModalSubmitButton.disabled = true;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_JOB_DESCRIPTION_SELECTION",
      content
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save job description.");
    }

    jobDescriptionState = {
      content: typeof response.content === "string" ? response.content : content,
      updatedAt: response.updatedAt || ""
    };

    setJobDescriptionFormModalOpen(false);
    renderJobDescriptionCard();
  } catch (error) {
    console.error(error);
  } finally {
    if (jobDescriptionFormModalSubmitButton) {
      jobDescriptionFormModalSubmitButton.disabled = false;
    }
  }
}

function setConfigModalOpen(isOpen, { returnFocus = true } = {}) {
  if (!configToggleButton || !configModal) return;

  configToggleButton.setAttribute("aria-expanded", String(isOpen));
  configModal.classList.toggle("is-hidden", !isOpen);
  configModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    setAppDataTransferStatus("", "");
    spreadsheetIdInput?.focus();
    return;
  }

  if (returnFocus) {
    configToggleButton.focus();
  }
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
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not load configuration.");
  }
}

async function saveSheetConfig() {

  addLog("info", "Save configuration clicked.");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_SHEET_CONFIG",
      spreadsheetId: spreadsheetIdInput?.value.trim() || "",
      sheetName: sheetNameInput?.value.trim() || ""
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

    addLog("success", `Saved. Sheet tab "${response.sheetName}".`);
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not save configuration.";
    addLog("error", message);
  }
}

function shouldIncludePromptResumeInfo() {
  return includePromptResumeInfoCheckbox?.checked !== false;
}

function setAppDataTransferStatus(type, message) {
  if (!appDataTransferStatus) return;

  const text = String(message || "").trim();
  appDataTransferStatus.textContent = text;
  appDataTransferStatus.classList.toggle("is-hidden", !text);
  appDataTransferStatus.classList.toggle("is-success", type === "success");
  appDataTransferStatus.classList.toggle("is-error", type === "error");
}

function downloadAppDataBackup(data) {
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `application-helper-backup-${stamp}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return filename;
}

async function exportAppData() {
  const includePromptResumes = shouldIncludePromptResumeInfo();
  setAppDataTransferStatus("", "");
  addLog(
    "info",
    includePromptResumes
      ? "Exporting app data with prompt resume info..."
      : "Exporting app data without prompt resume info..."
  );

  try {
    const response = await chrome.runtime.sendMessage({
      type: "EXPORT_APP_DATA",
      includePromptResumes
    });

    if (!response?.ok || !response.data) {
      throw new Error(response?.error || "Could not export app data.");
    }

    const filename = downloadAppDataBackup(response.data);
    const message = `Exported ${filename}.`;
    setAppDataTransferStatus("success", message);
    addLog("success", message);
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not export app data.";
    setAppDataTransferStatus("error", message);
    addLog("error", message);
  }
}

async function refreshUiAfterAppDataImport() {
  await Promise.all([
    loadSheetConfig(),
    loadPromptSelection(),
    loadHumanizePromptSelection(),
    loadJobDescriptionSelection(),
    loadProfileSelection()
  ]);
}

async function importAppDataFromFile(file) {
  if (!file) {
    return;
  }

  const includePromptResumes = shouldIncludePromptResumeInfo();
  setAppDataTransferStatus("", "");
  addLog(
    "info",
    includePromptResumes
      ? `Importing app data from ${file.name} with prompt resume info...`
      : `Importing app data from ${file.name} without prompt resume info...`
  );

  try {
    const text = await file.text();
    let payload;

    try {
      payload = JSON.parse(text);
    } catch (_error) {
      throw new Error("Backup file must be valid JSON.");
    }

    const response = await chrome.runtime.sendMessage({
      type: "IMPORT_APP_DATA",
      data: payload,
      includePromptResumes
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not import app data.");
    }

    await refreshUiAfterAppDataImport();

    const message = response.includesPromptResumes
      ? "Imported app data, including prompt resume info."
      : "Imported app data. Existing prompt resume info was kept.";
    setAppDataTransferStatus("success", message);
    addLog("success", message);
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not import app data.";
    setAppDataTransferStatus("error", message);
    addLog("error", message);
  } finally {
    if (importAppDataFileInput) {
      importAppDataFileInput.value = "";
    }
  }
}

function isActiveTab(tabId) {
  return !Number.isInteger(tabId) || tabId === activeTabId;
}

function renderHeaderStatus() {
  const displayText = headerStatusState
    ? (() => {
        const label =
          headerStatusState.type === "error"
            ? "Error"
            : String(headerStatusState.titleText || "Saved").replace(/:\s*$/, "");
        const detail = String(headerStatusState.message || "").trim();
        return `Last status: ${label}${detail ? ` — ${detail}` : ""}`;
      })()
    : "";

  workspaceHeaderStatuses.forEach((statusElement) => {
    const statusText = statusElement.querySelector(
      ".workspace-header-status-text"
    );
    if (statusText) {
      statusText.textContent = displayText;
    } else {
      statusElement.textContent = displayText;
    }
    statusElement.title = displayText;
    statusElement.classList.toggle(
      "is-error",
      headerStatusState?.type === "error"
    );
  });
}

function showStatusForTab(tabId, type, message, titleText) {
  const status = { type, message, titleText };

  if (isActiveTab(tabId)) {
    headerStatusState = status;
    renderHeaderStatus();
    return;
  }

  const state = getTabState(tabId);
  if (state) {
    state.headerStatus = status;
  }
}

function showStatus(type, message, titleText) {
  showStatusForTab(activeTabId, type, message, titleText);
}

function clearStatus() {}

function updateLogsState() {
  if (!logsList || !emptyLogs) return;

  const hasItems = logsList.children.length > 0;

  logsList.classList.toggle("has-items", hasItems);
  emptyLogs.classList.toggle("is-hidden", hasItems);
}

function createLogListItem({ level, message, timestamp }) {
  const item = document.createElement("li");
  item.className = `log-item log-${level}`;

  item.innerHTML = `
    <span class="log-time"></span>
    <span class="log-level"></span>
    <span class="log-message"></span>
  `;

  item.querySelector(".log-time").textContent = timestamp;
  item.querySelector(".log-level").textContent = String(level).toUpperCase();
  item.querySelector(".log-message").textContent = message;

  return item;
}

function renderLogEntries() {
  if (!logsList) return;

  logsList.innerHTML = "";
  logEntries.forEach((entry) => {
    logsList.appendChild(createLogListItem(entry));
  });

  updateLogsState();
  logsList.scrollTop = logsList.scrollHeight;
}

function addLogForTab(
  tabId,
  level,
  message,
  timestamp = new Date().toLocaleTimeString()
) {
  const entry = { level, message, timestamp };

  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.logs.push(entry);
      if (state.logs.length > MAX_TAB_LOG_ENTRIES) {
        state.logs.splice(0, state.logs.length - MAX_TAB_LOG_ENTRIES);
      }
    }
    return;
  }

  logEntries.push(entry);
  if (logEntries.length > MAX_TAB_LOG_ENTRIES) {
    logEntries.splice(0, logEntries.length - MAX_TAB_LOG_ENTRIES);
    renderLogEntries();
    return;
  }

  if (!logsList) {
    console.log(`[${level}] ${message}`);
    return;
  }

  logsList.appendChild(createLogListItem(entry));
  updateLogsState();
  logsList.scrollTop = logsList.scrollHeight;
}

function addLog(level, message, timestamp = new Date().toLocaleTimeString()) {
  addLogForTab(activeTabId, level, message, timestamp);
}

function clearLogsForTab(tabId) {
  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.logs = [];
    }
    return;
  }

  logEntries = [];
  renderLogEntries();
}

function clearLogs() {
  clearLogsForTab(activeTabId);
}

function beginButtonProcessForTab(tabId, startingMessage) {
  clearLogsForTab(tabId);
  setSaveButtonsDisabledForTab(tabId, true);
  if (startingMessage) {
    addLogForTab(tabId, "info", startingMessage);
  }
}

function finishButtonProcessForTab(tabId) {
  setSaveButtonsDisabledForTab(tabId, false);
}

function updateDeletedRowsState() {
  if (!deletedRowsCard || !deletedRowsList || !emptyDeletedRows) return;

  const hasItems = deletedRowsList.children.length > 0;
  deletedRowsCard.classList.toggle("is-hidden", !hasItems);
  emptyDeletedRows.classList.toggle("is-hidden", hasItems);
}

function renderDeletedRowEntries() {
  if (!deletedRowsList) return;

  deletedRowsList.innerHTML = "";

  deletedRowEntries.forEach((row) => {
    const item = document.createElement("li");
    item.className = "deleted-row-item";

    const rowNumber = row.rowNumber ?? "?";
    const url = row.url || "(empty URL)";
    item.textContent = `Row ${rowNumber}: ${url}`;
    deletedRowsList.appendChild(item);
  });

  updateDeletedRowsState();
}

function clearDeletedRowsForTab(tabId) {
  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.deletedRows = [];
    }
    return;
  }

  deletedRowEntries = [];
  renderDeletedRowEntries();
}

function clearDeletedRows() {
  clearDeletedRowsForTab(activeTabId);
}

async function refreshApplicationInputsAfterSave() {
  await Promise.all([loadProfileSelection(), loadJobDescriptionSelection()]);
}

function validateSaveCurrentTabInputs(mode = "save") {
  const missing = [];

  if (!promptState.content?.trim()) {
    missing.push("GPT prompt");
  }

  if (!jobDescriptionState.content?.trim()) {
    missing.push("job description");
  }

  const selectedProfiles = getSelectedProfiles();
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

  if (mode === "apply" && selectedProfiles.length > 1) {
    return {
      ok: false,
      error:
        "Apply Now currently supports one profile. Keep one profile checked or use Save App for the selected profiles."
    };
  }

  if (missing.length === 0) {
    return { ok: true };
  }

  const message =
    missing.length === 1
      ? `${missing[0]} is required before saving.`
      : `These are required before saving: ${missing.join(", ")}.`;

  return { ok: false, error: message, missing };
}

async function validateActiveBrowserTabForAppAction(mode = "save") {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab) {
    return { ok: false, error: "No active tab found." };
  }

  if (!tab.url) {
    return { ok: false, error: "Current tab does not have a URL." };
  }

  if (tab.pinned) {
    return {
      ok: false,
      error: "Pinned tabs are not supported. Unpin the tab and try again."
    };
  }

  if (
    mode === "apply" &&
    typeof tab.groupId === "number" &&
    tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
  ) {
    return {
      ok: false,
      error:
        "Grouped tabs are not supported. Ungroup the tab or open it outside a tab group and try again."
    };
  }

  return { ok: true };
}

async function runCurrentAppAction(mode = "save") {

  clearStatus();
  clearDeletedRows();

  const validation = validateSaveCurrentTabInputs(mode);
  if (!validation.ok) {
    showStatus("error", validation.error);
    addLog("error", validation.error);
    return;
  }

  const tabValidation = await validateActiveBrowserTabForAppAction(mode);
  if (!tabValidation.ok) {
    showStatus("error", tabValidation.error);
    addLog("error", tabValidation.error);
    return;
  }

  const { ownerTabId, runId } = beginRunForActiveTab();

  beginButtonProcessForTab(
    ownerTabId,
    mode === "apply"
      ? "Apply Now clicked. Starting process..."
      : "Save App clicked. Starting process..."
  );

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_CURRENT_TAB_URL_TO_SHEET",
      runId,
      ownerTabId,
      mode
    });

    if (!response?.ok) {
      const error = new Error(response?.error || "Could not save URL.");
      error.cancelled = response?.cancelled === true;
      throw error;
    }

    showStatusForTab(ownerTabId, "success", response.url);
    addLogForTab(
      ownerTabId,
      "success",
      mode === "apply"
        ? "Application tabs grouped successfully."
        : "Process completed successfully."
    );
  } catch (error) {
    if (error.cancelled) {
      showStatusForTab(ownerTabId, "info", "Save process cancelled.", "Status:");
      addLogForTab(ownerTabId, "info", "Save process ended by Cancel Process.");
    } else {
      console.error(error);
      showStatusForTab(
        ownerTabId,
        "error",
        error.message || "Something went wrong."
      );
      addLogForTab(
        ownerTabId,
        "error",
        error.message || "Something went wrong."
      );
    }
  } finally {
    finishButtonProcessForTab(ownerTabId);
  }
}

async function saveCurrentTabUrl() {
  await runCurrentAppAction("save");
}

async function applyNow() {
  await runCurrentAppAction("apply");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SIDE_PANEL_PING") {
    sendResponse({ open: true });
    return;
  }

  if (message.type === "HOTKEY_SAVE_STARTED") {
    const ownerTabId = Number.isInteger(message.ownerTabId)
      ? message.ownerTabId
      : activeTabId;
    registerRunTab(message.runId, ownerTabId);
    setRunIdForTab(ownerTabId, message.runId);
    clearDeletedRowsForTab(ownerTabId);
    beginButtonProcessForTab(
      ownerTabId,
      "Hotkey detected. Starting save process..."
    );
    return;
  }

  if (message.type === "APPLICATION_INPUTS_RESET") {
    refreshApplicationInputsAfterSave().catch((error) => {
      console.error("Could not refresh application inputs:", error);
    });
    const inputsResetTabIds = resolveRunTabIds(message);
    const resetMessage = message.message || "Application inputs cleared.";
    if (inputsResetTabIds.length === 0) {
      addLog("info", resetMessage);
    } else {
      inputsResetTabIds.forEach((tabId) => {
        addLogForTab(tabId, "info", resetMessage);
      });
    }
    return;
  }

  if (message.type === "SHOW_SAVE_WORKSPACE") {
    const targetTabIds = resolveRunTabIds(message);
    if (targetTabIds.length === 0) {
      return;
    }

    registerRunTab(message.runId, message.chatGptTabId);
    showSaveWorkspacePreview({
      runId: message.runId,
      batchIndex: message.batchIndex,
      batchCount: message.batchCount,
      jobTitle: message.jobTitle,
      jobUrl: message.jobUrl,
      profileName: message.profileName,
      resumeUrl: message.resumeUrl,
      chatGptTabId: message.chatGptTabId
    });
    addLogForTab(
      message.chatGptTabId,
      "success",
      "Job page and selected-profile resume opened in the sidebar workspace."
    );
    return;
  }

  if (message.type === "SAVE_WORKSPACE_READY") {
    if (resolveRunTabIds(message).length === 0) {
      return;
    }

    markSaveWorkspaceReady({
      chatGptUrl: message.chatGptUrl,
      chatGptTabId: message.chatGptTabId
    });
    addLogForTab(
      message.chatGptTabId,
      "success",
      "Application workspace actions are ready."
    );
    return;
  }

  if (message.type === "HOTKEY_SAVE_FINISHED") {
    const finishedTabIds = resolveRunTabIds(message);
    if (finishedTabIds.length === 0) {
      return;
    }

    finishedTabIds.forEach((tabId) => {
      if (message.ok) {
        showStatusForTab(tabId, "success", message.url || "", "Saved:");
        addLogForTab(tabId, "success", "Process completed successfully.");
      } else {
        showStatusForTab(
          tabId,
          "error",
          message.error || "Something went wrong."
        );
        addLogForTab(
          tabId,
          "error",
          message.error || "Something went wrong."
        );
      }

      finishButtonProcessForTab(tabId);
    });
    return;
  }

  if (message.type !== "SAVE_PROCESS_LOG") {
    return;
  }

  resolveRunTabIds(message).forEach((tabId) => {
    addLogForTab(tabId, message.level, message.message, message.timestamp);
  });
});

async function humanizeChat() {

  const { ownerTabId, runId } = beginRunForActiveTab();

  clearStatus();
  clearDeletedRowsForTab(ownerTabId);
  beginButtonProcessForTab(
    ownerTabId,
    "Humanize clicked. Looking for a ChatGPT conversation..."
  );

  try {
    const response = await chrome.runtime.sendMessage({
      type: "HUMANIZE_CHATGPT",
      runId,
      ownerTabId
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not send the Humanize prompt.");
    }

    showStatusForTab(
      ownerTabId,
      "success",
      response.url || "Prompt sent to ChatGPT.",
      "Sent:"
    );
    addLogForTab(ownerTabId, "success", "Humanize prompt sent to ChatGPT.");
  } catch (error) {
    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Something went wrong."
    );
    addLogForTab(ownerTabId, "error", error.message || "Something went wrong.");
  } finally {
    finishButtonProcessForTab(ownerTabId);
  }
}

async function runResumeDownload(documentUrl = "", profileName = "") {

  const { ownerTabId, runId } = beginRunForActiveTab();

  clearStatus();
  clearDeletedRowsForTab(ownerTabId);
  beginButtonProcessForTab(
    ownerTabId,
    documentUrl
      ? "Download Resume clicked. Checking the right-side Google Docs URL..."
      : "Download Resume clicked. Checking Google Docs tab..."
  );

  try {
    const response = await chrome.runtime.sendMessage({
      type: "DOWNLOAD_RESUME_PDF",
      runId,
      ownerTabId,
      documentUrl,
      profileName
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not download the resume PDF.");
    }

    showStatusForTab(
      ownerTabId,
      "success",
      response.filename || "document.pdf",
      "Downloaded:"
    );
    addLogForTab(
      ownerTabId,
      "success",
      `Resume PDF download started: ${response.filename || "document.pdf"}`
    );
  } catch (error) {
    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Something went wrong."
    );
    addLogForTab(ownerTabId, "error", error.message || "Something went wrong.");
  } finally {
    finishButtonProcessForTab(ownerTabId);
  }
}

async function downloadSplitWindowResume() {
  if (!currentSplitWindowDownloadUrl || splitWindowsPreviewDownloadButton?.disabled) {
    return;
  }

  await runResumeDownload(
    currentSplitWindowDownloadUrl,
    currentSaveWorkspace?.profileName || ""
  );
}

function showBuildResumeContextStatus(type, message) {
  if (!buildResumeContextStatus) return;

  buildResumeContextStatus.classList.remove(
    "is-hidden",
    "is-error",
    "is-success"
  );
  buildResumeContextStatus.textContent = message;
  buildResumeContextStatus.classList.add(
    type === "error" ? "is-error" : "is-success"
  );
}

function clearBuildResumeContextStatus() {
  buildResumeContextStatus?.classList.add("is-hidden");
  buildResumeContextStatus?.classList.remove("is-error", "is-success");
  if (buildResumeContextStatus) buildResumeContextStatus.textContent = "";
}

function setBuildResumeContextModalBusy(isBusy) {
  if (buildResumeContextInput) buildResumeContextInput.disabled = isBusy;
  if (buildResumeContextModalBackdrop) {
    buildResumeContextModalBackdrop.disabled = isBusy;
  }
  if (buildResumeContextModalCloseButton) {
    buildResumeContextModalCloseButton.disabled = isBusy;
  }
  if (buildResumeContextCancelButton) {
    buildResumeContextCancelButton.disabled = isBusy;
  }
  if (buildResumeContextSubmitButton) {
    buildResumeContextSubmitButton.disabled = isBusy;
  }
}

function setBuildResumeContextModalOpen(isOpen, { returnFocus = true } = {}) {
  if (!buildResumeContextModal) return;

  isBuildResumeContextModalOpen = isOpen;
  const workspaceIsVisible =
    currentSplitWindowSessionType === "save-workspace" &&
    !splitWindowsModal?.classList.contains("is-hidden");
  const shouldShow = isOpen && workspaceIsVisible;

  buildResumeContextModal.classList.toggle("is-hidden", !shouldShow);
  buildResumeContextModal.setAttribute("aria-hidden", String(!shouldShow));

  if (isOpen) {
    clearBuildResumeContextStatus();
    setBuildResumeContextModalBusy(false);
    buildResumeContextInput?.focus();
    return;
  }

  clearBuildResumeContextStatus();
  setBuildResumeContextModalBusy(false);
  buildResumeContextDraft = "";
  if (buildResumeContextInput) buildResumeContextInput.value = "";
  if (
    returnFocus &&
    currentSplitWindowSessionType === "save-workspace" &&
    !splitWindowsModal?.classList.contains("is-hidden")
  ) {
    saveWorkspaceBuildButton?.focus();
  }
}

function setBuildResumeContextModalOpenForTab(tabId, isOpen, options = {}) {
  if (!isActiveTab(tabId)) {
    const state = getTabState(tabId);
    if (state) {
      state.isBuildResumeContextModalOpen = Boolean(isOpen);
      if (!isOpen) {
        state.buildResumeContextDraft = "";
      }
    }
    return;
  }

  setBuildResumeContextModalOpen(isOpen, options);
}

function openBuildResumeContextModal() {
  if (
    saveWorkspaceBuildButton?.disabled ||
    !hasActiveSaveWorkspaceForCurrentTab() ||
    !currentSaveWorkspace?.isReady
  ) {
    return;
  }

  setBuildResumeContextModalOpen(true);
}

// Returns the workspace the action is bound to so async handlers keep reporting
// to its tab even after the user switches away.
function beginSaveWorkspaceAction(message) {
  const workspace = currentSaveWorkspace;

  if (!workspace?.isReady || workspace.isBusy) {
    return null;
  }

  workspace.isBusy = true;
  updateSaveWorkspaceActions();
  clearStatus();
  clearDeletedRowsForTab(workspace.chatGptTabId);
  addLogForTab(workspace.chatGptTabId, "info", message);
  return workspace;
}

function finishSaveWorkspaceAction(workspace = currentSaveWorkspace) {
  if (!workspace) {
    return;
  }

  workspace.isBusy = false;
  if (currentSaveWorkspace === workspace) {
    updateSaveWorkspaceActions();
  }
}

async function submitBuildResumeContext() {
  const resumeText = String(buildResumeContextInput?.value || "").trim();
  if (!resumeText) {
    showBuildResumeContextStatus(
      "error",
      "Paste the resume context before clicking OK."
    );
    buildResumeContextInput?.focus();
    return;
  }

  const workspace = beginSaveWorkspaceAction(
    "Build resume confirmed. Updating the copied Google Docs resume..."
  );
  if (!workspace) {
    return;
  }

  const ownerTabId = workspace.chatGptTabId;
  setBuildResumeContextModalBusy(true);
  let response;
  let didBuildResume = false;

  try {
    response = await chrome.runtime.sendMessage({
      type: "UPDATE_WORKSPACE_RESUME_CONTEXT",
      runId: registerRunTab(activeRunId || createRunId(), ownerTabId),
      ownerTabId,
      resumeUrl: workspace.resumeUrl,
      resumeText
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not build the resume.");
    }

    didBuildResume = true;
  } catch (error) {
    console.error(error);
    if (isActiveTab(ownerTabId)) {
      showBuildResumeContextStatus(
        "error",
        error.message || "Could not build the resume."
      );
    }
    addLogForTab(
      ownerTabId,
      "error",
      error.message || "Could not build the resume."
    );
  } finally {
    finishSaveWorkspaceAction(workspace);
    setBuildResumeContextModalBusy(false);
  }

  if (!didBuildResume) {
    return;
  }

  setBuildResumeContextModalOpenForTab(ownerTabId, false);
  if (currentSaveWorkspace === workspace) {
    setSaveWorkspaceTab("resume");
  } else {
    workspace.activeTab = "resume";
  }
  showStatusForTab(
    ownerTabId,
    "success",
    response.url || workspace.resumeUrl,
    "Built:"
  );
  addLogForTab(
    ownerTabId,
    "success",
    "Resume context inserted into the copied document without changing template styles."
  );
}

async function downloadSaveWorkspaceResume() {
  if (saveWorkspaceDownloadButton?.disabled) {
    return;
  }

  const workspace = beginSaveWorkspaceAction("Download resume clicked.");
  if (!workspace) {
    return;
  }

  const ownerTabId = workspace.chatGptTabId;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "DOWNLOAD_RESUME_PDF",
      runId: registerRunTab(activeRunId || createRunId(), ownerTabId),
      ownerTabId,
      documentUrl: workspace.resumeUrl,
      profileName: workspace.profileName
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not download the resume PDF.");
    }

    showStatusForTab(
      ownerTabId,
      "success",
      response.filename || "resume.pdf",
      "Downloaded:"
    );
    addLogForTab(
      ownerTabId,
      "success",
      `Resume PDF download started: ${response.filename || "resume.pdf"}`
    );
  } catch (error) {
    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Could not download the resume PDF."
    );
    addLogForTab(
      ownerTabId,
      "error",
      error.message || "Could not download the resume PDF."
    );
  } finally {
    finishSaveWorkspaceAction(workspace);
  }
}

async function exchangeSaveWorkspaceUrls() {
  if (areActionButtonsDisabled || !hasActiveSaveWorkspaceForCurrentTab()) {
    return;
  }

  const workspace = beginSaveWorkspaceAction(
    "Exchange clicked. Switching the main tab URL..."
  );
  if (!workspace) {
    return;
  }

  const ownerTabId = workspace.chatGptTabId;
  const isImportedWorkspace = workspace.sessionType === "make-resume";

  try {
    const mainTab = await chrome.tabs.get(workspace.chatGptTabId);
    const mainTabUrl = String(mainTab?.url || "").trim();
    const informationUrl = String(workspace.jobUrl || "").trim();
    const storedChatUrl = String(workspace.storedExchangeUrl || "").trim();
    const isRestoringChat = !isImportedWorkspace && Boolean(storedChatUrl);
    const nextMainTabUrl = isImportedWorkspace
      ? informationUrl
      : isRestoringChat
        ? storedChatUrl
        : informationUrl;

    if (!mainTabUrl || !nextMainTabUrl) {
      throw new Error("Could not identify the URL needed for Exchange.");
    }
    if (
      !isImportedWorkspace &&
      !isRestoringChat &&
      !isChatOrClaudeUrl(mainTabUrl)
    ) {
      throw new Error(
        "The main tab is not a ChatGPT or Claude page, so there is no chat URL to store."
      );
    }

    await chrome.tabs.update(workspace.chatGptTabId, {
      url: nextMainTabUrl,
      active: true
    });

    if (isImportedWorkspace) {
      workspace.jobUrl = mainTabUrl;
      if (isChatOrClaudeUrl(mainTabUrl)) {
        workspace.chatGptUrl = mainTabUrl;
      } else if (isChatOrClaudeUrl(nextMainTabUrl)) {
        workspace.chatGptUrl = nextMainTabUrl;
      }
      if (currentSaveWorkspace === workspace) {
        setSaveWorkspaceTab(workspace.activeTab, {
          forceReload: workspace.activeTab === "job"
        });
      }
    } else {
      workspace.storedExchangeUrl = isRestoringChat ? "" : mainTabUrl;
      if (!isRestoringChat) {
        workspace.chatGptUrl = mainTabUrl;
      }
      if (currentSaveWorkspace === workspace) {
        updateSaveWorkspaceActions();
      }
    }

    showStatusForTab(ownerTabId, "success", nextMainTabUrl, "Main tab:");
    addLogForTab(
      ownerTabId,
      "success",
      isImportedWorkspace
        ? "Main tab and Information page URLs exchanged."
        : isRestoringChat
          ? "Stored chat URL restored in the main tab."
          : "Chat URL stored for the next Exchange; the job URL is now in the main tab."
    );
  } catch (error) {
    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Could not exchange the URLs."
    );
    addLogForTab(
      ownerTabId,
      "error",
      error.message || "Could not exchange the URLs."
    );
  } finally {
    finishSaveWorkspaceAction(workspace);
  }
}

function getWorkspaceUrlComparisonKey(value) {
  try {
    const parsedUrl = new URL(String(value || "").trim());
    parsedUrl.hash = "";
    return parsedUrl.href.replace(/\/$/, "");
  } catch {
    return String(value || "").trim().replace(/\/$/, "");
  }
}

async function pickupRemainingWorkspaceUrl() {
  if (areActionButtonsDisabled || !hasActiveSaveWorkspaceForCurrentTab()) {
    return;
  }

  const workspace = beginSaveWorkspaceAction(
    "Pick up clicked. Opening the remaining URL in a right-side window..."
  );
  if (!workspace) {
    return;
  }

  const ownerTabId = workspace.chatGptTabId;

  try {
    const mainTab = await chrome.tabs.get(workspace.chatGptTabId);
    const mainUrlKey = getWorkspaceUrlComparisonKey(mainTab?.url);
    const seenUrls = new Set();
    const remainingUrl = [
      workspace.jobUrl,
      workspace.storedExchangeUrl,
      workspace.chatGptUrl
    ]
      .map((value) => String(value || "").trim())
      .find((candidate) => {
        if (!candidate) return false;
        const candidateKey = getWorkspaceUrlComparisonKey(candidate);
        if (!candidateKey || seenUrls.has(candidateKey)) return false;
        seenUrls.add(candidateKey);
        return candidateKey !== mainUrlKey;
      });

    if (!remainingUrl) {
      throw new Error(
        "Could not find a remaining job or ChatGPT URL to pick up."
      );
    }

    const response = await chrome.runtime.sendMessage({
      type: "OPEN_URL_IN_RIGHT_WINDOW",
      runId: registerRunTab(activeRunId || createRunId(), ownerTabId),
      ownerTabId,
      url: remainingUrl,
      sourceWindowId: mainTab.windowId
    });
    if (!response?.ok) {
      throw new Error(
        response?.error || "Could not open the remaining URL."
      );
    }

    showStatusForTab(ownerTabId, "success", remainingUrl, "Picked up:");
    addLogForTab(
      ownerTabId,
      "success",
      "Opened the remaining job or ChatGPT URL in a right-side Chrome window."
    );
  } catch (error) {
    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Could not pick up the remaining URL."
    );
    addLogForTab(
      ownerTabId,
      "error",
      error.message || "Could not pick up the remaining URL."
    );
  } finally {
    finishSaveWorkspaceAction(workspace);
  }
}

function hasSaveWorkspaceSession() {
  return saveWorkspacesByTabId.size > 0;
}

function hasActiveSaveWorkspaceForCurrentTab() {
  return Boolean(currentSaveWorkspace);
}

function getCurrentSidePanelView() {
  return hasActiveSaveWorkspaceForCurrentTab()
    ? currentSaveWorkspaceSidePanelView
    : currentDefaultSidePanelView;
}

function renderSaveWorkspaceSidePanelView({ focus = false } = {}) {
  const currentView = getCurrentSidePanelView();
  const showWorkspace =
    !isSplitWindowsDialogOpen && currentView === "workspace";
  const showHomeSwitcher =
    !isSplitWindowsDialogOpen && currentView === "home";

  splitWindowsModal?.classList.toggle(
    "is-workspace-page",
    !isSplitWindowsDialogOpen
  );
  appRoot?.classList.toggle("is-workspace-hidden", showWorkspace);
  homeWorkspaceSwitcher?.classList.toggle("is-hidden", !showHomeSwitcher);
  homeWorkspaceSwitcher?.setAttribute(
    "aria-hidden",
    String(!showHomeSwitcher)
  );

  if (splitWindowsModalCloseButton) {
    const label = !isSplitWindowsDialogOpen
      ? "Exchange with main Home view"
      : "Close";
    splitWindowsModalCloseButton.setAttribute("aria-label", label);
    splitWindowsModalCloseButton.title = label;
  }
  renderSavePostProcessControls();

  if (isSplitWindowsDialogOpen) {
    splitWindowsModal?.setAttribute("role", "dialog");
    splitWindowsModal?.setAttribute("aria-modal", "true");
    // Another tab's render may have hidden the shared node, so show it again.
    splitWindowsModal?.classList.remove("is-hidden");
    splitWindowsModal?.setAttribute("aria-hidden", "false");
    return;
  }

  splitWindowsModal?.setAttribute("role", "region");
  splitWindowsModal?.removeAttribute("aria-modal");
  splitWindowsModal?.classList.toggle("is-hidden", !showWorkspace);
  splitWindowsModal?.setAttribute("aria-hidden", String(!showWorkspace));

  if (showWorkspace) {
    const activeWorkspaceTab = hasActiveSaveWorkspaceForCurrentTab()
      ? currentSaveWorkspace.activeTab
      : currentEmptyWorkspaceTab;
    setSaveWorkspaceTab(activeWorkspaceTab);
  }

  const shouldShowBuildModal =
    showWorkspace &&
    hasActiveSaveWorkspaceForCurrentTab() &&
    isBuildResumeContextModalOpen;
  buildResumeContextModal?.classList.toggle(
    "is-hidden",
    !shouldShowBuildModal
  );
  buildResumeContextModal?.setAttribute(
    "aria-hidden",
    String(!shouldShowBuildModal)
  );

  if (focus) {
    if (showWorkspace) {
      splitWindowsModalCloseButton?.focus();
    } else if (showHomeSwitcher) {
      homeWorkspaceExchangeButton?.focus();
    }
  }
}

function setSaveWorkspaceSidePanelView(view, { focus = true } = {}) {
  const nextView = view === "workspace" ? "workspace" : "home";
  if (hasActiveSaveWorkspaceForCurrentTab()) {
    currentSaveWorkspaceSidePanelView = nextView;
  } else {
    currentDefaultSidePanelView = nextView;
  }
  renderSaveWorkspaceSidePanelView({ focus });
  return true;
}

function exchangeSaveWorkspaceSidePanelView() {
  const currentView = getCurrentSidePanelView();
  const nextView =
    currentView === "workspace"
      ? "home"
      : "workspace";
  return setSaveWorkspaceSidePanelView(nextView);
}

function handleSplitWindowsHeaderAction() {
  if (!isSplitWindowsDialogOpen) {
    exchangeSaveWorkspaceSidePanelView();
    return;
  }

  setSplitWindowsModalOpen(false);
}

// Clears only the active tab's workspace; other tabs keep theirs.
function resetSplitWindowsSession() {
  setBuildResumeContextModalOpen(false, { returnFocus: false });
  currentSplitWindowDownloadUrl = "";
  currentSplitWindowPairs = [];
  currentSplitWindowReturnTabId = null;
  currentSplitWindowSessionType = "make-resume";
  if (Number.isInteger(activeTabId)) {
    saveWorkspacesByTabId.delete(activeTabId);
  }
  currentSaveWorkspace = null;
  currentSaveWorkspaceSidePanelView = "workspace";
  splitWindowsPreviewTabs?.classList.add("is-hidden");

  if (splitWindowsJobTabButton) {
    splitWindowsJobTabButton.classList.add("is-active");
    splitWindowsJobTabButton.setAttribute("aria-selected", "true");
    splitWindowsJobTabButton.tabIndex = 0;
    const label = splitWindowsJobTabButton.querySelector("span");
    if (label) label.textContent = "Information page";
  }

  if (splitWindowsResumeTabButton) {
    splitWindowsResumeTabButton.classList.remove("is-active");
    splitWindowsResumeTabButton.setAttribute("aria-selected", "false");
    splitWindowsResumeTabButton.tabIndex = -1;
    const label = splitWindowsResumeTabButton.querySelector("span");
    if (label) label.textContent = "Profile resume";
  }

  const backLabel = splitWindowsPreviewBackButton?.querySelector("span");
  if (backLabel) backLabel.textContent = "Back";

  updateSaveWorkspaceActions();
  renderSaveWorkspaceSidePanelView();
}

function setSplitWindowsModalOpen(isOpen) {
  if (!splitWindowsModal) return;

  isSplitWindowsDialogOpen = Boolean(isOpen);

  if (!isOpen) {
    setBuildResumeContextModalOpen(false, { returnFocus: false });
  }

  splitWindowsModal.classList.toggle("is-hidden", !isOpen);
  splitWindowsModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    resetSplitWindowsSession();
    setSplitWindowsPreview("");
    splitWindowUrlsInput?.focus();
    return;
  }

  setSplitWindowsPreview("");
  resetSplitWindowsSession();
  splitWindowsDraft = "";
  if (splitWindowUrlsInput) splitWindowUrlsInput.value = "";
  openSplitWindowsButton?.focus();
}

async function requireOpenGoogleSheet() {
  const response = await chrome.runtime.sendMessage({
    type: "CHECK_GOOGLE_SHEET_OPEN"
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Could not check for an open Google Sheet.");
  }

  if (!response.open) {
    throw new Error(
      "Make a resume is available only when the current tab is a Google Sheet."
    );
  }

  return response;
}

async function openSplitWindowsModal() {

  if (openSplitWindowsButton?.disabled) {
    return;
  }

  isMakeResumeOpening = true;
  updateMakeResumeButtonDisabledState();

  try {
    await requireOpenGoogleSheet();
    setSplitWindowsModalOpen(true);
  } catch (error) {
    console.error(error);
    const message =
      error.message || "Open a Google Sheets spreadsheet before continuing.";
    showStatus("error", message);
    addLog("error", message);
  } finally {
    isMakeResumeOpening = false;
    await refreshMakeResumeButtonAvailability();
  }
}

function normalizeSplitWindowUrl(value, label) {
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

function unwrapMarkdownEmphasis(value) {
  const raw = String(value || "").trim();
  const wrappedMatch = raw.match(/^(\*\*|__)([\s\S]+)\1$/);
  return wrappedMatch ? wrappedMatch[2].trim() : raw;
}

function parseSplitWindowUrlField(value, label) {
  const raw = String(value || "").trim();
  const markdownLinkMatch = raw.match(
    /\]\(\s*(https?:\/\/[\s\S]+)\s*\)\s*$/i
  );
  const candidate = markdownLinkMatch
    ? markdownLinkMatch[1].trim()
    : unwrapMarkdownEmphasis(raw);

  return normalizeSplitWindowUrl(candidate.replace(/\\_/g, "_"), label);
}

function parseSplitWindowUrls(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error("Drop or paste application details before continuing.");
  }

  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line && !line.startsWith("#") && !/^[-=_]{3,}$/.test(line)
    );

  const pairs = rows.map((row, index) => {
    const entryNumber = index + 1;
    const fields = row.split(/\t+/).map((field) => field.trim());
    if (fields.length !== 4) {
      throw new Error(
        `Entry ${entryNumber} must be one line with exactly four tab-separated fields in Profile name, Chat, Job, Google Doc order.`
      );
    }

    const profileName = unwrapMarkdownEmphasis(
      fields[0].replace(/^[-+]\s+/, "")
    );
    if (!profileName) {
      throw new Error(`Entry ${entryNumber}'s profile name is required.`);
    }

    const chatUrl = parseSplitWindowUrlField(
      fields[1],
      `Entry ${entryNumber} Chat`
    );
    const jobUrl = parseSplitWindowUrlField(
      fields[2],
      `Entry ${entryNumber} Job`
    );
    const resumeUrl = parseSplitWindowUrlField(
      fields[3],
      `Entry ${entryNumber} Google Doc`
    );

    if (!isChatOrClaudeUrl(chatUrl)) {
      throw new Error(
        `Entry ${entryNumber}'s second field must be a ChatGPT or Claude URL.`
      );
    }
    if (isChatOrClaudeUrl(jobUrl) || isGoogleDocsUrl(jobUrl)) {
      throw new Error(
        `Entry ${entryNumber}'s third field must be the job page URL.`
      );
    }
    if (!isGoogleDocsUrl(resumeUrl)) {
      throw new Error(
        `Entry ${entryNumber}'s fourth field must be a Google Docs document URL.`
      );
    }

    return { profileName, chatUrl, jobUrl, resumeUrl };
  });

  return { pairs };
}

function isChatOrClaudeUrl(url = "") {
  try {
    const hostname = new URL(String(url || "")).hostname.toLowerCase();
    return (
      hostname === "chatgpt.com" ||
      hostname.endsWith(".chatgpt.com") ||
      hostname === "chat.openai.com" ||
      hostname.endsWith(".chat.openai.com") ||
      hostname === "claude.ai" ||
      hostname.endsWith(".claude.ai")
    );
  } catch (_error) {
    return false;
  }
}

function isGoogleDocsUrl(url = "") {
  try {
    const parsed = new URL(String(url || ""));
    return (
      parsed.hostname === "docs.google.com" &&
      /\/document\/(?:u\/\d+\/)?d\/[a-zA-Z0-9-_]+/.test(parsed.pathname)
    );
  } catch (_error) {
    return false;
  }
}

function getDroppedUrlText(dataTransfer) {
  const uriList = String(dataTransfer?.getData("text/uri-list") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .join("\n");

  return uriList || String(dataTransfer?.getData("text/plain") || "").trim();
}

function appendDroppedUrls(dataTransfer) {
  if (!splitWindowUrlsInput) {
    return;
  }

  const droppedText = getDroppedUrlText(dataTransfer);
  if (!droppedText) {
    return;
  }

  const existingText = splitWindowUrlsInput.value.trim();
  splitWindowUrlsInput.value = [existingText, droppedText]
    .filter(Boolean)
    .join("\n");
  splitWindowUrlsInput.focus();
}

function updateApplicationWorkspaceUrlControls() {
  const hasUrl = Boolean(applicationWorkspaceUrlInput?.value.trim());
  const hasActiveWorkspace = hasActiveSaveWorkspaceForCurrentTab();
  const showPickup = !isSplitWindowsDialogOpen;
  const pickupDisabled =
    !showPickup ||
    !hasActiveWorkspace ||
    !currentSaveWorkspace?.isReady ||
    currentSaveWorkspace?.isBusy ||
    areActionButtonsDisabled;

  if (applicationWorkspacePickupButton) {
    applicationWorkspacePickupButton.classList.toggle(
      "is-hidden",
      !showPickup
    );
    applicationWorkspacePickupButton.disabled = pickupDisabled;
  }
  if (applicationWorkspaceNotesButton) {
    applicationWorkspaceNotesButton.disabled =
      !showPickup || !hasActiveWorkspace;
  }
  if (applicationWorkspaceCopyUrlButton) {
    applicationWorkspaceCopyUrlButton.disabled = !hasUrl;
  }
}

function setApplicationWorkspaceUrlInputValue(value) {
  if (applicationWorkspaceUrlInput) {
    applicationWorkspaceUrlInput.value = String(value || "").trim();
    applicationWorkspaceUrlInput.removeAttribute("aria-invalid");
  }
  updateApplicationWorkspaceUrlControls();
}

function setSplitWindowsPreview(rightUrl, options = {}) {
  const url = String(rightUrl || "").trim();
  const isPreviewing = Boolean(url);
  const unavailableTitle = String(options.unavailableTitle || "").trim();
  const isUnavailable = isPreviewing && Boolean(unavailableTitle);

  currentSplitWindowDownloadUrl = String(
    options.downloadUrl === undefined ? url : options.downloadUrl
  ).trim();
  splitWindowsModal?.classList.toggle("is-previewing", isPreviewing);
  splitWindowsInputView?.classList.toggle("is-hidden", isPreviewing);
  splitWindowsPreviewView?.classList.toggle("is-hidden", !isPreviewing);
  splitWindowsPreviewEmptyState?.classList.toggle("is-hidden", !isUnavailable);
  splitWindowsPreviewHelp?.classList.toggle("is-hidden", !isPreviewing);

  if (splitWindowsPreviewHelp) {
    splitWindowsPreviewHelp.textContent = String(
      options.helpText ||
        "Preview content is embedded in the side panel. Some sites may block embedded previews."
    );
  }
  if (splitWindowsModalTitle) {
    splitWindowsModalTitle.textContent = isPreviewing
      ? String(options.title || "Right URL")
      : "Open Tab + Sidebar";
  }

  if (splitWindowsPreviewUrl) {
    splitWindowsPreviewUrl.textContent = url;
    splitWindowsPreviewUrl.title = url;
  }
  setApplicationWorkspaceUrlInputValue(url);

  if (splitWindowsPreviewFrame) {
    const nextFrameUrl = isPreviewing && !isUnavailable ? url : "about:blank";
    splitWindowsPreviewFrame.classList.toggle(
      "is-hidden",
      !isPreviewing || isUnavailable
    );
    if (
      options.forceReload ||
      splitWindowsPreviewFrame.getAttribute("src") !== nextFrameUrl
    ) {
      splitWindowsPreviewFrame.src = nextFrameUrl;
    }
    splitWindowsPreviewFrame.title = String(
      options.frameTitle || "Sidebar URL preview"
    );
  }

  if (isUnavailable) {
    if (splitWindowsPreviewEmptyTitle) {
      splitWindowsPreviewEmptyTitle.textContent = unavailableTitle;
    }
    if (splitWindowsPreviewEmptyHelp) {
      splitWindowsPreviewEmptyHelp.textContent = String(
        options.unavailableHelp || "This page cannot be shown in the side panel."
      );
    }
  }
}

function setEmptyApplicationWorkspacePreview(activeTab) {
  const isResume = activeTab === "resume";
  const emptyTitle = isResume
    ? "No profile resume yet"
    : "No Information page yet";
  const emptyHelp = isResume
    ? "Use Save App to create the selected profile's resume copy."
    : "Use Save App to add the current Information page.";

  currentSplitWindowDownloadUrl = "";
  splitWindowsModal?.classList.add("is-previewing");
  splitWindowsInputView?.classList.add("is-hidden");
  splitWindowsPreviewView?.classList.remove("is-hidden");
  splitWindowsPreviewHelp?.classList.add("is-hidden");

  if (splitWindowsModalTitle) {
    splitWindowsModalTitle.textContent = "Application workspace";
  }
  if (splitWindowsPreviewUrl) {
    splitWindowsPreviewUrl.textContent = emptyTitle;
    splitWindowsPreviewUrl.title = "";
  }
  setApplicationWorkspaceUrlInputValue("");
  if (splitWindowsPreviewFrame) {
    splitWindowsPreviewFrame.classList.add("is-hidden");
    if (splitWindowsPreviewFrame.getAttribute("src") !== "about:blank") {
      splitWindowsPreviewFrame.src = "about:blank";
    }
  }
  if (splitWindowsPreviewEmptyTitle) {
    splitWindowsPreviewEmptyTitle.textContent = emptyTitle;
  }
  if (splitWindowsPreviewEmptyHelp) {
    splitWindowsPreviewEmptyHelp.textContent = emptyHelp;
  }
  splitWindowsPreviewEmptyState?.classList.remove("is-hidden");
}


function renderApplicationWorkspaceProfileNote(workspace, activeTab) {
  const shouldShow =
    currentSplitWindowSessionType === "make-resume" &&
    Boolean(workspace) &&
    activeTab === "job";
  splitWindowsPreviewView?.classList.toggle(
    "has-profile-note",
    shouldShow
  );

  applicationWorkspaceProfileNote?.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    return;
  }

  const profileName = String(workspace.profileName || DEFAULT_PROFILE_NAME).trim();
  const savedProfile = getProfileByName(profileName);
  const profileNotes = String(
    savedProfile?.notes ?? workspace.profileNotes ?? ""
  ).trim();
  const profileWasFound = Boolean(savedProfile) || workspace.profileFound !== false;
  if (applicationWorkspaceProfileNoteTitle) {
    applicationWorkspaceProfileNoteTitle.textContent = `Profile note - ${profileName}`;
  }
  if (applicationWorkspaceProfileNoteText) {
    applicationWorkspaceProfileNoteText.textContent =
      profileNotes ||
      (!profileWasFound
        ? "No saved profile matched this name."
        : "No notes have been saved for this profile.");
  }
}
function getApplicationWorkspaceTitle(workspace = currentSaveWorkspace) {
  const profileName = String(workspace?.profileName || "").trim();
  return profileName
    ? `Application workspace ${profileName}`
    : "Application workspace";
}

function setSaveWorkspaceTab(activeTab, { forceReload = false } = {}) {
  const isResume = activeTab === "resume";
  const normalizedTab = isResume ? "resume" : "job";
  const hasActiveWorkspace = hasActiveSaveWorkspaceForCurrentTab();

  if (hasActiveWorkspace) {
    currentSaveWorkspace.activeTab = normalizedTab;
  } else {
    currentEmptyWorkspaceTab = normalizedTab;
  }

  splitWindowsJobTabButton?.classList.toggle("is-active", !isResume);
  splitWindowsJobTabButton?.setAttribute(
    "aria-selected",
    String(!isResume)
  );
  if (splitWindowsJobTabButton) {
    splitWindowsJobTabButton.tabIndex = isResume ? -1 : 0;
    const label = splitWindowsJobTabButton.querySelector("span");
    if (label) {
      label.textContent = "Information page";
    }
  }

  splitWindowsResumeTabButton?.classList.toggle("is-active", isResume);
  splitWindowsResumeTabButton?.setAttribute(
    "aria-selected",
    String(isResume)
  );
  if (splitWindowsResumeTabButton) {
    splitWindowsResumeTabButton.tabIndex = isResume ? 0 : -1;
  }

  splitWindowsPreviewTabs?.classList.remove("is-hidden");
  const resumeTabLabel = splitWindowsResumeTabButton?.querySelector("span");
  if (resumeTabLabel) {
    resumeTabLabel.textContent = hasActiveWorkspace
      ? `${currentSaveWorkspace.profileName} resume`
      : "Profile resume";
  }

  if (hasActiveWorkspace) {
    const previewUrl = isResume
      ? currentSaveWorkspace.resumeUrl
      : currentSaveWorkspace.jobUrl;
    const isConversationPreview = !isResume && isChatOrClaudeUrl(previewUrl);

    setSplitWindowsPreview(previewUrl, {
      title: getApplicationWorkspaceTitle(currentSaveWorkspace),
      frameTitle: isResume
        ? `${currentSaveWorkspace.profileName} resume`
        : currentSaveWorkspace.jobTitle,
      downloadUrl: currentSaveWorkspace.resumeUrl,
      forceReload,
      unavailableTitle: isConversationPreview
        ? "Conversation preview unavailable"
        : "",
      unavailableHelp: isConversationPreview
        ? "ChatGPT and Claude conversations cannot be displayed inside the extension. Use Exchange to open this conversation in the main tab."
        : "",
      helpText: isResume
        ? "The profile resume is embedded in the side panel."
        : "If this page is blank, the website blocks embedded viewing. Use Exchange to open it in the main tab."
    });
  } else {
    const emptyWorkspaceUrl = currentEmptyWorkspaceUrls[normalizedTab];
    if (emptyWorkspaceUrl) {
      setSplitWindowsPreview(emptyWorkspaceUrl, {
        title: "Application workspace",
        frameTitle: isResume ? "Profile resume" : "Information page",
        downloadUrl: currentEmptyWorkspaceUrls.resume,
        forceReload
      });
    } else {
      setEmptyApplicationWorkspacePreview(normalizedTab);
    }
  }

  renderApplicationWorkspaceProfileNote(
    hasActiveWorkspace ? currentSaveWorkspace : null,
    normalizedTab
  );

  updateSaveWorkspaceActions();
}


function showBlockedInformationPagePreview() {
  if (
    !hasActiveSaveWorkspaceForCurrentTab() ||
    currentSaveWorkspace.activeTab !== "job"
  ) {
    return;
  }

  const previewUrl = String(currentSaveWorkspace.jobUrl || "").trim();
  if (!previewUrl || isChatOrClaudeUrl(previewUrl)) {
    return;
  }

  setSplitWindowsPreview(previewUrl, {
    title: "Application workspace",
    frameTitle: currentSaveWorkspace.jobTitle,
    downloadUrl: currentSaveWorkspace.resumeUrl,
    unavailableTitle: "Information page preview unavailable",
    unavailableHelp:
      "This website did not allow its page to load inside the extension. Use Exchange to open it in the main tab.",
    helpText:
      "The website blocked embedded viewing. Use Exchange to open it in the main tab."
  });
  renderApplicationWorkspaceProfileNote(currentSaveWorkspace, "job");
}
function getActiveApplicationWorkspaceTab() {
  return hasActiveSaveWorkspaceForCurrentTab()
    ? currentSaveWorkspace.activeTab
    : currentEmptyWorkspaceTab;
}

function setActiveApplicationWorkspaceUrl(activeTab, url) {
  const normalizedTab = activeTab === "resume" ? "resume" : "job";
  if (hasActiveSaveWorkspaceForCurrentTab()) {
    if (normalizedTab === "resume") {
      currentSaveWorkspace.resumeUrl = url;
    } else {
      currentSaveWorkspace.jobUrl = url;
    }
    return;
  }

  currentEmptyWorkspaceUrls[normalizedTab] = url;
}

function refreshApplicationWorkspacePreview() {
  if (isSplitWindowsDialogOpen || !applicationWorkspaceUrlInput) {
    return;
  }

  const activeTab = getActiveApplicationWorkspaceTab();
  const rawUrl = applicationWorkspaceUrlInput.value.trim();

  if (!rawUrl) {
    setActiveApplicationWorkspaceUrl(activeTab, "");
    setSaveWorkspaceTab(activeTab, { forceReload: true });
    showStatus(
      "success",
      activeTab === "resume"
        ? "Profile resume URL cleared."
        : "Information page URL cleared.",
      "Cleared:"
    );
    return;
  }

  try {
    const normalizedUrl = normalizeSplitWindowUrl(rawUrl, "Preview");
    setActiveApplicationWorkspaceUrl(activeTab, normalizedUrl);
    setSaveWorkspaceTab(activeTab, { forceReload: true });
    showStatus("success", normalizedUrl, "Previewing:");
  } catch (error) {
    applicationWorkspaceUrlInput.setAttribute("aria-invalid", "true");
    applicationWorkspaceUrlInput.focus();
    showStatus("error", error.message || "Enter a valid URL.");
  }
}

async function copyApplicationWorkspaceUrl() {
  const url = String(applicationWorkspaceUrlInput?.value || "").trim();
  if (!url) {
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      applicationWorkspaceUrlInput.focus();
      applicationWorkspaceUrlInput.select();
      if (!document.execCommand("copy")) {
        throw new Error("Clipboard access is unavailable.");
      }
      applicationWorkspaceUrlInput.setSelectionRange(url.length, url.length);
    }
    showStatus("success", url, "Copied:");
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Could not copy the URL.");
  }
}

function updateSaveWorkspaceActions() {
  const isApplicationWorkspace = !isSplitWindowsDialogOpen;
  const hasActiveWorkspace = hasActiveSaveWorkspaceForCurrentTab();
  const showWorkspaceActions = isApplicationWorkspace;
  const actionsDisabled =
    !hasActiveWorkspace ||
    !currentSaveWorkspace?.isReady ||
    currentSaveWorkspace?.isBusy ||
    areActionButtonsDisabled;

  splitWindowsBatchActions?.classList.toggle(
    "is-hidden",
    isApplicationWorkspace
  );
  saveWorkspaceActions?.classList.toggle("is-hidden", !showWorkspaceActions);

  if (saveWorkspaceBuildButton) {
    saveWorkspaceBuildButton.disabled = actionsDisabled;
    saveWorkspaceBuildButton.title = actionsDisabled
      ? "Build resume requires a ready Application workspace."
      : "";
  }
  if (saveWorkspaceDownloadButton) {
    saveWorkspaceDownloadButton.disabled = actionsDisabled;
  }
  if (saveWorkspaceExchangeButton) {
    saveWorkspaceExchangeButton.disabled = actionsDisabled;
  }
  updateApplicationWorkspaceUrlControls();
}

function showSaveWorkspacePreview({
  runId = null,
  batchIndex = 0,
  batchCount = 1,
  jobTitle = "Job page",
  jobUrl = "",
  profileName = DEFAULT_PROFILE_NAME,
  resumeUrl = "",
  profileNotes = "",
  profileFound = true,
  chatGptTabId = null,
  chatGptUrl = "",
  isReady = false,
  sessionType = "save-workspace"
} = {}) {
  if (!jobUrl || !resumeUrl || !Number.isInteger(chatGptTabId)) {
    return;
  }

  const normalizedSessionType =
    sessionType === "make-resume" ? "make-resume" : "save-workspace";
  const normalizedChatGptUrl = String(chatGptUrl || "").trim();
  const workspace = {
    runId,
    sessionType: normalizedSessionType,
    jobTitle: String(jobTitle || "Job page").trim() || "Job page",
    jobUrl: String(jobUrl).trim(),
    profileName:
      String(profileName || DEFAULT_PROFILE_NAME).trim() || DEFAULT_PROFILE_NAME,
    resumeUrl: String(resumeUrl).trim(),
    profileNotes: String(profileNotes || "").trim(),
    profileFound: profileFound !== false,
    chatGptTabId,
    chatGptUrl: normalizedChatGptUrl,
    storedExchangeUrl:
      normalizedSessionType === "make-resume" ? normalizedChatGptUrl : "",
    activeTab: "resume",
    isReady: Boolean(isReady),
    isBusy: false,
    batchIndex: Number(batchIndex) || 0,
    batchCount: Math.max(1, Number(batchCount) || 1)
  };
  saveWorkspacesByTabId.set(chatGptTabId, workspace);

  // The workspace belongs to its own tab; only take over the panel when the
  // user is actually looking at that tab.
  const workspaceTabState = getTabState(chatGptTabId);
  if (workspaceTabState) {
    workspaceTabState.splitWindowSessionType = normalizedSessionType;
    workspaceTabState.isSplitWindowsDialogOpen = false;
    workspaceTabState.saveWorkspaceSidePanelView = "workspace";
  }

  if (chatGptTabId !== activeTabId) {
    return;
  }

  isSplitWindowsDialogOpen = false;
  currentSplitWindowSessionType = normalizedSessionType;
  currentSaveWorkspaceSidePanelView = "workspace";
  syncCurrentSaveWorkspace();

  splitWindowsPreviewTabs?.classList.remove("is-hidden");
  const resumeTabLabel = splitWindowsResumeTabButton?.querySelector("span");
  if (resumeTabLabel) {
    resumeTabLabel.textContent = `${workspace.profileName} resume`;
  }

  setSaveWorkspaceTab("resume");
  renderSaveWorkspaceSidePanelView();
}

function markSaveWorkspaceReady({
  chatGptUrl = "",
  chatGptTabId = null
} = {}) {
  const workspace = saveWorkspacesByTabId.get(chatGptTabId);
  if (!workspace || workspace.sessionType !== "save-workspace") {
    return false;
  }

  workspace.chatGptUrl = String(chatGptUrl || "").trim();
  workspace.isReady = true;
  if (currentSaveWorkspace === workspace) {
    updateSaveWorkspaceActions();
  }
  return true;
}


function setApplicationWorkspaceTab(activeTab) {
  return setSaveWorkspaceTab(activeTab);
}

async function requestOpenUrlInNewTab(
  url,
  runId = activeRunId,
  ownerTabId = activeTabId
) {
  const response = await chrome.runtime.sendMessage({
    type: "OPEN_URL_IN_NEW_TAB",
    runId,
    ownerTabId,
    url
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Could not open the URL in a new tab.");
  }

  return response;
}

function showMakeResumeApplicationWorkspaces(openedPairs, returnTabId, runId) {
  if (!Array.isArray(openedPairs) || openedPairs.length === 0) {
    return false;
  }

  currentSplitWindowPairs = openedPairs;
  currentSplitWindowReturnTabId = returnTabId;

  openedPairs.forEach((pair, index) => {
    registerRunTab(runId, pair.tabId);
    showSaveWorkspacePreview({
      runId,
      batchIndex: index,
      batchCount: openedPairs.length,
      jobTitle: `Information page ${index + 1}`,
      jobUrl: pair.chatUrl,
      profileName: pair.profileName,
      profileNotes: pair.profileNotes,
      profileFound: pair.profileFound,
      resumeUrl: pair.resumeUrl,
      chatGptTabId: pair.tabId,
      chatGptUrl: pair.chatUrl,
      isReady: true,
      sessionType: "make-resume"
    });

    // Every tab in the batch can close the whole batch, so each one needs the
    // full pair list.
    const tabState = getTabState(pair.tabId);
    if (tabState) {
      tabState.splitWindowPairs = openedPairs;
      tabState.splitWindowReturnTabId = returnTabId;
    }
  });

  return true;
}

async function openSplitWindows() {

  if (splitWindowsModalOpenButton?.disabled) {
    return;
  }

  let batch;
  try {
    batch = parseSplitWindowUrls(splitWindowUrlsInput?.value);
  } catch (error) {
    const message =
      error.message || "Add valid Profile, Chat, Job, and Google Doc entries.";
    showStatus("error", message);
    addLog("error", message);
    splitWindowUrlsInput?.focus();
    return;
  }

  const { ownerTabId, runId } = beginRunForActiveTab();
  clearStatus();
  clearDeletedRowsForTab(ownerTabId);
  beginButtonProcessForTab(
    ownerTabId,
    "Make a resume clicked. Checking for an open Google Sheet..."
  );

  const openedPairs = [];
  let returnTabId = null;

  try {
    await requireOpenGoogleSheet();
    addLogForTab(
      ownerTabId,
      "info",
      `Google Sheet found. Opening ${batch.pairs.length} job/resume workspace${
        batch.pairs.length === 1 ? "" : "s"
      }...`
    );

    for (const [index, pair] of batch.pairs.entries()) {
      const savedProfile = getProfileByName(pair.profileName);
      const profileName = String(
        savedProfile?.name || pair.profileName || DEFAULT_PROFILE_NAME
      ).trim();
      const profileNotes = String(savedProfile?.notes || "").trim();
      const profileFound = Boolean(savedProfile);

      if (!profileFound) {
        addLogForTab(
          ownerTabId,
          "info",
          `No saved profile matched "${pair.profileName}"; no profile note will be shown.`
        );
      }
      addLogForTab(
        ownerTabId,
        "info",
        `Opening job ${index + 1} of ${batch.pairs.length}: ${pair.jobUrl}`
      );
      const response = await requestOpenUrlInNewTab(pair.jobUrl, runId, ownerTabId);

      if (returnTabId === null && Number.isInteger(response.returnTabId)) {
        returnTabId = response.returnTabId;
      }

      openedPairs.push({
        tabId: response.tabId,
        chatUrl: pair.chatUrl,
        jobUrl: pair.jobUrl,
        resumeUrl: pair.resumeUrl,
        profileName,
        profileNotes,
        profileFound,
        activeTab: "resume"
      });
    }

    const didOpenApplicationWorkspace =
      isSplitWindowsDialogOpen &&
      !splitWindowsModal?.classList.contains("is-hidden") &&
      showMakeResumeApplicationWorkspaces(openedPairs, returnTabId, runId);

    showStatusForTab(
      ownerTabId,
      "success",
      didOpenApplicationWorkspace
        ? `Opened ${openedPairs.length} job tab${
            openedPairs.length === 1 ? "" : "s"
          }. Switch among them to load each Application workspace.`
        : `Opened ${openedPairs.length} job tab${
            openedPairs.length === 1 ? "" : "s"
          }.`,
      "Opened:"
    );
    addLogForTab(
      ownerTabId,
      "success",
      didOpenApplicationWorkspace
        ? `${openedPairs.length} job/resume workspace${
            openedPairs.length === 1 ? "" : "s"
          } opened successfully.`
        : "Job tabs opened; the sidebar dialog was closed before previewing the resumes."
    );

  } catch (error) {
    if (
      openedPairs.length > 0 &&
      isSplitWindowsDialogOpen &&
      !splitWindowsModal?.classList.contains("is-hidden")
    ) {
      showMakeResumeApplicationWorkspaces(openedPairs, returnTabId, runId);
    }

    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Something went wrong."
    );
    addLogForTab(ownerTabId, "error", error.message || "Something went wrong.");
  } finally {
    finishButtonProcessForTab(ownerTabId);
  }
}

async function closeSplitWindowsAndReturn() {
  if (hasSaveWorkspaceSession() && !isSplitWindowsDialogOpen) {
    setSaveWorkspaceSidePanelView("home");
    return;
  }


  if (splitWindowsPreviewBackButton?.disabled) {
    return;
  }

  if (
    currentSplitWindowPairs.length === 0 ||
    !Number.isInteger(currentSplitWindowReturnTabId)
  ) {
    const message = "Could not identify the tabs needed to return.";
    showStatus("error", message);
    addLog("error", message);
    return;
  }

  const { ownerTabId, runId } = beginRunForActiveTab();
  clearStatus();
  clearDeletedRowsForTab(ownerTabId);
  beginButtonProcessForTab(
    ownerTabId,
    "Back clicked. Closing the created tabs and returning..."
  );

  try {
    const response = await chrome.runtime.sendMessage({
      type: "CLOSE_TABS_AND_RETURN",
      runId,
      ownerTabId,
      openedTabIds: currentSplitWindowPairs.map((pair) => pair.tabId),
      returnTabId: currentSplitWindowReturnTabId
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not return to the previous tab.");
    }

    setSplitWindowsModalOpen(false);
    showStatusForTab(
      ownerTabId,
      "success",
      response.url || "Previous tab restored.",
      "Returned:"
    );
    addLogForTab(
      ownerTabId,
      "success",
      "Created tabs closed and previous tab restored."
    );
  } catch (error) {
    console.error(error);
    showStatusForTab(
      ownerTabId,
      "error",
      error.message || "Something went wrong."
    );
    addLogForTab(ownerTabId, "error", error.message || "Something went wrong.");
  } finally {
    finishButtonProcessForTab(ownerTabId);
  }
}

applyNowButton?.addEventListener("click", applyNow);
saveButton?.addEventListener("click", saveCurrentTabUrl);
humanizeButton?.addEventListener("click", humanizeChat);
openSplitWindowsButton?.addEventListener("click", openSplitWindowsModal);
splitWindowsModalBackdrop?.addEventListener(
  "click",
  handleSplitWindowsHeaderAction
);
splitWindowsModalCloseButton?.addEventListener(
  "click",
  handleSplitWindowsHeaderAction
);
homeWorkspaceExchangeButton?.addEventListener("click", () =>
  exchangeSaveWorkspaceSidePanelView()
);
homeCancelProcessButton?.addEventListener("click", cancelSavePostProcess);
applicationCancelProcessButton?.addEventListener(
  "click",
  cancelSavePostProcess
);
splitWindowsModalCancelButton?.addEventListener("click", () => setSplitWindowsModalOpen(false));
splitWindowsModalOpenButton?.addEventListener("click", openSplitWindows);
splitWindowsPreviewBackButton?.addEventListener("click", closeSplitWindowsAndReturn);
splitWindowsPreviewDownloadButton?.addEventListener("click", downloadSplitWindowResume);
splitWindowsJobTabButton?.addEventListener("click", () =>
  setApplicationWorkspaceTab("profile")
);
splitWindowsResumeTabButton?.addEventListener("click", () =>
  setApplicationWorkspaceTab("resume")
);
splitWindowsPreviewFrame?.addEventListener(
  "error",
  showBlockedInformationPagePreview
);
applicationWorkspaceRefreshButton?.addEventListener(
  "click",
  refreshApplicationWorkspacePreview
);
applicationWorkspacePickupButton?.addEventListener(
  "click",
  pickupRemainingWorkspaceUrl
);
applicationWorkspaceNotesButton?.addEventListener(
  "click",
  openApplicationWorkspaceNotesModal
);
applicationWorkspaceCopyUrlButton?.addEventListener(
  "click",
  copyApplicationWorkspaceUrl
);
applicationWorkspaceUrlInput?.addEventListener("input", () => {
  applicationWorkspaceUrlInput.removeAttribute("aria-invalid");
  updateApplicationWorkspaceUrlControls();
});
applicationWorkspaceUrlInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    refreshApplicationWorkspacePreview();
  }
});
saveWorkspaceBuildButton?.addEventListener(
  "click",
  openBuildResumeContextModal
);
saveWorkspaceDownloadButton?.addEventListener(
  "click",
  downloadSaveWorkspaceResume
);
saveWorkspaceExchangeButton?.addEventListener(
  "click",
  exchangeSaveWorkspaceUrls
);
buildResumeContextModalBackdrop?.addEventListener("click", () =>
  setBuildResumeContextModalOpen(false)
);
buildResumeContextModalCloseButton?.addEventListener("click", () =>
  setBuildResumeContextModalOpen(false)
);
buildResumeContextCancelButton?.addEventListener("click", () =>
  setBuildResumeContextModalOpen(false)
);
buildResumeContextSubmitButton?.addEventListener(
  "click",
  submitBuildResumeContext
);
buildResumeContextInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    submitBuildResumeContext();
  }
});
splitWindowUrlsInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    openSplitWindows();
  }
});
splitWindowUrlsInput?.addEventListener("dragenter", (event) => {
  event.preventDefault();
  splitWindowUrlsInput.classList.add("is-drag-over");
});
splitWindowUrlsInput?.addEventListener("dragover", (event) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
  splitWindowUrlsInput.classList.add("is-drag-over");
});
splitWindowUrlsInput?.addEventListener("dragleave", () => {
  splitWindowUrlsInput.classList.remove("is-drag-over");
});
splitWindowUrlsInput?.addEventListener("drop", (event) => {
  event.preventDefault();
  splitWindowUrlsInput.classList.remove("is-drag-over");
  appendDroppedUrls(event.dataTransfer);
});

addProfileButton?.addEventListener("click", openAddProfileModal);
profileFormModalBackdrop?.addEventListener("click", () => setProfileFormModalOpen(false));
profileFormModalCloseButton?.addEventListener("click", () => setProfileFormModalOpen(false));
profileFormModalCancelButton?.addEventListener("click", () => setProfileFormModalOpen(false));
profileFormModalSubmitButton?.addEventListener("click", submitProfileForm);

profileNotesModalBackdrop?.addEventListener("click", () => setProfileNotesModalOpen(false));
profileNotesModalCloseButton?.addEventListener("click", () => setProfileNotesModalOpen(false));
profileNotesModalCancelButton?.addEventListener("click", () => setProfileNotesModalOpen(false));
profileNotesModalSubmitButton?.addEventListener("click", submitProfileNotesForm);

configToggleButton?.addEventListener("click", () => {

  setConfigModalOpen(true);
});

configModalBackdrop?.addEventListener("click", () => setConfigModalOpen(false));
configModalCloseButton?.addEventListener("click", () => setConfigModalOpen(false));
configModalCancelButton?.addEventListener("click", () => setConfigModalOpen(false));

saveConfigButton?.addEventListener("click", saveSheetConfig);

exportAppDataButton?.addEventListener("click", exportAppData);
importAppDataButton?.addEventListener("click", () => {
  importAppDataFileInput?.click();
});
importAppDataFileInput?.addEventListener("change", () => {
  const file = importAppDataFileInput.files?.[0];
  importAppDataFromFile(file);
});

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

promptFormModalBackdrop?.addEventListener("click", () => setPromptFormModalOpen(false));
promptFormModalCloseButton?.addEventListener("click", () => setPromptFormModalOpen(false));
promptFormModalCancelButton?.addEventListener("click", () => setPromptFormModalOpen(false));
promptFormModalSubmitButton?.addEventListener("click", submitPromptForm);

humanizeFormModalBackdrop?.addEventListener("click", () => setHumanizeFormModalOpen(false));
humanizeFormModalCloseButton?.addEventListener("click", () => setHumanizeFormModalOpen(false));
humanizeFormModalCancelButton?.addEventListener("click", () => setHumanizeFormModalOpen(false));
humanizeFormModalSubmitButton?.addEventListener("click", submitHumanizeForm);

jobDescriptionFormModalBackdrop?.addEventListener("click", () =>
  setJobDescriptionFormModalOpen(false)
);
jobDescriptionFormModalCloseButton?.addEventListener("click", () =>
  setJobDescriptionFormModalOpen(false)
);
jobDescriptionFormModalCancelButton?.addEventListener("click", () =>
  setJobDescriptionFormModalOpen(false)
);
jobDescriptionFormModalSubmitButton?.addEventListener("click", submitJobDescriptionForm);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (profileFormModal && !profileFormModal.classList.contains("is-hidden")) {
    setProfileFormModalOpen(false);
    return;
  }

  if (profileNotesModal && !profileNotesModal.classList.contains("is-hidden")) {
    setProfileNotesModalOpen(false);
    return;
  }

  if (promptResumeFormModal && !promptResumeFormModal.classList.contains("is-hidden")) {
    setPromptResumeFormModalOpen(false);
    return;
  }

  if (
    buildResumeContextModal &&
    !buildResumeContextModal.classList.contains("is-hidden")
  ) {
    setBuildResumeContextModalOpen(false);
    return;
  }

  if (splitWindowsModal && !splitWindowsModal.classList.contains("is-hidden")) {
    if (!isSplitWindowsDialogOpen) {
      setSaveWorkspaceSidePanelView("home");
    } else {
      setSplitWindowsModalOpen(false);
    }
    return;
  }

  if (promptFormModal && !promptFormModal.classList.contains("is-hidden")) {
    setPromptFormModalOpen(false);
    return;
  }

  if (humanizeFormModal && !humanizeFormModal.classList.contains("is-hidden")) {
    setHumanizeFormModalOpen(false);
    return;
  }

  if (jobDescriptionFormModal && !jobDescriptionFormModal.classList.contains("is-hidden")) {
    setJobDescriptionFormModalOpen(false);
    return;
  }

  if (configModal && !configModal.classList.contains("is-hidden")) {
    setConfigModalOpen(false);
  }
});

clearLogsButton?.addEventListener("click", () => {

  clearLogs();
  addLog("info", "Process logs cleared.");
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  // The side panel is scoped to one window, so ignore tab switches elsewhere.
  if (panelWindowId !== null && activeInfo.windowId !== panelWindowId) {
    return;
  }

  switchActiveTab(activeInfo.tabId);
  refreshMakeResumeButtonAvailability();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const hadWorkspace = saveWorkspacesByTabId.delete(tabId);
  forgetTabState(tabId);

  if (tabId === activeTabId) {
    activeTabId = null;
    currentSaveWorkspace = null;
    return;
  }

  if (hadWorkspace && !hasSaveWorkspaceSession() && !currentSaveWorkspace) {
    renderSaveWorkspaceSidePanelView();
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === "complete")) {
    refreshMakeResumeButtonAvailability();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (
    windowId === chrome.windows.WINDOW_ID_NONE ||
    (panelWindowId !== null && windowId !== panelWindowId)
  ) {
    return;
  }

  refreshMakeResumeButtonAvailability();

  try {
    const [focusedTab] = await chrome.tabs.query({
      active: true,
      windowId
    });
    switchActiveTab(focusedTab?.id);
  } catch (error) {
    console.error("Could not check the focused window tab:", error);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (
    changes[PROFILE_SELECTION_STORAGE_KEY] ||
    changes[PROMPT_RESUME_SELECTION_STORAGE_KEY] ||
    changes[JOB_DESCRIPTION_SELECTION_STORAGE_KEY]
  ) {
    if (changes[PROFILE_SELECTION_STORAGE_KEY]) {
      const changedSelection = changes[PROFILE_SELECTION_STORAGE_KEY].newValue;

      if (!isCurrentProfileSelectionState(changedSelection)) {
        loadProfileSelection().catch((error) => {
          console.error("Could not refresh profiles:", error);
        });
      }
    } else {
      refreshApplicationInputsAfterSave().catch((error) => {
        console.error("Could not refresh application inputs:", error);
      });
    }
  }

  if (changes[SAVE_POST_PROCESS_STORAGE_KEY]) {
    applySavePostProcessStates(
      changes[SAVE_POST_PROCESS_STORAGE_KEY].newValue
    );
  }
});

renderSaveWorkspaceSidePanelView();
updateLogsState();
updateDeletedRowsState();
loadProfileSelection();
loadSheetConfig();
loadPromptSelection();
loadHumanizePromptSelection();
loadJobDescriptionSelection();
initActiveTabTracking()
  .then(() => loadSavePostProcessState())
  .finally(() => {
    refreshMakeResumeButtonAvailability();
  });
