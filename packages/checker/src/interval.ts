import { Complex } from "./complex.js";
import { evaluate } from "./evaluate.js";
import { args, head, parseLatex, ParseError, type MathJson } from "./parse.js";

/**
 * Sets of real numbers as unions of intervals (docs/SPEC.md §7.1): interval notation such as
 * (−∞, 2] ∪ (3, 5), ℝ and ∅, or inequalities in one variable such as −2 < x ≤ 3 or "x < 1 or x > 2".
 */
export interface Interval {
  lo: number;
  hi: number;
  loClosed: boolean;
  hiClosed: boolean;
}
export type Notation = "interval" | "inequality";
export interface ParsedSet {
  intervals: Interval[];
  notation: Notation;
}

export class IntervalError extends Error {}

const strip = (s: string) =>
  s
    .replace(/\\left|\\right|\\bigl|\\bigr|\\Bigl|\\Bigr/g, "")
    .replace(/\\lbrack/g, "[")
    .replace(/\\rbrack/g, "]")
    .replace(/\\[,;:! ]|~/g, " ")
    .trim();

/** Split at top-level occurrences of a separator (not inside braces). */
function splitTop(s: string, sep: RegExp): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 0) {
      const m = s.slice(i).match(sep);
      if (m && m.index === 0) {
        out.push(s.slice(start, i));
        i += m[0].length - 1;
        start = i + 1;
      }
    }
  }
  out.push(s.slice(start));
  return out.map((p) => p.trim());
}

function endpoint(src: string): number {
  const s = src.replace(/\s+/g, "");
  if (/^\+?\\infty$|^\+?∞$/.test(s)) return Infinity;
  if (/^-\\infty$|^-∞$/.test(s)) return -Infinity;
  let v: Complex;
  try {
    v = evaluate(parseLatex(s));
  } catch {
    throw new IntervalError(`couldn't read the endpoint "${src}"`);
  }
  if (!v.isReal(1e-9) || !Number.isFinite(v.re)) throw new IntervalError(`"${src}" isn't a real number`);
  return v.re;
}

const INEQ = /<|>|\\le|\\ge|\\lt|\\gt|\\leq|\\geq|\\leqslant|\\geqslant|≤|≥/;
const OPS: Record<string, { lt: boolean; strict: boolean }> = {
  Less: { lt: true, strict: true },
  LessEqual: { lt: true, strict: false },
  Greater: { lt: false, strict: true },
  GreaterEqual: { lt: false, strict: false },
};

/** One inequality (possibly a chain like −2 < x ≤ 3) in `variable`, as an interval. */
function inequality(src: string, variable: string): Interval {
  let e: MathJson;
  try {
    e = parseLatex(src.replace(/≤/g, "\\le").replace(/≥/g, "\\ge"));
  } catch (err) {
    if (err instanceof ParseError) throw new IntervalError(`couldn't read "${src}"`);
    throw err;
  }
  // Compute Engine nests chains either way: a < x ≤ b may be LessEqual(Less(a, x), b) or LessEqual(a, Less(x, b)).
  const terms: MathJson[] = [];
  const ops: string[] = [];
  const flatten = (n: MathJson) => {
    const h = head(n);
    if (h && OPS[h]) {
      const [l, r] = args(n);
      flatten(l!);
      ops.push(h);
      flatten(r!);
    } else terms.push(n);
  };
  flatten(e);
  if (!ops.length || ops.length > 2) throw new IntervalError(`write "${src}" as an inequality in ${variable}`);
  const at = terms.findIndex((t) => t === variable);
  if (at < 0 || terms.filter((t) => t === variable).length !== 1) throw new IntervalError(`write the inequality in ${variable}`);
  const iv: Interval = { lo: -Infinity, hi: Infinity, loClosed: false, hiClosed: false };
  const value = (t: MathJson) => {
    const v = evaluate(t);
    if (!v.isReal(1e-9)) throw new IntervalError("bounds must be real");
    return v.re;
  };
  // An operator between term k and k+1 says terms[k] (<|>) terms[k+1].
  ops.forEach((op, k) => {
    const { lt, strict } = OPS[op]!;
    if (k + 1 === at) {
      // bound op x
      const b = value(terms[k]!);
      if (lt) Object.assign(iv, { lo: b, loClosed: !strict });
      else Object.assign(iv, { hi: b, hiClosed: !strict });
    } else if (k === at) {
      // x op bound
      const b = value(terms[k + 1]!);
      if (lt) Object.assign(iv, { hi: b, hiClosed: !strict });
      else Object.assign(iv, { lo: b, loClosed: !strict });
    } else throw new IntervalError(`write the inequality in ${variable}`);
  });
  if (iv.lo > iv.hi || (iv.lo === iv.hi && !(iv.loClosed && iv.hiClosed))) throw new IntervalError("that inequality has no solutions");
  return iv;
}

