const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "sidepanel/sidepanel.js"), "utf8");
const html = fs.readFileSync(path.join(root, "sidepanel/sidepanel.html"), "utf8");

function workerHelpers() {
  const context = vm.createContext({
    URL,
    URLSearchParams,
    Set,
    Map,
    Array,
    String,
    Boolean
  });
  const pieces = [];
  for (const name of [
    "isBlankTabUrl",
    "isKnownSplitViewId",
    "buildSplitTabCreateOptions",
    "computeSideBySideWindowBounds",
    "isJobrightRecommendationsUrl"
  ]) {
    const match = worker.match(
      new RegExp("^(?:async )?function " + name + "\\b[\\s\\S]*?^}\\r?$", "m")
    );
    assert.ok(match, name);
    pieces.push(match[0]);
  }
  vm.runInContext(pieces.join("\n"), context);
  return context;
}

test("Home workspace Check posting opens a blank tab beside the current tab", () => {
  const checkIndex = html.indexOf('id="checkPostingButton"');
  const sheetIndex = html.indexOf('id="openGoogleSheetButton"');
  const profilesIndex = html.indexOf('<section class="card profile-picker-card">');
  assert.ok(checkIndex > 0 && checkIndex < sheetIndex);
  assert.ok(sheetIndex < profilesIndex);
  assert.equal(html.includes('id="checkPostingModal"'), false);
  assert.match(html, />Check posting</);
  assert.match(panel, /checkPostingButton\?\.addEventListener\("click", checkCurrentPosting\)/);
  assert.match(panel, /type: "OPEN_BLANK_TAB_BESIDE"/);
  assert.match(worker, /OPEN_BLANK_TAB_BESIDE: openBlankTabBesideCurrentTab/);
  assert.match(worker, /url: "about:blank"/);
  assert.doesNotMatch(worker, /CHECK_POSTING_IN_SHEET/);
  assert.doesNotMatch(worker, /collectPostingMatchesFromSheetValues/);
});

test("Check posting is limited to job posting pages", () => {
  const ctx = workerHelpers();
  assert.equal(
    ctx.isJobrightRecommendationsUrl("https://jobright.ai/jobs/recommend"),
    true
  );
  assert.equal(
    ctx.isJobrightRecommendationsUrl("https://jobright.ai/jobs/info/abc"),
    false
  );
  assert.match(
    worker,
    /isGoogleSheetsDocumentUrl\(tab\.url\) \|\| isJobrightRecommendationsUrl\(tab\.url\)/
  );
});

test("Check posting opens a blank tab beside the current tab", () => {
  const ctx = workerHelpers();
  assert.equal(ctx.isBlankTabUrl(""), true);
  assert.equal(ctx.isBlankTabUrl("about:blank"), true);
  assert.equal(ctx.isBlankTabUrl("https://example.com"), false);
  assert.equal(ctx.isKnownSplitViewId(-1), false);
  assert.equal(ctx.isKnownSplitViewId(12), true);

  const createOptions = JSON.parse(
    JSON.stringify(
      ctx.buildSplitTabCreateOptions("about:blank", {
        id: 7,
        windowId: 3,
        index: 2
      })
    )
  );
  assert.deepEqual(createOptions, {
    url: "about:blank",
    active: false,
    splitWithTabId: 7,
    windowId: 3,
    index: 3
  });

  const bounds = JSON.parse(
    JSON.stringify(
      ctx.computeSideBySideWindowBounds({
        left: 100,
        top: 40,
        width: 1600,
        height: 900
      })
    )
  );
  assert.deepEqual(bounds.source, {
    left: 100,
    top: 40,
    width: 800,
    height: 900,
    state: "normal"
  });
  assert.deepEqual(bounds.next, {
    left: 900,
    top: 40,
    width: 800,
    height: 900
  });
});
