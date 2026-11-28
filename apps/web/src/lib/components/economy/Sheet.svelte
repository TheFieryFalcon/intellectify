<script lang="ts">
  /** A side panel on wide screens and a bottom sheet on phones (SPEC §13.11). Escape closes it. */
  import type { Snippet } from "svelte";
  let { label, onclose, children, wide = false }: { label: string; onclose: () => void; children: Snippet; wide?: boolean } = $props();
  let panel = $state<HTMLElement | null>(null);
  $effect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel?.focus();
    return () => prev?.focus?.();
  });
</script>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onclose(); } }} />

<div class="sheet-root" data-overlay>
  <button class="scrim" aria-label="Close" onclick={onclose}></button>
  <div class="sheet" class:wide role="dialog" aria-modal="true" aria-label={label} tabindex="-1" bind:this={panel}>
    <button class="close btn link" onclick={onclose} aria-label="Close">×</button>
    {@render children()}
  </div>
</div>

<style>
  .sheet-root { position: fixed; inset: 0; z-index: 38; }
  .scrim { position: absolute; inset: 0; border: 0; background: rgba(10, 14, 22, 0.35); cursor: default; }
  .sheet { position: absolute; top: 0; right: 0; bottom: 0; width: min(420px, 100%); background: var(--surface); color: var(--ink); border-left: 1px solid var(--line); box-shadow: -12px 0 32px rgba(0, 0, 0, 0.18); padding: 24px 22px; overflow-y: auto; outline: none; animation: slide 0.2s ease-out; }
  .sheet.wide { width: min(560px, 100%); }
  .close { position: absolute; top: 10px; right: 14px; font-size: 22px; line-height: 1; }
  @keyframes slide { from { transform: translateX(24px); opacity: 0; } }
  @media (max-width: 640px) {
    .sheet, .sheet.wide { top: auto; left: 0; width: 100%; max-height: 85vh; border-left: 0; border-top: 1px solid var(--line); border-radius: 16px 16px 0 0; box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.2); animation-name: up; }
    @keyframes up { from { transform: translateY(24px); opacity: 0; } }
  }
  @media (prefers-reduced-motion: reduce) { .sheet { animation: none; } }
</style>
