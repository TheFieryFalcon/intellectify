/**
 * Achievements (SPEC §12.1): stats kept per course, updated after every resolved question, quiz and
 * challenge, then every rule in content/achievements.yaml is checked. Pure functions, so they're testable.
 */
import type { AchievementT } from "@intellectify/content";
import type { RankLevel } from "@intellectify/engine";
import type { CourseProgress, StoredSkillState } from "./backend";
import type { CourseBundle } from "./content";
import type { Rollups } from "./practice";

const DAY = 24 * 60 * 60 * 1000;

export interface AchievementStats {
  /** Running totals. */
  counts: Record<string, number>;
  /** Current streaks, and the best each has reached. */
  streaks: Record<string, number>;
  best: Record<string, number>;
  /** One-off events (secret achievements mostly). */
  flags: Record<string, boolean>;
  /** Highest rank lost under the buffer rule, per skill (for Comeback). */
  lostRank: Record<string, number>;
  /** Skills whose θ has been in the Tier 1 band (for Ouroboros). */
  sawTier1: Record<string, boolean>;
  /** Recent θ per skill, for Ascent: [time, θ] pairs from the last 7 days. */
  thetaLog: Record<string, [number, number][]>;
  /** Calendar-week counters (Perth, Monday start). */
  week: { key: string; firstTryT4: number; total: number; t4: number; allFirstTry: boolean };
  /** Unit quizzes with a perfect score, by unit number. */
  perfectUnitQuizUnits: number[];
  /** Best Section Challenge result per section. */
  challenges: Record<string, { best: number; swept: boolean }>;
  /** Since when every course skill has been at Diamond (for Diamond Hands). */
  allDiamondSince: number | null;
}

export const emptyStats = (): AchievementStats => ({
  counts: {},
  streaks: {},
  best: {},
  flags: {},
  lostRank: {},
  sawTier1: {},
  thetaLog: {},
  week: { key: "", firstTryT4: 0, total: 0, t4: 0, allFirstTry: true },
  perfectUnitQuizUnits: [],
  challenges: {},
  allDiamondSince: null,
});

