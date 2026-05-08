const noteInput = document.querySelector("#noteInput");
const saveButton = document.querySelector("#saveButton");
const status = document.querySelector("#status");

const STORAGE_KEY = "partial-width-panel-note";

async function loadNote() {
  const result = await chrome.storage?.local?.get?.(STORAGE_KEY);

  if (result && result[STORAGE_KEY]) {
    noteInput.value = result[STORAGE_KEY];
  }
}

async function saveNote() {
  const note = noteInput.value.trim();

  if (chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: note });
    status.textContent = "Saved locally.";
  } else {
    status.textContent = "Storage API unavailable.";
  }

  window.setTimeout(() => {
    status.textContent = "";
  }, 1800);
}

saveButton.addEventListener("click", saveNote);
loadNote();
