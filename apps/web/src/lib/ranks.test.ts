import { describe, expect, it } from "vitest";
import { progress, score } from "./ranks";

describe("rank progress ring", () => {
  it("fills linearly in score between rank floors (SPEC §16.2)", () => {
    // Bronze → Silver runs from θ 1000 (score 0.67) to 1250 (score 7.59).
    expect(progress(1, 1000)).toBe(0);
    expect(progress(1, 1250)).toBe(1);
    // Score halfway between the floors (about 4.13) is θ ≈ 1180.
    expect(progress(1, 1180)).toBeCloseTo(0.5, 1);
    // Gold → Platinum: scores 26.9 to 62.2; θ 1475 has score 43.8, about 48% of the way.
    expect(score(1475)).toBe(44);
    expect(progress(3, 1475)).toBeCloseTo(0.48, 2);
  });
});
