# APR Portfolio Lens

An interactive dashboard for the Workstream D portfolio analysis (Academic Program Review, 2025-27). It shows the distribution of 260 programs at three levels (portfolio, faculty and program) and lets you change the analysis settings, reassign categories and model scenarios.

It is a static site with no build step and no server code. Everything runs in the viewer's browser.

## Contents

```
index.html              Page shell
assets/styles.css       Styles (light and dark themes follow the viewer's OS setting)
assets/app.js           All charts and logic (plain JavaScript, no libraries)
data/programs.js        Program data, generated from the workbook
data/fiuc.js            CAUBO FIUC peer comparison for the Costing model tab
data/guide.js           Reading guide tab, generated from docs/reading-guide.md
docs/reading-guide.md   Reading guide text (edit this, then rebuild)
scripts/build_data.py   Regenerates data/programs.js from the Excel workbook
scripts/build_fiuc.py   Regenerates data/fiuc.js from the CAUBO FIUC master dataset
scripts/build_guide.py  Regenerates data/guide.js from docs/reading-guide.md
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

## Labour market tab

Uses the labour-market columns in the workbook: LMA signal (AD), NS employment outlook (AE) and COPS shortage/surplus (AF). Column AG (Employment prospects) is empty, and AH (margin × LMA quadrant) is recalculated live.

- **Labour-market lens** (Analysis parameters, or the switch at the top of the tab) chooses which source defines the groups. It also sets what "stronger labour market" means in the risk and opportunity scores, the signal-implied category, and the **Labour market** filter in the filter bar.
- The tab shows enrolment shift by group, contribution by group, a supply-response map (enrolment trend against signal, with vulnerability and watch zones), the shortage pipeline with flags, faculty profiles, a signal-consistency matrix and the limits of the evidence (L1–L6).
- The Portfolio tab adds a quadrant mix by labour-market group, and the Quadrants bubble chart can be coloured by labour-market group.

## Costing model tab and method caveats

The **Costing model** tab states the scope and limits of the Workstream B program costing before any results are read:

- what share of Dalhousie's operating and all-funds spending and revenue the model counts
- a dollar view of what is included, netted or excluded, line by line with guide references
- a comparison with every Canadian university's FIUC return (research intensity, included-function share, a like-for-like "proxy tuition coverage", function shares, and a 24-year trend)
- eight **method caveats (M1–M8)**: features of the method that skew Dalhousie's results, with the mechanism, evidence and direction of each

Caveat codes appear as violet chips on the Programs tab (with a filter), on the Faculties scorecard, in each program's peer-comparison panel, and in the chart story tooltips, so a skew is attributed wherever it shows up. Their definitions, including which programs each one flags, are in the `SKEW` list in `assets/app.js`.

Program-level caveat flags (for example "space-intensive faculties" for M6) are reasoned assumptions, not measured. Review them with the costing team before relying on them.

### Update the FIUC comparison

When CAUBO releases a new FIUC master dataset:

```bash
pip install pandas
python scripts/build_fiuc.py "path/to/CAUBO_FIUC-Master_Dataset.xlsb"
git add data/fiuc.js
git commit -m "Refresh FIUC comparison"
```

The script reads `.xlsb` directly with a built-in parser, so no extra package is needed. It uses the latest year in the file. Peer groups (Nova Scotia, Atlantic, U15) are listed near the top of the script. The program-cost and program-revenue totals the tab compares against are set in `MODEL` in `assets/app.js`; update them if the costing workbook changes.

## Reading guide tab

The **Reading guide** tab explains every tab and chart: the APR Guide requirement it serves, what the fields measure, how values are calculated and drawn, and what the patterns mean as APR signals. It has a contents list that follows your place, an **Open …** button on each tab section, and every other tab has a **How to read this tab →** link (next to the program count) that jumps to its section.

To change the text, edit `docs/reading-guide.md` (plain markdown), then rebuild:

```bash
pip install markdown
python scripts/build_guide.py
git add docs/reading-guide.md data/guide.js
git commit -m "Update reading guide"
```

Keep the `## <Name> tab` headings as they are: the script uses them to add the **Open** buttons and the **How to read this tab** links. The line `<!-- diagram: data-flow -->` places the data-flow diagram, which is drawn in `scripts/build_guide.py`.

## Story tooltips

Every chart title (marked **story**), subtitle and legend has a tooltip explaining what that distribution tells you, what to look for, a live reading for the current filters, and which Briefing findings (R1–R7, O1–O3) it supports. Legends explain how to read the encoding. Keyboard users can tab to a chart title to open its story; Esc closes it. The Briefing tab lists, under each finding, the charts that show it and a link to open that tab.

The story text lives in `assets/app.js` in the `STORY` object (one entry per chart) and the findings in `FINDINGS`. Edit them there.

## What viewers can change, and where it is saved

- **Filters and analysis parameters** (margin line, trend basis, growth cut-off, subscale thresholds, bubble size) apply to every tab.
- **Flag weights** (Programs tab), **category reassignments** (Categories tab) and **scenario levers** (Scenarios tab) are saved in that viewer's own browser only. Colleagues don't see each other's changes. To share reassignments, use **Copy changes as CSV** on the Categories tab.

## Method notes

- Margins are labelled **instructional contribution**: they are before the operating grant and the costs program costing excludes. See the Costing model tab.
- Quadrants follow the APR Guide (pp. 116–120). "Above line" means margin per credit hour is at or above the costing-table threshold (−$100 for Table 2, −$1,000 for Table 1 thesis-based graduate programs), or at or above $0 if you switch the margin line.
- With default settings, quadrant assignments reproduce the workbook's "Quadrant · margin × enrolment" column exactly.
- The signal-implied category is a mechanical reading of the guide's quadrant logic, meant to prompt review. It is not a recommendation.
- The scenario model holds revenue per student constant and splits cost into fixed and enrolment-variable shares. It shows a steady-state view, not a multi-year forecast.

## Browser support

Current Chrome, Edge, Firefox and Safari. Fonts load from Google Fonts. If that's blocked, the page falls back to system fonts.
