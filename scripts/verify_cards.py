#!/usr/bin/env python3
"""Check the card sets in content/cards against the rules in docs/SPEC.md §13.7.

Errors (exit code 1):
  - a missing or malformed field, a duplicate id, or a field or rarity outside the allowed lists;
  - dates out of order or in the future, or a major-work year outside the file's era
    (living people have no `died`);
  - fewer than 3 Diamonds or 4 cards of any other rarity in a set;
  - a blurb longer than two sentences or MAX_BLURB characters;
  - a portrait without its file, source, author and license, or with a license other than
    public domain, CC0, CC BY, CC BY-SA or an original illustration;
  - a malformed `wikidata` id;
  (a portrait whose license starts with "Non-free" is the owner's call and passes)
  - a `related` id that isn't a skill in any course under content/curriculum.

Warnings (printed, exit code 0):
  - a set outside SET_SIZE, and cards still waiting for a portrait;
  - a skill in any course whose name or summary mentions a card's person (Pascal's triangle,
    de Moivre's theorem, ...) when the card doesn't list it in `related`. This is how links stay
    current as courses are added: a new course's eponymous skills show up here until they're linked.

Usage: python3 scripts/verify_cards.py [content]
"""

from __future__ import annotations

import datetime
import re
import sys
from pathlib import Path

import yaml

# Era id → [first year, first year of the next era). Years are negative for BC.
ERAS = {
    "antiquity": (-10_000, 500),
    "golden-age": (500, 1400),
    "renaissance": (1400, 1650),
    "enlightenment": (1650, 1800),
    "steam-age": (1800, 1880),
    "machine-age": (1880, 1955),
    "space-age": (1955, 10_000),
}
RARITIES = ("diamond", "platinum", "gold", "silver")
MIN_PER_RARITY = {"diamond": 3, "platinum": 4, "gold": 4, "silver": 4}
SET_SIZE = (20, 32)  # about 24; the Machine Age is the most crowded
MAX_BLURB = 360
FIELDS = {
    "Mathematics", "Statistics", "Computing", "Physics", "Astronomy", "Chemistry", "Biology",
    "Medicine", "Psychology", "Linguistics", "Philosophy", "Economics", "History", "Geography", "Engineering", "Art",
}
REQUIRED = ("id", "name", "work", "fields", "rarity", "portrait", "blurb")
# Public domain (or Commons' No restrictions), CC0, CC BY and CC BY-SA (any version, or Commons'
# Attribution), or the project's own illustration.
PORTRAIT_LICENSE = re.compile(r"^(Public domain|No restrictions|CC0( 1\.0)?|CC BY(-SA)? [1-4]\.[05]( [A-Za-z-]+)?|Attribution|Original illustration)$")
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
# A sentence ends at . ! or ? followed by a space and a capital letter or digit, or at the end.
SENTENCE_END = re.compile(r"[.!?](?=\s+[A-Z0-9ÉÖ]|\s*$)")


def load_skills(curriculum: Path) -> dict[str, str]:
    """Every skill id in every course, with its name and summary as one searchable string."""
    skills: dict[str, str] = {}

    def walk(node):
        if isinstance(node, dict):
            if isinstance(node.get("id"), str) and "name" in node and ("dotPoints" in node or "size" in node):
                skills[node["id"]] = f"{node.get('name', '')} {node.get('summary', '')}"
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    for path in sorted(curriculum.rglob("*.yaml")):
        walk(yaml.safe_load(path.read_text()))
    return skills


def eponym_patterns(name: str) -> list[re.Pattern]:
    """Names a skill might use for this person.

    The last capitalized word of the name and of any parenthesized alias, plus the word before
    'of': 'Abraham de Moivre' → Moivre; 'Ibn Sina (Avicenna)' → Sina, Avicenna;
    'Zeno of Elea' → Zeno, Elea; 'William of Ockham' → William, Ockham.
    """
    words = []
    for part in re.split(r"[()]", name):
        tokens = [t for t in part.split() if t[:1].isupper()]
        if tokens:
            words.append(tokens[-1])
        if " of " in part:
            words.append(part.split(" of ")[0].split()[-1])
    return [re.compile(rf"\b{re.escape(w)}(?:'s|’s)?\b") for w in words if len(w) > 2]


