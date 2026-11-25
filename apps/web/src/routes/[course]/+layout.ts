import { error } from "@sveltejs/kit";
import { loadCourse } from "$lib/content";

export async function load({ fetch, params }) {
  try {
    return { course: await loadCourse(fetch, params.course) };
  } catch {
    error(404, `There's no course called "${params.course}".`);
  }
}
