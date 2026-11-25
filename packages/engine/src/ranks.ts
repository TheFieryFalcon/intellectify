import { GATE_COUNT, GATE_OUTCOME, RANK_BUFFER, RANK_FLOOR, RANKS, type RankLevel, type Tier } from "./config.js";

/** Correct-answer counts per exact tier, index 1..6 (index 0 unused). */
export type GateCounts = [number, number, number, number, number, number, number];

export const emptyGates = (): GateCounts => [0, 0, 0, 0, 0, 0, 0];

/** Count of correct answers at tier k or higher. */
export function correctAtOrAbove(gates: GateCounts, k: number): number {
  let n = 0;
  for (let t = k; t <= 6; t++) n += gates[t] ?? 0;
  return n;
}

/** Whether an outcome counts toward rank gates (SPEC §5.4: outcome > 0.6). */
export const countsForGate = (outcome: number): boolean => outcome > GATE_OUTCOME;

/** Record a resolved question in the gate counts (returns a new array). */
export function recordGate(gates: GateCounts, tier: Tier, outcome: number): GateCounts {
  if (!countsForGate(outcome)) return gates;
  const next = [...gates] as GateCounts;
  next[tier] = (next[tier] ?? 0) + 1;
  return next;
}

/** Highest rank whose θ floor and gate are both met right now (no hysteresis). */
export function eligibleRank(theta: number, gates: GateCounts, gateCount = GATE_COUNT): RankLevel {
  let best: RankLevel = 0;
  for (let k = 1 as RankLevel; k <= 5; k++) {
    const floor = RANK_FLOOR[k as Exclude<RankLevel, 0>];
    if (theta >= floor && correctAtOrAbove(gates, k) >= gateCount) best = k;
  }
  return best;
}

/**
 * Rank after an update, with the hidden buffer (SPEC §5.4):
 * promote to any newly eligible rank; demote only while θ is below floor_k − buffer_k.
 * Gate counts never decrease, so only θ can cause a demotion.
 */
export function nextRank(current: RankLevel, theta: number, gates: GateCounts, gateCount = GATE_COUNT): RankLevel {
  let r = current;
  while (r > 0 && theta < RANK_FLOOR[r as Exclude<RankLevel, 0>] - RANK_BUFFER[r as Exclude<RankLevel, 0>]) {
    r = (r - 1) as RankLevel;
  }
  return Math.max(r, eligibleRank(theta, gates, gateCount)) as RankLevel;
}

export const rankName = (r: RankLevel) => RANKS[r];
