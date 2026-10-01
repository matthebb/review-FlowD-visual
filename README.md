# APR Portfolio Lens

An interactive dashboard for the Workstream D portfolio analysis (Academic Program Review, 2025-27). It shows the distribution of 260 programs at three levels (portfolio, faculty and program) and lets you change the analysis settings, reassign categories and model scenarios.

It is a static site with no build step and no server code. Everything runs in the viewer's browser.

## Contents

```
index.html              Page shell
assets/styles.css       Styles (light and dark themes follow the viewer's OS setting)
assets/app.js           All charts and logic (plain JavaScript, no libraries)
data/programs.js        Program data, generated from the workbook
scripts/build_data.py   Regenerates data/programs.js from the Excel workbook
.github/workflows/      Optional GitHub Pages deployment
.nojekyll               Tells GitHub Pages to serve files as-is
```

## Before you publish: who can see it

`data/programs.js` contains program-level costing, revenue and margin figures. Check where the site will be visible before you push:

| Setup | Who can open the site |
|---|---|
| Public repo + GitHub Pages | Anyone with the URL. The repo itself is public too. |
| Private repo + Pages on GitHub Pro or Team | Anyone with the URL. Only the code is private. |
| Private repo + Pages on GitHub Enterprise Cloud with **private Pages visibility** | Only signed-in members of your organization with read access to the repo. |
| Private repo, no Pages | Colleagues with repo access clone it and open it locally (see below). |

If your institution has no Enterprise Cloud account, the safest options are the last row, or hosting the same folder on an internal web server or SharePoint/Teams site. The page includes a `noindex` tag, but that does not keep it private.

## Publish with GitHub Pages

1. Create a repository and push this folder's contents to the `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Choose one of these:
   - **Simplest:** under *Build and deployment*, set *Source* to **Deploy from a branch**, pick `main` and `/ (root)`, then save.
   - **With the included workflow:** set *Source* to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys on every push to `main`.
4. On Enterprise Cloud, set *Visibility* to **Private** on the same page.
5. GitHub shows the site URL after the first deploy (usually within a minute or two).

## Open it locally

Double-click `index.html`. The data loads as a script, so it works from your file system without a local server.

## Update the data

When the workbook changes:

```bash
pip install pandas openpyxl
python scripts/build_data.py "path/to/Workstream D Analysis.xlsx"
git add data/programs.js
git commit -m "Refresh program data"
git push
```

The script uses the first sheet and checks that every expected column header is present. Column names are listed at the top of the script if the workbook layout changes. `.gitignore` keeps `.xlsx` files out of the repo, so the source workbook isn't committed by accident.

Note: the **Briefing** tab's findings are written text with figures from the October 2026 file (whole portfolio, default settings). All other tabs recalculate from the data. After a data refresh, update the findings text in `assets/app.js` (the `FINDINGS` list). The "In the current view" lines in the story tooltips recalculate automatically.

## Story tooltips

Every chart title (marked **story**), subtitle and legend has a tooltip explaining what that distribution tells you, what to look for, a live reading for the current filters, and which Briefing findings (R1–R7, O1–O3) it supports. Legends explain how to read the encoding. Keyboard users can tab to a chart title to open its story; Esc closes it. The Briefing tab lists, under each finding, the charts that show it and a link to open that tab.

The story text lives in `assets/app.js` in the `STORY` object (one entry per chart) and the findings in `FINDINGS`. Edit them there.

## What viewers can change, and where it is saved

- **Filters and analysis parameters** (margin line, trend basis, growth cut-off, subscale thresholds, bubble size) apply to every tab.
- **Flag weights** (Programs tab), **category reassignments** (Categories tab) and **scenario levers** (Scenarios tab) are saved in that viewer's own browser only. Colleagues don't see each other's changes. To share reassignments, use **Copy changes as CSV** on the Categories tab.

## Method notes

- Quadrants follow the APR Guide (pp. 116–120). "Above line" means margin per credit hour is at or above the costing-table threshold (−$100 for Table 2, −$1,000 for Table 1 thesis-based graduate programs), or at or above $0 if you switch the margin line.
- With default settings, quadrant assignments reproduce the workbook's "Quadrant · margin × enrolment" column exactly.
- The signal-implied category is a mechanical reading of the guide's quadrant logic, meant to prompt review. It is not a recommendation.
- The scenario model holds revenue per student constant and splits cost into fixed and enrolment-variable shares. It shows a steady-state view, not a multi-year forecast.

## Browser support

Current Chrome, Edge, Firefox and Safari. Fonts load from Google Fonts. If that's blocked, the page falls back to system fonts.
