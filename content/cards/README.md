# Cards (docs/SPEC.md §13.7)

One file per era set. Check them with `python3 scripts/verify_cards.py`.

Portraits: `python3 scripts/find_portraits.py` looks each card up on Wikidata and Wikimedia Commons and
writes `portraits.md`, sorting cards into ready (public domain), credit (CC BY or CC BY-SA), check
and illustrate. Allowed licenses: `Public domain`, `CC0`, `CC BY 4.0` (any version), `CC BY-SA 4.0`
(any version), `No restrictions` and `Attribution` (Commons' own tags), or `Original illustration`.
Owner decisions (another Commons file, a supplied image, checks done) go in
`portraits/overrides.yaml`, along with face positions the detector misses (`focus`). Then
`python3 scripts/process_portraits.py` makes the ink-wash WebPs in `portraits/` and fills in each
card's `portrait` field (`--offline` reuses the last run's choices; `--sheet FILE.png` saves a
contact sheet). It needs OpenCV 4: `pip install opencv-python-headless==4.10.0.84`.

```yaml
era: antiquity            # must match the file name
cards:
  - id: archimedes        # unique across all eras
    name: Archimedes
    born: -287            # year; negative is BC
    died: -212            # leave out for someone living
    circa: [born, died]   # which dates are approximate (optional)
    flourished: -300      # instead of born/died when neither is known
    work: -250            # year of their major work: it picks the era
    fields: [Mathematics, Physics, Engineering]
    rarity: diamond       # diamond, platinum, gold or silver
    wikidata: Q8739       # optional; scripts/find_portraits.py --write-ids fills it in
    portrait: null        # { file, source, author, license } once processed (§13.11)
    related: [spec.integration.volumes]   # skill ids (optional)
    blurb: >-
      At most two sentences on what they did and why it mattered.
```

Rarities are the owner's judgment (§13.7). The lists here are a first draft.
