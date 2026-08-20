function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelayMs(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

const PROVIDERS = Object.freeze({
  "chat.deepseek.com": {
    label: "DeepSeek",
    useBrowserEditingCommand: true,
    beforeSendDelayMs: { min: 3000, max: 3000 },
    sendButtonTimeoutMs: 30000,
    findNearbySendButton: true,
    usePointerClick: true,
    requiredMode: "Expert",
    alternateMode: "Instant",
    modeTimeoutMs: 15000,
    inputTimeoutMs: 15000,
    inputSelectors: [
      'textarea#chat-input',
      '#chat-input[contenteditable="true"]',
      'textarea[data-testid="chat-input"]',
      '[data-testid="chat-input"][contenteditable="true"]',
      '#chat-input textarea',
      '#chat-input [contenteditable="true"]',
      '[data-testid="chat-input"] textarea',
      '[data-testid="chat-input"] [contenteditable="true"]',
      'textarea[placeholder*="DeepSeek" i]',
      'textarea[placeholder*="message" i]',
      'textarea',
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"]'
    ],
    sendSelectors: [
      'button[data-testid="chat-submit"]',
      'button[data-testid="send-button"]',
      '[data-testid="send-button"] button',
      '[data-testid="send-button"] [role="button"]',
      '[data-testid="send-button"]',
      'button[aria-label*="send" i]',
      '[role="button"][aria-label*="send" i]',
      'button[title*="send" i]',
      '[role="button"][title*="send" i]',
      'button[type="submit"]'
    ]
  },
  "claude.ai": {
    label: "Claude",
    inputSelectors: [
      'div.ProseMirror[contenteditable="true"]',
      '[contenteditable="true"][role="textbox"]',
      '[data-testid*="chat-input"] [contenteditable="true"]',
      'textarea[placeholder*="message" i]',
      'textarea'
    ],
    sendSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label*="send" i]',
      'button[type="submit"]'
    ]
  },
  "grok.com": {
    label: "Grok",
    useBrowserEditingCommand: true,
    inputSelectors: [
      '[data-testid="chat-input"] .ProseMirror[contenteditable="true"]',
      '[data-testid="chat-input"] [contenteditable="true"][role="textbox"]',
      '[data-testid="chat-input"] [contenteditable="true"]',
      '[data-testid="chat-input"] textarea',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="message" i]',
      '[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    sendSelectors: [
      'button[data-testid="chat-submit"]',
      '[data-testid="chat-submit"]',
      'button[aria-label*="submit" i]',
      'button[aria-label*="send" i]',
      'button[data-testid*="send" i]',
      'button[type="submit"]'
    ]
  }
});

function getProvider() {
  return PROVIDERS[location.hostname.toLowerCase()] || null;
}

const CLICKABLE_SEND_SELECTOR =
  'button, input[type="submit"], [role="button"]';
const MODE_CONTROL_SELECTOR =
  'button, [role="button"], [role="tab"], [role="radio"], ' +
  '[role="option"], [role="menuitemradio"]';

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

function findFirst(selectors, root = document) {
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const element of elements) {
      if (isVisibleElement(element)) {
        return element;
      }
    }
  }
  return null;
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
    .map((label) =>
      String(label).replace(/\s+/g, " ").trim().toLowerCase()
    );
}

function matchesModeLabel(element, modeLabel) {
  const target = String(modeLabel || "").trim().toLowerCase();
  if (!target) {
    return false;
  }

  return getControlLabels(element).some(
    (label) =>
      label === target ||
      label === `${target} mode` ||
      label.startsWith(`${target} mode `) ||
      label.startsWith(`switch to ${target}`)
  );
}

function resolveLabeledModeControl(labelElement) {
  const semanticControl = labelElement.closest?.(MODE_CONTROL_SELECTOR);
  if (semanticControl) {
    return semanticControl;
  }

  const component = labelElement.parentElement;
  return component?.querySelector?.(".ds-icon") ? component : null;
}

function findModeControls(modeLabel) {
  const semanticControls = Array.from(
    document.querySelectorAll(MODE_CONTROL_SELECTOR)
  ).filter(
    (element) =>
      isVisibleElement(element) && matchesModeLabel(element, modeLabel)
  );
  const labeledComponents = Array.from(document.querySelectorAll("span"))
    .filter(
      (element) =>
        isVisibleElement(element) && matchesModeLabel(element, modeLabel)
    )
    .map(resolveLabeledModeControl)
    .filter((element) => element && isVisibleElement(element));

  return Array.from(new Set([...semanticControls, ...labeledComponents]));
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
    ["option", "menuitemradio", "radio", "tab"].includes(role) ||
      element.closest?.('[role="menu"], [role="listbox"]')
  );
}

