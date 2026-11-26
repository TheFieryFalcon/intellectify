/**
 * Section and unit reviews (SPEC §8.2–8.4): quizzes with a fixed tier mix, and Section Challenges.
 * Pure functions, so they can be tested without the app.
 */
import { tierOf, type Tier } from "@intellectify/engine";
import { fillTemplate } from "@intellectify/content/template";
import type { QuestionT } from "./content";
import { isAutoMarked, type Served } from "./practice";

/** Questions per tier (SPEC §8.2, §8.3). Config-driven. */
export const QUIZ_MIX: Record<"section" | "unit", Partial<Record<Tier, number>>> = {
  section: { 1: 2, 2: 2, 3: 3, 4: 1 },
  unit: { 1: 2, 2: 4, 3: 6, 4: 3 },
};

/** Section Challenge length scales with section size: its dot points, clamped to 10–25 (SPEC §8.4). */
export const challengeLength = (dotPointCount: number) => Math.max(10, Math.min(25, dotPointCount));

type Rand = () => number;
const shuffle = <T>(xs: T[], rand: Rand): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/** Fill a random variant, as practice does. */
export function serve(q: QuestionT, rand: Rand = Math.random): Served {
  if (!q.variants?.length) return { question: q, variant: null };
  const variant = Math.floor(rand() * q.variants.length);
  return { question: fillTemplate(q, q.variants[variant]!), variant };
}

/**
 * Build a quiz: for each tier in the mix, take questions round-robin across skills (so every skill
 * is represented), falling back to the nearest tier when a tier runs short. Auto-marked questions only.
 */
export function buildQuiz(pools: Map<string, QuestionT[]>, mix: Partial<Record<Tier, number>>, rand: Rand = Math.random): Served[] {
  const used = new Set<string>();
  const byTier = (skill: string, t: number) => shuffle((pools.get(skill) ?? []).filter((q) => isAutoMarked(q) && tierOf(q.rating) === t && !used.has(q.id)), rand);
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

/** Pick Section Challenge problems: Tier 4–5, cross-skill problems first, spread across skills. */
export function buildChallenge(pools: Map<string, QuestionT[]>, length: number, rand: Rand = Math.random): QuestionT[] {
  const hard = [...pools.values()].flat().filter((q) => isAutoMarked(q) && q.rating >= 1550 && q.rating < 2000);
  const cross = shuffle(hard.filter((q) => q.skills.secondary.length > 0), rand);
  const bySkill = new Map<string, QuestionT[]>();
  for (const q of shuffle(hard.filter((q) => q.skills.secondary.length === 0), rand)) bySkill.set(q.skills.primary, [...(bySkill.get(q.skills.primary) ?? []), q]);
  const picked: QuestionT[] = cross.slice(0, Math.ceil(length / 3));
  // Then round-robin across skills until the challenge is full.
  const queues = [...bySkill.values()];
  for (let i = 0; picked.length < length && queues.some((qq) => qq.length); i++) {
    const q = queues[i % queues.length]!.shift();
    if (q) picked.push(q);
  }
  for (const q of cross.slice(Math.ceil(length / 3))) if (picked.length < length) picked.push(q);
  return picked.sort((a, b) => a.rating - b.rating);
}

export type { ChallengeState } from "./backend/types";
