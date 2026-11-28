import { describe, expect, it } from "vitest";
import {
  axiomsReached,
  balanceOf,
  buyCheapest,
  buyInstitute,
  buyQuote,
  buyTheorem,
  emptyEconomy,
  eraUnlocked,
  freePackEra,
  geometricPerLevel,
  harmonic,
  lemmaAward,
  lemmasLong,
  lemmasShort,
  maxAffordable,
  mergeEconomy,
  nextAxiom,
  nextSlotAt,
  openPack,
  proveAxioms,
  proveConjecture,
  researchDue,
  researchRate,
  seriesCost,
  setStaff,
  staffBoost,
  staffSlots,
  tierPacks,
  timeWarp,
  grantPacks,
  diamondIn,
  platinumIn,
  pityThreshold,
  HOUR_MS,
  type CardDef,
  type EconomyConfig,
  type EconomyContext,
  type EconomyState,
} from "../src/economy.js";

const era = (id: string, k: number) => ({ id, name: id, years: "", institute: { id: `${id}-inst`, name: `${id} institute`, base: 2000 * 15 ** k, output: 2.5 * 8 ** k }, packPrice: 1000 * 15 ** k });
const theorem = (id: string, base: number, growth: number, requires: { theorem: string; level: number } | null = null, extra = {}) =>
  ({ id, name: id, statement: "", boosts: "", base, growth, requires, x: 0, y: 0, ...extra }) as EconomyConfig["theorems"][number];

export const CFG: EconomyConfig = {
  theorems: [
    theorem("successor", 50, 1.15),
    theorem("distributive", 200, 1.15, { theorem: "successor", level: 5 }),
    theorem("geometric", 300, 1.15, { theorem: "successor", level: 5 }),
    theorem("ivt", 400, 1.15, { theorem: "distributive", level: 3 }),
    theorem("euler", 500, 1.15, { theorem: "ivt", level: 3 }),
    theorem("binomial", 500, 1.15, { theorem: "distributive", level: 3 }, { unavailable: true }),
    theorem("harmonic", 1000, 1.2, { theorem: "geometric", level: 5 }),
    theorem("pigeonhole", 300, 1.15),
    theorem("lln", 2000, 2, { theorem: "pigeonhole", level: 5 }, { maxLevel: 10 }),
    theorem("golden", 5000, 1.618, { theorem: "harmonic", level: 10 }),
    theorem("recurrence", 1000, 1.3, { theorem: "pigeonhole", level: 3 }),
  ],
  eras: ["antiquity", "golden-age", "renaissance", "enlightenment", "steam-age", "machine-age", "space-age"].map(era),
  institutes: { growth: 1.15 },
  staff: { boost: { silver: 0.02, gold: 0.05, platinum: 0.1, diamond: 0.25 }, foilFactor: 2, copiesPerSlot: 1, maxSlots: 12 },
  timeWarp: { xp: 600, hours: 12 },
  conjectures: { first: 50e6, step: 10, multiplier: 2.5, list: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, name: `C${i}`, statement: "", proved: null })) },
  axioms: {
    bonus: 0.05,
    list: [10e3, 30e3, 100e3].map((at, i) => ({ id: `a${i}`, name: `A${i}`, at, hours: 0, group: "zfc" as const, statement: "", cosmetics: [{ id: `cos${i}`, slot: "banner" as const, name: "", description: "" }, { id: `extra${i}`, slot: "theme" as const, name: "", description: "" }], title: i === 1 ? "Inductive" : null })),
  },
  corollaries: { perAchievementPoint: 0.001, perLevelTier: 0.05, perEraSet: 0.1 },
  packs: {
    size: 3,
    odds: { common: { silver: 72, gold: 20, platinum: 6.5, diamond: 1.5 }, last: { silver: 0, gold: 92, platinum: 6.5, diamond: 1.5 } },
    pity: { diamond: 80, platinum: 10, step: 0.05 },
    foilOneIn: 25,
    duplicate: { silver: 20, gold: 60, platinum: 200, diamond: 600 },
    levelTier: { bronze: { packs: 1, era: 0 }, silver: { packs: 2, era: 0 }, gold: { packs: 3, era: 1 } },
    achievement: { platinum: { packs: 1, era: 0 }, diamond: { packs: 2, era: 1 }, ruby: { packs: 3, era: 2 }, tanzanite: { packs: 5, era: 3 }, vibranium: { packs: 8, era: 4 }, solarium: { packs: 12, era: 5 }, antimatter: { packs: 20, era: 6 } },
    challenge: 1,
    fullWeek: 1,
  },
  shop: [],
  colors: [{ id: "glow", name: "Glow", description: "", axiom: "a1", style: { kind: "theme", hue: 10, sat: 0.5 } }],
  tabs: { research: 2000, conjecturesRate: 250e3 },
};

