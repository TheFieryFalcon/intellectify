/**
 * WA school calendar (SPEC §8.5–8.6), ported from the owner's Connectify school-terms.js.
 * Term 1 starts on the Monday falling 1–4 Feb, else the Wednesday falling 31 Jan–3 Feb (Week 1 is then
 * Wed–Fri). Terms are 10 weeks with 2-week breaks. Early Easter makes Term 1 nine weeks and Term 2 eleven,
 * and is on when Easter Monday falls in Term 1 Week 10. Dates are UTC midnight of the local (Perth) date.
 */
const DAY = 86_400_000;
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
const mondayOf = (date: Date) => addDays(date, -((date.getUTCDay() + 6) % 7));

export function term1Start(year: number): Date {
  for (let day = 1; day <= 4; day++) if (utc(year, 1, day).getUTCDay() === 1) return utc(year, 1, day);
  for (let day = 31; day <= 34; day++) if (utc(year, 0, day).getUTCDay() === 3) return utc(year, 0, day);
  throw new Error("unreachable");
}

/** Easter Monday by the anonymous Gregorian computus. */
export function easterMonday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return addDays(utc(year, month - 1, day), 1);
}

/** Early Easter: Easter Monday falls in Term 1 Week 10. */
export function autoEarlyEaster(year: number): boolean {
  const week10 = addDays(mondayOf(term1Start(year)), 63);
  const monday = easterMonday(year);
  return monday >= week10 && monday <= addDays(week10, 4);
}

export interface Term {
  term: 1 | 2 | 3 | 4;
  /** First school day. */
  start: Date;
  /** Monday of Week 1. */
  monday: Date;
  weeks: number;
}

export function terms(year: number, early = autoEarlyEaster(year)): Term[] {
  const start = term1Start(year);
  const week1 = mondayOf(start);
  const monday = (weeks: number) => addDays(week1, weeks * 7);
  return [
    { term: 1, start, monday: week1, weeks: early ? 9 : 10 },
    { term: 2, start: monday(early ? 11 : 12), monday: monday(early ? 11 : 12), weeks: early ? 11 : 10 },
    { term: 3, start: monday(24), monday: monday(24), weeks: 10 },
    { term: 4, start: monday(36), monday: monday(36), weeks: 10 },
  ];
}

export interface SchoolPosition {
  year: number;
  term: 1 | 2 | 3 | 4;
  /** School week within the term (holidays count on past the last week, up to 12). */
  week: number;
  /** In a school week (not holidays, not before Term 1). */
  inTerm: boolean;
  /** Chronological order: 12 slots per term, (term − 1) × 12 + week. */
  order: number;
}

/** Where a date falls in the school year. Before Term 1 it is Term 1 Week 1, not in term. */
export function schoolPosition(date: Date, early?: boolean): SchoolPosition {
  const year = date.getUTCFullYear();
  const list = terms(year, early ?? autoEarlyEaster(year));
  if (date < list[0]!.start) return { year, term: 1, week: 1, inTerm: false, order: 1 };
  let i = 0;
  while (i < 3 && date >= list[i + 1]!.monday) i++;
  const t = list[i]!;
  const raw = Math.floor((date.getTime() - t.monday.getTime()) / (7 * DAY)) + 1;
  const week = Math.min(12, Math.max(1, raw));
  return { year, term: t.term, week, inTerm: raw <= t.weeks, order: i * 12 + week };
}

/** "T2 W5" (or "Term 2 Week 5") as a 12-slot order. */
export function parseTermWeek(text: string): number | null {
  const m = text.match(/t(?:erm)?\s*(\d)\s*,?\s*w(?:eek)?\s*(\d{1,2})/i);
  return m ? (Number(m[1]) - 1) * 12 + Number(m[2]) : null;
}

/** A Perth calendar date (YYYY-MM-DD) as the UTC-midnight Date this module works in. */
export const dateOfDay = (day: string) => new Date(`${day}T00:00:00Z`);
