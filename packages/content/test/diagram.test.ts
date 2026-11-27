import { describe, expect, it } from "vitest";
import { mapDiagrams, parseDiagram, renderDiagram, tickLabel } from "../src/diagram.js";
import { diagramErrors } from "../src/diagram-check.js";
import { fillTemplate } from "../src/template.js";

const triangle = `
view: [-1, 5, -1, 4]
points: { O: [0, 0], A: [4, 0], B: [1, 3] }
draw:
  - { type: vector, from: O, to: A, label: '\\mathbf{a}' }
  - { type: vector, from: O, to: B, label: '\\mathbf{b}', side: right }
  - { type: segment, from: A, to: B, dashed: true, ticks: 1 }
  - { type: angle, at: O, from: A, to: B, label: '\\theta' }
  - { type: point, at: O, label: O }
`;

describe("diagrams (SPEC §9.4)", () => {
  it("parses and renders points, vectors, segments and angles", () => {
    const svg = renderDiagram(parseDiagram(triangle));
    expect(svg).toMatch(/^<svg class="diagram"/);
    expect((svg.match(/<line /g) ?? []).length).toBe(4); // 2 vectors, 1 segment, 1 tick
    expect(svg).toContain('marker-end="url(#da-accent)"');
    expect(svg).toContain("<path"); // the angle arc
    expect(svg).toContain("\\mathbf{a}"); // label passed through (plain-text fallback)
  });

  it("reports unknown points and bad values", () => {
    expect(() => parseDiagram("view: [0, 4, 0, 4]\ndraw:\n  - { type: vector, from: O, to: Z }")).toThrow(/unknown point "O"/);
    expect(() => parseDiagram("view: [4, 0, 0, 4]\ndraw:\n  - { type: point, at: [1, 1] }")).toThrow(/view must be/);
    expect(() => parseDiagram("view: [0, 4, 0, 4]\ndraw:\n  - { type: circle, center: [1, 1] }")).toThrow(/radius or a through point/);
    expect(() => parseDiagram("view: [0, 4, 0, 4]\ndraw:\n  - { type: text, at: [1, 1], text: '30^\\\\circ' }")).toThrow(/doubled backslash/);
  });

  it("takes numbers from filled template parameters", () => {
    const md = "Stem\n\n```diagram\nview: [0, 6, 0, 6]\ndraw:\n  - { type: vector, from: [0, 0], to: ['{{x}}', '{{y}}'] }\n```\n";
    const filled = fillTemplate(md, { x: 3, y: 4 });
    expect(diagramErrors(filled)).toEqual([]);
    expect(diagramErrors(md)).not.toEqual([]); // unfilled placeholders aren't numbers
  });

  it("replaces fenced blocks inside Markdown", () => {
    const md = "Before\n\n```diagram" + triangle + "```\n\nAfter";
    expect(mapDiagrams(md, () => "[fig]", () => "[err]")).toBe("Before\n\n[fig]\n\nAfter");
  });

  it("graphs a function, lifting the pen at an asymptote", () => {
    const svg = renderDiagram(parseDiagram("view: [-4, 6, -4, 6]\naxes: { ticks: 1 }\ndraw:\n  - { type: function, fn: '(x + 1)/(x - 2)' }\n  - { type: line, x: 2, dashed: true }"));
    const d = /<path d="([^"]+)" class="dc/.exec(svg)![1]!;
    expect(d.match(/M/g)!.length).toBe(2); // two branches, no line joining them across x = 2
    expect(svg).toContain("clip-path=");
    expect(svg).toContain('class="ds dd"'); // the dashed asymptote
  });

  it("keeps a steep but continuous graph in one piece", () => {
    const svg = renderDiagram(parseDiagram("view: [-1.2, 1.2, -1, 1]\ndraw:\n  - { type: function, fn: 'x^9' }"));
    expect(/<path d="([^"]+)" class="dc/.exec(svg)![1]!.match(/M/g)!.length).toBe(1);
  });

  it("labels ticks, in multiples of pi when the spacing is", () => {
    expect(tickLabel(Math.PI / 2, true)).toBe("\\frac{\\pi}{2}");
    expect(tickLabel(-Math.PI, true)).toBe("-\\pi");
    expect(tickLabel((3 * Math.PI) / 2, true)).toBe("\\frac{3\\pi}{2}");
    expect(tickLabel(2.5, false)).toBe("2.5");
    const svg = renderDiagram(parseDiagram("view: [-7, 7, -2, 2]\naxes: { ticks: [pi/2, 1] }\ndraw:\n  - { type: function, fn: sin(x) }"));
    expect(svg).toContain("\\frac{\\pi}{2}");
  });

  it("draws Argand loci: Re/Im axes, rays with open ends, filled circles", () => {
    const svg = renderDiagram(parseDiagram(`view: [-3, 4, -3, 4]
axes: { x: '\\text{Re}', y: '\\text{Im}' }
draw:
  - { type: circle, center: [1, 1], radius: 2, fill: true, dashed: true }
  - { type: ray, from: [1, 0], angle: 45, open: true }`));
    expect(svg).toContain("\\text{Re}");
    expect(svg).toContain('class="do"'); // the open end of the ray
    expect(svg).toContain("ds df dd");
  });

  it("shades a region and draws a slope field", () => {
    const svg = renderDiagram(parseDiagram("view: [-1, 3, -1, 5]\ndraw:\n  - { type: region, fn: 2x, fn2: x^2, from: 0, to: 2 }\n  - { type: slopefield, dydx: x - y, step: 1 }"));
    expect(svg).toContain('class="dr"');
    expect((/<path d="([^"]+)" class="dsf/.exec(svg)![1]!.match(/M/g) ?? []).length).toBe(5 * 7); // x −1..3, y −1..5
  });

  it("projects 3D points and fits the view", () => {
    const svg = renderDiagram(parseDiagram(`projection: { azimuth: 30, elevation: 20 }
axes: { length: 4 }
points: { O: [0, 0, 0], A: [3, 1, 2] }
draw:
  - { type: vector, from: O, to: A }
  - { type: sphere, center: [0, 0, 0], radius: 2 }
  - { type: parametric, x: cos(t), y: sin(t), z: t/4, t: [0, 4pi] }`));
    expect(svg).toMatch(/^<svg class="diagram" viewBox="0 0 [\d.]+ [\d.]+"/);
    expect((svg.match(/marker-end/g) ?? []).length).toBe(4); // three axes and the vector
  });

  it("rejects bad graphs and misplaced 3D", () => {
    expect(() => parseDiagram("view: [0, 4, 0, 4]\ndraw:\n  - { type: function, fn: 'y + 1' }")).toThrow(/function "y \+ 1": unknown name "y"/);
    expect(() => parseDiagram("view: [0, 4, 0, 4]\ndraw:\n  - { type: line, x: 1, y: 2 }")).toThrow(/exactly one of through, x, y or slope/);
    expect(() => parseDiagram("draw:\n  - { type: point, at: [1, 1] }")).toThrow(/view is required/);
    expect(() => parseDiagram("projection: {}\ndraw:\n  - { type: point, at: [1, 1] }")).toThrow(/needs 3 coordinates/);
    expect(() => parseDiagram("projection: {}\ndraw:\n  - { type: function, fn: x }")).toThrow(/2D only/);
    expect(() => parseDiagram("view: [0, 4, 0, 4]\ndraw:\n  - { type: sphere, center: [1, 1], radius: 1 }")).toThrow(/needs a projection/);
    expect(() => parseDiagram("view: [0, 4, 0, 4]\naxes: { ticks: 0 }\ndraw:\n  - { type: point, at: [1, 1] }")).toThrow(/must be positive/);
  });

  it("takes numbers as formulas", () => {
    const d = parseDiagram("view: [-pi, pi, -1, 1]\ndraw:\n  - { type: point, at: [pi/2, sqrt(2)/2] }");
    expect(d.view![0]).toBeCloseTo(-Math.PI);
  });
});
