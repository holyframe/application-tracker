const saveButton = document.querySelector("#saveButton");
const applyNowButton = document.querySelector("#applyNowButton");
const removeDuplicatesButton = document.querySelector("#removeDuplicatesButton");
const humanizeButton = document.querySelector("#humanizeButton");
const makeResumeModal = document.querySelector("#makeResumeModal");
const makeResumeModalBackdrop = document.querySelector("#makeResumeModalBackdrop");
const makeResumeModalCloseButton = document.querySelector("#makeResumeModalCloseButton");
const makeResumeModalCancelButton = document.querySelector("#makeResumeModalCancelButton");
const makeResumeModalBuildButton = document.querySelector("#makeResumeModalBuildButton");
const makeResumeContentInput = document.querySelector("#makeResumeContentInput");
const statusCard = document.querySelector("#statusCard");
const statusTitle = document.querySelector("#statusTitle");
const status = document.querySelector("#status");
const deletedRowsCard = document.querySelector("#deletedRowsCard");
const deletedRowsList = document.querySelector("#deletedRowsList");
const emptyDeletedRows = document.querySelector("#emptyDeletedRows");
const logsList = document.querySelector("#logsList");
const emptyLogs = document.querySelector("#emptyLogs");
const clearLogsButton = document.querySelector("#clearLogsButton");
const configToggleButton = document.querySelector("#configToggleButton");
const configPanel = document.querySelector("#configPanel");
const spreadsheetIdInput = document.querySelector("#spreadsheetIdInput");
const sheetNameInput = document.querySelector("#sheetNameInput");
const resumeTemplateInput = document.querySelector("#resumeTemplateInput");
const saveConfigButton = document.querySelector("#saveConfigButton");
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
const uiLockNotice = document.querySelector("#uiLockNotice");
const appRoot = document.querySelector(".app");
const PROMPT_RESUME_SELECTION_STORAGE_KEY = "promptResumeSelection";
const JOB_DESCRIPTION_SELECTION_STORAGE_KEY = "jobDescriptionSelection";
const EXTENSION_UI_LOCK_STORAGE_KEY = "extensionUiLockedUntilNotification";
const PROFILE_SELECTION_STORAGE_KEY = "profileSelection";
const DEFAULT_PROFILE_NAME = "Default";

let activeRunId = null;
let isExtensionUiLocked = false;

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
  selectedProfileId: ""
};

let profileFormMode = "add";
let editingProfileId = null;

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
    selection?.selectedPromptResumeId === ""
      ? ""
      : promptResumes.some(
            (entry) => entry.id === selection?.selectedPromptResumeId
          )
        ? selection.selectedPromptResumeId
        : promptResumes[0]?.id || "";

  return { promptResumes, selectedPromptResumeId };
}

