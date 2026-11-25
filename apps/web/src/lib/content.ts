import type { BundleSkill, CourseBundle, QuestionT } from "@intellectify/content";

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

export interface TutorialT {
  skill: string;
  terms: { term: string; definition: string }[];
  markdown: string;
}

/** A skill's tutorial (SPEC §3.2), or null if it hasn't been written yet. */
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
