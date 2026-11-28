#!/usr/bin/env python3
"""Find a portrait for every card on Wikimedia Commons and sort them by license (docs/SPEC.md §13.7).

For each card in content/cards:
  1. Find the person on Wikidata: the card's `wikidata` id if it has one, otherwise the English
     Wikipedia article for its name (or the name in parentheses), then a Wikidata search. A match
     must be a human whose birth year agrees with the card (looser for approximate dates).
  2. Take the person's Wikidata image (P18) and ask Commons for its license, author and categories.
  3. Sort it:
       ready       public domain or CC0, nothing to check
       credit      CC BY or CC BY-SA: usable, with the author and license shown on the card
       check       usable license, but a person should confirm it (a photo of a bust, statue, coin
                   or stamp, where the photographer or issuer may hold rights; or a public-domain
                   claim on a photo of someone working after 1925, unless it's a US government work)
       illustrate  no image, or a license the spec doesn't allow: needs an original illustration
       unmatched   no Wikidata match: add the card's `wikidata` id by hand and run again

Owner decisions live in content/cards/portraits/overrides.yaml: a different Commons file for a
card, an image supplied by the owner, and "check" portraits the owner has reviewed (tied to the
exact file, so a new image is checked again).

Writes the report to content/cards/portraits.md. Nothing is downloaded unless asked.
scripts/process_portraits.py then turns the chosen images into the cards' duotone WebPs.

Usage:
    python3 scripts/find_portraits.py                      # look up every card, write the report
    python3 scripts/find_portraits.py --only euler,gauss   # just these cards (report not written)
    python3 scripts/find_portraits.py --write-ids          # also save each match as `wikidata:` in the YAML
    python3 scripts/find_portraits.py --download DIR       # also save usable images (960 px wide) in DIR

Wikimedia asks automated clients to identify themselves: set PORTRAIT_USER_AGENT to something
like "YourApp-portraits/1.0 (you@example.com)" to include your contact details.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CARDS = ROOT / "content" / "cards"
REPORT = CARDS / "portraits.md"
OVERRIDES = CARDS / "portraits" / "overrides.yaml"
ERA_ORDER = ["antiquity", "golden-age", "renaissance", "enlightenment", "steam-age", "machine-age", "space-age"]
USER_AGENT = os.environ.get("PORTRAIT_USER_AGENT", "card-portrait-finder/1.0 (python-urllib)")
WIKIPEDIA = "https://en.wikipedia.org/w/api.php"
WIKIDATA = "https://www.wikidata.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
# Photos of three-dimensional or official objects, where the photo or the object may carry rights.
CHECK_WORDS = ("bust", "statue", "sculpture", "relief", "coin", "stamp", "banknote", "medal", "monument")
STATUSES = ("ready", "credit", "check", "illustrate", "unmatched")
PACE = 0.5  # seconds between requests, to stay well inside Wikimedia's rate limits
# Thumbnail widths Wikimedia keeps rendered; downloads at other sizes, or of originals, get refused
# (https://w.wiki/GHai).
THUMB_STEPS = (250, 330, 500, 960)


def api(url: str, **params) -> dict:
    params.setdefault("format", "json")
    params.setdefault("maxlag", 5)
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers={"User-Agent": USER_AGENT})
    for attempt in range(7):
        time.sleep(PACE)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            if data.get("error", {}).get("code") == "maxlag":
                raise urllib.error.HTTPError(req.full_url, 503, "maxlag", {}, None)
            return data
        except OSError as e:
            if attempt == 6:
                raise
            retry = getattr(e, "headers", None) and e.headers.get("Retry-After")
            wait = int(retry) if retry and retry.isdigit() else 5 * 2 ** attempt
            print(f"  waiting {wait} s ({e})", file=sys.stderr)
            time.sleep(wait)
    raise AssertionError


def plain(value: str | None) -> str:
    """Commons metadata is HTML; keep the text."""
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value or "")).split())


@dataclass
class Result:
    card: dict
    era: str
    qid: str | None = None
    label: str | None = None  # the matched Wikidata item's English name
    status: str = "unmatched"
    file: str | None = None
    license: str | None = None
    author: str | None = None
    url: str | None = None
    thumb: str | None = None
    width: int | None = None  # the original's width in pixels
    local: Path | None = None  # an image supplied by the owner (overrides.yaml)
    notes: list[str] = field(default_factory=list)


# ── Wikidata ────────────────────────────────────────────────────────────────

def entities(qids: list[str]) -> dict:
    out = {}
    for i in range(0, len(qids), 50):
        out.update(api(WIKIDATA, action="wbgetentities", ids="|".join(qids[i:i + 50]), props="claims|labels", languages="en")["entities"])
    return out


def claim_values(entity: dict, prop: str) -> list:
    claims = entity.get("claims", {}).get(prop, [])
    claims = sorted(claims, key=lambda c: c.get("rank") != "preferred")
    return [c["mainsnak"]["datavalue"]["value"] for c in claims if c.get("rank") != "deprecated" and "datavalue" in c["mainsnak"]]


def birth_ok(entity: dict, card: dict) -> bool:
    """A human whose recorded birth year is close to the card's."""
    if not any(v.get("id") == "Q5" for v in claim_values(entity, "P31")):
        return False
    born = card.get("born")
    if born is None:
        return True  # flourished only: nothing to compare
    years = []
    for v in claim_values(entity, "P569"):
        t = v["time"]
        years.append((int(t[:t.index("-", 1)]), v.get("precision", 9)))
    if not years:
        return False  # can't confirm it's the same person; add the card's `wikidata` id by hand
    loose = "born" in (card.get("circa") or []) or born < 1000
    for year, precision in years:
        tolerance = 100 if precision < 9 else 30 if loose else 3
        if abs(year - born) <= tolerance:
            return True
    return False


