<script lang="ts">
  import { onMount } from "svelte";

  let {
    value = $bindable(""),
    disabled = false,
    label,
    onsubmit,
  }: { value?: string; disabled?: boolean; label: string; onsubmit?: () => void } = $props();

  let el: HTMLElement & { value: string } = $state()!;
  let ready = $state(false);

  onMount(async () => {
    const { MathfieldElement } = await import("mathlive");
    MathfieldElement.fontsDirectory = "/mathlive/fonts";
    MathfieldElement.soundsDirectory = null;
    ready = true;
  });

  // Keep the element in sync when the value is reset from outside (e.g. next question).
  $effect(() => {
    if (ready && el && el.value !== value) el.value = value;
  });
</script>

<math-field
  bind:this={el}
  class="field"
  class:disabled
  role="textbox"
  tabindex="0"
  aria-label={label}
  read-only={disabled ? "" : undefined}
  math-virtual-keyboard-policy="auto"
  smart-fence="on"
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
</style>
