/**
 * Record a resolved question: update every skill it touches, save, and grant XP (SPEC §5, §12.4).
 * Shared by practice, quizzes and Section Challenges.
 */
import { takeSignals } from "./paste";
import { tierOf, XP, type RankLevel } from "@intellectify/engine";
import type { CourseBundle } from "./content";
import { indexSkills } from "./content";
import { computeRollups, getStartTier, reviseMarked, scoreMarked, scoreQuestion, type PartResult, type ResultSummary, type Served } from "./practice";
import type { MarkResult } from "@intellectify/content/marking";
import type { QuestionT } from "./content";
import type { ProfileStore } from "./profile.svelte";
import type { CourseProgressStore } from "./session.svelte";
import type { AchievementsStore } from "./achievements.svelte";
import { addHistory, type HistoryMode } from "./history";
import { onAppeal, onMarked } from "./achievements";

export async function recordResult(opts: {
  course: CourseBundle;
  store: CourseProgressStore;
  profile: ProfileStore | null;
  served: Served;
  parts: PartResult[];
  answers: string[];
  achievements?: AchievementsStore | null;
  mode?: HistoryMode;
}): Promise<{ summary: ResultSummary; xp: number }> {
  const { course, store, profile, served, parts } = opts;
  const question = served.question;
  const index = indexSkills(course);
  const before = store.progress.skills[question.skills.primary];
  const result = scoreQuestion(store.progress, question, parts, (id) => index.get(id)?.skill.size ?? "medium", getStartTier(course.id));
  const after = { ...store.progress, skills: { ...store.progress.skills, ...result.changes.skills }, responseSkills: { ...store.progress.responseSkills, ...result.changes.responseSkills } };
  const rollups = computeRollups(course, after);
  addHistory({
    course: course.id,
    skill: question.skills.primary,
    questionId: question.id,
    variant: served.variant,
    words: served.words,
    mode: opts.mode ?? "practice",
    answers: question.parts.map((_, i) => opts.answers[i] ?? ""),
    solvedOn: parts.map((p) => p.solvedOn),
    outcome: result.outcome,
    signals: takeSignals(),
  });

  // Rank-up XP for every rank newly reached, in content skills and response skills.
  let rankXp = 0;
  const gained = (before: RankLevel, now: RankLevel) => {
    for (let r = before + 1; r <= now; r++) rankXp += XP.rankUp(r);
  };
  for (const [id, st] of Object.entries(result.changes.skills)) gained((store.progress.skills[id]?.rank ?? 0) as RankLevel, st.rank as RankLevel);
  for (const [id, st] of Object.entries(result.changes.responseSkills)) gained((store.progress.responseSkills[id]?.rank ?? 0) as RankLevel, st.rank as RankLevel);

  await store.save(
    { ...result.changes, rollupRanks: rollups.ranks },
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      course: course.id,
      questionId: question.id,
      questionVersion: question.version,
      variant: served.variant,
      skill: question.skills.primary,
      rating: question.rating,
      outcome: result.outcome,
      parts: question.parts.map((p, i) => ({ id: p.id, solvedOn: parts[i]!.solvedOn, answers: [opts.answers[i] ?? ""] })),
      deltaTheta: result.primary.deltaTheta,
      at: Date.now(),
    },
  );
  profile?.countProblem();
  profile?.publishCourse(course, store.progress);
  await opts.achievements?.question(
    {
      skill: question.skills.primary,
      tier: tierOf(question.rating),
      outcome: result.outcome,
      firstTry: parts.every((p) => p.solvedOn === 1),
      lastSolvedOn: Math.max(0, ...parts.map((p) => p.solvedOn ?? 0)),
      crossSkill: question.skills.secondary.length > 0,
      before,
      after: result.changes.skills,
      at: Date.now(),
    },
    store,
    profile,
  );
  let xp = 0;
  if (profile) {
    xp = (await profile.grantQuestion(question.id, tierOf(question.rating), result.outcome)) + rankXp;
    if (rankXp) await profile.grant(rankXp);
  }
  return { summary: result, xp };
}

