import { CONFIG, TIER_FLOOR, type Tier } from "./config.js";

/** Probability that a student of ability θ answers a question of rating d correctly. */
export function pCorrect(theta: number, d: number, scale: number = CONFIG.scale): number {
  return 1 / (1 + Math.exp(-(theta - d) / scale));
}

export function clampTheta(theta: number): number {
  return Math.min(CONFIG.thetaMax, Math.max(CONFIG.thetaMin, theta));
}

/**
 * One Elo-style update: θ ← θ + K·w·(outcome − P).
 * @param weight 1 for the primary skill, CONFIG.secondaryWeight for secondary skills.
 */
export function updateTheta(theta: number, d: number, outcome: number, weight = 1): number {
  if (outcome < 0 || outcome > 1 || Number.isNaN(outcome)) throw new RangeError(`outcome must be in [0, 1], got ${outcome}`);
  const p = pCorrect(theta, d);
  return clampTheta(theta + CONFIG.k * weight * (outcome - p));
}

/** The Alcumus-style 0–100 score: P(correct on a reference question) × 100. */
export function score(theta: number): number {
  return Math.round(100 * pCorrect(theta, CONFIG.scoreAnchor));
}

/** Tier of a question rating (exam-anchored bands). Ratings below 1000 are Tier 1. */
export function tierOf(rating: number): Tier {
  if (rating >= TIER_FLOOR[6]) return 6;
  if (rating >= TIER_FLOOR[5]) return 5;
  if (rating >= TIER_FLOOR[4]) return 4;
  if (rating >= TIER_FLOOR[3]) return 3;
  if (rating >= TIER_FLOOR[2]) return 2;
  return 1;
}

/** Starting θ when a student places themselves at a tier (SPEC §5.3): the floor of that tier's band. */
export function placementTheta(tier: Tier = CONFIG.defaultStartTier): number {
  return TIER_FLOOR[tier];
}

/** Year level a placement mark comes from. */
export type MarkYear = 10 | 11 | 12;

/**
 * Starting tier from the student's current maths mark (SPEC §5.3): under 40% → Tier 1, 40–60% → Tier 2,
 * 60–75% → Tier 3, 75–100% → Tier 4. A Year 10 mark is one tier lower (never below Tier 1).
 */
export function placementTier(markPercent: number, year: MarkYear): Tier {
  const t = markPercent >= 75 ? 4 : markPercent >= 60 ? 3 : markPercent >= 40 ? 2 : 1;
  return Math.max(1, year === 10 ? t - 1 : t) as Tier;
}