def title_variants(name: str) -> list[str]:
    """'Ibn Sina (Avicenna)' → 'Ibn Sina (Avicenna)', 'Avicenna', 'Ibn Sina'."""
    out = [name]
    m = re.match(r"(.*?)\s*\((.*)\)\s*$", name)
    if m:
        out += [m.group(2), m.group(1)]
    return out


def wikipedia_qids(titles: list[str]) -> dict[str, str]:
    """English Wikipedia title → Wikidata id, following redirects, 50 titles a request."""
    out: dict[str, str] = {}
    titles = list(dict.fromkeys(titles))
    for i in range(0, len(titles), 50):
        batch = titles[i:i + 50]
        q = api(WIKIPEDIA, action="query", titles="|".join(batch), redirects=1, prop="pageprops", ppprop="wikibase_item")["query"]
        step = {n["from"]: n["to"] for n in q.get("normalized", [])}
        hop = {r["from"]: r["to"] for r in q.get("redirects", [])}
        final = {p["title"]: p.get("pageprops", {}).get("wikibase_item") for p in q["pages"].values()}
        for t in batch:
            u = step.get(t, t)
            u = hop.get(u, u)
            if final.get(u):
                out[t] = final[u]
    return out


def resolve(results: list[Result], cache: dict) -> None:
    """Set each result's qid: the card's own, else a verified Wikipedia or Wikidata-search match."""
    todo = [r for r in results if not r.card.get("wikidata")]
    for r in results:
        if r.card.get("wikidata"):
            r.qid = r.card["wikidata"]
    titles = wikipedia_qids([t for r in todo for t in title_variants(r.card["name"])])
    candidates = {id(r): [titles[t] for t in title_variants(r.card["name"]) if t in titles] for r in todo}
    cache.update(entities(sorted({q for qs in candidates.values() for q in qs} - cache.keys())))
    for r in todo:
        r.qid = next((q for q in candidates[id(r)] if q in cache and birth_ok(cache[q], r.card)), None)
    for r in (r for r in todo if not r.qid):  # fall back to a search, one card at a time
        hits = [h["id"] for t in title_variants(r.card["name"])[:2]
                for h in api(WIKIDATA, action="wbsearchentities", search=t, language="en", type="item", limit=5)["search"]]
        cache.update(entities(sorted(set(hits) - cache.keys())))
        r.qid = next((q for q in hits if q in cache and birth_ok(cache[q], r.card)), None)
    cache.update(entities(sorted({r.qid for r in results if r.qid} - cache.keys())))
    for r in results:
        if r.qid:
            r.label = cache[r.qid].get("labels", {}).get("en", {}).get("value")


# ── Commons ─────────────────────────────────────────────────────────────────

