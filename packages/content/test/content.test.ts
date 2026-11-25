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
const projectionQuestion = (key: string, skill = "spec.vectors-2d.projection") => `
- id: fixture.vector-projection
  skills: { primary: ${skill} }
  rating: 1300
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