function createDefaultProfile(promptResumeSelection = null, resumeTemplateId = "") {
  const resumes = normalizePromptResumeSelection(promptResumeSelection);

  return {
    id: createProfileId(),
    name: DEFAULT_PROFILE_NAME,
    resumeTemplateId: String(resumeTemplateId || "").trim(),
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

function getSelectedProfile() {
  return (
    profileSelectionState.profiles.find(
      (entry) => entry.id === profileSelectionState.selectedProfileId
    ) ||
    profileSelectionState.profiles[0] ||
    null
  );
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

  profileSelectionState = {
    ...profileSelectionState,
    profiles: profileSelectionState.profiles.map((entry) =>
      entry.id === selectedProfile.id
        ? {
            ...entry,
            promptResumes: resumes.promptResumes,
            selectedPromptResumeId: resumes.selectedPromptResumeId
          }
        : entry
    )
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

function openAddProfileModal() {
  if (!guardExtensionUiAction()) {
    return;
  }

  profileFormMode = "add";
  editingProfileId = null;
  resetProfileFormModal();
  setProfileFormModalOpen(true);
}

function openEditProfileModal(profileId) {
  if (!guardExtensionUiAction()) {
    return;
  }

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
    const isExpanded = profile.id === profileSelectionState.selectedProfileId;
    const bodyId = `profile-body-${profile.id}`;

    const item = document.createElement("li");
    item.className = "profile-item";
    item.dataset.profileId = profile.id;
    item.classList.toggle("is-expanded", isExpanded);

    const header = document.createElement("div");
    header.className = "profile-item-header";

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
      selectProfile(profile.id);
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

      if (!guardExtensionUiAction()) {
        return;
      }

      if (profile.id !== profileSelectionState.selectedProfileId) {
        await selectProfile(profile.id);
      }

      openAddPromptResumeModal();
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

    actions.append(addPromptResumeButton, editButton, removeButton);
    header.append(toggle, actions);

    const body = document.createElement("div");
    body.id = bodyId;
    body.className = "profile-item-body";
    body.hidden = !isExpanded;

    if (isExpanded) {
      mountProfilePromptResumeSection(body);
    }

    item.append(header, body);
    profileList.appendChild(item);
  });
}

async function persistProfileSelection(successMessage) {
  const response = await chrome.runtime.sendMessage({
    type: "SAVE_PROFILE_SELECTION",
    profiles: profileSelectionState.profiles,
    selectedProfileId: profileSelectionState.selectedProfileId
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Could not save profile selection.");
  }

  profileSelectionState = normalizeProfileSelectionState(response);
  syncPromptResumeStateFromSelectedProfile();
  renderProfileList();

  if (successMessage) {
    addLog("success", successMessage);
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
    syncPromptResumeStateFromSelectedProfile();
    renderProfileList();
  } catch (error) {
    console.error(error);
    profileSelectionState = normalizeProfileSelectionState(null);
    syncPromptResumeStateFromSelectedProfile();
    renderProfileList();
    addLog("error", error.message || "Could not load profiles.");
  }
}

async function selectProfile(profileId) {
  if (!guardExtensionUiAction()) {
    return;
  }

  if (profileId === profileSelectionState.selectedProfileId) {
    return;
  }

  const profile = profileSelectionState.profiles.find((entry) => entry.id === profileId);
  profileSelectionState.selectedProfileId = profileId;

  try {
    await persistProfileSelection(`Selected profile: ${profile?.name || profileId}`);
  } catch (error) {
    console.error(error);
    addLog("error", error.message || "Could not update profile selection.");
    await loadProfileSelection();
  }
}

async function removeProfile(profileId) {
  if (!guardExtensionUiAction()) {
    return;
  }

  if (profileSelectionState.profiles.length <= 1) {
    addLog("error", "At least one profile is required.");
    return;
  }

  const removed = profileSelectionState.profiles.find((entry) => entry.id === profileId);
  profileSelectionState.profiles = profileSelectionState.profiles.filter(
    (entry) => entry.id !== profileId
  );

  if (profileSelectionState.selectedProfileId === profileId) {
    profileSelectionState.selectedProfileId =
      profileSelectionState.profiles[0]?.id || "";
  }

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
        promptResumes: [],
        selectedPromptResumeId: ""
      };
      profileSelectionState.profiles = [...profileSelectionState.profiles, profile];
      profileSelectionState.selectedProfileId = profile.id;
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

function setSaveButtonsDisabled(disabled) {
  if (applyNowButton) applyNowButton.disabled = disabled;
  if (saveButton) saveButton.disabled = disabled;
  if (humanizeButton) humanizeButton.disabled = disabled;
  if (removeDuplicatesButton) removeDuplicatesButton.disabled = disabled;
  if (makeResumeModalBuildButton) makeResumeModalBuildButton.disabled = disabled;
  if (saveConfigButton) saveConfigButton.disabled = disabled;
  if (addProfileButton) addProfileButton.disabled = disabled;
  profileList
    ?.querySelectorAll(".profile-add-prompt-resume")
    .forEach((button) => {
      button.disabled = disabled;
    });
  if (profileFormModalSubmitButton) profileFormModalSubmitButton.disabled = disabled;
  if (promptResumeFormModalSubmitButton) promptResumeFormModalSubmitButton.disabled = disabled;
  if (promptFormModalSubmitButton) promptFormModalSubmitButton.disabled = disabled;
  if (humanizeFormModalSubmitButton) humanizeFormModalSubmitButton.disabled = disabled;
  if (jobDescriptionFormModalSubmitButton) jobDescriptionFormModalSubmitButton.disabled = disabled;
}

function closeOpenModalsForUiLock() {
  setProfileFormModalOpen(false);
  setMakeResumeModalOpen(false);
  setPromptResumeFormModalOpen(false);
  setPromptFormModalOpen(false);
  setHumanizeFormModalOpen(false);
  setJobDescriptionFormModalOpen(false);
}

function applyExtensionUiLockState(locked) {
  isExtensionUiLocked = locked;

  appRoot?.classList.toggle("is-ui-locked", locked);
  uiLockNotice?.classList.toggle("is-hidden", !locked);

  if (clearLogsButton) clearLogsButton.disabled = locked;
  if (configToggleButton) configToggleButton.disabled = locked;
  if (spreadsheetIdInput) spreadsheetIdInput.disabled = locked;
  if (sheetNameInput) sheetNameInput.disabled = locked;
  if (resumeTemplateInput) resumeTemplateInput.disabled = locked;

  if (locked) {
    closeOpenModalsForUiLock();
  }

  setSaveButtonsDisabled(locked);
}

function guardExtensionUiAction() {
  if (!isExtensionUiLocked) {
    return true;
  }

  addLog("info", "Waiting for check notification. Process logs only.");
  return false;
}

async function loadExtensionUiLockState() {
  try {
    const stored = await chrome.storage.local.get(EXTENSION_UI_LOCK_STORAGE_KEY);
    applyExtensionUiLockState(Boolean(stored[EXTENSION_UI_LOCK_STORAGE_KEY]?.locked));
  } catch (error) {
    console.error("Could not load extension UI lock state:", error);
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
  if (!guardExtensionUiAction()) {
    return;
  }

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

  if (successMessage) {
    addLog("success", successMessage);
  }
}

async function selectPromptResume(promptResumeId) {
  if (promptResumeId === promptResumeSelectionState.selectedPromptResumeId) {
    return;
  }

  const promptResume = promptResumeSelectionState.promptResumes.find(
    (entry) => entry.id === promptResumeId
  );
  promptResumeSelectionState.selectedPromptResumeId = promptResumeId;
  addLog("info", `Selected prompt resume: ${promptResume?.label || promptResumeId}`);

  try {
    await persistPromptResumeSelection("Prompt resume selection updated.");
  } catch (error) {
    console.error(error);
    const message = error.message || "Could not update selection.";
    addLog("error", message);
    await loadPromptResumeSelection();
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
    promptResumeSelectionState.selectedPromptResumeId =
      promptResumeSelectionState.promptResumes[0]?.id || "";
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

function setConfigPanelOpen(isOpen) {
  if (!configToggleButton || !configPanel) return;

  const scrollTop = document.documentElement.scrollTop;

  configToggleButton.setAttribute("aria-expanded", String(isOpen));
  configPanel.classList.toggle("is-open", isOpen);
  configToggleButton.classList.toggle("is-open", isOpen);

  document.documentElement.scrollTop = scrollTop;
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
  if (!guardExtensionUiAction()) {
    return;
  }

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

function beginButtonProcess(startingMessage) {
  clearLogs();
  setSaveButtonsDisabled(true);
  if (startingMessage) {
    addLog("info", startingMessage);
  }
}

function finishButtonProcess() {
  setSaveButtonsDisabled(isExtensionUiLocked);
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

async function refreshApplicationInputsAfterSave() {
  await Promise.all([loadProfileSelection(), loadJobDescriptionSelection()]);
}

function validateSaveCurrentTabInputs() {
  const missing = [];

  if (!promptState.content?.trim()) {
    missing.push("GPT prompt");
  }

  if (!jobDescriptionState.content?.trim()) {
    missing.push("job description");
  }

  const hasSelectedResume =
    Boolean(promptResumeSelectionState.selectedPromptResumeId) &&
    promptResumeSelectionState.promptResumes.some(
      (entry) => entry.id === promptResumeSelectionState.selectedPromptResumeId
    );

  if (!hasSelectedResume) {
    missing.push("prompt resume selection");
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

async function validateActiveBrowserTabForAppAction() {
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
  if (!guardExtensionUiAction()) {
    return;
  }

  clearStatus();
  clearDeletedRows();

  const validation = validateSaveCurrentTabInputs();
  if (!validation.ok) {
    showStatus("error", validation.error);
    addLog("error", validation.error);
    return;
  }

  const tabValidation = await validateActiveBrowserTabForAppAction();
  if (!tabValidation.ok) {
    showStatus("error", tabValidation.error);
    addLog("error", tabValidation.error);
    return;
  }

  activeRunId = createRunId();

  applyExtensionUiLockState(true);
  beginButtonProcess(
    mode === "apply"
      ? "Apply Now clicked. Starting process..."
      : "Save App clicked. Starting process..."
  );

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_CURRENT_TAB_URL_TO_SHEET",
      runId: activeRunId,
      mode
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save URL.");
    }

    showStatus("success", response.url);
    addLog(
      "success",
      mode === "apply"
        ? "Application tabs grouped successfully."
        : "Process completed successfully."
    );
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Something went wrong.");
    addLog("error", error.message || "Something went wrong.");
    applyExtensionUiLockState(false);
  } finally {
    finishButtonProcess();
  }
}

async function saveCurrentTabUrl() {
  await runCurrentAppAction("save");
}

async function applyNow() {
  await runCurrentAppAction("apply");
}

function setMakeResumeModalOpen(isOpen) {
  if (!makeResumeModal) return;

  makeResumeModal.classList.toggle("is-hidden", !isOpen);
  makeResumeModal.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    const selectedPromptResume = promptResumeSelectionState.promptResumes.find(
      (entry) => entry.id === promptResumeSelectionState.selectedPromptResumeId
    );

    if (makeResumeContentInput) {
      makeResumeContentInput.value = selectedPromptResume?.content || "";
    }

    makeResumeContentInput?.focus();
    return;
  }

  if (makeResumeContentInput) makeResumeContentInput.value = "";
  removeDuplicatesButton?.focus();
}

function openMakeResumeModal() {
  if (!guardExtensionUiAction()) {
    return;
  }

  setMakeResumeModalOpen(true);
}

async function buildResume() {
  if (!guardExtensionUiAction()) {
    return;
  }

  const resumeText = makeResumeContentInput?.value.trim() || "";
  if (!resumeText) {
    const message = "Resume text is required before creating a Google Doc.";
    showStatus("error", message);
    addLog("error", message);
    makeResumeContentInput?.focus();
    return;
  }

  setMakeResumeModalOpen(false);

  activeRunId = createRunId();

  clearStatus();
  clearDeletedRows();
  beginButtonProcess("Build resume clicked. Creating Google Doc in Drive...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "CREATE_GOOGLE_DOC",
      runId: activeRunId,
      resumeText
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not create Google Doc.");
    }

    showStatus("success", response.url || "", "Resume:");
    addLog("success", "Google Doc created in Drive.");
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Something went wrong.");
    addLog("error", error.message || "Something went wrong.");
  } finally {
    finishButtonProcess();
  }
}

async function removeDuplicateSheetRows() {
  if (!guardExtensionUiAction()) {
    return;
  }

  activeRunId = createRunId();

  clearStatus();
  clearDeletedRows();
  beginButtonProcess("Make a resume clicked. Scanning sheet...");

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
    finishButtonProcess();
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "HOTKEY_SAVE_STARTED") {
    activeRunId = message.runId;
    clearStatus();
    clearDeletedRows();
    applyExtensionUiLockState(true);
    beginButtonProcess("Hotkey detected. Starting save process...");
    return;
  }

  if (message.type === "APPLICATION_INPUTS_RESET") {
    refreshApplicationInputsAfterSave().catch((error) => {
      console.error("Could not refresh application inputs:", error);
    });
    addLog("info", message.message || "Application inputs cleared.");
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
      applyExtensionUiLockState(false);
    }

    finishButtonProcess();
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

async function humanizeChat() {
  if (!guardExtensionUiAction()) {
    return;
  }

  activeRunId = createRunId();

  clearStatus();
  clearDeletedRows();
  beginButtonProcess("Humanize clicked. Sending prompt to ChatGPT...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "HUMANIZE_CHATGPT",
      runId: activeRunId
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not send humanize prompt.");
    }

    showStatus("success", response.url || "https://chatgpt.com", "Sent:");
    addLog("success", "Humanize prompt sent to ChatGPT.");
  } catch (error) {
    console.error(error);
    showStatus("error", error.message || "Something went wrong.");
    addLog("error", error.message || "Something went wrong.");
  } finally {
    finishButtonProcess();
  }
}

applyNowButton?.addEventListener("click", applyNow);
saveButton?.addEventListener("click", saveCurrentTabUrl);
removeDuplicatesButton?.addEventListener("click", openMakeResumeModal);
humanizeButton?.addEventListener("click", humanizeChat);

addProfileButton?.addEventListener("click", openAddProfileModal);
profileFormModalBackdrop?.addEventListener("click", () => setProfileFormModalOpen(false));
profileFormModalCloseButton?.addEventListener("click", () => setProfileFormModalOpen(false));
profileFormModalCancelButton?.addEventListener("click", () => setProfileFormModalOpen(false));
profileFormModalSubmitButton?.addEventListener("click", submitProfileForm);

makeResumeModalBackdrop?.addEventListener("click", () => setMakeResumeModalOpen(false));
makeResumeModalCloseButton?.addEventListener("click", () => setMakeResumeModalOpen(false));
makeResumeModalCancelButton?.addEventListener("click", () => setMakeResumeModalOpen(false));
makeResumeModalBuildButton?.addEventListener("click", buildResume);

configToggleButton?.addEventListener("click", () => {
  if (!guardExtensionUiAction()) {
    return;
  }

  const isOpen = configToggleButton.getAttribute("aria-expanded") === "true";
  setConfigPanelOpen(!isOpen);
});

saveConfigButton?.addEventListener("click", saveSheetConfig);

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

  if (promptResumeFormModal && !promptResumeFormModal.classList.contains("is-hidden")) {
    setPromptResumeFormModalOpen(false);
    return;
  }

  if (makeResumeModal && !makeResumeModal.classList.contains("is-hidden")) {
    setMakeResumeModalOpen(false);
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
  }
});

clearLogsButton?.addEventListener("click", () => {
  if (!guardExtensionUiAction()) {
    return;
  }

  clearLogs();
  addLog("info", "Process logs cleared.");
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
      loadProfileSelection().catch((error) => {
        console.error("Could not refresh profiles:", error);
      });
    } else {
      refreshApplicationInputsAfterSave().catch((error) => {
        console.error("Could not refresh application inputs:", error);
      });
    }
  }

  if (changes[EXTENSION_UI_LOCK_STORAGE_KEY]) {
    applyExtensionUiLockState(Boolean(changes[EXTENSION_UI_LOCK_STORAGE_KEY].newValue?.locked));
  }
});

updateLogsState();
updateDeletedRowsState();
loadProfileSelection();
loadSheetConfig();
loadPromptSelection();
loadHumanizePromptSelection();
loadJobDescriptionSelection();
loadExtensionUiLockState();