def license_kind(short: str, code: str) -> str | None:
    """public-domain, cc-by, cc-by-sa, attribution, or None for anything the spec doesn't allow."""
    s, c = short.lower(), code.lower()
    if c in ("pd", "cc0") or "public domain" in s or s.startswith("cc0") or c.startswith("cc-zero") or s == "no restrictions":
        return "public-domain"
    if s == "attribution":  # Commons' {{Attribution}}: free use with credit, like CC BY
        return "attribution"
    if re.search(r"\b(nc|nd)\b", s) or re.search(r"-(nc|nd)\b", c):
        return None
    if c.startswith("cc-by-sa") or s.startswith("cc by-sa"):
        return "cc-by-sa"
    if c.startswith("cc-by") or s.startswith("cc by"):
        return "cc-by"
    return None


def commons_files(filenames: list[str]) -> dict[str, dict]:
    """License, author, categories, width and a 960 px thumbnail for each file, 25 files a request."""
    out: dict[str, dict] = {}
    names = list(dict.fromkeys(filenames))
    for i in range(0, len(names), 25):
        batch = names[i:i + 25]
        params = dict(action="query", titles="|".join("File:" + f for f in batch), prop="imageinfo|categories",
                      iiprop="url|extmetadata|size", iiurlwidth=THUMB_STEPS[-1], cllimit="max")
        pages: dict[str, dict] = {}
        step: dict[str, str] = {}
        while True:  # categories can spill into continuation requests
            q = api(COMMONS, **params)
            step.update({n["from"]: n["to"] for n in q["query"].get("normalized", [])})
            for page in q["query"]["pages"].values():
                merged = pages.setdefault(page["title"], {"categories": []})
                merged["categories"] += page.get("categories", [])
                if "imageinfo" in page and "imageinfo" not in merged:  # continuations bring older versions
                    merged["imageinfo"] = page["imageinfo"]
            if "continue" not in q:
                break
            params.update(q["continue"])
        for f in batch:
            page = pages.get(step.get("File:" + f, "File:" + f))
            if not page or "imageinfo" not in page:
                continue
            info = page["imageinfo"][0]
            meta = {k: v.get("value") for k, v in info.get("extmetadata", {}).items()}
            out[f] = {
                "file": f,
                "url": info["descriptionurl"],
                "thumb": info.get("thumburl") or info["url"],
                "width": info.get("width"),
                "short": plain(meta.get("LicenseShortName")),
                "code": plain(meta.get("License")),
                "author": plain(meta.get("Artist")) or plain(meta.get("Credit")),
                "description": plain(meta.get("ImageDescription")),
                "categories": [c["title"].removeprefix("Category:") for c in page["categories"]],
            }
    return out


def judge(result: Result, info: dict | None) -> bool:
    """Sort a result by one candidate image. False if the image can't be used (try the next one)."""
    if info is None:
        result.notes.append("image missing on Commons")
        return False
    kind = license_kind(info["short"], info["code"])
    if kind is None:
        result.notes.append(f"{info['file']}: {info['short'] or 'unknown license'}")
        return False
    result.notes = []
    result.file, result.url, result.thumb, result.width = info["file"], info["url"], info["thumb"], info["width"]
    result.license, result.author = info["short"] or kind, info["author"]
    text = " ".join([info["file"], info["description"], *info["categories"]]).lower()
    hits = sorted({w for w in CHECK_WORDS if re.search(rf"\b{w}s?\b", text)})
    if hits:
        result.notes.append("photo of a " + "/".join(hits) + ": confirm the photo's own license")
    if kind == "attribution":
        result.notes.append("Commons 'Attribution' license: free with credit, like CC BY; confirm the author")
    pd = [c for c in info["categories"] if "PD" in c or "ublic domain" in c]
    us_government = any(re.search(r"NASA|USGov|US ?Government|United States government|"
                                  r"PD US (FWS|Navy|Army|Air Force|Marines|Military|NIH|NOAA|DOE|NPS|Congress|LoC)", c)
                        for c in pd)
    if kind == "public-domain" and (result.card.get("work") or 0) > 1925 and not us_government:
        result.notes.append("public domain claimed for a recent photo: confirm" + (f" ({'; '.join(pd[:3])})" if pd else ""))
    result.status = "check" if result.notes else "credit" if kind.startswith("cc-by") else "ready"
    return True


def load_overrides() -> dict:
    data = yaml.safe_load(OVERRIDES.read_text()) if OVERRIDES.exists() else {}
    return {k: data.get(k) or {} for k in ("commons", "local", "checked", "focus", "reject")}


