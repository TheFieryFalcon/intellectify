<script lang="ts">
  /**
   * Opening packs (SPEC §13.11). One pack: three face-down cards fan out (the last, the guaranteed Gold or
   * better, slightly larger); click, tap, Space or Enter flips the next. A Diamond gets a crystal burst and
   * comes to the center. Several packs skip the flips and end on a grid of the newly collected cards.
   */
  import { RARITIES, RARITY_NAME, type PackResult, type PulledCard } from "@intellectify/engine";
  import type { Card } from "$lib/economy.svelte";
  import CardFace from "./CardFace.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";

  let { results, cards, diamondIn, platinumIn, canAnother, onanother, onclose }: {
    results: PackResult[];
    cards: Map<string, Card>;
    diamondIn: number;
    platinumIn: number;
    canAnother: boolean;
    onanother: () => void;
    onclose: () => void;
  } = $props();

  const single = $derived(results.length === 1);
  const pack = $derived(results[0]!);
  let flipped = $state(0);
  let spotlight = $state<PulledCard | null>(null);
  let said = $state("");
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const all = $derived(results.flatMap((r) => r.cards));
  const total = $derived(results.reduce((t, r) => t + r.lemmas, 0));
  const newCards = $derived(all.filter((c) => c.result === "new").sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity)));
  const dups = $derived(all.filter((c) => c.result !== "new").length);
  const done = $derived(!single || flipped >= pack.cards.length);
  const label = (c: PulledCard) => `${cards.get(c.id)?.name ?? c.id} · ${RARITY_NAME[c.rarity]} · ${c.result === "new" ? "New" : c.result === "foilUpgrade" ? "Foil upgrade" : `Duplicate ×${c.count}`}`;

  function flip(i = flipped) {
    if (spotlight) {
      spotlight = null;
      return;
    }
    if (i !== flipped || flipped >= pack.cards.length) return;
    const c = pack.cards[flipped]!;
    flipped++;
    said = label(c);
    if (c.rarity === "diamond" && !reduced) spotlight = c;
  }
  const revealAll = () => {
    spotlight = null;
    flipped = pack.cards.length;
    said = pack.cards.map(label).join(". ");
  };
  function key(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!done) revealAll();
      else onclose();
    } else if (spotlight) {
      e.preventDefault();
      spotlight = null;
    } else if (single && !done && (e.key === " " || e.key === "Enter") && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      flip();
    }
  }
  let root = $state<HTMLElement | null>(null);
  $effect(() => root?.focus());
</script>

