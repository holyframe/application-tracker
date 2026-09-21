function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function queryDeep(selectors, root = document) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!node?.querySelectorAll) {
      continue;
    }
    for (const selector of selectors) {
      try {
        const matches = node.querySelectorAll(selector);
        for (const element of matches) {
          if (isVisibleElement(element)) {
            return element;
          }
        }
      } catch (_error) {
        // Ignore invalid selectors in a given root.
      }
    }
    node.querySelectorAll("*").forEach((element) => {
      if (element.shadowRoot) {
        queue.push(element.shadowRoot);
      }
    });
  }
  return null;
}

function findPerplexityInput() {
  return queryDeep([
    'textarea[placeholder*="Ask" i]',
    'textarea[aria-label*="Ask" i]',
    "textarea",
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"]'
  ]);
}

function findSendButton(input) {
  return (
    queryDeep([
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Send" i]',
      'button[data-testid*="submit" i]',
      'button[type="submit"]'
    ]) ||
    input?.closest("form")?.querySelector('button[type="submit"]') ||
    null
  );
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

function fillInput(element, text) {
  element.focus();
  if (element.isContentEditable) {
    element.textContent = "";
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
}

function pressEnter(element) {
  const eventInit = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  };
  element.dispatchEvent(new KeyboardEvent("keydown", eventInit));
  element.dispatchEvent(new KeyboardEvent("keyup", eventInit));
}

async function fillAndSend(text) {
  const input = findPerplexityInput();
  if (!input) {
    throw new Error("Perplexity input not found. Sign in and open the chat, then try again.");
  }

  fillInput(input, text);
  await sleep(400);

  const sendButton = findSendButton(input);
  if (sendButton && !sendButton.disabled) {
    sendButton.click();
    return;
  }

  pressEnter(input);
}

if (!globalThis.__applicationHelperPerplexityListenerRegistered) {
  globalThis.__applicationHelperPerplexityListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING_AI_PROVIDER") {
      sendResponse({ ok: true });
      return false;
    }

    if (message.type !== "FILL_AND_SEND") {
      return;
    }

    fillAndSend(message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not fill the Perplexity prompt."
        });
      });

    return true;
  });
}
