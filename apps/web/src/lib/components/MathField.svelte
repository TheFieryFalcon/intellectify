<script lang="ts">
  import { onMount } from "svelte";
  import type { Key } from "$lib/keypad";
  import { applyKey, fieldKey, isTouch, latexOf, loadMathLive, setUpField, type MathfieldEl } from "$lib/mathlive";
  import { answerSignals, BURST, guardPaste } from "$lib/paste";

  let {
    value = $bindable(""),
    disabled = false,
    label,
    onsubmit,
    onfocus,
  }: { value?: string; disabled?: boolean; label: string; onsubmit?: () => void; onfocus?: () => void } = $props();

  let el: MathfieldEl = $state()!;
  let ready = $state(false);
  /**
   * Phones: the answer field's own on-screen keyboard (numbers, letters, then the keypad's tabs).
   * Computers: the physical keyboard plus the keypad under the question (MathKeypad).
   */
  const touch = isTouch();

  onMount(() => {
    // No pasting from outside the site (SPEC §7.2), from the keyboard or MathLive's own menu.
    const unguard = guardPaste(el, blocked);
    void loadMathLive().then(() => {
      ready = true;
      if (!el) return;
      setUpField(el);
      // Enter (with or without Shift) submits, before MathLive sees it; in a half-typed \command it finishes that instead.
      el.addEventListener("keydown", enter, true);
    });
    return () => {
      unguard();
      el?.removeEventListener("keydown", enter, true);
    };
  });

  const signals = answerSignals();
  let note = $state(false);
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  function blocked() {
    if (signals) signals.blocked++;
    note = true;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => (note = false), 3500);
  }
  /** Characters arriving at once, not from the keypad, count as a burst (a signal, never a block). */
  let inserting = false;
  /** The value this field last gave out (its LaTeX without empty boxes), so outside changes can be told apart. */
  let emitted = "";
  function changed() {
    const next = latexOf(el);
    if (!inserting && signals && next.length - value.length >= BURST) signals.bursts++;
    value = emitted = next;
  }

  function enter(e: KeyboardEvent) {
    if (fieldKey(el, e) || e.key !== "Enter" || el.mode === "latex" || e.isComposing) return;
    e.preventDefault();
    e.stopPropagation();
    onsubmit?.();
  }

  // Keep the element in sync when the value is reset from outside (e.g. next question).
  $effect(() => {
    if (ready && el && value !== emitted) {
      el.value = value;
      emitted = value;
    }
  });

  /** A keypad key at the caret (see applyKey: it wraps a selection, and x² squares what was just typed). */
  export function insert(key: Key) {
    if (!el || disabled) return;
    inserting = true;
    applyKey(el, key.insert);
    changed();
    inserting = false;
  }
</script>

<math-field
  bind:this={el}
  class="field"
  class:disabled
  class:touch
  role="textbox"
  tabindex="0"
  aria-label={label}
  read-only={disabled ? "" : undefined}
  math-virtual-keyboard-policy={touch ? "auto" : "manual"}
  smart-fence="on"
  onfocus={() => onfocus?.()}
  oninput={changed}
></math-field>
{#if note}<p class="paste-note" role="status">Pasting from outside the site is off</p>{/if}

<style>
  .field {
    display: block;
    width: 100%;
    min-height: 44px;
    font-size: 20px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    --caret-color: var(--accent);
    --selection-background-color: color-mix(in srgb, var(--accent) 38%, transparent);
    --selection-color: var(--ink);
  }
  .field:focus-within { border-color: var(--accent); outline: none; }
  .field.disabled { opacity: 0.7; }
  .paste-note { margin: 4px 0 0; font-size: 12px; color: var(--bad); }
  /* On computers the keypad below replaces the field's own keyboard button. */
  .field:not(.touch)::part(virtual-keyboard-toggle) { display: none; }
</style>
