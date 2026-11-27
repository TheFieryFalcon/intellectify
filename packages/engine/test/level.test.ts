import { describe, expect, it } from "vitest";
import { levelForXp, levelProgress, tierForLevel, XP, xpForLevel } from "../src/index.js";

describe("level curve", () => {
  it("matches the spec's tier table", () => {
    expect([10, 25, 50, 100, 150, 200, 300, 400, 500, 750].map(xpForLevel)).toEqual([
      1495, 4127, 8899, 21399, 38899, 61399, 121399, 201399, 301399, 638899,
    ]);
  });

  it("each level costs 101 + 2L, plus an early extra that shrinks from 60 to nothing by level 50", () => {
    const cost = (L: number) => xpForLevel(L + 1) - xpForLevel(L);
    expect([1, 2, 10, 25, 49].map(cost)).toEqual([163, 164, 170, 182, 200]); // about 10 minutes at the start
    for (const L of [50, 51, 120, 499]) expect(cost(L)).toBe(101 + 2 * L);
    for (let L = 1; L < 100; L++) expect(cost(L + 1)).toBeGreaterThanOrEqual(cost(L)); // never gets cheaper
  });

  it("inverts exactly at every boundary", () => {
    for (let L = 1; L <= 1000; L++) {
      expect(levelForXp(xpForLevel(L))).toBe(L);
      if (L > 1) expect(levelForXp(xpForLevel(L) - 1)).toBe(L - 1);
    }
  });

  it("starts at level 1 Basic", () => {
    expect(levelProgress(0)).toMatchObject({ level: 1, into: 0, needed: 163 });
    expect(levelProgress(0).tier.name).toBe("Basic");
  });

  it("maps levels to tiers", () => {
    expect([9, 10, 99, 100, 499, 500, 749, 750, 2000].map((l) => tierForLevel(l).name)).toEqual([
      "Basic", "Bronze", "Gold", "Platinum", "Vibranium", "Solarium", "Solarium", "Antimatter", "Antimatter",
    ]);
  });
});

describe("XP sources", () => {
  it("pays more for harder questions and a little for effort", () => {
    expect([1, 2, 3, 4, 5].map((t) => XP.question(t, 1))).toEqual([10, 16, 24, 36, 60]);
    expect(XP.question(4, 0)).toBe(4);
    expect(XP.question(3, 0.5)).toBe(12);
  });
});

describe("pace (SPEC §12.4)", () => {
  it("puts Solarium at about 500 hours of 600 XP/hour", () => {
    expect(Math.abs(xpForLevel(500) / 600 - 500)).toBeLessThan(5); // ≈502 hours with the early extra
  });
});