/** One piece of interval notation: (a, b), [a, b), (−∞, a], … */
function piece(src: string): Interval {
  const m = src.match(/^([[(])(.*)([\])])$/s);
  if (!m) throw new IntervalError(`write "${src}" in interval notation, e.g. (1, 3]`);
  const ends = splitTop(m[2]!, /,/);
  if (ends.length !== 2) throw new IntervalError("an interval has two endpoints");
  const lo = endpoint(ends[0]!);
  const hi = endpoint(ends[1]!);
  const iv = { lo, hi, loClosed: m[1] === "[", hiClosed: m[3] === "]" };
  if ((iv.loClosed && lo === -Infinity) || (iv.hiClosed && hi === Infinity)) throw new IntervalError("∞ is never included: use a round bracket");
  if (lo > hi || (lo === hi && !(iv.loClosed && iv.hiClosed))) throw new IntervalError("the left endpoint must be below the right one");
  return iv;
}

/** Parse a set of reals. Throws IntervalError with a student-facing reason. */
export function parseSet(latex: string, variable = "x"): ParsedSet {
  const s = strip(latex);
  if (!s) throw new IntervalError("empty answer");
  if (/^(\\varnothing|\\emptyset|∅|\\\{\s*\\\})$/.test(s)) return { intervals: [], notation: "interval" };
  if (/^(\\mathbb\{R\}|ℝ|\\R)$/.test(s)) return { intervals: [{ lo: -Infinity, hi: Infinity, loClosed: false, hiClosed: false }], notation: "interval" };
  if (INEQ.test(s)) {
    const pieces = splitTop(s, /\\text\{\s*or\s*\}|\\mathrm\{\s*or\s*\}|\\lor|\\vee|\bor\b/);
    return { intervals: normalize(pieces.map((p) => inequality(p, variable))), notation: "inequality" };
  }
  const pieces = splitTop(s, /\\cup|∪/);
  return { intervals: normalize(pieces.map(piece)), notation: "interval" };
}

/** Sort and merge overlapping or touching intervals, so equal sets compare equal. */
export function normalize(list: Interval[]): Interval[] {
  const sorted = [...list].sort((a, b) => a.lo - b.lo || Number(b.loClosed) - Number(a.loClosed));
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && (iv.lo < last.hi || (iv.lo === last.hi && (iv.loClosed || last.hiClosed)))) {
      if (iv.lo === last.lo) last.loClosed ||= iv.loClosed;
      if (iv.hi > last.hi) Object.assign(last, { hi: iv.hi, hiClosed: iv.hiClosed });
      else if (iv.hi === last.hi) last.hiClosed ||= iv.hiClosed;
    } else out.push({ ...iv });
  }
  return out;
}

const near = (a: number, b: number, tol: number) => a === b || Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/** Do two parsed sets contain the same numbers? */
export function sameSet(a: Interval[], b: Interval[], tol = 1e-9): boolean {
  return a.length === b.length && a.every((x, i) => {
    const y = b[i]!;
    return near(x.lo, y.lo, tol) && near(x.hi, y.hi, tol) && x.loClosed === y.loClosed && x.hiClosed === y.hiClosed;
  });
}
