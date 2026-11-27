import { describe, expect, it } from "vitest";
import { emptyProfile, emptyProgress, type StoredSkillState } from "./backend/types";
import { mergeAchievements, mergeProfile, mergeProgress } from "./claim";

const st = (resolved: number, theta: number, updatedAt = 0) => ({ resolved, theta, rank: 0, updatedAt, seen: [] }) as unknown as StoredSkillState;

describe("claiming anonymous progress", () => {
  it("keeps the more practiced state per skill and writes only what changes", () => {
    const target = { ...emptyProgress(), skills: { a: st(10, 1400), b: st(2, 1100) }, rollupRanks: { course: 1 as const } };
    const from = { ...emptyProgress(), skills: { b: st(5, 1250), c: st(3, 1200) }, rollupRanks: { course: 2 as const } };
    const m = mergeProgress(target, from);
    expect(Object.keys(m.skills).sort()).toEqual(["b", "c"]);
    expect(m.skills.b!.theta).toBe(1250);
    expect(m.rollupRanks.course).toBe(2);
  });
  it("adds XP and problems, and keeps the account's own placement", () => {
    const day = "2026-11-27";
    const stats = { problems: 3, day, dayProblems: 3, week: "2026-11-23", weekProblems: 3, weekXp: 40, month: "2026-11", monthXp: 40 };
    const target = { ...emptyProfile(), xp: 100, placement: { mark: 80, source: "y10" as const, tiers: { specialist: 3 as const }, at: 1 }, stats };
    const from = { ...emptyProfile(), xp: 40, questionXpAt: { q1: 5 }, placement: { mark: 50, source: "y10" as const, tiers: { specialist: 2 as const }, at: 2 }, stats };
    const m = mergeProfile(target, from, day);
    expect(m.xp).toBe(140);
    expect(m.placement!.mark).toBe(80);
    expect(m.stats!.problems).toBe(6);
    expect(m.questionXpAt.q1).toBe(5);
    expect(mergeProfile({ ...emptyProfile() }, from, day).placement!.mark).toBe(50);
  });
  it("combines earned achievements", () => {
    const m = mergeAchievements({ stats: { counts: { a: 1 } }, earned: { P1: 10 } }, { stats: { counts: { a: 5 } }, earned: { P1: 5, P2: 7 } });
    expect(m!.earned).toEqual({ P1: 5, P2: 7 });
    expect(m!.stats).toEqual({ counts: { a: 5 } });
  });
});
