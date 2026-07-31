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

Both actions normalize the active job URL, copy the selected profile's
configured Google Docs resume template, submit the prepared message to ChatGPT,
save the six-column application record, and schedule a two-minute check
reminder.

`Save App` uses the original job tab as the ChatGPT tab. Before navigating it
to ChatGPT, the extension opens an application workspace in the side-panel
modal with two custom tabs:

- **Job page** embeds the original job URL.
- **Profile resume** embeds the copied resume document created from the
  selected profile's configured template. Its Build resume action opens a
  Resume Context dialog and maps the submitted text onto that existing copy,
  Download resume exports it as PDF, and Exchange stores the main
  ChatGPT/Claude URL before navigating the main tab to the job URL. The chat
  URL is never loaded in the sidebar iframe; the next Exchange restores it in
  the main tab.

Build resume maps each non-empty input line to the next existing text paragraph
in the current copied Google Doc. It retains that document's paragraph
structure, headings, bullets, tables, and existing text-style pattern. Blank
input lines are ignored, and unused existing text paragraphs are cleared
without deleting their paragraph formatting. The configured master template is
never edited, and no placeholder is required. The Build resume workspace button
is currently feature-disabled and remains visible for later re-enabling.

No new Chrome tab group is created by `Save App`. It accepts an ungrouped or
already-grouped job tab and leaves any existing group unchanged. The check
reminder focuses the resulting ChatGPT tab instead of opening duplicate tabs.
The workspace modal is bound to that ChatGPT tab. It hides while another tab or
browser window is active, reopens when its ChatGPT tab becomes active again,
and is cleared only when that tab or the modal is closed.

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
