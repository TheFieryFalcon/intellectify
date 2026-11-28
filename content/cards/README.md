# Cards (docs/SPEC.md §13.7)

One file per era set. Check them with `python3 scripts/verify_cards.py`.

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
    portrait: null        # { file, source, license } once processed (§13.11)
    related: [spec.integration.volumes]   # skill ids (optional)
    blurb: >-
      At most two sentences on what they did and why it mattered.
```

Rarities are the owner's judgment (§13.7). The lists here are a first draft.
