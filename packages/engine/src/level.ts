/**
 * Global level and XP (docs/SPEC.md §12.4).
 * Going from L to L + 1 costs 101 + 2L, plus an early-levels extra that is 60 at level 1 and shrinks
 * evenly to 0 at level 50: new students earn fast (first-visit, tutorial, rank-up and daily bonuses), so
 * the first levels take about 10 minutes each instead of a few. From level 50 the curve is unchanged.
 * At about 600 XP per hour, level 500 (Solarium) takes about 500 hours.
 */
const CURVE = 101;
/** The early-levels extra: EARLY_EXTRA × (EARLY_UNTIL − L) / (EARLY_UNTIL − 1) on top of level L's cost, for L < EARLY_UNTIL. */
const EARLY_EXTRA = 60;
const EARLY_UNTIL = 50;

/** One level's early extra, a whole number (so level costs never go down). */
const earlyAt = (L: number) => (L < EARLY_UNTIL ? Math.round((EARLY_EXTRA * (EARLY_UNTIL - L)) / (EARLY_UNTIL - 1)) : 0);
/** The early extra summed over levels 1 … m. */
const EARLY_SUMS = [0];
for (let L = 1; L < EARLY_UNTIL; L++) EARLY_SUMS.push(EARLY_SUMS[L - 1]! + earlyAt(L));
const earlyExtra = (m: number) => EARLY_SUMS[Math.max(0, Math.min(m, EARLY_UNTIL - 1))]!;

export const LEVEL_TIERS = [
  { key: "basic", name: "Basic", minLevel: 1 },
  { key: "bronze", name: "Bronze", minLevel: 10 },
  { key: "silver", name: "Silver", minLevel: 25 },
  { key: "gold", name: "Gold", minLevel: 50 },
  { key: "platinum", name: "Platinum", minLevel: 100 },
  { key: "diamond", name: "Diamond", minLevel: 150 },
  { key: "ruby", name: "Ruby", minLevel: 200 },
  { key: "tanzanite", name: "Tanzanite", minLevel: 300 },
  { key: "vibranium", name: "Vibranium", minLevel: 400 },
  { key: "solarium", name: "Solarium", minLevel: 500 },
  { key: "antimatter", name: "Antimatter", minLevel: 750 },
] as const;
export type LevelTier = (typeof LEVEL_TIERS)[number];

/** Total XP needed to reach `level`. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level + CURVE) + earlyExtra(level - 1);
}

/** Level reached with `xp` total XP (no cap). */
export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  // Solve (L − 1)(L + c) = xp, i.e. L² + (c − 1)L − (c + xp) = 0, then correct for rounding.
  const b = CURVE - 1;
  let level = Math.floor((-b + Math.sqrt(b * b + 4 * (CURVE + xp))) / 2);
  while (xpForLevel(level + 1) <= xp) level++;
  while (level > 1 && xpForLevel(level) > xp) level--;
  return Math.max(1, level);
}

export function tierForLevel(level: number): LevelTier {
  let tier: LevelTier = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) if (level >= t.minLevel) tier = t;
  return tier;
}

export interface LevelProgress {
  level: number;
  tier: LevelTier;
  /** XP earned since the start of the current level. */
  into: number;
  /** XP the current level needs in total (101 + 2L, plus the early extra below level 50). */
  needed: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  return { level, tier: tierForLevel(level), into: xp - xpForLevel(level), needed: xpForLevel(level + 1) - xpForLevel(level) };
}

/* ───────────────────────── XP sources (SPEC §12.4, starting values) ───────────────────────── */

const CORRECT_XP: Record<number, number> = { 1: 10, 2: 16, 3: 24, 4: 36, 5: 60 };
const RANK_UP_XP: Record<number, number> = { 1: 40, 2: 80, 3: 160, 4: 280, 5: 500 };
const EFFORT_XP = 4;

export const XP = {
  /** A resolved auto-marked question. `outcome` > 0 counts as correct, scaled by credit. */
  question(tier: number, outcome: number): number {
    if (outcome <= 0) return EFFORT_XP;
    return Math.max(EFFORT_XP, Math.round((CORRECT_XP[Math.min(tier, 5)] ?? 60) * outcome));
  },
  /** A marked free-response answer with rubric score s ∈ [0, 1]. */
  freeResponse(tier: number, s: number): number {
    return Math.round(24 * tier * s);
  },
  tutorialFirstRead: 40,
  sectionQuiz: 50,
  unitQuiz: 100,
  sectionChallenge: 200,
  daily(tier: number): number {
    return 30 + 10 * tier;
  },
  monthlyMilestone: 100,
  rankUp(rank: number): number {
    return RANK_UP_XP[rank] ?? 0;
  },
  achievement(points: number): number {
    return 4 * points;
  },
  discussionPost: 20,
  confirmedReport: 50,
  firstVisitOfDay: 20,
} as const;

/** A question answered again within this window earns no XP. */
export const XP_REPEAT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
