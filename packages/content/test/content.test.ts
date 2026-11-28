import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildContent, fillTemplate } from "../src/index.js";

const contentDir = resolve(__dirname, "../../../content");

/** Copy the real content to a temp dir, apply an edit, and build it. */
function buildWith(edit: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "content-"));
  cpSync(contentDir, dir, { recursive: true });
  edit(dir);
  return buildContent(dir);
}
const replaceIn = (path: string, from: string | RegExp, to: string) => writeFileSync(path, readFileSync(path, "utf8").replace(from, to));
/** Add a fixture question file, so tests don't depend on real question content. */
const fixture = (dir: string, yaml: string) => writeFileSync(join(dir, "questions/specialist/unit1/zz-fixture.yaml"), yaml);
const projectionQuestion = (key: string, skill = "spec.vectors-2d.projection", responseSkills = "{ calculation: 1250 }") => `
- id: fixture.vector-projection
  title: "Fixture Projection"
  skills: { primary: ${skill} }
  subsection: Vector projection
  rating: 1300
  responseSkills: ${responseSkills}
  stem: Find the vector projection of $4\\mathbf{i} + 2\\mathbf{j}$ onto $3\\mathbf{i} + 4\\mathbf{j}$.
  parts:
    - id: a
      answer: { type: vector, key: ${key}, form: [exact] }
  solution: It is $\\tfrac{20}{25}(3\\mathbf{i} + 4\\mathbf{j})$.
`;

describe("real content", () => {
  const result = buildContent(contentDir);

  it("builds without errors", () => {
    expect(result.errors).toEqual([]);
  });

  it("puts Years 11 and 12 in one Specialist map", () => {
    const course = result.bundles.find((b) => b.course.id === "specialist")!.course;
    expect(course.units.map((u) => [u.number, u.year])).toEqual([[1, 11], [2, 11], [3, 12], [4, 12]]);
    expect(course.units.flatMap((u) => u.sections.flatMap((s) => s.skills))).toHaveLength(69);
  });

  it("maps Year 12 review dot points onto the Year 11 skill", () => {
    const skills = result.bundles[0]!.course.units.flatMap((u) => u.sections.flatMap((s) => s.skills));
    const cartesian = skills.find((s) => s.id === "spec.real-complex.complex-arithmetic")!;
    expect(cartesian.reviewDotPoints).toEqual(["3.1.1", "3.1.2", "3.1.3"]);
    expect(cartesian.weight).toBe(7);
  });
});

