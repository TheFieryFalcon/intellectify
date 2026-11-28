<script lang="ts">
  /**
   * Packs (SPEC §13.11): one pack per era, in era order, each in its era's style: unopened count, price,
   * Buy and Buy 10, Open, Open 10 and Open all, set completion, the pity counters, the Diamonds still
   * missing and the odds. Granted packs wait here quietly.
   */
  import { diamondIn, eraUnlocked, platinumIn, unopened, type PackResult } from "@intellectify/engine";
  import type { EconomyStore } from "$lib/economy.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";
  import { buildLabel } from "$lib/cosmetics";
  import PackOpening from "./PackOpening.svelte";

  let { economy }: { economy: EconomyStore } = $props();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  let opening = $state<{ era: string; results: PackResult[] } | null>(null);
  const open = (era: string, n: number) => {
    const results = economy.openPacks(era, n);
    if (results.length) opening = { era, results };
  };
  const odds = $derived(cfg.packs.odds);
  const ROWS = ["silver", "gold", "platinum", "diamond"] as const;
</script>

<div class="packs">
  {#each cfg.eras as e, i (e.id)}
    {@const isOpen = eraUnlocked(cfg, s, e.id)}
    {@const cards = economy.cardsOf(e.id)}
    {@const have = cards.filter((c) => (s.cards[c.id]?.n ?? 0) > 0).length}
    {@const missing = cards.filter((c) => c.rarity === "diamond" && !(s.cards[c.id]?.n > 0))}
    {@const n = unopened(s, e.id)}
    <section class="pack-row" data-pack-era={e.id}>
      <div class="pack" class:sealed={!isOpen} aria-hidden="true"><span class="era">{e.name}</span><span class="glyph">∴</span><span class="yrs">{e.years}</span></div>
      <div class="info">
        <h3>{e.name} Pack</h3>
        {#if !isOpen}
          <p class="pl">{buildLabel(cfg.eras[i - 1]!.institute.name)}</p>
        {:else}
          <p class="meta num">{n} unopened · <LemmaAmount value={e.packPrice} /> each</p>
          <div class="btns">
            <button class="ink-btn" class:pencil={e.packPrice > economy.balance} disabled={e.packPrice > economy.balance} onclick={() => economy.buyPacks(e.id, 1)}>Buy · <LemmaAmount value={e.packPrice} /></button>
            <button class="ink-btn" class:pencil={e.packPrice * 10 > economy.balance} disabled={e.packPrice * 10 > economy.balance} onclick={() => economy.buyPacks(e.id, 10)}>Buy 10 · <LemmaAmount value={e.packPrice * 10} /></button>
            <button class="ink-btn" class:pencil={!n} disabled={!n} onclick={() => open(e.id, 1)}>Open</button>
            <button class="ink-btn" class:pencil={n < 2} disabled={n < 2} onclick={() => open(e.id, 10)}>Open 10</button>
            <button class="ink-btn" class:pencil={n < 2} disabled={n < 2} onclick={() => open(e.id, n)}>Open all</button>
          </div>
          <p class="meta num">{have} / {cards.length} · Diamond in ≤ {diamondIn(cfg, s, e.id)} · Platinum in ≤ {platinumIn(cfg, s, e.id)}{#if missing.length} · Missing: {missing.map((c) => c.name).join(", ")}{/if}</p>
        {/if}
      </div>
    </section>
  {/each}
</div>

<table class="odds">
  <caption class="pl">Odds per card</caption>
  <thead><tr><th></th>{#each ROWS as r (r)}<th scope="col">{r[0]!.toUpperCase()}{r.slice(1)}</th>{/each}</tr></thead>
  <tbody>
    <tr><th scope="row">Cards 1–{cfg.packs.size - 1}</th>{#each ROWS as r (r)}<td class="num">{odds.common[r]}%</td>{/each}</tr>
    <tr><th scope="row">Card {cfg.packs.size} (Gold or better)</th>{#each ROWS as r (r)}<td class="num">{odds.last[r] ? `${odds.last[r]}%` : "—"}</td>{/each}</tr>
  </tbody>
  <tfoot><tr><td colspan="5" class="pl">Platinum or better by the {cfg.packs.pity.platinum}th pack without one · Diamond by the {cfg.packs.pity.diamond}th · Foil 1 in {cfg.packs.foilOneIn}</td></tr></tfoot>
</table>

{#if opening}
  {@const o = opening}
  <PackOpening
    results={o.results}
    cards={economy.cardMap}
    diamondIn={diamondIn(cfg, s, o.era)}
    platinumIn={platinumIn(cfg, s, o.era)}
    canAnother={unopened(s, o.era) > 0}
    onanother={() => { opening = null; queueMicrotask(() => open(o.era, 1)); }}
    onclose={() => (opening = null)}
  />
{/if}

<style>
  .packs { display: grid; gap: 12px; margin: 14px 0; }
  .pack-row { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 14px; align-items: start; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .pack { width: 96px; aspect-ratio: 5 / 7; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 8px 4px; font-family: var(--font-display); text-align: center; border: 3px double; }
  .era { font-size: 12px; font-variant: small-caps; letter-spacing: 0.05em; }
  .glyph { font-size: 30px; }
  .yrs { font-size: 10px; }
  [data-pack-era="antiquity"] .pack { background: #e9dcbc; color: #4a321b; border-color: #7a5c3a; }
  [data-pack-era="golden-age"] .pack { background: linear-gradient(#26457a, #1b2f57); color: #f2d27a; border-color: #c9a227; }
  [data-pack-era="renaissance"] .pack { background: repeating-linear-gradient(0deg, #efe7d6 0 2px, #e3d8c2 2px 3px); color: #3a2c20; border-color: #7a5a3a; }
  [data-pack-era="enlightenment"] .pack { background: #f4efe3; color: #1c1c1c; border-color: #444; }
  [data-pack-era="steam-age"] .pack { background: linear-gradient(135deg, #b5893c, #7f5e25); color: #fff4d8; border-color: #4b3714; }
  [data-pack-era="machine-age"] .pack { background: #1f3f6e; color: #eef4ff; border-color: #cfe0f7; }
  [data-pack-era="space-age"] .pack { background: #0e1220; color: #f3f5ff; border-color: #6b7aa6; }
  .pack.sealed { filter: grayscale(1) contrast(0.8); opacity: 0.55; }
  h3 { margin: 0; font-size: 17px; }
  .meta { margin: 4px 0; font-size: 13px; }
  .btns { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  .odds { border-collapse: collapse; font-size: 13px; margin: 10px 0 0; width: 100%; max-width: 520px; }
  .odds caption { text-align: left; margin-bottom: 4px; }
  .odds th, .odds td { padding: 4px 8px; border-bottom: 1px solid var(--line); text-align: right; font-weight: 400; }
  .odds th[scope="row"] { text-align: left; }
  .odds tfoot td { text-align: left; border: 0; font-size: 12px; }
</style>
