function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SEARCH_MODE = "Search";
const OTHER_MODES = [
  "Smart",
  "Quick response",
  "Quick",
  "Think Deeper",
  "Think",
  "Study and learn",
  "Study"
];
const MODE_CONTROL_SELECTOR =
  'button, [role="button"], [role="tab"], [role="radio"], ' +
  '[role="option"], [role="menuitemradio"], [role="menuitem"]';
const MODE_TIMEOUT_MS = 15000;

function isVisibleElement(element) {
  if (!element?.isConnected) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return Boolean(
    style.display !== "none" &&
      style.visibility !== "hidden" &&
      element.getClientRects().length > 0
  );
}

function walkDeep(root, visit) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!node?.querySelectorAll) {
      continue;
    }
    visit(node);
    node.querySelectorAll("*").forEach((element) => {
      if (element.shadowRoot) {
        queue.push(element.shadowRoot);
      }
    });
  }
}

function queryDeepAll(selectors, root = document) {
  const matches = [];
  const seen = new Set();
  walkDeep(root, (node) => {
    for (const selector of selectors) {
      try {
        for (const element of node.querySelectorAll(selector)) {
          if (seen.has(element) || !isVisibleElement(element)) {
            continue;
          }
          seen.add(element);
          matches.push(element);
        }
      } catch (_error) {
        // Ignore invalid selectors in a given root.
      }
    }
  });
  return matches;
}

function queryDeep(selectors, root = document) {
  return queryDeepAll(selectors, root)[0] || null;
}

function findCopilotInput() {
  return queryDeep([
    "textarea#userInput",
    "#userInput",
    'textarea[data-testid="composer-input"]',
    'textarea[data-testid="copilot-chat-textarea"]',
    "textarea#searchbox",
    'textarea[placeholder*="Message" i]',
    'textarea[placeholder*="Ask" i]',
    'textarea[aria-label*="message" i]',
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"]',
    "textarea"
  ]);
}

function isModeControl(element) {
  const testId = String(element.getAttribute("data-testid") || "").toLowerCase();
  if (testId.includes("composer-chat-mode")) {
    return true;
  }
  if (
    element.getAttribute("type") === "submit" ||
    /\b(send|submit)\b/i.test(testId)
  ) {
    return false;
  }
  return (
    matchesModeLabel(element, SEARCH_MODE) ||
    OTHER_MODES.some((mode) => matchesModeLabel(element, mode))
  );
}

function isNamedSendButton(element) {
  const accessibleName = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("data-testid"),
    element.textContent
  ]
    .filter(Boolean)
    .join(" ");
  return /\b(send|submit)\b/i.test(accessibleName);
}

function getAncestorChain(element) {
  const chain = [];
  let current = element;
  for (let depth = 0; current && depth < 12; depth += 1) {
    const parent = current.parentElement;
    if (parent) {
      current = parent;
      chain.push(current);
      continue;
    }
    const root = current.getRootNode?.();
    if (root instanceof ShadowRoot && root.host) {
      current = root.host;
      chain.push(current);
      continue;
    }
    break;
  }
  return chain;
}

function findNearbySendButton(input) {
  for (const container of getAncestorChain(input)) {
    const candidates = queryDeepAll(
      ['button, [role="button"], input[type="submit"]'],
      container
    ).filter(
      (element) =>
        element !== input && !isModeControl(element) && isVisibleElement(element)
    );
    if (!candidates.length) {
      continue;
    }

    const namedSendButton = candidates.find(isNamedSendButton);
    if (namedSendButton) {
      return namedSendButton;
    }

    return candidates.reduce((rightmost, candidate) => {
      const rightmostRect = rightmost.getBoundingClientRect();
      const candidateRect = candidate.getBoundingClientRect();
      return candidateRect.right >= rightmostRect.right ? candidate : rightmost;
    });
  }

  return null;
}

function findSendButton(input) {
  const named = queryDeep([
    'button[data-testid="copilot-send-button"]',
    'button[data-testid="composer-send-button"]',
    'button[data-testid="composer-submit-button"]',
    'button[aria-label*="Submit" i]',
    'button[aria-label*="Send" i]',
    'button[title*="Send" i]',
    'button[type="submit"]'
  ]);
  if (named && !isModeControl(named)) {
    return named;
  }

  return (
    findNearbySendButton(input) ||
    input?.closest("form")?.querySelector(
      'button[type="submit"], button[aria-label*="send" i]'
    ) ||
    null
  );
}

