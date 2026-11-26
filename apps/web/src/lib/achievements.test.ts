import { describe, expect, it } from "vitest";
import type { AchievementT } from "@intellectify/content";
import { emptyProgress, type StoredSkillState } from "./backend/types";
import type { CourseBundle } from "./content";
import { computeRollups } from "./practice";
import { emptyStats, evaluate, onChallenge, onQuestion, onQuiz, weekKey, type QuestionEvent } from "./achievements";

const st = (theta: number, rank: number, resolved = 5): StoredSkillState => ({ theta, rank: rank as 0, gates: [0, 0, 0, 0, 0, 0, 0], resolved, dropTier: false, seen: [], updatedAt: 0 });
const course: CourseBundle = {
  schedules: [],
  id: "c", name: "C", versions: [], responseSkills: [{ id: "proof", name: "Proof" }],
  units: [{ number: 1, year: 11, sections: [{ id: "s", code: "1.1", name: "S", hours: 1,
    skills: ["a", "b"].map((x) => ({ id: x, name: x, summary: "", size: "medium" as const, dotPoints: ["1.1.1"], reviewDotPoints: [], prereqs: x === "b" ? ["a"] : [], external: [], weight: 1, questionCount: 1, hasTutorial: false })) }] }],
};
const def = (id: string, rule: AchievementT["rule"]): AchievementT => ({ id, name: id, tier: "platinum", points: 10, secret: false, criterion: "", rule });
const q = (over: Partial<QuestionEvent>): QuestionEvent => ({ skill: "a", tier: 3, outcome: 1, firstTry: true, lastSolvedOn: 1, crossSkill: false, before: st(1400, 2), after: { a: st(1410, 2) }, at: Date.UTC(2026, 10, 25), ...over });
const ctx = (skills: Record<string, StoredSkillState>) => {
  const progress = { ...emptyProgress(), skills };
  return { course, progress, rollups: computeRollups(course, progress), now: Date.UTC(2026, 10, 25) };
};

describe("achievements (SPEC §12.1)", () => {
  it("counts correct answers and keeps first-try streaks", () => {
    let s = emptyStats();
    for (let i = 0; i < 10; i++) s = onQuestion(s, q({}));
    expect(s.counts.correctT3).toBe(10);
    expect(s.best.firstTryStreakT3).toBe(10);
    s = onQuestion(s, q({ firstTry: false, lastSolvedOn: 2, outcome: 0.5 }));
    expect(s.streaks.firstTryStreakT3).toBe(0);
    expect(s.best.firstTryStreakT3).toBe(10);
    const { newly } = evaluate([def("P7", { kind: "best", stat: "firstTryStreakT3", gte: 10 }), def("P1", { kind: "count", stat: "correctT3", gte: 100 })], s, ctx({}), {});
    expect(newly.map((a) => a.id)).toEqual(["P7"]);
  });

  it("detects the secret one-off events", () => {
    const s = onQuestion(emptyStats(), q({ tier: 5, outcome: 0.66, firstTry: false, lastSolvedOn: 5, after: { a: st(1729.2, 2) } }));
    expect(s.flags.lastGasp).toBe(true);
    expect(s.flags.taxicab).toBe(true);
    const c = onQuestion(emptyStats(), q({ tier: 5, before: st(1500, 0), after: { a: st(1530, 0) } }));
    expect(c.flags.contradiction).toBe(true);
    const g = onQuestion(emptyStats(), q({ before: st(1690, 4, 17), after: { a: st(1705, 5, 18) } }));
    expect(g.flags.grandmaster).toBe(true);
  });

  it("notices a comeback after losing a rank", () => {
    let s = onQuestion(emptyStats(), q({ before: st(1560, 4), after: { a: st(1510, 3) } }));
    expect(s.flags.comeback).toBeUndefined();
    s = onQuestion(s, q({ before: st(1540, 3), after: { a: st(1560, 4) } }));
    expect(s.flags.comeback).toBe(true);
  });

  it("checks ranks, sections, quizzes and challenges", () => {
    const defs = [
      def("P3", { kind: "sectionAllAtRank", rank: 3 }),
      def("P6", { kind: "count", stat: "perfectSectionQuizzes", gte: 1 }),
      def("D8", { kind: "challengeAvg", min: 0.8 }),
      def("T14", { kind: "contrapositive" }),
      def("P8", { kind: "pending", feature: "daily" }),
    ];
    let s = onQuiz(emptyStats(), { scope: "section", unit: 1, correct: 8, total: 8, allFirstTry: true });
    s = onChallenge(s, { section: "s", average: 0.85, allFirstTry: false });
    const { newly } = evaluate(defs, s, ctx({ a: st(1450, 3), b: st(1460, 3) }), {});
    expect(newly.map((a) => a.id).sort()).toEqual(["D8", "P3", "P6"]);
    // Contrapositive: Diamond in b while its prerequisite a is below Gold.
    expect(evaluate(defs, s, ctx({ a: st(1300, 2), b: st(1750, 5) }), {}).newly.map((a) => a.id)).toContain("T14");
    // Already earned achievements aren't returned again; pending ones never are.
    expect(evaluate(defs, s, ctx({ a: st(1450, 3), b: st(1460, 3) }), { P3: 1, P6: 1, D8: 1 }).newly).toEqual([]);
  });

  it("uses Monday-start Perth weeks", () => {
    expect(weekKey(Date.UTC(2026, 10, 25, 2))).toBe("2026-11-23"); // Wednesday
    expect(weekKey(Date.UTC(2026, 10, 22, 17))).toBe("2026-11-23"); // Monday 1 am Perth
  });
});
