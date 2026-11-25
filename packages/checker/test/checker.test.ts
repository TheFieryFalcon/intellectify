import { describe, expect, it } from "vitest";
import { checkAnswer, type AnswerSpec } from "../src/index.js";

const ok = (spec: AnswerSpec, answer: string | string[]) => checkAnswer(spec, answer).correct;
const reason = (spec: AnswerSpec, answer: string) => {
  const v = checkAnswer(spec, answer);
  return v.correct ? "correct" : v.reason;
};

describe("numeric", () => {
  const half: AnswerSpec = { type: "numeric", key: "\\frac{1}{2}" };
  it("accepts equivalent values", () => {
    expect(ok(half, "0.5")).toBe(true);
    expect(ok(half, "\\frac{2}{4}")).toBe(true);
    expect(ok(half, "\\sin\\left(\\frac{\\pi}{6}\\right)")).toBe(true);
  });
  it("rejects wrong values", () => {
    expect(ok(half, "0.55")).toBe(false);
  });
  it("enforces exact form", () => {
    const exact: AnswerSpec = { type: "numeric", key: "\\sqrt{2}", form: ["exact"] };
    expect(ok(exact, "\\sqrt{2}")).toBe(true);
    expect(reason(exact, "1.41421356237")).toBe("form");
    expect(reason(exact, "1.41")).toBe("not-equivalent");
    expect(reason({ type: "numeric", key: "0.5", form: ["exact"] }, "0.5")).toBe("form");
  });
  it("handles combinatorics notation", () => {
    expect(ok({ type: "numeric", key: 10 }, "\\binom{5}{2}")).toBe(true);
    expect(ok({ type: "numeric", key: 20 }, "{}^{5}P_{2}")).toBe(true);
    expect(ok({ type: "numeric", key: 120 }, "5!")).toBe(true);
    expect(ok({ type: "numeric", key: 60 }, "\\frac{5!}{2!}")).toBe(true);
  });
  it("checks significant figures", () => {
    const sf: AnswerSpec = { type: "numeric", key: "\\sqrt{2}", sigFigs: 3 };
    expect(ok(sf, "1.41")).toBe(true);
    expect(reason(sf, "1.414")).toBe("form");
    expect(ok(sf, "1.42")).toBe(false);
  });
  it("checks rationalized denominators and simplified fractions", () => {
    const r: AnswerSpec = { type: "numeric", key: "\\frac{\\sqrt{2}}{2}", form: ["rationalized-denominator"] };
    expect(ok(r, "\\frac{\\sqrt{2}}{2}")).toBe(true);
    expect(reason(r, "\\frac{1}{\\sqrt{2}}")).toBe("form");
    const f: AnswerSpec = { type: "numeric", key: "\\frac{2}{3}", form: ["simplified-fraction"] };
    expect(reason(f, "\\frac{4}{6}")).toBe("form");
    expect(ok(f, "\\frac{2}{3}")).toBe(true);
  });
});

describe("complex numbers", () => {
  const z: AnswerSpec = { type: "numeric", key: "1+i" };
  it("accepts Cartesian, polar and exponential forms of the same value", () => {
    expect(ok(z, "1+i")).toBe(true);
    expect(ok(z, "\\sqrt{2}\\operatorname{cis}\\left(\\frac{\\pi}{4}\\right)")).toBe(true);
    expect(ok(z, "\\sqrt{2}\\,\\mathrm{cis}\\frac{\\pi}{4}")).toBe(true);
    expect(ok(z, "\\sqrt{2}e^{i\\pi/4}")).toBe(true);
    expect(ok(z, "1-i")).toBe(false);
  });
  it("enforces the requested form", () => {
    expect(reason({ type: "numeric", key: "1+i", form: ["polar"] }, "1+i")).toBe("form");
    expect(reason({ type: "numeric", key: "1+i", form: ["cartesian"] }, "\\sqrt{2}\\operatorname{cis}\\left(\\frac{\\pi}{4}\\right)")).toBe("form");
    expect(ok({ type: "numeric", key: "1+i", form: ["exponential"] }, "\\sqrt{2}e^{\\frac{i\\pi}{4}}")).toBe(true);
  });
  it("evaluates de Moivre powers", () => {
    expect(ok({ type: "numeric", key: "-4" }, "(1+i)^4")).toBe(true);
  });
});

