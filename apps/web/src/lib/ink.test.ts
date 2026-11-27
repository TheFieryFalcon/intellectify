import { describe, expect, it } from "vitest";
import { asLatex } from "./ink";

describe("handwriting fallback", () => {
  it("turns an AI transcription into bare LaTeX for a maths field", () => {
    expect(asLatex("$\\frac{1}{2}x^2$")).toBe("\\frac{1}{2}x^2");
    expect(asLatex("$$\\sqrt{3}$$")).toBe("\\sqrt{3}");
    expect(asLatex("\\(x+1\\)")).toBe("x+1");
    expect(asLatex("x^2 + 1")).toBe("x^2 + 1");
  });
});
