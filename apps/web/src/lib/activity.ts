/**
 * Activity counters for leaderboards (SPEC §12.2): problems done (total, today, this week) and XP this
 * week and this month. Days, weeks (Monday start) and months follow Perth time.
 */
export interface ActivityStats {
  problems: number;
  day: string;
  dayProblems: number;
  /** Perth date of the week's Monday. */
  week: string;
  weekProblems: number;
  weekXp: number;
  /** YYYY-MM. */
  month: string;
  monthXp: number;
}

/** Monday of the week holding a Perth date (YYYY-MM-DD). */
export function weekOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}
export const monthOf = (day: string) => day.slice(0, 7);

export const emptyActivity = (day: string): ActivityStats => ({ problems: 0, day, dayProblems: 0, week: weekOf(day), weekProblems: 0, weekXp: 0, month: monthOf(day), monthXp: 0 });

/** Reset the counters whose period has ended. */
export function roll(s: ActivityStats | null | undefined, day: string): ActivityStats {
  const base = s ?? emptyActivity(day);
  const week = weekOf(day);
  const month = monthOf(day);
  return {
    problems: base.problems,
    day,
    dayProblems: base.day === day ? base.dayProblems : 0,
    week,
    weekProblems: base.week === week ? base.weekProblems : 0,
    weekXp: base.week === week ? base.weekXp : 0,
    month,
    monthXp: base.month === month ? base.monthXp : 0,
  };
}

export const addProblem = (s: ActivityStats | null | undefined, day: string): ActivityStats => {
  const r = roll(s, day);
  return { ...r, problems: r.problems + 1, dayProblems: r.dayProblems + 1, weekProblems: r.weekProblems + 1 };
};
export const addXp = (s: ActivityStats | null | undefined, day: string, xp: number): ActivityStats => {
  const r = roll(s, day);
  return { ...r, weekXp: r.weekXp + xp, monthXp: r.monthXp + xp };
};

/** The day before a Perth date. */
export function dayBefore(day: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}
