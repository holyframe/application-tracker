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

function createSaveTitleContext(initialTitle) {
  let observerCallback = null;
  const scriptCalls = [];
  const document = {
    title: initialTitle,
    head: {},
    documentElement: {}
  };
  const context = vm.createContext({
    console,
    document,
    window: {},
    MutationObserver: class {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    },
    chrome: {
      scripting: {
        executeScript: async (details) => {
          scriptCalls.push(details);
          return [{ result: details.func(...details.args) }];
        }
      }
    }
  });
  load(
    worker,
    [
      "stripSaveTabTitlePrefix",
      "setSaveTabTitleStatusInPage",
      "applySaveTabTitleStatus"
    ],
    context
  );
  return {
    context,
    document,
    scriptCalls,
    triggerTitleMutation: () => observerCallback?.()
  };
}

test("Save App keeps the job title and changes its running and final prefixes", async () => {
  const fixture = createSaveTitleContext("Software Engineer - Example");

  assert.equal(
    await fixture.context.applySaveTabTitleStatus(
      12,
      "saving",
      "Software Engineer - Example"
    ),
    true
  );
  assert.equal(fixture.document.title, "⏳ Software Engineer - Example");
  assert.equal(fixture.scriptCalls[0].target.tabId, 12);

  fixture.document.title = "Site tried to replace the title";
  fixture.triggerTitleMutation();
  assert.equal(fixture.document.title, "⏳ Software Engineer - Example");

  assert.equal(
    await fixture.context.applySaveTabTitleStatus(
      12,
      "success",
      "Software Engineer - Example"
    ),
    true
  );
  assert.equal(
    fixture.document.title,
    "✅ Software Engineer - Example — successfully saved"
  );

  assert.equal(
    await fixture.context.applySaveTabTitleStatus(
      12,
      "failed",
      "Software Engineer - Example"
    ),
    true
  );
  assert.equal(
    fixture.document.title,
    "❌ Software Engineer - Example — failed"
  );

  assert.equal(
    fixture.context.stripSaveTabTitlePrefix(
      "✅ Software Engineer - Example — successfully saved"
    ),
    "Software Engineer - Example"
  );
});

function createNextTabContext(tabs) {
  const queries = [];
  const updates = [];
  const context = vm.createContext({
    console,
    chrome: {
      tabs: {
        query: async (options) => {
          queries.push({ ...options });
          return tabs;
        },
        update: async (tabId, changes) => {
          updates.push({ tabId, changes: { ...changes } });
          return {
            ...tabs.find((tab) => tab.id === tabId),
            ...changes
          };
        }
      }
    }
  });
  load(worker, ["activateNextTabToRight"], context);
  return { context, queries, updates };
}

test("Save App moves focus to the immediate tab on the right", async () => {
  const tabs = [
    { id: 14, windowId: 5, index: 4 },
    { id: 11, windowId: 5, index: 1, active: true },
    { id: 13, windowId: 5, index: 3 },
    { id: 12, windowId: 5, index: 2 }
  ];
  const fixture = createNextTabContext(tabs);

  const result = await fixture.context.activateNextTabToRight(tabs[1]);

  assert.equal(result.id, 12);
  assert.deepEqual(fixture.queries, [{ windowId: 5 }]);
  assert.deepEqual(fixture.updates, [
    { tabId: 12, changes: { active: true } }
  ]);
});

test("Save App leaves focus in place when the source is the last tab", async () => {
  const tabs = [
    { id: 21, windowId: 8, index: 0 },
    { id: 22, windowId: 8, index: 1, active: true }
  ];
  const fixture = createNextTabContext(tabs);

  const result = await fixture.context.activateNextTabToRight(tabs[1]);

  assert.equal(result, null);
  assert.deepEqual(fixture.queries, [{ windowId: 8 }]);
  assert.deepEqual(fixture.updates, []);
});
