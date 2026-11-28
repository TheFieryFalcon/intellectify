/**
 * Public profiles and leaderboards (SPEC §12.2–12.3). Boards are computed in the browser from one read
 * of the publicProfiles collection, so every board together costs one read per student.
 */
import { lemmasShort, levelProgress, type RankLevel } from "@intellectify/engine";
import { dayBefore, monthOf, weekOf } from "./activity";
import type { CourseProgress, PublicCourse, PublicProfile, PublicSkill, StoredSkillState } from "./backend";
import type { CourseBundle } from "./content";
import { computeRollups } from "./practice";
import { RANK_LABEL, score } from "./ranks";

const pub = (s: StoredSkillState): PublicSkill => ({ r: s.rank as RankLevel, t: s.resolved > 0 ? Math.round(s.theta) : null });
const started = (s: StoredSkillState) => s.resolved > 0 || s.rank > 0;

/** A course as other students see it: started skills only. */
export function publicCourse(course: CourseBundle, progress: CourseProgress): PublicCourse {
  const r = computeRollups(course, progress);
  const pick = (m: Record<string, StoredSkillState>) => Object.fromEntries(Object.entries(m).filter(([, s]) => started(s)).map(([id, s]) => [id, pub(s)]));
  return {
    rank: r.course.rank,
    theta: r.course.theta === null ? null : Math.round(r.course.theta),
    skills: pick(progress.skills),
    responseSkills: pick(progress.responseSkills),
    rollupRanks: r.ranks,
  };
}

/** Enough of a CourseProgress to draw the read-only tech tree and roll-ups. */
export function progressFromPublic(c: PublicCourse | undefined): CourseProgress {
  const state = (s: PublicSkill) => ({ rank: s.r, theta: s.t ?? 0, resolved: s.t === null ? 0 : 1, seen: [], updatedAt: 0 }) as unknown as StoredSkillState;
  const map = (m: Record<string, PublicSkill> | undefined) => Object.fromEntries(Object.entries(m ?? {}).map(([id, s]) => [id, state(s)]));
  return { skills: map(c?.skills), responseSkills: map(c?.responseSkills), rollupRanks: c?.rollupRanks ?? {} };
}

export type BoardId = "xp" | "xp-month" | "xp-week" | "course" | "achievements" | "problems" | "problems-week" | "problems-today" | "streak" | "cards" | "lemmas" | "axioms";

export const BOARDS: { id: BoardId; group: string; name: string }[] = [
  { id: "xp", group: "XP and level", name: "All time" },
  { id: "xp-month", group: "XP and level", name: "This month" },
  { id: "xp-week", group: "XP and level", name: "This week" },
  { id: "course", group: "Course rank", name: "Course rank" },
  { id: "achievements", group: "Achievements", name: "Achievement points" },
  { id: "problems", group: "Problems done", name: "Total" },
  { id: "problems-week", group: "Problems done", name: "This week" },
  { id: "problems-today", group: "Problems done", name: "Today" },
  { id: "streak", group: "Daily streak", name: "Daily streak" },
  // The economy (SPEC §12.2, §13.10): lifetime Lemmas, not the spendable balance.
  { id: "cards", group: "Cards collected", name: "Cards collected" },
  { id: "lemmas", group: "Lifetime Lemmas", name: "Lifetime Lemmas" },
  { id: "axioms", group: "Axioms", name: "Axioms" },
];

/** Axiom names in order, for the Axioms board's labels (it shows the highest proven). */
let axiomNames: string[] = [];
export const setAxiomNames = (names: string[]) => (axiomNames = names);

export const achievementPoints = (p: PublicProfile) => Object.values(p.achievements ?? {}).reduce((t, a) => t + (a?.points ?? 0), 0);

/** A streak counts while its last solve was today or yesterday. */
export const liveStreak = (p: PublicProfile, today: string) => (p.daily && (p.daily.last === today || p.daily.last === dayBefore(today)) ? p.daily.streak : 0);

/** Sort key and label for one student on one board; null = not on the board. */
export function boardEntry(p: PublicProfile, board: BoardId, today: string, course: string): { sort: number; label: string } | null {
  const s = p.stats;
  const n = (v: number, unit = "") => (v > 0 ? { sort: v, label: `${v.toLocaleString("en-US")}${unit}` } : null);
  switch (board) {
    case "xp": {
      if (!(p.xp > 0)) return null;
      return { sort: p.xp, label: `Lv ${levelProgress(p.xp).level}, ${p.xp.toLocaleString("en-US")} XP` };
    }
    case "xp-month":
      return n(s && s.month === monthOf(today) ? s.monthXp : 0, " XP");
    case "xp-week":
      return n(s && s.week === weekOf(today) ? s.weekXp : 0, " XP");
    case "course": {
      const c = p.courses?.[course];
      if (!c || (c.rank === 0 && c.theta === null)) return null;
      return { sort: c.rank * 1000 + (c.theta === null ? 0 : score(c.theta)), label: `${RANK_LABEL[c.rank]}${c.theta === null ? "" : ` ${score(c.theta)}`}` };
    }
    case "achievements":
      return n(achievementPoints(p), " pts");
    case "problems":
      return n(s?.problems ?? 0);
    case "problems-week":
      return n(s && s.week === weekOf(today) ? s.weekProblems : 0);
    case "problems-today":
      return n(s && s.day === today ? s.dayProblems : 0);
    case "streak":
      return n(liveStreak(p, today), " days");
    case "cards":
      return n(Object.keys(p.economy?.cards ?? {}).length);
    case "lemmas": {
      const v = p.economy?.lemmasEarned ?? 0;
      return v > 0 ? { sort: v, label: lemmasShort(v) } : null;
    }
    case "axioms": {
      const k = p.economy?.axiomsProven ?? 0;
      return k > 0 ? { sort: k, label: axiomNames[k - 1] ?? `${k}` } : null;
    }
  }
}

export interface BoardRow {
  profile: PublicProfile;
  pos: number;
  label: string;
}

/** A board, best first. Ties share a position (1, 2, 2, 4). */
export function rankBoard(profiles: PublicProfile[], board: BoardId, today: string, course: string): BoardRow[] {
  const rows = profiles
    .map((p) => ({ p, e: boardEntry(p, board, today, course) }))
    .filter((x): x is { p: PublicProfile; e: { sort: number; label: string } } => x.e !== null)
    .sort((a, b) => b.e.sort - a.e.sort || a.p.displayName.localeCompare(b.p.displayName));
  let pos = 0;
  return rows.map((x, i) => {
    if (i === 0 || x.e.sort !== rows[i - 1]!.e.sort) pos = i + 1;
    return { profile: x.p, pos, label: x.e.label };
  });
}
