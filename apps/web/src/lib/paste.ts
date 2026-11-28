/**
 * The paste detector (SPEC §7.2, §8.6): answers are the student's own writing. In every answer field,
 * text from outside the site can't be pasted or dropped in; text copied on the site itself (the
 * student's own answer, a question) still can. Large instant insertions and how long the answer took
 * are kept as signals with the answer, for review; they're never shown as an accusation.
 */
import { getContext, setContext } from "svelte";

/** What one answer's writing looked like. */
export interface AnswerSignals {
  /** Pastes or drops from outside the site that were blocked. */
  blocked: number;
  /** Insertions of 40+ characters at once that weren't from the keypad, a photo or the stylus. */
  bursts: number;
  /** When the question was shown (ms since epoch). */
  openedAt: number;
}

export const newSignals = (): AnswerSignals => ({ blocked: 0, bursts: 0, openedAt: Date.now() });

/** A burst: this many characters arriving in one input event. */
export const BURST = 40;

const KEY = Symbol("answer-signals");
/** A question card shares its signals with the answer fields inside it. */
export const provideSignals = (s: AnswerSignals) => setContext(KEY, s);
export const answerSignals = (): AnswerSignals | undefined => getContext<AnswerSignals | undefined>(KEY);

/**
 * Copies made on the site carry this mark on the clipboard, so pasting them back is always allowed (in
 * any tab of the site, after a reload too). Browsers that drop custom clipboard types fall back to the
 * text itself: text copied or cut on the page this session (normalized) still pastes.
 */
const MARK = "application/x-intellectify";
const copied: string[] = [];
const norm = (t: string) => t.replace(/\s+/g, " ").trim();
let tracking = false;
/** A drag that started on the page (moving text, or a question's words), not one from outside. */
let dragging = false;

function rememberText(t: string | undefined) {
  const n = t ? norm(t) : "";
  if (n && !copied.includes(n)) copied.push(n);
  if (copied.length > 50) copied.splice(0, copied.length - 50);
}

/** Mark a copy that a field has filled in itself (the written-answer editor, which copies its maths as $…$). */
export function markCopied(e: ClipboardEvent, text: string) {
  rememberText(text);
  try {
    e.clipboardData?.setData(MARK, "1");
  } catch {
    // Custom types unsupported: the text is remembered instead.
  }
}

function remember(e: ClipboardEvent) {
  const data = e.clipboardData;
  if (!data) return;
  const editable = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
  if (!e.defaultPrevented && !editable && e.type === "copy") {
    // A plain copy of the page's words: fill the clipboard ourselves, so it carries the mark.
    const sel = document.getSelection();
    const text = sel?.toString() ?? "";
    if (sel?.rangeCount && text) {
      const box = document.createElement("div");
      box.append(sel.getRangeAt(0).cloneContents());
      data.setData("text/plain", text);
      data.setData("text/html", box.innerHTML);
      e.preventDefault();
    }
  }
  // A field that filled the clipboard itself (MathLive copies its LaTeX) has already set the text.
  for (const t of [data.getData("text/plain"), data.getData("application/x-latex"), document.getSelection()?.toString()]) rememberText(t);
  if (e.defaultPrevented) {
    try {
      data.setData(MARK, "1");
    } catch {
      // As above.
    }
  }
}

/** Start remembering what's copied on the page. Safe to call more than once. */
export function trackCopies() {
  if (tracking || typeof document === "undefined") return;
  tracking = true;
  // Bubble phase: after the field's own handler has filled the clipboard.
  document.addEventListener("copy", remember);
  document.addEventListener("cut", remember);
  document.addEventListener("dragstart", () => (dragging = true), true);
  document.addEventListener("dragend", () => (dragging = false), true);
  document.addEventListener("drop", () => setTimeout(() => (dragging = false)), true);
}

/** Was this text copied on the site? Short text (a symbol, a number) always passes. */
export function copiedHere(text: string): boolean {
  const n = norm(text);
  if (n.length <= 3) return true;
  const bare = stripMath(n);
  return copied.some((c) => c === n || c.includes(n) || (!!bare && stripMath(c).includes(bare)));
}
const stripMath = (t: string) => t.replace(/\$\$?|\\[()[\]]/g, "").replace(/\s+/g, " ").trim();

/** Did this clipboard or drag come from the site? */
function fromSite(data: DataTransfer | null): boolean {
  if (!data) return false;
  if (data.types.includes(MARK)) return true;
  if (data.files.length) return false;
  return copiedHere(data.getData("text/plain"));
}

/**
 * Block outside pastes and drops on an answer field. `onblocked` runs after a blocked one (to show a note
 * and count it). Returns a function that removes the guard.
 */
export function guardPaste(el: HTMLElement, onblocked: () => void): () => void {
  trackCopies();
  const paste = (e: ClipboardEvent) => {
    if (fromSite(e.clipboardData)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    onblocked();
  };
  const drop = (e: DragEvent) => {
    if (dragging || fromSite(e.dataTransfer)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    onblocked();
  };
  // Capture: runs before the field (or MathLive inside it) sees the paste.
  el.addEventListener("paste", paste, true);
  el.addEventListener("drop", drop, true);
  return () => {
    el.removeEventListener("paste", paste, true);
    el.removeEventListener("drop", drop, true);
  };
}

/** The signals to store with an answer: counts, and seconds from showing the question to submitting. */
export function signalsAtSubmit(s: AnswerSignals | undefined): { blocked: number; bursts: number; seconds: number } | null {
  if (!s) return null;
  return { blocked: s.blocked, bursts: s.bursts, seconds: Math.round((Date.now() - s.openedAt) / 1000) };
}

export type SubmittedSignals = NonNullable<ReturnType<typeof signalsAtSubmit>>;
/** The last answer's signals, handed from the question card to whatever records the answer. */
let handed: SubmittedSignals | null = null;
export const handOffSignals = (s: AnswerSignals | undefined) => (handed = signalsAtSubmit(s));
export function takeSignals(): SubmittedSignals | null {
  const s = handed;
  handed = null;
  return s;
}
