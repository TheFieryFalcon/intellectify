/**
 * Record a resolved question: update every skill it touches, save, and grant XP (SPEC §5, §12.4).
 * Shared by practice, quizzes and Section Challenges.
 */
import { tierOf, XP, type RankLevel } from "@intellectify/engine";
import type { CourseBundle } from "./content";
import { indexSkills } from "./content";
import { computeRollups, scoreQuestion, type PartResult, type ResultSummary, type Served } from "./practice";
import type { ProfileStore } from "./profile.svelte";
import type { CourseProgressStore } from "./session.svelte";

export async function recordResult(opts: {
  course: CourseBundle;
  store: CourseProgressStore;
  profile: ProfileStore | null;
  served: Served;
  parts: PartResult[];
  answers: string[];
}): Promise<{ summary: ResultSummary; xp: number }> {
  const { course, store, profile, served, parts } = opts;
  const question = served.question;
  const index = indexSkills(course);
  const result = scoreQuestion(store.progress, question, parts, (id) => index.get(id)?.skill.size ?? "medium");
  const after = { ...store.progress, skills: { ...store.progress.skills, ...result.changes.skills }, responseSkills: { ...store.progress.responseSkills, ...result.changes.responseSkills } };
  const rollups = computeRollups(course, after);

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
  let xp = 0;
  if (profile) {
    xp = (await profile.grantQuestion(question.id, tierOf(question.rating), result.outcome)) + rankXp;
    if (rankXp) await profile.grant(rankXp);
  }
  return { summary: result, xp };
}
