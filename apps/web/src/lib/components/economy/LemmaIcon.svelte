<script lang="ts">
  /** The ∴ glyph, or the Infinity Axiom's slowly tracing ∞ when equipped (SPEC §13.6). */
  let { infinity = false }: { infinity?: boolean } = $props();
</script>

{#if infinity}
  <svg class="inf" viewBox="0 0 24 12" aria-hidden="true"><path d="M12 6 C 9 1, 3 1, 3 6 C 3 11, 9 11, 12 6 C 15 1, 21 1, 21 6 C 21 11, 15 11, 12 6 Z" /></svg>
{:else}
  <span class="therefore" aria-hidden="true">∴</span>
{/if}

<style>
  .therefore { font-family: var(--font-display); }
  .inf { width: 1.3em; height: 0.7em; vertical-align: -0.05em; overflow: visible; }
  .inf path { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-dasharray: 30 30; animation: trace 6s linear infinite; }
  @keyframes trace { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
  @media (prefers-reduced-motion: reduce) { .inf path { animation: none; stroke-dasharray: none; } }
</style>
