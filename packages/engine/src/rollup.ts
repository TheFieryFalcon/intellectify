import { RANK_BUFFER, RANK_FLOOR, type RankLevel } from "./config.js";

export interface RollupChild {
  /** θ, or null if the child (skill or section) hasn't been started. */
  theta: number | null;
  rank: RankLevel;
  /** Weight in the average: number of dot points for skills; sum of children for sections. */
  weight: number;
}

export interface Rollup {
  theta: number | null;
  rank: RankLevel;
  weight: number;
}

const rankFromTheta = (theta: number): RankLevel => {
  let r: RankLevel = 0;
  for (let k = 1 as RankLevel; k <= 5; k++) if (theta >= RANK_FLOOR[k as Exclude<RankLevel, 0>]) r = k;
  return r;
};

/**
 * Section / unit / course roll-up (SPEC §5.5).
 * θ = weighted mean over started children. Rank = rank implied by θ, capped at one above the
 * lowest child rank (unstarted children count as Unranked), with the same hidden buffer as skills.
 */
export function rollUp(children: RollupChild[], previousRank: RankLevel = 0): Rollup {
  const weight = children.reduce((a, c) => a + c.weight, 0);
  const started = children.filter((c): c is RollupChild & { theta: number } => c.theta !== null);
  if (started.length === 0) return { theta: null, rank: 0, weight };
  const w = started.reduce((a, c) => a + c.weight, 0);
  const theta = started.reduce((a, c) => a + c.theta * c.weight, 0) / w;
  const cap = Math.min(5, Math.min(...children.map((c) => c.rank)) + 1);

  // Hysteresis: keep the previous rank while θ stays within its buffer.
  let held = previousRank;
  while (held > 0 && theta < RANK_FLOOR[held as Exclude<RankLevel, 0>] - RANK_BUFFER[held as Exclude<RankLevel, 0>]) {
    held = (held - 1) as RankLevel;
  }
  const rank = Math.min(cap, Math.max(held, rankFromTheta(theta))) as RankLevel;
  return { theta, rank, weight };
}
