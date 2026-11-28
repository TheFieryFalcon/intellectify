/**
 * Achievement definitions (SPEC §12.1): content/achievements.yaml.
 * The build checks them against the spec's tier table, then writes static JSON for the app.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

export const ACHIEVEMENT_TIERS = {
  platinum: { points: 10, count: 26, secret: 1 },
  diamond: { points: 25, count: 25, secret: 2 },
  ruby: { points: 50, count: 21, secret: 4 },
  tanzanite: { points: 100, count: 17, secret: 4 },
  vibranium: { points: 250, count: 14, secret: 5 },
  solarium: { points: 600, count: 5, secret: 2 },
  antimatter: { points: 1500, count: 3, secret: 2 },
} as const;

const rank = z.number().int().min(1).max(5);
export const Rule = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("count"), stat: z.string(), gte: z.number().positive() }),
  z.object({ kind: z.literal("best"), stat: z.string(), gte: z.number().positive() }),
  z.object({ kind: z.literal("flag"), flag: z.string() }),
  z.object({ kind: z.literal("pending"), feature: z.string() }),
  z.object({ kind: z.literal("skillsAtRank"), rank, count: z.union([z.number().int().positive(), z.literal("all")]) }),
  z.object({ kind: z.literal("sectionAllAtRank"), rank }),
  z.object({ kind: z.literal("unitRank"), rank }),
  z.object({ kind: z.literal("courseRank"), rank }),
  z.object({ kind: z.literal("responseAllAtRank"), rank }),
  z.object({ kind: z.literal("responseSkillsAtRank"), skills: z.array(z.string()).min(1), rank }),
  z.object({ kind: z.literal("unitEverySectionHasRank"), rank }),
  z.object({ kind: z.literal("unitEverySkillResolved"), min: z.number().int().positive() }),
  z.object({ kind: z.literal("challengeAvg"), min: z.number().min(0).max(1) }),
  z.object({ kind: z.literal("unitChallenges"), min: z.number().min(0).max(1) }),
  z.object({ kind: z.literal("allChallenges"), min: z.number().min(0).max(1) }),
  z.object({ kind: z.literal("challengeSweep") }),
  z.object({ kind: z.literal("yearUnitsAtRank"), rank }),
  z.object({ kind: z.literal("yearPerfectUnitQuizzes") }),
  z.object({ kind: z.literal("contrapositive") }),
  z.object({ kind: z.literal("fractal") }),
  z.object({ kind: z.literal("totalMastery") }),
  // The Lemma economy (SPEC §13), account-wide: a counted stat, or a one-off feat.
  z.object({ kind: z.literal("economy"), stat: z.enum(["packsOpened", "institutes", "theoremLevels", "fullStaff", "foils", "cards", "sets", "warps", "diamondEras"]), gte: z.number().positive() }),
  z.object({ kind: z.literal("economyFeat"), feat: z.string() }),
]);

export const Achievement = z.object({
  id: z.string().regex(/^[PDRTVSA]\d+$/),
  name: z.string().min(1),
  tier: z.enum(Object.keys(ACHIEVEMENT_TIERS) as [keyof typeof ACHIEVEMENT_TIERS, ...(keyof typeof ACHIEVEMENT_TIERS)[]]),
  points: z.number().int().positive(),
  secret: z.boolean().default(false),
  /** Tanzanite and up: the unique title it unlocks (SPEC §13.9). */
  title: z.string().min(1).optional(),
  criterion: z.string().min(1),
  rule: Rule,
});
export type AchievementT = z.infer<typeof Achievement>;

export function loadAchievements(contentDir: string, errors: string[]): AchievementT[] {
  const path = join(contentDir, "achievements.yaml");
  if (!existsSync(path)) return [];
  const parsed = z.array(Achievement).safeParse(parseYaml(readFileSync(path, "utf8")));
  if (!parsed.success) {
    errors.push(`achievements.yaml: ${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    return [];
  }
  const list = parsed.data;
  if (new Set(list.map((a) => a.id)).size !== list.length) errors.push("achievements.yaml: duplicate IDs");
  for (const [tier, spec] of Object.entries(ACHIEVEMENT_TIERS)) {
    const inTier = list.filter((a) => a.tier === tier);
    if (inTier.length !== spec.count) errors.push(`achievements.yaml: ${tier} has ${inTier.length} achievements; the spec says ${spec.count}`);
    if (inTier.filter((a) => a.secret).length !== spec.secret) errors.push(`achievements.yaml: ${tier} has ${inTier.filter((a) => a.secret).length} secret; the spec says ${spec.secret}`);
    for (const a of inTier) if (a.points !== spec.points) errors.push(`achievements.yaml: ${a.id} has ${a.points} points; ${tier} is worth ${spec.points}`);
  }
  return list;
}
