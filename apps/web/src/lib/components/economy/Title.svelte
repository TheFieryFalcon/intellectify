<script lang="ts">
  /**
   * An equipped title (SPEC §13.9). Tanzanite and Vibranium: the tier's color with its gem, still.
   * Solarium and Antimatter: each its own animated effect. Axiom titles: ink serif small caps with a silver
   * ∈; Huge swells and Edge of Consistency zooms. The text stays real, selectable text. `calm` (leaderboard
   * rows) plays the effect only on hover or focus. Reduced motion shows a still frame.
   */
  import TierGem from "../TierGem.svelte";
  import { loadTitles, slug, titles } from "$lib/titles.svelte";

  let { title, calm = false }: { title: string; calm?: boolean } = $props();
  loadTitles();
  const info = $derived(titles.map[title]);
  const kind = $derived(info?.kind ?? "axiom");
  const tip = $derived(info ? (info.kind === "axiom" ? `Axiom · ${info.source}` : `${info.source} · ${info.kind[0]!.toUpperCase()}${info.kind.slice(1)}`) : title);
</script>

<span class="title {kind} t-{slug(title)}" class:calm title={tip}>
  {#if kind === "axiom"}<span class="in" aria-hidden="true">∈</span>{:else if kind === "tanzanite" || kind === "vibranium"}<TierGem tier={kind} size={11} />{/if}
  {#if title === "Edge of Consistency"}
    <span class="nest"><span class="text">{title}</span><span class="copy c1" aria-hidden="true">{title}</span><span class="copy c2" aria-hidden="true">{title}</span></span>
  {:else if title === "Huge"}
    <span class="text">{#each [...title] as ch, i (i)}<span class="ch" style="--i:{i}">{ch}</span>{/each}</span>
  {:else}
    <span class="fxl" aria-hidden="true"></span><span class="text">{title}</span><span class="fxr" aria-hidden="true"></span>
  {/if}
</span>

<style>
  .title { position: relative; display: inline-flex; align-items: center; gap: 5px; font-weight: 600; font-size: 0.92em; letter-spacing: 0.01em; isolation: isolate; }
  .text { position: relative; z-index: 1; }
  .fxl, .fxr { position: absolute; pointer-events: none; }
  .tanzanite { color: var(--lvl-tanzanite); }
  .vibranium { color: var(--lvl-vibranium); }
  .axiom { font-family: var(--font-display); font-variant: small-caps; letter-spacing: 0.06em; color: var(--ink); font-weight: 500; }
  .in { color: #9aa4b1; font-variant: normal; }
  .solarium { color: #9a5a00; }
  .antimatter { color: #1b0f30; -webkit-text-stroke: 0.5px #8a63ff; text-shadow: 0 0 1px #3ad8ff; }
  @media (prefers-color-scheme: dark) {
    .solarium { color: #ffcc55; }
    .antimatter { color: #0b0614; text-shadow: 0 0 2px #cbb8ff, 0 0 1px #3ad8ff; }
  }

  /* Solarium */
  .t-helios .fxl { inset: -6px -10px; border-radius: 40%; background: radial-gradient(circle at 0% 50%, #ffc94a 0 2px, transparent 3px), radial-gradient(circle at 100% 50%, #ffc94a 0 2px, transparent 3px), radial-gradient(circle at 25% 0%, #ffc94a 0 2px, transparent 3px), radial-gradient(circle at 75% 0%, #ffc94a 0 2px, transparent 3px), radial-gradient(circle at 25% 100%, #ffc94a 0 2px, transparent 3px), radial-gradient(circle at 75% 100%, #ffc94a 0 2px, transparent 3px); animation: spin 9s linear infinite; }
  .t-infinite-ray .text { background: linear-gradient(90deg, currentColor 40%, #fff6c8 50%, currentColor 60%) -100% 0 / 300% 100% no-repeat; -webkit-background-clip: text; background-clip: text; animation: ray 3.5s linear infinite; }
  .t-infinite-ray .fxr { left: 100%; top: 50%; height: 1px; width: 40px; background: linear-gradient(90deg, #ffd86b, transparent); transform-origin: left; animation: beam 3.5s linear infinite; }
  .t-totality .fxl { inset: -5px -8px; border-radius: 999px; background: radial-gradient(ellipse at center, #1c1408 55%, transparent 56%); box-shadow: 0 0 10px 3px #ffcf60, inset 0 0 0 1px #ffe9a8; z-index: 0; animation: corona 3s ease-in-out infinite; }
  .t-totality .text { color: #ffe08a; }
  .t-fixed-point .fxl { left: -14px; top: 50%; width: 10px; height: 10px; margin-top: -5px; border-radius: 50%; background: repeating-conic-gradient(#ffc94a 0 8deg, transparent 8deg 30deg); animation: spin 8s linear infinite; }
  .t-fixed-point .fxr { left: -11px; top: 50%; width: 4px; height: 4px; margin-top: -2px; border-radius: 50%; background: #7a4b00; }
  .t-fixed-point { margin-left: 14px; }
  .t-unit-impulse .fxl { left: 50%; bottom: 0; width: 2px; height: 140%; background: linear-gradient(#fff8d6, #ffb000); transform-origin: bottom; animation: spike 4s ease-out infinite; }
  .t-unit-impulse .text { animation: lit 4s ease-out infinite; }

  /* Antimatter */
  .t-annihilator .fxl, .t-annihilator .fxr { top: 50%; width: 5px; height: 5px; margin-top: -2.5px; border-radius: 50%; }
  .t-annihilator .fxl { left: 0; background: #ff4fd8; animation: meetL 3.2s ease-in infinite; }
  .t-annihilator .fxr { right: 0; background: #3ad8ff; animation: meetR 3.2s ease-in infinite; }
  .t-singularity .fxl { left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px; border-radius: 50%; background: #000; box-shadow: 0 0 0 2px rgba(203, 184, 255, 0.5), 0 0 8px 3px rgba(124, 77, 255, 0.4); z-index: 2; animation: pulse 3s ease-in-out infinite; }
  .t-singularity .text { animation: lens 3s ease-in-out infinite; }
  .t-mirabilis .text { background: radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 60% 70%, #fff, transparent), radial-gradient(1px 1px at 80% 20%, #fff, transparent), linear-gradient(120deg, #120a2a, #2a1250 50%, #0a1a3a); background-size: 40px 20px, 50px 24px, 36px 18px, 100% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-stroke: 0.4px #8a63ff; animation: drift 12s linear infinite; }
  .t-mirabilis .fxr { left: -10%; top: 10%; width: 12px; height: 1px; background: linear-gradient(90deg, transparent, #fff); animation: comet 6s linear infinite; }

  /* Axioms */
  .t-huge .ch { display: inline-block; animation: swell 4s ease-in-out infinite; animation-delay: calc(var(--i) * 0.15s); }
  .nest { position: relative; display: inline-block; }
  .copy { position: absolute; left: 0; top: 0; font-size: 0.5em; opacity: 0.6; transform-origin: center; white-space: nowrap; pointer-events: none; animation: zoom 4s linear infinite; }
  .c1 { left: 25%; top: 25%; }
  .c2 { left: 37%; top: 37%; font-size: 0.25em; animation-delay: -2s; }

  /* Calm rows: still until hovered or focused. */
  .calm *, .calm { animation-play-state: paused !important; }
  .calm:hover *, :global(:focus-within) > .calm * { animation-play-state: running !important; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ray { to { background-position: 200% 0; } }
  @keyframes beam { 0%, 60% { transform: scaleX(0); opacity: 0; } 70% { opacity: 1; } 100% { transform: scaleX(1) translateX(30px); opacity: 0; } }
  @keyframes corona { 50% { box-shadow: 0 0 14px 5px #ffcf60, inset 0 0 0 1px #fff4cc; } }
  @keyframes spike { 0%, 80% { transform: scaleY(0); opacity: 0; } 85% { transform: scaleY(1); opacity: 1; } 100% { transform: scaleY(1); opacity: 0; } }
  @keyframes lit { 82%, 90% { text-shadow: 0 0 6px #ffe9a8; } 0%, 70%, 100% { text-shadow: none; } }
  @keyframes meetL { 0% { left: -8px; opacity: 1; } 70% { left: 50%; opacity: 1; box-shadow: none; } 75% { box-shadow: 0 0 12px 6px #fff; background: #fff; } 100% { left: 50%; opacity: 0; } }
  @keyframes meetR { 0% { right: -8px; opacity: 1; } 70% { right: 50%; opacity: 1; } 100% { right: 50%; opacity: 0; } }
  @keyframes pulse { 50% { box-shadow: 0 0 0 3px rgba(203, 184, 255, 0.4), 0 0 12px 5px rgba(124, 77, 255, 0.35); } }
  @keyframes lens { 50% { letter-spacing: 0.08em; } }
  @keyframes drift { to { background-position: 400px 0, -300px 0, 200px 0, 0 0; } }
  @keyframes comet { 0%, 70% { transform: translateX(0); opacity: 0; } 75% { opacity: 1; } 100% { transform: translateX(240px) translateY(6px); opacity: 0; } }
  @keyframes swell { 50% { transform: scale(1.12); } }
  @keyframes zoom { from { transform: scale(1); opacity: 0.6; } to { transform: scale(2); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .title *, .title { animation: none !important; } }
</style>
