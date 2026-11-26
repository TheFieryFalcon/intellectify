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

/** Where a placement mark comes from. */
export type MarkSource = "y10" | "y11-methods" | "y11-specialist" | "y12-methods" | "y12-specialist";

/** Starting tier per course. Methods questions sit a tier below Specialist ones, so Methods starts a tier higher. */
export interface PlacementTiers {
  specialist: Tier;
  methods: Tier;
}

const clampTier = (t: number) => Math.max(1, Math.min(5, t)) as Tier;

/**
 * Starting tiers from the student's current maths mark (SPEC §5.3).
 * Specialist or Year 10 mark: under 40% → Tier 1, 40–59% → Tier 2, 60–74% → Tier 3, 75–100% → Tier 4,
 *   then Methods one tier higher. A Year 10 mark is one tier lower (never below Tier 1).
 * Methods mark: the same bands plus 90–100% → Tier 5 for Methods, then Specialist one tier lower.
 */
export function placementTiers(markPercent: number, source: MarkSource): PlacementTiers {
  const band = markPercent >= 75 ? 4 : markPercent >= 60 ? 3 : markPercent >= 40 ? 2 : 1;
  if (source.endsWith("methods")) {
    const methods = clampTier(markPercent >= 90 ? 5 : band);
    return { methods, specialist: clampTier(methods - 1) };
  }
  const specialist = clampTier(source === "y10" ? band - 1 : band);
  return { specialist, methods: clampTier(specialist + 1) };
}
