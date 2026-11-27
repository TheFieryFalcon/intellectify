/**
 * Keeping an anonymous student's progress when they sign up or log in (SPEC §2.1a).
 * Adding a login to the anonymous account keeps everything as it is (same account). When they log in
 * to an account that already exists, the anonymous progress is merged into it with these rules.
 */
import type { AchievementRecord, CourseProgress, Profile, StoredSkillState } from "./backend/types";
import { roll } from "./activity";

/** The state with more resolved questions wins (the more practiced one); ties go to the newer. */
const better = (a: StoredSkillState | undefined, b: StoredSkillState | undefined): StoredSkillState | undefined => {
  if (!a) return b;
  if (!b) return a;
  if (a.resolved !== b.resolved) return a.resolved > b.resolved ? a : b;
  return (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? a : b;
};

const mergeStates = (target: Record<string, StoredSkillState>, from: Record<string, StoredSkillState>) => {
  const out: Record<string, StoredSkillState> = {};
  for (const id of new Set([...Object.keys(target), ...Object.keys(from)])) {
    const pick = better(target[id], from[id]);
    if (pick && pick !== target[id]) out[id] = pick;
  }
  return out;
};

/** Only the states that change in the target account (what has to be written). */
export function mergeProgress(target: CourseProgress, from: CourseProgress) {
  const rollupRanks = { ...target.rollupRanks };
  for (const [k, r] of Object.entries(from.rollupRanks)) rollupRanks[k] = Math.max(rollupRanks[k] ?? 0, r) as typeof r;
  return { skills: mergeStates(target.skills, from.skills), responseSkills: mergeStates(target.responseSkills, from.responseSkills), rollupRanks };
}

/** XP adds up; the account keeps its own placement, daily record and name, filling gaps from the anonymous one. */
export function mergeProfile(target: Profile, from: Profile, day: string): Profile {
  const questionXpAt = { ...from.questionXpAt };
  for (const [q, t] of Object.entries(target.questionXpAt)) questionXpAt[q] = Math.max(questionXpAt[q] ?? 0, t);
  let stats = roll(target.stats, day);
  const extra = roll(from.stats, day);
  stats = {
    ...stats,
    problems: stats.problems + extra.problems,
    dayProblems: stats.dayProblems + extra.dayProblems,
    weekProblems: stats.weekProblems + extra.weekProblems,
    weekXp: stats.weekXp + extra.weekXp,
    monthXp: stats.monthXp + extra.monthXp,
  };
  return {
    ...target,
    xp: target.xp + from.xp,
    questionXpAt,
    placement: target.placement ?? from.placement,
    daily: target.daily ?? from.daily,
    stats,
  };
}

/** Earned achievements combine (earliest date wins); the stats with more recorded activity are kept. */
export function mergeAchievements(target: AchievementRecord | null, from: AchievementRecord | null): AchievementRecord | null {
  if (!from) return target;
  if (!target) return from;
  const earned = { ...from.earned };
  for (const [id, t] of Object.entries(target.earned)) earned[id] = Math.min(earned[id] ?? Infinity, t);
  const weight = (r: AchievementRecord) => Object.values((r.stats as { counts?: Record<string, number> })?.counts ?? {}).reduce((a, b) => a + b, 0);
  return { stats: weight(from) > weight(target) ? from.stats : target.stats, earned };
}

