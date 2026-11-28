#!/usr/bin/env python3
"""Turn each card's chosen portrait into the ink duotone WebP the cards show (docs/SPEC.md §13.11).

Takes the choices scripts/find_portraits.py makes (with content/cards/portraits/overrides.yaml),
for every card whose portrait is ready or credited. Cards still waiting on a check are skipped.

For each card it:
  1. downloads the image (a Commons thumbnail at a standard width, 960 px or the largest below the
     original's, cached in .cache/portraits/), or takes the
     owner's image from content/cards/portraits/source/;
  2. crops it to the card's 4:5 portrait window, a little above center, where faces usually are;
  3. maps its tones onto one ink on the paper tone, so a set looks coherent whatever the source;
  4. saves content/cards/portraits/<id>.webp and writes the card's `portrait` field (file, source,
     author, license).

Usage:
    python3 scripts/process_portraits.py                   # every card
    python3 scripts/process_portraits.py --only euler      # just these cards
    python3 scripts/process_portraits.py --refetch         # ignore the download cache
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).parent))
import find_portraits as fp  # noqa: E402

INK = (0x1C, 0x23, 0x30)    # the site's --ink
PAPER = (0xF4, 0xEF, 0xE4)  # warm off-white paper (§16.1); retune once the --paper token exists
SIZE = (480, 600)           # 4:5
TOP_BIAS = 0.15             # share of a tall image's spare height cut from the top
QUALITY = 80
CACHE = fp.ROOT / ".cache" / "portraits"
OUT = fp.CARDS / "portraits"


def fetch(r: fp.Result, refetch: bool) -> Image.Image:
    if r.local:
        return Image.open(r.local)
    key = hashlib.sha1(r.file.encode()).hexdigest()[:10]
    path = CACHE / f"{r.card['id']}-{key}"
    if refetch or not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(r.thumb, headers={"User-Agent": fp.USER_AGENT})
        for attempt in range(6):
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    path.write_bytes(resp.read())
                break
            except OSError as e:
                if attempt == 5:
                    raise
                retry = getattr(e, "headers", None) and e.headers.get("Retry-After")
                wait = int(retry) if retry and retry.isdigit() else 5 * 2 ** attempt
                print(f"  {r.card['id']}: waiting {wait} s for Wikimedia ({e})", file=sys.stderr, flush=True)
                time.sleep(wait)
        time.sleep(fp.PACE)
    return Image.open(BytesIO(path.read_bytes()))


def duotone(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        white = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(white, img)
    gray = img.convert("L")
    w, h = gray.size
    ratio = SIZE[0] / SIZE[1]
    if w / h > ratio:  # too wide: keep the middle
        new_w = round(h * ratio)
        left = (w - new_w) // 2
        gray = gray.crop((left, 0, left + new_w, h))
    else:  # too tall: keep the upper part, where the face is
        new_h = round(w / ratio)
        top = round((h - new_h) * TOP_BIAS)
        gray = gray.crop((0, top, w, top + new_h))
    gray = ImageOps.autocontrast(gray.resize(SIZE, Image.LANCZOS), cutoff=1)
    channels = [gray.point([round(INK[c] + (PAPER[c] - INK[c]) * v / 255) for v in range(256)]) for c in range(3)]
    return Image.merge("RGB", channels)


def portrait_block(r: fp.Result) -> str:
    def q(text: str) -> str:
        return json.dumps(text, ensure_ascii=False)
    author = r.author or "Unknown"
    if len(author) > 200:
        author = author[:199] + "…"
    return ("    portrait:\n"
            f"      file: portraits/{r.card['id']}.webp\n"
            f"      source: {q(r.url)}\n"
            f"      author: {q(author)}\n"
            f"      license: {q(r.license)}\n")


def write_fields(done: list[fp.Result]) -> None:
    """Replace each card's `portrait: null` (or an earlier portrait block) with its new one."""
    by_era: dict[str, dict[str, str]] = {}
    for r in done:
        by_era.setdefault(r.era, {})[r.card["id"]] = portrait_block(r)
    for era, blocks in by_era.items():
        path = fp.CARDS / f"{era}.yaml"
        text = path.read_text()
        for cid, block in blocks.items():
            pattern = re.compile(rf"(  - id: {re.escape(cid)}\n(?:    .*\n|\n(?=    ))*?)    portrait:(?: null\n|\n(?:      .*\n)+)")
            text, n = pattern.subn(lambda m: m.group(1) + block, text, count=1)
            if n != 1:
                raise SystemExit(f"{era}.yaml: couldn't find the portrait field of {cid}")
        path.write_text(text)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", help="comma-separated card ids")
    ap.add_argument("--refetch", action="store_true", help="download again even if cached")
    args = ap.parse_args(argv)
    results = fp.collect(set(args.only.split(",")) if args.only else None)
    fp.standard_thumbs(results)

    OUT.mkdir(parents=True, exist_ok=True)
    done, skipped, low_res = [], [], []
    for i, r in enumerate(results, 1):
        if r.status not in ("ready", "credit"):
            skipped.append(f"{r.card['id']} ({r.status})")
            continue
        source = fetch(r, args.refetch)
        if source.width < SIZE[0] * 0.6:
            low_res.append(f"{r.card['id']} ({source.width} px)")
        duotone(source).save(OUT / f"{r.card['id']}.webp", "WEBP", quality=QUALITY, method=6)
        done.append(r)
        print(f"[{i}/{len(results)}] {r.card['id']}", file=sys.stderr, flush=True)
    write_fields(done)
    size = sum((OUT / f"{r.card['id']}.webp").stat().st_size for r in done)
    print(f"{len(done)} portraits written ({size / 1e6:.1f} MB)" + (f"; skipped {', '.join(skipped)}" if skipped else ""))
    if low_res:
        print("Low-resolution sources, worth replacing: " + ", ".join(low_res))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
