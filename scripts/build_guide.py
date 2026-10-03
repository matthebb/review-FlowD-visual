"""Build data/guide.js (the Reading guide tab) from docs/reading-guide.md.

Usage:
    pip install markdown
    python scripts/build_guide.py [path/to/reading-guide.md]

The markdown is converted to HTML. Each "## <Name> tab" heading gets an
"Open <Name>" button, and the comment <!-- diagram: data-flow --> is replaced
with the data-flow diagram drawn below.
"""
import json
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "reading-guide.md"
OUT = ROOT / "data" / "guide.js"

# Tab headings in the guide, mapped to the dashboard's tab keys.
TAB_KEYS = {
    "Briefing": "brief", "Costing model": "costing", "Portfolio": "portfolio",
    "Quadrants": "quadrants", "Labour market": "labour", "Faculties": "faculties",
    "Programs": "programs", "Categories": "categories", "Scenarios": "scenarios",
}


def slug(text):
    text = re.sub(r"<[^>]+>", "", text)
    return "g-" + re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;")


def diagram():
    """Data flow: two sources and the controls feed the derived measures; tabs read from them."""
    out = []
    add = out.append

    def box(x, y, w, h, cls="gd-box"):
        add(f'<rect class="{cls}" x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/>')

    def text(x, y, s, cls="gd-t", anchor=None):
        a = f' text-anchor="{anchor}"' if anchor else ""
        add(f'<text class="{cls}" x="{x}" y="{y}"{a}>{esc(s)}</text>')

    add('<svg class="gd-flow" viewBox="0 0 760 560" role="img" '
        'aria-label="Two sources and the controls feed one set of derived measures, and every tab reads from them">')
    add('<defs><marker id="gd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" '
        'orient="auto-start-reverse"><path class="gd-head" d="M0 0L10 5L0 10z"/></marker></defs>')
    # sources
    sources = [
        (60, 152, "Program workbook (260 rows)", ["Enrolment 2021-22, 2024-25", "3- and 10-year CAGR",
                                                  "CHP, cost, revenue, margin", "Costing-table thresholds",
                                                  "LMA, NS outlook, COPS", "Market share and trends",
                                                  "Category and status"]),
        (236, 72, "CAUBO FIUC, 2000-2024", ["Spending by function and fund", "Revenue by source, 79 peers"]),
        (332, 72, "Filters and parameters", ["Filters: which programs", "Parameters: the definitions"]),
    ]
    text(24, 44, "Sources", "gd-h")
    for y, h, name, items in sources:
        box(24, y, 200, h)
        text(40, y + 24, name, "gd-t gd-b")
        for i, s in enumerate(items):
            text(40, y + 40 + i * 16, s, "gd-s")
    # derived measures
    add('<rect class="gd-hl" x="254" y="28" width="292" height="512" rx="8"/>')
    text(270, 50, "Derived measures", "gd-h")
    measures = [
        ("Margin vs line, quadrant", "Portfolio, Quadrants, Programs"),
        ("Contribution, tuition coverage", "Portfolio, Faculties, Scenarios"),
        ("Labour-market groups", "Labour market, Portfolio"),
        ("Risk and opportunity scores", "Programs"),
        ("Signal-implied category", "Categories"),
        ("Scenario model", "Scenarios"),
        ("Scope and proxy ratios", "Costing model"),
    ]
    for i, (m, use) in enumerate(measures):
        y = 60 + i * 68
        box(270, y, 260, 56)
        text(286, y + 24, m, "gd-t gd-b")
        text(286, y + 40, "Used in: " + use, "gd-s")
    # tabs
    add('<rect class="gd-box" x="584" y="28" width="164" height="416" rx="8"/>')
    text(598, 50, "Dashboard tabs", "gd-h")
    for i, name in enumerate(TAB_KEYS):
        y = 60 + i * 42
        box(598, y, 136, 32)
        text(666, y + 20, name, "gd-t", "middle")
    # connectors
    for y in (136, 272, 368):
        add(f'<path class="gd-line" d="M224 {y}H252" marker-end="url(#gd-arrow)"/>')
    add('<path class="gd-line" d="M546 236H582" marker-end="url(#gd-arrow)"/>')
    add("</svg>")
    return "".join(out)


def build():
    md = SRC.read_text(encoding="utf-8")
    md = re.sub(r"^<!--.*?-->\s*", "", md, count=1, flags=re.S)  # file header comment
    md = md.replace("<!-- diagram: data-flow -->", "\n\n@@DIAGRAM@@\n\n")
    # Nested list items exported with 2-space indents; Python-Markdown needs 4.
    md = re.sub(r"^((?:  )+)([-*+]|\d+\.) ",
                lambda m: "    " * (len(m.group(1)) // 2) + m.group(2) + " ", md, flags=re.M)
    html = markdown.markdown(md, extensions=["tables", "sane_lists"])

    toc = []

    def heading(m):
        level, inner = int(m.group(1)), m.group(2)
        hid = slug(inner)
        extra = ""
        if level == 2:
            name = re.sub(r"<[^>]+>", "", inner)
            key = TAB_KEYS.get(name[:-4]) if name.endswith(" tab") else None
            toc.append({"id": hid, "t": name, "tab": key, "sub": []})
            if key:
                extra = f' <button type="button" class="linkbtn" data-goto="{key}">Open {esc(name[:-4])} →</button>'
        elif level == 3 and toc:
            toc[-1]["sub"].append({"id": hid, "t": re.sub(r"<[^>]+>", "", inner)})
        return f'<h{level} id="{hid}">{inner}{extra}</h{level}>'

    html = re.sub(r"<h([23])>(.*?)</h\1>", heading, html)
    html = html.replace("<p>@@DIAGRAM@@</p>", f'<figure class="gd-fig">{diagram()}</figure>')
    html = re.sub(r"<table>", '<div class="tablewrap"><table>', html)
    html = html.replace("</table>", "</table></div>")
    stamp = re.search(r"Last updated:\s*(.+)", SRC.read_text(encoding="utf-8"))
    payload = {"html": html, "toc": toc, "updated": stamp.group(1).strip() if stamp else ""}
    return payload


if __name__ == "__main__":
    data = build()
    OUT.write_text("window.GUIDE=" + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
    n = sum(1 + len(s["sub"]) for s in data["toc"])
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(data['toc'])} sections, {n} headings, {len(data['html']):,} characters")
