import { describe, expect, it } from "vitest";
import katex from "katex";
import { BASIC, FULL, GREEK, faceOf, insertIntoText, phoneLayouts } from "./keypad";

const at = (text: string, insert: string, start = text.length, end = start) => {
  const r = insertIntoText(text, start, end, insert);
  return r.text.slice(0, r.caret) + "|" + r.text.slice(r.caret);
};

describe("maths keypad", () => {
  it("wraps maths in $ signs outside them, and puts the caret in the first empty slot", () => {
    expect(at("Let ", "\\frac{#0}{#?}")).toBe("Let $\\frac{|}{}$");
    expect(at("So ", "\\pi")).toBe("So $\\pi |$");
  });
  it("inserts plainly inside $…$", () => {
    expect(at("$x = $", "\\sqrt{#0}", 5)).toBe("$x = \\sqrt{|}$");
    expect(at("$a \\$ b$", "\\pi", 7)).toBe("$a \\$ b\\pi |$"); // an escaped \$ isn't a boundary
  });
  it("wraps a selection and uses plain brackets in text", () => {
    expect(at("a+b", "\\sqrt{#0}", 0, 3)).toBe("$\\sqrt{a+b}|$");
    expect(at("", "\\left(#0\\right)")).toBe("$(|)$");
    expect(at("", "\\left|#0\\right|")).toBe("$|||$"); // $| |$ with the caret between the bars
  });
  it("every key's face is valid LaTeX", () => {
    const keys = [...BASIC, ...GREEK.flatMap((g) => g.keys), ...FULL.flatMap((g) => g.keys)];
    expect(keys.length).toBeGreaterThan(150);
    for (const key of keys) expect(() => katex.renderToString(faceOf(key), { throwOnError: true }), key.name).not.toThrow();
  });
  it("gives phones numbers, letters, Basic, Greek and each Full group", () => {
    const l = phoneLayouts();
    expect(l.slice(0, 2)).toEqual(["numeric", "alphabetic"]);
    expect(l.length).toBe(4 + FULL.length);
  });
});