/** Monday-start week key in Perth time, e.g. "2026-11-23". */
export function weekKey(t: number): string {
  const perth = new Date(t + 8 * 60 * 60 * 1000);
  const day = (perth.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(perth.getTime() - day * DAY);
  return monday.toISOString().slice(0, 10);
}

export interface QuestionEvent {
  skill: string;
  tier: number;
  outcome: number;
  /** Every part solved on the first attempt. */
  firstTry: boolean;
  /** The latest attempt any part was solved on (5 = a Tier 5 question's final attempt). */
  lastSolvedOn: number;
  crossSkill: boolean;
  before: StoredSkillState | undefined;
  /** Every skill state this question changed. */
  after: Record<string, StoredSkillState>;
  at: number;
}

const bump = (s: AchievementStats, key: string, by = 1) => (s.counts[key] = (s.counts[key] ?? 0) + by);
const streak = (s: AchievementStats, key: string, keep: boolean) => {
  s.streaks[key] = keep ? (s.streaks[key] ?? 0) + 1 : 0;
  s.best[key] = Math.max(s.best[key] ?? 0, s.streaks[key]!);
};

/** Update stats for a resolved question. Returns a new object. */
export function onQuestion(prev: AchievementStats, e: QuestionEvent): AchievementStats {
  const s: AchievementStats = structuredClone(prev);
  const correct = e.outcome > 0.6;
  if (correct && e.tier >= 3) bump(s, "correctT3");
  if (correct && e.tier === 5) bump(s, "correctT5");
  if (e.firstTry && e.tier === 4) bump(s, "firstTryT4");
  if (e.firstTry && e.tier === 5) bump(s, "firstTryT5");
  if (correct && e.crossSkill) bump(s, "crossSkillCorrect");
  if (e.tier >= 3) streak(s, "firstTryStreakT3", e.firstTry);
  if (e.tier >= 4) streak(s, "firstTryStreakT4", e.firstTry);
  if (e.tier === 5) streak(s, "firstTryStreakT5", e.firstTry);
  if (e.tier >= 3) streak(s, "noGiveUpStreakT3", e.outcome > 0);

  // Calendar week.
  const key = weekKey(e.at);
  if (s.week.key !== key) s.week = { key, firstTryT4: 0, total: 0, t4: 0, allFirstTry: true };
  s.week.total++;
  if (e.tier >= 4) s.week.t4++;
  if (e.firstTry && e.tier >= 4) s.week.firstTryT4++;
  if (!e.firstTry) s.week.allFirstTry = false;
  s.best.weekFirstTryT4 = Math.max(s.best.weekFirstTryT4 ?? 0, s.week.firstTryT4);
  if (s.week.total >= 100 && s.week.t4 * 2 >= s.week.total && s.week.allFirstTry) s.flags.unblemished = true;

  // One-off events.
  const before = e.before;
  const after = e.after[e.skill];
  if (e.tier === 5 && correct && e.lastSolvedOn === 5) s.flags.lastGasp = true;
  if (e.tier === 5 && e.firstTry && (before?.rank ?? 0) === 0) s.flags.contradiction = true;
  for (const [id, st] of Object.entries(e.after)) {
    if (Math.round(st.theta) === 1729) s.flags.taxicab = true;
    if (st.theta >= 2300) s.flags.eventHorizon = true;
    if (st.theta < 1250) s.sawTier1[id] = true;
    // Ascent: θ up 300 within 7 days.
    const log = (s.thetaLog[id] ?? []).filter(([t]) => e.at - t <= 7 * DAY);
    log.push([e.at, st.theta]);
    s.thetaLog[id] = log.slice(-60);
    if (st.theta - Math.min(...log.map(([, th]) => th)) >= 300) s.flags.ascent = true;
  }
  if (after && before) {
    if (after.rank < before.rank) s.lostRank[e.skill] = Math.max(s.lostRank[e.skill] ?? 0, before.rank);
    else if ((s.lostRank[e.skill] ?? 0) > 0 && after.rank >= s.lostRank[e.skill]! && after.rank > before.rank) s.flags.comeback = true;
  }
  if (after?.rank === 5 && (before?.rank ?? 0) < 5) {
    if (after.resolved <= 20) s.flags.grandmaster = true;
    if (s.sawTier1[e.skill]) s.flags.ouroboros = true;
  }
  return s;
}

/** Update stats for a finished quiz. */
export function onQuiz(prev: AchievementStats, e: { scope: "section" | "unit"; unit: number; correct: number; total: number; allFirstTry: boolean }): AchievementStats {
  const s: AchievementStats = structuredClone(prev);
  const perfect = e.correct === e.total && e.allFirstTry;
  if (e.scope === "section" && perfect) bump(s, "perfectSectionQuizzes");
  if (e.scope === "unit") {
    if (e.correct >= 13) bump(s, "unitQuiz13");
    if (perfect) {
      bump(s, "perfectUnitQuizzes");
      if (!s.perfectUnitQuizUnits.includes(e.unit)) s.perfectUnitQuizUnits.push(e.unit);
    }
  }
  return s;
}

/** Update stats for a finished Section Challenge. */
export function onChallenge(prev: AchievementStats, e: { section: string; average: number; allFirstTry: boolean }): AchievementStats {
  const s: AchievementStats = structuredClone(prev);
  const c = s.challenges[e.section] ?? { best: -1, swept: false };
  s.challenges[e.section] = { best: Math.max(c.best, e.average), swept: c.swept || e.allFirstTry };
  return s;
}

export interface EvalContext {
  course: CourseBundle;
  progress: CourseProgress;
  rollups: Rollups;
  now: number;
}

/** Diamond Hands needs to know how long every skill has been at Diamond; update that, then check every rule. */
export function evaluate(defs: AchievementT[], stats: AchievementStats, ctx: EvalContext, earned: Record<string, number>): { stats: AchievementStats; newly: AchievementT[] } {
  const s: AchievementStats = structuredClone(stats);
  const { course, progress, rollups } = ctx;
  const skills = course.units.flatMap((u) => u.sections.flatMap((sec) => sec.skills));
  const rank = (id: string): RankLevel => (progress.skills[id]?.rank ?? 0) as RankLevel;
  const rsRank = (id: string): RankLevel => (progress.responseSkills[id]?.rank ?? 0) as RankLevel;
  const allDiamond = skills.length > 0 && skills.every((k) => rank(k.id) === 5);
  s.allDiamondSince = allDiamond ? (s.allDiamondSince ?? ctx.now) : null;
  if (s.allDiamondSince !== null && ctx.now - s.allDiamondSince >= 90 * DAY) s.flags.diamondHands = true;

  const sections = course.units.flatMap((u) => u.sections);
  const years = [...new Set(course.units.map((u) => u.year))].map((y) => course.units.filter((u) => u.year === y));
  const challenge = (id: string) => s.challenges[id];

  const check = (a: AchievementT): boolean => {
    const r = a.rule;
    switch (r.kind) {
      case "pending":
        return false;
      case "count":
        return (s.counts[r.stat] ?? 0) >= r.gte;
      case "best":
        return (s.best[r.stat] ?? 0) >= r.gte;
      case "flag":
        return !!s.flags[r.flag];
      case "skillsAtRank": {
        const n = skills.filter((k) => rank(k.id) >= r.rank).length;
        return r.count === "all" ? skills.length > 0 && n === skills.length : n >= r.count;
      }
      case "sectionAllAtRank":
        return sections.some((sec) => sec.skills.every((k) => rank(k.id) >= r.rank));
      case "unitRank":
        return Object.values(rollups.units).some((u) => u.rank >= r.rank);
      case "courseRank":
        return rollups.course.rank >= r.rank;
      case "responseAllAtRank":
        return course.responseSkills.length > 0 && course.responseSkills.every((x) => rsRank(x.id) >= r.rank);
      case "responseSkillsAtRank":
        return r.skills.every((id) => rsRank(id) >= r.rank);
      case "unitEverySectionHasRank":
        return course.units.some((u) => u.sections.every((sec) => sec.skills.some((k) => rank(k.id) >= r.rank)));
      case "unitEverySkillResolved":
        return course.units.some((u) => u.sections.every((sec) => sec.skills.every((k) => (progress.skills[k.id]?.resolved ?? 0) >= r.min)));
      case "challengeAvg":
        return Object.values(s.challenges).some((c) => c.best >= r.min);
      case "unitChallenges":
        return course.units.some((u) => u.sections.every((sec) => (challenge(sec.id)?.best ?? -1) >= r.min));
      case "allChallenges":
        return sections.length > 0 && sections.every((sec) => (challenge(sec.id)?.best ?? -1) >= r.min);
      case "challengeSweep":
        return Object.values(s.challenges).some((c) => c.swept);
      case "yearUnitsAtRank":
        return years.some((us) => us.every((u) => (rollups.units[u.number]?.rank ?? 0) >= r.rank));
      case "yearPerfectUnitQuizzes":
        return years.some((us) => us.every((u) => s.perfectUnitQuizUnits.includes(u.number)));
      case "contrapositive":
        return skills.some((k) => rank(k.id) === 5 && k.prereqs.length > 0 && k.prereqs.every((p) => rank(p) < 3));
      case "fractal":
        // Every skill, section and unit of one year at one shared rank, Platinum or higher.
        return years.some((us) => {
          const ranks = new Set<number>([
            ...us.flatMap((u) => u.sections.flatMap((sec) => sec.skills.map((k) => rank(k.id)))),
            ...us.flatMap((u) => u.sections.map((sec) => rollups.sections[sec.id]?.rank ?? 0)),
            ...us.map((u) => rollups.units[u.number]?.rank ?? 0),
          ]);
          return ranks.size === 1 && [...ranks][0]! >= 4;
        });
      case "totalMastery":
        return (
          skills.length > 0 &&
          skills.every((k) => rank(k.id) === 5) &&
          course.responseSkills.every((x) => rsRank(x.id) === 5) &&
          sections.every((sec) => challenge(sec.id)?.swept)
        );
    }
  };
  const newly = defs.filter((a) => !earned[a.id] && check(a));
  return { stats: s, newly };
}
