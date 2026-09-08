# FileFlow — Reconstruction Prompt

Build a Python + vanilla HTML/JS internal web app called **FileFlow**, used by a book-publishing/printing production team to manage per-ISBN file handoffs between four roles: **Book Developer, Cover Developer, QC, QAG**. No frontend framework, no third-party Python packages — everything is stdlib only.

## 1. Backend (`server.py`, pure stdlib `http.server`)

- `ThreadingHTTPServer` / `BaseHTTPRequestHandler`, serves the single HTML file at `/` and `/index.html`.
- Auth: every API request must carry header `X-FileFlow-Token: <shared-secret>` OR be same-origin.
- Two real filesystem roots: `INPUT_ROOT` (local, e.g. `C:\QC_Testing`) and `OUTPUT_ROOT` (network share, e.g. `\\SERVER\output\QC_Testing`).
- Persistence is flat JSON files, no database except a small SQLite side-store for temp file staging:
  - `fileflow_state.json` — array of work rows (see data model below), merged per-owner via a `(employeeId, isbn, role)` key so concurrent employees never clobber each other's rows.
  - `notifications.json` — array of notification events, capped to the most recent 500.
  - `recents_deleted.json` — array of "delete all" archive batches, capped to 100, each holding the full rows that were wiped so they can be inspected later.
  - `fileflow_temp_files.sqlite3` + a `temp_file_store/` directory — a small module (`temp_file_store.py`) that stores files with `(id, original_name, stored_name, path, size_bytes, content_type, owner_id, purpose, created_at, expires_at)`, a default 24h TTL, a default 7GB-per-owner quota, and a `cleanup_expired()` sweep that runs on every status/list call.

### REST endpoints

GET: `/health`, `/temp-status?ownerId=`, `/temp-files?ownerId=&role=`, `/recents?ownerId=`, `/temp-download?id=&ownerId=&role=`, `/state`, `/notifications`, `/prepare-dummy?isbn=`, `/input-files?isbn=`, `/open-input-folder?isbn=`, `/download-file?isbn=&name=`, `/network-file?path=`.

POST: `/upload-completed?isbn=&filename=` (raw chunked upload → INPUT_ROOT, mirrored to OUTPUT_ROOT), `/state` (merge rows), `/prepare-network`, `/prepare-temp`, `/prepare-dummy-all`, `/export-report`, `/notifications`, `/notifications/read`, `/network-find`, `/network-list`, `/network-copy`, `/temp-delete-all`, `/copy-required`, `/copy-selected`.

### File classification (no image logic — PDFs only)

Exactly 3 required deliverables per ISBN: `<isbn>_cvr_eu.pdf`, `<isbn>_cvr_int.pdf`, `<isbn>_txt.pdf`. A filename containing `_cvr`/`cvr` is role `cover`; containing `_txt`/`txt` is role `book`. Book Developers only see/submit `_txt` files, Cover Developers only `_cvr_*` files; QC and QAG can see/handle all three.

### XLSX export, built with zero libraries

`make_report_xlsx(rows)` hand-writes the raw OOXML parts (`[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/worksheets/sheet1.xml`, `xl/styles.xml`) as strings and zips them via `zipfile.ZipFile(..., ZIP_DEFLATED)` into an in-memory buffer — do not use openpyxl or any package. 19 columns: `S.No, ISBN Folder, Employee ID, Employee Name, Work Type, Project ID, Project Name, Priority, Due Date, Allocated At, Started At, Ended At, Working Time, File Break Time, File Break Details, Status, Status Detail Type, Reason / Remarks, Status Detail Updated At`. Bold shaded header row, frozen top row + autofilter, sheet named "Production Report". Streamed back as `<employeeId>_Production_Report.xlsx` with `Content-Disposition: attachment`.

## 2. The "Network Copy" pipeline (find → link → download-on-demand)

This is the core design constraint: **never write into `INPUT_ROOT` until the employee explicitly downloads.**

