const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "sidepanel/sidepanel.js"), "utf8");
const html = fs.readFileSync(path.join(root, "sidepanel/sidepanel.html"), "utf8");
const copilot = fs.readFileSync(path.join(root, "content/copilot.js"), "utf8");
const manifest = fs.readFileSync(path.join(root, "manifest.json"), "utf8");

function extractFunction(name) {
  const match = worker.match(
    new RegExp(`^(?:async )?function ${name}\\b[\\s\\S]*?^}\\r?$`, "m")
  );
  assert.ok(match, name);
  return match[0];
}

function workerHelpers() {
  const context = vm.createContext({
    URL,
    URLSearchParams,
    Set,
    Map,
    Array,
    String,
    Boolean,
    CHECK_POSTING_COPILOT_URL:
      "https://copilot.microsoft.com/chats/697VK9N9TzfDdzE8zPNrx"
  });
  vm.runInContext(extractFunction("isCopilotChatUrl"), context);
  vm.runInContext(extractFunction("isCheckPostingAiUrl"), context);
  vm.runInContext(extractFunction("checkPostingAiDefaults"), context);
  vm.runInContext(extractFunction("normalizeCheckPostingProviderId"), context);
  vm.runInContext(extractFunction("checkPostingAiLabel"), context);
  vm.runInContext(extractFunction("normalizeCheckPostingAiUrl"), context);
  vm.runInContext(extractFunction("resolveJobPageFromTab"), context);
  return context;
}

test("Check posting opens Copilot and sends the current tab URL", () => {
  const checkIndex = html.indexOf('id="checkPostingButton"');
  const settingsIndex = html.indexOf('id="checkPostingOptionsButton"');
  const sheetIndex = html.indexOf('id="openGoogleSheetButton"');
  const profilesIndex = html.indexOf('<section class="card profile-picker-card">');
  assert.ok(checkIndex > 0 && checkIndex < settingsIndex);
  assert.ok(settingsIndex > 0 && settingsIndex < sheetIndex);
  assert.ok(sheetIndex < profilesIndex);
  assert.match(html, />Check posting</);
  assert.match(html, /aria-label="Check posting settings"/);
  assert.match(html, /id="checkPostingActionSettingsModal"/);
  assert.match(html, /id="checkPostingUrl-copilot"/);
  assert.match(html, /id="checkPostingUrl-perplexity"/);
  assert.match(html, /id="checkPostingUrl-deepseek"/);
  assert.match(html, /name="checkPostingAiProvider"/);
  assert.match(html, /id="checkPostingAutoNextTabInput"/);
  assert.match(html, /Automatic next tab/);
  assert.match(
    panel,
    /checkPostingButton\?\.addEventListener\("click", checkCurrentPosting\)/
  );
  assert.match(panel, /actionSettingsDialogs[\s\S]*checkPosting:/);
  assert.match(panel, /type: "CHECK_POSTING_TO_COPILOT"/);
  assert.match(panel, /type: "SAVE_CHECK_POSTING_CONFIG"/);
  assert.match(panel, /providerId: settings\.providerId/);
  assert.match(panel, /urls: settings\.urls/);
  assert.match(worker, /CHECK_POSTING_TO_COPILOT: sendCheckPostingToCopilot/);
  assert.match(worker, /const checkPostingConfig = await getCheckPostingConfig\(\)/);
  assert.match(worker, /if \(checkPostingConfig\.autoNextTab\)/);
  assert.match(worker, /activateNextTabToRight\(currentTab\)/);
  assert.match(worker, /url: destinationUrl/);
  assert.match(worker, /GET_CHECK_POSTING_CONFIG/);
  assert.match(worker, /rememberCheckPostingJob\(ownerTabId/);
  assert.match(
    worker,
    /await sendFillAndSendToTab\(ownerTabId, jobUrl, runId/
  );
  assert.match(copilot, /FILL_AND_SEND/);
  assert.match(
    copilot,
    /async function fillAndSend[\s\S]*await ensureSearchMode\(\);[\s\S]*fillCopilotInput/
  );
  assert.match(copilot, /composer-chat-mode-\$\{slug\}/);
  assert.match(copilot, /const SEARCH_MODE = "Search"/);
  assert.match(copilot, /"Smart"/);
  assert.match(manifest, /https:\/\/copilot\.microsoft\.com\/\*/);
  assert.match(manifest, /https:\/\/www\.perplexity\.ai\/\*/);
  assert.match(manifest, /content\/copilot\.js/);
  assert.match(manifest, /content\/perplexity\.js/);
  assert.match(manifest, /"check-posting"/);
});

test("Copilot chat URLs match the Check posting destination", () => {
  const ctx = workerHelpers();
  assert.equal(
    ctx.isCopilotChatUrl(
      "https://copilot.microsoft.com/chats/697VK9N9TzfDdzE8zPNrx"
    ),
    true
  );
  assert.equal(
    ctx.isCopilotChatUrl(
      "https://copilot.microsoft.com/chats/697VK9N9TzfDdzE8zPNrx?foo=1"
    ),
    true
  );
  assert.equal(ctx.isCopilotChatUrl("https://copilot.microsoft.com/"), false);
  assert.equal(
    ctx.isCopilotChatUrl("https://chatgpt.com/c/12345678-1234-1234-1234-123456789abc"),
    false
  );
});

test("Check posting settings keep one editable URL per AI chat", () => {
  const ctx = workerHelpers();
  assert.equal(
    ctx.normalizeCheckPostingAiUrl("copilot", ""),
    "https://copilot.microsoft.com/chats/697VK9N9TzfDdzE8zPNrx"
  );
  assert.equal(
    ctx.normalizeCheckPostingAiUrl(
      "copilot",
      "https://copilot.microsoft.com/chats/abc123/"
    ),
    "https://copilot.microsoft.com/chats/abc123"
  );
  assert.equal(
    ctx.normalizeCheckPostingAiUrl("perplexity", "https://www.perplexity.ai/search/jobs"),
    "https://www.perplexity.ai/search/jobs"
  );
  assert.equal(
    ctx.normalizeCheckPostingAiUrl("deepseek", "https://chat.deepseek.com/a/chat/s/abc12345/"),
    "https://chat.deepseek.com/a/chat/s/abc12345"
  );
  assert.throws(
    () => ctx.normalizeCheckPostingAiUrl("copilot", "https://www.perplexity.ai/"),
    /Copilot chat URL/
  );
  assert.throws(
    () => ctx.normalizeCheckPostingAiUrl("perplexity", "https://chatgpt.com/c/abc"),
    /Perplexity URL/
  );
});

test("Save App keeps the job URL while the tab is on Copilot", () => {
  const ctx = workerHelpers();
  const copilotTab = {
    url: "https://copilot.microsoft.com/chats/697VK9N9TzfDdzE8zPNrx",
    title: "Microsoft Copilot"
  };
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        ctx.resolveJobPageFromTab(copilotTab, {
          jobUrl: "https://jobs.example/42",
          jobTitle: "Engineer"
        })
      )
    ),
    { jobUrl: "https://jobs.example/42", jobTitle: "Engineer" }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(ctx.resolveJobPageFromTab(copilotTab))),
    { jobUrl: copilotTab.url, jobTitle: "Microsoft Copilot" }
  );
});