<svelte:window onkeydown={key} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="Opening {results.length === 1 ? 'a pack' : `${results.length} packs`}" tabindex="-1" bind:this={root} data-overlay>
  <p class="sr" aria-live="polite">{said}</p>
  {#if single}
    <div class="fan">
      {#each pack.cards as c, i (i)}
        {@const card = cards.get(c.id)}
        <div class="slot" class:last={i === pack.cards.length - 1} style="--i:{i}">
          {#if i < flipped && card}
            <div class="face" class:crossfade={reduced}>
              <CardFace {card} width={i === pack.cards.length - 1 ? 200 : 180} foil={c.foil} count={c.count} />
              <span class="tag {c.result}">{c.result === "new" ? "New" : c.result === "foilUpgrade" ? "Foil upgrade" : `+${c.lemmas} ∴`}</span>
            </div>
          {:else}
            <button class="back" style="--w:{i === pack.cards.length - 1 ? 200 : 180}px" aria-label="Card {i + 1} of {pack.cards.length}" disabled={i !== flipped} onclick={() => flip(i)}><span>∴</span></button>
          {/if}
        </div>
      {/each}
    </div>
    {#if spotlight}
      {@const card = cards.get(spotlight.id)}
      <button class="spot" onclick={() => (spotlight = null)} aria-label="Back to the cards">
        <span class="burst" aria-hidden="true"></span>
        {#if card}<CardFace {card} width={320} foil={spotlight.foil} />{/if}
      </button>
    {/if}
    {#if !done}
      <button class="btn link reveal" onclick={revealAll}>Reveal all</button>
    {:else}
      <p class="sum">New {pack.cards.filter((c) => c.result === "new").length} · Duplicates {pack.cards.filter((c) => c.result !== "new").length} · <LemmaAmount value={pack.lemmas} sign /> · Diamond in ≤ {diamondIn} · Platinum in ≤ {platinumIn}</p>
      <div class="actions">{#if canAnother}<button class="btn" onclick={onanother}>Open another</button>{/if}<button class="btn primary" onclick={onclose}>Done</button></div>
    {/if}
  {:else}
    <div class="grid">
      {#each newCards as c, i (i)}
        {@const card = cards.get(c.id)}
        {#if card}<CardFace {card} width={96} foil={c.foil} />{/if}
      {:else}
        <p class="muted none">No new cards</p>
      {/each}
    </div>
    <p class="sum">{results.length} packs · New {newCards.length} · Duplicates {dups} · <LemmaAmount value={total} sign /> · Diamond in ≤ {diamondIn} · Platinum in ≤ {platinumIn}</p>
    <div class="actions"><button class="btn primary" onclick={onclose}>Done</button></div>
  {/if}
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 42; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 16px; background: rgba(12, 14, 20, 0.88); color: #f2f4f8; outline: none; overflow-y: auto; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .fan { display: flex; align-items: flex-end; justify-content: center; gap: 14px; flex-wrap: wrap; }
  .slot { position: relative; animation: deal 0.35s ease-out both; animation-delay: calc(var(--i) * 0.08s); perspective: 800px; }
  .back { width: var(--w); aspect-ratio: 5 / 7; border-radius: 12px; border: 2px solid #c9b27a; background: repeating-linear-gradient(45deg, #232a3c 0 6px, #1b2131 6px 12px); color: #c9b27a; font-family: var(--font-display); font-size: 40px; cursor: pointer; }
  .back:disabled { cursor: default; opacity: 0.9; }
  .back:not(:disabled):hover { transform: translateY(-4px); }
  .face { animation: turn 0.3s ease-out; }
  .face.crossfade { animation: fadeIn 0.3s ease-out; }
  .tag { position: absolute; left: 50%; bottom: -24px; transform: translateX(-50%); font-size: 12px; white-space: nowrap; color: #cfd5e3; }
  .tag.new { color: #ffd86b; font-weight: 600; }
  .tag.foilUpgrade { color: #a6f0ff; font-weight: 600; }
  .spot { position: fixed; inset: 0; display: grid; place-items: center; border: 0; background: rgba(5, 8, 16, 0.7); cursor: pointer; z-index: 2; }
  .spot > :global(*) { grid-area: 1 / 1; }
  .burst { width: 520px; height: 520px; max-width: 100vw; background: repeating-conic-gradient(rgba(190, 230, 255, 0.35) 0 6deg, transparent 6deg 20deg); border-radius: 50%; mask: radial-gradient(circle, #000 20%, transparent 70%); animation: burst 1.5s ease-out both; }
  .spot :global(.card) { animation: enlarge 0.5s ease-out both; }
  .reveal { color: #cfd5e3; }
  .sum { margin: 22px 0 0; font-size: 14px; text-align: center; color: #e4e8f0; }
  .actions { display: flex; gap: 10px; }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 760px; }
  .none { color: #cfd5e3; }
  @keyframes deal { from { opacity: 0; transform: translateY(30px) rotate(-6deg); } }
  @keyframes turn { from { transform: rotateY(90deg); } }
  @keyframes fadeIn { from { opacity: 0; } }
  @keyframes burst { 0% { transform: scale(0.3) rotate(0deg); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1.1) rotate(40deg); opacity: 0.5; } }
  @keyframes enlarge { from { transform: scale(0.5); } }
  @media (prefers-reduced-motion: reduce) { .slot, .face, .burst, .spot :global(.card) { animation: none !important; } }
</style>
