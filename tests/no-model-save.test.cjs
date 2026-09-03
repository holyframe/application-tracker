const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const root = path.resolve(__dirname, "..");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "sidepanel/sidepanel.js"), "utf8");
function load(source, names, context) {
  for (const name of names) {
    const match = source.match(new RegExp("^(?:async )?function " + name + "\\b[\\s\\S]*?^}\\r?$", "m"));
    assert.ok(match, name);
    vm.runInContext(match[0], context);
  }
}
function fixture({ mode = "none", failCopy = -1, failSheet = -1, cancelCopy = -1 } = {}) {
  const profiles = ["Frontend", "Backend", "Data"].map((name, index) => ({
    id: String(index), name, resumeTemplateId: "template" + index,
    selectedPromptResumeId: "", promptResumes: []
  }));
  const storage = {}, snapshots = [], rows = [], copies = [], cleanup = [];
  const controller = new AbortController();
  const cancelled = () => Object.assign(new Error("Cancelled"), { cancelled: true });
  let schedule;
  const ctx = vm.createContext({
    console, Date, URL, URLSearchParams, Map, Set, AbortController,
    NO_MODEL_PROGRESS_STORAGE_KEY: "progress",
    TRACKING_PARAM_KEYS: new Set(["ref"]),
    getPromptSelectionState: async () => ({ content: "" }),
    getJobDescriptionSelectionState: async () => ({ content: "" }),
    getProfileSelectionState: async () => ({ profiles, selectedProfileIds: profiles.map((p) => p.id) }),
    getSheetConfig: async () => ({ aiProviderId: mode }),
    normalizeAiProviderId: (id) => id || "chatgpt",
    getAiProviderConfig: (id) => ({ id, saveOnly: id === "none" }),
    sendLog: () => {},
    assertActiveJobTabUsable: (tab) => assert.equal(tab.id, 7),
    scheduleSavePostProcess: async (options) => { schedule = options; },
    getActiveSaveProcessSignal: () => controller.signal,
    getGoogleAccessToken: async () => "fake-token",
    waitForSaveProcessOperation: async (operation, signal) => {
      if (signal.aborted) throw cancelled();
      return operation();
    },
    throwIfSaveProcessCancelled: (signal) => { if (signal.aborted) throw cancelled(); },
    isSaveProcessCancelledError: (error) => error.cancelled === true,
    getProfileResumeTemplateId: (profile) => profile.resumeTemplateId,
    copyResumeAndGetUrl: async (_token, title, template) => {
      const index = copies.length;
      copies.push({ title, template });
      if (index === failCopy) throw new Error("Copy failed");
      if (index === cancelCopy) { controller.abort(); throw cancelled(); }
      return `https://docs.google.com/document/d/copy${index}/edit`;
    },
    appendRowsToGoogleSheet: async (values, _runId, options) => {
      if (rows.length === failSheet) throw new Error("Sheet failed");
      rows.push({ values: structuredClone(values), sheetName: options.sheetName });
      return {
        sheetUrl:
          `https://docs.google.com/spreadsheets/d/test-sheet/edit#gid=${rows.length}`
      };
    },
    updateSavePostProcessProgress: async () => {},
    completeSavePostProcess: async () => { assert.equal(schedule.saveOnly, true); cleanup.push("complete"); },
    clearSavePostProcess: async (options) => cleanup.push(options),
    buildChatGptMessageFromStorage: () => assert.fail("No Model must not prepare AI context"),
    notifyExtensionPages: () => assert.fail("No Model must not activate an Application workspace"),
    createSaveProfileTargetTabIds: () => assert.fail("No Model must not create profile tabs"),
    chrome: {
      tabs: { get: async () => ({ id: 7, title: "Engineer", url: "https://jobs.example/42?utm_source=test&id=42" }) },
      storage: { session: {
        get: async () => structuredClone(storage),
        set: async (values) => {
          Object.assign(storage, structuredClone(values));
          if (storage.progress?.[7]) snapshots.push(structuredClone(storage.progress[7]));
        }
      } }
    }
  });
  load(worker, ["getSelectedProfilesFromState", "formatSaveValidationError", "validateApplicationInputsForSave",
    "normalizeUrlForStorage", "buildApplicationSheetRow", "persistNoModelProgress", "clearNoModelProgressForTab",
    "runNoModelSave", "runSaveCurrentTabUrlToSheet"], ctx);
  return { ctx, profiles, storage, rows, copies, snapshots, cleanup,
    run: (aiProviderId = "") => ctx.runSaveCurrentTabUrlToSheet(
      "test-run",
      { ownerTabId: 7, aiProviderId }
    ) };
}

