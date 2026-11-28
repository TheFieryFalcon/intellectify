<script lang="ts">
  /**
   * Proving Axioms (SPEC §13.11): earlier ones flash by (about 0.8 s each), then the highest gets the full
   * moment: its statement and what it unlocks (cosmetic, title, +5%), each with Equip; Later closes.
   */
  import type { AxiomDef } from "@intellectify/engine";
  import { currentEconomy } from "$lib/profile.svelte";
  import Title from "./Title.svelte";

  let { axioms, onclose }: { axioms: AxiomDef[]; onclose: () => void } = $props();
  const economy = currentEconomy();
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let step = $state(reduced ? axioms.length - 1 : 0);
  $effect(() => {
    if (step >= axioms.length - 1) return;
    const t = setTimeout(() => step++, 800);
    return () => clearTimeout(t);
  });
  const top = $derived(axioms[axioms.length - 1]!);
  const shown = $derived(axioms[step]!);
  const done = $derived(step >= axioms.length - 1);
  let equipped = $state<Record<string, boolean>>({});
  const equip = (key: string, fn: () => void) => {
    fn();
    equipped = { ...equipped, [key]: true };
  };
  let card = $state<HTMLElement | null>(null);
  $effect(() => card?.focus());
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="Axiom proved: {top.name}">
  <div class="card" tabindex="-1" bind:this={card}>
    <p class="eyebrow">{done ? (axioms.length > 1 ? `Axioms proved · ${axioms.length}` : "Axiom proved") : "Proved"}</p>
    {#key step}
      <div class="axiom" class:flash={!done}>
        <span class="glyph" aria-hidden="true">∈</span>
        <h2>{shown.name}</h2>
        <p class="statement">{shown.statement}</p>
      </div>
    {/key}
    {#if done}
      <ul class="unlocks">
        <li><span class="k">All sources</span><span>+5%</span></li>
        {#each axioms as a (a.id)}
          <li>
            <span class="k">{a.cosmetic.name}</span>
            {#if equipped[a.cosmetic.id]}<span class="muted">Equipped</span>{:else}<button class="btn link" onclick={() => equip(a.cosmetic.id, () => economy?.equip(a.cosmetic.slot, a.cosmetic.id))}>Equip</button>{/if}
          </li>
          {#if a.title}
            <li>
              <span class="k"><Title title={a.title} /></span>
              {#if equipped[`t:${a.title}`]}<span class="muted">Equipped</span>{:else}<button class="btn link" onclick={() => equip(`t:${a.title}`, () => economy?.equip("title", a.title))}>Equip</button>{/if}
            </li>
          {/if}
        {/each}
      </ul>
      <button class="btn" onclick={onclose}>Later</button>
    {/if}
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 45; display: grid; place-items: center; padding: 16px; background: radial-gradient(circle, rgba(20, 24, 40, 0.75), rgba(5, 6, 12, 0.92)); animation: fade 0.3s ease-out; }
  .card { width: min(460px, 100%); background: var(--surface); border-radius: 16px; padding: 32px 28px 24px; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45); outline: none; border: 1px solid var(--edge); }
  .eyebrow { margin: 0; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .glyph { display: block; font-family: var(--font-display); font-size: 40px; color: #9aa4b1; }
  h2 { margin: 4px 0 6px; font-size: 32px; font-variant: small-caps; letter-spacing: 0.04em; }
  .statement { margin: 0 auto; max-width: 34ch; font-family: var(--font-display); font-style: italic; color: var(--muted); }
  .flash { animation: flash 0.8s ease both; }
  .axiom:not(.flash) { animation: rise 0.5s ease both; }
  .unlocks { list-style: none; padding: 0; margin: 18px 0; display: grid; gap: 6px; text-align: left; }
  .unlocks li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; }
  .k { font-weight: 500; }
  @keyframes fade { from { opacity: 0; } }
  @keyframes flash { 0% { opacity: 0; transform: scale(0.9); } 25%, 75% { opacity: 1; transform: none; } 100% { opacity: 0; } }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  @media (prefers-reduced-motion: reduce) { .overlay, .flash, .axiom { animation: none !important; } }
</style>