def find_images(results: list[Result], cache: dict) -> None:
    """Try each matched card's Wikidata images in order, a batch of first choices, then second, then third.

    overrides.yaml can name a different Commons file, supply a local image, or confirm a check.
    """
    over = load_overrides()
    queue = {}
    for r in results:
        cid = r.card["id"]
        if cid in over["local"]:
            entry = over["local"][cid]
            r.local = OVERRIDES.parent / "source" / entry["file"]
            r.file, r.url, r.author, r.license = entry["file"], entry["source"], entry["author"], entry["license"]
            kind = license_kind(entry["license"], "")
            r.status = "ready" if kind == "public-domain" else "credit" if kind else "illustrate"
            r.notes = ["supplied by the owner"]
        elif r.qid:
            queue[id(r)] = [over["commons"][cid]] if cid in over["commons"] else claim_values(cache[r.qid], "P18")[:3]
            if cid in over["commons"]:
                r.notes.append("image chosen by the owner")
    for r in results:
        if id(r) in queue:
            r.status = "illustrate"
            if not queue[id(r)]:
                r.notes.append("no image on Wikidata")
    for round_ in range(3):
        pending = [r for r in results if id(r) in queue and r.status == "illustrate" and len(queue[id(r)]) > round_]
        if not pending:
            break
        infos = commons_files([queue[id(r)][round_] for r in pending])
        for r in pending:
            chosen = "image chosen by the owner" in r.notes
            judge(r, infos.get(queue[id(r)][round_]))
            if chosen and "image chosen by the owner" not in r.notes:
                r.notes.insert(0, "image chosen by the owner")
    for r in results:  # images that aren't portraits
        if r.card["id"] in over["reject"]:
            r.status, r.notes = "illustrate", [f"not a portrait: {over['reject'][r.card['id']]}"]
    for r in results:  # checks the owner has already done, for this exact file
        if r.status == "check" and over["checked"].get(r.card["id"]) == r.file:
            r.status = "credit" if license_kind(r.license or "", "") != "public-domain" else "ready"
            r.notes = ["checked by the owner (" + "; ".join(r.notes) + ")"]


def standard_thumbs(results: list[Result]) -> None:
    """Point each result's thumb at the largest standard width below its original's width.

    The first lookup asks for 960 px; a narrower original comes back unscaled, and Wikimedia
    refuses bulk downloads of originals, so those are asked again at a smaller standard width.
    """
    groups: dict[int, list[Result]] = {}
    for r in results:
        if r.local or not r.width or r.width > THUMB_STEPS[-1]:
            continue
        smaller = [w for w in THUMB_STEPS if w <= r.width]
        if smaller:
            groups.setdefault(smaller[-1], []).append(r)
    for step, rs in groups.items():
        for i in range(0, len(rs), 25):
            batch = rs[i:i + 25]
            pages = api(COMMONS, action="query", titles="|".join("File:" + r.file for r in batch),
                        prop="imageinfo", iiprop="url", iiurlwidth=step)["query"]
            step_map = {n["from"]: n["to"] for n in pages.get("normalized", [])}
            by_title = {p["title"]: p for p in pages["pages"].values()}
            for r in batch:
                page = by_title.get(step_map.get("File:" + r.file, "File:" + r.file), {})
                if page.get("imageinfo"):
                    r.thumb = page["imageinfo"][0].get("thumburl") or r.thumb


# ── Output ──────────────────────────────────────────────────────────────────

def write_ids(results: list[Result]) -> int:
    """Add `wikidata: Q…` after each matched card's name line, keeping the file's formatting."""
    changed = 0
    by_era: dict[str, dict[str, str]] = {}
    for r in results:
        if r.qid and not r.card.get("wikidata"):
            by_era.setdefault(r.era, {})[r.card["id"]] = r.qid
    for era, ids in by_era.items():
        path = CARDS / f"{era}.yaml"
        lines = path.read_text().split("\n")
        current = None
        for i, line in enumerate(lines):
            m = re.match(r"  - id: (\S+)", line)
            if m:
                current = m.group(1)
            elif current in ids and line.startswith("    name: "):
                lines[i] = line + f"\n    wikidata: {ids.pop(current)}"
                changed += 1
        path.write_text("\n".join(lines))
    return changed