const CTX: EconomyContext = { questions: 0, dailyDays: 0, tiers: 0, eraSets: 0 };
const rich = (n: number): EconomyState => ({ ...emptyEconomy(), lemmasEarned: n });

const CARDS: CardDef[] = [
  ...["d1", "d2", "d3"].map((id) => ({ id, name: id, era: "antiquity", rarity: "diamond" as const, born: 0, died: 1, fields: [] })),
  ...["p1", "p2", "p3", "p4"].map((id) => ({ id, name: id, era: "antiquity", rarity: "platinum" as const, born: 0, died: 1, fields: [] })),
  ...["g1", "g2", "g3", "g4"].map((id) => ({ id, name: id, era: "antiquity", rarity: "gold" as const, born: 0, died: 1, fields: [] })),
  ...["s1", "s2", "s3", "s4", "s5"].map((id) => ({ id, name: id, era: "antiquity", rarity: "silver" as const, born: 0, died: 1, fields: [] })),
];
const CARD_MAP = new Map(CARDS.map((c) => [c.id, c]));

describe("SI notation (SPEC §13.1)", () => {
  it("shows amounts below 1,000 in full", () => {
    expect(lemmasShort(850)).toBe("850 ∴");
    expect(lemmasLong(850)).toBe("850 lemmas");
    expect(lemmasLong(1)).toBe("1 lemma");
    expect(lemmasShort(0)).toBe("0 ∴");
  });
  it("uses SI prefixes with three significant figures", () => {
    expect(lemmasShort(100_000)).toBe("100 k∴");
    expect(lemmasLong(100_000)).toBe("100 kilolemmas");
    expect(lemmasShort(4_560_000)).toBe("4.56 M∴");
    expect(lemmasLong(4_564_000)).toBe("4.56 megalemmas");
    expect(lemmasLong(12.3e9)).toBe("12.3 gigalemmas");
    expect(lemmasShort(1e30)).toBe("1.00 Q∴");
  });
  it("rolls over at a prefix boundary", () => {
    expect(lemmasShort(999_600)).toBe("1.00 M∴");
    expect(lemmasShort(999.7)).toBe("1.00 k∴");
  });
  it("keeps counting in quettalemmas past 10³⁰", () => {
    expect(lemmasShort(12_300e30)).toBe("12,300 Q∴");
  });
});

describe("costs", () => {
  it("level n + 1 costs base × growth^n", () => {
    expect(seriesCost(50, 1.15, 0, 1)).toBe(50);
    expect(seriesCost(50, 1.15, 2, 1)).toBe(Math.ceil(50 * 1.15 ** 2));
    expect(seriesCost(50, 1.15, 0, 3)).toBe(Math.ceil(50 + 57.5 + 66.125));
  });
  it("finds the most levels a budget buys", () => {
    const n = maxAffordable(50, 1.15, 0, 1000);
    expect(seriesCost(50, 1.15, 0, n)).toBeLessThanOrEqual(1000);
    expect(seriesCost(50, 1.15, 0, n + 1)).toBeGreaterThan(1000);
  });
  it("quotes ×10 at its full price when unaffordable, and Max with its count", () => {
    const q = buyQuote(50, 1.15, 0, 100, 10);
    expect(q.affordable).toBe(false);
    expect(q.cost).toBe(seriesCost(50, 1.15, 0, 10));
    const m = buyQuote(50, 1.15, 0, 1000, "max");
    expect(m.affordable).toBe(true);
    expect(m.count).toBe(maxAffordable(50, 1.15, 0, 1000));
  });
});

