/**
 * Daily problem (SPEC §8.5): one problem per year group per day, the same for everyone, changing at
 * midnight Perth time. It targets the block of the course the year group has just learnt (from the
 * course outline and the WA school calendar), at the day's tier: Mon 1, Tue–Wed 2, Thu–Fri 3, Sat–Sun 4.
 * Picked deterministically from the date, so no server is needed.
 */
import { dateOfDay, schoolPosition, tierOf, type Tier } from "@intellectify/engine";
import type { CourseSchedule } from "@intellectify/content";
import type { QuestionT } from "./content";

export type YearGroup = 11 | 12;

/** The day's tier, by weekday (getUTCDay: Sun = 0). */
const WEEKDAY_TIER: Tier[] = [4, 1, 2, 2, 3, 3, 4];
export const dailyTier = (day: string): Tier => WEEKDAY_TIER[dateOfDay(day).getUTCDay()]!;

export interface DailyTarget {
  /** Skills the problem may come from. */
  skills: string[];
  /** What the year group is revising, for the label. */
  name: string;
  /** True when the block just learnt has no questions yet, so an earlier block stands in. */
  earlier: boolean;
}

/**
 * The skills a year group has just learnt on `day`: the latest outline block that has started (in the
 * holidays, the last one before them; in January, the end of the previous year), stepping back to the
 * nearest earlier block that has questions. A year group with no outline yet revises everything that
 * has questions.
 */
export function dailyTarget(schedules: CourseSchedule[], yearGroup: YearGroup, day: string, hasQuestions: (skill: string) => boolean, allSkills: string[]): DailyTarget | null {
  const date = dateOfDay(day);
  const own = schedules.filter((s) => s.yearGroup === yearGroup).sort((a, b) => b.year - a.year);
  const sched = own.find((s) => s.year <= date.getUTCFullYear()) ?? own[own.length - 1];
  if (!sched) {
    const skills = allSkills.filter(hasQuestions);
    return skills.length ? { skills, name: "Everything so far", earlier: false } : null;
  }
  const pos = schoolPosition(date);
  // Before Term 1 starts, the year group has just finished last year's outline.
  const order = !pos.inTerm && pos.term === 1 && pos.week === 1 ? 49 : pos.order;
  const started = sched.blocks.filter((b) => b.from <= order).sort((a, b) => b.from - a.from || b.to - a.to);
  const blocks = started.length ? started : [...sched.blocks].sort((a, b) => b.from - a.from);
  for (const [i, b] of blocks.entries()) {
    const skills = b.skills.filter(hasQuestions);
    if (skills.length) return { skills, name: b.name, earlier: i > 0 };
  }
  return null;
}

/** FNV-1a, then a small PRNG (mulberry32): the same seed gives the same choices everywhere. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The day's question from the target skills' pool: the day's tier, else the nearest tier (lower first). */
export function pickDaily(pool: QuestionT[], tier: Tier, rand: () => number): QuestionT | null {
  const byTier = (t: number) => pool.filter((q) => tierOf(q.rating) === t).sort((a, b) => a.id.localeCompare(b.id));
  for (const t of [tier, tier - 1, tier + 1, tier - 2, tier + 2, tier - 3, tier + 3]) {
    const qs = byTier(t);
    if (qs.length) return qs[Math.floor(rand() * qs.length)]!;
  }
  return null;
}

/** A student's year group from their onboarding mark source (Year 10 students are about to start Year 11). */
export const yearGroupOf = (source: string | undefined): YearGroup => (source?.startsWith("y12") ? 12 : 11);

/** Streak after solving on `day` (SPEC §8.5): consecutive Perth days. */
export function nextStreak(prev: { lastSolved: string | null; streak: number }, day: string): number {
  if (prev.lastSolved === day) return prev.streak;
  const yesterday = new Date(dateOfDay(day).getTime() - 86_400_000).toISOString().slice(0, 10);
  return prev.lastSolved === yesterday ? prev.streak + 1 : 1;
}

/** The streak as it stands today: broken once a day is missed. */
export function currentStreak(d: { lastSolved: string | null; streak: number } | null | undefined, today: string): number {
  if (!d?.lastSolved) return 0;
  const yesterday = new Date(dateOfDay(today).getTime() - 86_400_000).toISOString().slice(0, 10);
  return d.lastSolved === today || d.lastSolved === yesterday ? d.streak : 0;
}
