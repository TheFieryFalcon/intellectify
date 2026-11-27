/**
 * Question index (SPEC §15.3a): a small listing of every question in a course, for the Questions pages.
 * Full questions (with solutions) load from `source` only when opened. Browser-safe.
 */
import { tierOf } from "@intellectify/engine";
import type { CourseBundle } from "./build.js";
import type { SectionReviews, UnitReviews } from "./reviews.js";
import type { QuestionT } from "./schema.js";

export interface QuestionIndexEntry {
  id: string;
  title: string;
  /** Primary skill, and every tagged skill. */
  skill: string;
  skills: string[];
  /** The point within the primary skill, in words (SPEC §3). */
  subsection: string;
  section: string;
  unit: number;
  year: number;
  rating: number;
  tier: number;
  /** Written (LLM-marked) or auto-marked. */
  kind: "written" | "auto";
  /** Answer types of the auto-marked parts (numeric, mcq, vector, …). */
  answerTypes: string[];
  /** Response skills it exercises (reasoning, proof, calculation, …). */
  tags: string[];
  pool: QuestionT["pool"];
  /** Draws on a later unit's content (Section Challenges only, SPEC §8.4). */
  later: boolean;
  calculator: boolean;
  variants: number;
  /** File (under content/<course>/) that holds the full question. */
  source: string;
}

/** "pair-together" → "Pair together"; a question's own `title` wins. */
export const questionTitle = (q: Pick<QuestionT, "id"> & { title?: string }) =>
  q.title ?? q.id.split(".").pop()!.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export function buildQuestionIndex(
  course: CourseBundle,
  questions: Record<string, QuestionT[]>,
  sectionReviews: Record<string, SectionReviews<QuestionT>>,
  unitReviews: Record<number, UnitReviews<QuestionT>>,
): QuestionIndexEntry[] {
  const where = new Map<string, { section: string; unit: number; year: number }>();
  for (const u of course.units) for (const s of u.sections) for (const k of s.skills) where.set(k.id, { section: s.id, unit: u.number, year: u.year });
  const entry = (q: QuestionT, source: string): QuestionIndexEntry => {
    const at = where.get(q.skills.primary) ?? { section: "", unit: 0, year: 0 };
    return {
      id: q.id,
      title: questionTitle(q),
      skill: q.skills.primary,
      skills: [q.skills.primary, ...q.skills.secondary],
      subsection: q.subsection ?? "",
      ...at,
      rating: q.rating,
      tier: tierOf(q.rating),
      kind: q.parts.some((p) => p.rubric) ? "written" : "auto",
      answerTypes: [...new Set(q.parts.flatMap((p) => (p.answer ? [p.answer.type] : [])))],
      tags: Object.keys(q.responseSkills),
      pool: q.pool,
      later: q.requires.length > 0,
      calculator: q.requiresCalculator,
      variants: q.variants?.length ?? 1,
      source,
    };
  };
  return [
    ...Object.entries(questions).flatMap(([skill, qs]) => qs.map((q) => entry(q, `questions/${skill}.json`))),
    ...Object.entries(sectionReviews).flatMap(([id, r]) => [...r.sectionQuiz, ...r.challenge].map((q) => entry(q, `reviews/section-${id}.json`))),
    ...Object.entries(unitReviews).flatMap(([n, r]) => r.unitQuiz.map((q) => entry(q, `reviews/unit-${n}.json`))),
  ];
}
