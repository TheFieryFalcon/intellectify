<script lang="ts">
  /**
   * A written answer, edited as it will read (SPEC §6.3, §7.2): words as text, mathematics as live maths
   * inline, never raw LaTeX. Stored as text with mathematics between $ signs, which is what the marker reads.
   *
   * Maths appears where the keypad inserts it, where "Maths" is pressed, or where $ is typed. Arrow keys
   * past either end of a piece of maths, Enter or $ go back to the words; Backspace in empty maths removes it.
   */
  import { onMount } from "svelte";
  import type { Key } from "$lib/keypad";
  import { addReadAloud, insertLatex, isTouch, loadMathLive, type MathfieldEl } from "$lib/mathlive";
  import { joinMath, splitMath, type Segment } from "$lib/mathtext";
  import { answerSignals, BURST, guardPaste } from "$lib/paste";

  let {
    value = $bindable(),
    disabled = false,
    label,
    placeholder = "",
    onfocus,
  }: { value?: string | undefined; disabled?: boolean; label: string; placeholder?: string; onfocus?: () => void } = $props();

  let root: HTMLDivElement;
  let ready = $state(false);
  /** The text last written to `value`, so outside changes (a photo read, a reset) can be told apart. */
  let last: string | null = null;
  let activeMath: MathfieldEl | null = null;
  /** Where the caret was in the words, so a keypad press there knows where to put the maths. */
  let saved: Range | null = null;
  const touch = isTouch();
  const ZWSP = "​";

  onMount(() => {
    void loadMathLive().then(() => {
      ready = true;
    });
    const track = () => {
      const sel = document.getSelection();
      if (!sel?.rangeCount) return;
      const r = sel.getRangeAt(0);
      if (root?.contains(r.startContainer) && !(r.startContainer as Element).closest?.(".m") && !r.startContainer.parentElement?.closest(".m")) saved = r.cloneRange();
    };
    document.addEventListener("selectionchange", track);
    // No pasting or dropping text from outside the site (SPEC §7.2); text copied here still pastes.
    const unguard = guardPaste(root, blocked);
    return () => {
      document.removeEventListener("selectionchange", track);
      unguard();
    };
  });

  // Build the editor from `value` when it changes from outside.
  $effect(() => {
    const v = value ?? "";
    if (!ready || v === last) return;
    render(v);
    last = v;
  });
  $effect(() => {
    if (!ready) return;
    for (const mf of root.querySelectorAll<MathfieldEl>("math-field")) mf.toggleAttribute("read-only", disabled);
  });

  function render(text: string) {
    root.replaceChildren();
    for (const s of splitMath(text)) {
      if (s.kind === "math") root.append(makeMath(s.latex));
      else appendText(root, s.text);
    }
  }
  function appendText(parent: Node, text: string) {
    text.split("\n").forEach((line, i) => {
      if (i > 0) parent.appendChild(document.createElement("br"));
      if (line) parent.appendChild(document.createTextNode(line));
    });
  }

  function makeMath(latex: string): HTMLSpanElement {
    const wrap = document.createElement("span");
    wrap.className = "m";
    wrap.contentEditable = "false";
    const mf = document.createElement("math-field") as MathfieldEl;
    mf.setAttribute("math-virtual-keyboard-policy", touch ? "auto" : "manual");
    mf.setAttribute("smart-fence", "on");
    mf.setAttribute("aria-label", "Maths");
    if (disabled) mf.setAttribute("read-only", "");
    mf.addEventListener("input", sync);
    mf.addEventListener("focus", () => {
      activeMath = mf;
      onfocus?.();
    });
    mf.addEventListener("move-out", (e: Event) => {
      const dir = (e as CustomEvent<{ direction: string }>).detail?.direction;
      e.preventDefault();
      leave(wrap, dir === "backward" || dir === "upward" ? "before" : "after");
    });
    mf.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Backspace" && !mf.value) {
        e.preventDefault();
        const prev = wrap.previousSibling;
        wrap.remove();
        caretAt(prev, "end");
        sync();
      } else if (e.key === "Enter") {
        e.preventDefault();
        leave(wrap, "after");
      } else if (e.key === "$") {
        e.preventDefault();
        leave(wrap, "after");
      }
    });
    wrap.append(mf);
    // The element upgrades once MathLive has loaded; set the value after.
    queueMicrotask(() => {
      mf.value = latex;
      addReadAloud(mf);
    });
    return wrap;
  }

  /** Put the text caret just before or after a piece of maths. */
  function leave(wrap: HTMLElement, side: "before" | "after") {
    activeMath = null;
    let target = side === "after" ? wrap.nextSibling : wrap.previousSibling;
    if (!(target instanceof Text)) {
      target = document.createTextNode(ZWSP);
      if (side === "after") wrap.after(target);
      else wrap.before(target);
    }
    caretAt(target, side === "after" ? "start" : "end");
  }
  function caretAt(node: Node | null, where: "start" | "end") {
    root.focus();
    const r = document.createRange();
    if (node instanceof Text) r.setStart(node, where === "start" ? (node.data.startsWith(ZWSP) ? 1 : 0) : node.data.length);
    else if (node) r[where === "start" ? "setStartBefore" : "setStartAfter"](node);
    else r.setStart(root, 0);
    r.collapse(true);
    const sel = document.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    saved = r.cloneRange();
  }

  /** The editor's content as stored text. */
  function serialize(): string {
    const segs: Segment[] = [];
    const text = (t: string) => {
      const prev = segs[segs.length - 1];
      if (prev?.kind === "text") prev.text += t;
      else segs.push({ kind: "text", text: t });
    };
    const walk = (node: Node) => {
      for (const n of node.childNodes) {
        if (n instanceof Text) text(n.data.replaceAll(ZWSP, "").replaceAll(" ", " "));
        else if (n instanceof HTMLBRElement) text("\n");
        else if (n instanceof HTMLElement && n.classList.contains("m")) segs.push({ kind: "math", latex: n.querySelector<MathfieldEl>("math-field")?.value ?? "" });
        else if (n instanceof HTMLElement) {
          // Browsers wrap new lines in <div>s; each starts a new line.
          if (/^(DIV|P)$/.test(n.tagName) && segs.length) text("\n");
          walk(n);
        }
      }
    };
    walk(root);
    return joinMath(segs).replace(/\n+$/, (m) => (m.length > 1 ? "\n" : ""));
  }
  const signals = answerSignals();
  let note = $state(false);
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  function blocked() {
    if (signals) signals.blocked++;
    note = true;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => (note = false), 3500);
  }
  /** Set while the keypad or a paste of the student's own text is inserting, so it isn't counted as a burst. */
  let inserting = false;
  function sync() {
    const next = serialize();
    if (!inserting && signals && next.length - (last ?? "").length >= BURST) signals.bursts++;
    last = next;
    value = last;
  }

  /** A new piece of maths at the caret in the words (or at the end), focused. */
  function newMath(latex = ""): MathfieldEl {
    const wrap = makeMath("");
    // The live caret if it's in the words; else where it last was.
    const sel = document.getSelection();
    const live = sel?.rangeCount ? sel.getRangeAt(0) : null;
    const inWords = (n: Node) => root.contains(n) && !(n instanceof Element ? n : n.parentElement)?.closest(".m");
    let r = live && inWords(live.startContainer) ? live.cloneRange() : saved && root.contains(saved.startContainer) ? saved : null;
    if (!r) {
      r = document.createRange();
      r.selectNodeContents(root);
      r.collapse(false);
    }
    r.deleteContents();
    r.insertNode(wrap);
    if (!(wrap.nextSibling instanceof Text)) wrap.after(document.createTextNode(ZWSP));
    const mf = wrap.querySelector<MathfieldEl>("math-field")!;
    requestAnimationFrame(() => {
      mf.focus();
      if (latex) insertLatex(mf, latex);
      activeMath = mf;
      sync();
    });
    return mf;
  }

  /** A keypad key: into the maths being edited, or as new maths at the caret. */
  export function insert(key: Key) {
    if (disabled) return;
    inserting = true;
    if (activeMath && root.contains(activeMath)) {
      insertLatex(activeMath, key.insert);
      sync();
    } else newMath(key.insert);
    inserting = false;
  }
  /** Empty maths at the caret, ready to type into. */
  export function addMath() {
    if (!disabled) newMath();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "$") {
      e.preventDefault();
      newMath();
    } else if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      sync();
    }
  }
  function onpaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain") ?? "";
    inserting = true;
    document.execCommand("insertText", false, text);
    sync();
    inserting = false;
    // Pasted $…$ becomes maths.
    if (text.includes("$")) render((last = serialize()));
  }
