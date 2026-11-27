import { describe, expect, it } from "vitest";
import { compile, evalConst } from "../src/expr.js";

const at = (src: string, x: number, vars: string[] = ["x"]) => compile(src, vars)({ x });

describe("plotting formulas", () => {
  it("follows the usual order of operations", () => {
    expect(at("1 + 2*3^2", 0)).toBe(19);
    expect(at("2^3^2", 0)).toBe(512); // right-associative
    expect(at("-x^2", 3)).toBe(-9);
    expect(at("2^-x", 1)).toBe(0.5);
    expect(at("x/2*4", 3)).toBe(6);
  });
  it("multiplies implicitly", () => {
    expect(at("2x", 3)).toBe(6);
    expect(at("3(x+1)", 1)).toBe(6);
    expect(at("2pi", 0)).toBeCloseTo(2 * Math.PI);
    expect(at("(x+1)(x-1)", 3)).toBe(8);
    expect(at("2sin(x)", Math.PI / 2)).toBeCloseTo(2);
    expect(at("x sin(x)", Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(compile("xy", ["x", "y"])({ x: 2, y: 5 })).toBe(10);
    expect(compile("e^(-t/2)cos(3t)", ["t"])({ t: 0 })).toBe(1);
  });
  it("knows functions, constants and absolute value", () => {
    expect(at("sqrt(4 - x^2)", 0)).toBe(2);
    expect(at("|x - 5|", 2)).toBe(3);
    expect(at("ln(e^x)", 2)).toBeCloseTo(2);
    expect(at("sin(x)^2 + cos(x)^2", 1.234)).toBeCloseTo(1);
    expect(at("max(x, 2)", 1)).toBe(2);
    expect(at("π", 0)).toBeCloseTo(Math.PI);
  });
  it("gives NaN or infinity where a function is undefined", () => {
    expect(at("sqrt(x)", -1)).toBeNaN();
    expect(at("1/x", 0)).toBe(Infinity);
  });
  it("rejects bad formulas with a clear reason", () => {
    expect(() => compile("2 +")).toThrow(/ends too early/);
    expect(() => compile("y + 1")).toThrow(/unknown name "y"/);
    expect(() => compile("sin x")).toThrow(/brackets/);
    expect(() => compile("(x + 1")).toThrow(/expected "\)"/);
    expect(() => compile("x # 2")).toThrow(/unexpected "#"/);
  });
  it("evaluates constants", () => {
    expect(evalConst("2pi/3")).toBeCloseTo((2 * Math.PI) / 3);
    expect(evalConst(-1.5)).toBe(-1.5);
    expect(() => evalConst("1/0")).toThrow(/finite/);
  });
});
