import { describe, expect, it } from "vitest";
import { joinMath, splitMath } from "./mathtext";

describe("written answers: text and maths", () => {
  it("splits at $ signs and joins back", () => {
    const src = "Since $x^2 \\ge 0$ for all $x$,\nwe have $$a = b$$ done.";
    expect(splitMath(src)).toEqual([
      { kind: "text", text: "Since " },
      { kind: "math", latex: "x^2 \\ge 0" },
      { kind: "text", text: " for all " },
      { kind: "math", latex: "x" },
      { kind: "text", text: ",\nwe have " },
      { kind: "math", latex: "a = b" },
      { kind: "text", text: " done." },
    ]);
    expect(joinMath(splitMath("Let $n = 2k$."))).toBe("Let $n = 2k$.");
  });
  it("keeps escaped and unclosed dollars as text, and drops empty maths", () => {
    expect(splitMath("costs \\$5 and $")).toEqual([{ kind: "text", text: "costs \\$5 and $" }]);
    expect(joinMath([{ kind: "text", text: "a " }, { kind: "math", latex: " " }, { kind: "text", text: "b" }])).toBe("a b");
  });
});