def main(root: str = "content") -> int:
    root_path = Path(root)
    skills = load_skills(root_path / "curriculum")
    errors: list[str] = []
    warnings: list[str] = []
    seen: dict[str, str] = {}
    no_portrait = 0
    this_year = datetime.date.today().year

    files = sorted((root_path / "cards").glob("*.yaml"))
    eras_found = {p.stem for p in files}
    for era in ERAS:
        if era not in eras_found:
            errors.append(f"cards/{era}.yaml: missing (every era launches, §13.7)")

    for path in files:
        where = f"cards/{path.name}"
        doc = yaml.safe_load(path.read_text())
        era = doc.get("era")
        if era != path.stem or era not in ERAS:
            errors.append(f"{where}: era '{era}' must match the file name and be one of {', '.join(ERAS)}")
            continue
        start, end = ERAS[era]
        cards = doc.get("cards") or []
        counts = {r: 0 for r in RARITIES}

        for card in cards:
            cid = card.get("id", "?")
            at = f"{where}: {cid}"
            for key in REQUIRED:
                if key not in card:
                    errors.append(f"{at}: missing '{key}'")
            if not ID_RE.match(str(cid)):
                errors.append(f"{at}: id must be lowercase words joined by hyphens")
            if cid in seen:
                errors.append(f"{at}: duplicate id (also in {seen[cid]})")
            seen[cid] = path.name

            # Dates: born ≤ work ≤ died (no died for the living), or flourished when neither is known.
            born, died, fl, work = card.get("born"), card.get("died"), card.get("flourished"), card.get("work")
            if fl is None and born is None:
                errors.append(f"{at}: needs born (and died, unless living), or flourished")
            if isinstance(work, int) and work > this_year:
                errors.append(f"{at}: major work {work} is in the future")
            if born is not None and died is not None and not born < died:
                errors.append(f"{at}: born {born} is not before died {died}")
            if died is not None and died > this_year:
                errors.append(f"{at}: died {died} is in the future")
            if isinstance(work, int):
                if not start <= work < end:
                    errors.append(f"{at}: major work {work} is outside {era} ({start}–{end})")
                if born is not None and work < born or died is not None and work > died:
                    errors.append(f"{at}: major work {work} is outside their life")
            for key in card.get("circa") or []:
                if key not in ("born", "died"):
                    errors.append(f"{at}: circa lists '{key}'; only born and died can be approximate")

            fields = card.get("fields") or []
            if not fields or not set(fields) <= FIELDS:
                errors.append(f"{at}: fields {fields} must be a non-empty subset of the allowed list")
            rarity = card.get("rarity")
            if rarity in counts:
                counts[rarity] += 1
            else:
                errors.append(f"{at}: rarity '{rarity}' must be one of {', '.join(RARITIES)}")

            blurb = " ".join(str(card.get("blurb", "")).split())
            sentences = len(SENTENCE_END.findall(blurb))
            if sentences > 2 or sentences == 0:
                errors.append(f"{at}: blurb has {sentences} sentences; 1 or 2 allowed")
            if len(blurb) > MAX_BLURB:
                errors.append(f"{at}: blurb is {len(blurb)} characters; at most {MAX_BLURB}")

            portrait = card.get("portrait")
            if portrait is None:
                no_portrait += 1
            elif not all(portrait.get(k) for k in ("file", "source", "author", "license")):
                errors.append(f"{at}: portrait needs file, source, author and license")
            elif str(portrait["license"]).startswith("Non-free"):
                pass  # the owner's decision (overrides.yaml); the license field keeps the record
            elif not PORTRAIT_LICENSE.match(str(portrait["license"])):
                errors.append(f"{at}: portrait license '{portrait['license']}' isn't allowed (§13.7)")
            elif not (path.parent / portrait["file"]).is_file():
                errors.append(f"{at}: portrait file {portrait['file']} is missing (run scripts/process_portraits.py)")
            if "wikidata" in card and not re.match(r"^Q[1-9][0-9]*$", str(card["wikidata"])):
                errors.append(f"{at}: wikidata '{card['wikidata']}' isn't a Wikidata item id")

            related = card.get("related") or []
            for sid in related:
                if sid not in skills:
                    errors.append(f"{at}: related skill '{sid}' doesn't exist in any course")
            for pattern in eponym_patterns(card.get("name", "")):
                for sid, text in skills.items():
                    if sid not in related and pattern.search(text):
                        warnings.append(f"{at}: skill {sid} mentions {pattern.pattern.split('(')[0][2:]}; add it to related?")

        for r in RARITIES:
            if counts[r] < MIN_PER_RARITY[r]:
                errors.append(f"{where}: {counts[r]} {r} cards; at least {MIN_PER_RARITY[r]} needed")
        if not SET_SIZE[0] <= len(cards) <= SET_SIZE[1]:
            warnings.append(f"{where}: {len(cards)} cards; aim for about 24 (at most {SET_SIZE[1]})")
        print(f"{era:>14}: {len(cards)} cards (" + ", ".join(f"{counts[r]} {r}" for r in RARITIES) + ")")

    if no_portrait:
        warnings.append(f"{no_portrait} cards have no portrait yet")
    for w in warnings:
        print("warning:", w)
    for e in errors:
        print("error:", e)
    print(f"{len(seen)} cards, {len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))
