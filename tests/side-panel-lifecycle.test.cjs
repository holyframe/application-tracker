const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const worker = fs.readFileSync(
  path.join(path.resolve(__dirname, ".."), "service-worker.js"),
  "utf8"
);

function load(source, names, context) {
  for (const name of names) {
    const match = source.match(
      new RegExp("^(?:async )?function " + name + "\\b[\\s\\S]*?^}\\r?$", "m")
    );
    assert.ok(match, name);
    vm.runInContext(match[0], context);
  }
}

function createContext() {
  const calls = [];
  const context = vm.createContext({
    console,
    Set,
    sidePanelDisabledTabIds: new Set(),
    chrome: {
      sidePanel: {
        setOptions: async (options) => calls.push({ ...options })
      }
    }
  });
  load(
    worker,
    [
      "isChromeExtensionsPageUrl",
      "shouldEnableSidePanelForTab",
      "syncSidePanelForTab"
    ],
    context
  );
  return { context, calls };
}

test("only Chrome's extensions pages disable the side panel", () => {
  const { context } = createContext();

  for (const url of [
    "chrome://extensions",
    "chrome://extensions/",
    "chrome://extensions/shortcuts",
    "chrome://extensions/?id=application-helper"
  ]) {
    assert.equal(context.shouldEnableSidePanelForTab({ id: 7, url }), false);
  }

  for (const url of [
    "https://example.com/jobs/42",
    "chrome://settings/",
    "chrome://newtab/",
    "about:blank"
  ]) {
    assert.equal(context.shouldEnableSidePanelForTab({ id: 7, url }), true);
  }
});

test("navigation closes on extensions and re-enables on the next normal page", async () => {
  const { context, calls } = createContext();
  const tab = { id: 7, url: "https://example.com/jobs/42" };

  await context.syncSidePanelForTab(tab);
  assert.deepEqual(calls, []);

  tab.url = "chrome://extensions/";
  await context.syncSidePanelForTab(tab);
  assert.deepEqual(calls, [
    {
      tabId: 7,
      path: "sidepanel/sidepanel.html",
      enabled: false
    }
  ]);

  await context.syncSidePanelForTab(tab);
  assert.equal(calls.length, 1);

  tab.url = "https://example.com/another-job";
  await context.syncSidePanelForTab(tab);
  assert.deepEqual(calls[1], {
    tabId: 7,
    path: "sidepanel/sidepanel.html",
    enabled: true
  });
});
