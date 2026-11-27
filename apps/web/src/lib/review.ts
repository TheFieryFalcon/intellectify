/**
 * Section and unit reviews (SPEC §8.2–8.4): quizzes with a fixed tier mix, and Section Challenges.
 * Pure functions, so they can be tested without the app.
 */
import { tierOf, type Tier } from "@intellectify/engine";
import { challengeLength, QUIZ_MIX, slopeOf } from "@intellectify/content/reviews";
export { slopeOf };
import type { QuestionT } from "./content";
import { serveOne, type Served } from "./practice";

export { challengeLength, QUIZ_MIX };

/** Group a review pool by primary skill, for round-robin picking. */
export const bySkill = (qs: QuestionT[]): Map<string, QuestionT[]> => {
  const m = new Map<string, QuestionT[]>();
  for (const q of qs) m.set(q.skills.primary, [...(m.get(q.skills.primary) ?? []), q]);
  return m;
};

type Rand = () => number;
const shuffle = <T>(xs: T[], rand: Rand): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/** Fill a random variant and pick words, as practice does. */
export const serve = (q: QuestionT, rand: Rand = Math.random): Served => serveOne(q, rand);

/**
 * Build a quiz: for each tier in the mix, take questions round-robin across skills (so every skill
 * is represented), falling back to the nearest tier when a tier runs short. Written questions included:
 * they're marked in the background (SPEC §10.2).
 */
export function buildQuiz(pools: Map<string, QuestionT[]>, mix: Partial<Record<Tier, number>>, rand: Rand = Math.random): Served[] {
  const used = new Set<string>();
  const byTier = (skill: string, t: number) => shuffle((pools.get(skill) ?? []).filter((q) => tierOf(q.rating) === t && !used.has(q.id)), rand);
  const skills = [...pools.keys()];
  const picked: QuestionT[] = [];
  let turn = 0;
  for (const [tierKey, count] of Object.entries(mix)) {
    const tier = Number(tierKey);
    for (let n = 0; n < (count ?? 0); n++) {
      // Nearest tier first: tier, then tier ∓ 1, then ∓ 2.
      let q: QuestionT | undefined;
      for (const t of [tier, tier - 1, tier + 1, tier - 2, tier + 2]) {
        for (let k = 0; k < skills.length && !q; k++) q = byTier(skills[(turn + k) % skills.length]!, t)[0];
        if (q) break;
      }
      turn++;
      if (!q) continue;
      used.add(q.id);
      picked.push(q);
    }
  }
  // Easiest first, so the quiz builds up.
  return picked.sort((a, b) => a.rating - b.rating).map((q) => serve(q, rand));
}

export type { ChallengeState } from "./backend/types";
