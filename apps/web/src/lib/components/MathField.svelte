<script lang="ts">
  import { onMount } from "svelte";
  import { phoneLayouts, type Key } from "$lib/keypad";

  let {
    value = $bindable(""),
    disabled = false,
    label,
    onsubmit,
    onfocus,
  }: { value?: string; disabled?: boolean; label: string; onsubmit?: () => void; onfocus?: () => void } = $props();

  type Field = HTMLElement & { value: string; insert: (s: string, o?: object) => boolean; executeCommand: (c: string) => boolean };
  let el: Field = $state()!;
  let ready = $state(false);
  /**
   * Phones: the answer field's own on-screen keyboard (numbers, letters, then the keypad's tabs).
   * Computers: the physical keyboard plus the keypad under the question (MathKeypad).
   */
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

  onMount(async () => {
    const { MathfieldElement } = await import("mathlive");
    MathfieldElement.fontsDirectory = "/mathlive/fonts";
    MathfieldElement.soundsDirectory = null;
    const vk = (window as unknown as { mathVirtualKeyboard?: { layouts: unknown } }).mathVirtualKeyboard;
    if (vk && touch) vk.layouts = phoneLayouts();
    ready = true;
  });

  // Keep the element in sync when the value is reset from outside (e.g. next question).
  $effect(() => {
    if (ready && el && el.value !== value) el.value = value;
  });

  /** Insert a keypad key at the caret: `#0` takes the selection, `#?` boxes are left to fill in. */
  export function insert(key: Key) {
    if (!el || disabled) return;
    el.insert(key.insert, { selectionMode: "placeholder", focus: true, feedback: false, format: "latex" });
    value = el.value;
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
  oninput={(e: Event) => (value = (e.currentTarget as HTMLElement & { value: string }).value)}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onsubmit?.();
    }
  }}
></math-field>

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
  /* On computers the keypad below replaces the field's own keyboard button. */
  .field:not(.touch)::part(virtual-keyboard-toggle) { display: none; }
</style>
