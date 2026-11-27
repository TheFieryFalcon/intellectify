import { describe, expect, it } from "vitest";
import { emptyStats, onAppeal, onDaily, onMarked, onPost } from "./achievements";

const solve = (s = emptyStats(), day: string, firstTry = true, streak = 1) => onDaily(s, { day, solved: true, firstTry, streak });

describe("daily achievements", () => {
  it("tracks the best streak, weekends and first-try Sundays", () => {
    let s = solve(undefined, "2026-11-28", false, 3); // Saturday
    s = solve(s, "2026-11-29", true, 4); // Sunday
    s = solve(s, "2026-11-29", true, 4); // same day again (other year group): no double count
    s = onDaily(s, { day: "2026-11-30", solved: false, firstTry: false, streak: 0 });
    expect(s.best.dailyStreak).toBe(4);
    expect(s.counts.weekendDaily).toBe(2);
    expect(s.counts.sundayFirstTry).toBe(1);
  });
  it("flags a full week, a perfect week and one discussed every day", () => {
    const days = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"];
    let s = emptyStats();
    days.slice(0, 6).forEach((d) => (s = solve(s, d)));
    expect(s.flags.fullWeek).toBeUndefined();
    s = solve(s, days[6]!, false);
    expect(s.flags.fullWeek).toBe(true);
    expect(s.flags.perfectWeek).toBeUndefined();
    s = solve(s, days[6]!, true);
    expect(s.flags.perfectWeek).toBe(true);
    days.slice(0, 6).forEach((d) => (s = onPost(s, `${d}:specialist:11`)));
    expect(s.flags.perfectWeekDiscussed).toBeUndefined();
    s = onPost(s, `${days[6]}:specialist:12`);
    expect(s.flags.perfectWeekDiscussed).toBe(true);
    expect(s.counts.discussions).toBe(7);
  });
  it("flags a calendar month", () => {
    let s = emptyStats();
    for (let d = 1; d <= 30; d++) s = solve(s, `2026-11-${String(d).padStart(2, "0")}`, false);
    expect(s.flags.calendarMonth).toBe(true);
  });
});

describe("written answers and appeals", () => {
  it("counts 100% answers and the best run", () => {
    let s = emptyStats();
    for (const score of [1, 1, 0.8, 1]) s = onMarked(s, { score });
    expect(s.counts.fr100).toBe(3);
    expect(s.best.fr100Streak).toBe(2);
  });
  it("flags an appeal from below 60% to 100%", () => {
    expect(onAppeal(emptyStats(), { before: 0.5, after: 1 }).flags.appealTurnaround).toBe(true);
    expect(onAppeal(emptyStats(), { before: 0.7, after: 1 }).flags.appealTurnaround).toBeUndefined();
    expect(onAppeal(emptyStats(), { before: 0.7, after: 1 }).counts.fr100).toBe(1);
  });
  it("counts each discussion once", () => {
    let s = onPost(emptyStats(), "2026-11-27:specialist:11");
    s = onPost(s, "2026-11-27:specialist:11");
    expect(s.counts.discussions).toBe(1);
  });
});
