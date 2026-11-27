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

/** Text copied or cut on this page this session (normalized), so pasting it back is allowed. */
const copied: string[] = [];
const norm = (t: string) => t.replace(/\s+/g, " ").trim();
let tracking = false;

function remember(e: ClipboardEvent) {
  // Read after the field's own handler has filled the clipboard (MathLive sets LaTeX itself).
  const fromEvent = [e.clipboardData?.getData("text/plain"), e.clipboardData?.getData("application/x-latex")];
  const fromSelection = document.getSelection()?.toString();
  for (const t of [...fromEvent, fromSelection]) {
    const n = t ? norm(t) : "";
    if (n && !copied.includes(n)) copied.push(n);
  }
  if (copied.length > 50) copied.splice(0, copied.length - 50);
}

/** Start remembering what's copied on the page. Safe to call more than once. */
export function trackCopies() {
  if (tracking || typeof document === "undefined") return;
  tracking = true;
  document.addEventListener("copy", remember);
  document.addEventListener("cut", remember);
}

/** Was this text copied on the site? Short text (a symbol, a number) always passes. */
export function copiedHere(text: string): boolean {
  const n = norm(text);
  if (n.length <= 3) return true;
  return copied.some((c) => c === n || c.includes(n) || stripMath(c) === stripMath(n));
}
const stripMath = (t: string) => t.replace(/\$\$?|\\[()[\]]/g, "").trim();

/**
 * Block outside pastes and drops on an answer field. `onblocked` runs after a blocked one (to show a note
 * and count it). Returns a function that removes the guard.
 */
export function guardPaste(el: HTMLElement, onblocked: () => void): () => void {
  trackCopies();
  const paste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData("text/plain") ?? "";
    const hasFiles = (e.clipboardData?.files.length ?? 0) > 0;
    if (!hasFiles && copiedHere(text)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    onblocked();
  };
  const drop = (e: DragEvent) => {
    const text = e.dataTransfer?.getData("text/plain") ?? "";
    if (text && copiedHere(text) && !(e.dataTransfer?.files.length ?? 0)) return;
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
