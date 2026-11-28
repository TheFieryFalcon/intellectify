#!/usr/bin/env python3
"""Turn each card's chosen portrait into the ink-wash WebP the cards show (docs/SPEC.md §13.11).

Takes the choices scripts/find_portraits.py makes (with content/cards/portraits/overrides.yaml),
for every card whose portrait is ready or credited. Cards still waiting on a check are skipped.

For each card it:
  1. downloads the image (a Commons thumbnail at a standard width, 960 px or the largest below the
     original's, cached in .cache/portraits/), or takes the owner's image from
     content/cards/portraits/source/;
  2. finds the face (OpenCV's face detectors, or a `focus` set by hand in overrides.yaml) and frames
     every card the same way: the face at a fixed size and eye line, the image always filling the
     card, inside an oval that fades into the paper;
  3. styles it as an ink wash: contrast evened out, four flat bands of ink on the paper tone, and
     inked edges, so a set looks coherent whatever the source;
  4. saves content/cards/portraits/<id>.webp (480 × 600) and writes the card's `portrait` field
     (file, source, author, license).

Faces it can't find are framed by a guess and listed at the end: set their `focus` by hand.

Needs OpenCV 4 (`pip install opencv-python-headless==4.10.0.84`; OpenCV 5 dropped the classic face
detectors).

Usage:
    python3 scripts/process_portraits.py                   # every card
    python3 scripts/process_portraits.py --only euler      # just these cards
    python3 scripts/process_portraits.py --offline         # reuse the last run's choices: no Wikimedia
    python3 scripts/process_portraits.py --sheet FILE.png  # also save a contact sheet to review
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
from dataclasses import asdict
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).parent))
import find_portraits as fp  # noqa: E402

INK = np.array([0x1C, 0x23, 0x30], float)    # the site's --ink
PAPER = np.array([0xF4, 0xEF, 0xE4], float)  # warm off-white paper (§16.1); retune once the --paper token exists
W, H = 480, 600                              # 4:5
FACE_W = 0.36 * W                            # width of the face box on the card
FACE_C = (0.50 * W, 0.40 * H)                # where the face's center sits
GUESS = (0.50, 0.30, 0.35)                   # face (center x, center y, width) as fractions, when none is found
INK_BANDS = (0.0, 0.3, 0.55, 0.8, 1.0)       # ink per tone band, light to dark
BAND_EDGES = (0.18, 0.38, 0.58, 0.78)        # darkness where each band starts
LINE_ART_PAPER = 0.55                        # share of near-white pixels that marks a drawing
QUALITY = 82
CACHE = fp.ROOT / ".cache" / "portraits"
MANIFEST = CACHE / "manifest.json"
OUT = fp.CARDS / "portraits"
CASCADES = ("haarcascade_frontalface_alt2.xml", "haarcascade_frontalface_default.xml", "haarcascade_profileface.xml")


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


def grayscale(img: Image.Image) -> np.ndarray:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        img = Image.alpha_composite(Image.new("RGBA", img.size, (255, 255, 255, 255)), img)
    return np.asarray(img.convert("L"))


def detect_face(gray: np.ndarray) -> tuple[float, float, float] | None:
    """(center x, center y, width) in pixels of the largest face found, frontal first, then profile."""
    h, w = gray.shape
    scale = min(1.0, 800 / max(h, w))
    small = cv2.equalizeHist(cv2.resize(gray, (round(w * scale), round(h * scale))) if scale < 1 else gray)
    side = max(24, int(min(small.shape) * 0.08))
    for name in CASCADES:
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + name)
        for flip in ((False, True) if "profile" in name else (False,)):
            img = cv2.flip(small, 1) if flip else small
            boxes = cascade.detectMultiScale(img, scaleFactor=1.08, minNeighbors=5, minSize=(side, side))
            if len(boxes):
                x, y, bw, bh = max(boxes, key=lambda b: b[2] * b[3])
                if flip:
                    x = img.shape[1] - x - bw
                return ((x + bw / 2) / scale, (y + bh / 2) / scale, bw / scale)
    return None


def frame(gray: np.ndarray, face: tuple[float, float, float]) -> tuple[np.ndarray, float]:
    """Put the face at FACE_W and FACE_C, but always fill the card: no source edge inside the frame.

    Returns the framed image and how much the source was enlarged.
    """
    cx, cy, size = face
    h, w = gray.shape
    k = max(FACE_W / size, W / w, H / h)
    x0 = min(max(cx - FACE_C[0] / k, 0), w - W / k)
    y0 = min(max(cy - FACE_C[1] / k, 0), h - H / k)
    m = np.array([[k, 0, -x0 * k], [0, k, -y0 * k]])
    return cv2.warpAffine(gray, m, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), k


def oval() -> np.ndarray:
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.hypot((xx - W / 2) / (0.47 * W), (yy - 0.46 * H) / (0.50 * H))
    return np.clip((1.0 - d) / 0.12, 0, 1)


def ink_wash(gray: np.ndarray, enlarged: float) -> Image.Image:
    lo, hi = np.percentile(gray, (1, 99))
    g = np.clip((gray.astype(float) - lo) / max(hi - lo, 1) * 255, 0, 255).astype(np.uint8)
    if enlarged > 1.2:  # smooth away the blockiness of an enlarged small source before banding
        g = cv2.GaussianBlur(g, (0, 0), 0.45 * enlarged)
    if (g > 190).mean() > LINE_ART_PAPER:
        ink = line_art(g)
    else:
        g = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 5)).apply(g)
        g = cv2.bilateralFilter(g, 7, 40, 7)
        ink = np.array(INK_BANDS)[np.digitize(1 - g / 255.0, BAND_EDGES)]
        edges = cv2.GaussianBlur(cv2.Canny(g, 60, 140).astype(float) / 255, (0, 0), 0.6)
        ink = np.maximum(ink, edges * 0.9)
    ink = ink * oval()
    rgb = PAPER * (1 - ink[..., None]) + INK * ink[..., None]
    return Image.fromarray(rgb.round().astype(np.uint8))


def line_art(g: np.ndarray) -> np.ndarray:
    """Ink for a drawing that is mostly bare paper: a clean ground, smooth solid lines, one light shade.

    Banding a sketch the photo way turns its paper grain into blotches, so here light tones become
    paper, dark strokes become solid ink with soft edges, and only mid-dark shading keeps a tint.
    """
    d = 1 - cv2.GaussianBlur(g, (0, 0), 0.8).astype(float) / 255
    lines = np.clip((d - 0.42) / 0.12, 0, 1)            # strokes: solid ink, antialiased
    shade = np.clip((d - 0.22) / 0.08, 0, 1) * 0.35     # shading: a single light tint
    return np.maximum(lines, shade)


def render(r: fp.Result, img: Image.Image, focus: dict) -> tuple[Image.Image, bool]:
    """The card's portrait, and whether its face position was only guessed."""
    gray = grayscale(img)
    h, w = gray.shape
    guessed = False
    if r.card["id"] in focus:
        fx, fy, fs = focus[r.card["id"]]
        face = (fx * w, fy * h, fs * w)
    else:
        face = detect_face(gray)
        if face is None:
            guessed = True
            face = (GUESS[0] * w, GUESS[1] * h, GUESS[2] * w)
    framed, enlarged = frame(gray, face)
    return ink_wash(framed, enlarged), guessed