describe("validation catches bad content", () => {
  const y11 = (d: string) => join(d, "curriculum/specialist/y11-2026.yaml");
  const y12 = (d: string) => join(d, "curriculum/specialist/y12-2025.yaml");

  it("an uncovered dot point", () => {
    const r = buildWith((d) => replaceIn(y11(d), 'dotPoints: ["1.2.6"]', 'dotPoints: ["1.2.1"]'));
    expect(r.errors.join("\n")).toMatch(/not covered: 1\.2\.6/);
    expect(r.errors.join("\n")).toMatch(/more than once: 1\.2\.1/);
  });

  it("a prerequisite cycle", () => {
    const r = buildWith((d) => replaceIn(y11(d), "prereqs: []\n\n          - id: spec.geometry.proof-methods", "prereqs: [spec.geometry.circle-problems]\n\n          - id: spec.geometry.proof-methods"));
    expect(r.errors.join("\n")).toMatch(/cycle/);
  });

  it("a prerequisite in a later unit", () => {
    const r = buildWith((d) => replaceIn(y11(d), "prereqs: [spec.geometry.logic]\n\n          - id: spec.geometry.circle-angles", "prereqs: [spec.complex.roots]\n\n          - id: spec.geometry.circle-angles"));
    expect(r.errors.join("\n")).toMatch(/later unit/);
  });

  it("an answer key that fails its own checker", () => {
    expect(buildWith((d) => fixture(d, projectionQuestion("['\\frac{12}{5}', '\\frac{16}{5}']"))).errors).toEqual([]);
    const r = buildWith((d) => fixture(d, projectionQuestion("['2.4', '3.2']")));
    expect(r.errors.join("\n")).toMatch(/vector-projection.*fails its own check/);
  });

  it("an unknown skill on a question", () => {
    const r = buildWith((d) => fixture(d, projectionQuestion("['\\frac{12}{5}', '\\frac{16}{5}']", "spec.geometry.nope")));
    expect(r.errors.join("\n")).toMatch(/unknown skill spec\.geometry\.nope/);
  });

  it("response skills that break the tagging rules", () => {
    const key = "['\\frac{12}{5}', '\\frac{16}{5}']";
    expect(buildWith((d) => fixture(d, projectionQuestion(key, undefined, "{}"))).errors.join("\n")).toMatch(/no response skills/);
    expect(buildWith((d) => fixture(d, projectionQuestion(key, undefined, "{ reading: 1250 }"))).errors.join("\n")).toMatch(/computed answer exercises calculation/);
    expect(buildWith((d) => fixture(d, projectionQuestion(key, undefined, "{ calculation: 1250, guessing: 1200 }"))).errors.join("\n")).toMatch(/unknown response skill guessing/);
  });

  it("every question names one of its skill's subsections", () => {
    const key = "['\\frac{12}{5}', '\\frac{16}{5}']";
    const errs = (yaml: string) => buildWith((d) => fixture(d, yaml)).errors.join("\n");
    expect(errs(projectionQuestion(key).replace("  subsection: Vector projection\n", ""))).toMatch(/no subsection \(one of: Scalar projection; Vector projection; Distance to a line\)/);
    expect(errs(projectionQuestion(key).replace("subsection: Vector projection", "subsection: Projections"))).toMatch(/subsection "Projections" isn't one of/);
  });

  it("routes review-pool questions out of practice, and keeps Challenges at Tier 4–5", () => {
    const key = "['\\frac{12}{5}', '\\frac{16}{5}']";
    const pooled = (pool: string) => projectionQuestion(key).replace("  rating: 1300\n", `  rating: 1300\n  pool: ${pool}\n`);
    const r = buildWith((d) => fixture(d, pooled("section-quiz")));
    expect(r.errors).toEqual([]);
    const b = r.bundles[0]!;
    expect((b.questions["spec.vectors-2d.projection"] ?? []).some((q) => q.id === "fixture.vector-projection")).toBe(false);
    expect(b.sectionReviews["vectors-2d"]!.sectionQuiz.map((q) => q.id)).toContain("fixture.vector-projection");
    expect(buildWith((d) => fixture(d, pooled("unit-quiz"))).bundles[0]!.unitReviews[1]!.unitQuiz.map((q) => q.id)).toContain("fixture.vector-projection");
    expect(buildWith((d) => fixture(d, pooled("challenge"))).errors.join("\n")).toMatch(/Section Challenge problems are Tier 4–5/);
  });

  it("later-unit content: Challenges only, a later unit, and never Year 11 → Year 12", () => {
    const key = "['\\frac{12}{5}', '\\frac{16}{5}']";
    const withRequires = (pool: string, rating: number, sections: string) =>
      projectionQuestion(key).replace("  rating: 1300\n", `  rating: ${rating}\n  pool: ${pool}\n  requires: [${sections}]\n`);
    const errs = (yaml: string) => buildWith((d) => fixture(d, yaml)).errors.join("\n");
    expect(errs(withRequires("practice", 1300, "matrices"))).toMatch(/only Section Challenge problems may require later content/);
    expect(errs(withRequires("challenge", 1600, "complex"))).toMatch(/a Year 11 Challenge can't require Year 12 content/);
    expect(errs(withRequires("challenge", 1600, "combinatorics"))).toMatch(/isn't in a later unit/);
    expect(errs(withRequires("challenge", 1600, "nowhere"))).toMatch(/requires unknown section nowhere/);
  });

  it("part ratings: the question's rating is its hardest part's", () => {
    const key = "['\\frac{12}{5}', '\\frac{16}{5}']";
    const withPartRating = (r: number) => projectionQuestion(key).replace("      answer:", `      rating: ${r}\n      answer:`);
    expect(buildWith((d) => fixture(d, withPartRating(1300))).errors).toEqual([]);
    expect(buildWith((d) => fixture(d, withPartRating(1500))).errors.join("\n")).toMatch(/must equal its hardest part's|rated above the question/);
  });

  it("a review mapping to a missing skill", () => {
    const r = buildWith((d) => replaceIn(y12(d), "skill: spec.real-complex.complex-arithmetic", "skill: spec.real-complex.missing"));
    expect(r.errors.join("\n")).toMatch(/unknown skill spec\.real-complex\.missing/);
  });
});

describe("templates", () => {
  it("fills placeholders through nested values", () => {
    expect(fillTemplate({ s: "{{a}} and {{ b }}", k: ["{{a}}"] }, { a: 1, b: "x" })).toEqual({ s: "1 and x", k: ["1"] });
  });
});

describe("question titles", () => {
  it("every real question has one", () => {
    const r = buildWith(() => {});
    expect(r.errors.filter((e) => e.includes("title"))).toEqual([]);
  });
});

describe("economy content (SPEC §13)", () => {
  const real = buildContent(contentDir);

  it("loads every era's cards and the economy values", () => {
    expect(real.economy?.config.theorems).toHaveLength(11);
    expect(real.economy?.config.axioms.list).toHaveLength(18);
    expect(new Set(real.economy?.cards.map((c) => c.era)).size).toBe(7);
  });

  it("gives every Tanzanite-and-up achievement a unique title, and no lower tier one", () => {
    const high = real.achievements.filter((a) => ["tanzanite", "vibranium", "solarium", "antimatter"].includes(a.tier));
    expect(high.every((a) => a.title)).toBe(true);
    expect(new Set(high.map((a) => a.title)).size).toBe(high.length);
  });

  it("catches a missing title, a duplicate title and a title on a lower tier", () => {
    const path = (d: string) => join(d, "achievements.yaml");
    expect(buildWith((d) => replaceIn(path(d), "  title: Keystone\n", "")).errors.join("\n")).toMatch(/T1 \(tanzanite\) needs a title/);
    expect(buildWith((d) => replaceIn(path(d), "title: Myriad", "title: Keystone")).errors.join("\n")).toMatch(/titles must be unique: Keystone/);
    expect(buildWith((d) => replaceIn(path(d), "  name: Groundwork\n", "  name: Groundwork\n  title: Bedrock\n")).errors.join("\n")).toMatch(/P1 \(platinum\) can't have a title/);
  });

  it("catches a card outside its era, an unknown related skill and falling Axiom thresholds", () => {
    expect(buildWith((d) => replaceIn(join(d, "cards/antiquity.yaml"), "work: -530", "work: 1530")).errors.join("\n")).toMatch(/pythagoras: major work in 1530 is outside antiquity/);
    expect(buildWith((d) => replaceIn(join(d, "cards/antiquity.yaml"), "related: [spec.real-complex.rational-irrational]", "related: [spec.nope]")).errors.join("\n")).toMatch(/unknown skill spec.nope/);
    expect(buildWith((d) => replaceIn(join(d, "economy.yaml"), "at: 30000,", "at: 3000,")).errors.join("\n")).toMatch(/Regularity: threshold must be above/);
  });
});
