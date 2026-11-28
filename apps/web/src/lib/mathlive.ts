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
    // Accessible maths (SPEC §16.6): screen readers hear each field through MathLive's live region,
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
  insert: (s: string, o?: object) => boolean;
  executeCommand: (c: string) => boolean;
  position: number;
  lastOffset: number;
};

/** Insert keypad LaTeX at the caret: `#0` takes the selection, `#?` boxes are left to fill in. */
export function insertLatex(el: MathfieldEl, latex: string) {
  el.insert(latex, { selectionMode: "placeholder", focus: true, feedback: false, format: "latex" });
}

/** Ctrl+Alt+S reads a field's maths aloud (SPEC §16.6). Call once the element has upgraded. */
export function addReadAloud(el: MathfieldEl) {
  const mf = el as MathfieldEl & { keybindings?: object[] };
  if (!Array.isArray(mf.keybindings)) return;
  mf.keybindings = [...mf.keybindings, { key: "ctrl+alt+[KeyS]", command: ["speak", "all", { withHighlighting: false }] }];
}
