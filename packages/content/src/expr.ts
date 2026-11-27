/**
 * Plotting formulas for diagrams (SPEC §9.4): plain text such as `1/(x - 2)`, `2sin(x) + 1`, `sqrt(4 - x^2)`
 * or `e^(-t/2)cos(3t)`, compiled once to a fast real-valued function. Browser-safe and small, unlike the
 * answer checker's LaTeX engine.
 *
 * Supported: numbers, + - * / ^ (right-associative), unary minus, parentheses, |abs|, implicit
 * multiplication (`2x`, `3(x+1)`, `2pi`, `xy` when x and y are both variables), the constants `pi` and
 * `e`, and the functions below. Undefined values (sqrt(-1), ln(0), 1/0) come out as NaN or ±Infinity.
 */

const FUNCS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sec: (x) => 1 / Math.cos(x),
  csc: (x) => 1 / Math.sin(x),
  cosec: (x) => 1 / Math.sin(x),
  cot: (x) => 1 / Math.tan(x),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  arcsin: Math.asin,
  arccos: Math.acos,
  arctan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  floor: Math.floor,
  ceil: Math.ceil,
  sign: Math.sign,
  min: Math.min,
  max: Math.max,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export type Compiled = (scope: Record<string, number>) => number;

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string, vars: readonly string[]): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(src.slice(i));
    if (num) {
      // "2e" is 2 × e, not an exponent: only treat e as an exponent when digits follow.
      out.push({ t: "num", v: Number(num[0]) });
      i += num[0].length;
      continue;
    }
    const word = /^[A-Za-z]+/.exec(src.slice(i));
    if (word) {
      const w = word[0];
      i += w.length;
      if (w in FUNCS || w in CONSTS || vars.includes(w)) {
        out.push({ t: "id", v: w });
        continue;
      }
      // A run of single-letter variables and constants, e.g. "xy" or "tx": an implicit product.
      const parts = splitWord(w, vars);
      if (!parts) throw new Error(`unknown name "${w}"${vars.length ? ` (variables: ${vars.join(", ")})` : ""}`);
      for (const p of parts) out.push({ t: "id", v: p });
      continue;
    }
    if ("+-*/^(),|".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "π") {
      out.push({ t: "id", v: "pi" });
      i++;
      continue;
    }
    throw new Error(`unexpected "${c}"`);
  }
  return out;
}

/** Split "xpi" into ["x", "pi"]: longest known names first, so "pi" wins over "p". */
function splitWord(w: string, vars: readonly string[]): string[] | null {
  const names = [...vars, ...Object.keys(CONSTS), ...Object.keys(FUNCS)].sort((a, b) => b.length - a.length);
  const go = (s: string): string[] | null => {
    if (!s) return [];
    for (const n of names) {
      if (s.startsWith(n)) {
        const rest = go(s.slice(n.length));
        if (rest) return [n, ...rest];
      }
    }
    return null;
  };
  return go(w);
}

/** Compile a formula in the given variables. Throws on syntax errors and unknown names. */
export function compile(src: string, vars: readonly string[] = ["x"]): Compiled {
  const toks = tokenize(String(src), vars);
  let i = 0;
  const peek = () => toks[i];
  const isOp = (v: string) => peek()?.t === "op" && peek()!.v === v;
  const expect = (v: string) => {
    if (!isOp(v)) throw new Error(`expected "${v}"`);
    i++;
  };
  /** True if the next token can start a factor, for implicit multiplication (never "|": it may close an abs). */
  const startsFactor = () => {
    const k = peek();
    return !!k && (k.t === "num" || k.t === "id" || (k.t === "op" && k.v === "("));
  };

  function sum(): Compiled {
    let a = product();
    while (isOp("+") || isOp("-")) {
      const op = toks[i++]!.v;
      const l = a, r = product();
      a = op === "+" ? (s) => l(s) + r(s) : (s) => l(s) - r(s);
    }
    return a;
  }
  function product(): Compiled {
    let a = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = toks[i++]!.v;
        const l = a, r = unary();
        a = op === "*" ? (s) => l(s) * r(s) : (s) => l(s) / r(s);
      } else if (startsFactor()) {
        const l = a, r = power();
        a = (s) => l(s) * r(s);
      } else return a;
    }
  }
  function unary(): Compiled {
    if (isOp("-")) {
      i++;
      const a = unary();
      return (s) => -a(s);
    }
    if (isOp("+")) {
      i++;
      return unary();
    }
    return power();
  }
  function power(): Compiled {
    const base = primary();
    if (isOp("^")) {
      i++;
      const ex = unary(); // right-associative, and allows 2^-x
      return (s) => Math.pow(base(s), ex(s));
    }
    return base;
  }
  function primary(): Compiled {
    const k = peek();
    if (!k) throw new Error("formula ends too early");
    i++;
    if (k.t === "num") return () => k.v;
    if (k.t === "op" && k.v === "(") {
      const a = sum();
      expect(")");
      return a;
    }
    if (k.t === "op" && k.v === "|") {
      const a = sum();
      expect("|");
      return (s) => Math.abs(a(s));
    }
    if (k.t === "id") {
      if (k.v in FUNCS) {
        if (!isOp("(")) throw new Error(`write ${k.v}(…) with brackets`);
        i++;
        const argsC: Compiled[] = [sum()];
        while (isOp(",")) {
          i++;
          argsC.push(sum());
        }
        expect(")");
        const f = FUNCS[k.v]!;
        // A power straight after the call applies to the result: sin(x)^2.
        return argsC.length === 1 ? (s) => f(argsC[0]!(s)) : (s) => f(...argsC.map((a) => a(s)));
      }
      if (k.v in CONSTS) {
        const v = CONSTS[k.v]!;
        return () => v;
      }
      const name = k.v;
      return (s) => s[name]!;
    }
    throw new Error(`unexpected "${k.v}"`);
  }

  if (!toks.length) throw new Error("empty formula");
  const f = sum();
  if (i < toks.length) throw new Error(`unexpected "${(toks[i] as Tok).v}"`);
  return f;
}

/** A constant formula, e.g. "2pi/3" or "-1.5", as a number. */
export function evalConst(src: string | number): number {
  if (typeof src === "number") return src;
  const v = compile(src, [])({});
  if (!Number.isFinite(v)) throw new Error(`"${src}" is not a finite number`);
  return v;
}
