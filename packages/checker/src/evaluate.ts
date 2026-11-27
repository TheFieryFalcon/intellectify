import { Complex } from "./complex.js";
import { args, head, type MathJson } from "./parse.js";

export type Scope = Record<string, Complex>;

export class EvalError extends Error {
  constructor(
    message: string,
    readonly symbol?: string,
  ) {
    super(message);
  }
}

const CONSTANTS: Record<string, Complex> = {
  Pi: new Complex(Math.PI),
  e: new Complex(Math.E),
  ExponentialE: new Complex(Math.E),
  i: Complex.I,
  ImaginaryUnit: Complex.I,
};

/** Symbols that act as functions when written before an argument (e.g. cis θ, nCr(5, 2)). */
const PREFIX_FUNCTIONS = new Set(["cis", "nCr", "nPr"]);

const real = (z: Complex, what: string): number => {
  if (!z.isReal(1e-9)) throw new EvalError(`${what} needs a real argument`);
  return z.re;
};

const factorial = (n: number): number => {
  if (!Number.isInteger(n) || n < 0) return NaN;
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
};
const nPr = (n: number, r: number) => (Number.isInteger(n) && Number.isInteger(r) && r >= 0 && r <= n ? factorial(n) / factorial(n - r) : NaN);
const nCr = (n: number, r: number) => (Number.isInteger(n) && Number.isInteger(r) && r >= 0 && r <= n ? nPr(n, r) / factorial(r) : NaN);

const realFn = (f: (x: number) => number) => (z: Complex, name: string) => new Complex(f(real(z, name)));

const UNARY: Record<string, (z: Complex, name: string) => Complex> = {
  Sin: (z) => z.sin(),
  Cos: (z) => z.cos(),
  Tan: (z) => z.tan(),
  Sec: (z) => Complex.ONE.div(z.cos()),
  Csc: (z) => Complex.ONE.div(z.sin()),
  Cot: (z) => z.cos().div(z.sin()),
  Arcsin: realFn(Math.asin),
  Arccos: realFn(Math.acos),
  Arctan: realFn(Math.atan),
  Sinh: realFn(Math.sinh),
  Cosh: realFn(Math.cosh),
  Tanh: realFn(Math.tanh),
  Ln: (z) => z.ln(),
  Lg: (z) => z.ln().div(new Complex(Math.LN10)),
  Lb: (z) => z.ln().div(new Complex(Math.LN2)),
  Exp: (z) => z.exp(),
  Sqrt: (z) => z.sqrt(),
  Abs: (z) => new Complex(z.abs()),
  Negate: (z) => z.neg(),
  Factorial: (z, name) => new Complex(factorial(real(z, name))),
  Conjugate: (z) => z.conj(),
  OverBar: (z) => z.conj(),
  Re: (z) => new Complex(z.re),
  Im: (z) => new Complex(z.im),
  Arg: (z) => new Complex(z.arg()),
  cis: (z) => z.mul(Complex.I).exp(),
};

const INVERSE: Record<string, string> = { Sin: "Arcsin", Cos: "Arccos", Tan: "Arctan" };

/** Evaluate MathJSON numerically (over ℂ) in a scope of variable values. */
export function evaluate(e: MathJson, scope: Scope = {}): Complex {
  if (typeof e === "number") return new Complex(e);
  if (typeof e === "string") {
    if (e.startsWith("'")) throw new EvalError(`unexpected text ${e}`);
    const v = scope[e] ?? CONSTANTS[e];
    if (!v) throw new EvalError(`unknown symbol ${e}`, e);
    return v;
  }
  if (!Array.isArray(e)) {
    if (typeof e === "object" && "num" in e) return new Complex(Number(e.num));
    throw new EvalError("unsupported value");
  }

  const h = head(e);
  const a = args(e);
  const ev = (x: MathJson) => evaluate(x, scope);

  switch (h) {
    case "Delimiter": {
      const inner = a[0];
      if (inner === undefined) throw new EvalError("empty brackets");
      if (head(inner) === "Sequence") {
        if (args(inner).length !== 1) throw new EvalError("a list is not a single value");
        return ev(args(inner)[0]!);
      }
      return ev(inner);
    }
    case "Hold":
      return ev(a[0]!);
    case "Add":
      return a.map(ev).reduce((x, y) => x.add(y), Complex.ZERO);
    case "Subtract":
      return ev(a[0]!).sub(ev(a[1]!));
    case "Multiply":
      return a.map(ev).reduce((x, y) => x.mul(y), Complex.ONE);
    case "Divide":
      return ev(a[0]!).div(ev(a[1]!));
    case "Rational":
      return ev(a[0]!).div(ev(a[1]!));
    case "Power":
      return ev(a[0]!).pow(ev(a[1]!));
    case "Root":
      return ev(a[0]!).root(real(ev(a[1]!), "root index"));
    case "Square":
      return ev(a[0]!).pow(new Complex(2));
    case "Log": {
      const x = ev(a[0]!);
      const base = a[1] !== undefined ? ev(a[1]) : new Complex(10);
      return x.ln().div(base.ln());
    }
    case "Binomial":
      return new Complex(nCr(real(ev(a[0]!), "nCr"), real(ev(a[1]!), "nCr")));
    case "nCr":
    case "nPr":
      return applyPrefix(h, a.length === 1 ? a[0]! : ["Delimiter", ["Sequence", ...a]], scope);
    case "InvisibleOperator":
      return evalJuxtaposition(a, scope);
    case "Apply": {
      const fn = a[0];
      if (head(fn!) === "InverseFunction") {
        const name = INVERSE[String(args(fn!)[0])];
        if (name) return UNARY[name]!(ev(a[1]!), name);
      }
      throw new EvalError("unsupported function application");
    }
    case "HorizontalSpacing":
      return Complex.ONE;
    case "Integrate":
      return integrate(a, scope);
  }

  if (h && UNARY[h]) {
    if (a.length !== 1) throw new EvalError(`${h} takes one argument`);
    return UNARY[h](ev(a[0]!), h);
  }
  throw new EvalError(`unsupported operation ${h}`);
}

