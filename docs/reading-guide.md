<!--
Reading guide for the APR Portfolio Lens. It is shown in the dashboard's Reading guide tab.
Edit this file, then run: python scripts/build_guide.py
Last updated: October 3, 2026
-->

## How to use this guide

The APR Portfolio Lens turns the 260-row Workstream D program file into a set of views for asking where the portfolio is strong, where it is exposed and what the program categories add up to. This guide explains, tab by tab, what each view draws and how to read it. It assumes you know the Academic Program Review well. It does not assume you know how the data fields were built or how these chart types work.

Each view is explained through four layers:

1. **APR grounding:** which requirement or suggested analysis in the APR Guide the view serves, with page references.
2. **Data:** which fields it uses and what those fields actually measure, including their limits.
3. **Encoding and calculation:** what position, size, colour and length stand for, and any measure the dashboard computes.
4. **Reading it:** what typical patterns mean as APR signals, and what they do *not* mean.

Three habits will help throughout:

- **Read every chart weighted as well as counted.** Program counts treat a 3-student MA like a 1,000-student BSc, and many views can be switched between programs, students, credit hours and dollars.
- **Treat every "margin" as relative.** It is an instructional contribution before the operating grant, not a surplus or deficit (see Costing model).
- **Hover the titles.** Every chart title, subtitle and legend opens a tooltip with its story, a live reading for the current filters, and the briefing findings and method caveats it relates to. This guide is the longer version of those tooltips.

## Data foundations

### The unit: an APR program

Every row is one APR program, defined as a unique combination of program type, credential type and six-digit CIP code (Guide p. 14). One APR program can bundle several majors, honours and co-op variants. A BA/BSc in Biology is one row, whatever options sit under it. Programs therefore vary enormously in size, from 0 to 1,087 students, which is why weighting matters.

### Source fields and what they really measure

| Field | What it is | Watch for |
| --- | --- | --- |
| 2021-22 and 2024-25 enrolment | Program headcount in each year (MPHEC data) | The 2021-22 base is pandemic-affected; the Guide advises against starting trends there (p. 65) |
| 3-year and 10-year CAGR | Compound annual growth rate of enrolment over each window | Unreliable for very small programs: 3 students to 1 is −31% a year |
| Total CHP, cost, revenue, margin | Workstream B costing outputs for 2024-25: credit hours produced, instructional cost, net tuition plus targeted funding, and revenue minus cost | Covers about 47% of operating spending; no operating grant (see Costing model) |
| Margin per CHP | Total margin ÷ credit hours | The measure the Guide uses for its integrative charts (p. 117) |
| Costing table and threshold | Table 1 (thesis-based graduate) line at −$1,000 per CHP; Table 2 (all others) at −$100 | The thresholds come from the workbook, not the Guide; their source needs documenting |
| LMA signal | Dalhousie's labour-market composite: 1 strongest, 2 stronger, 3 weaker, 4 weakest, 0 no signal | Lower is stronger. Construction is undocumented and appears to blend outlook, COPS and CIP–NOC link strength |
| Employment outcome | ESDC NS employment outlook (2024-26) for the program's most closely linked occupation | One occupation per program (Template 1, p. 18) |
| Public value | COPS 10-year shortage or surplus risk (2024-33) for that occupation | 160 of 260 programs have "insufficient signal" |
| Market share 2024, trends | Dal's share of NS credentials in the program's market, share trend and market-size trend (MPHEC) | 167 programs hold 100%, so share trends are mostly "stable" by construction |
| Dal and NS credentials 2024 | Credentials awarded by Dal and by all NS institutions in that market | Repeated across Dal programs sharing a CIP code: count each market once |
| Agreed category, status | Workstream C category and program status (active, suspended, terminated) | 17 programs are terminated or suspended |

### Measures the dashboard derives

