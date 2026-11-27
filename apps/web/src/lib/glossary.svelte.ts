/**
 * Course glossary (SPEC §3.2): terms defined in tutorials. Wherever a term appears in a tutorial,
 * question or solution, its first mention shows the definition on hover, tap or focus.
 */
export interface GlossaryTerm {
  term: string;
  definition: string;
  skill: string;
}

const state = $state<{ course: string | null; terms: GlossaryTerm[] }>({ course: null, terms: [] });
const cache = new Map<string, Promise<GlossaryTerm[]>>();

/** Load a course's glossary once and make it the active one. */
export async function useGlossary(fetchFn: typeof fetch, course: string): Promise<void> {
  if (!cache.has(course))
    cache.set(course, fetchFn(`/content/${course}/glossary.json`).then((r) => (r.ok ? (r.json() as Promise<GlossaryTerm[]>) : [])).catch(() => []));
  const terms = await cache.get(course)!;
  state.course = course;
  state.terms = terms;
}

/** The active glossary's terms (reactive). */
export const glossaryTerms = (): GlossaryTerm[] => state.terms;
