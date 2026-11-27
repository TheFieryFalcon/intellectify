/**
 * The maths keypad (SPEC §7.2): buttons that insert mathematics, so students never need LaTeX.
 * One set of keys drives both the on-page keypad (computers, and written answers everywhere) and the
 * on-screen keyboard of the answer field on phones.
 *
 * A key's `insert` is LaTeX with slots: `#0` takes the selection, `#?` is an empty box to fill in, and
 * `#@` (answer field only) takes what was typed just before, so x then "power" gives x^□.
 */

export interface Key {
  /** LaTeX inserted. */
  insert: string;
  /** What the key shows, as LaTeX (defaults to `insert`, with empty boxes for slots). */
  face?: string;
  /** Spoken name and tooltip. */
  name: string;
}
export interface KeyGroup {
  name: string;
  keys: Key[];
}

const k = (insert: string, name: string, face?: string): Key => ({ insert, name, ...(face ? { face } : {}) });
const fn = (cmd: string, name: string): Key => k(`\\${cmd}\\left(#0\\right)`, name, `\\${cmd}`);
const op = (cmd: string, name: string): Key => k(`\\operatorname{${cmd}}\\left(#0\\right)`, name, `\\operatorname{${cmd}}`);

const fraction = k("\\frac{#0}{#?}", "Fraction");
const power = k("#@^{#?}", "Power");
const square = k("#@^2", "Squared");
const sqrt = k("\\sqrt{#0}", "Square root");
const nthRoot = k("\\sqrt[#?]{#0}", "nth root");
const abs = k("\\left|#0\\right|", "Absolute value");
const parens = k("\\left(#0\\right)", "Brackets");
const subscript = k("#@_{#?}", "Subscript");

export const BASIC: Key[] = [
  fraction, power, square, sqrt, nthRoot, abs, parens, subscript,
  k("\\pi", "Pi"), k("e", "e"), k("i", "i"), k("\\infty", "Infinity"),
  k("\\pm", "Plus or minus"), k("\\times", "Times"), k("\\div", "Divide"), k("\\cdot", "Dot"),
  k("\\le", "Less than or equal"), k("\\ge", "Greater than or equal"), k("\\ne", "Not equal"), k("\\approx", "Approximately"),
  k("^{\\circ}", "Degrees", "\\square^{\\circ}"), k("\\theta", "Theta"),
  fn("sin", "Sine"), fn("cos", "Cosine"), fn("tan", "Tangent"), fn("ln", "Natural log"), fn("log", "Log"),
  k("e^{#?}", "e to the power"), k("\\binom{#?}{#?}", "Choose"), k("!", "Factorial", "n!"),
];

const greek = (pairs: [string, string][]) => pairs.map(([cmd, name]) => k(`\\${cmd}`, name));
export const GREEK: KeyGroup[] = [
  {
    name: "Lowercase",
    keys: greek([
      ["alpha", "Alpha"], ["beta", "Beta"], ["gamma", "Gamma"], ["delta", "Delta"], ["epsilon", "Epsilon"], ["varepsilon", "Epsilon (curly)"],
      ["zeta", "Zeta"], ["eta", "Eta"], ["theta", "Theta"], ["iota", "Iota"], ["kappa", "Kappa"], ["lambda", "Lambda"],
      ["mu", "Mu"], ["nu", "Nu"], ["xi", "Xi"], ["pi", "Pi"], ["rho", "Rho"], ["sigma", "Sigma"],
      ["tau", "Tau"], ["upsilon", "Upsilon"], ["phi", "Phi"], ["varphi", "Phi (curly)"], ["chi", "Chi"], ["psi", "Psi"], ["omega", "Omega"],
    ]),
  },
  {
    name: "Capitals",
    keys: greek([
      ["Gamma", "Capital gamma"], ["Delta", "Capital delta"], ["Theta", "Capital theta"], ["Lambda", "Capital lambda"], ["Xi", "Capital xi"],
      ["Pi", "Capital pi"], ["Sigma", "Capital sigma"], ["Phi", "Capital phi"], ["Psi", "Capital psi"], ["Omega", "Capital omega"],
    ]),
  },
];

