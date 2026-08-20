# Application Helper

Application Helper is a dependency-free Chrome Manifest V3 extension for managing
job-application workflows from the Chrome side panel.

It combines:

- Applicant profiles, profile notes, resume templates, and reusable resume text
- Job-description and reusable AI prompt storage
- Google Docs template copying and resume generation
- Prompt submission to ChatGPT or DeepSeek
- Google Sheets application tracking
- Chrome keyboard shortcuts, in-panel save progress, and Google Docs PDF downloads

## Main workflow

Before saving an application, expand one or more profiles and choose one resume
variant for each. Choosing a variant checks its profile automatically; profiles
can still be unchecked to exclude them, which also clears that profile's resume
choice. A new application starts with every profile and prompt-resume selection
clear. Every checked profile remains expanded so all selected resume variants
stay visible. Then provide a base AI prompt and job description.

`Save App` normalizes the active job URL, copies each checked profile's
configured Google Docs resume template, submits the prepared message to the selected
AI provider, and saves the seven-column application record. An in-panel save progress
indicator starts with the action and ends as soon as the final Google Sheet row
is saved. It repeats that process once per checked profile, using the prompt and
job-description snapshot captured when the run starts. Only one Save App run can
be active at a time.

`Save App` creates one selected-provider workflow per checked profile. ChatGPT
is the default; DeepSeek is also selectable in Save App settings. It reuses the
original job tab for the first profile and creates one additional target tab
for every remaining profile. Before navigating each target to the selected
provider, the extension opens a full-page Application workspace in the side panel. Its
header is labeled `Application workspace {profile name}`, and the copied
profile resume is embedded without a separate tab panel.

Build resume, Download resume, and Exchange appear above the URL panel. Build
resume opens a Resume Context dialog and maps the submitted text onto the
existing copied document. Download resume exports that document as PDF.
Exchange stores the main supported-AI URL before navigating the main tab to
the job URL; the next Exchange restores the stored chat URL.

The Application workspace URL bar edits the embedded resume URL. Press Enter
or use Refresh to validate, save, and reload it, while Copy copies the current
field value. Pickup opens job or supported AI URLs in a new Chrome window
positioned on the right. For Save App, AI Pickup becomes available as soon as
the selected provider's exact conversation URL is captured, even while that
conversation is still open in the main tab. The Notes icon
to the left of Refresh opens the current profile's notes in a modal.

Build resume maps each non-empty input line to the next existing text paragraph
in the current copied Google Doc. It retains that document's paragraph
structure, headings, bullets, tables, and existing text-style pattern. Blank
input lines are ignored, and unused existing text paragraphs are cleared
without deleting their paragraph formatting. The configured master template is
never edited, and no placeholder is required.

No new Chrome tab group is created by `Save App`. It accepts an ungrouped or
already-grouped job tab and leaves any existing group unchanged. While either
application action is running, the matching **Home workspace** and **Application
workspace** headers show `Save progress` inside the same compact status/log
line and a progress bar in the workspace label panel. Cancel Process stays at
the far right of the header. The header Exchange icon that switches between
Home and Application workspaces stays disabled on involved tabs until the
final Google Sheet row is saved. Saving that row ends progress immediately.
Cancel Process stops both progress and the active save early. Successful completion or cancellation ends save progress and clears
checked profiles, selected prompt-resume variants, and the job description.
Each tab keeps its Application workspace details, process logs, and status
until that Chrome tab is closed. Completed sheet rows and opened tabs are
never rolled back. No Chrome notification is created.

While save progress is active, only the Chrome tabs involved in that run
show a progress bar in the workspace header and keep the Home/Application
workspace switch icon disabled. Other tabs stay unlocked for non-save work, but
another Save App request is rejected until the active run finishes or is cancelled.

Outside save progress, the matching workspace headers show an Exchange icon
for switching between the two views. The compact line below each title retains
the app's most recent success or error. The Home workspace header also provides
a left-side Settings icon that opens configuration in a modal.

