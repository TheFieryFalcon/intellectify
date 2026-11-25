import { close, Complex } from "./complex.js";
import { evaluate, EvalError, freeSymbols, type Scope } from "./evaluate.js";
import { checkForm, type FormRule } from "./forms.js";
import { args, head, listElements, matrixRows, parseLatex, ParseError, unwrap, type MathJson } from "./parse.js";

/** How each variable is sampled for numeric equivalence. */
export interface VarSpec {
  /** Real interval to sample from. Default [-5, 5]. */
  domain?: [number, number];
  /** Points to keep away from (singularities). */
  avoid?: number[];
  /** Sample complex values (|re|, |im| within the domain) instead of reals. */
  complex?: boolean;
}
export type Vars = Record<string, VarSpec>;

interface Common {
  form?: FormRule[];
  /** Relative tolerance for numeric comparison. */
  tolerance?: number;
}

/** Answer checker specs, as stored in question files (docs/SPEC.md §9.2). */
export type AnswerSpec =
  | (Common & { type: "numeric"; key: string | number; sigFigs?: number })
  | (Common & { type: "expression"; key: string; vars?: Vars; samples?: number; upToConstant?: boolean })
  | (Common & { type: "equation"; key: string; vars?: Vars; samples?: number })
  | (Common & { type: "vector"; key: string[]; vars?: Vars })
  | (Common & { type: "matrix"; key: string[][]; vars?: Vars })
  | (Common & { type: "set" | "list"; key: string[]; vars?: Vars; element?: "expression" | "equation" })
  | { type: "mcq"; key: string }
  | { type: "multi-select"; key: string[] };

export type Verdict =
  | { correct: true }
  | { correct: false; reason: "not-equivalent" | "form" | "unreadable" | "unknown-symbol" | "shape"; message: string };

const WRONG: Verdict = { correct: false, reason: "not-equivalent", message: "Not correct." };
const DEFAULT_TOL = 1e-9;

/** Deterministic PRNG so the same answer always gets the same verdict. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePoints(vars: Vars, count: number, seed = 12345): Scope[] {
  const rand = mulberry32(seed);
  const names = Object.keys(vars);
  const points: Scope[] = [];
  for (let tries = 0; points.length < count && tries < count * 50; tries++) {
    const scope: Scope = {};
    let ok = true;
    for (const name of names) {
      const { domain = [-5, 5], avoid = [], complex = false } = vars[name]!;
      const pick = () => domain[0] + rand() * (domain[1] - domain[0]);
      const re = pick();
      const value = complex ? new Complex(re, pick()) : new Complex(re);
      if (avoid.some((a) => Math.abs(value.re - a) < 1e-3 * Math.max(1, Math.abs(a)) + 1e-3)) ok = false;
      scope[name] = value;
    }
    if (ok) points.push(scope);
  }
  return points;
}

type Parsed = { ok: true; json: MathJson } | { ok: false; verdict: Verdict };

function parseStudent(latex: string): Parsed {
  try {
    return { ok: true, json: parseLatex(latex) };
  } catch (err) {
    if (err instanceof ParseError) return { ok: false, verdict: { correct: false, reason: "unreadable", message: "We couldn't read that answer. Check the brackets and symbols." } };
    throw err;
  }
}

/** Reject symbols the question doesn't define (catches typos like "x" for "t"). */
function unknownSymbolVerdict(student: MathJson, allowed: Set<string>): Verdict | null {
  for (const s of freeSymbols(student)) {
    if (!allowed.has(s)) return { correct: false, reason: "unknown-symbol", message: `Your answer uses "${s}", which isn't part of this question.` };
  }
  return null;
}

