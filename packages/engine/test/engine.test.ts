import { describe, expect, it } from "vitest";
import {
  applyOutcome,
  placementTiers,
  reviseOutcome,
  autoMarkedOutcome,
  correctAtOrAbove,
  eligibleRank,
  emptyGates,
  freeResponseOutcome,
  maxAttempts,
  multiPartOutcome,
  newSkillState,
  nextRank,
  pCorrect,
  pickQuestion,
  recordGate,
  rollUp,
  score,
  targetRating,
  tierOf,
  updateTheta,
  type GateCounts,
} from "../src/index.js";

const gatesWith = (counts: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number>>): GateCounts => {
  const g = emptyGates();
  for (const [t, n] of Object.entries(counts)) g[Number(t)] = n!;
  return g;
};

describe("rating", () => {
  it("gives P = 0.5 when θ equals the question rating", () => {
    expect(pCorrect(1500, 1500)).toBeCloseTo(0.5);
  });

  it("moves θ up on success and down on failure, by K·(outcome − P)", () => {
    expect(updateTheta(1500, 1500, 1)).toBeCloseTo(1516);
    expect(updateTheta(1500, 1500, 0)).toBeCloseTo(1484);
  });

  it("halves the step for secondary skills", () => {
    expect(updateTheta(1500, 1500, 1, 0.5)).toBeCloseTo(1508);
  });

  it("clamps θ", () => {
    expect(updateTheta(2299, 1000, 1)).toBeLessThanOrEqual(2300);
    expect(updateTheta(801, 2000, 0)).toBeGreaterThanOrEqual(800);
  });

  it("anchors the 0–100 score at 1500", () => {
    expect(score(1500)).toBe(50);
    expect(score(1700)).toBeGreaterThan(85);
    expect(score(1250)).toBeLessThan(10);
  });

  it("maps ratings to exam-anchored tiers", () => {
    expect([999, 1000, 1249, 1250, 1399, 1400, 1549, 1550, 1699, 1700, 1999, 2000].map(tierOf)).toEqual([
      1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6,
    ]);
  });
});

describe("attempt credit", () => {
  it("follows the per-tier credit table", () => {
    expect(autoMarkedOutcome(1, 2)).toBe(0.3);
    expect(autoMarkedOutcome(3, 2)).toBe(0.5);
    expect(autoMarkedOutcome(4, 3)).toBeCloseTo(0.49);
    expect(autoMarkedOutcome(5, 5)).toBeCloseTo(0.6561);
    expect(autoMarkedOutcome(6, 40)).toBe(1);
    expect(autoMarkedOutcome(4, null)).toBe(0);
  });

  it("knows attempt limits", () => {
    expect([1, 2, 3, 4, 5].map((t) => maxAttempts(t as 1))).toEqual([2, 2, 2, 3, 5]);
    expect(maxAttempts(6)).toBe(Infinity);
  });

  it("rejects attempts beyond the limit", () => {
    expect(() => autoMarkedOutcome(3, 3)).toThrow();
  });

  it("gives free response no credit below 60%", () => {
    expect(freeResponseOutcome(0.59)).toBe(0);
    expect(freeResponseOutcome(0.6)).toBe(0.6);
    expect(freeResponseOutcome(0.85)).toBe(0.85);
  });

  it("weights multi-part outcomes by marks", () => {
    expect(multiPartOutcome([{ outcome: 1, marks: 3 }, { outcome: 0, marks: 1 }])).toBe(0.75);
  });
});

describe("ranks and gates", () => {
  it("counts only outcomes above 0.6", () => {
    let g = emptyGates();
    g = recordGate(g, 3, 0.5);
    g = recordGate(g, 3, 0.6);
    expect(g[3]).toBe(0);
    g = recordGate(g, 3, 0.61);
    expect(g[3]).toBe(1);
  });

  it("lets harder solves satisfy lower gates", () => {
    expect(correctAtOrAbove(gatesWith({ 5: 3 }), 3)).toBe(3);
    expect(eligibleRank(1460, gatesWith({ 5: 3 }))).toBe(3);
  });

  it("needs both θ and the gate", () => {
    expect(eligibleRank(1800, gatesWith({ 3: 3 }))).toBe(3); // θ high enough for Diamond, gate only Gold
    expect(eligibleRank(1390, gatesWith({ 5: 3 }))).toBe(2); // gate fine for Diamond, θ only Silver
    expect(eligibleRank(1390, gatesWith({ 1: 2 }))).toBe(0);
  });

  it("holds a rank inside the hidden buffer and drops below it", () => {
    const g = gatesWith({ 4: 3 });
    expect(nextRank(4, 1550 - 20, g)).toBe(4); // Platinum buffer is 35
    expect(nextRank(4, 1550 - 36, g)).toBe(3);
  });

  it("placement alone never grants a rank", () => {
    const s = newSkillState(4);
    expect(s.theta).toBe(1550);
    expect(s.rank).toBe(0);
  });

  it("reaches Gold after three Tier 3 solves from the default placement", () => {
    let s = newSkillState();
    for (let i = 0; i < 3; i++) s = applyOutcome(s, 1500, 1).state;
    expect(s.rank).toBe(3);
    expect(s.resolved).toBe(3);
  });
});