/** XP for every rank newly reached across the changed skills (content and response skills). */
function rankUpXp(store: CourseProgressStore, result: ResultSummary): number {
  let xp = 0;
  const gained = (before: RankLevel, now: RankLevel) => {
    for (let r = before + 1; r <= now; r++) xp += XP.rankUp(r);
  };
  for (const [id, st] of Object.entries(result.changes.skills)) gained((store.progress.skills[id]?.rank ?? 0) as RankLevel, st.rank as RankLevel);
  for (const [id, st] of Object.entries(result.changes.responseSkills)) gained((store.progress.responseSkills[id]?.rank ?? 0) as RankLevel, st.rank as RankLevel);
  return xp;
}

/**
 * Apply an LLM mark to a free-response answer (SPEC §6.3, §10.2): skills, response skills by rubric
 * dimension, XP and achievements, using θ as it is now (the answer may have been marked later).
 * `question` is the filled question that was marked.
 */
export async function recordMarked(opts: {
  course: CourseBundle;
  store: CourseProgressStore;
  profile: ProfileStore | null;
  achievements?: AchievementsStore | null;
  question: QuestionT;
  variant: number | null;
  answers: Record<string, string>;
  mark: MarkResult;
  jobId: string;
}): Promise<{ summary: ResultSummary; xp: number }> {
  const { course, store, profile, question } = opts;
  const index = indexSkills(course);
  const before = store.progress.skills[question.skills.primary];
  const result = scoreMarked(store.progress, question, opts.mark, (id) => index.get(id)?.skill.size ?? "medium", getStartTier(course.id));
  const after = { ...store.progress, skills: { ...store.progress.skills, ...result.changes.skills }, responseSkills: { ...store.progress.responseSkills, ...result.changes.responseSkills } };
  const rankXp = rankUpXp(store, result);
  await store.save(
    { ...result.changes, rollupRanks: computeRollups(course, after).ranks },
    {
      id: opts.jobId,
      course: course.id,
      questionId: question.id,
      questionVersion: question.version,
      variant: opts.variant,
      skill: question.skills.primary,
      rating: question.rating,
      outcome: result.outcome,
      parts: question.parts.map((p) => ({ id: p.id, solvedOn: result.outcome > 0 ? 1 : null, answers: [opts.answers[p.id] ?? ""] })),
      deltaTheta: result.primary.deltaTheta,
      at: Date.now(),
    },
  );
  profile?.countProblem();
  profile?.publishCourse(course, store.progress);
  await opts.achievements?.question(
    {
      skill: question.skills.primary,
      tier: tierOf(question.rating),
      outcome: result.outcome,
      firstTry: result.outcome > 0.6,
      lastSolvedOn: result.outcome > 0 ? 1 : 0,
      crossSkill: question.skills.secondary.length > 0,
      before,
      after: result.changes.skills,
      at: Date.now(),
    },
    store,
    profile,
    (st) => onMarked(st, { score: opts.mark.score }),
  );
  let xp = 0;
  if (profile) {
    xp = (await profile.grantWritten(question.id, tierOf(question.rating), opts.mark.score)) + rankXp;
    if (rankXp) await profile.grant(rankXp);
  }
  return { summary: result, xp };
}

/** Correct an applied mark after its appeal (SPEC §10.3). The re-mark is final, up or down; XP isn't clawed back. */
export async function recordAppeal(opts: {
  course: CourseBundle;
  store: CourseProgressStore;
  profile: ProfileStore | null;
  question: QuestionT;
  first: MarkResult;
  second: MarkResult;
  achievements?: AchievementsStore | null;
}): Promise<{ summary: ResultSummary; xp: number }> {
  const { course, store, profile, question } = opts;
  const index = indexSkills(course);
  const result = reviseMarked(store.progress, question, opts.first, opts.second, (id) => index.get(id)?.skill.size ?? "medium", getStartTier(course.id));
  const after = { ...store.progress, skills: { ...store.progress.skills, ...result.changes.skills }, responseSkills: { ...store.progress.responseSkills, ...result.changes.responseSkills } };
  const rankXp = rankUpXp(store, result);
  await store.save({ ...result.changes, rollupRanks: computeRollups(course, after).ranks }, null);
  opts.profile?.publishCourse(course, store.progress);
  await opts.achievements?.event((st) => onAppeal(st, { before: opts.first.score, after: opts.second.score }), store, profile);
  if (profile && rankXp) await profile.grant(rankXp);
  return { summary: result, xp: rankXp };
}