/** Numeric-sampling equivalence of two expressions (optionally up to an additive constant). */
function equivalent(student: MathJson, key: MathJson, vars: Vars, opts: { samples?: number; tolerance?: number; upToConstant?: boolean; constants?: Scope } = {}): boolean {
  const tol = opts.tolerance ?? DEFAULT_TOL;
  const points = Object.keys(vars).length ? samplePoints(vars, opts.samples ?? 8) : [{}];
  let offset: Complex | null = null;
  let compared = 0;
  for (const p of points) {
    const scope = { ...opts.constants, ...p };
    let k: Complex;
    try {
      k = evaluate(key, scope);
    } catch {
      continue;
    }
    if (!k.isFinite) continue;
    let s: Complex;
    try {
      s = evaluate(student, scope);
    } catch (err) {
      if (err instanceof EvalError) return false;
      throw err;
    }
    if (!s.isFinite) return false;
    if (opts.upToConstant) {
      const d = s.sub(k);
      if (offset === null) offset = d;
      else if (!close(d, offset, Math.max(tol, 1e-7))) return false;
    } else if (!close(s, k, tol)) return false;
    compared++;
  }
  return compared > 0;
}

/** Equation equivalence: (L − R)_student = λ (L − R)_key for one non-zero constant λ. */
function equivalentEquation(student: MathJson, key: MathJson, vars: Vars, tol = DEFAULT_TOL): boolean {
  if (head(student) !== "Equal" || head(key) !== "Equal") return false;
  const diff = (e: MathJson): MathJson => ["Subtract", args(e)[0]!, args(e)[1]!];
  const s = diff(student);
  const k = diff(key);
  let lambda: Complex | null = null;
  let compared = 0;
  for (const p of samplePoints(vars, 10)) {
    let kv: Complex, sv: Complex;
    try {
      kv = evaluate(k, p);
      sv = evaluate(s, p);
    } catch {
      return false;
    }
    if (!kv.isFinite || !sv.isFinite) continue;
    if (kv.abs() < 1e-9) {
      if (sv.abs() > 1e-7) return false;
      continue;
    }
    const ratio = sv.div(kv);
    if (ratio.abs() < 1e-12) return false;
    if (lambda === null) lambda = ratio;
    else if (!close(ratio, lambda, Math.max(tol, 1e-7))) return false;
    compared++;
  }
  return compared > 0;
}

