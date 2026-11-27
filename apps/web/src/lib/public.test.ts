import { describe, expect, it } from "vitest";
import type { PublicProfile } from "./backend";
import { liveStreak, rankBoard } from "./public";

const p = (uid: string, extra: Partial<PublicProfile> = {}): PublicProfile => ({
  uid, displayName: uid, xp: 0, stats: null, daily: null, achievements: {}, courses: {}, updatedAt: 0, ...extra,
});
const today = "2026-11-27";
const stats = (o: Partial<NonNullable<PublicProfile["stats"]>>) => ({ problems: 0, day: today, dayProblems: 0, week: "2026-11-23", weekProblems: 0, weekXp: 0, month: "2026-11", monthXp: 0, ...o });

describe("leaderboards", () => {
  it("orders by value, shares tied positions and leaves out zeros", () => {
    const rows = rankBoard([p("a", { xp: 50 }), p("b", { xp: 90 }), p("c", { xp: 50 }), p("d")], "xp", today, "spec");
    expect(rows.map((r) => [r.profile.uid, r.pos])).toEqual([["b", 1], ["a", 2], ["c", 2]]);
  });
  it("counts period boards only for the current period", () => {
    const old = p("old", { stats: stats({ week: "2026-11-16", weekXp: 500, monthXp: 600, weekProblems: 9, day: "2026-11-20", dayProblems: 4 }) });
    const now = p("now", { stats: stats({ weekXp: 10, monthXp: 10, weekProblems: 2, dayProblems: 1 }) });
    expect(rankBoard([old, now], "xp-week", today, "spec").map((r) => r.profile.uid)).toEqual(["now"]);
    expect(rankBoard([old, now], "problems-today", today, "spec").map((r) => r.profile.uid)).toEqual(["now"]);
    expect(rankBoard([old, now], "xp-month", today, "spec").map((r) => r.profile.uid)).toEqual(["old", "now"]);
  });
  it("ranks a course by rank, then score", () => {
    const c = (rank: 0 | 1 | 2, theta: number | null) => ({ spec: { rank, theta, skills: {}, responseSkills: {}, rollupRanks: {} } });
    const rows = rankBoard([p("a", { courses: c(1, 1500) }), p("b", { courses: c(2, 1100) }), p("c", { courses: c(1, 1200) }), p("d", { courses: c(0, null) })], "course", today, "spec");
    expect(rows.map((r) => r.profile.uid)).toEqual(["b", "a", "c"]);
  });
  it("keeps a daily streak alive through yesterday only", () => {
    expect(liveStreak(p("a", { daily: { streak: 4, best: 4, last: "2026-11-26" } }), today)).toBe(4);
    expect(liveStreak(p("a", { daily: { streak: 4, best: 4, last: "2026-11-25" } }), today)).toBe(0);
  });
  it("sums achievement points across courses", () => {
    const rows = rankBoard([p("a", { achievements: { x: { ids: ["1"], points: 10 }, y: { ids: ["2"], points: 5 } } })], "achievements", today, "x");
    expect(rows[0]!.label).toBe("15 pts");
  });
});
