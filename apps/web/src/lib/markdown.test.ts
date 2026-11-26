import { describe, expect, it } from "vitest";
import { linkGlossary, renderMarkdown } from "./markdown";

const terms = [
  { term: "arc", definition: "Part of a circle." },
  { term: "major arc", definition: "The longer arc." },
  { term: "combination", definition: "An unordered selection." },
];

describe("glossary hovers (SPEC §3.2)", () => {
  it("links the first mention of each term, plurals too, longest match first", () => {
    const out = linkGlossary("A major arc and an arc. Two combinations, another combination.", terms);
    expect(out.match(/<dfn/g)).toHaveLength(3);
    expect(out).toContain(">major arc<span");
    expect(out).toContain(">combinations<span");
    expect(out).not.toContain(">combination<span");
  });
  it("leaves math, figures and parts of words alone", () => {
    const html = renderMarkdown("The arc $\\text{arc}$ in search of marching.", { glossary: terms });
    expect(html.match(/<dfn/g)).toHaveLength(1);
    expect(html).toContain("katex");
    expect(html).toContain("search of marching");
  });
  it("escapes definitions", () => {
    expect(linkGlossary("arc", [{ term: "arc", definition: 'a < b & "c"' }])).toContain("a &lt; b &amp; &quot;c&quot;");
  });
});