async function waitForRequiredMode(provider, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const requiredControls = findModeControls(provider.requiredMode);
    const alternateControls = findModeControls(provider.alternateMode);
    if (
      requiredControls.some(
        (element) => getExplicitControlSelection(element) === true
      )
    ) {
      return true;
    }
    if (
      requiredControls.length > 0 &&
      alternateControls.length === 0 &&
      requiredControls.every(
        (element) => getExplicitControlSelection(element) !== false
      )
    ) {
      return true;
    }
    await sleep(200);
  }

  return false;
}

async function ensureRequiredMode(provider) {
  if (!provider.requiredMode) {
    return;
  }

  const startedAt = Date.now();
  const timeoutMs = provider.modeTimeoutMs || 10000;
  let openedModeSelector = false;

  while (Date.now() - startedAt < timeoutMs) {
    const requiredControls = findModeControls(provider.requiredMode);
    const alternateControls = findModeControls(provider.alternateMode);

    if (
      requiredControls.some(
        (element) => getExplicitControlSelection(element) === true
      )
    ) {
      return;
    }

    const requiredOption = requiredControls.find(isModeOption);
    const explicitlyInactive = requiredControls.find(
      (element) => getExplicitControlSelection(element) === false
    );
    const selectableRequired =
      requiredOption ||
      explicitlyInactive ||
      (requiredControls.length > 0 && alternateControls.length > 0
        ? requiredControls[0]
        : null);

    if (selectableRequired) {
      const selectionState = getExplicitControlSelection(selectableRequired);
      const needsConfirmation =
        selectionState === false || isModeOption(selectableRequired);
      clickInteractiveElement(selectableRequired);
      if (needsConfirmation) {
        const confirmed = await waitForRequiredMode(provider);
        if (!confirmed && selectionState === false) {
          throw new Error(
            `${provider.label} ${provider.requiredMode} mode did not become active.`
          );
        }
      } else {
        await sleep(200);
      }
      return;
    }

    if (requiredControls.length > 0 && alternateControls.length === 0) {
      return;
    }

    if (!openedModeSelector && alternateControls.length > 0) {
      const selectedAlternate =
        alternateControls.find(
          (element) => getExplicitControlSelection(element) === true
        ) || alternateControls[0];
      clickInteractiveElement(selectedAlternate);
      openedModeSelector = true;
      await sleep(200);
      continue;
    }

    await sleep(200);
  }

  throw new Error(
    `${provider.label} ${provider.requiredMode} mode control was not found.`
  );
}

function findPromptInput(provider) {
  return findFirst(provider.inputSelectors);
}

function resolveClickableSendButton(element) {
  if (!element) {
    return null;
  }
  if (element.matches?.(CLICKABLE_SEND_SELECTOR)) {
    return element;
  }

  const descendant = element.querySelector?.(CLICKABLE_SEND_SELECTOR);
  if (isVisibleElement(descendant)) {
    return descendant;
  }

  const ancestor = element.closest?.(CLICKABLE_SEND_SELECTOR);
  return isVisibleElement(ancestor) ? ancestor : element;
}

function findSendButtonInRoot(provider, root) {
  let fallback = null;
  const seen = new Set();

  for (const selector of provider.sendSelectors) {
    for (const matchedElement of root.querySelectorAll(selector)) {
      const button = resolveClickableSendButton(matchedElement);
      if (!button || seen.has(button) || !isVisibleElement(button)) {
        continue;
      }
      seen.add(button);
      if (isSendButtonReady(button)) {
        return button;
      }
      fallback ||= button;
    }
  }

  return fallback;
}

function findNearbySendButton(input) {
  let container = input.parentElement;

  for (let depth = 0; container && depth < 8; depth += 1) {
    const candidates = Array.from(
      container.querySelectorAll(CLICKABLE_SEND_SELECTOR)
    ).filter((element) => element !== input && isVisibleElement(element));

    if (candidates.length > 0) {
      const namedSendButton = candidates.find((element) => {
        const accessibleName = [
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          element.getAttribute("data-testid"),
          element.textContent
        ]
          .filter(Boolean)
          .join(" ");
        return /\bsend\b/i.test(accessibleName);
      });
      if (namedSendButton) {
        return namedSendButton;
      }

      return candidates.reduce((rightmost, candidate) => {
        const rightmostRect = rightmost.getBoundingClientRect();
        const candidateRect = candidate.getBoundingClientRect();
        return candidateRect.right >= rightmostRect.right
          ? candidate
          : rightmost;
      });
    }

    container = container.parentElement;
  }

  return null;
}

