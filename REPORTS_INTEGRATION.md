# Reports source integration

The Reports menu now renders the original report modules from
https://github.com/Rahul130603/FMS-Gentize, inside the existing FileFlow shell.

All six remote branches were inspected on 2026-09-08:

| Branch | Commit | Report contribution |
| --- | --- | --- |
| Abdul---Reports | 3037d24ed0455c6cdebfbddae56e50f4b418d5d1 | Customer feedback, due date delivery, technical queries |
| Daily-allotement-status | c6fb6a0786bb8f815457b4e92c74c598c7396dc2 | Daily allotment |
| error-report-and-internal-feedback | ec3f50012a0da3064cbe6b3a9009c0f81f68ebe4 | Error reports, internal feedback |
| rework-page | ad21870a8bc41b937f314cc234a43982e40e6148 | Rework analysis |
| delivery-production-count | 5c5547fabd60145cf6cd26937fcad2991f44f486 | Delivery production count |
| main | 5c5547fabd60145cf6cd26937fcad2991f44f486 | Consolidated report pages, My Report, incoming projects, production |

The imported `src/github-reports` tree comes from the consolidated main commit.
Its history contains the integration of the developer pages and subsequent fixes.
The delivery branch has identical contents. Separate applications and backend
servers in older branches are not launched as part of this frontend integration.
No remote branches were modified or pushed.

`src/GitHubReportPages.jsx` maps the existing eleven Reports menu entries to
their source components and supplies their providers and the signed-in user.
`public/sample-evidence` contains the source attachment examples.
Styles are scoped to Reports; `scripts/scope-report-styles.mjs` can be rerun
after refreshing source styles. Duplicate imports in the source export helper
and circular Tailwind button rules were corrected for this project's build.

## Data availability

This imports the frontend pages and preserves their source data behavior.
Publishing reports use the source's empty initial arrays and simulated service.
Error reports and internal feedback use browser storage. Customer feedback,
rework, technical queries and delivery pages depend on their source `/api`
endpoints, which are not implemented by this workspace's Vite API middleware.
Live records and server persistence for those modules require backend integration.

## Verification

- `npm.cmd run build` passes.
- `node scripts/report-smoke.cjs` renders all eleven Reports routes using
  Playwright, with API requests intercepted as unavailable to avoid modifying
  application data. It checks for blank pages and uncaught browser errors.
- For an existing Chromium installation, set `REPORT_BROWSER_PATH` to its
  executable before running the smoke check; otherwise install Playwright Chromium.
- Live API operations were not verified.
