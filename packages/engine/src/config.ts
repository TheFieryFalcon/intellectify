/**
 * Tunable constants for the rating and mastery engine (docs/SPEC.md §4–6).
 * Every number that the spec marks as "tunable" lives here.
 */

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;
export const TIERS: readonly Tier[] = [1, 2, 3, 4, 5, 6];

/** Lower bound of each tier's rating band (SPEC §4, exam-anchored bands). */
export const TIER_FLOOR: Record<Tier, number> = {
  1: 1000,
  2: 1250,
  3: 1400,
  4: 1550,
  5: 1700,
  6: 2000,
};

/** Ranks, lowest first. Index = rank level. Diamond = "Mastered". */
export const RANKS = ["unranked", "bronze", "silver", "gold", "platinum", "diamond"] as const;
export type RankName = (typeof RANKS)[number];
/** 0 = Unranked … 5 = Diamond. */
export type RankLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * θ needed for each rank; rank k corresponds to Tier k (SPEC §5.4).
 * Silver sits above the Tier 2 floor (1250, a score of only 8) at 1280, which displays as a score of 10.
 */
export const RANK_FLOOR: Record<Exclude<RankLevel, 0>, number> = {
  1: TIER_FLOOR[1],
  2: 1280,
  3: TIER_FLOOR[3],
  4: TIER_FLOOR[4],
  5: TIER_FLOOR[5],
};

/** Hidden hysteresis buffer per rank: rank k is lost only when θ < floor_k − buffer_k. Not shown to students. */
export const RANK_BUFFER: Record<Exclude<RankLevel, 0>, number> = {
  1: 25,
  2: 50,
  3: 45,
  4: 35,
  5: 30,
};

/** Correct answers at Tier ≥ k needed to unlock rank k, before the skill-size extra (SPEC §5.4). */
export const GATE_BASE: Record<Exclude<RankLevel, 0>, number> = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 };

/**
 * Skill sizes (SPEC §3.3). Bigger skills (foundational, difficult or heavily examined) get more questions
 * and take more to rank up: extra correct answers at every gate, and θ moves more slowly (K is scaled down).
 */
export type SkillSize = "small" | "medium" | "large" | "cornerstone";
export const SKILL_SIZES: readonly SkillSize[] = ["small", "medium", "large", "cornerstone"];
export const SKILL_SIZE: Record<SkillSize, { minQuestions: number; minTier5: number; gateExtra: number; kScale: number }> = {
  small: { minQuestions: 10, minTier5: 3, gateExtra: 0, kScale: 1 },
  medium: { minQuestions: 15, minTier5: 4, gateExtra: 0, kScale: 1 },
  large: { minQuestions: 25, minTier5: 5, gateExtra: 1, kScale: 0.85 },
  cornerstone: { minQuestions: 40, minTier5: 7, gateExtra: 2, kScale: 0.7 },
};

/** Correct answers at Tier ≥ k needed for rank k in a skill of this size. */
export const gateCount = (rank: Exclude<RankLevel, 0>, size: SkillSize = "medium"): number => GATE_BASE[rank] + SKILL_SIZE[size].gateExtra;

/** An outcome must exceed this to count toward a gate (SPEC §5.4). */
export const GATE_OUTCOME = 0.6;

export const CONFIG = {
  /** Logistic scale S in P(correct) = σ((θ − d) / S). */
  scale: 100,
  /** Elo-style step size K. */
  k: 32,
  /** Weight applied to secondary skills on cross-skill problems. */
  secondaryWeight: 0.5,
  /** θ clamp. */
  thetaMin: 800,
  thetaMax: 2300,
  /** Reference rating for the 0–100 score (SPEC §5.2). */
  scoreAnchor: 1500,
  /** Default starting tier for a new skill (SPEC §5.3). */
  defaultStartTier: 3 as Tier,
  /** Target probability of success when picking the next question (SPEC §5.7). */
  targetP: 0.65,
  /** Free-response: rubric scores below this earn no credit (SPEC §6.3). */
  freeResponseThreshold: 0.6,
} as const;

/** Attempts allowed and credit per successful attempt (SPEC §6.2). Tier 6 is unlimited with no penalty. */
export const ATTEMPT_CREDIT: Record<Exclude<Tier, 6>, readonly number[]> = {
  1: [1, 0.3],
  2: [1, 0.3],
  3: [1, 0.5],
  4: [1, 0.7, 0.49],
  5: [1, 0.9, 0.81, 0.729, 0.6561],
};
