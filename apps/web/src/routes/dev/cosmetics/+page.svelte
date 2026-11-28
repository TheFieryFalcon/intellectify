<script lang="ts">
  /** Preview of every shop and Axiom cosmetic in its preview frame (SPEC §13.11). */
  import { catalogue, SLOT_NAME } from "$lib/cosmetics";
  import { loadEconomyData, type EconomyData } from "$lib/economy.svelte";
  import { loadTitles, titles } from "$lib/titles.svelte";
  import CosmeticPreview from "$lib/components/economy/CosmeticPreview.svelte";
  import LemmaIcon from "$lib/components/economy/LemmaIcon.svelte";
  import ProfileHero from "$lib/components/economy/ProfileHero.svelte";

  let data = $state<EconomyData | null>(null);
  $effect(() => void loadEconomyData().then((d) => (data = d)));
  loadTitles();
  const items = $derived(data ? catalogue(data.config, titles.map).filter((c) => ["keypad", "celebration", "banner", "nodeTheme", "nameOrnament"].includes(c.slot)) : []);
</script>

<div class="wrap">
  <h1>Cosmetics</h1>
  {#each items as c (c.id)}
    <section>
      <h2>{c.name} <span class="muted">{SLOT_NAME[c.slot]} · {c.condition ?? "Shop"}</span></h2>
      <CosmeticPreview item={c} name="Ada" />
    </section>
  {/each}
  {#if data}
    <section><h2>∞ Lemma icon <span class="muted">Lemma icon · Axiom · Infinity</span></h2><p class="icons">4.56 M <LemmaIcon /> · 4.56 M <LemmaIcon infinity /></p></section>
    <section>
      <h2>Frames <span class="muted">Era sets</span></h2>
      {#each data.config.eras as e (e.id)}<ProfileHero name="Ada · {e.name}" banner={null} frame="frame-{e.id}" title={null} ornament={null} showcase={[]} cards={new Map()} />{/each}
    </section>
  {/if}
</div>

<style>
  h1 { font-size: 28px; }
  section { margin: 22px 0; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
  h2 { font-family: var(--font-body); font-size: 15px; display: flex; gap: 10px; align-items: baseline; }
  h2 .muted { font-weight: 400; font-size: 12px; }
  .icons { font-size: 18px; }
</style>
