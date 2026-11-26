import { error } from "@sveltejs/kit";
import { loadCourse } from "$lib/content";
import { useGlossary } from "$lib/glossary.svelte";

export async function load({ fetch, params }) {
  try {
    const [course] = await Promise.all([loadCourse(fetch, params.course), useGlossary(fetch, params.course)]);
    return { course };
  } catch {
    error(404, `There's no course called "${params.course}".`);
  }
}
