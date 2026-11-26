import { describe, expect, it } from "vitest";
import { tierOf } from "@intellectify/engine";
import type { QuestionT } from "./content";
import { buildChallenge, buildQuiz, challengeLength, QUIZ_MIX } from "./review";

const mk = (id: string, skill: string, rating: number, secondary: string[] = []): QuestionT => ({
  id, version: 1, status: "draft", skills: { primary: skill, secondary }, rating, responseSkills: {}, requiresCalculator: false, pool: "practice",
  stem: "S", parts: [{ id: "a", marks: 1, answer: { type: "numeric", key: 1 } }], solution: "S",
});
// Three skills, each with plenty of questions at every tier.
const pools = new Map(
  ["one", "two", "three"].map((s) => [s, [1100, 1150, 1300, 1350, 1450, 1500, 1520, 1600, 1650, 1720, 1760].map((r, i) => mk(`${s}.${i}`, s, r))]),
);
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe("reviews (SPEC §8.2–8.4)", () => {
  it("builds a section quiz with the 2/2/3/1 tier mix, spread across skills", () => {
    const quiz = buildQuiz(pools, QUIZ_MIX.section, rand);
    expect(quiz).toHaveLength(8);
    const tiers = quiz.map((s) => tierOf(s.question.rating));
    expect(tiers.filter((t) => t === 1)).toHaveLength(2);
    expect(tiers.filter((t) => t === 3)).toHaveLength(3);
    expect(tiers.filter((t) => t === 4)).toHaveLength(1);
    expect(new Set(quiz.map((s) => s.question.skills.primary)).size).toBe(3);
    expect(new Set(quiz.map((s) => s.question.id)).size).toBe(8);
  });

  it("falls back to the nearest tier when one runs short", () => {
    const thin = new Map([["one", [mk("a", "one", 1300), mk("b", "one", 1450), mk("c", "one", 1460)]]]);
    const quiz = buildQuiz(thin, { 1: 2 }, rand);
    expect(quiz).toHaveLength(2);
    expect(quiz[0]!.question.id).toBe("a"); // Tier 2 is nearest to Tier 1
  });

  it("builds a Section Challenge of Tier 4–5 problems, cross-skill ones included", () => {
    const withCross = new Map(pools);
    withCross.set("one", [...pools.get("one")!, mk("x1", "one", 1700, ["two"]), mk("x2", "two", 1680, ["three"])]);
    const ch = buildChallenge(withCross, challengeLength(15), rand);
    expect(ch).toHaveLength(14); // only 14 Tier 4–5 questions exist: 4 per skill plus 2 cross-skill
    expect(buildChallenge(withCross, 10, rand)).toHaveLength(10);
    expect(ch.every((q) => q.rating >= 1550)).toBe(true);
    expect(ch.some((q) => q.id === "x1") && ch.some((q) => q.id === "x2")).toBe(true);
    expect(challengeLength(3)).toBe(10);
    expect(challengeLength(40)).toBe(25);
  });
});