- **Margin vs line:** margin per CHP minus the chosen line (the program's threshold, or $0). Positive = above the line.
- **Quadrant:** above or below the line × growing or declining (CAGR at or above the growth cut-off). With default settings this reproduces the workbook's own quadrant column exactly. Programs with no costing, no trend or zero current enrolment are "not charted".
- **Instructional contribution:** the dashboard's name for total margin, to stop it being read as surplus or deficit.
- **Tuition coverage:** revenue ÷ cost for the programs in view.
- **Aggregate contribution per CHP:** the sum of margins ÷ the sum of CHP, never an average of program ratios, so large programs carry their true weight.

### Controls that change every view

The **filter bar** narrows the program set by faculty, level, category, labour-market group and whether terminated or suspended programs are included. The **Analysis parameters** panel changes the definitions themselves:

- trend basis (3-year or 10-year CAGR)
- growth cut-off
- margin line (threshold or $0)
- subscale enrolment limits for undergraduate and graduate programs
- minimum 10-year average enrolment before a trend counts
- bubble-size measure
- labour-market lens (LMA signal, NS outlook or COPS)

Changing a parameter is a sensitivity test. A finding that holds under both trend windows and both margin lines is robust. One that flips is a judgement call that needs qualitative evidence.

### At a glance

<!-- diagram: data-flow -->

Both sources feed one set of derived measures, and the filters and parameters change those measures everywhere at once. That is why a parameter change on one tab shows up on every other.

## Briefing tab

**What it is.** The written analysis: a "read first" note on what margin means, then the findings. The findings are coded R (risk) or O (opportunity), and each lists the charts that show it, with a button that opens the right tab. Below them sit the parameters that should shape any distribution analysis, a map from questions to views, and the data issues to resolve before Template 7.

**APR grounding.** The findings answer the questions the Guide poses for Template 7.2, Academic Portfolio Health (p. 127). These include which programs drive financial outcomes, whether enrolment is concentrated in higher- or lower-margin programs, whether it is concentrated in stronger or weaker labour-market alignment, and what trends signal about the direction of portfolio finances.

**How to read it.** The findings are static text written for the whole portfolio at file defaults (threshold margin line, 3-year trend). They do not change with filters. To see a finding for one faculty or level, follow its link and filter the chart, then hover the chart title: the tooltip's "In the current view" line recalculates.

**Caution.** The finding numbers will drift from the charts if the workbook is refreshed. The README explains where to update them.

## Costing model tab

This tab states what the Workstream B costing method can and cannot support, before any margin is read. It uses a second data source: the CAUBO *Financial Information of Universities and Colleges* (FIUC) return for every Canadian university, 2000-01 to 2023-24. It is the only tab that ignores the program filters.

### Scope tiles and use/do-not-use lists

- **Data:** program costing totals ($284.6M cost, $238.8M revenue, 2024-25) set against Dal's FIUC operating fund ($599.9M spending, $657.0M revenue, 2023-24) and all-funds spending ($928.5M).
- **Reading it:** the model counts about 47% of operating spending and 31% of all spending. On the revenue side it counts only net credit tuition, about 36% of operating revenue. The operating grant contributes nothing to any program. So a program's negative margin is a contribution before the grant, and summing margins does not give the institution's deficit.
- **APR grounding:** Workstream B Step 4 sets which spending functions and funds are included (pp. 36–43). Step 6 excludes general operating grants from revenue (p. 47). Step 8 requires a reconciliation to FIUC (pp. 51–56).

### What the model sees, in dollars

- **Encoding:** three horizontal bars on one dollar scale. Top: all-funds spending, with the operating fund in the first segment. Middle: operating spending by FIUC function. Bottom: operating revenue by source. Blue = included in program cost or revenue; violet = scholarships netted against tuition; grey = excluded; dashed = outside the operating fund. Black markers show the program totals the model actually produced.
- **Reading it:** the gap between the end of the blue segments and the program-cost marker is spending in *included* functions that never reached a program ($141.7M, caveat M7). The grey provincial-grant segment, about as long as blue tuition, shows why the grant cannot be sized from program margins.

### Dalhousie's cost structure is a U15 structure (scatter)

- **Encoding:** one dot per Canadian university with operating spending over $30M. X = sponsored-research spending ÷ operating spending (research intensity). Y = share of operating spending in the functions program costing includes (instruction and non-sponsored research, library, administration and academic support).
- **Reading it:** a higher Y means a larger share of the budget is loaded onto programs under the same method. Dal (71%) sits with the U15 (median 70%), above the NS median (66%), and far to the right on research intensity (33% vs NS 9%). Dal's programs therefore carry more cost per credit hour than NS peers' would under identical rules. That is a structural difference, not an efficiency gap.

### Proxy tuition coverage (bars)

- **Calculation:** credit tuition ÷ spending in the included functions, from each university's FIUC. It applies the model's scope rules to every institution before any local allocation choices, so it is the fairest like-for-like comparison available.
- **Reading it:** Dal reads 62% against an NS median of 75% and a U15 median of 59%. Read this as how the method treats research universities, not as relative efficiency. Cape Breton exceeds 100% (157%), probably because of its international tuition base.

### Function shares (dot plot)

- **Encoding:** each row is an FIUC function marked IN, NET or OUT. Dots show the share of operating spending for Dal, the NS median and the U15 median.
- **Reading it:** where Dal sits right of the NS median on an IN row, more cost is loaded onto programs. Where it sits left on an OUT row, less cost is removed. Dal spends relatively more on included instruction and research and less on excluded administration and student services. Both effects push its program costs up.

### Coverage trend (lines)

- **Encoding:** proxy coverage by year, 2000-01 to 2023-24, for Dal, the NS median and the U15 median.
- **Reading it:** Dal has been below the NS median in every year, so the gap is structural rather than a recent cost problem.

### Method caveats M1–M8

Each card names a feature of the method, the FIUC evidence, where the effect shows up, and its direction:

- **Disadvantages Dal vs NS peers:**
  - M1: research time charged to teaching
  - M2: equal overhead per section
  - M3: unfunded awards netted from revenue
  - M4: only credit tuition counted as revenue
  - M5: clinical revenue outside the model
- **Understates cost:** M6, excluded space, utilities and IT.
- **Direction unknown:** M7, unreconciled included spending.
- **Shifts cost between Dal programs:** M8, a whole campus treated as faculty overhead.

Codes with a program-level rule appear as violet chips on the Programs tab and in chart tooltips, so a skew can be named wherever it surfaces. The program-level rules for M6 and M8 are reasoned assumptions, not measurements.

### Inclusion reference (table)

Each major FIUC line with its 2023-24 amount, its treatment in program costing, the Guide step that sets the treatment, and what that means when reading results.

## Portfolio tab

The institution-level view of financial shape and balance. It serves the Guide's portfolio-health questions (Template 7.2, p. 127) and Workstream B Step 9's call to "assess overall distribution to understand portfolio health" (p. 56).

### Scope banner and summary tiles

The banner restates the costing scope, so no total is read without it. The tiles are sums for the filtered programs:

- programs
- enrolment, with the change since 2021-22
- program cost and credit hours
- program revenue
- **instructional contribution**, with contribution per CHP
- **tuition coverage** (revenue ÷ cost)

Coverage below 100% is the norm, because the operating grant is outside the model.

### Cumulative margin curve

- **Encoding:** programs are ranked from largest positive to largest negative total margin, and the line plots the running total. The x-axis is either program count or cumulative credit hours. The peak marks the total surplus; the end point is the portfolio total.
- **Calculation:** running sum of total margin in ranked order. Practitioners call this a whale curve.
- **Reading it:**
  - A steep early climb means the surplus is concentrated in a few programs. That is a concentration risk: losing one or two would cut the peak sharply.
  - The length and depth of the descent show how widely the shortfall is spread.
  - Switching to credit hours shows whether the surplus also comes from a small share of teaching activity.
- **APR signal:** the Guide's ideal of high-margin programs subsidizing mission-critical low-margin ones (p. 118) is visible as the peak funding the descent. The questions to ask are whether the programs at the top are growing, and whether they are aligned with mission.

### Quadrant mix, weighted four ways

- **Encoding:** four 100% stacked bars for the same programs, weighted by count, students, credit hours and cost. Segment colours are the quadrants: dark blue above the line and growing, light blue above and declining, red below and growing, pink below and declining, grey not charted.
- **Reading it:** if the dark-blue share grows from the Programs row down to the Students and Credit hours rows, large programs are healthier than small ones. If red grows, the problem is bigger than the program count suggests. Hover the segments for each quadrant's combined contribution: above the line is not the same as positive.
- **APR grounding:** this is the Guide's balance test. Are enrolments concentrated in higher- or lower-margin programs (p. 127)? And is enrolment shifting from high-margin to low-margin programs (p. 118)?

### Margin per CHP against the line (histogram)

- **Encoding:** bars count programs, or credit hours or students when weighted, in $250 bins of margin per CHP minus each program's line. Red is below the line, blue at or above. Values beyond −$3,000 or +$1,500 are pinned to the end bins.
- **Reading it:**
  - A tall stack just either side of zero means many quadrant assignments are fragile, since a small costing or threshold change would move them.
  - A long left tail marks structural deficits that enrolment growth alone will not fix.
  - If the tail shrinks when weighted by credit hours, the worst cases are small programs.
- **Why relative to the line:** Table 1 (thesis graduate) and Table 2 programs have thresholds $900 apart. Subtracting each program's own line makes them comparable on one axis.

### Quadrant mix by labour-market group

- **Encoding:** the same quadrant split, one row per labour-market group under the current lens, plus an all-programs row. The right side shows program and student counts, enrolment change and total contribution.
- **Reading it:** if the strongest-signal rows are mostly blue, labour-market alignment and financial health point the same way and growth is easy to justify. If they are mostly red, the programs government most wants are the ones tuition does not cover. That is an argument for targeted funding, not for cuts.

### Size bands

- **Encoding:** two panels sharing the x-axis of 2024-25 enrolment bands. The top panel counts programs per band; the bottom panel shows the combined total margin of each band (blue positive, red negative).
- **Reading it:** comparing the tallest bars on top with the deepest bars below tests the common assumption that closing small programs fixes the budget. At Dal, programs under 10 students are numerous but carry about 12% of the negative contribution. The deepest bars sit in the 20–99 student bands.
- **APR grounding:** the Guide links rationalization to "low utilization" alongside cost and labour-market need (p. 98). This view keeps the two separate.

## Quadrants tab

The three integrative analyses the Guide recommends for Workstream D, "Integrating Program Costing with Enrolment/Completions, Market Share, and Labour Market" (pp. 115–121). Each sets two measures against each other to produce four zones with different strategic readings. The Guide stresses that no single chart determines a category (p. 116).

### 1. Program margin × enrolment trend (bubble chart)

- **Encoding:**
  - X: enrolment CAGR on the chosen basis, clamped at ±50% and pinned to the edge beyond that.
  - Y: margin per CHP minus the line.
  - Bubble area: the bubble-size setting (default 2024-25 enrolment).
  - Colour: quadrant, category, labour-market group, or a single highlighted faculty.
  - Quadrant lines sit at the growth cut-off and at zero margin-vs-line. Each corner shows its program count, students and total contribution. The ten largest bubbles are labelled where space allows.
- **The Guide's readings (p. 118):**
  - **Above line, growing:** build on success; evidence for Modernize.
  - **Above line, declining:** a valuable program losing students; a signal for Revitalize where its economic and social value support growth.
  - **Below line, growing:** the key question is whether scale will lower unit cost (economies of scale) or whether the cost is structural, so that growth deepens the deficit.
  - **Below line, declining:** a signal for Revitalize or Rationalize; look for cost-effectiveness and enrolment opportunities.
- **Reading it:**
  - Large bubbles near the axes are large programs whose quadrant could flip.
  - Large bubbles in the below-line, growing quadrant are growth that deepens the shortfall.
  - Switch the trend basis to 10-year: programs that change sides have reversed direction.
  - Switch the margin line to $0 to see how many "above line" programs still lose money. With the threshold line, the above-line, growing quadrant nets about −$0.2M.
- **Caution:** the 3-year window starts in 2021-22, a pandemic-affected base. A 3-year CAGR on a program with fewer than about 10 students mostly reflects noise; raise the minimum-enrolment parameter to exclude them from trend classification.

### 2. Program margin × labour market (beeswarm)

- **Encoding:** columns are LMA signal values ordered from weakest (4) to strongest (1), with "no signal" set apart on the right. Dots are spread sideways within a column only so they do not overlap; horizontal position inside a column means nothing. Y is margin vs line. Colour follows the control above.
- **The Guide's readings (p. 120):**
  - High margin with strong prospects: candidates to grow.
  - Low margin with weak prospects: "expensive" programs to consider for cost reduction or repositioning.
- **Reading it:** the important cases at Dal are the red dots in the right-hand columns: strong labour-market need but below the line. They answer the Guide's question "why is a high-demand program operating at a negative margin?" (p. 57). The answer is usually cost redesign or targeted funding, not closure. A crowded no-signal column means the labour-market case has not been made.

### 3. Market size × market share (matrix)

- **Encoding:** the Guide draws this as a bubble chart of two CAGRs (p. 119). The workbook supplies only categorical trends, so it is a 4 × 4 matrix: rows are the provincial market-size trend, columns the Dal share trend. Cell shade = students. Each cell shows programs, students and total contribution.
- **The Guide's readings:**
  - Growing share in a shrinking market is evidence of competitive strength.
  - Holding share in a shrinking market means a realistic enrolment target is lower than today.
  - Declining share in a shrinking market, especially for a large program, warrants fresh questions.
- **Reading it at Dal:** most programs hold 100% of NS credentials, so most share trends read "stable" by construction. The matrix tells a uniqueness story more than a competition story. The more useful signal is the share of students in shrinking markets (about 24%).

## Labour market tab

Labour-market alignment is a bilateral-agreement requirement and the indicator a provincial reviewer is most likely to start from. The Guide requires CIP-to-NOC mapping and evaluation of both graduate employment outcomes and public value, meaning whether graduate numbers match workforce demand (pp. 72–75). This tab shows where the portfolio stands and moves against those signals.

### The lens

The switch at the top, also under Analysis parameters, chooses which source defines four groups:

| Lens | Source | Groups (strong to weak) |
| --- | --- | --- |
| LMA signal | Dal's composite (column AD) | 1 strongest · 2 stronger · 3–4 weaker · 0 no signal |
| NS employment outlook | ESDC 3-year prospects (AE) | Very good · Good · Moderate or limited · Undetermined |
| COPS | 10-year shortage/surplus (AF) | Strong shortage · Moderate shortage · Insufficient signal · Surplus or no data |

The lens changes this tab, the labour-market filter, the Portfolio mix rows, the bubble colours, and what counts as a "stronger labour market" in risk scores and the signal-implied category. Under COPS most programs fall into "insufficient signal", which is not evidence of weak demand.

### Summary tiles

- share of students in stronger-signal programs, and its growth
- share in COPS shortage-aligned programs
- shortage programs with falling enrolment
- share with no usable signal
- Dal's share of NS credentials in stronger-signal fields

The last tile divides Dal credentials by NS credentials. The workbook repeats NS market totals across Dal programs that share a CIP code, so the tile counts each program type and CIP market once (about 67% at default settings).

### Is enrolment moving toward need? (dumbbell)

- **Encoding:** one row per group. A hollow dot marks 2021-22 enrolment, a solid dot 2024-25, joined by a bar. The label gives the change in students and per cent.
- **Reading it:** growth concentrated in the stronger groups is evidence the portfolio already responds to labour-market need. At Dal, LMA 1 grew 12%, LMA 2 4%, weaker programs were flat, and no-signal programs declined. Growth in the weaker or no-signal groups would be a vulnerability. Switch to COPS for a sharper shortage test.

### The cost of growing where demand is (bars)

- **Encoding:** contribution per CHP by group, as a diverging bar from zero, with total contribution and tuition coverage at the right.
- **Reading it:** if per-CHP contribution falls as labour-market strength rises, the fields government most wants are the most expensive to deliver. At Dal these are largely health and clinical programs, with delivery costs and clinic revenue the model does not capture (caveats M4–M5). The finding is a funding argument, not an efficiency finding.

### Supply response (banded beeswarm)

- **Encoding:** one horizontal band per group. Each dot is a program placed by its enrolment CAGR, spread vertically within its band only to avoid overlap. Size follows the bubble-size setting; colour shows above or below the margin line. The left side of each band counts declining and growing programs.
- **Shaded zones:**
  - The left of the line in the two stronger bands (orange tint) is the vulnerability zone: programs feeding needed occupations that are losing students.
  - The right of the line in the weaker band (amber tint) is the watch zone: growth where labour-market evidence is weak.
- **Reading it:** a red dot in the vulnerability zone under-supplies demand and is costly to fix. A blue dot right of the line in the strongest band is an expansion candidate.

### Shortage pipeline (table)

- **Content:** every program whose most closely linked occupation carries a COPS shortage risk, with outlook, enrolment, both CAGRs, credential trend, NS share, market trend, contribution, category and flags.
- **Flags:**
  - *Supply falling* (3-year CAGR below zero or credentials decreasing) and *Sole NS provider* mark vulnerability and strategic responsibility.
  - *Expand candidate* (growing and at or above the line) marks opportunity.
  - *Costly to grow* (below the line) marks where targeted funding is needed.
- **Reading it:** "Supply falling" together with "Sole NS provider" means no other Nova Scotia institution fills the gap. Arts programs flagged for shortage deserve a check of their occupation mapping (limit L1 below).

### Faculty labour-market profile (stacked bars)

- **Encoding:** each faculty's students split by group, with the change in stronger-signal students since 2021-22 at the right.
- **Reading it:** a large grey share means a faculty has the most labour-market evidence still to build. A negative figure at the right means stronger-signal enrolment is shrinking there.

### Do the signals agree? (matrix)

- **Encoding:** NS outlook (rows) against COPS outlook (columns). Each cell shows programs, students (shade) and a mini-bar of the LMA signals inside it.
- **Reading it:** because the LMA signal is a composite, a reviewer may check it against the raw sources. Cells where a good outlook or a shortage flag sits beside LMA 0 or 3 need an explanation. The note lists large programs with a good outlook but no LMA signal, such as the Engineering diploma and the JD.

### Reading the signals (limits L1–L6)

Six limits cards:

- L1: one occupation per program.
- L2: most programs have no COPS signal.
- L3: the LMA signal is an undocumented composite.
- L4: graduate programs share undergraduate mappings.
- L5: NS outlook covers 3 years and COPS 10.
- L6: the Employment prospects column is empty.

Cite L1 and L3 before relying on any single program's flag.

## Faculties tab

Turns program results into the units where resource decisions are made. The Guide asks the central review team to review categorizations "across the institution, and/or by faculty or school" (p. 121), and suggests grouping programs by faculty to spot patterns and outliers (pp. 56, 63). This tab ignores the faculty filter so every faculty stays comparable; level, category and teach-out filters still apply.

### Faculty scorecard (table)

| Column | Meaning |
| --- | --- |
| Programs, Students | Count and 2024-25 enrolment |
| Enrolment change 3-yr | 2024-25 against 2021-22, in per cent |
| Tuition coverage | Revenue ÷ cost: the share of counted instructional cost covered by net tuition and targeted funding |
| Margin/CHP | Faculty total margin ÷ faculty credit hours |
| Contribution | Total margin, with a diverging bar on a common scale |
| Students below line | Share of the faculty's students in below-line programs |
| Programs subscale | Share of programs under the subscale enrolment limits |
| Category mix | Share of programs in each agreed category |

Violet chips beside a faculty name flag faculty-level method caveats: M5 for clinical revenue (Dentistry, Medicine), M6 for excluded space (space-intensive faculties) and M8 for campus overhead (Agriculture).

**Reading it:**

- A faculty with falling enrolment and low coverage is under pressure on both fronts.
- A faculty where most students are below the line but most programs are "No Change" needs its rationale checked.
- The faculties with a positive contribution are the ones funding the rest.
- Low coverage in a faculty carrying M5, M6 or M8 chips partly reflects the method, and should be stated as such.

### Spread of margin within each faculty (strip plot)

- **Encoding:** one row per faculty, ordered by median. Each dot is a program placed by margin vs line, sized by the bubble-size setting and coloured by quadrant. The black tick is the faculty median.
- **Reading it:**
  - A tight cluster below the line points to a faculty-wide cost model issue.
  - One or two outliers point to program-specific decisions.
  - A large blue dot in an otherwise red row is the program subsidizing that faculty.
- **Why it matters:** a faculty average can look acceptable while hiding a deep deficit and a strong surplus side by side.

### Where enrolment growth landed (diverging bars)

- **Encoding:** change in students since 2021-22 per faculty. Gains run right and losses left. Each bar is split into programs with a positive dollar margin (blue) and the rest (red).
- **Reading it:** this is the Guide's warning scenario (p. 118). Stable total enrolment can hide a shift of students from programs that make money into programs that lose it. At Dal, most net growth landed in programs without a positive contribution, chiefly in Health and Medicine. That fits labour-market need, and it is a financial-balance pressure.

## Programs tab

The program-level work list. The Guide expects each program's review to draw on centrally generated analyses (p. 63) and suggests quartile benchmarking: the middle 50% is "typical", and the top and bottom quarters are where context and discovery help most.

### Risk and opportunity scoring

Each program trips binary flags, and each flag carries a weight from 0 to 3 that you set. The risk score is the sum of the weights of the risk flags it trips; the opportunity score works the same way.

| Risk flag | Trips when |
| --- | --- |
| Below margin line | Margin per CHP below the line |
| Enrolment declining | CAGR below the growth cut-off (trend basis setting) |
| Declining on 3- and 10-yr | Both CAGRs negative |
| Subscale enrolment | Below the undergraduate or graduate subscale limit |
| Weaker labour market | Weak group under the current lens |
| Losing NS market share | Market share trend = falling |
| Credentials decreasing | Graduation trend = decreasing |
| Deficit over $500K | Total margin below −$500,000 |

| Opportunity flag | Trips when |
| --- | --- |
| Stronger labour market | Strong group under the current lens |
| Workforce shortage risk | COPS strong or moderate shortage |
| Enrolment growing | CAGR at or above the cut-off |
| At or above margin line | Margin per CHP at or above the line |
| Rising share or growing market | Either trend positive |
| Research-priority aligned | Research Contribution = aligned |

The flags draw on the Guide's rationalization criteria (low demand, high cost, weak labour market, p. 98) and its modernization and revitalization strengths (pp. 79–89). The weights are a judgement, not a Guide rule. Changing them is a sensitivity test: a program that stays in the same corner under any reasonable weighting is a robust finding.

### Risk × opportunity map (scatter)

- **Encoding:**
  - X = opportunity score, Y = risk score, each dot slightly jittered so equal scores do not overlap.
  - Size follows the bubble-size setting; colour is the agreed (or reassigned) category.
  - Dashed lines mark the midpoint of each score's possible range.
- **Corners:**
  - Top-left (high risk, low opportunity) is where rationalization review belongs.
  - Top-right (high risk, high opportunity) is where investment to fix is justified.
  - Bottom-right (low risk, high opportunity) is where to grow.
- **Reading it:** colour against position is the quick check. A Revitalize program in the top-left raises the question of whether revitalization is realistic. An orange (Rationalize) dot outside the top-left needs its rationale to rest on mission or fit.

### Program screen (table)

- **Content:** every program in view with faculty, category, students, trend, margin vs line, contribution, LMA, both scores and its flags.
- **Chips:** red chips are risk flags, blue are opportunity flags, and violet are method caveats (M codes) that bias the program's costing figures.
- **Controls:** sort by any column; search by name or faculty; filter to one method caveat (for example M3 for programs affected by unfunded graduate awards).
- **Reading it:** sort by risk, then read the flags. Repeated combinations point to common causes. Sort by contribution to see whether high-risk programs are also financially material.

### Peer comparison (strip plots)

- **Encoding:** click any program in the table or any chart. Each row is one measure:
  - 2024-25 enrolment (log scale)
  - 3-year and 10-year CAGR
  - margin vs line
  - total margin
  - tuition coverage
  - 10-year credentials (log scale)

  Grey dots are the comparison group (same level, same faculty or all programs). Blue dots are same-faculty peers. The shaded band is the middle 50%, the tick the median, and the large dot this program, with its percentile at the right.
- **Reading it:**
  - Measures where the program falls outside the band are where the review should dig.
  - If same-faculty peers cluster with it, the issue is faculty-wide.
  - Switching the comparison group matters: a program can be typical in its faculty but an outlier at its level.
- **Caveats:** the panel lists the method caveats that apply to the program, so its costing figures are read with the right allowance.

## Categories tab

An internal consistency check on the agreed Workstream C categories. The Guide asks the central team to "review program categorizations across the institution… identify any categorizations that should be reconsidered" (p. 121). This tab supports that review. It is a working tool: the submission does not refer to differences between quantitative signals and agreed categories.

### The signal-implied category

A mechanical reading of the Guide's quadrant logic (p. 118), applied to every program:

| Program position | Implied category |
| --- | --- |
| Above line, growing, stronger labour market | Modernize |
| Above line, growing, otherwise | No Change |
| Below line, growing | Modernize (cost-effectiveness) |
| Above line, declining | Revitalize |
| Below line, declining, subscale and not stronger labour market | Rationalize |
| Below line, declining, otherwise | Revitalize |
| Terminated or suspended | No Change (teach-out) |
| Not charted | Insufficient data |

It ignores everything the metrics cannot see: curriculum review status, accreditation, mission, uniqueness and service teaching. It is a prompt for review, never a recommendation.

### Agreed × signal-implied matrix

- **Encoding:** rows are agreed categories and columns the implied categories. Shaded cells on the diagonal are agreement. Click a cell to list its programs below.
- **Reading it:** large off-diagonal cells are where qualitative evidence has to carry the argument, so those programs need the strongest written rationale in their templates. An "Insufficient data" column shows categories set without quantitative support.

### Category mix by faculty (stacked bars)

- **Encoding:** each faculty's share of programs, or of students, in each category, with the portfolio bar at the bottom. Your reassignments are included.
- **Reading it:** a faculty far above the portfolio's Revitalize share has more improvement plans than it can resource. The Guide asks for prioritization by benefit, risk and cost (p. 122). Weighting by students shows how much teaching each category actually touches.

### Reassignment sandbox

- **How it works:** the program list (mismatches by default, or the selected matrix cell) has a category dropdown per program. Changes are highlighted and stored in your browser only. They flow into the faculty mix and the Scenarios tab. **Copy changes as CSV** exports them for discussion.
- **Use:** test an alternative category and see its portfolio and financial effect before a decision meeting.

## Scenarios tab

Puts rough numbers on the plans. The Guide asks institutions to "assess the potential cumulative impact of the recommended changes" on the portfolio's shape, health, balance and sustainability (p. 121). The Rationalize methodology also requires analysis of financial impact, including redeployment and long-term savings (p. 100). This is a steady-state view of the filtered programs after plans take effect, not a multi-year forecast.

### The model behind the levers

For each active program, enrolment changes by its category's percentage. Then:

- **Revenue** scales with enrolment, because revenue per student is held constant.
- **Cost** splits into a fixed part and a variable part. Only the variable share (lever) scales with enrolment, so a low variable share means growth improves contribution per CHP.
- **A Rationalize program at −100%** loses all its revenue but sheds only the "cost removed" share of its cost. The rest is stranded: shared courses, and faculty redeployed rather than released.
- **A cost-reduction lever** trims cost in below-line Revitalize programs, for delivery changes.
- **Teach-out programs** can be removed from the forward view.

### Result tiles and margin bridge

- **Encoding:** the tiles compare scenario contribution, coverage and students with today's. The bridge (waterfall) starts at current contribution, steps through each source of change and ends at the scenario total. Grey bars are totals, blue steps improve contribution and red steps worsen it.
- **Reading it:**
  - The size of each step shows which plans carry the financial weight.
  - At default settings, completing teach-outs is the largest step, Revitalize growth adds a few million, and Rationalize is slightly negative. Phasing out programs can make contribution worse unless nearly all of their cost actually leaves. At Dal the active Rationalize programs' revenue covers about 95% of their counted cost, so contribution only improves if more than 95% of that cost is removed.
  - That finding supports framing rationalization as a mission decision rather than a savings measure.

### Faculty impact (table)

Contribution now and under the scenario, by faculty, ordered by change. Faculties that worsen usually have growth in below-line programs or stranded cost from phase-outs.

**Caution:** all figures inherit the costing model's scope. Use the bridge to compare plans with each other, not to forecast the budget.

## Reading across views: common misreadings

| Misreading | Why it is wrong | Read it instead as |
| --- | --- | --- |
| "Tuition covers 84% of cost, so the grant only needs to cover 16%." | The model counts about half of operating spending and none of the grant | Coverage of *counted instructional* cost only (Costing model tab) |
| "Above the line means the program makes money." | The line is −$100 or −$1,000 per CHP, not $0 | Relative standing; switch the margin line to $0 for dollars |
| "The portfolio deficit is −$45.9M." | It is a sum of instructional contributions before the grant | The gap the grant and other income fill |
| "Closing small programs fixes the budget." | Programs under 10 students carry about 12% of the negative contribution | Size bands chart; rationalization as a mission decision |
| "A −30% CAGR means collapse." | Small numbers swing; the 2021-22 base is pandemic-affected | Check the 10-year CAGR and the head count |
| "No COPS signal means weak demand." | 160 programs have insufficient signal | Absence of evidence; build supplementary evidence |
| "Dal's margins are worse than peers', so Dal is less efficient." | Research time, small sections and excluded revenue load more cost onto Dal's programs | Method caveats M1–M5; the FIUC proxy comparison |
| "A shortage flag proves a general degree is in demand." | One occupation per program (L1) | One signal among several; cite graduate outcomes |
| "The signal-implied category is what the program should be." | It ignores curriculum, mission, uniqueness and service teaching | A prompt for review only |
| "Scenario results are the budget impact." | Steady-state, inside the costing scope, with assumed elasticities | A comparison of plans with each other |

Two checks protect any finding:

1. **Weight it.** Does it hold by students and credit hours, not just program count?
2. **Stress it.** Does it hold under both trend windows, both margin lines and a minimum-enrolment filter?

If it passes both, it is a portfolio finding. If not, it is a question for the program review.

## Glossary

| Term | Meaning |
| --- | --- |
| APR program | A unique program type × credential type × CIP-6 combination; may bundle majors, honours and options |
| CAGR | Compound annual growth rate: (end ÷ start)^(1/years) − 1. Comparable across windows of different length |
| CHP | Credit hours produced: students × credit value, summed over the courses a program's students take |
| CIP | Classification of Instructional Programs, the field-of-study code that defines program markets |
| Contribution (instructional) | Program revenue minus counted instructional cost; the workbook's "Total margin" |
| COPS | Canadian Occupational Projection System; 10-year shortage or surplus outlook by occupation |
| Costing table 1 / 2 | Table 1 = thesis-based graduate programs (line −$1,000 per CHP); Table 2 = all others (−$100) |
| FIUC | CAUBO's annual financial return by fund and function for every Canadian university |
| Included functions | Instruction and non-sponsored research, library, administration and academic support: the spending pools program costing allocates |
| LMA signal | Dalhousie's labour-market composite, 1 (strongest) to 4 (weakest), 0 = no signal |
| Margin line | The reference a program's margin per CHP is compared with: its costing-table threshold or $0 |
| Market share | Dal credentials ÷ NS credentials in the program's market, 2024 |
| Method caveats (M1–M8) | Features of the costing method that bias Dal's results, each with a stated direction |
| NOC | National Occupational Classification; the occupation code programs are mapped to |
| Proxy tuition coverage | Credit tuition ÷ included-function spending, from FIUC; a like-for-like comparison across universities |
| Quadrant | Above or below the margin line × growing or declining enrolment |
| Signal-implied category | A mechanical category from the quadrant logic; an internal review prompt |
| Sole provider | A program holding 100% of NS credentials in its market |
| Subscale | 2024-25 enrolment below the parameter limit (default 25 undergraduate, 8 graduate) |
| Tuition coverage | Program revenue ÷ program cost for the programs in view |
| U15 | Canada's fifteen research-intensive universities; Dal is the only Atlantic member |
| Whale curve | Cumulative contribution with programs ranked from highest to lowest |
