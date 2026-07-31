function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelayMs(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

const CHATGPT_BEFORE_SEND_MS = { min: 4000, max: 5000 };

function findChatGptInput() {
  return (
    document.querySelector("#prompt-textarea") ||
    document.querySelector('div[contenteditable="true"]#prompt-textarea') ||
    document.querySelector('textarea[name="prompt-textarea"]') ||
    document.querySelector('[contenteditable="true"][data-placeholder]') ||
    document.querySelector('div.ProseMirror[contenteditable="true"]')
  );
}

function findSendButton() {
  return (
    document.querySelector('[data-testid="send-button"]:not([disabled])') ||
    document.querySelector('button[aria-label="Send prompt"]:not([disabled])') ||
    document.querySelector('[data-testid="send-button"]') ||
    document.querySelector('button[aria-label="Send prompt"]')
  );
}

function fillChatGptInput(element, text) {
  element.focus();

  if (element.isContentEditable) {
    element.innerHTML = "";
    const lines = String(text).split("\n");

    lines.forEach((line) => {
      const paragraph = document.createElement("p");
      if (line) {
        paragraph.textContent = line;
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
    return;
  }

  element.value = text;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

async function fillAndSend(text) {
  const input = findChatGptInput();
  if (!input) {
    throw new Error("ChatGPT input not found. Open a chat and try again.");
  }

  fillChatGptInput(input, text);

  const beforeSendMs = randomDelayMs(
    CHATGPT_BEFORE_SEND_MS.min,
    CHATGPT_BEFORE_SEND_MS.max
  );
  await sleep(beforeSendMs);

  const sendButton = findSendButton();
  if (!sendButton) {
    throw new Error("ChatGPT send button not found.");
  }

  if (sendButton.disabled) {
    throw new Error("ChatGPT send button is not ready yet.");
  }

  sendButton.click();
}

function getLatestAssistantResponseText() {
  const assistantMessages = Array.from(
    document.querySelectorAll('[data-message-author-role="assistant"]')
  );
  const latestMessage = assistantMessages.at(-1);

  if (!latestMessage) {
    throw new Error(
      "No ChatGPT assistant response found. Wait for ChatGPT to finish responding and try again."
    );
  }

  const content =
    latestMessage.querySelector(".markdown, .prose") || latestMessage;
  const text = String(content.innerText || content.textContent || "").trim();

  if (!text) {
    throw new Error(
      "The latest ChatGPT assistant response is empty. Wait for the response and try again."
    );
  }

  return text;
}

if (!globalThis.__applicationHelperChatGptListenerRegistered) {
  globalThis.__applicationHelperChatGptListenerRegistered = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_LATEST_ASSISTANT_RESPONSE") {
      try {
        sendResponse({
          ok: true,
          text: getLatestAssistantResponseText()
        });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error.message || "Could not read the latest ChatGPT response."
        });
      }
      return;
    }

    if (message.type !== "FILL_AND_SEND") {
      return;
    }

    fillAndSend(message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error.message || "Could not fill ChatGPT prompt."
        });
      });

    return true;
  });
}