export const FULL: KeyGroup[] = [
  {
    name: "Structures",
    keys: [
      fraction, power, subscript, square, sqrt, nthRoot, abs, parens,
      k("\\left[#0\\right]", "Square brackets"), k("\\left\\{#0\\right\\}", "Braces"),
      k("\\overline{#0}", "Overline"), k("\\bar{#0}", "Bar"), k("\\hat{#0}", "Hat"), k("\\dot{#0}", "Dot above"), k("\\ddot{#0}", "Two dots above"),
      k("#@'", "Prime", "f'"), k("!", "Factorial", "n!"), k("\\binom{#?}{#?}", "Choose"),
      k("{}^{#?}C_{#?}", "Combinations", "{}^{n}C_{r}"), k("{}^{#?}P_{#?}", "Permutations", "{}^{n}P_{r}"),
    ],
  },
  {
    name: "Operators and relations",
    keys: [
      k("+", "Plus"), k("-", "Minus"), k("\\times", "Times"), k("\\div", "Divide"), k("\\cdot", "Dot"), k("\\pm", "Plus or minus"), k("\\mp", "Minus or plus"),
      k("=", "Equals"), k("\\ne", "Not equal"), k("\\approx", "Approximately"), k("\\equiv", "Identical to"), k("\\propto", "Proportional to"),
      k("<", "Less than"), k(">", "Greater than"), k("\\le", "Less than or equal"), k("\\ge", "Greater than or equal"), k("\\circ", "Composed with"), k("\\%", "Percent"),
    ],
  },
  {
    name: "Logic and proof",
    keys: [
      k("\\Rightarrow", "Implies"), k("\\Leftarrow", "Is implied by"), k("\\Leftrightarrow", "If and only if"), k("\\to", "Tends to"),
      k("\\therefore", "Therefore"), k("\\because", "Because"), k("\\forall", "For all"), k("\\exists", "There exists"), k("\\nexists", "There is no"),
      k("\\neg", "Not"), k("\\land", "And"), k("\\lor", "Or"), k("\\blacksquare", "End of proof"),
    ],
  },
  {
    name: "Sets and numbers",
    keys: [
      k("\\in", "Is in"), k("\\notin", "Is not in"), k("\\subset", "Subset"), k("\\subseteq", "Subset or equal"), k("\\cup", "Union"), k("\\cap", "Intersection"),
      k("\\setminus", "Set minus"), k("\\emptyset", "Empty set"), k("\\left\\{#0\\right\\}", "Set braces"), k("A'", "Complement", "A'"),
      k("\\mathbb{N}", "Natural numbers"), k("\\mathbb{Z}", "Integers"), k("\\mathbb{Q}", "Rationals"), k("\\mathbb{R}", "Reals"), k("\\mathbb{C}", "Complex numbers"),
    ],
  },
  {
    name: "Geometry",
    keys: [
      k("\\triangle", "Triangle"), k("\\angle", "Angle"), k("^{\\circ}", "Degrees", "\\square^{\\circ}"), k("\\parallel", "Parallel"), k("\\perp", "Perpendicular"),
      k("\\cong", "Congruent"), k("\\sim", "Similar"), k("\\overline{#0}", "Line segment", "\\overline{AB}"),
      k("\\overleftrightarrow{#0}", "Line", "\\overleftrightarrow{AB}"), k("\\overrightarrow{#0}", "Ray or vector", "\\overrightarrow{AB}"),
      k("\\overset{\\frown}{#0}", "Arc", "\\overset{\\frown}{AB}"), k("\\square", "Square"),
    ],
  },
  {
    name: "Vectors and matrices",
    keys: [
      k("\\underset{\\sim}{#0}", "Vector (tilde under)", "\\underset{\\sim}{a}"), k("\\vec{#0}", "Vector (arrow)", "\\vec{a}"), k("\\mathbf{#0}", "Vector (bold)", "\\mathbf{a}"),
      k("\\overrightarrow{#0}", "Vector between points", "\\overrightarrow{AB}"), k("\\hat{#0}", "Unit vector", "\\hat{a}"),
      k("\\mathbf{i}", "i"), k("\\mathbf{j}", "j"), k("\\mathbf{k}", "k"), k("\\left|#0\\right|", "Magnitude"),
      k("\\begin{pmatrix}#0\\\\#?\\end{pmatrix}", "Column vector"), k("\\begin{pmatrix}#0\\\\#?\\\\#?\\end{pmatrix}", "3D column vector"),
      k("\\begin{pmatrix}#0&#?\\\\#?&#?\\end{pmatrix}", "2 by 2 matrix"), k("#@^{-1}", "Inverse", "A^{-1}"), k("#@^{T}", "Transpose", "A^{T}"),
      k("\\det\\left(#0\\right)", "Determinant", "\\det"), k("\\cdot", "Dot product"), k("\\times", "Cross product"),
    ],
  },
  {
    name: "Functions and calculus",
    keys: [
      fn("sin", "Sine"), fn("cos", "Cosine"), fn("tan", "Tangent"), fn("sec", "Secant"), fn("csc", "Cosecant"), fn("cot", "Cotangent"),
      k("\\sin^{-1}\\left(#0\\right)", "Inverse sine", "\\sin^{-1}"), k("\\cos^{-1}\\left(#0\\right)", "Inverse cosine", "\\cos^{-1}"), k("\\tan^{-1}\\left(#0\\right)", "Inverse tangent", "\\tan^{-1}"),
      fn("ln", "Natural log"), fn("log", "Log"), k("\\log_{#?}\\left(#0\\right)", "Log base", "\\log_{b}"), k("e^{#?}", "e to the power"),
      k("\\frac{d}{dx}", "Derivative"), k("\\frac{dy}{dx}", "dy by dx"), k("\\frac{d^2y}{dx^2}", "Second derivative"),
      k("\\int #0\\,dx", "Integral", "\\int"), k("\\int_{#?}^{#?} #0\\,dx", "Definite integral", "\\int_a^b"),
      k("\\sum_{#?}^{#?}", "Sum", "\\sum"), k("\\lim_{#?\\to #?}", "Limit", "\\lim"), k("\\infty", "Infinity"), k("\\Delta", "Change in", "\\Delta"),
    ],
  },
  {
    name: "Complex numbers",
    keys: [
      k("i", "i"), op("cis", "cis"), op("Re", "Real part"), op("Im", "Imaginary part"), op("Arg", "Argument"),
      k("\\overline{#0}", "Conjugate", "\\bar{z}"), k("\\left|#0\\right|", "Modulus", "|z|"), k("e^{i#?}", "e to the i", "e^{i\\theta}"),
    ],
  },
  {
    name: "Statistics",
    keys: [k("\\bar{x}", "x bar"), k("\\hat{p}", "p hat"), k("\\mu", "Mu"), k("\\sigma", "Sigma"), k("\\sigma^2", "Variance"), k("\\sum", "Sum"), k("\\mathrm{P}\\left(#0\\right)", "Probability", "P(A)"), k("\\mathrm{E}\\left(#0\\right)", "Expected value", "E(X)")],
  },
];

