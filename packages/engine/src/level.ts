/**
 * Global level and XP (docs/SPEC.md §12.4).
 * Total XP to reach level L is (L − 1)(L + 50); going from L to L + 1 costs 50 + 2L.
 */

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
  return (level - 1) * (level + 50);
}

/** Level reached with `xp` total XP (no cap). */
export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  // Solve (L − 1)(L + 50) = xp, i.e. L² + 49L − (50 + xp) = 0, then correct for rounding.
  let level = Math.floor((-49 + Math.sqrt(49 * 49 + 4 * (50 + xp))) / 2);
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
  /** XP the current level needs in total (50 + 2L). */
  needed: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  return { level, tier: tierForLevel(level), into: xp - xpForLevel(level), needed: xpForLevel(level + 1) - xpForLevel(level) };
}

/* ───────────────────────── XP sources (SPEC §12.4, starting values) ───────────────────────── */

const CORRECT_XP: Record<number, number> = { 1: 5, 2: 8, 3: 12, 4: 18, 5: 30 };
const RANK_UP_XP: Record<number, number> = { 1: 20, 2: 40, 3: 80, 4: 140, 5: 250 };

export const XP = {
  /** A resolved auto-marked question. `outcome` > 0 counts as correct, scaled by credit. */
  question(tier: number, outcome: number): number {
    if (outcome <= 0) return 2;
    return Math.max(2, Math.round((CORRECT_XP[Math.min(tier, 5)] ?? 30) * outcome));
  },
  /** A marked free-response answer with rubric score s ∈ [0, 1]. */
  freeResponse(tier: number, s: number): number {
    return Math.round(12 * tier * s);
  },
  tutorialFirstRead: 20,
  sectionQuiz: 25,
  unitQuiz: 50,
  sectionChallenge: 100,
  daily(tier: number): number {
    return 15 + 5 * tier;
  },
  monthlyMilestone: 50,
  rankUp(rank: number): number {
    return RANK_UP_XP[rank] ?? 0;
  },
  achievement(points: number): number {
    return 2 * points;
  },
  discussionPost: 10,
  confirmedReport: 25,
  firstVisitOfDay: 10,
} as const;

/** A question answered again within this window earns no XP. */
export const XP_REPEAT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