def contact_sheet(ids: list[str], path: Path) -> None:
    cols, tw, th = 10, 144, 180
    rows = -(-len(ids) // cols)
    sheet = Image.new("RGB", (cols * (tw + 6) + 6, rows * (th + 22) + 6), tuple(int(v) for v in PAPER))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(sheet)
    for i, cid in enumerate(ids):
        x, y = 6 + (i % cols) * (tw + 6), 6 + (i // cols) * (th + 22)
        sheet.paste(Image.open(OUT / f"{cid}.webp").resize((tw, th), Image.LANCZOS), (x, y))
        draw.text((x, y + th + 4), cid[:22], fill=tuple(int(v) for v in INK))
    sheet.save(path)


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


def write_fields(done: list[fp.Result], cleared: list[fp.Result] = ()) -> None:
    """Replace each card's `portrait` field with its new block, or with null for `cleared` cards."""
    by_era: dict[str, dict[str, str]] = {}
    for r in done:
        by_era.setdefault(r.era, {})[r.card["id"]] = portrait_block(r)
    for r in cleared:
        by_era.setdefault(r.era, {})[r.card["id"]] = "    portrait: null\n"
    for era, blocks in by_era.items():
        path = fp.CARDS / f"{era}.yaml"
        text = path.read_text()
        for cid, block in blocks.items():
            pattern = re.compile(rf"(  - id: {re.escape(cid)}\n(?:    .*\n|\n(?=    ))*?)    portrait:(?: null\n|\n(?:      .*\n)+)")
            text, n = pattern.subn(lambda m: m.group(1) + block, text, count=1)
            if n != 1:
                raise SystemExit(f"{era}.yaml: couldn't find the portrait field of {cid}")
        path.write_text(text)


def load_results(args) -> list[fp.Result]:
    only = set(args.only.split(",")) if args.only else None
    if args.offline:
        rows = json.loads(MANIFEST.read_text())
        results = []
        for row in rows:
            if only is None or row["card"]["id"] in only:
                row["local"] = Path(row["local"]) if row["local"] else None
                results.append(fp.Result(**row))
        return results
    results = fp.collect(only)
    fp.standard_thumbs(results)
    if only is None:
        CACHE.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps([{**asdict(r), "local": str(r.local) if r.local else None} for r in results],
                                       ensure_ascii=False, indent=1))
    return results


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", help="comma-separated card ids")
    ap.add_argument("--offline", action="store_true", help="reuse the last full run's choices instead of asking Wikimedia")
    ap.add_argument("--sheet", type=Path, metavar="FILE", help="also save a contact sheet of the portraits")
    ap.add_argument("--refetch", action="store_true", help="download again even if cached")
    args = ap.parse_args(argv)
    results = load_results(args)
    over = fp.load_overrides()
    focus = over["focus"]
    for r in results:  # apply rejections in offline runs too
        if r.card["id"] in over["reject"]:
            r.status = "illustrate"

    OUT.mkdir(parents=True, exist_ok=True)
    done, skipped, low_res, guessed, cleared = [], [], [], [], []
    for i, r in enumerate(results, 1):
        if r.status not in ("ready", "credit"):
            skipped.append(f"{r.card['id']} ({r.status})")
            cleared.append(r)
            (OUT / f"{r.card['id']}.webp").unlink(missing_ok=True)
            continue
        source = fetch(r, args.refetch)
        if source.width < W * 0.6:
            low_res.append(f"{r.card['id']} ({source.width} px)")
        image, was_guessed = render(r, source, focus)
        if was_guessed:
            guessed.append(r.card["id"])
        image.save(OUT / f"{r.card['id']}.webp", "WEBP", quality=QUALITY, method=6)
        done.append(r)
        print(f"[{i}/{len(results)}] {r.card['id']}", file=sys.stderr, flush=True)
    write_fields(done, cleared)
    if args.sheet:
        contact_sheet([r.card["id"] for r in done], args.sheet)
    size = sum((OUT / f"{r.card['id']}.webp").stat().st_size for r in done)
    print(f"{len(done)} portraits written ({size / 1e6:.1f} MB)" + (f"; skipped {', '.join(skipped)}" if skipped else ""))
    if guessed:
        print("No face found, framed by a guess (set `focus` in overrides.yaml): " + ", ".join(guessed))
    if low_res:
        print("Low-resolution sources, worth replacing: " + ", ".join(low_res))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
