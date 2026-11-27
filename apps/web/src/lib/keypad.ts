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
      k("[", "Open square bracket"), k("]", "Close square bracket"), k("|", "Vertical bar"),
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
    name: "ClassPad",
    keys: [
      k("\\operatorname{solve}\\left(#0\\right)", "solve(", "\\operatorname{solve}"),
      k("\\operatorname{Define}\\,f\\left(x\\right)=", "Define f(x)=", "\\operatorname{Def}"),
      k("f\\left(x\\right)", "f(x)"),
      k("0\\le x\\le 2\\pi", "0 ≤ x ≤ 2π", "{\\scriptstyle 0\\le x\\le 2\\pi}"),
      k("\\operatorname{diff}\\left(#0\\right)", "diff(", "\\operatorname{diff}"),
      k("\\operatorname{approx}\\left(#0\\right)", "approx(", "\\operatorname{approx}"),
      op("cis", "cis"),
      k("\\operatorname{expand}\\left(#0\\right)", "expand(", "\\operatorname{expand}"),
      k("\\operatorname{factor}\\left(#0\\right)", "factor(", "\\operatorname{factor}"),
      k("\\operatorname{combine}\\left(#0\\right)", "combine(", "{\\scriptstyle\\operatorname{combine}}"),
      k("\\operatorname{ans}", "ans"),
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
 * Shift keys on the phone keyboard's 123 tab (in the spirit of a Casio ClassPad): each key's shifted symbol
 * can be chosen in Settings. `null` means Shift types the key itself; "@copy", "@cut", "@paste" and "@undo"
 * are editing commands. Defaults are for writing answers, not computing:
 * - the ClassPad II's own shifts that produce notation: 1–3 sin cos tan, 4 eˣ, 5 ln, 6 log base, 0 π, . i,
 *   ÷ fraction, ^ √, ( [, ) ], and (−) ⇒ on ∀;
 * - its Specialist CAS shifts as the notation they stand for: 7 diff( → d/dx, 8 approx( → ≈, 9 cis, y f(x);
 * - common answer symbols in memorable pairs elsewhere: + ±, − ∓, = ≠, × ·, z ≤, n ≥, e ∞, x θ, π °,
 *   i |z|, x² prime, √ nth root, ∫ without limits.
 */
export interface ShiftSlot {
  id: string;
  /** What the key types (LaTeX, slots allowed). */
  base: string;
  /** Its face, if not `base`. */
  face?: string;
  name: string;
  defaultShift: string | null;
}
export const SHIFT_SLOTS: ShiftSlot[] = [
  { id: "x", base: "x", name: "x", defaultShift: "\\theta" },
  { id: "n", base: "n", name: "n", defaultShift: "\\ge" },
  { id: "7", base: "7", name: "7", defaultShift: "\\frac{d}{dx}" },
  { id: "8", base: "8", name: "8", defaultShift: "\\approx" },
  { id: "9", base: "9", name: "9", defaultShift: "\\operatorname{cis}\\left(#0\\right)" },
  { id: "div", base: "\\frac{#@}{#?}", face: "\\div", name: "Divide", defaultShift: "\\frac{#0}{#?}" },
  { id: "e", base: "e", name: "e", defaultShift: "\\infty" },
  { id: "i", base: "i", name: "i", defaultShift: "\\left|#0\\right|" },
  { id: "pi", base: "\\pi", name: "Pi", defaultShift: "^{\\circ}" },
  { id: "y", base: "y", name: "y", defaultShift: "f\\left(x\\right)" },
  { id: "z", base: "z", name: "z", defaultShift: "\\le" },
  { id: "4", base: "4", name: "4", defaultShift: "e^{#?}" },
  { id: "5", base: "5", name: "5", defaultShift: "\\ln\\left(#0\\right)" },
  { id: "6", base: "6", name: "6", defaultShift: "\\log_{#?}\\left(#0\\right)" },
  { id: "times", base: "\\times", name: "Times", defaultShift: "\\cdot" },
  { id: "square", base: "#@^2", name: "Squared", defaultShift: "#@'" },
  { id: "power", base: "#@^{#?}", name: "Power", defaultShift: "\\sqrt{#0}" },
  { id: "sqrt", base: "\\sqrt{#0}", name: "Square root", defaultShift: "\\sqrt[#?]{#0}" },
  { id: "open", base: "(", name: "Open bracket", defaultShift: "[" },
  { id: "close", base: ")", name: "Close bracket", defaultShift: "]" },
  { id: "1", base: "1", name: "1", defaultShift: "\\sin\\left(#0\\right)" },
  { id: "2", base: "2", name: "2", defaultShift: "\\cos\\left(#0\\right)" },
  { id: "3", base: "3", name: "3", defaultShift: "\\tan\\left(#0\\right)" },
  { id: "minus", base: "-", name: "Minus", defaultShift: "\\mp" },
  { id: "int", base: "\\int_{#?}^{#?}#0\\,dx", face: "\\int_a^b", name: "Definite integral", defaultShift: "\\int #0\\,dx" },
  { id: "forall", base: "\\forall", name: "For all", defaultShift: "\\Rightarrow" },
  { id: "0", base: "0", name: "0", defaultShift: "\\pi" },
  { id: "dot", base: ".", name: "Point", defaultShift: "i" },
  { id: "eq", base: "=", name: "Equals", defaultShift: "\\ne" },
  { id: "plus", base: "+", name: "Plus", defaultShift: "\\pm" },
];
const SHIFT_STORE = "intellectify:shift-keys";
export type ShiftMap = Record<string, string | null>;
/** The student's shift keys: their choices over the defaults. */
export function loadShiftMap(): ShiftMap {
  let saved: ShiftMap = {};
  try {
    saved = JSON.parse(localStorage.getItem(SHIFT_STORE) ?? "{}") as ShiftMap;
  } catch {
    // Unreadable or blocked: defaults.
  }
  return Object.fromEntries(SHIFT_SLOTS.map((s) => [s.id, s.id in saved ? saved[s.id]! : s.defaultShift]));
}
/** Only the keys changed from their defaults, which is what's stored. */
export function shiftOverrides(map: ShiftMap): ShiftMap {
  return Object.fromEntries(SHIFT_SLOTS.filter((s) => s.id in map && map[s.id] !== s.defaultShift).map((s) => [s.id, map[s.id] ?? null]));
}
/** Keep this device's copy of the student's Shift keys (the profile holds the account's). */
export function storeShiftOverrides(overrides: ShiftMap) {
  try {
    localStorage.setItem(SHIFT_STORE, JSON.stringify(overrides));
  } catch {
    // Blocked: the choice lasts until the page closes.
  }
}
export const saveShiftMap = (map: ShiftMap) => storeShiftOverrides(shiftOverrides(map));
/** Editing commands a Shift key can run (MathLive command names). */
export const SHIFT_COMMANDS: { value: string; name: string; command: string }[] = [
  { value: "@copy", name: "Copy", command: "copyToClipboard" },
  { value: "@cut", name: "Cut", command: "cutToClipboard" },
  { value: "@paste", name: "Paste", command: "pasteFromClipboard" },
  { value: "@undo", name: "Undo", command: "undo" },
];
export const shiftCommand = (value: string) => SHIFT_COMMANDS.find((c) => c.value === value);

/** Every key a shift can be set to, once each, grouped as on the keypad. */
export function shiftChoices(): KeyGroup[] {
  const seen = new Set<string>();
  const once = (keys: Key[]) => keys.filter((key) => !seen.has(key.insert) && seen.add(key.insert));
  return [
    { name: "Editing", keys: SHIFT_COMMANDS.map((c) => ({ insert: c.value, name: c.name })) },
    { name: "Basic", keys: once(BASIC) }, ...GREEK.map((g) => ({ name: `Greek: ${g.name.toLowerCase()}`, keys: once(g.keys) })), ...FULL.map((g) => ({ name: g.name, keys: once(g.keys) })),
  ];
}

/** The face to show for some inserted LaTeX: its keypad key's face if it has one ("\\sin" for sin(□)). */
export function faceForInsert(insert: string): string {
  const key = [...BASIC, ...GREEK.flatMap((g) => g.keys), ...FULL.flatMap((g) => g.keys)].find((k) => k.insert === insert && k.face);
  return key?.face ?? insert.replace(/#@/g, "#?");
}

/** A key face as plain text for small labels: "\\sin" → "sin", "\\frac{□}{□}" → "a/b". */
export function plainFace(latex: string): string {
  const SYM: Record<string, string> = {
    pi: "π", theta: "θ", infty: "∞", le: "≤", ge: "≥", ne: "≠", pm: "±", mp: "∓", cdot: "·", approx: "≈", Rightarrow: "⇒",
    times: "×", div: "÷", circ: "°", exists: "∃", forall: "∀", int: "∫", alpha: "α", beta: "β", lambda: "λ", mu: "μ", sigma: "σ",
  };
  const special: [RegExp, string][] = [
    [/^\\frac\{d\}\{dx\}$/, "d/dx"], [/^\\frac\{/, "a/b"], [/^\\sqrt\[/, "ⁿ√"], [/^\\sqrt/, "√"], [/^e\^/, "eˣ"], [/\^\{\\circ\}$/, "°"],
    [/^#\?'$/, "′"], [/^\\log_/, "log"], [/^\\left\|/, "|z|"], [/^f\\left\(x\\right\)$/, "f(x)"], [/^\\int /, "∫"],
  ];
  for (const [re, out] of special) if (re.test(latex)) return out;
  return latex
    .replace(/\\operatorname\{(\w+)\}/g, "$1")
    .replace(/\\(left|right)/g, "")
    .replace(/\\([a-zA-Z]+)/g, (_, c: string) => SYM[c] ?? c)
    .replace(/#[0?@]|[{}]/g, "")
    .replace(/\(\)$/, "")
    .slice(0, 6);
}

/** Short glyph labels for the phone keyboard's tabs, where words don't fit. */
const GLYPH: Record<string, string> = {
  Structures: "□ⁿ",
  "Operators and relations": "±×",
  "Logic and proof": "⇒",
  "Sets and numbers": "∈",
  Geometry: "△",
  "Vectors and matrices": "<b>v</b>",
  "Functions and calculus": "∫",
  "Complex numbers": "ℂ",
  ClassPad: "CAS",
  Statistics: "σ",
};

/** On-screen keyboard layouts for the answer field on phones (MathLive): 123 with Shift keys, letters, then ours. */
export function phoneLayouts(shift: ShiftMap = Object.fromEntries(SHIFT_SLOTS.map((s) => [s.id, s.defaultShift]))): unknown[] {
  const cap = (key: Key) => ({ latex: key.face ?? key.insert.replace(/#@/g, "#?"), insert: key.insert, tooltip: key.name });
  const rows = (keys: Key[], per = 8) => {
    const out: unknown[][] = [];
    for (let i = 0; i < keys.length; i += per) out.push(keys.slice(i, i + per).map(cap));
    return out;
  };
  /** What Shift types, shown small on the key (like the labels above calculator keys). */
  const aside = (sh: string) => shiftCommand(sh)?.name ?? plainFace(faceForInsert(sh));
  /** Faces too wide for a key at full size (CAS words, ranges) get MathLive's small keycap text. */
  const long = (face: string) => /\\operatorname\{\w{5,}\}|\\le|\\scriptstyle/.test(face);
  const slot = (id: string) => {
    const s = SHIFT_SLOTS.find((x) => x.id === id)!;
    const sh = shift[id];
    return {
      latex: s.face ?? s.base.replace(/#@/g, "#?"),
      insert: s.base,
      tooltip: s.name,
      ...(sh ? { aside: aside(sh) } : {}),
      ...(sh ? { shift: shiftCommand(sh) ? { label: `<span class="cmd">${shiftCommand(sh)!.name}</span>`, command: shiftCommand(sh)!.command } : { latex: faceForInsert(sh), insert: sh, ...(long(faceForInsert(sh)) ? { class: "small" } : {}) } } : {}),
    };
  };
  const numeric = {
    label: "123",
    tooltip: "Numbers",
    rows: [
      [slot("x"), slot("n"), "[separator-5]", slot("7"), slot("8"), slot("9"), slot("div"), "[separator-5]", slot("e"), slot("i"), slot("pi")],
      [slot("y"), slot("z"), "[separator-5]", slot("4"), slot("5"), slot("6"), slot("times"), "[separator-5]", slot("square"), slot("power"), slot("sqrt")],
      [slot("open"), slot("close"), "[separator-5]", slot("1"), slot("2"), slot("3"), slot("minus"), "[separator-5]", slot("int"), slot("forall"), { label: "[backspace]", width: 1 }],
      [{ label: "[shift]", width: 2 }, "[separator-5]", slot("0"), slot("dot"), slot("eq"), slot("plus"), "[separator-5]", "[left]", "[right]", { label: "[action]", width: 1 }],
    ],
  };
  return [
    numeric,
    "alphabetic",
    { label: "π√", tooltip: "Common symbols", rows: rows(BASIC) },
    { label: "αβγ", tooltip: "Greek letters", rows: rows(GREEK.flatMap((g) => g.keys)) },
    ...FULL.map((g) => ({ label: GLYPH[g.name] ?? g.name, tooltip: g.name, rows: rows(g.keys) })),
  ];
}
