import { describe, expect, it } from "vitest";
import { mapDiagrams, parseDiagram, renderDiagram } from "../src/diagram.js";
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
});
