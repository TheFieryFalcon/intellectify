<script lang="ts">
  import { onMount } from "svelte";
  import type { Key } from "$lib/keypad";
  import { addReadAloud, insertLatex, isTouch, loadMathLive, type MathfieldEl } from "$lib/mathlive";
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
      addReadAloud(el);
      const mf = el as MathfieldEl & { menuItems?: { id?: string }[] };
      if (Array.isArray(mf.menuItems)) mf.menuItems = mf.menuItems.filter((m) => m.id !== "paste");
    });
    return unguard;
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
  function changed(next: string) {
    if (!inserting && signals && next.length - value.length >= BURST) signals.bursts++;
    value = next;
  }

  // Keep the element in sync when the value is reset from outside (e.g. next question).
  $effect(() => {
    if (ready && el && el.value !== value) el.value = value;
  });

  /** Insert a keypad key at the caret: `#0` takes the selection, `#?` boxes are left to fill in. */
  export function insert(key: Key) {
    if (!el || disabled) return;
    inserting = true;
    insertLatex(el, key.insert);
    value = el.value;
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
  oninput={(e: Event) => changed((e.currentTarget as HTMLElement & { value: string }).value)}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onsubmit?.();
    }
  }}
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
    --selection-background-color: var(--accent-soft);
  }
  .field:focus-within { border-color: var(--accent); outline: none; }
  .field.disabled { opacity: 0.7; }
  .paste-note { margin: 4px 0 0; font-size: 12px; color: var(--bad); }
  /* On computers the keypad below replaces the field's own keyboard button. */
  .field:not(.touch)::part(virtual-keyboard-toggle) { display: none; }
</style>
