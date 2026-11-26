import { describe, expect, it } from "vitest";
import { emptyProgress } from "./backend/types";
import { computeRollups, reviseMarked, scoreMarked, scoreQuestion, serveQuestion, stateOrNew } from "./practice";
import type { CourseBundle, QuestionT } from "./content";

const q = (over: Partial<QuestionT> = {}): QuestionT => ({
  id: "q1",
  version: 1,
  status: "draft",
  skills: { primary: "spec.a.one", secondary: ["spec.a.two"] },
  rating: 1500,
  responseSkills: { calculation: 1450 },
  requiresCalculator: false,
  pool: "practice",
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
  it("serves free-response questions, unless asked for auto-marked only", () => {
    const fr = q({ id: "fr", parts: [{ id: "a", marks: 1, rubric: { criteria: [{ id: "c", description: "d", points: 1, dimension: "proof" }] } }] });
    expect(serveQuestion([fr], stateOrNew(emptyProgress(), "spec.a.one"))!.question.id).toBe("fr");
    expect(serveQuestion([fr], stateOrNew(emptyProgress(), "spec.a.one"), new Set(), { freeResponse: false })).toBeNull();
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

describe("scoreMarked and reviseMarked", () => {
  const fr = q({ id: "fr", rating: 1450, responseSkills: { proof: 1450, clarity: 1400 }, parts: [{ id: "a", marks: 1, rubric: { criteria: [{ id: "c", description: "d", points: 1, dimension: "proof" }] } }] });
  const mark = (score: number, dims: Record<string, number>) => ({ criteria: [], feedback: "", score, dimensions: dims, model: "m", at: 0 });

  it("uses s from 0.6 up, and scores each rubric dimension on its own", () => {
    const low = scoreMarked(emptyProgress(), fr, mark(0.5, { proof: 0.5, clarity: 1 }));
    expect(low.outcome).toBe(0);
    const high = scoreMarked(emptyProgress(), fr, mark(0.8, { proof: 0.75, clarity: 1 }));
    expect(high.outcome).toBe(0.8);
    expect(high.changes.responseSkills.clarity!.theta).toBeGreaterThan(high.changes.responseSkills.proof!.theta);
  });

  it("an appeal moves every skill to where the new mark would have put it", () => {
    const first = mark(0.5, { proof: 0.5, clarity: 0.5 });
    const second = mark(1, { proof: 1, clarity: 1 });
    const applied = scoreMarked(emptyProgress(), fr, first);
    const progress = { ...emptyProgress(), skills: applied.changes.skills, responseSkills: applied.changes.responseSkills };
    const revised = reviseMarked(progress, fr, first, second);
    const direct = scoreMarked(emptyProgress(), fr, second);
    expect(revised.changes.skills["spec.a.one"]!.theta).toBeCloseTo(direct.changes.skills["spec.a.one"]!.theta, 6);
    expect(revised.changes.responseSkills.proof!.theta).toBeCloseTo(direct.changes.responseSkills.proof!.theta, 6);
    expect(revised.changes.skills["spec.a.one"]!.resolved).toBe(1);
  });
});
