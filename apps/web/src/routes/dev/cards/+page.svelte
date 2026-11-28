<script lang="ts">
  /** Preview of cards (SPEC §13.11): every rarity, foil, the reveal, the Diamond reveal and duplicates. */
  import type { PackResult, Rarity } from "@intellectify/engine";
  import { loadEconomyData, type Card, type EconomyData } from "$lib/economy.svelte";
  import CardFace from "$lib/components/economy/CardFace.svelte";
  import CardDetail from "$lib/components/economy/CardDetail.svelte";
  import PackOpening from "$lib/components/economy/PackOpening.svelte";

  let data = $state<EconomyData | null>(null);
  $effect(() => void loadEconomyData().then((d) => (data = d)));
  const byRarity = (r: Rarity) => data?.cards.find((c) => c.rarity === r && c.era === "enlightenment") ?? data?.cards.find((c) => c.rarity === r);
  const cards = $derived(new Map((data?.cards ?? []).map((c) => [c.id, c])));
  let opening = $state<PackResult[] | null>(null);
  let detail = $state<Card | null>(null);
  const pull = (c: Card | undefined, result: "new" | "duplicate" | "foilUpgrade", foil = false, count = 1) => ({ id: c!.id, rarity: c!.rarity, foil, result, count, lemmas: result === "duplicate" ? 60 : 0 });
  const RS: Rarity[] = ["silver", "gold", "platinum", "diamond"];
</script>

<div class="wrap">
  <h1>Cards</h1>
  {#if data}
    <h2>Every rarity</h2>
    <div class="row">{#each RS as r (r)}{@const c = byRarity(r)}{#if c}<CardFace card={c} width={180} onclick={() => (detail = c)} />{/if}{/each}</div>
    <h2>Foil</h2>
    <div class="row">{#each RS as r (r)}{@const c = byRarity(r)}{#if c}<CardFace card={c} width={180} foil />{/if}{/each}</div>
    <h2>Sizes and silhouette</h2>
    <div class="row">{#if byRarity("diamond")}<CardFace card={byRarity("diamond")!} width={96} /><CardFace card={byRarity("diamond")!} width={96} silhouette /><CardFace card={byRarity("gold")!} width={96} count={3} /><CardFace card={byRarity("platinum")!} width={320} />{/if}</div>
    <h2>Reveals</h2>
    <div class="row">
      <button class="btn" onclick={() => (opening = [{ era: "enlightenment", cards: [pull(byRarity("silver"), "new"), pull(byRarity("silver"), "duplicate", false, 2), pull(byRarity("gold"), "new")], lemmas: 60, diamond: false }])}>A pack</button>
      <button class="btn" onclick={() => (opening = [{ era: "enlightenment", cards: [pull(byRarity("silver"), "new"), pull(byRarity("gold"), "foilUpgrade", true, 2), pull(byRarity("diamond"), "new", true)], lemmas: 0, diamond: true }])}>Diamond reveal</button>
      <button class="btn" onclick={() => (opening = Array.from({ length: 10 }, (_, i) => ({ era: "antiquity", cards: data!.cards.filter((c) => c.era === "antiquity").slice(i * 2, i * 2 + 3).map((c, j) => ({ id: c.id, rarity: c.rarity, foil: j === 2 && i % 4 === 0, result: (j === 1 ? "duplicate" : "new") as "new" | "duplicate", count: 1, lemmas: j === 1 ? 20 : 0 })), lemmas: 20, diamond: false })))}>Open 10</button>
    </div>
  {:else}<p class="muted">Loading…</p>{/if}
</div>

{#if opening}<PackOpening results={opening} {cards} diamondIn={61} platinumIn={7} canAnother={true} onanother={() => (opening = null)} onclose={() => (opening = null)} />{/if}
{#if detail}<CardDetail card={detail} owned={{ n: 2, foil: false }} onclose={() => (detail = null)} />{/if}

<style>
  h1 { font-size: 28px; }
  h2 { font-family: var(--font-body); font-size: 14px; margin: 22px 0 8px; }
  .row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
</style>