Before `Save App` runs, and on browser tabs that are not bound to the current
saved application, the Application workspace shows an empty resume state and
disabled resume actions. Returning to any selected-provider tab created by the batch
restores that profile's populated side-panel workspace, including after the
side panel is closed and reopened. Each workspace and its process details are
removed only when its bound tab closes; after the final bound tab closes, the
empty Application workspace remains available.

## Google Sheet columns

Each profile uses its own sheet tab. Missing profile tabs are created
automatically. The extension appends seven columns:

| Column | Value |
| --- | --- |
| A | ISO timestamp |
| B | Job-page title |
| C | Profile name, exactly as stored in the app |
| D | Selected AI provider conversation URL |
| E | Normalized job URL |
| F | Copied resume-document URL |
| G | Reserved (left blank by Save App) |

When a profile tab is created, these column labels are written to row 1 before
the first application is appended. The header row is bold, and cells in columns
A–G use the Google Sheets `CLIP` wrap strategy.
Existing six-column profile tabs are upgraded automatically: column C is
inserted, existing rows receive that tab's profile name, and the previous
columns C-F shift to D-G.

## Other actions

- **Open** in the Home workspace accepts a count from 1 to 25 on Jobright's
  `/jobs/recommend` page. For each eligible recommendation, it Ctrl-clicks
  **Apply with Autofill** or **APPLY NOW**, confirms the new application tab,
  removes the app's standard tracking parameters from its URL, keeps Jobright
  active, and selects **Already Applied** from that job's dislike menu.
- **Make a resume** accepts rows copied from the seven-column Google Sheet
  layout written by Save App: timestamp, job title, profile, AI conversation,
  job page, Google Docs resume, and optional Apply Now (columns A-G). A row with
  only populated columns A-F is also accepted when G is blank. The older
  four-field Profile, Chat, Job, Google Doc format remains supported. URL fields
  can be plain URLs or Markdown links such as `[**URL**](URL)`. It opens every
  job URL in a new main tab and registers each tab in the same full-page
  Application workspace used by Save App. The profile name labels the paired
  Google Docs resume and retrieves that profile's locally saved note.
- Pickup opens an imported ChatGPT or DeepSeek URL in a new
  right-side Chrome window while leaving the job URL in the main tab. Exchange can still swap the
  stored main-tab job/chat URLs. The Notes icon displays the matched profile
  note in a modal. Switching among imported job tabs restores each tab's
  workspace. Make Resume is available only while the current tab is a Google
  Sheets spreadsheet.
- Profile notes are stored locally for reference and are not sent to an AI provider or
  written to the Google Sheet.

## Keyboard shortcuts

- `Ctrl+Q`: Save App (default Chrome command shortcut)
- Make Resume, Open, and Download Resume are available as unassigned Chrome commands.
- Each action settings modal shows its current shortcut and links to Chrome's
  Extensions Shortcuts page for assignment.
- `Ctrl+A`: Pick up the Application Workspace resume URL in a right-side
  window. Text fields keep the normal Select All behavior.

`Ctrl+Q` is handled whenever the side panel is open. `Ctrl+A` is handled while
the side panel has keyboard focus. If the panel is closed, Chrome ignores both
application actions.

Pinned tabs keep the side panel closed automatically, except for Google Sheets
(where Make a resume needs it) and Jobright. The side panel and Save App remain
available while `jobright.ai` is pinned. Switching back to another pinned tab
closes the panel; per-tab process and workspace details for other open tabs are
kept until those tabs close.

## Configuration and storage

The header Settings modal accepts a Google Spreadsheet URL or ID and an AI
provider. ChatGPT is the default; DeepSeek is also available.
Application records are routed to the tab matching each selected profile name, and missing
profile tabs are created automatically. The configured default tab name is
retained for backward compatibility.

Profiles, prompts, job descriptions, notes, selected resume variants, and
sheet configuration are stored in `chrome.storage.local`. Per-tab Application
workspace details, process logs, and status are kept in `chrome.storage.session`
until that Chrome tab closes. The extension has no application server or
third-party JavaScript dependencies.

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
node --check content\ai-provider.js
```