def download(results: list[Result], out: Path) -> int:
    n = 0
    for r in results:
        if r.status in ("ready", "credit", "check") and r.thumb and not r.local:
            ext = Path(urllib.parse.urlparse(r.thumb).path).suffix.lower() or ".jpg"
            dest = out / r.era / f"{r.card['id']}{ext}"
            dest.parent.mkdir(parents=True, exist_ok=True)
            req = urllib.request.Request(r.thumb, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                dest.write_bytes(resp.read())
            n += 1
            time.sleep(PACE)
    return n


def cell(text: str | None, limit: int = 80) -> str:
    text = (text or "").replace("|", "/")
    return text if len(text) <= limit else text[: limit - 1] + "…"


def report(results: list[Result]) -> str:
    label = {"ready": "Ready", "credit": "Credit", "check": "Check", "illustrate": "Illustrate", "unmatched": "Unmatched"}
    out = [
        "# Card portraits",
        "",
        "Generated by `scripts/find_portraits.py` from Wikidata and Wikimedia Commons. Don't edit by hand.",
        "",
        "- **Ready:** public domain or CC0.",
        "- **Credit:** CC BY or CC BY-SA. Usable, with the author and license shown on the card (§13.7).",
        "- **Check:** a usable license that a person should confirm (see the note).",
        "- **Illustrate:** no usable image. Needs an original illustration.",
        "- **Unmatched:** no Wikidata match. Add the card's `wikidata` id and run the script again.",
        "",
        "| Era | " + " | ".join(label[s] for s in STATUSES) + " | Cards |",
        "|---|" + "---|" * (len(STATUSES) + 1),
    ]
    totals = {s: 0 for s in STATUSES}
    for era in ERA_ORDER:
        rs = [r for r in results if r.era == era]
        counts = {s: sum(r.status == s for r in rs) for s in STATUSES}
        for s in STATUSES:
            totals[s] += counts[s]
        out.append(f"| {era} | " + " | ".join(str(counts[s]) for s in STATUSES) + f" | {len(rs)} |")
    out.append("| **All** | " + " | ".join(f"**{totals[s]}**" for s in STATUSES) + f" | **{len(results)}** |")
    for era in ERA_ORDER:
        rs = [r for r in results if r.era == era]
        out += ["", f"## {era}", "", "| Card | Status | License | Author | Image | Notes |", "|---|---|---|---|---|---|"]
        for r in sorted(rs, key=lambda r: (STATUSES.index(r.status), r.card["name"])):
            seen_as = r.label if r.label and r.label != r.card["name"] else ""
            who = r.card["name"] + (f" ([{seen_as or r.qid}](https://www.wikidata.org/wiki/{r.qid}))" if r.qid else "")
            image = f"[{cell(r.file, 50)}]({r.url})" if r.url else ""
            out.append(f"| {who} | {label[r.status]} | {cell(r.license, 30)} | {cell(r.author, 60)} | {image} | {cell('; '.join(r.notes), 160)} |")
    return "\n".join(out) + "\n"


def collect(only: set[str] | None = None) -> list[Result]:
    """Every card (or just `only`), matched on Wikidata and sorted by its portrait's license."""
    results: list[Result] = []
    for era in ERA_ORDER:
        for card in yaml.safe_load((CARDS / f"{era}.yaml").read_text())["cards"]:
            if only is None or card["id"] in only:
                results.append(Result(card, era))
    cache: dict = {}
    print(f"Matching {len(results)} cards on Wikidata…", file=sys.stderr)
    resolve(results, cache)
    print("Reading portrait licenses on Commons…", file=sys.stderr)
    find_images(results, cache)
    return results


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", help="comma-separated card ids")
    ap.add_argument("--write-ids", action="store_true", help="save each match as `wikidata:` in the card YAML")
    ap.add_argument("--download", type=Path, metavar="DIR", help="save usable images in DIR/<era>/<id>.<ext>")
    args = ap.parse_args(argv)
    only = set(args.only.split(",")) if args.only else None

    results = collect(only)
    for r in results:
        if only is not None:
            print(f"{r.card['id']}: {r.status}" + (f" ({r.license})" if r.license else "") + (f" — {'; '.join(r.notes)}" if r.notes else ""), file=sys.stderr)

    if args.write_ids:
        print(f"Saved {write_ids(results)} Wikidata ids", file=sys.stderr)
    if args.download:
        standard_thumbs(results)
        print(f"Downloaded {download(results, args.download)} images to {args.download}", file=sys.stderr)
    if only is None:
        REPORT.write_text(report(results))
        print(f"Wrote {REPORT.relative_to(ROOT)}", file=sys.stderr)
    counts = {s: sum(r.status == s for r in results) for s in STATUSES}
    print(", ".join(f"{n} {s}" for s, n in counts.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
