#!/usr/bin/env python3
"""Show other portraits a card could use, from the person's Wikimedia Commons category.

Wikidata names one image per person, and it isn't always a usable portrait (a statue far away, a
manuscript scene, a faint drawing). This lists the other images in the person's Commons category
(Wikidata P373, plus its subcategories with "portrait" in their name), keeps those with a license
the spec allows and a usable size, and looks for a face in a preview of each. Images with a face
come first, ranked by how many pixels the face has in the original (a sharp, large face is best);
the sheet shows the face box, each image's width, license and status (ready, credit, or check: see
find_portraits.py).

To use one, put its file name under `commons:` in content/cards/portraits/overrides.yaml.

Usage:
    python3 scripts/portrait_candidates.py boole,derrida            # sheets in .cache/portraits/candidates/
    python3 scripts/portrait_candidates.py boole --max 16 --min-width 400
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from io import BytesIO
from pathlib import Path

import numpy as np
import yaml
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import find_portraits as fp  # noqa: E402
import process_portraits as pp  # noqa: E402

OUT = fp.ROOT / ".cache" / "portraits" / "candidates"
IMAGE_TYPES = {"image/jpeg", "image/png", "image/tiff", "image/webp"}
PREVIEW = 250  # a standard Wikimedia thumbnail width


def cards_by_id() -> dict[str, tuple[str, dict]]:
    out = {}
    for era in fp.ERA_ORDER:
        for card in yaml.safe_load((fp.CARDS / f"{era}.yaml").read_text())["cards"]:
            out[card["id"]] = (era, card)
    return out


def category_files(category: str) -> list[str]:
    """Files in a Commons category and its portrait subcategories (one level down)."""
    files, cats = [], ["Category:" + category]
    subs = fp.api(fp.COMMONS, action="query", list="categorymembers", cmtitle=cats[0], cmtype="subcat", cmlimit=100)
    cats += [m["title"] for m in subs["query"]["categorymembers"] if "portrait" in m["title"].lower()]
    for cat in cats:
        q = fp.api(fp.COMMONS, action="query", list="categorymembers", cmtitle=cat, cmtype="file", cmlimit=200)
        files += [m["title"].removeprefix("File:") for m in q["query"]["categorymembers"]]
    return list(dict.fromkeys(files))


def candidates(card: dict, era: str, qid: str, max_n: int, min_width: int, scan: int) -> list[dict]:
    """Licensed images of a usable size, those with a face first, best face first."""
    entity = fp.entities([qid])[qid]
    names = fp.claim_values(entity, "P18")
    for cat in fp.claim_values(entity, "P373")[:1]:
        names += category_files(cat)
    names = [n for n in dict.fromkeys(names) if not n.lower().endswith((".svg", ".pdf", ".djvu", ".ogg", ".webm", ".gif"))]
    infos = fp.commons_files(names[:scan])
    usable = []
    for name in names[:scan]:
        info = infos.get(name)
        if not info or not info.get("width") or info["width"] < min_width:
            continue
        r = fp.Result(card, era, qid=qid)
        if fp.judge(r, info):
            usable.append({"file": name, "width": info["width"], "license": r.license, "status": r.status,
                           "notes": r.notes})
    previews = preview_urls([c["file"] for c in usable])
    for c in usable:
        url = previews.get(c["file"])
        im = fetch(url) if url else None
        c["preview"] = im
        face = pp.detect_face(np.asarray(im.convert("L"))) if im else None
        c["face"] = face
        c["face_px"] = round(face[2] / im.width * c["width"]) if face else 0
    usable.sort(key=lambda c: -c["face_px"])
    return usable[:max_n]


def preview_urls(names: list[str]) -> dict[str, str]:
    """250 px thumbnail URLs, 25 files a request."""
    out = {}
    for i in range(0, len(names), 25):
        batch = names[i:i + 25]
        q = fp.api(fp.COMMONS, action="query", titles="|".join("File:" + n for n in batch), prop="imageinfo",
                   iiprop="url", iiurlwidth=PREVIEW)["query"]
        step = {n["from"]: n["to"] for n in q.get("normalized", [])}
        by_title = {p["title"]: p for p in q["pages"].values()}
        for n in batch:
            page = by_title.get(step.get("File:" + n, "File:" + n), {})
            if page.get("imageinfo"):
                out[n] = page["imageinfo"][0].get("thumburl")
    return out


def fetch(url: str) -> Image.Image | None:
    req = urllib.request.Request(url, headers={"User-Agent": fp.USER_AGENT})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return Image.open(BytesIO(resp.read())).convert("RGB")
        except OSError as e:
            retry = getattr(e, "headers", None) and e.headers.get("Retry-After")
            time.sleep(int(retry) if retry and retry.isdigit() else 5 * 2 ** attempt)
        finally:
            time.sleep(fp.PACE)
    return None


def sheet(cid: str, cands: list[dict], path: Path) -> None:
    cols, tw, th = 6, 200, 250
    rows = max(1, -(-len(cands) // cols))
    img = Image.new("RGB", (cols * (tw + 8) + 8, rows * (th + 40) + 30), "white")
    d = ImageDraw.Draw(img)
    d.text((8, 8), f"{cid}: {len(cands)} candidates", fill=(0, 0, 0))
    for i, c in enumerate(cands):
        x, y = 8 + (i % cols) * (tw + 8), 30 + (i // cols) * (th + 40)
        im = c["preview"]
        if im:
            im = im.copy()
            if c["face"]:
                fx, fy, fs = c["face"]
                ImageDraw.Draw(im).rectangle([fx - fs / 2, fy - fs / 2, fx + fs / 2, fy + fs / 2], outline=(255, 0, 0), width=2)
            im.thumbnail((tw, th))
            img.paste(im, (x, y))
        label = f"#{i} {c['width']}px {c['status']}" + (f" face {c['face_px']}px" if c["face_px"] else " no face")
        d.text((x, y + th + 2), label, fill=(200, 0, 0) if c["status"] == "check" else (0, 0, 160))
        d.text((x, y + th + 16), c["license"][:30], fill=(80, 80, 80))
    img.save(path)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("ids", help="comma-separated card ids")
    ap.add_argument("--max", type=int, default=12, help="candidates per card (default 12)")
    ap.add_argument("--min-width", type=int, default=300, help="skip images narrower than this (default 300)")
    ap.add_argument("--scan", type=int, default=60, help="images to look at per person (default 60)")
    args = ap.parse_args(argv)
    cards = cards_by_id()
    OUT.mkdir(parents=True, exist_ok=True)
    for cid in args.ids.split(","):
        era, card = cards[cid]
        if not card.get("wikidata"):
            print(f"{cid}: no wikidata id", file=sys.stderr)
            continue
        cands = candidates(card, era, card["wikidata"], args.max, args.min_width, args.scan)
        (OUT / f"{cid}.json").write_text(json.dumps([{k: v for k, v in c.items() if k != "preview"} for c in cands],
                                                    ensure_ascii=False, indent=1))
        sheet(cid, cands, OUT / f"{cid}.png")
        print(f"{cid}: {len(cands)} candidates → {(OUT / f'{cid}.png').relative_to(fp.ROOT)}", file=sys.stderr, flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
