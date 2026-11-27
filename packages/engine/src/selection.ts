import { CONFIG, TIER_FLOOR, type Tier } from "./config.js";
import { tierOf } from "./rating.js";

export interface Candidate {
  id: string;
  rating: number;
}

export interface SelectionOptions {
  /** "Drop a tier": target the band one tier below θ's current band (SPEC §5.3). */
  dropTier?: boolean;
  /** Question IDs seen recently; these are avoided unless nothing else is available. */
  recentlySeen?: ReadonlySet<string>;
  /** Question IDs seen at any time: never repeated while an unseen question remains near the target (see `band`). */
  everSeen?: ReadonlySet<string>;
  /** Half-width of the no-repeat band around the target rating (SPEC §5.4); default CONFIG.noRepeatBand. */
  band?: number;
  /** Hidden (reported) question IDs; always excluded. */
  hidden?: ReadonlySet<string>;
  /** Random source in [0, 1); injectable for tests. */
  random?: () => number;
}

/** Ideal question rating: d = θ − S·ln(p / (1 − p)) for target success p, shifted down a band when dropping a tier. */
export function targetRating(theta: number, dropTier = false): number {
  const p = CONFIG.targetP;
  const ideal = theta - CONFIG.scale * Math.log(p / (1 - p));
  if (!dropTier) return ideal;
  const tier = tierOf(theta);
  if (tier === 1) return ideal;
  const lower = (tier - 1) as Tier;
  const bandMid = (TIER_FLOOR[lower] + TIER_FLOOR[tier]) / 2;
  return Math.min(ideal, bandMid);
}

/**
 * Pick the next question: closest to the target rating. While any unseen question lies within ±band of
 * the target, only unseen questions in the band are served, so a question isn't repeated while a new one
 * near the student's level remains (SPEC §5.4). Once the band is used up, repeats are allowed, avoiding
 * recent ones. A soft weighting (not strict argmin) keeps sessions varied.
 */
export function pickQuestion<C extends Candidate>(pool: readonly C[], theta: number, opts: SelectionOptions = {}): C | null {
  const random = opts.random ?? Math.random;
  const hidden = opts.hidden ?? new Set<string>();
  const visible = pool.filter((q) => !hidden.has(q.id));
  if (visible.length === 0) return null;

  const target = targetRating(theta, opts.dropTier);
  const band = opts.band ?? CONFIG.noRepeatBand;
  const unseen = visible.filter((q) => !opts.everSeen?.has(q.id) && Math.abs(q.rating - target) <= band);
  const fresh = visible.filter((q) => !opts.recentlySeen?.has(q.id));
  const candidates = unseen.length > 0 ? unseen : fresh.length > 0 ? fresh : visible;

  const weights = candidates.map((q) => {
    const distance = Math.abs(q.rating - target);
    const closeness = Math.exp(-((distance / 60) ** 2));
    const seenPenalty = opts.everSeen?.has(q.id) ? 0.25 : 1;
    return Math.max(closeness * seenPenalty, 1e-9);
  });
  const total = weights.reduce((a, w) => a + w, 0);
  let r = random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}
