import { describe, expect, it } from "vitest";
import { emptyProgress } from "./backend/types";
import { computeRollups, scoreQuestion, serveQuestion, stateOrNew } from "./practice";
import type { CourseBundle, QuestionT } from "./content";

const q = (over: Partial<QuestionT> = {}): QuestionT => ({
  id: "q1",
  version: 1,
  status: "draft",
  skills: { primary: "spec.a.one", secondary: ["spec.a.two"] },
  rating: 1500,
  responseSkills: { calculation: 1450 },
  requiresCalculator: false,
  stem: "Find it.",
  parts: [
    { id: "a", marks: 2, answer: { type: "numeric", key: 1 } },
    { id: "b", marks: 2, answer: { type: "numeric", key: 2 } },
  ],
  solution: "It.",
  ...over,
});

const course: CourseBundle = {
  id: "c",
  name: "C",
  versions: [],
  responseSkills: [],
  units: [
    {
      number: 1,
      year: 11,
      sections: [
        {
          id: "a",
          code: "1.1",
          name: "A",
          hours: 1,
          skills: ["one", "two"].map((s) => ({ id: `spec.a.${s}`, name: s, summary: "", size: "medium" as const, dotPoints: ["1.1.1"], reviewDotPoints: [], prereqs: [], external: [], weight: 1, questionCount: 1, hasTutorial: false })),
        },
      ],
    },
  ],
};

describe("scoreQuestion", () => {
  it("weights parts by marks and applies Tier 3 second-attempt credit", () => {
    const r = scoreQuestion(emptyProgress(), q(), [
      { id: "a", marks: 2, solvedOn: 1 },
      { id: "b", marks: 2, solvedOn: 2 },
    ]);
    expect(r.outcome).toBe(0.75);
    expect(r.tier).toBe(3);
  });

  it("updates primary, secondary (half step) and response skills", () => {
    const r = scoreQuestion(emptyProgress(), q(), [
      { id: "a", marks: 2, solvedOn: 1 },
      { id: "b", marks: 2, solvedOn: 1 },
    ]);
    const primary = r.changes.skills["spec.a.one"]!.theta - 1400;
    const secondary = r.changes.skills["spec.a.two"]!.theta - 1400;
    expect(secondary).toBeCloseTo(primary / 2);
    expect(r.changes.responseSkills["calculation"]!.resolved).toBe(1);
    expect(r.changes.skills["spec.a.one"]!.seen).toEqual(["q1"]);
  });
});

describe("serveQuestion", () => {
  it("skips free-response questions in Phase 0", () => {
    const fr = q({ id: "fr", parts: [{ id: "a", marks: 1, rubric: { criteria: [{ id: "c", description: "d", points: 1, dimension: "proof" }] } }] });
    expect(serveQuestion([fr], stateOrNew(emptyProgress(), "spec.a.one"))).toBeNull();
  });

  it("fills a variant's placeholders", () => {
    const templ = q({ stem: "n = {{n}}", variants: [{ n: 7 }] });
    expect(serveQuestion([templ], stateOrNew(emptyProgress(), "spec.a.one"))!.question.stem).toBe("n = 7");
  });
});

describe("computeRollups", () => {
  it("is Unranked until skills are started", () => {
    expect(computeRollups(course, emptyProgress()).course.rank).toBe(0);
  });
});
