import { args, head, unwrap, type MathJson } from "./parse.js";

/**
 * Form rules check how an answer is written, not just its value (docs/SPEC.md §9.1).
 * They run on the student's raw MathJSON.
 */
export type FormRule =
  | "exact"
  | "simplified-fraction"
  | "rationalised-denominator"
  | "factorised"
  | "expanded"
  | "cartesian"
  | "polar"
  | "exponential"
  | "constant-of-integration";

const walk = (e: MathJson, visit: (n: MathJson) => void) => {
  visit(e);
  if (Array.isArray(e)) e.slice(1).forEach((c) => walk(c, visit));
};
const some = (e: MathJson, pred: (n: MathJson) => boolean) => {
  let found = false;
  walk(e, (n) => {
    if (!found && pred(n)) found = true;
  });
  return found;
};
const isDecimal = (n: MathJson) =>
  (typeof n === "number" && !Number.isInteger(n)) || (typeof n === "object" && n !== null && !Array.isArray(n) && "num" in n && /[.eE]/.test(n.num));
const hasSymbol = (e: MathJson, s: string) => some(e, (n) => n === s);
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const isProductHead = (h: string | null) => h === "Multiply" || h === "InvisibleOperator";

const RULES: Record<FormRule, { test: (e: MathJson) => boolean; message: string }> = {
  exact: {
    test: (e) => !some(e, isDecimal),
    message: "Give an exact answer (no decimals).",
  },
  "simplified-fraction": {
    test: (e) =>
      !some(e, (n) => {
        if (head(n) !== "Divide") return false;
        const [p, q] = args(n).map(unwrap);
        return typeof p === "number" && typeof q === "number" && (gcd(p, q) !== 1 || q === 1 || q < 0);
      }),
    message: "Simplify the fraction.",
  },
  "rationalised-denominator": {
    test: (e) =>
      !some(e, (n) => {
        if (head(n) === "Divide") return some(args(n)[1]!, (m) => head(m) === "Sqrt" || head(m) === "Root");
        if (head(n) === "Power") {
          const [b, x] = args(n);
          return typeof x === "number" && x < 0 && some(b!, (m) => head(m) === "Sqrt" || head(m) === "Root");
        }
        return false;
      }),
    message: "Rationalise the denominator.",
  },
  factorised: {
    test: (e) => {
      const top = unwrap(head(e) === "Negate" ? args(e)[0]! : e);
      return isProductHead(head(top)) || head(top) === "Power" || typeof top === "string";
    },
    message: "Write the answer in factorised form.",
  },
  expanded: {
    test: (e) =>
      !some(e, (n) => {
        if (head(n) === "Power") return head(unwrap(args(n)[0]!)) === "Add";
        if (isProductHead(head(n))) return args(n).some((c) => head(unwrap(c)) === "Add");
        return false;
      }),
    message: "Expand the expression fully.",
  },
  cartesian: {
    test: (e) => !hasSymbol(e, "cis") && !some(e, (n) => ["Sin", "Cos", "Exp"].includes(head(n) ?? "")) && !some(e, isExpOfImaginary),
    message: "Give the answer in Cartesian form a + bi.",
  },
  polar: {
    test: (e) => hasSymbol(e, "cis") || (some(e, (n) => head(n) === "Cos") && some(e, (n) => head(n) === "Sin")),
    message: "Give the answer in polar form r cis θ.",
  },
  exponential: {
    test: (e) => some(e, isExpOfImaginary),
    message: "Give the answer in exponential form re^{iθ}.",
  },
  "constant-of-integration": {
    test: (e) => hasSymbol(e, "C") || hasSymbol(e, "c"),
    message: "Include the constant of integration.",
  },
};

function isExpOfImaginary(n: MathJson): boolean {
  if (head(n) === "Exp") return hasSymbol(n, "i");
  if (head(n) === "Power") {
    const [b, x] = args(n);
    return (b === "e" || b === "ExponentialE") && hasSymbol(x!, "i");
  }
  return false;
}

/** Returns the message for the first failed rule, or null when all rules pass. */
export function checkForm(e: MathJson, rules: readonly FormRule[] = []): string | null {
  for (const r of rules) if (!RULES[r].test(e)) return RULES[r].message;
  return null;
}
