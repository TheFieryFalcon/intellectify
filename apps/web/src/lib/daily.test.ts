import { describe, expect, it } from "vitest";
import type { CourseSchedule } from "@intellectify/content";
import { currentStreak, dailyTarget, dailyTier, nextStreak, pickDaily, seededRandom } from "./daily";
import type { QuestionT } from "./content";

const sched: CourseSchedule[] = [
  {
    yearGroup: 11,
    year: 2026,
    blocks: [
      { from: 1, to: 2, name: "Proof", skills: ["logic"] },
      { from: 8, to: 9, name: "Circles", skills: ["circles"] },
      { from: 21, to: 21, name: "Vector proofs", skills: ["vproofs"] },
      { from: 22, to: 23, name: "Trig", skills: ["trig"] },
    ],
  },
];
const has = (s: string) => s !== "trig";

describe("daily problem (SPEC §8.5)", () => {
  it("ramps the tier through the week", () => {
    expect(["2026-11-23", "2026-11-24", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"].map(dailyTier)).toEqual([1, 2, 3, 3, 4, 4]);
  });
  it("targets the block just learnt, stepping back past blocks without questions", () => {
    expect(dailyTarget(sched, 11, "2026-03-18", has, [])!.name).toBe("Proof"); // T1 W7: circles start in W8
    expect(dailyTarget(sched, 11, "2026-03-25", has, [])).toEqual({ skills: ["circles"], name: "Circles", earlier: false }); // T1 W8
  });
  it("uses the nearest earlier block with questions, in term and in the holidays", () => {
    expect(dailyTarget(sched, 11, "2026-07-01", has, [])!.name).toBe("Vector proofs"); // Term 2 holidays: trig has no questions
    expect(dailyTarget(sched, 11, "2026-11-27", has, [])).toEqual({ skills: ["vproofs"], name: "Vector proofs", earlier: true });
    expect(dailyTarget(sched, 11, "2026-02-03", has, [])!.name).toBe("Proof");
  });
  it("lets a year group without an outline revise everything", () => {
    expect(dailyTarget(sched, 12, "2026-11-27", has, ["logic", "trig", "circles"])).toEqual({ skills: ["logic", "circles"], name: "Everything so far", earlier: false });
  });
  it("picks the same question for the same seed, at the day's tier or the nearest", () => {
    const q = (id: string, rating: number) => ({ id, rating }) as QuestionT;
    const pool = [q("a", 1100), q("b", 1300), q("c", 1320), q("d", 1600)];
    expect(pickDaily(pool, 2, seededRandom("2026-11-27:11"))!.id).toBe(pickDaily(pool, 2, seededRandom("2026-11-27:11"))!.id);
    expect(pickDaily(pool, 3, seededRandom("x"))!.id).toMatch(/^[bc]$/);
  });
  it("counts streaks of consecutive days", () => {
    expect(nextStreak({ lastSolved: "2026-11-26", streak: 4 }, "2026-11-27")).toBe(5);
    expect(nextStreak({ lastSolved: "2026-11-25", streak: 4 }, "2026-11-27")).toBe(1);
    expect(currentStreak({ lastSolved: "2026-11-25", streak: 4 }, "2026-11-27")).toBe(0);
  });
});