describe("expression", () => {
  const spec: AnswerSpec = { type: "expression", key: "\\frac{2}{(x-1)^2}", vars: { x: { domain: [-5, 5], avoid: [1] } } };
  it("accepts algebraically equivalent forms", () => {
    expect(ok(spec, "2(x-1)^{-2}")).toBe(true);
    expect(ok(spec, "\\frac{2}{x^2-2x+1}")).toBe(true);
    expect(ok(spec, "\\frac{2}{(x+1)^2}")).toBe(false);
  });
  it("accepts trig identities", () => {
    const s: AnswerSpec = { type: "expression", key: "\\cos(2x)", vars: { x: {} } };
    expect(ok(s, "1-2\\sin^2x")).toBe(true);
    expect(ok(s, "\\cos^2x-\\sin^2x")).toBe(true);
    expect(ok(s, "2\\cos x")).toBe(false);
  });
  it("flags symbols the question doesn't use", () => {
    expect(reason(spec, "\\frac{2}{(t-1)^2}")).toBe("unknown-symbol");
  });
  it("tells ln|x| apart from ln x", () => {
    const s: AnswerSpec = { type: "expression", key: "\\ln|x|", vars: { x: { domain: [-5, 5], avoid: [0] } } };
    expect(ok(s, "\\ln\\left|x\\right|")).toBe(true);
    expect(ok(s, "\\ln x")).toBe(false);
  });
  it("checks antiderivatives up to a constant, requiring +C when asked", () => {
    const s: AnswerSpec = { type: "expression", key: "\\frac{1}{2}\\sin(2x)", vars: { x: {} }, upToConstant: true, form: ["constant-of-integration"] };
    expect(ok(s, "\\sin x\\cos x+C")).toBe(true);
    expect(reason(s, "\\sin x\\cos x")).toBe("form");
    expect(ok(s, "\\sin(2x)+C")).toBe(false);
  });
  it("checks factored and expanded forms", () => {
    const f: AnswerSpec = { type: "expression", key: "(x-1)(x+2)", vars: { x: {} }, form: ["factored"] };
    expect(ok(f, "(x+2)(x-1)")).toBe(true);
    expect(reason(f, "x^2+x-2")).toBe("form");
    const e: AnswerSpec = { type: "expression", key: "x^2+x-2", vars: { x: {} }, form: ["expanded"] };
    expect(reason(e, "(x-1)(x+2)")).toBe("form");
    expect(ok(e, "x^2+x-2")).toBe(true);
  });
  it("reports unreadable input", () => {
    expect(reason(spec, "\\frac{2}{")).toBe("unreadable");
  });
});

describe("equation", () => {
  const spec: AnswerSpec = { type: "equation", key: "y=2x+1", vars: { x: {}, y: {} } };
  it("accepts rearrangements and scalings", () => {
    expect(ok(spec, "2x-y+1=0")).toBe(true);
    expect(ok(spec, "4x+2=2y")).toBe(true);
    expect(ok(spec, "y=2x-1")).toBe(false);
  });
  it("requires an equation", () => {
    expect(reason(spec, "2x+1")).toBe("shape");
  });
});

describe("vectors and matrices", () => {
  const v: AnswerSpec = { type: "vector", key: ["2", "-3"] };
  it("accepts ordered pairs, column vectors and i, j form", () => {
    expect(ok(v, "(2,-3)")).toBe(true);
    expect(ok(v, "\\begin{pmatrix}2\\\\-3\\end{pmatrix}")).toBe(true);
    expect(ok(v, "2\\mathbf{i}-3\\mathbf{j}")).toBe(true);
    expect(ok(v, "(-3,2)")).toBe(false);
    expect(reason(v, "(2,-3,1)")).toBe("shape");
  });
  it("checks 3D vectors", () => {
    expect(ok({ type: "vector", key: ["1", "0", "-2"] }, "\\mathbf{i}-2\\mathbf{k}")).toBe(true);
  });
  it("compares matrices entrywise", () => {
    const m: AnswerSpec = { type: "matrix", key: [["0", "-1"], ["1", "0"]] };
    expect(ok(m, "\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}")).toBe(true);
    expect(ok(m, "\\begin{pmatrix}\\cos\\frac{\\pi}{2}&-\\sin\\frac{\\pi}{2}\\\\\\sin\\frac{\\pi}{2}&\\cos\\frac{\\pi}{2}\\end{pmatrix}")).toBe(true);
    expect(ok(m, "\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}")).toBe(false);
  });
});

describe("sets and lists", () => {
  it("ignores order in sets", () => {
    const s: AnswerSpec = { type: "set", key: ["1+2i", "1-2i"] };
    expect(ok(s, "1-2i,1+2i")).toBe(true);
    expect(ok(s, "\\{1+2i,1-2i\\}")).toBe(true);
    expect(ok(s, "1+2i,1+2i")).toBe(false);
  });
  it("respects order in lists", () => {
    const l: AnswerSpec = { type: "list", key: ["1", "2"] };
    expect(ok(l, "(1,2)")).toBe(true);
    expect(ok(l, "(2,1)")).toBe(false);
  });
  it("compares sets of equations (feature entry)", () => {
    const a: AnswerSpec = { type: "set", element: "equation", key: ["x=1", "y=0"], vars: { x: {}, y: {} } };
    expect(ok(a, "y=0,x=1")).toBe(true);
    expect(ok(a, "x=1,y=1")).toBe(false);
  });
});

describe("multiple choice", () => {
  it("matches single and multiple selections", () => {
    expect(ok({ type: "mcq", key: "b" }, "b")).toBe(true);
    expect(ok({ type: "multi-select", key: ["a", "c"] }, ["c", "a"])).toBe(true);
    expect(ok({ type: "multi-select", key: ["a", "c"] }, ["a"])).toBe(false);
  });
});