/** A definite integral ∫_a^b f dv, by composite Simpson's rule (answers like "write as a single integral"). */
function integrate(a: MathJson[], scope: Scope): Complex {
  const [body, limits] = a;
  const [v, lo, hi] = limits !== undefined && head(limits) === "Tuple" ? args(limits) : [];
  const name = v !== undefined && head(v) === "Hold" ? args(v!)[0] : v;
  if (body === undefined || typeof name !== "string" || lo === undefined || hi === undefined) throw new EvalError("only definite integrals can be evaluated");
  const x0 = real(evaluate(lo, scope), "an integral's limit");
  const x1 = real(evaluate(hi, scope), "an integral's limit");
  const n = 400;
  const h = (x1 - x0) / n;
  let sum = Complex.ZERO;
  for (let k = 0; k <= n; k++) {
    const w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2;
    sum = sum.add(evaluate(body, { ...scope, [name]: new Complex(x0 + k * h) }).mul(new Complex(w)));
  }
  return sum.mul(new Complex(h / 3));
}

function applyPrefix(name: string, arg: MathJson, scope: Scope): Complex {
  if (name === "cis") return UNARY.cis!(evaluate(arg, scope), name);
  const inner = head(arg) === "Delimiter" ? args(arg)[0] : arg;
  const parts = inner !== undefined && head(inner) === "Sequence" ? args(inner) : [];
  if (parts.length !== 2) throw new EvalError(`${name} needs two numbers`);
  const n = real(evaluate(parts[0]!, scope), name);
  const r = real(evaluate(parts[1]!, scope), name);
  return new Complex(name === "nCr" ? nCr(n, r) : nPr(n, r));
}

/** Implicit multiplication, where a prefix function symbol consumes the next item as its argument. */
function evalJuxtaposition(items: MathJson[], scope: Scope): Complex {
  let product = Complex.ONE;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (head(item) === "HorizontalSpacing") continue;
    if (typeof item === "string" && PREFIX_FUNCTIONS.has(item)) {
      const arg = items[i + 1];
      if (arg === undefined) throw new EvalError(`${item} needs an argument`);
      product = product.mul(applyPrefix(item, arg, scope));
      i++;
      continue;
    }
    product = product.mul(evaluate(item, scope));
  }
  return product;
}

/** All symbols used in an expression (excluding built-in constants and function names). */
export function freeSymbols(e: MathJson, out = new Set<string>()): Set<string> {
  if (typeof e === "string") {
    if (!e.startsWith("'") && !(e in CONSTANTS) && !PREFIX_FUNCTIONS.has(e)) out.add(e);
  } else if (Array.isArray(e)) {
    const [h, ...rest] = e;
    if (h === "Apply") return out;
    if (h === "Integrate") {
      const [body, limits] = rest;
      const bounds = limits !== undefined && head(limits) === "Tuple" ? args(limits) : [];
      const v = bounds[0] !== undefined && head(bounds[0]) === "Hold" ? args(bounds[0]!)[0] : bounds[0];
      const inner = freeSymbols(body ?? 0);
      inner.delete(v as string);
      // A trailing "d" from "dx" written as letters.
      inner.delete("d");
      inner.forEach((x) => out.add(x));
      bounds.slice(1).forEach((x) => freeSymbols(x, out));
      return out;
    }
    rest.forEach((x) => freeSymbols(x, out));
  }
  return out;
}
