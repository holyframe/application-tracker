# Partial Width Side Panel Chrome Extension

A minimal Chrome Extension MV3 project that opens a partial-width UI using the Chrome Side Panel API.

## Project structure

```txt
chrome-partial-width-extension/
├─ manifest.json
├─ service-worker.js
├─ sidepanel/
│  ├─ sidepanel.html
│  ├─ sidepanel.css
│  └─ sidepanel.js
├─ assets/
│  ├─ icon16.png
│  ├─ icon32.png
│  ├─ icon48.png
│  └─ icon128.png
└─ README.md
```

## How to load in Chrome

1. Unzip the project.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the unzipped `chrome-partial-width-extension` folder.
6. Click the extension icon to open the side panel.

## Notes

Chrome controls the side panel container width. Your extension can style the content inside the panel,
but the Side Panel API does not provide an exact `setWidth()` method for forcing the panel to a fixed
percentage of the browser window.