const sigFigsOf = (latex: string): number | null => {
  const m = latex.trim().match(/^-?(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  const digits = (m[1]! + (m[2] ?? "")).replace(/^0+/, "");
  return digits.length || 1;
};

/** Check a student's answer (LaTeX, or option IDs for MCQ) against a spec. */
export function checkAnswer(spec: AnswerSpec, answer: string | string[]): Verdict {
  if (spec.type === "mcq") return answer === spec.key ? { correct: true } : WRONG;
  if (spec.type === "multi-select") {
    const given = new Set(Array.isArray(answer) ? answer : [answer]);
    return given.size === spec.key.length && spec.key.every((k) => given.has(k)) ? { correct: true } : WRONG;
  }
  if (typeof answer !== "string") return WRONG;

  const parsed = parseStudent(answer);
  if (!parsed.ok) return parsed.verdict;
  const student = parsed.json;
  const vars = "vars" in spec && spec.vars ? spec.vars : {};
  const allowed = new Set(Object.keys(vars));
  const formMsg = () => {
    const msg = checkForm(student, spec.form ?? []);
    return msg ? ({ correct: false, reason: "form", message: msg } as Verdict) : ({ correct: true } as Verdict);
  };

  switch (spec.type) {
    case "numeric": {
      const unknown = unknownSymbolVerdict(student, allowed);
      if (unknown) return unknown;
      const key = typeof spec.key === "number" ? spec.key : parseLatex(spec.key);
      if (spec.sigFigs !== undefined) {
        const sf = sigFigsOf(answer);
        if (sf !== spec.sigFigs) return { correct: false, reason: "form", message: `Give the answer to ${spec.sigFigs} significant figures.` };
        const k = evaluate(key);
        const s = evaluate(student);
        const unit = Math.pow(10, Math.floor(Math.log10(Math.abs(k.re) || 1)) - spec.sigFigs + 1);
        return Math.abs(s.re - k.re) <= unit / 2 + 1e-12 ? formMsg() : WRONG;
      }
      return equivalent(student, key, {}, { tolerance: spec.tolerance }) ? formMsg() : WRONG;
    }

    case "expression": {
      if (spec.upToConstant) ["C", "c"].forEach((c) => allowed.add(c));
      const unknown = unknownSymbolVerdict(student, allowed);
      if (unknown) return unknown;
      const constants = spec.upToConstant ? { C: Complex.ZERO, c: Complex.ZERO } : undefined;
      const ok = equivalent(student, parseLatex(spec.key), vars, { samples: spec.samples, tolerance: spec.tolerance, upToConstant: spec.upToConstant, constants });
      return ok ? formMsg() : WRONG;
    }

    case "equation": {
      const unknown = unknownSymbolVerdict(student, allowed);
      if (unknown) return unknown;
      if (head(student) !== "Equal") return { correct: false, reason: "shape", message: "Write your answer as an equation." };
      return equivalentEquation(student, parseLatex(spec.key), vars, spec.tolerance) ? formMsg() : WRONG;
    }

    case "vector": {
      const comps = vectorComponents(student, spec.key.length);
      if (!comps) return { correct: false, reason: "shape", message: `Give a vector with ${spec.key.length} components.` };
      const unknown = comps.map((c) => unknownSymbolVerdict(c, allowed)).find(Boolean);
      if (unknown) return unknown;
      return comps.every((c, i) => equivalent(c, parseLatex(spec.key[i]!), vars, { tolerance: spec.tolerance })) ? formMsg() : WRONG;
    }

    case "matrix": {
      const rows = matrixRows(student);
      if (!rows || rows.length !== spec.key.length || rows.some((r, i) => r.length !== spec.key[i]!.length)) {
        return { correct: false, reason: "shape", message: `Give a ${spec.key.length} × ${spec.key[0]?.length ?? 0} matrix.` };
      }
      const ok = rows.every((r, i) => r.every((c, j) => equivalent(c, parseLatex(spec.key[i]![j]!), vars, { tolerance: spec.tolerance })));
      return ok ? formMsg() : WRONG;
    }

    case "set":
    case "list": {
      const items = listElements(student) ?? [unwrap(student)];
      if (items.length !== spec.key.length) return { correct: false, reason: "shape", message: `Expected ${spec.key.length} item${spec.key.length === 1 ? "" : "s"}.` };
      const keys = spec.key.map((k) => parseLatex(k));
      const same = (s: MathJson, k: MathJson) => (spec.element === "equation" ? equivalentEquation(s, k, vars, spec.tolerance) : equivalent(s, k, vars, { tolerance: spec.tolerance }));
      if (spec.type === "list") return items.every((s, i) => same(s, keys[i]!)) ? formMsg() : WRONG;
      const unused = new Set(keys.map((_, i) => i));
      for (const s of items) {
        const match = [...unused].find((i) => same(s, keys[i]!));
        if (match === undefined) return WRONG;
        unused.delete(match);
      }
      return formMsg();
    }
  }
}

/** Vector components from (a, b), a column/row matrix, or a i + b j (+ c k) form. */
function vectorComponents(e: MathJson, n: number): MathJson[] | null {
  const list = listElements(e);
  if (list) return list.length === n ? list : null;
  const units = ["i_bold", "j_bold", "k_bold"].slice(0, n);
  const anyUnit = (x: MathJson): boolean => (typeof x === "string" ? units.includes(x) : Array.isArray(x) && x.slice(1).some(anyUnit));
  if (!anyUnit(e)) return null;
  // Each component is the coefficient of its unit vector: evaluate with that unit = 1, others = 0.
  return units.map((u) => ["Hold", substituteUnits(e, u, units)] as MathJson);
}

function substituteUnits(e: MathJson, keep: string, units: string[]): MathJson {
  if (typeof e === "string" && units.includes(e)) return e === keep ? 1 : 0;
  if (Array.isArray(e)) return [e[0]!, ...e.slice(1).map((c) => substituteUnits(c, keep, units))] as MathJson;
  return e;
}
