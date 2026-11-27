// @vitest-environment jsdom
import createDOMPurify from "dompurify";
import { describe, expect, it } from "vitest";
import { renderUserMarkdown } from "./markdown";
import { findBanned, normalize, safeName } from "./moderation";

const purify = createDOMPurify(window as unknown as Window & typeof globalThis);
const render = (s: string) => renderUserMarkdown(s, (h) => purify.sanitize(h));

describe("user markdown", () => {
  it("strips scripts, handlers and javascript links", () => {
    const html = render('<script>alert(1)</script><img src=x onerror="alert(1)"> **ok**');
    expect(html).not.toMatch(/<script|<img/i);
    expect(html).toContain("<strong>ok</strong>");
    expect(render("if x < 3 then")).toContain("x &lt; 3");
    const link = render("[x](javascript:alert(1)) and [y](https://example.com)");
    expect(link).not.toMatch(/href="javascript/i);
    expect(link).toContain('href="https://example.com"');
  });
  it("renders math, including inside spoilers", () => {
    expect(render("so $x^2$ works")).toContain("katex");
    const html = render("Hint ||hint: try $n = 2$|| and ||all of it||");
    expect(html).toContain('data-label="hint"');
    expect(html).toContain('data-label="Spoiler"');
    expect((html.match(/class="spoiler"/g) ?? []).length).toBe(2);
    expect(html.indexOf("katex")).toBeGreaterThan(html.indexOf('data-label="hint"'));
  });
  it("escapes spoiler labels", () => {
    const html = render('||<b onclick="x">: hi||');
    expect(html).not.toMatch(/<b[\s>]/);
    expect(html).toContain("&lt;b onclick=");
  });
});

describe("banned words: swapped numbers and symbols", () => {
  const list = ["slut", "fag", "kike", "porch monkey"];
  it("catches numbers and symbols swapped in for letters", () => {
    for (const t of ["what a 5lut", "$lut", "f4g", "k1ke", "porch m0nkey", "p0rch_m0nk3y", "s1ut!", "fa9s", "SLUT"])
      expect(findBanned(t, list), t).not.toBeNull();
    expect(findBanned("sluuuut", list)).toBe("slut");
    expect(findBanned("s.l.u.t", list)).toBe("slut");
  });
  it("leaves ordinary maths alone", () => {
    for (const t of ["x = 5, y = 4", "f(4) = 8", "the 4 slots", "class of 25", "Scunthorpe", "k = 1, e = 3", "fagin", "a $5 fee"])
      expect(findBanned(t, list), t).toBeNull();
  });
});

describe("banned words", () => {
  const list = ["badword", "slur"];
  it("finds whole words after undoing swaps and spacing", () => {
    expect(findBanned("a b4dw0rd here", list)).toBe("badword");
    expect(findBanned("s.l.u.r", list)).toBe("slur");
    expect(findBanned("SLURS", list)).toBe("slur");
    expect(findBanned("slurp is fine", list)).toBeNull();
    expect(normalize("Ä")).toBe("a");
  });
  it("replaces bad display names", () => {
    expect(safeName("Mr Slur", list)).toBe("Student");
    expect(safeName("Priya", list)).toBe("Priya");
  });
});