</script>

<div
  bind:this={root}
  class="editor"
  class:disabled
  contenteditable={!disabled}
  role="textbox"
  aria-multiline="true"
  aria-label={label}
  tabindex="0"
  data-placeholder={placeholder}
  oninput={sync}
  {onkeydown}
  {onpaste}
  onfocus={() => {
    activeMath = null;
    onfocus?.();
  }}
></div>
{#if note}<p class="paste-note" role="status">Pasting from outside the site is off</p>{/if}

<style>
  .paste-note { margin: 4px 0 0; font-size: 12px; color: var(--bad); }
  .editor {
    min-height: 140px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--bg);
    color: var(--ink);
    font: inherit;
    font-size: 15px;
    line-height: 1.9;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    outline: none;
    cursor: text;
  }
  .editor:focus-within { border-color: var(--accent); }
  .editor.disabled { opacity: 0.7; }
  .editor:empty::before { content: attr(data-placeholder); color: var(--muted); pointer-events: none; }
  .editor :global(.m) { display: inline-block; vertical-align: middle; margin: 0 1px; }
  .editor :global(math-field) {
    display: inline-block;
    min-width: 1.6em;
    font-size: 17px;
    padding: 1px 4px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    color: var(--ink);
    --caret-color: var(--accent);
    --selection-background-color: var(--accent-soft);
    --contains-highlight-background-color: transparent;
  }
  .editor :global(math-field:focus-within) { border-color: var(--accent); outline: none; }
  .editor :global(math-field::part(menu-toggle)), .editor :global(math-field::part(virtual-keyboard-toggle)) { display: none; }
  .editor :global(math-field::part(content)) { padding: 0; }
</style>
