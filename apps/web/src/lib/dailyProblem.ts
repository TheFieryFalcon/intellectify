/**
 * Rebuild the daily problem for any day and year group (SPEC §8.5). The same seed everywhere gives the
 * same question, variant and words, so the daily page and its discussion thread agree with no server.
 */
import { indexSkills, loadQuestions, loadWords, type CourseBundle, type QuestionT } from "./content";
import { dailyTarget, dailyTier, pickDaily, seededRandom, type YearGroup } from "./daily";
import { serveOne, type Served } from "./practice";

export const dailyKey = (day: string, course: string, year: YearGroup) => `${day}:${course}:${year}`;

export function parseDailyKey(key: string): { day: string; course: string; year: YearGroup } | null {
  const m = /^(\d{4}-\d{2}-\d{2}):([\w-]+):(11|12)$/.exec(key);
  return m ? { day: m[1]!, course: m[2]!, year: Number(m[3]) as YearGroup } : null;
}

export async function dailyProblem(fetchFn: typeof fetch, course: CourseBundle, day: string, year: YearGroup) {
  const skills = indexSkills(course);
  const target = dailyTarget(course.schedules, year, day, (id) => (skills.get(id)?.skill.questionCount ?? 0) > 0, [...skills.keys()]);
  const tier = dailyTier(day);
  if (!target) return { target, tier, served: null as Served | null };
  const [pools] = await Promise.all([Promise.all(target.skills.map((s) => loadQuestions(fetchFn, course.id, s))), loadWords(fetchFn)]);
  const key = dailyKey(day, course.id, year);
  const q = pickDaily(pools.flat() as QuestionT[], tier, seededRandom(key));
  return { target, tier, served: q ? serveOne(q, seededRandom(`${key}:serve`)) : null };
}
