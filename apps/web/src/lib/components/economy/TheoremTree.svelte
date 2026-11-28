<script lang="ts">
  /**
   * Theorems: the proof tree (SPEC §13.11). A hand-placed diagram of the 11 theorems (positions from
   * content/economy.yaml): engraved plates with name and level, ink edges ending in a small ∴ (prerequisite
   * ∴ theorem), locked ones in pencil with their requirement. Selecting a node opens its panel.
   */
  import katex from "katex";
  import { buyQuote, levelOf, theoremCanBuy, theoremEffectLabel, theoremUnlocked, type BuyAmount, type TheoremDef, type TheoremId } from "@intellectify/engine";
  import type { EconomyStore } from "$lib/economy.svelte";
  import BuyButton from "./BuyButton.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";
  import Sheet from "./Sheet.svelte";

  let { economy, amount }: { economy: EconomyStore; amount: BuyAmount } = $props();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  const W = 1000;
  const H = 640;
  let selected = $state<TheoremId | null>(null);
  const sel = $derived(selected ? cfg.theorems.find((t) => t.id === selected)! : null);
  const tex = (src: string) => katex.renderToString(src, { throwOnError: false, strict: "ignore" });
  const nameOf = (id: TheoremId) => cfg.theorems.find((t) => t.id === id)!.name;
  const edges = $derived(cfg.theorems.filter((t) => t.requires).map((t) => ({ from: cfg.theorems.find((x) => x.id === t.requires!.theorem)!, to: t })));
  const affordable = (t: TheoremDef) => theoremCanBuy(cfg, s, t.id) && buyQuote(t.base, t.growth, levelOf(s, t.id), economy.balance, 1, t.maxLevel).affordable;
  const order = $derived([...cfg.theorems].sort((a, b) => a.y - b.y || a.x - b.x));
  const unlocks = (id: TheoremId) => cfg.theorems.filter((t) => t.requires?.theorem === id);
</script>

<div class="tree" style="aspect-ratio: {W} / {H}">
  <svg viewBox="0 0 {W} {H}" aria-hidden="true">
    {#each edges as e (e.to.id)}
      {@const lit = theoremUnlocked(cfg, s, e.to.id)}
      {@const mx = (e.from.x + e.to.x) / 2}
      <path class:lit d="M{e.from.x + 70} {e.from.y} C {mx} {e.from.y}, {mx} {e.to.y}, {e.to.x - 86} {e.to.y}" />
      <text class:lit x={e.to.x - 80} y={e.to.y + 4}>∴</text>
    {/each}
  </svg>
  {#each order as t (t.id)}
    {@const unlocked = theoremUnlocked(cfg, s, t.id)}
    {@const L = levelOf(s, t.id)}
    <button
      class="node plate"
      class:pencil={!unlocked || t.unavailable}
      class:inked={unlocked && !t.unavailable && affordable(t)}
      style="left:{(100 * t.x) / W}%; top:{(100 * t.y) / H}%"
      onclick={() => (selected = t.id)}
      aria-label="{t.name}{unlocked ? `, level ${L}` : `, needs ${t.requires ? `${nameOf(t.requires.theorem)} ${t.requires.level}` : ''}`}"
    >
      <span class="name">{t.name}</span>
      {#if t.unavailable}<span class="lv">Not available yet</span>
      {:else if unlocked}<span class="lv num">Lv {L}</span>
      {:else if t.requires}<span class="lv">{nameOf(t.requires.theorem)} {t.requires.level}</span>{/if}
    </button>
  {/each}
</div>

{#if sel}
  {@const L = levelOf(s, sel.id)}
  {@const ctx = economy.ctx}
  <Sheet label={sel.name} onclose={() => (selected = null)}>
    <p class="pl">Theorem · {sel.boosts}</p>
    <h2>{sel.name}</h2>
    <p class="statement">{@html tex(sel.statement)}</p>
    <dl>
      <dt>Level</dt><dd class="num">{L}{sel.maxLevel ? ` / ${sel.maxLevel}` : ""}</dd>
      <dt>Effect</dt><dd>{theoremEffectLabel(cfg, sel.id, L, ctx)} → {theoremEffectLabel(cfg, sel.id, L + 1, ctx)}</dd>
      <dt>Cost</dt><dd class="num"><LemmaAmount value={buyQuote(sel.base, sel.growth, L, economy.balance, amount, sel.maxLevel).cost} /></dd>
      <dt>Requires</dt><dd>{sel.requires ? `${nameOf(sel.requires.theorem)} ${sel.requires.level}` : "—"}</dd>
      <dt>Unlocks</dt><dd>{unlocks(sel.id).map((t) => `${t.name} (at ${t.requires!.level})`).join(", ") || "—"}</dd>
    </dl>
    {#if sel.unavailable}
      <p class="pl">Not available yet</p>
    {:else if !theoremUnlocked(cfg, s, sel.id)}
      <p class="pl">Needs {nameOf(sel.requires!.theorem)} {sel.requires!.level}</p>
    {:else}
      <div class="buy">
        {#each [1, 10, "max"] as const as a (a)}
          <BuyButton base={sel.base} growth={sel.growth} level={L} budget={economy.balance} amount={a} maxLevel={sel.maxLevel} onbuy={(x) => economy.buyTheorem(sel.id, x)} />
        {/each}
      </div>
    {/if}
  </Sheet>
{/if}

<style>
  .tree { position: relative; width: 100%; max-width: 1000px; margin: 12px auto; }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  path { fill: none; stroke: var(--pencil); stroke-width: 1.2; stroke-dasharray: 4 4; }
  path.lit { stroke: var(--ink-archive); stroke-dasharray: none; stroke-width: 1.4; }
  text { fill: var(--pencil); font-size: 16px; font-family: var(--font-display); }
  text.lit { fill: var(--ink-archive); }
  .node { position: absolute; transform: translate(-50%, -50%); width: 15.5%; min-width: 108px; min-height: 44px; padding: 6px 8px; display: flex; flex-direction: column; align-items: center; gap: 1px; cursor: pointer; font: inherit; color: var(--ink-archive); text-align: center; }
  .node.pencil { background: transparent; border: 1px dashed var(--pencil); color: var(--pencil); }
  .node.pencil::before, .node.pencil::after { display: none; }
  .node:focus-visible { outline: 2px solid var(--gilt); outline-offset: 2px; }
  .name { font-family: var(--font-display); font-weight: 600; font-size: clamp(10px, 1.4vw, 14px); line-height: 1.15; }
  .lv { font-size: clamp(9px, 1.1vw, 12px); }
  .node.inked .lv { font-weight: 600; }
  h2 { margin: 2px 0 6px; }
  .statement { font-size: 17px; overflow-x: auto; margin: 0 0 12px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 13px; margin: 0 0 14px; }
  dt { color: var(--muted); }
  dd { margin: 0; }
  .buy { display: flex; flex-wrap: wrap; gap: 6px; }
  @media (max-width: 640px) { .node { min-width: 0; width: 21%; padding: 4px; } }
</style>
