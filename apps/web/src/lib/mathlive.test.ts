import { describe, expect, it } from "vitest";
import { BASIC, FULL } from "./keypad";
import { takesPrevious } from "./mathlive";

describe("keypad keys and what's typed before them", () => {
  const key = (name: string) => [...BASIC, ...FULL.flatMap((g) => g.keys)].find((k) => k.name === name)!.insert;
  it("powers, subscripts and primes take the term before the caret", () => {
    for (const name of ["Squared", "Power", "Subscript", "Prime", "Inverse", "Transpose"]) expect(takesPrevious(key(name)), name).toBe("term");
  });
  it("vector arrows, hats and bars take the letters before the caret", () => {
    for (const name of ["Vector (arrow)", "Vector between points", "Unit vector", "Vector (bold)", "Vector (tilde under)", "Line segment", "Arc"]) expect(takesPrevious(key(name)), name).toBe("letters");
  });
  it("keys with one empty box take the term before the caret", () => {
    for (const name of ["Square root", "Brackets", "Sine", "Natural log", "Absolute value", "Integral", "Determinant"]) expect(takesPrevious(key(name)), name).toBe("term");
  });
  it("keys with no box or several go in at the caret", () => {
    for (const name of ["Fraction", "nth root", "Choose", "Log base", "Definite integral", "e to the power", "e to the i", "Pi", "Degrees", "Column vector"]) expect(takesPrevious(key(name)), name).toBeNull();
  });
});