describe("theorems (SPEC §13.2)", () => {
  it("locks theorems until prerequisites are proven, and never buys an unavailable one", () => {
    let s = rich(1e9);
    expect(buyTheorem(CFG, s, "distributive", 1).count).toBe(0);
    s = buyTheorem(CFG, s, "successor", 10).state;
    expect(s.theorems.successor).toBe(10);
    expect(buyTheorem(CFG, s, "distributive", 1).count).toBe(1);
    s = buyTheorem(CFG, s, "distributive", 10).state;
    expect(buyTheorem(CFG, s, "binomial", 1).count).toBe(0);
  });
  it("caps Law of Large Numbers at level 10", () => {
    let s = buyTheorem(CFG, rich(1e12), "pigeonhole", 10).state;
    s = buyTheorem(CFG, s, "lln", "max").state;
    expect(s.theorems.lln).toBe(10);
  });
  it("spending only raises lemmasSpent", () => {
    const s = buyTheorem(CFG, rich(1000), "successor", 1).state;
    expect(s.lemmasEarned).toBe(1000);
    expect(s.lemmasSpent).toBe(50);
    expect(balanceOf(s)).toBe(950);
  });
  it("Geometric Series approaches +20% per level", () => {
    expect(geometricPerLevel(1)).toBeCloseTo(0.01);
    expect(geometricPerLevel(2)).toBeCloseTo(0.0195);
    expect(geometricPerLevel(10_000)).toBeCloseTo(0.2);
  });
  it("harmonic numbers", () => {
    expect(harmonic(3)).toBeCloseTo(1 + 1 / 2 + 1 / 3);
    expect(harmonic(1e6)).toBeCloseTo(14.392726, 4);
  });
  it("M buys the cheapest next level repeatedly, including newly unlocked theorems", () => {
    const r = buyCheapest(CFG, rich(5000), "theorems");
    expect(r.count).toBeGreaterThan(5);
    expect(r.state.theorems.distributive ?? 0).toBeGreaterThan(0);
    expect(buyCheapest(CFG, r.state, "theorems").count).toBe(0);
    expect(r.cost).toBe(r.state.lemmasSpent);
  });
});

describe("Lemma awards (SPEC §13.1)", () => {
  it("pays the XP before upgrades", () => {
    expect(lemmaAward(CFG, emptyEconomy(), "question", 24, CTX).lemmas).toBe(24);
    expect(lemmaAward(CFG, emptyEconomy(), "question", 0, CTX).lemmas).toBe(0);
  });
  it("adds Successor Function's flat bonus to resolved questions only", () => {
    const s = { ...emptyEconomy(), theorems: { successor: 3 } };
    expect(lemmaAward(CFG, s, "question", 24, CTX).lemmas).toBe(30);
    expect(lemmaAward(CFG, s, "other", 20, CTX).lemmas).toBe(20);
  });
  it("multiplies by source theorems, Harmonic Series, Golden Ratio, corollaries and Axioms", () => {
    const s: EconomyState = { ...emptyEconomy(), theorems: { distributive: 2, golden: 1 }, axiomsProven: 2, achievements: { "specialist:P1": 10 } };
    const a = lemmaAward(CFG, s, "quiz", 100, { ...CTX, tiers: 2 });
    expect(a.lemmas).toBe(Math.round(100 * 1.2 * 1.0618 * (1 + 0.01 + 0.1) * 1.1));
    expect(a.multipliers.map((m) => m.label)).toEqual(["Distributive Law", "Golden Ratio", "Corollaries", "Axioms"]);
  });
});

