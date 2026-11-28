<script lang="ts">
  /**
   * A written answer, edited as it will read (SPEC §6.3, §7.2): words as text, mathematics as live maths
   * inline, never raw LaTeX. Stored as text with mathematics between $ signs, which is what the marker reads.
   *
   * Maths appears where the keypad inserts it, where "Maths" is pressed, or where $ is typed. The caret moves
   * between words and maths as if they were one line: arrow keys past either end of a piece of maths go
   * back to the words, and arrow keys (or Backspace, Delete) next to a piece of maths go into it. Enter, $
   * or Escape in maths go back to the words; Backspace in empty maths removes it. In a half-typed
   * `\command`, Tab takes MathLive's suggestion and Enter finishes it.
   *
   * A keypad key pressed just after some maths goes into that maths; x² or a vector arrow pressed just after
   * a short term in the words ("AB") turns the term into maths first.
   */
  import { onMount } from "svelte";
  import type { Key } from "$lib/keypad";
  import { applyKey, fieldKey, isEmpty, isTouch, latexOf, loadMathLive, setUpField, takesPrevious, type MathfieldEl } from "$lib/mathlive";
  import { joinMath, splitMath, type Segment } from "$lib/mathtext";
  import { answerSignals, BURST, guardPaste, markCopied } from "$lib/paste";

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
  /** The maths being edited (focused, or last focused with nothing in the words since), for the keypad. */
  let activeMath: MathfieldEl | null = null;
  /** Where the caret was in the words, so a keypad press there knows where to put the maths. */
  let saved: Range | null = null;
  const touch = isTouch();
  /** Holds a caret place next to maths when there are no words there yet; never stored. */
  const ZWSP = "​";

  const isMath = (n: Node | null | undefined): n is HTMLElement => n instanceof HTMLElement && n.classList.contains("m");
  const fieldOf = (wrap: HTMLElement) => wrap.querySelector<MathfieldEl>("math-field")!;
  /** Is this node in the words (in the editor, not inside a piece of maths)? */
  const inWords = (n: Node) => root.contains(n) && !(n instanceof Element ? n : n.parentElement)?.closest(".m");
  /** Did this event come from inside a piece of maths (MathLive handles it)? */
  const fromMath = (e: Event) => (e.target as Element | null)?.closest?.(".m") != null;

  onMount(() => {
    void loadMathLive().then(() => {
      ready = true;
    });
    const track = () => {
      const sel = document.getSelection();
      if (!sel?.rangeCount) return;
      const r = sel.getRangeAt(0);
      if (inWords(r.startContainer)) saved = r.cloneRange();
      // Maths inside a selection of the words is shown selected too.
      for (const wrap of root.querySelectorAll<HTMLElement>(".m")) wrap.classList.toggle("picked", !sel.isCollapsed && inWords(r.commonAncestorContainer) && sel.containsNode(wrap, false));
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
    root.replaceChildren(...build(text));
    activeMath = null;
  }
  /** Stored text as editor nodes: words (with line breaks) and maths. */
  function build(text: string): Node[] {
    const out: Node[] = [];
    for (const s of splitMath(text)) {
      if (s.kind === "math") out.push(makeMath(s.latex));
      else
        s.text.split("\n").forEach((line, i) => {
          if (i > 0) out.push(document.createElement("br"));
          if (line) out.push(document.createTextNode(line));
        });
    }
    return out;
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
    // Capture: these keys are decided before MathLive sees them (so Backspace knows the maths was empty
    // before the key, not after it deleted a half-typed \command).
    mf.addEventListener("keydown", (e: KeyboardEvent) => mathKey(e, wrap, mf), true);
    wrap.append(mf);
    // The element upgrades once MathLive has loaded; set the value after.
    queueMicrotask(() => {
      mf.value = latex;
      setUpField(mf);
    });
    return wrap;
  }

  function mathKey(e: KeyboardEvent, wrap: HTMLElement, mf: MathfieldEl) {
    if (disabled) return;
    if (mf.mode !== "latex" && !e.isComposing) {
      const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
      let act: (() => void) | null = null;
      // Enter and Shift+Enter alike: back to the words.
      if (e.key === "Enter" || e.key === "Escape" || (e.key === "$" && plain)) act = () => leave(wrap, "after");
      else if ((e.key === "Backspace" || e.key === "Delete") && plain && isEmpty(mf)) act = () => removeMath(wrap, e.key === "Backspace" ? "before" : "after");
      if (act) {
        e.preventDefault();
        e.stopPropagation();
        return act();
      }
    }
    fieldKey(mf, e);
  }

  /** Put the text caret just before or after a piece of maths (removing it if it was left empty). */
  function leave(wrap: HTMLElement, side: "before" | "after") {
    activeMath = null;
    if (isEmpty(fieldOf(wrap))) return removeMath(wrap, side);
    let target = side === "after" ? wrap.nextSibling : wrap.previousSibling;
    if (!(target instanceof Text)) {
      target = document.createTextNode(ZWSP);
      if (side === "after") wrap.after(target);
      else wrap.before(target);
    }
    caretAt(target, side === "after" ? "start" : "end");
    sync();
  }
  function removeMath(wrap: HTMLElement, side: "before" | "after") {
    activeMath = null;
    const prev = wrap.previousSibling;
    const next = wrap.nextSibling;
    wrap.remove();
    if (side === "before" && prev) caretAt(prev, "end");
    else if (next) caretAt(next, "start");
    else caretAt(prev, "end");
    sync();
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
  /** Go into a piece of maths at its start or end. */
  function enter(wrap: HTMLElement, where: "start" | "end"): MathfieldEl {
    const mf = fieldOf(wrap);
    mf.focus();
    mf.executeCommand(where === "end" ? "moveToMathfieldEnd" : "moveToMathfieldStart");
    activeMath = mf;
    return mf;
  }

  /** The piece of maths right next to a collapsed caret in the words (only caret placeholders between), if any. */
  function beside(r: Range, side: "before" | "after"): HTMLElement | null {
    if (!r.collapsed || !inWords(r.startContainer)) return null;
    const blank = (t: string) => t.replaceAll(ZWSP, "") === "";
    let n: Node | null;
    if (r.startContainer instanceof Text) {
      const t = r.startContainer.data;
      if (!blank(side === "before" ? t.slice(0, r.startOffset) : t.slice(r.startOffset))) return null;
      n = side === "before" ? r.startContainer.previousSibling : r.startContainer.nextSibling;
    } else n = r.startContainer.childNodes[side === "before" ? r.startOffset - 1 : r.startOffset] ?? null;
    while (n instanceof Text && blank(n.data)) n = side === "before" ? n.previousSibling : n.nextSibling;
    return isMath(n) ? n : null;
  }

  /** Where the caret is in the words: the live selection if it's there, else where it last was. */
  function wordsRange(): Range | null {
    const sel = document.getSelection();
    const live = sel?.rangeCount ? sel.getRangeAt(0) : null;
    if (live && inWords(live.startContainer) && inWords(live.endContainer)) return live.cloneRange();
    if (saved && root.contains(saved.startContainer)) return saved.cloneRange();
    return null;
  }

  /** The editor's content (or the part of it in `range`) as stored text. */
  function serialize(range?: Range): string {
    const segs: Segment[] = [];
    const text = (t: string) => {
      const prev = segs[segs.length - 1];
      if (prev?.kind === "text") prev.text += t;
      else segs.push({ kind: "text", text: t });
    };
    const walk = (node: Node) => {
      for (const n of node.childNodes) {
        if (range && !range.intersectsNode(n)) continue;
        if (n instanceof Text) {
          let t = n.data;
          if (range && n === range.endContainer) t = t.slice(0, range.endOffset);
          if (range && n === range.startContainer) t = t.slice(range.startOffset);
          text(t.replaceAll(ZWSP, "").replaceAll(" ", " "));
        } else if (n instanceof HTMLBRElement) text("\n");
        else if (isMath(n)) segs.push({ kind: "math", latex: latexOf(fieldOf(n)) });
        else if (n instanceof HTMLElement) {
          // Browsers wrap new lines in <div>s; each starts a new line.
          if (/^(DIV|P)$/.test(n.tagName) && segs.length) text("\n");
          walk(n);
        }
      }
    };
    walk(root);
    const out = joinMath(segs);
    return range ? out : out.replace(/\n+$/, (m) => (m.length > 1 ? "\n" : ""));
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

  /**
   * New maths in place of `r` (or at the end), focused, holding `latex`; then `key` is applied in it. With
   * `wrapAll`, the key applies to everything in it (words selected before pressing a key become maths).
   */
  function newMath(r: Range | null, latex = "", key?: string, wrapAll = false) {
    const wrap = makeMath(latex);
    if (!r) {
      r = document.createRange();
      r.selectNodeContents(root);
      r.collapse(false);
    }
    r.deleteContents();
    r.insertNode(wrap);
    if (!(wrap.nextSibling instanceof Text)) wrap.after(document.createTextNode(ZWSP));
    const mf = fieldOf(wrap);
    requestAnimationFrame(() => {
      mf.focus();
      mf.executeCommand(wrapAll ? "selectAll" : "moveToMathfieldEnd");
      activeMath = mf;
      inserting = true;
      if (key) applyKey(mf, key);
      sync();
      inserting = false;
    });
  }

  /** Words as LaTeX, for a short selection or term turned into maths. */
  const wordsLatex = (t: string) => t.replace(/[\\{}#%&_^~$]/g, (c) => `\\${c}`);

  /**
   * A keypad key: into the maths being edited; else into maths right next to the caret; else as new maths at
   * the caret, taking the short term just before it ("AB") or the words selected, if the key applies to them.
   */
  export function insert(key: Key) {
    if (disabled) return;
    inserting = true;
    try {
      if (activeMath && root.contains(activeMath)) {
        applyKey(activeMath, key.insert);
        sync();
        return;
      }
      const r = wordsRange();
      const prev = r && beside(r, "before");
      if (prev) {
        applyKey(enter(prev, "end"), key.insert);
        sync();
        return;
      }
      if (r && !r.collapsed) {
        const text = r.toString().replaceAll(ZWSP, "").trim();
        const words = serialize(r);
        // A short run of words (no maths, no line breaks) becomes maths and the key applies to it.
        if (text && text.length <= 40 && !/\n/.test(words) && !words.includes("$")) return newMath(r, wordsLatex(text), key.insert, true);
        r.collapse(false);
      }
      const take = r && takesPrevious(key.insert);
      if (r && take) {
        const term = termBefore(r, take);
        if (term) {
          const { node, start, end } = term;
          const t = node.data.slice(start, end);
          node.deleteData(start, end - start);
          const at = document.createRange();
          at.setStart(node, start);
          return newMath(at, wordsLatex(t), key.insert);
        }
      }
      const next = r && beside(r, "after");
      if (next) {
        applyKey(enter(next, "start"), key.insert);
        sync();
        return;
      }
      newMath(r, "", key.insert);
    } finally {
      inserting = false;
    }
  }
  /**
   * The short term typed just before the caret in the words, which x² or a vector arrow there applies to:
   * up to three letters ("AB", "x"), or a number with up to three letters after it ("2x", "3.5").
   */
  function termBefore(r: Range, take: "term" | "letters"): { node: Text; start: number; end: number } | null {
    let node: Node = r.startContainer;
    let end = r.startOffset;
    if (!(node instanceof Text)) {
      const prev = node.childNodes[end - 1];
      if (!(prev instanceof Text)) return null;
      node = prev;
      end = prev.data.length;
    }
    const text = (node as Text).data.slice(0, end);
    const m = (take === "letters" ? /(?:^|[^A-Za-z0-9.])([A-Za-z]{1,3})$/ : /(?:^|[^A-Za-z0-9.])((?:\d+(?:\.\d+)?)?[A-Za-z]{0,3})$/).exec(text);
    const term = m?.[1];
    if (!term) return null;
    return { node: node as Text, start: end - term.length, end };
  }
  /** Empty maths at the caret, ready to type into. */
  export function addMath() {
    if (!disabled) newMath(wordsRange());
  }

  function onkeydown(e: KeyboardEvent) {
    if (fromMath(e) || e.isComposing) return;
    const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
    const sel = document.getSelection();
    const r = sel?.rangeCount ? sel.getRangeAt(0) : null;
    if (e.key === "$" && plain) {
      e.preventDefault();
      newMath(wordsRange());
    } else if (e.key === "Enter") {
      // Enter and Shift+Enter alike: a new line.
      e.preventDefault();
      document.execCommand("insertLineBreak");
      sync();
    } else if (r && plain && !e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      // Into the maths next to the caret, at the end nearest it.
      const wrap = beside(r, e.key === "ArrowLeft" ? "before" : "after");
      if (!wrap) return;
      e.preventDefault();
      enter(wrap, e.key === "ArrowLeft" ? "end" : "start");
    } else if (r && plain && (e.key === "Backspace" || e.key === "Delete")) {
      // Deletes the character of the maths next to the caret, as it would in the words.
      const back = e.key === "Backspace";
      const wrap = beside(r, back ? "before" : "after");
      if (!wrap) return;
      e.preventDefault();
      const mf = enter(wrap, back ? "end" : "start");
      mf.executeCommand(back ? "deleteBackward" : "deleteForward");
      if (isEmpty(mf)) removeMath(wrap, back ? "before" : "after");
      else sync();
    }
  }

  /** Text pasted or dropped into the words: $…$ in it becomes maths. */
  function insertText(text: string, r: Range) {
    inserting = true;
    if (!text.includes("$")) {
      const sel = document.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(r);
      document.execCommand("insertText", false, text);
    } else {
      r.deleteContents();
      const nodes = build(text);
      const frag = document.createDocumentFragment();
      frag.append(...nodes);
      r.insertNode(frag);
      const end = nodes[nodes.length - 1];
      if (isMath(end) && !(end.nextSibling instanceof Text)) end.after(document.createTextNode(ZWSP));
      caretAt(isMath(end) ? end.nextSibling : (end ?? null), isMath(end) ? "start" : "end");
      // The new maths gets its value in a microtask (makeMath); store the text after that.
      return queueMicrotask(() => {
        inserting = true;
        sync();
        inserting = false;
      });
    }
    sync();
    inserting = false;
  }
  function onpaste(e: ClipboardEvent) {
    // Maths pastes into itself (MathLive); the guard has already turned away outside text.
    if (fromMath(e) || e.defaultPrevented) return;
    e.preventDefault();
    const r = wordsRange();
    if (r) insertText(e.clipboardData?.getData("text/plain") ?? "", r);
  }
  /** Copies and cuts of the words keep their maths, as $…$ (pasting turns it back into maths). */
  function copy(e: ClipboardEvent, cut: boolean) {
    if (fromMath(e) || !e.clipboardData) return;
    const sel = document.getSelection();
    if (!sel?.rangeCount || sel.isCollapsed) return;
    const r = sel.getRangeAt(0);
    if (!root.contains(r.commonAncestorContainer)) return;
    const text = serialize(r);
    e.preventDefault();
    e.clipboardData.setData("text/plain", text);
    markCopied(e, text);
    if (cut && !disabled) {
      r.deleteContents();
      sync();
    }
  }
  function ondrop(e: DragEvent) {
    if (fromMath(e) || e.defaultPrevented) return;
    e.preventDefault();
    const text = e.dataTransfer?.getData("text/plain") ?? "";
    const pos = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (text && pos && inWords(pos.startContainer)) insertText(text, pos);
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
  oninput={(e) => {
    if (!fromMath(e)) sync();
  }}
  {onkeydown}
  {onpaste}
  oncopy={(e) => copy(e, false)}
  oncut={(e) => copy(e, true)}
  ondragstart={(e) => {
    // Moving words by dragging would lose the maths in them; cut and paste instead.
    if (!fromMath(e)) e.preventDefault();
  }}
  {ondrop}
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
  /* Words and maths selected together look alike. */
  .editor::selection, .editor :global(*::selection) { background: color-mix(in srgb, var(--accent) 38%, transparent); color: var(--ink); }
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
    --selection-background-color: color-mix(in srgb, var(--accent) 38%, transparent);
    --selection-color: var(--ink);
    --contains-highlight-background-color: transparent;
  }
  .editor :global(math-field:focus-within) { border-color: var(--accent); outline: none; }
  /* Maths inside a selection of the words. */
  .editor :global(.m.picked math-field) { background: color-mix(in srgb, var(--accent) 38%, transparent); }
  .editor :global(math-field::part(menu-toggle)), .editor :global(math-field::part(virtual-keyboard-toggle)) { display: none; }
  .editor :global(math-field::part(content)) { padding: 0; }
</style>
