/** Skill id → its course and name, across every course, for related-skill chips on cards (SPEC §13.7). */
import { loadCourse } from "./content";

let memo: Promise<Map<string, { course: string; name: string }>> | null = null;
export function skillNames(): Promise<Map<string, { course: string; name: string }>> {
  memo ??= (async () => {
    const out = new Map<string, { course: string; name: string }>();
    const index = (await fetch("/content/index.json").then((r) => (r.ok ? r.json() : []))) as { id: string }[];
    for (const c of index) {
      const bundle = await loadCourse(fetch, c.id).catch(() => null);
      for (const u of bundle?.units ?? []) for (const s of u.sections) for (const k of s.skills) out.set(k.id, { course: c.id, name: k.name });
    }
    return out;
  })();
  return memo;
}
