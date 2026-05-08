// Chrome Extension MV3 background service worker.
// Clicking the extension icon opens the side panel.

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});
