# Application Helper

Application Helper is a dependency-free Chrome Manifest V3 extension for managing
job-application workflows from the Chrome side panel.

It combines:

- Applicant profiles, profile notes, resume templates, and reusable resume text
- Job-description and ChatGPT prompt storage
- Google Docs template copying and resume generation
- ChatGPT prompt submission
- Google Sheets application tracking
- Chrome tab grouping, keyboard shortcuts, reminders, and Google Docs PDF downloads

## Main workflow

Before saving an application, select a profile and resume variant and provide a
base GPT prompt and job description.

`Save App` and `Apply Now` then:

1. Read and normalize the active job-page URL.
2. Copy the selected profile's Google Docs resume template.
3. Open ChatGPT and submit the base prompt, job description, and selected resume text.
4. Wait for the permanent ChatGPT conversation URL.
5. Append an application record to a sheet tab named after the selected profile.
6. Organize the related browser tabs and schedule a two-minute check reminder.

`Save App` accepts ungrouped or grouped job tabs. If the job tab is already
grouped, the generated ChatGPT tab is added to that existing group.

`Apply Now` requires an ungrouped job tab and immediately groups the job page,
resume document, and ChatGPT conversation.

## Google Sheet columns

Each profile uses its own sheet tab. Missing profile tabs are created
automatically. The extension appends six columns:

| Column | Value |
| --- | --- |
| A | ISO timestamp |
| B | Job-page title |
| C | ChatGPT conversation URL |
| D | Normalized job URL |
| E | Copied resume-document URL |
| F | `Yes` for Apply Now; otherwise blank |

When a profile tab is created, these column labels are written to row 1 before
the first application is appended. The header row is bold, and cells in columns
A–F use the Google Sheets `CLIP` wrap strategy.

## Other actions

- **Humanize** sends the configured Humanize prompt to the active or most
  recently used ChatGPT conversation.
- **Make a resume** accepts multiple dragged or pasted URLs in one textarea. It
  pairs ChatGPT/Claude URLs with Google Docs URLs in their respective order,
  opens every chat URL in a new tab, and shows the active chat tab's paired
  Google Doc in the side panel. Its Back button closes all tabs created by the
  batch and returns to the previous tab, while Download Resume exports the
  currently displayed Google Doc as PDF. This action is available only while
  the current tab is a Google Sheets spreadsheet.
- Profile notes are stored locally for reference and are not sent to ChatGPT or
  written to the Google Sheet.

## Keyboard shortcuts

- `Ctrl+Q`: Apply Now
- `Ctrl+Shift+E`: Save App

The shortcuts are handled only while the side panel is open. If the panel is
closed, Chrome ignores these application actions.

## Configuration and storage

The side-panel settings accept a Google Spreadsheet URL or ID. Application
records are routed to the tab matching the selected profile name, and missing
profile tabs are created automatically. The configured default tab name is
retained for backward compatibility.

Profiles, prompts, job descriptions, notes, selected resume variants, and
workflow state are stored in `chrome.storage.local`. The extension has no
application server or third-party JavaScript dependencies.

Google authorization uses `chrome.identity` and the OAuth configuration in
`manifest.json`. The signed-in account must be able to access the configured
spreadsheet and resume-template documents.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this repository directory.
5. Click the extension icon to open the side panel.

## Development checks

There is no build step. The JavaScript files can be syntax-checked with:

```powershell
node --check service-worker.js
node --check sidepanel\sidepanel.js
node --check content\chatgpt.js
```