test("No Model requires profiles, not prompts, job descriptions, or prompt resumes", async () => {
  const { ctx, profiles } = fixture();
  assert.equal((await ctx.validateApplicationInputsForSave()).ok, true);
  profiles.splice(0);
  assert.deepEqual([...(await ctx.validateApplicationInputsForSave()).missing], ["profile selection"]);
});
test("an explicit No Model save overrides a stale saved ChatGPT provider", async () => {
  const { run, rows } = fixture({ mode: "chatgpt" });
  const result = await run("none");
  assert.equal(result.profileCount, 3);
  assert.equal(rows.length, 3);
});
for (const mode of ["chatgpt", "deepseek"]) {
  test(`${mode} retains AI input validation`, async () => {
    const result = await fixture({ mode }).ctx.validateApplicationInputsForSave();
    assert.equal(result.ok, false);
    assert.ok(result.missing.includes("AI prompt"));
    assert.ok(result.missing.includes("job description"));
    assert.match(result.error, /prompt resume/);
  });
}
test("No Model saves every selected profile, blank column D, and never switches or opens tabs", async () => {
  const { run, rows, copies, storage, snapshots } = fixture();
  const result = await run();
  assert.equal(result.profileCount, 3);
  assert.equal(rows.length, 3);
  assert.equal(storage.progress[7].status, "completed");
  assert.deepEqual(
    storage.progress[7].profiles.map((profile) => profile.sheetUrl),
    [1, 2, 3].map(
      (gid) => `https://docs.google.com/spreadsheets/d/test-sheet/edit#gid=${gid}`
    )
  );
  assert.deepEqual(rows.map((row) => row.sheetName), ["Frontend", "Backend", "Data"]);
  rows.forEach(({ values }, index) => {
    const row = values[0];
    assert.equal(row.length, 7);
    assert.equal(row[1], "Engineer");
    assert.equal(row[3], "");
    assert.equal(row[4], "https://jobs.example/42?id=42");
    assert.equal(row[5], `https://docs.google.com/document/d/copy${index}/edit`);
  });
  assert.equal(copies[1].title, "Engineer - Backend");
  assert.ok(snapshots.some((report) => report.profiles[0].stage === "sheet"));
  assert.ok(snapshots.some((report) => report.profiles[0].status === "saved" && report.profiles[1].status === "queued"));
});
test("Google Sheet links target the exact saved profile tab", () => {
  const ctx = vm.createContext({});
  load(worker, ["parseSpreadsheetId", "buildGoogleSheetTabUrl"], ctx);
  assert.equal(
    ctx.buildGoogleSheetTabUrl(
      "https://docs.google.com/spreadsheets/d/sheet_123/edit",
      456
    ),
    "https://docs.google.com/spreadsheets/d/sheet_123/edit#gid=456"
  );
});
test("copy failure retains saved profiles and marks remaining ones as not started", async () => {
  const { run, rows, storage, cleanup } = fixture({ failCopy: 1 });
  await assert.rejects(run(), /Copy failed/);
  assert.equal(rows.length, 1);
  assert.deepEqual(storage.progress[7].profiles.map((profile) => profile.status), ["saved", "failed", "skipped"]);
  assert.equal(cleanup[0].resetInputs, false);
});
test("sheet failure keeps the resume link and does not mark its row saved", async () => {
  const { run, storage } = fixture({ failSheet: 0 });
  await assert.rejects(run(), /Sheet failed/);
  assert.equal(storage.progress[7].profiles[0].stage, "sheet");
  assert.equal(storage.progress[7].profiles[0].status, "failed");
  assert.ok(storage.progress[7].profiles[0].resumeUrl);
});
test("cancellation stops later profiles, preserving confirmed records and inputs", async () => {
  const { run, rows, storage, cleanup } = fixture({ cancelCopy: 1 });
  await assert.rejects(run(), /Cancelled/);
  assert.equal(rows.length, 1);
  assert.equal(storage.progress[7].status, "cancelled");
  assert.deepEqual(storage.progress[7].profiles.map((profile) => profile.status), ["saved", "cancelled", "cancelled"]);
  assert.equal(cleanup[0].resetInputs, false);
});
test("closing a tab drops its saved progress", async () => {
  const { run, ctx, storage } = fixture();
  await run();
  await ctx.clearNoModelProgressForTab(7);
  assert.equal(storage.progress[7], undefined);
});