function findSendButton(provider, input) {
  const form = input.closest("form");
  const formButton = form ? findSendButtonInRoot(provider, form) : null;
  const pageButton = formButton || findSendButtonInRoot(provider, document);
  return (
    pageButton ||
    (provider.findNearbySendButton ? findNearbySendButton(input) : null)
  );
}

function setTextControlValue(element, text) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, text);
  } else {
    element.value = text;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setEditableValue(element, text) {
  element.innerHTML = "";
  String(text)
    .split("\n")
    .forEach((line) => {
      const paragraph = document.createElement("p");
      if (line) {
        paragraph.textContent = line;
      } else {
        paragraph.appendChild(document.createElement("br"));
      }
      element.appendChild(paragraph);
    });
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text
    })
  );
}

function setEditableValueUsingBrowserCommand(element, text) {
  element.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);

  const inserted = document.execCommand("insertText", false, String(text));
  selection.removeAllRanges();

  if (!inserted) {
    setEditableValue(element, text);
  }
}

function fillPromptInput(element, text, provider) {
  element.focus();
  if (element.isContentEditable) {
    if (provider.useBrowserEditingCommand) {
      setEditableValueUsingBrowserCommand(element, text);
      return;
    }
    setEditableValue(element, text);
    return;
  }
  setTextControlValue(element, text);
}

function isSendButtonReady(button) {
  return Boolean(
    button &&
      !button.disabled &&
      button.getAttribute("aria-disabled") !== "true" &&
      !button.closest?.('[aria-disabled="true"]')
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

async function waitForReadySendButton(provider, input, timeoutMs = 10000) {
  const startedAt = Date.now();
  let sendButton = null;

  while (Date.now() - startedAt < timeoutMs) {
    sendButton = findSendButton(provider, input);
    if (isSendButtonReady(sendButton)) {
      return sendButton;
    }
    await sleep(200);
  }

  return sendButton;
}

async function waitForPromptInput(provider, timeoutMs = 10000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const input = findPromptInput(provider);
    if (input) {
      return input;
    }
    await sleep(200);
  }

  return null;
}
async function fillAndSend(text) {
  const provider = getProvider();
  if (!provider) {
    throw new Error("This AI provider is not supported on the current page.");
  }

  const input = await waitForPromptInput(provider, provider.inputTimeoutMs);
  if (!input) {
    throw new Error(`${provider.label} prompt input was not found.`);
  }

  fillPromptInput(input, text, provider);
  const beforeSendDelay = provider.beforeSendDelayMs || {
    min: 4000,
    max: 5000
  };
  const beforeSendDelayMs = randomDelayMs(
    beforeSendDelay.min,
    beforeSendDelay.max
  );
  if (beforeSendDelayMs > 0) {
    await sleep(beforeSendDelayMs);
  }

  const sendButton = await waitForReadySendButton(
    provider,
    input,
    provider.sendButtonTimeoutMs
  );
  if (!sendButton) {
    throw new Error(`${provider.label} send button was not found.`);
  }
  if (!isSendButtonReady(sendButton)) {
    throw new Error(`${provider.label} send button is not ready yet.`);
  }

  if (provider.usePointerClick) {
    clickInteractiveElement(sendButton);
  } else {
    sendButton.click();
  }
}

if (!globalThis.__applicationHelperAiProviderListenerRegistered) {
  globalThis.__applicationHelperAiProviderListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const provider = getProvider();
    if (message.type === "PING_AI_PROVIDER") {
      sendResponse(
        provider
          ? { ok: true }
          : { ok: false, error: "AI provider page is not ready." }
      );
      return false;
    }

    let operation;
    if (message.type === "ENSURE_REQUIRED_MODE") {
      operation = provider
        ? ensureRequiredMode(provider)
        : Promise.reject(new Error("AI provider page is not ready."));
    } else if (message.type === "FILL_AND_SEND") {
      operation = fillAndSend(message.text);
    } else {
      return;
    }

    operation
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not automate the AI provider."
        });
      });

    return true;
  });
}