describe("Research (SPEC §13.3)", () => {
  it("unlocks each era with the previous era's first institute", () => {
    let s = rich(1e6);
    expect(eraUnlocked(CFG, s, "antiquity")).toBe(true);
    expect(eraUnlocked(CFG, s, "golden-age")).toBe(false);
    expect(buyInstitute(CFG, s, "golden-age", 1).count).toBe(0);
    s = buyInstitute(CFG, s, "antiquity", 1).state;
    expect(eraUnlocked(CFG, s, "golden-age")).toBe(true);
  });
  it("grows staff slots with copies, capped", () => {
    expect(staffSlots(CFG, 0)).toBe(0);
    expect(staffSlots(CFG, 1)).toBe(1);
    expect(staffSlots(CFG, 7)).toBe(7);
    expect(nextSlotAt(CFG, 7)).toBe(8);
    expect(staffSlots(CFG, 12)).toBe(12);
    expect(staffSlots(CFG, 1000)).toBe(12);
    expect(nextSlotAt(CFG, 1000)).toBeNull();
  });
  it("boosts an institute by its slotted cards; foils double; unslotted cards give nothing", () => {
    let s: EconomyState = { ...rich(0), institutes: { antiquity: 2 }, cards: { d1: { n: 1, foil: true }, p1: { n: 1, foil: false }, s1: { n: 2, foil: false } } };
    expect(staffBoost(CFG, s, "antiquity", CARD_MAP)).toBe(0);
    s = setStaff(CFG, s, "antiquity", 0, "d1");
    s = setStaff(CFG, s, "antiquity", 1, "p1");
    expect(staffBoost(CFG, s, "antiquity", CARD_MAP)).toBeCloseTo(0.6);
    // Moving a card empties its old slot; a slot that doesn't exist yet can't be filled.
    s = setStaff(CFG, s, "antiquity", 1, "d1");
    expect(s.staff.antiquity).toEqual([null, "d1"]);
    expect(setStaff(CFG, s, "antiquity", 5, "s1")).toBe(s);
    expect(researchRate(CFG, s, CARD_MAP, CTX)).toBeCloseTo(2 * 2.5 * 1.5);
  });
  it("credits whole hours and keeps the rest", () => {
    const s = { ...emptyEconomy(), researchCreditedAt: 1_000_000 };
    expect(researchDue(s, 1_000_000 + 2.5 * HOUR_MS)).toEqual({ hours: 2, creditedAt: 1_000_000 + 2 * HOUR_MS });
    expect(researchDue(s, 500).hours).toBe(0);
  });
  it("fires a Time Warp every 600 XP", () => {
    expect(timeWarp(CFG, 420, 100)).toEqual({ warps: 0, warpXp: 520 });
    expect(timeWarp(CFG, 520, 1300)).toEqual({ warps: 3, warpXp: 20 });
  });
  it("Conjectures multiply Research by 2.5 and cost 10× the last", () => {
    let s: EconomyState = { ...rich(600e6), institutes: { antiquity: 1 } };
    const before = researchRate(CFG, s, CARD_MAP, CTX);
    s = proveConjecture(CFG, s, 1)!;
    expect(s.lemmasSpent).toBe(50e6);
    expect(researchRate(CFG, s, CARD_MAP, CTX)).toBeCloseTo(before * 2.5);
    s = proveConjecture(CFG, s, 2)!;
    expect(s.lemmasSpent).toBe(550e6);
    expect(proveConjecture(CFG, s, 3)).toBeNull();
  });
});

