import { describe, expect, it } from "vitest";
import { progress, score } from "./ranks";

describe("rank progress ring", () => {
  it("fills linearly in θ between rank floors, not in score", () => {
    // Bronze → Silver runs from θ 1000 to 1280.
    expect(progress(1, 1000)).toBe(0);
    expect(progress(1, 1140)).toBeCloseTo(0.5, 10);
    expect(progress(1, 1280)).toBe(1);
    // Halfway in θ is nowhere near halfway in score (1 → 10).
    expect(score(1140)).toBe(3);
    // Gold → Platinum: 1400 to 1550.
    expect(progress(3, 1475)).toBeCloseTo(0.5, 10);
  });
});
