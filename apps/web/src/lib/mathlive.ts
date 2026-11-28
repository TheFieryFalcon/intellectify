/**
 * MathLive, loaded on demand (it's large). On phones its on-screen keyboard gets our layouts, with the
 * student's Shift keys (SPEC §7.2); they're re-read each time, so a change in Settings applies at once.
 */
import { loadShiftMap, phoneLayouts } from "./keypad";

export const isTouch = () => typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

let loading: Promise<void> | null = null;
export async function loadMathLive(): Promise<void> {
  loading ??= import("mathlive").then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = "/mathlive/fonts";
    MathfieldElement.soundsDirectory = null;
    // Accessible maths (SPEC §15.6): screen readers hear each field through MathLive's live region,
    // and Ctrl+Alt+S reads the whole answer aloud with the browser's own voice.
    MathfieldElement.speechEngine = "local";
  });
  await loading;
  const vk = (window as unknown as { mathVirtualKeyboard?: { layouts: unknown } }).mathVirtualKeyboard;
  if (vk && isTouch()) vk.layouts = phoneLayouts(loadShiftMap());
}

/** The MathLive element's methods we use. */
export type MathfieldEl = HTMLElement & {
  value: string;
  mode: "math" | "text" | "latex";
  insert: (s: string, o?: object) => boolean;
  executeCommand: (c: string | unknown[]) => boolean;
  getValue: (format?: string) => string;
  position: number;
  lastOffset: number;
  selectionIsCollapsed: boolean;
};

/** The answer's LaTeX: empty boxes left unfilled are dropped, never stored as `\placeholder{}`. */
export const latexOf = (el: MathfieldEl): string => el.getValue("latex-without-placeholders");

/** Is there nothing in this field, not even a half-typed `\command`? */
export const isEmpty = (el: MathfieldEl): boolean => el.mode !== "latex" && !el.value;

/**
 * MathLive's editing model, for the few things the public API can't tell us (what's just before the
 * caret). MathLive's version is pinned, and every use falls back to a plain insert if this is missing.
 */
type Atom = {
  type?: string;
  value?: string;
  mode?: string;
  isSuggestion?: boolean;
  parent?: Atom;
  body?: Atom[];
  leftSibling?: Atom;
  superscript?: unknown;
  subscript?: unknown;
};
type Model = {
  position: number;
  selectionIsCollapsed: boolean;
  at: (offset: number) => Atom | undefined;
  offsetOf: (atom: Atom) => number;
  setSelection: (from: number, to: number) => boolean;
};
const modelOf = (el: MathfieldEl): Model | undefined => (el as unknown as { _mathfield?: { model?: Model } })._mathfield?.model;

/** Insert LaTeX at the caret: `#0` takes the selection, `#?` boxes are left to fill in (the first one selected). */
export function insertLatex(el: MathfieldEl, latex: string) {
  el.insert(latex, { selectionMode: "placeholder", focus: true, feedback: false, format: "latex" });
}