describe("Axioms (SPEC §13.6)", () => {
  it("are reached by lifetime Lemmas and claimed together", () => {
    let s: EconomyState = { ...rich(40e3), lemmasSpent: 39e3 };
    expect(axiomsReached(CFG, s)).toBe(2);
    expect(nextAxiom(CFG, s)).toMatchObject({ reached: true, toProve: 2 });
    const r = proveAxioms(CFG, s, 5);
    s = r.state;
    expect(r.proven.map((a) => a.id)).toEqual(["a0", "a1"]);
    expect(s.axiomsProven).toBe(2);
    expect(s.titles).toEqual(["Inductive"]);
    expect(s.owned).toEqual(["cos0", "extra0", "cos1", "extra1", "glow"]);
    expect(nextAxiom(CFG, s)).toMatchObject({ reached: false, axiom: { id: "a2" } });
  });
});

describe("packs (SPEC §13.7)", () => {
  const withPacks = (n: number, s = emptyEconomy()) => grantPacks(s, "antiquity", n);
  it("rolls are fixed by uid, era and packs opened", () => {
    const a = openPack(CFG, withPacks(2), "u1", "antiquity", CARDS).result;
    const b = openPack(CFG, withPacks(2), "u1", "antiquity", CARDS).result;
    expect(a).toEqual(b);
    const c = openPack(CFG, withPacks(2), "u2", "antiquity", CARDS).result;
    expect(c.cards.map((x) => x.id)).not.toEqual(a.cards.map((x) => x.id));
  });
  it("holds 3 cards, the last Gold or better", () => {
    let s = withPacks(200);
    for (let i = 0; i < 200; i++) {
      const r = openPack(CFG, s, "seed", "antiquity", CARDS);
      expect(r.result.cards).toHaveLength(3);
      expect(r.result.cards[2]!.rarity).not.toBe("silver");
      s = r.state;
    }
    expect(s.packs.antiquity).toMatchObject({ granted: 200, opened: 200 });
  });
  it("guarantees a Diamond by the 80th pack, sooner with Law of Large Numbers", () => {
    for (const lln of [0, 10]) {
      let s: EconomyState = { ...withPacks(500), theorems: { lln } };
      let since = 0;
      let worst = 0;
      for (let i = 0; i < 500; i++) {
        const r = openPack(CFG, s, `pity-${lln}`, "antiquity", CARDS);
        s = r.state;
        since = r.result.diamond ? 0 : since + 1;
        worst = Math.max(worst, since);
      }
      expect(worst).toBeLessThan(lln ? 40 : 80);
    }
  });
  it("guarantees a Platinum or better by the 10th pack, sooner with Law of Large Numbers", () => {
    for (const [lln, limit] of [[0, 10], [1, 9], [3, 8], [10, 5]] as const) {
      expect(pityThreshold(CFG, lln, "platinum")).toBe(limit);
      let s: EconomyState = { ...withPacks(400), theorems: { lln } };
      let since = 0;
      let worst = 0;
      for (let i = 0; i < 400; i++) {
        const r = openPack(CFG, s, `plat-${lln}`, "antiquity", CARDS);
        s = r.state;
        since = r.result.cards.some((c) => c.rarity === "platinum" || c.rarity === "diamond") ? 0 : since + 1;
        worst = Math.max(worst, since);
      }
      expect(worst).toBeLessThan(limit);
      expect(worst).toBe(limit - 1);
    }
    expect([0, 1, 5, 10, 12].map((l) => pityThreshold(CFG, l))).toEqual([80, 76, 60, 40, 40]);
  });
  it("shows the pity counter", () => {
    const s: EconomyState = { ...withPacks(1), packs: { antiquity: { granted: 30, opened: 19, pity: 19, platPity: 3 } } };
    expect(diamondIn(CFG, s, "antiquity")).toBe(61);
    expect(platinumIn(CFG, s, "antiquity")).toBe(7);
  });
  it("never repeats a Diamond until every Diamond is held", () => {
    let s = withPacks(1000);
    const seen: string[] = [];
    for (let i = 0; i < 1000 && seen.length < 3; i++) {
      const r = openPack(CFG, s, "dia", "antiquity", CARDS);
      s = r.state;
      for (const c of r.result.cards) if (c.rarity === "diamond") seen.push(c.id);
    }
    expect(new Set(seen.slice(0, 3)).size).toBe(3);
  });
  it("duplicates turn into Lemmas (× Pigeonhole), and opened counts only go up", () => {
    let s: EconomyState = { ...withPacks(50), theorems: { pigeonhole: 2 } };
    let lemmas = 0;
    for (let i = 0; i < 50; i++) {
      const r = openPack(CFG, s, "dup", "antiquity", CARDS);
      for (const c of r.result.cards) if (c.result === "duplicate") expect(c.lemmas).toBe(CFG.packs.duplicate[c.rarity] * 1.5);
      lemmas += r.result.lemmas;
      s = r.state;
    }
    expect(s.lemmasEarned).toBe(lemmas);
    expect(() => openPack(CFG, s, "dup", "antiquity", CARDS)).toThrow();
  });
  it("free packs come from the source's era, capped at the latest unlocked, released era", () => {
    const released = new Set(["antiquity", "enlightenment", "machine-age"]);
    let s = emptyEconomy();
    expect(freePackEra(CFG, s, 6, released)).toBe("antiquity");
    s = { ...s, institutes: { antiquity: 1, "golden-age": 1, renaissance: 1, enlightenment: 1 } };
    expect(freePackEra(CFG, s, 3, released)).toBe("enlightenment");
    expect(freePackEra(CFG, s, 6, released)).toBe("enlightenment");
    expect(freePackEra(CFG, s, 2, released)).toBe("antiquity");
  });
  it("level tier packs are granted once per tier", () => {
    const released = new Set(["antiquity"]);
    const r = tierPacks(CFG, emptyEconomy(), 3, released);
    expect(r.state.packs.antiquity!.granted).toBe(6);
    expect(r.state.tierReached).toBe(3);
    expect(tierPacks(CFG, r.state, 3, released).grants).toEqual([]);
  });
});