function isSendButtonReady(button) {
  return Boolean(
    button &&
      !button.disabled &&
      button.getAttribute("aria-disabled") !== "true"
  );
}

async function waitForCopilotInput(timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const input = findCopilotInput();
    if (input) {
      return input;
    }
    await sleep(200);
  }
  return findCopilotInput();
}

async function waitForReadySendButton(input, timeoutMs = 8000) {
  const startedAt = Date.now();
  let sendButton = null;
  while (Date.now() - startedAt < timeoutMs) {
    sendButton = findSendButton(input);
    if (isSendButtonReady(sendButton)) {
      return sendButton;
    }
    await sleep(200);
  }
  return isSendButtonReady(sendButton) ? sendButton : null;
}

function slugMode(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getControlLabels(element) {
  return [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("data-testid"),
    element.getAttribute("data-value"),
    element.textContent
  ]
    .filter(Boolean)
    .map((label) => String(label).replace(/\s+/g, " ").trim().toLowerCase());
}

function matchesModeTestId(element, modeLabel) {
  const testId = String(element.getAttribute("data-testid") || "").toLowerCase();
  if (!testId.includes("composer-chat-mode")) {
    return false;
  }

  const slug = slugMode(modeLabel);
  const firstWord = slug.split("-")[0];
  return (
    testId.includes(`composer-chat-mode-${slug}`) ||
    (firstWord && testId.includes(`composer-chat-mode-${firstWord}`))
  );
}

function matchesModeLabel(element, modeLabel) {
  const target = String(modeLabel || "").trim().toLowerCase();
  if (!target) {
    return false;
  }
  if (matchesModeTestId(element, modeLabel)) {
    return true;
  }

  return getControlLabels(element).some(
    (label) =>
      label === target ||
      label === `${target} mode` ||
      label.startsWith(`${target} mode `) ||
      label.startsWith(`switch to ${target}`)
  );
}

function findModeControls(modeLabel) {
  const testIdMatches = queryDeepAll([
    `[data-testid="composer-chat-mode-${slugMode(modeLabel)}-button"]`,
    `[data-testid*="composer-chat-mode-${slugMode(modeLabel).split("-")[0]}"]`
  ]);
  const semanticControls = queryDeepAll([MODE_CONTROL_SELECTOR]).filter(
    (element) => matchesModeLabel(element, modeLabel)
  );
  return Array.from(new Set([...testIdMatches, ...semanticControls]));
}

function getExplicitControlSelection(element) {
  if (typeof element.checked === "boolean") {
    return element.checked;
  }

  for (const attribute of [
    "aria-pressed",
    "aria-selected",
    "aria-checked",
    "data-selected",
    "data-active"
  ]) {
    const value = element.getAttribute(attribute);
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }

  const dataState = element.getAttribute("data-state")?.toLowerCase();
  if (["active", "checked", "on", "selected"].includes(dataState)) {
    return true;
  }
  if (["inactive", "off", "unchecked", "unselected"].includes(dataState)) {
    return false;
  }

  const className =
    typeof element.className === "string"
      ? element.className
      : element.className?.baseVal || "";
  if (/(?:^|[-_\s])(active|checked|selected)(?:$|[-_\s])/i.test(className)) {
    return true;
  }

  return element.querySelector?.(
    '[aria-pressed="true"], [aria-selected="true"], ' +
      '[aria-checked="true"], [data-state="active"], [data-state="selected"]'
  )
    ? true
    : null;
}

function isModeOption(element) {
  const role = element.getAttribute("role");
  return Boolean(
    ["option", "menuitemradio", "menuitem", "radio", "tab"].includes(role) ||
      element.closest?.('[role="menu"], [role="listbox"], [role="list"]')
  );
}

function clickInteractiveElement(button) {
  button.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  button.focus?.();

  const rect = button.getBoundingClientRect();
  const eventOptions = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    button: 0,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2
  };

  if (typeof PointerEvent === "function") {
    button.dispatchEvent(
      new PointerEvent("pointerdown", {
        ...eventOptions,
        buttons: 1,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true
      })
    );
  }
  button.dispatchEvent(
    new MouseEvent("mousedown", { ...eventOptions, buttons: 1 })
  );
  if (typeof PointerEvent === "function") {
    button.dispatchEvent(
      new PointerEvent("pointerup", {
        ...eventOptions,
        buttons: 0,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true
      })
    );
  }
  button.dispatchEvent(
    new MouseEvent("mouseup", { ...eventOptions, buttons: 0 })
  );
  button.click();
}

