#!/usr/bin/env python3
"""Rebuild the table of contents in docs/SPEC.md from its ## and ### headings.

Links use GitHub's heading anchors: lowercase, punctuation dropped (letters such as θ kept),
spaces turned into hyphens, and -1, -2, … added to repeats. Run it after adding, renaming or
renumbering a section:

    python3 scripts/spec_toc.py          # rewrite the Contents block in place
    python3 scripts/spec_toc.py --check  # exit 1 if the Contents block is out of date
"""

from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

SPEC = Path(__file__).resolve().parent.parent / "docs" / "SPEC.md"
HEADING = "## Contents"


def anchor(title: str) -> str:
    kept = "".join(
        c for c in title.lower()
        if c in " -" or unicodedata.category(c)[0] in "LMN" or unicodedata.category(c) == "Pc"
    )
    return kept.replace(" ", "-")


def build(text: str) -> str:
    seen: dict[str, int] = {}
    lines = [HEADING, ""]
    in_code = False
    for line in text.split("\n"):
        if line.startswith("```"):
            in_code = not in_code
        if in_code:
            continue
        m = re.match(r"^(#{2,3}) (.+?)\s*$", line)
        if not m:
            continue
        title = m.group(2)
        a = anchor(title)
        n = seen.get(a, 0)
        seen[a] = n + 1
        if n:
            a = f"{a}-{n}"
        if title == HEADING[3:]:
            continue
        lines.append(("- " if m.group(1) == "##" else "  - ") + f"[{title}](#{a})")
    return "\n".join(lines)


def main() -> int:
    text = SPEC.read_text(encoding="utf-8")
    start = text.index(HEADING + "\n")
    end = text.index("\n\n---\n", start)
    current = text[start:end]
    wanted = build(text)
    if "--check" in sys.argv:
        if current != wanted:
            print("docs/SPEC.md: Contents is out of date; run python3 scripts/spec_toc.py")
            return 1
        return 0
    if current != wanted:
        SPEC.write_text(text[:start] + wanted + text[end:], encoding="utf-8")
        print("docs/SPEC.md: Contents updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
