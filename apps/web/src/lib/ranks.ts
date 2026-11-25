import { RANKS, RANK_FLOOR, score, type RankLevel } from "@intellectify/engine";

export const RANK_LABEL: Record<RankLevel, string> = {
  0: "Unranked",
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

export const rankKey = (r: RankLevel) => RANKS[r];

/** CSS variables for a node in rank `r`: fill, highlight, and the next rank's color for the progress ring. */
export function rankVars(r: RankLevel, theta: number | null): string {
  const key = RANKS[r];
  const next = RANKS[Math.min(r + 1, 5) as RankLevel];
  return `--r: var(--${key}); --hi: var(--${key}-hi, var(--${key})); --next: var(--${next}); --p: ${progress(r, theta)}`;
}

/** Progress through the current rank's band toward the next floor (Diamond: toward 2000). Linear in θ, not in score (SPEC §15.2). */
export function progress(r: RankLevel, theta: number | null): number {
  if (theta === null || r === 0) return 0;
  const lo = RANK_FLOOR[r as Exclude<RankLevel, 0>];
  const hi = r < 5 ? RANK_FLOOR[(r + 1) as Exclude<RankLevel, 0>] : 2000;
  return Math.max(0, Math.min(1, (theta - lo) / (hi - lo)));
}

export { score };