function isSearchModeActive() {
  const searchControls = findModeControls(SEARCH_MODE);
  const otherControls = OTHER_MODES.flatMap((mode) => findModeControls(mode));

  if (
    searchControls.some(
      (element) => getExplicitControlSelection(element) === true
    )
  ) {
    return true;
  }

  return (
    searchControls.length > 0 &&
    otherControls.length === 0 &&
    searchControls.every(
      (element) => getExplicitControlSelection(element) !== false
    )
  );
}

async function waitForSearchMode(timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isSearchModeActive()) {
      return true;
    }
    await sleep(200);
  }
  return isSearchModeActive();
}

async function ensureSearchMode() {
  const startedAt = Date.now();
  let openedModeSelector = false;

  while (Date.now() - startedAt < MODE_TIMEOUT_MS) {
    const searchControls = findModeControls(SEARCH_MODE);
    const otherControls = OTHER_MODES.flatMap((mode) => findModeControls(mode));

    if (isSearchModeActive()) {
      return;
    }

    const searchOption = searchControls.find(isModeOption);
    const explicitlyInactive = searchControls.find(
      (element) => getExplicitControlSelection(element) === false
    );
    const selectableSearch =
      searchOption ||
      explicitlyInactive ||
      (searchControls.length > 0 && otherControls.length > 0
        ? searchControls[0]
        : null);

    if (selectableSearch) {
      const selectionState = getExplicitControlSelection(selectableSearch);
      const needsConfirmation =
        selectionState === false || isModeOption(selectableSearch);
      clickInteractiveElement(selectableSearch);
      if (needsConfirmation) {
        const confirmed = await waitForSearchMode();
        if (!confirmed && selectionState === false) {
          throw new Error("Copilot Search mode did not become active.");
        }
      } else {
        await sleep(200);
      }
      if (isSearchModeActive() || !needsConfirmation) {
        return;
      }
      continue;
    }

    if (!openedModeSelector && otherControls.length > 0) {
      const selectedOther =
        otherControls.find(
          (element) => getExplicitControlSelection(element) === true
        ) || otherControls[0];
      clickInteractiveElement(selectedOther);
      openedModeSelector = true;
      await sleep(200);
      continue;
    }

    await sleep(200);
  }

  throw new Error("Copilot Search mode control was not found.");
}

function setNativeValue(element, value) {
  const proto =
    element.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
}

function getInputValue(element) {
  if (element.isContentEditable) {
    return String(element.textContent || "").trim();
  }
  return String(element.value || "").trim();
}

function fillCopilotInput(element, text) {
  element.focus();

  if (element.isContentEditable) {
    element.textContent = "";
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("insertText", false, text);
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text
      })
    );
    return;
  }

  setNativeValue(element, text);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text
    })
  );
}

function pressEnter(element) {
  const eventInit = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  };
  element.dispatchEvent(new KeyboardEvent("keydown", eventInit));
  element.dispatchEvent(new KeyboardEvent("keypress", eventInit));
  element.dispatchEvent(new KeyboardEvent("keyup", eventInit));
}

async function fillAndSend(text) {
  await ensureSearchMode();
  await sleep(600);

  const input = await waitForCopilotInput();
  if (!input) {
    throw new Error("Copilot input not found. Sign in and open the chat, then try again.");
  }

  input.click?.();
  fillCopilotInput(input, text);
  await sleep(400);

  const prompt = findCopilotInput() || input;
  if (getInputValue(prompt) !== String(text || "").trim()) {
    fillCopilotInput(prompt, text);
    await sleep(200);
  }

  const sendButton = await waitForReadySendButton(prompt);
  if (sendButton) {
    clickInteractiveElement(sendButton);
    return;
  }

  prompt.focus();
  pressEnter(prompt);
}

if (!globalThis.__applicationHelperCopilotListenerRegistered) {
  globalThis.__applicationHelperCopilotListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING_AI_PROVIDER") {
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "ENSURE_REQUIRED_MODE") {
      ensureSearchMode()
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          sendResponse({
            ok: false,
            error: error.message || "Could not select Copilot Search mode."
          });
        });
      return true;
    }

    if (message.type !== "FILL_AND_SEND") {
      return;
    }

    fillAndSend(message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not fill the Copilot prompt."
        });
      });

    return true;
  });
}