describe("roll-up", () => {
  it("caps at one rank above the weakest child", () => {
    const r = rollUp([
      { theta: 1750, rank: 5, weight: 3 },
      { theta: 1300, rank: 2, weight: 1 },
    ]);
    expect(r.theta).toBeCloseTo(1637.5);
    expect(r.rank).toBe(3); // θ implies Platinum, capped at Silver + 1
  });

  it("treats unstarted children as Unranked for the cap", () => {
    const r = rollUp([
      { theta: 1750, rank: 5, weight: 2 },
      { theta: null, rank: 0, weight: 2 },
    ]);
    expect(r.theta).toBe(1750);
    expect(r.rank).toBe(1);
  });

  it("is Unranked with no started children", () => {
    expect(rollUp([{ theta: null, rank: 0, weight: 1 }])).toEqual({ theta: null, rank: 0, weight: 1 });
  });
});

describe("selection", () => {
  const pool = [1100, 1300, 1400, 1500, 1550, 1650, 1800].map((rating, i) => ({ id: `q${i}`, rating }));

  it("targets slightly below θ for a 65% success rate", () => {
    expect(targetRating(1500)).toBeCloseTo(1500 - 100 * Math.log(0.65 / 0.35));
  });

  it("shifts the target down a band when dropping a tier", () => {
    expect(targetRating(1500, true)).toBeLessThanOrEqual(1350);
  });

  it("prefers questions near the target", () => {
    const counts: Record<string, number> = {};
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2000; i++) {
      const q = pickQuestion(pool, 1500, { random })!;
      counts[q.id] = (counts[q.id] ?? 0) + 1;
    }
    expect(counts["q2"]! + counts["q3"]!).toBeGreaterThan(1200);
    expect(counts["q0"] ?? 0).toBe(0);
  });

  it("skips hidden and recently seen questions", () => {
    const q = pickQuestion(pool, 1500, {
      hidden: new Set(["q2"]),
      recentlySeen: new Set(["q3", "q4"]),
      random: () => 0,
    });
    expect(["q2", "q3", "q4"]).not.toContain(q!.id);
  });

  it("returns null for an empty pool", () => {
    expect(pickQuestion([], 1500)).toBeNull();
  });
});

describe("skill sizes (SPEC §3.3)", () => {
  it("bigger skills need more correct answers per rank", () => {
    const g = gatesWith({ 5: 4 });
    expect(eligibleRank(1750, g, "medium")).toBe(5); // 3 needed
    expect(eligibleRank(1750, g, "large")).toBe(5); // 4 needed
    expect(eligibleRank(1750, g, "cornerstone")).toBe(0); // 5 needed at every rank, and there are only 4
    expect(eligibleRank(1750, gatesWith({ 3: 1, 5: 4 }), "cornerstone")).toBe(3); // 5 at Tier ≥ 3, only 4 at Tier ≥ 4
  });

  it("cornerstone skills move θ more slowly and need 2 extra per gate", () => {
    const s = { theta: 1500, rank: 3 as const, gates: gatesWith({ 4: 4 }), resolved: 10, dropTier: false };
    const medium = applyOutcome(s, 1600, 1, 1, "medium");
    const corner = applyOutcome(s, 1600, 1, 1, "cornerstone");
    expect(corner.deltaTheta).toBeCloseTo(medium.deltaTheta * 0.7, 6);
    const ready = { ...s, theta: 1600 };
    expect(applyOutcome(ready, 1600, 1, 1, "medium").rankAfter).toBe(4);
    expect(applyOutcome(ready, 1600, 1, 1, "cornerstone").rankAfter).toBe(4); // 5th correct at Tier 4
    expect(applyOutcome({ ...ready, gates: gatesWith({ 4: 3 }) }, 1600, 1, 1, "cornerstone").rankAfter).toBe(3);
  });
});

describe("placement by maths mark (SPEC §5.3)", () => {
  it("maps marks to tiers, one lower for a Year 10 mark", () => {
    const spec = (src: Parameters<typeof placementTiers>[1]) => (m: number) => placementTiers(m, src).specialist;
    const meth = (src: Parameters<typeof placementTiers>[1]) => (m: number) => placementTiers(m, src).methods;
    // Specialist mark: bands, then Methods one higher.
    expect([30, 40, 59, 60, 74, 75, 100].map(spec("y11-specialist"))).toEqual([1, 2, 2, 3, 3, 4, 4]);
    expect([30, 40, 60, 75, 100].map(meth("y12-specialist"))).toEqual([2, 3, 4, 5, 5]);
    // Methods mark: 90+ is Methods Tier 5, Specialist one lower.
    expect([30, 40, 60, 75, 89, 90, 100].map(meth("y11-methods"))).toEqual([1, 2, 3, 4, 4, 5, 5]);
    expect([30, 40, 60, 75, 89, 90, 100].map(spec("y12-methods"))).toEqual([1, 1, 2, 3, 3, 4, 4]);
    // Year 10: one tier lower.
    expect([30, 50, 65, 90].map(spec("y10"))).toEqual([1, 1, 2, 3]);
    expect([30, 50, 65, 90].map(meth("y10"))).toEqual([2, 2, 3, 4]);
  });
});

describe("reviseOutcome (appeals)", () => {
  it("lands where applying the new outcome first would have", () => {
    const start = newSkillState(3);
    const a = applyOutcome(start, 1450, 0, 1, "large").state;
    const b = applyOutcome(start, 1450, 0.8, 1, "large").state;
    const revised = reviseOutcome(a, 1450, 0, 0.8, 1, "large").state;
    expect(revised.theta).toBeCloseTo(b.theta, 9);
    expect(revised.gates).toEqual(b.gates);
    expect(revised.resolved).toBe(a.resolved);
  });
  it("takes the gate back when a mark goes down", () => {
    const a = applyOutcome(newSkillState(3), 1450, 0.9).state;
    const down = reviseOutcome(a, 1450, 0.9, 0).state;
    expect(down.gates).toEqual(newSkillState(3).gates);
    expect(down.theta).toBeLessThan(a.theta);
  });
});