1. **Find**: `POST /network-find {source, isbns}` — validate `source` is a reachable directory, parse the pasted ISBN list (split on commas/semicolons/tabs/newlines/spaces), do one `os.walk` matching directory names or file stems against the wanted ISBNs (stop early once all are found). Return `{found:[{isbn, kind:'folder'|'file', path}], missing:[...]}`.
2. **Link (stage into temp store, not INPUT)**: `POST /network-copy {matches, ownerId}` — sum total size, run a quota check, copy every matched file into the SQLite-tracked temp store tagging each row `purpose='network-copy:'+isbn`. This does NOT touch `INPUT_ROOT`. The UI syncs these into the employee's work list as new `Allocated` rows with `tempStored:true`.
3. **Download-on-demand (materialize)**: only when the employee clicks "Download" does `POST /prepare-temp {isbn, ownerId, role}` run — look up temp-store rows for `purpose=='network-copy:'+isbn` and this owner, chunk-copy each (4MB chunks, atomic `os.replace` from a `.part` temp file) into `INPUT_ROOT\<isbn>\`, renaming any file lacking the ISBN prefix. Only now does the row flip to `downloaded:true, status:'WIP'`, and only now does the work timer start.
   - Separately, "Download All Files" streams temp files straight to the browser's Downloads folder via `GET /temp-download?id=` — this is a real client download, distinct from the server-side materialize-into-INPUT_ROOT step above.

## 3. Frontend (single HTML file, vanilla JS, no build step)

Login screen with 4 quick-login buttons (Book/Cover/QC/QAG demo users) plus manual ID+password (all demo passwords `1234`).

Side nav with 6 pages, state var `page`, central `render()` dispatcher, `goToPage(p)` navigator:

1. **Dashboard** — role-aware: Book/Cover roles see stat tiles + a live Work Timer widget (Pause/Break-type menu, Resume/Stop, per-day totals) + a donut "Work Breakdown" chart + Recent Activity feed + a **"Proceed" button**; QC/QAG roles see a simplified ready/in-progress/hold/complete count dashboard + the same timer.
2. **Network Copy** — source-path input + ISBN-list textarea, buttons: "Start ISBN Copy", "Find Only", "Store Found Temporarily", "Clear"; results table of Found/Not Found ISBNs with clickable rows opening a listing modal.
3. **My Files** — QC/QAG see a ready-ISBN list; Book/Cover see a per-ISBN workflow table (Book Developer / Cover Developer / QC Name columns) with Download All / Delete All / Refresh.
4. **Production Tracker** — table of only *tracked* rows (anything downloaded/started/held), live per-row timer, an Allocated-Date filter, and a "Recents" button opening the delete-archive modal.
5. **Reports** — the full 18/19-column table matching the XLSX export, an "Export Excel" button, per-row "View"/"Excel" (client-only single-row `.xls` export), and a combined "All Files Break" total row.
6. **Notifications** — cards with unread badges (on both the sidebar item and a top-bar bell), "Mark Read" per item, "Refresh"; polls every 10s.

Key behavior: **the Dashboard's "Proceed" button must navigate to the Network Copy page, not My Files** — `proceedToNetwork(){ prefillNetworkIsbns=true; goToPage('network') }`, and when the ISBN textarea is empty this flag prefills it with the standing target-ISBN list. Any other nav click clears the flag.

## 4. Work-status / WIP timer state machine

Per-row fields: `status` ∈ `Allocated|WIP|Hold|Rework|Complete|Reject`, `sessions:[{start,end}]` (work timer intervals), `holdSessions:[{start,end,type,isBreak,comment}]`, `downloaded`, `individualDownloaded`, `started`, `ended`, `workflowVersion`.

Hard rules to enforce:
- Loading/refreshing the page never starts a timer session by itself.
- Manually setting status to `WIP` is blocked with an alert unless `downloaded===true` — WIP only starts as a side effect of a successful download (`downloadISBN()` for one ISBN, or `downloadAllAllocated()` which does this for every currently-`Allocated` row for that employee, only flipping the ones whose backend copy call actually succeeded).
- Marking `Complete` is blocked unless the row has an `uploaded`/`savedPath` value.
- Hold/Break time is tracked separately from work time via `holdSessions`, with a `isBreak` flag distinguishing "on hold" from "on break"; both are excluded from working-time totals but shown separately as file-break time.
- On load, migrate any legacy row (`workflowVersion < 4`) that is `WIP` or "downloaded but not ended" back to `Allocated` and clear its session/download fields — a one-time correction for state written by older app versions — then persist immediately.
- All displayed elapsed times are derived client-side every second from stored start/end timestamps; there is no server-side ticking clock.

## 5. Notification system

Fixed status vocabulary: `Rework, Reject, Two Hours Tracking, QC Ready, QAG Ready, QAG Remark`. Each notification: `isbn, employeeId/Name, projectId/Name, priority, dueDate, status, reason, senderId/Name, recipientId, recipientRole, createdAt, read`. `Two Hours Tracking` additionally carries `type, reportDate, reportWindow, reportRows, reportSummary`.

Triggers:
- `Rework` → sent to the relevant developer role(s) (Book/Cover, selectable) when QC rejects work back, or to "admin" when a developer self-marks Rework.
- `Reject` → sent whenever any employee saves a Reject status.
- `QC Ready` → sent to the QC team when a Book Developer completes both POD+Cover and enables QC for that ISBN.
- `QAG Ready` → sent to the (single, named) QAG employee when QC marks a row Complete; this also auto-creates a QAG work row for that ISBN if one doesn't exist.
- `QAG Remark` → broadcast to every user with role `admin` or `manager` when the QAG employee submits Rework.

Visibility filter: a notification is visible if `recipientId` matches exactly, OR `recipientRole` matches the viewer's role, with `admin` and `manager` able to see each other's notifications reciprocally.

## 6. Roles

Four roles: `book`, `cover`, `qc`, `qag`, plus non-production `admin`/`manager` accounts that only receive notifications (QAG-remark broadcasts, etc.) and don't hold work rows themselves. QAG reuses the QC-style dashboard/file-list views but filters to rows where `developerRole==='qag'`, and QAG (like QC) has access to all file types regardless of the cover/book filename split.

## 7. Non-goals (explicitly excluded)

No image cropping/scanning/thumbnail pipeline of any kind, no external Python packages, no frontend build tooling/framework, no server-side clock/websocket push (poll-based only).
