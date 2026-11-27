/**
 * Subsections (SPEC §3): the named points within a skill ("Pascal's rule"). A filter value names the skill
 * too, "<skill id>/<subsection>", because two skills may use the same name.
 */
import type { CourseBundle } from "./content";

export const subKey = (skill: string, name: string) => `${skill}/${name}`;

export function parseSubKey(key: string): { skill: string; name: string } | null {
  const i = key.indexOf("/");
  return i > 0 && i < key.length - 1 ? { skill: key.slice(0, i), name: key.slice(i + 1) } : null;
}

/** Does a question (by its primary skill and subsection) match a subsection filter value? Empty matches all. */
export function inSubsection(q: { skill: string; subsection: string }, key: string): boolean {
  if (!key) return true;
  const s = parseSubKey(key);
  return !!s && q.skill === s.skill && q.subsection === s.name;
}

/** Skills with subsections, in course order, optionally just one skill. */
export function subsectionGroups(course: CourseBundle, skill = ""): { id: string; name: string; subsections: string[] }[] {
  return course.units
    .flatMap((u) => u.sections.flatMap((s) => s.skills))
    .filter((k) => k.subsections.length && (!skill || k.id === skill))
    .map((k) => ({ id: k.id, name: k.name, subsections: k.subsections }));
}
