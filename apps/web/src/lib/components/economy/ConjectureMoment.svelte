<script lang="ts">
  /** Proving a Conjecture (SPEC §13.11): the statement, who really proved it and when (or Open), and the new Research rate. */
  import type { ConjectureDef } from "@intellectify/engine";
  import LemmaAmount from "./LemmaAmount.svelte";

  let { conjecture, index, rateBefore, rateAfter, onclose }: { conjecture: ConjectureDef; index: number; rateBefore: number; rateAfter: number; onclose: () => void } = $props();
  let btn = $state<HTMLButtonElement | null>(null);
  $effect(() => btn?.focus());
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="Conjecture proved: {conjecture.name}">
  <div class="sky" aria-hidden="true">{#each Array.from({ length: 40 }, (_, i) => i) as i (i)}<span style="--x:{(i * 61) % 100}; --y:{(i * 37) % 100}; --d:{(i % 7) * 0.3}s"></span>{/each}</div>
  <div class="card">
    <p class="eyebrow">Conjecture {index + 1} proved</p>
    <h2>{conjecture.name}</h2>
    <p class="statement">{conjecture.statement}</p>
    <p class="real">{conjecture.proved ?? "Open"}</p>
    <p class="rate">Research <LemmaAmount value={rateBefore} per="/day" /> → <strong><LemmaAmount value={rateAfter} per="/day" /></strong></p>
    <button class="btn" bind:this={btn} onclick={onclose}>Continue</button>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 45; display: grid; place-items: center; padding: 16px; background: radial-gradient(circle, #1b1f3a, #05060c); animation: fade 0.4s ease-out; }
  .sky { position: absolute; inset: 0; pointer-events: none; }
  .sky span { position: absolute; left: calc(var(--x) * 1%); top: calc(var(--y) * 1%); width: 2px; height: 2px; border-radius: 50%; background: #fff; opacity: 0.7; animation: tw 2.4s ease-in-out infinite var(--d); }
  .card { position: relative; width: min(480px, 100%); text-align: center; color: #eef1ff; }
  .eyebrow { margin: 0; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #aab2d8; }
  h2 { margin: 8px 0; font-size: 34px; }
  .statement { font-family: var(--font-display); font-style: italic; font-size: 18px; margin: 0 auto 10px; max-width: 32ch; }
  .real { color: #aab2d8; margin: 0 0 16px; }
  .rate { margin: 0 0 20px; font-size: 15px; }
  .rate strong { color: #ffd86b; }
  @keyframes fade { from { opacity: 0; } }
  @keyframes tw { 50% { opacity: 0.15; } }
  @media (prefers-reduced-motion: reduce) { .overlay, .sky span { animation: none; } }
</style>