for (const reason of ["completed", "cancelled"]) {
  test(`No Model ${reason} cleanup preserves AI inputs and selections`, async () => {
    let resets = 0;
    const state = { runId: "run", saveOnly: true };
    const ctx = vm.createContext({
      SAVE_POST_PROCESS_STORAGE_KEY: "save", SAVE_POST_PROCESS_ALARM_NAME: "alarm",
      getSavePostProcessStates: async () => ({ 7: state }),
      findSavePostProcessEntry: () => ({ tabId: 7, state }),
      activeSaveProcessControllers: new Map([["run", new AbortController()]]),
      resetApplicationInputsAfterSave: async () => { resets++; },
      sendLog: () => {}, releaseRunOwnerTab: () => {},
      chrome: { alarms: { clear: async () => {} }, storage: { local: { remove: async () => {} } } }
    });
    load(worker, ["performSavePostProcessCleanup"], ctx);
    await ctx.performSavePostProcessCleanup({ reason, resetInputs: true, runId: "run", ownerTabId: 7 });
    assert.equal(resets, 0);
  });
}
test("No Model suppresses the job-description modal even when requested", () => {
  let hidden, aria;
  const ctx = vm.createContext({
    configuredAiProviderId: "none", aiProviderInput: null,
    normalizeAiProviderId: (value) => value || "chatgpt", isCurrentTabJobright: false,
    jobDescriptionFormModal: { classList: { toggle: (_name, value) => { hidden = value; } },
      setAttribute: (_name, value) => { aria = value; } },
    jobDescriptionContentInput: { value: "draft" }, jobDescriptionList: null
  });
  load(panel, ["getSelectedAiProviderId", "isNoModelSaveMode", "setJobDescriptionFormModalOpen"], ctx);
  ctx.setJobDescriptionFormModalOpen(true);
  assert.equal(hidden, true);
  assert.equal(aria, "true");
  assert.match(panel, /Promise\.all\(\[loadSheetConfig\(\), loadNoModelSaveProgress\(\)/);
});
test("frontend validation follows the selected mode rather than requiring AI text for No Model", () => {
  const ctx = vm.createContext({ configuredAiProviderId: "chatgpt", aiProviderInput: { value: "none" },
    normalizeAiProviderId: (value) => value || "chatgpt", promptState: {}, jobDescriptionState: {},
    getSelectedProfiles: () => [{ name: "Profile", selectedPromptResumeId: "", promptResumes: [] }] });
  load(panel, ["getSelectedAiProviderId", "isNoModelSaveMode", "validateSaveCurrentTabInputs"], ctx);
  assert.equal(ctx.validateSaveCurrentTabInputs().ok, true);
  ctx.aiProviderInput.value = "chatgpt";
  assert.equal(ctx.validateSaveCurrentTabInputs().ok, false);
});
test("Save App sends the provider currently selected in the dropdown", () => {
  assert.match(panel, /aiProviderId:\s*getSelectedAiProviderId\(\)/);
  assert.match(worker, /validateApplicationInputsForSave\(\s*options\.aiProviderId\s*\)/);
});
test("saved No Model rows with blank D import, while malformed populated chat URLs still fail", () => {
  const ctx = vm.createContext({ URL });
  load(panel, ["normalizeSplitWindowUrl", "unwrapMarkdownEmphasis", "parseSplitWindowUrlField",
    "isSavedApplicationSheetHeader", "parseSplitWindowUrls", "isSupportedAiUrl", "isGoogleDocsUrl"], ctx);
  const row = "2026-09-03\tEngineer\tFrontend\t\thttps://jobs.example/42\thttps://docs.google.com/document/d/resume/edit\t";
  assert.equal(ctx.parseSplitWindowUrls(row).pairs[0].chatUrl, "");
  assert.throws(() => ctx.parseSplitWindowUrls(row.replace("Frontend\t\t", "Frontend\tjavascript:bad\t")), /http/);
});
