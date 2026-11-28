import type { BundleSkill, CourseBundle, QuestionT } from "@intellectify/content";
import type { SectionReviews, UnitReviews } from "@intellectify/content/reviews";
import type { WordLists } from "@intellectify/content/template";
import type { QuestionIndexEntry } from "@intellectify/content/question-index";
export type { QuestionIndexEntry };

export type { BundleSkill, CourseBundle, QuestionT };

type Fetch = typeof fetch;
const courseCache = new Map<string, Promise<CourseBundle>>();
const questionCache = new Map<string, Promise<QuestionT[]>>();

/** The course bundle built by `pnpm content` (static JSON on the CDN). */
export function loadCourse(fetchFn: Fetch, id: string): Promise<CourseBundle> {
  if (!courseCache.has(id)) {
    courseCache.set(
      id,
      fetchFn(`/content/${id}/course.json`).then((r) => {
        if (!r.ok) throw new Error(`Course "${id}" not found`);
        return r.json() as Promise<CourseBundle>;
      }),
    );
  }
  return courseCache.get(id)!;
}

let wordsPromise: Promise<WordLists> | null = null;
let wordsLoaded: WordLists = {};
/** Word lists for word variety (SPEC §9.6), shared by every course. Await before serving questions. */
export function loadWords(fetchFn: Fetch): Promise<WordLists> {
  wordsPromise ??= fetchFn("/content/words.json")
    .then((r) => (r.ok ? (r.json() as Promise<WordLists>) : {}))
    .then((w) => (wordsLoaded = w));
  return wordsPromise;
}
/** The word lists, once loadWords has resolved. */
export const wordLists = (): WordLists => wordsLoaded;

/** Questions whose primary skill is `skillId`. Missing file = no questions yet. */
export function loadQuestions(fetchFn: Fetch, course: string, skillId: string): Promise<QuestionT[]> {
  const key = `${course}/${skillId}`;
  if (!questionCache.has(key)) {
    questionCache.set(
      key,
      fetchFn(`/content/${course}/questions/${skillId}.json`).then((r) => (r.ok ? (r.json() as Promise<QuestionT[]>) : [])),
    );
  }
  return questionCache.get(key)!;
}

const indexCache = new Map<string, Promise<QuestionIndexEntry[]>>();
/** Every question in a course, as a small listing (SPEC §16.3a). */
export function loadQuestionIndex(fetchFn: Fetch, course: string): Promise<QuestionIndexEntry[]> {
  if (!indexCache.has(course)) indexCache.set(course, fetchFn(`/content/${course}/question-index.json`).then((r) => (r.ok ? r.json() : [])));
  return indexCache.get(course)!;
}

const sourceCache = new Map<string, Promise<QuestionT[]>>();
/** The full question for an index entry (its practice or review file, loaded once). */
export async function loadIndexedQuestion(fetchFn: Fetch, course: string, entry: Pick<QuestionIndexEntry, "id" | "source">): Promise<QuestionT | null> {
  const key = `${course}/${entry.source}`;
  if (!sourceCache.has(key))
    sourceCache.set(
      key,
      fetchFn(`/content/${course}/${entry.source}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d: QuestionT[] | Record<string, QuestionT[]>) => (Array.isArray(d) ? d : Object.values(d).flat())),
    );
  return (await sourceCache.get(key)!).find((q) => q.id === entry.id) ?? null;
}

/** Review pools (SPEC §8): a section's quiz and Challenge pools, and a unit's quiz pool. Missing = empty. */
export function loadSectionReviews(fetchFn: Fetch, course: string, section: string): Promise<SectionReviews<QuestionT>> {
  return fetchFn(`/content/${course}/reviews/section-${section}.json`).then((r) => (r.ok ? r.json() : { sectionQuiz: [], challenge: [] }));
}
export function loadUnitReviews(fetchFn: Fetch, course: string, unit: number): Promise<UnitReviews<QuestionT>> {
  return fetchFn(`/content/${course}/reviews/unit-${unit}.json`).then((r) => (r.ok ? r.json() : { unitQuiz: [] }));
}

export interface TutorialT {
  skill: string;
  terms: { term: string; definition: string }[];
  markdown: string;
}

/** A skill's tutorial (SPEC §3.1), or null if it hasn't been written yet. */
export function loadTutorial(fetchFn: Fetch, course: string, skillId: string): Promise<TutorialT | null> {
  return fetchFn(`/content/${course}/tutorials/${skillId}.json`).then((r) => (r.ok ? (r.json() as Promise<TutorialT>) : null));
}

export interface SkillIndexEntry {
  skill: BundleSkill;
  unit: number;
  year: number;
  section: { id: string; code: string; name: string };
}

/** Flat lookup of skills with their unit and section. */
export function indexSkills(course: CourseBundle): Map<string, SkillIndexEntry> {
  const map = new Map<string, SkillIndexEntry>();
  for (const u of course.units)
    for (const s of u.sections)
      for (const k of s.skills) map.set(k.id, { skill: k, unit: u.number, year: u.year, section: { id: s.id, code: s.code, name: s.name } });
  return map;
}

/** Skills that list `id` as a suggested prerequisite. */
export function dependentsOf(course: CourseBundle, id: string): BundleSkill[] {
  return course.units.flatMap((u) => u.sections.flatMap((s) => s.skills.filter((k) => k.prereqs.includes(id))));
}