describe("merging copies", () => {
  it("never lowers a counter and unions collections", () => {
    const a: EconomyState = { ...rich(100), theorems: { successor: 3 }, cards: { d1: { n: 1, foil: false } }, owned: ["x"], packs: { antiquity: { granted: 5, opened: 2, pity: 2 } } };
    const b: EconomyState = { ...rich(200), theorems: { successor: 1, pigeonhole: 2 }, cards: { d1: { n: 2, foil: true }, s1: { n: 1, foil: false } }, owned: ["y"], packs: { antiquity: { granted: 6, opened: 3, pity: 0 } } };
    const m = mergeEconomy(a, b);
    expect(m.lemmasEarned).toBe(200);
    expect(m.theorems).toEqual({ successor: 3, pigeonhole: 2 });
    expect(m.cards).toEqual({ d1: { n: 2, foil: true }, s1: { n: 1, foil: false } });
    expect(m.owned.sort()).toEqual(["x", "y"]);
    expect(m.packs.antiquity).toEqual({ granted: 6, opened: 3, pity: 0 });
  });
});

describe("site themes (SPEC §13.8)", () => {
  it("pass WCAG AA in light and dark for any hue", async () => {
    const { themeTokens, contrast } = await import("../src/economy.js");
    for (let hue = 0; hue < 360; hue += 15) {
      for (const sat of [0, 0.3, 0.7, 1]) {
        for (const t of Object.values(themeTokens({ kind: "theme", hue, sat }))) {
          for (const bg of [t.bg, t.surface, t.region]) {
            expect(contrast(t.ink, bg)).toBeGreaterThanOrEqual(7);
            expect(contrast(t.muted, bg)).toBeGreaterThanOrEqual(4.5);
            expect(contrast(t.accent, bg)).toBeGreaterThanOrEqual(4.5);
          }
          expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
