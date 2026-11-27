import { describe, expect, it } from "vitest";
import { readingSeconds, wordCount } from "./reading";

describe("tutorial reading time", () => {
  it("counts prose words, maths as one word each, and skips diagrams", () => {
    expect(wordCount("## Key ideas\n\nA **permutation** is an ordered arrangement: ${}^nP_r = \\frac{n!}{(n-r)!}$.\n\n```diagram\nview: [0, 1, 0, 1]\n```")).toBe(9);
  });
  it("takes 600 words a minute", () => {
    expect(readingSeconds("word ".repeat(600))).toBe(60);
    expect(readingSeconds("word ".repeat(300))).toBe(30);
  });
});
