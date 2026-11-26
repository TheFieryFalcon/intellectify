import { ComputeEngine } from "@cortex-js/compute-engine";

/** A MathJSON expression as produced by Compute Engine with `canonical: false`. */
export type MathJson = number | string | { num: string } | MathJson[];

let engine: ComputeEngine | null = null;
const ce = () => (engine ??= new ComputeEngine());

/**
 * Normalize WACE notation that Compute Engine doesn't know, before parsing.
 * - \binom{n}{r}, ^nC_r and ^nP_r become nCr(n, r) / nPr(n, r)
 * - "cis" typed as letters becomes \operatorname{cis}
 */
export function preprocessLatex(latex: string): string {
  let s = latex.trim();
  s = s.replace(/\\dfrac|\\tfrac/g, "\\frac");
  s = s.replace(/\\left\s*|\\right\s*/g, (m) => m.trim());
  s = s.replace(/\\binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "\\operatorname{nCr}\\left($1,$2\\right)");
  s = s.replace(/(?:\{\})?\^\{?\s*([^{}\s]+?)\s*\}?\s*([CP])_\{?\s*([^{}\s]+?)\s*\}?(?=$|[^A-Za-z0-9])/g, (_m, n, kind, r) => `\\operatorname{n${kind}r}\\left(${n},${r}\\right)`);
  s = s.replace(/\\mathrm\{cis\}|\\text\{cis\}/g, "\\operatorname{cis}");
  s = s.replace(/(^|[^A-Za-z\\{])cis(?=\s*[\\({0-9A-Za-z])/g, "$1\\operatorname{cis}");
  // Vector names: bold, arrow, tilde or underline around one letter means that letter.
  // i, j and k stay the unit vectors (\mathbf{i}), whichever decoration is used.
  s = s.replace(/\\(?:mathbf|boldsymbol|bm|vec|tilde|utilde|hat|overrightarrow|underline)\s*\{\s*([A-Za-z])\s*\}|\\underset\s*\{\s*\\sim\s*\}\s*\{\s*([A-Za-z])\s*\}/g, (_m, a, b) => {
    const v = (a ?? b) as string;
    return "ijk".includes(v) ? `\\mathbf{${v}}` : ` ${v} `;
  });
  return s;
}

export class ParseError extends Error {}

/** Parse student or key LaTeX into raw (non-canonical) MathJSON. Throws ParseError on syntax errors. */
export function parseLatex(latex: string): MathJson {
  if (!latex.trim()) throw new ParseError("empty answer");
  const json = ce().parse(preprocessLatex(latex), { canonical: false }).json as MathJson;
  if (containsError(json)) throw new ParseError(`could not read "${latex}"`);
  return json;
}

function containsError(e: MathJson): boolean {
  if (Array.isArray(e)) return e[0] === "Error" || e.some(containsError);
  return false;
}

/** Head of a function expression, or null for atoms. */
export const head = (e: MathJson): string | null => (Array.isArray(e) && typeof e[0] === "string" ? e[0] : null);
export const args = (e: MathJson): MathJson[] => (Array.isArray(e) ? e.slice(1) : []);

/** Strip Delimiter/Hold wrappers around a single expression. */
export function unwrap(e: MathJson): MathJson {
  while (Array.isArray(e) && (e[0] === "Delimiter" || e[0] === "Hold") && e.length >= 2) {
    const inner = e[1]!;
    if (head(inner) === "Sequence" && args(inner).length !== 1) return e;
    e = head(inner) === "Sequence" ? args(inner)[0]! : inner;
  }
  return e;
}

/** Elements of a list-like expression: (a, b), [a, b], {a, b}, a column/row matrix, or a bare sequence. */
export function listElements(e: MathJson): MathJson[] | null {
  const h = head(e);
  if (h === "Delimiter") {
    const inner = args(e)[0];
    if (inner !== undefined && head(inner) === "Sequence") return args(inner);
    return null;
  }
  if (h === "Sequence" || h === "List" || h === "Set" || h === "Tuple") return args(e);
  if (h === "Matrix") {
    const rows = args(args(e)[0] ?? []).map(args);
    if (rows.every((r) => r.length === 1)) return rows.map((r) => r[0]!);
    if (rows.length === 1) return rows[0]!;
  }
  return null;
}

/** Rows of a matrix expression. */
export function matrixRows(e: MathJson): MathJson[][] | null {
  if (head(e) !== "Matrix") return null;
  return args(args(e)[0] ?? []).map(args);
}