/** A key's face as LaTeX: slots shown as empty boxes. */
export const faceOf = (key: Key) => key.face ?? key.insert.replace(/#[0?@]/g, "\\square");

/**
 * Insert a key into plain text (a written answer, where mathematics goes between $ signs). Outside $…$ the
 * mathematics is wrapped in $ signs; the caret lands in the first empty slot. Returns the new text and caret.
 */
export function insertIntoText(text: string, start: number, end: number, insert: string): { text: string; caret: number } {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const dollars = (before.match(/(^|[^\\])\$/g) ?? []).length;
  const inMath = dollars % 2 === 1;
  // \left( and \right) are for the answer field's sizing; plain brackets read better in text.
  let body = insert.replace(/\\left(?=[(|[]|\\\{)/g, "").replace(/\\right(?=[)|\]]|\\\})/g, "");
  const CARET = "\u0000";
  let caretPlaced = false;
  body = body.replace(/#[0?@]/g, (slot) => {
    if (slot === "#0" && selected) return selected;
    if (caretPlaced) return "";
    caretPlaced = true;
    return CARET;
  });
  // A command straight before a letter needs a space after it ("\pi r", not "\pir").
  if (/\\[a-zA-Z]+$/.test(body)) body += " ";
  if (!inMath) body = `$${body}$`;
  let at = body.indexOf(CARET);
  if (at < 0) at = inMath ? body.length : body.length - 1;
  body = body.replace(CARET, "");
  return { text: before + body + text.slice(end), caret: start + at };
}

/** On-screen keyboard layouts for the answer field on phones (MathLive): numbers and letters, then ours. */
export function phoneLayouts(): unknown[] {
  const cap = (key: Key) => ({ latex: key.face ?? key.insert.replace(/#@/g, "#?"), insert: key.insert, tooltip: key.name });
  const rows = (keys: Key[], per = 8) => {
    const out: unknown[][] = [];
    for (let i = 0; i < keys.length; i += per) out.push(keys.slice(i, i + per).map(cap));
    return out;
  };
  return [
    "numeric",
    "alphabetic",
    { label: "Basic", tooltip: "Common symbols", rows: rows(BASIC) },
    { label: "αβγ", tooltip: "Greek letters", rows: rows(GREEK.flatMap((g) => g.keys)) },
    ...FULL.map((g) => ({ label: g.name.split(" ")[0], tooltip: g.name, rows: rows(g.keys) })),
  ];
}