/** Keys that attach to what was typed just before: powers, subscripts, primes. */
const SCRIPT = /^#@([\^_])(\{(.*)\}|(.))$/;
const PRIME = /^#@'$/;
/** Keys that decorate letters: vector arrows, hats, bars, bold. They take the letters just before the caret. */
const ACCENT = /^\\(?:vec|hat|bar|overline|overrightarrow|overleftrightarrow|dot|ddot|mathbf|tilde|underset\{\\sim\}|overset\{\\frown\})\{#0\}$/;

/** Keys with exactly one empty box (√□, sin(□), |□|, (□), eˣ…): the term just typed goes in the box. */
const oneBox = (latex: string) => (latex.match(/#[0?@]/g) ?? []).length === 1 && !SCRIPT.test(latex) && !PRIME.test(latex) && !ACCENT.test(latex);

/**
 * How a key takes what was typed just before it, so words can become maths first:
 * "term" — x² squares the term before it, √ and sin go round it; "letters" — a vector arrow goes over the
 * letters before it.
 */
export function takesPrevious(latex: string): "term" | "letters" | null {
  if (SCRIPT.test(latex) || PRIME.test(latex) || oneBox(latex)) return "term";
  if (ACCENT.test(latex)) return "letters";
  return null;
}

/**
 * The first atom of the term just before the caret: back to the nearest operator, relation, comma, space
 * or open bracket, keeping bracketed groups whole ("2x", "3(x+1)", a vector, a fraction). None at the start
 * of a box or just after an operator.
 */
function termStart(prev: Atom | undefined): Atom | undefined {
  let first: Atom | undefined;
  let depth = 0;
  for (let a = prev; a && a.type !== "first" && a.mode !== "text"; a = a.leftSibling) {
    if (a.type === "mclose") depth++;
    else if (a.type === "mopen") {
      if (depth === 0) break;
      depth--;
    } else if (depth === 0 && /^(mbin|mrel|mpunct|space|spacing)$/.test(a.type ?? "")) break;
    first = a;
  }
  return first;
}

/** Atoms that can't carry a power: nothing (start of a box), operators, relations, commas, open brackets, spaces. */
const hasBase = (a: Atom | undefined): a is Atom => !!a && a.mode !== "text" && !/^(first|mbin|mrel|mpunct|mopen|space|spacing)$/.test(a.type ?? "");

/** The arrow for a vector: \vec over one letter, a full-width arrow over more (or over an empty box, where \vec is drawn askew). */
const arrowFor = (latex: string, letters: number) => (letters === 1 ? latex : latex.replace(/^\\vec\{/, "\\overrightarrow{"));

/**
 * A keypad key, applied the way it reads (SPEC §7.2):
 * - with something selected, the key wraps it (brackets, root, vector, power…);
 * - x² and other powers, subscripts and primes attach to the term just typed, whatever it is (a vector,
 *   a bracket, a letter); a fraction or something already raised to a power is bracketed first;
 * - a vector arrow, hat or bar goes over the letters just typed ("AB" then arrow gives AB with an arrow);
 * - a key with one empty box (√□, sin(□), |□|, (□), e^□…) puts the term just typed in the box
 *   ("2x" then √ gives √(2x));
 * - otherwise the key goes in at the caret with empty boxes to fill in.
 */
export function applyKey(el: MathfieldEl, latex: string) {
  const model = modelOf(el);
  if (!model) return insertLatex(el, latex.replace(/#@/g, "#?"));
  if (!model.selectionIsCollapsed) {
    // MathLive gives `#@` the selection too; a vector arrow over a selection is always full width.
    return insertLatex(el, ACCENT.test(latex) ? arrowFor(latex, 2) : latex);
  }
  const prev = model.at(model.position);
  const script = SCRIPT.exec(latex);
  if (script) {
    if (!hasBase(prev)) return insertLatex(el, latex.replace("#@", "#?"));
    const sup = script[1] === "^";
    const body = script[3] ?? script[4] ?? "";
    // (½)², (x²)²: bracket first, so the power belongs to the whole thing.
    const needsBrackets = prev.type === "genfrac" || (sup ? !!prev.superscript : !!prev.subscript);
    if (needsBrackets && prev.leftSibling) {
      model.setSelection(model.offsetOf(prev.leftSibling), model.position);
      return insertLatex(el, `\\left(#0\\right)${script[1]}{${body}}`);
    }
    el.executeCommand(sup ? "moveToSuperscript" : "moveToSubscript");
    insertLatex(el, body);
    if (!body.includes("#?")) el.executeCommand("moveAfterParent");
    return;
  }
  if (PRIME.test(latex)) return insertLatex(el, hasBase(prev) ? "'" : "#?'");
  if (ACCENT.test(latex)) {
    let first: Atom | undefined;
    let letters = 0;
    for (let a = prev; a && a.type === "mord" && a.mode !== "text" && /^[A-Za-z]$/.test(a.value ?? "") && !a.superscript && !a.subscript; a = a.leftSibling) {
      first = a;
      letters++;
    }
    if (first?.leftSibling) model.setSelection(model.offsetOf(first.leftSibling), model.position);
    return insertLatex(el, arrowFor(latex, letters));
  }
  if (oneBox(latex)) {
    const first = termStart(prev);
    if (first?.leftSibling) {
      model.setSelection(model.offsetOf(first.leftSibling), model.position);
      return insertLatex(el, latex.replace(/#[0?@]/, "#0"));
    }
  }
  insertLatex(el, latex.replace(/#@/g, "#?"));
}

/** Settings every answer field gets once MathLive has loaded. */
export function setUpField(el: MathfieldEl) {
  const mf = el as MathfieldEl & { keybindings?: object[]; menuItems?: { id?: string }[] };
  // Ctrl+Alt+S reads the maths aloud (SPEC §15.6).
  if (Array.isArray(mf.keybindings)) mf.keybindings = [...mf.keybindings, { key: "ctrl+alt+[KeyS]", command: ["speak", "all", { withHighlighting: false }] }];
  // No pasting from MathLive's own menu (SPEC §7.2): the keyboard paste is checked instead.
  if (Array.isArray(mf.menuItems)) mf.menuItems = mf.menuItems.filter((m) => m.id !== "paste");
}

/** Typed commands that take arguments, inserted with a box for each, the caret in the first. */
const TWO = ["frac", "dfrac", "tfrac", "cfrac", "binom", "dbinom", "tbinom", "overset", "underset", "stackrel"];
const ONE = [
  "sqrt", "hat", "widehat", "bar", "overline", "underline", "dot", "ddot", "tilde", "widetilde", "check", "breve", "acute", "grave", "mathring",
  "overrightarrow", "overleftarrow", "overleftrightarrow", "underrightarrow", "underleftarrow", "mathbf", "mathrm", "mathit", "mathbb", "mathcal",
  "mathfrak", "mathsf", "boldsymbol", "bm", "text", "textbf", "textit", "operatorname", "overbrace", "underbrace", "cancel", "boxed",
];
function templateFor(cmd: string): string {
  const name = cmd.slice(1);
  // \vec is drawn askew over an empty box and over more than one letter; a full-width arrow reads the same.
  if (name === "vec") return "\\overrightarrow{#?}";
  if (TWO.includes(name)) return `${cmd}{#?}{#?}`;
  if (ONE.includes(name)) return `${cmd}{#?}`;
  return cmd;
}

/** In a half-typed `\command`: what's typed, and the rest of MathLive's suggestion. */
function typedCommand(el: MathfieldEl): { typed: string; suggested: string } | null {
  const model = modelOf(el);
  const group = model?.at(model.position)?.parent;
  if (group?.type !== "latexgroup" || !group.body) return null;
  const atoms = group.body.filter((a) => a.type === "latex");
  return { typed: atoms.filter((a) => !a.isSuggestion).map((a) => a.value).join(""), suggested: atoms.filter((a) => a.isSuggestion).map((a) => a.value).join("") };
}

/**
 * Keys every answer field handles before MathLive does (call from a capture-phase keydown listener).
 * In a half-typed `\command`: Tab takes the suggestion shown and finishes it, Enter (or Shift+Enter)
 * finishes it as typed, and Backspace on a lone `\` goes back to maths (it never deletes the maths around
 * it). A finished command with arguments gets a box for each, with the caret in the first.
 * Escape never switches to raw LaTeX. Returns true when it handled the key.
 */
export function fieldKey(el: MathfieldEl, e: KeyboardEvent): boolean {
  if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
  const stop = () => {
    e.preventDefault();
    e.stopPropagation();
    return true;
  };
  if (el.mode !== "latex") return e.key === "Escape" ? stop() : false;
  const cmd = typedCommand(el);
  if (!cmd) return false;
  if ((e.key === "Tab" && !e.shiftKey) || e.key === "Enter") {
    stop();
    const latex = e.key === "Tab" ? cmd.typed + cmd.suggested : cmd.typed;
    el.executeCommand(["complete", "reject"]);
    if (/^\\[a-zA-Z]+$/.test(latex)) insertLatex(el, templateFor(latex));
    else if (latex.length > 1) insertLatex(el, latex);
    return true;
  }
  if (e.key === "Backspace" && cmd.typed.length <= 1) {
    stop();
    el.executeCommand(["complete", "reject"]);
    return true;
  }
  return false;
}
