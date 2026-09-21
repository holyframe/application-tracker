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
  for (const name of ["APPLICATION_SHEET_HEADERS", "TRACKING_PARAM_KEYS"]) {
    const match = worker.match(
      new RegExp("^const " + name + " = [\\s\\S]*?;\\r?$", "m")
    );
    assert.ok(match, name);
    pieces.push(match[0]);
  }
  for (const name of [
    "hasSheetHeaders",
    "hasApplicationSheetHeaders",
    "normalizeUrlForStorage",
    "normalizeUrlKeyForDedupe",
    "applicationSheetRowMatchesRecord",
    "collectPostingSheetNames",
    "collectPostingMatchesFromSheetValues",
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

test("Home workspace exposes Check posting beside Open Google Sheet", () => {
  const checkIndex = html.indexOf('id="checkPostingButton"');
  const sheetIndex = html.indexOf('id="openGoogleSheetButton"');
  const modalIndex = html.indexOf('id="checkPostingModal"');
  const profilesIndex = html.indexOf('<section class="card profile-picker-card">');
  assert.ok(checkIndex > 0 && checkIndex < sheetIndex);
  assert.ok(sheetIndex < profilesIndex);
  assert.ok(modalIndex > 0);
  assert.match(html, />Check posting</);
  assert.match(panel, /checkPostingButton\?\.addEventListener\("click", checkCurrentPosting\)/);
  assert.match(worker, /CHECK_POSTING_IN_SHEET: checkPostingInSheet/);
});

test("Check posting searches unique profile sheet names and the default tab", () => {
  const ctx = workerHelpers();
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        ctx.collectPostingSheetNames(
          {
            profiles: [
              { name: "Alice" },
              { name: "Bob" },
              { name: "alice" },
              { name: "  " }
            ]
          },
          "Sheet1"
        )
      )
    ),
    ["Alice", "Bob", "Sheet1"]
  );
});

test("Check posting matches normalized job URLs and skips the header row", () => {
  const ctx = workerHelpers();
  const values = [
    [
      "ISO timestamp",
      "Job-page title",
      "Profile name",
      "AI conversation URL",
      "Normalized job URL",
      "Copied resume Google Doc URL",
      "Apply Now"
    ],
    [
      "2026-09-20T12:00:00Z",
      "Software Engineer",
      "Alice",
      "No Model",
      "https://jobs.example.com/42?utm_source=jobright",
      "https://docs.google.com/document/d/resume/edit",
      ""
    ],
    [
      "2026-09-19T12:00:00Z",
      "Other role",
      "Alice",
      "No Model",
      "https://jobs.example.com/99",
      "",
      ""
    ]
  ];

  const matches = ctx.collectPostingMatchesFromSheetValues(values, {
    jobUrl: "https://jobs.example.com/42?fbclid=abc",
    profileName: "Alice",
    sheetUrl: "https://docs.google.com/spreadsheets/d/sheet/edit#gid=7"
  });

  assert.equal(matches.length, 1);
  assert.equal(matches[0].rowNumber, 2);
  assert.equal(matches[0].title, "Software Engineer");
  assert.equal(matches[0].profileName, "Alice");
  assert.equal(matches[0].sheetUrl, "https://docs.google.com/spreadsheets/d/sheet/edit#gid=7");
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
});
