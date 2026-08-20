function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelayMs(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

const PROVIDERS = Object.freeze({
  "chat.deepseek.com": {
    label: "DeepSeek",
    inputSelectors: [
      'textarea[placeholder*="DeepSeek" i]',
      'textarea[placeholder*="message" i]',
      'textarea',
      '[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ],
    sendSelectors: [
      'button[aria-label*="send" i]',
      '[role="button"][aria-label*="send" i]',
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

function findFirst(selectors, root = document) {
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const element of elements) {
      const style = window.getComputedStyle(element);
      if (
        element.isConnected &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getClientRects().length > 0
      ) {
        return element;
      }
    }
  }
  return null;
}

function findPromptInput(provider) {
  return findFirst(provider.inputSelectors);
}

function findSendButton(provider, input) {
  const form = input.closest("form");
  const formButton = form ? findFirst(provider.sendSelectors, form) : null;
  return formButton || findFirst(provider.sendSelectors);
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
      button.getAttribute("aria-disabled") !== "true"
  );
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

async function fillAndSend(text) {
  const provider = getProvider();
  if (!provider) {
    throw new Error("This AI provider is not supported on the current page.");
  }

  const input = findPromptInput(provider);
  if (!input) {
    throw new Error(`${provider.label} prompt input was not found.`);
  }

  fillPromptInput(input, text, provider);
  await sleep(randomDelayMs(4000, 5000));

  const sendButton = await waitForReadySendButton(provider, input);
  if (!sendButton) {
    throw new Error(`${provider.label} send button was not found.`);
  }
  if (!isSendButtonReady(sendButton)) {
    throw new Error(`${provider.label} send button is not ready yet.`);
  }

  sendButton.click();
}

if (!globalThis.__applicationHelperAiProviderListenerRegistered) {
  globalThis.__applicationHelperAiProviderListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== "FILL_AND_SEND") {
      return;
    }

    fillAndSend(message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not fill the AI prompt."
        });
      });

    return true;
  });
}
