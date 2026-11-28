<script lang="ts">
  /**
   * The ∴ glyph, or an equipped Lemma icon (SPEC §13.6): Infinity's slowly tracing ∞, Mahlo's quantifier
   * (∀ turning into ∃ and back, as in higher-order logic), or a colored ∴.
   */
  import { styleOf } from "$lib/economy.svelte";

  let { id = null }: { id?: string | null } = $props();
  const st = $derived(styleOf(id));
  const colors = $derived(st?.colors ?? []);
</script>

{#if id === "infinity-icon"}
  <svg class="inf" viewBox="0 0 24 12" aria-hidden="true"><path d="M12 6 C 9 1, 3 1, 3 6 C 3 11, 9 11, 12 6 C 15 1, 21 1, 21 6 C 21 11, 15 11, 12 6 Z" /></svg>
{:else if id === "quantifier-icon"}
  <span class="quant" aria-hidden="true"><span class="q all">∀</span><span class="q some">∃</span></span>
{:else if st?.kind === "glyph"}
  <span class="therefore glyph m-{st.motion ?? 'none'}" style="--c0:{colors[0]}; --c1:{colors[1] ?? colors[0]}; --g:{colors.join(', ')}" aria-hidden="true">∴</span>
{:else}
  <span class="therefore" aria-hidden="true">∴</span>
{/if}

<style>
  .therefore { font-family: var(--font-display); }
  .inf { width: 1.3em; height: 0.7em; vertical-align: -0.05em; overflow: visible; }
  .inf path { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-dasharray: 30 30; animation: trace 6s linear infinite; }
  @keyframes trace { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }

  /* Quantifier: ∀ and ∃ are the same letter turned half a turn, so one flips into the other. */
  .quant { display: inline-grid; width: 0.8em; font-family: var(--font-display); font-weight: 600; vertical-align: baseline; perspective: 200px; }
  .q { grid-area: 1 / 1; text-align: center; backface-visibility: hidden; animation: flip 5s ease-in-out infinite; }
  .some { animation-delay: -2.5s; color: var(--accent); }
  @keyframes flip { 0%, 40% { transform: rotateY(0deg); opacity: 1; } 50%, 90% { transform: rotateY(180deg); opacity: 0; } 100% { transform: rotateY(360deg); opacity: 1; } }

  .glyph { display: inline-block; font-size: 1.2em; line-height: 1; font-weight: 700; background: linear-gradient(135deg, var(--g)); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-stroke: 0.4px var(--c0); }
  .glyph.m-corona { background: none; color: var(--c0); -webkit-text-stroke: 0; text-shadow: 0 0 2px var(--c1), 0 0 5px var(--c1), 0 0 9px color-mix(in srgb, var(--c1) 60%, transparent); animation: corona 4s ease-in-out infinite; }
  @keyframes corona { 50% { text-shadow: 0 0 1px var(--c1), 0 0 3px var(--c1), 0 0 6px color-mix(in srgb, var(--c1) 50%, transparent); } }
  .glyph.m-shimmer { background-image: linear-gradient(110deg, var(--c0) 30%, var(--c1) 45%, #fff 50%, var(--c1) 55%, var(--c0) 70%); background-size: 300% 100%; animation: shimmer 4s linear infinite; }
  .glyph.m-glow { filter: drop-shadow(0 0 3px var(--c1)); animation: glow 3s ease-in-out infinite; }
  @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -200% 0; } }
  @keyframes glow { 50% { filter: drop-shadow(0 0 6px var(--c1)); } }
  @media (prefers-reduced-motion: reduce) { .inf path, .q, .glyph { animation: none !important; } .inf path { stroke-dasharray: none; } .some { display: none; } }
</style>
