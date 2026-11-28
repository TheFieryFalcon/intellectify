<script lang="ts">
  /** Preview of every shop and Axiom cosmetic in its preview frame (SPEC §13.11). */
  import { catalogue, SLOT_NAME } from "$lib/cosmetics";
  import { loadEconomyData, type EconomyData } from "$lib/economy.svelte";
  import { loadTitles, titles } from "$lib/titles.svelte";
  import CosmeticPreview from "$lib/components/economy/CosmeticPreview.svelte";
  import { themeTokens } from "@intellectify/engine";
  import { themeVars } from "$lib/cosmetics";
  import ProfileHero from "$lib/components/economy/ProfileHero.svelte";

  let data = $state<EconomyData | null>(null);
  $effect(() => void loadEconomyData().then((d) => (data = d)));
  loadTitles();
  const items = $derived(data ? catalogue(data.config, titles.map).filter((c) => ["keypad", "celebration", "banner", "nodeTheme", "nameOrnament", "lemmaIcon"].includes(c.slot)) : []);
</script>

<div class="wrap">
  <h1>Cosmetics</h1>
  {#each items as c (c.id)}
    <section>
      <h2>{c.name} <span class="muted">{SLOT_NAME[c.slot]}, {c.condition ?? "Shop"}</span></h2>
      <CosmeticPreview item={c} name="Ada" />
    </section>
  {/each}
  {#if data}
    <section>
      <h2>Colors <span class="muted">A separate option, light and dark</span></h2>
      <div class="colors">
        {#each data.config.colors ?? [] as c (c.id)}
          {@const t = themeTokens(c.style)}
          {#each [t.light, t.dark] as v, i (i)}
            <div class="sample" style={themeVars(v)}><strong>{c.name}</strong> <span class="m">{i ? "dark" : "light"}</span> <button class="btn primary">Practice</button> <a href="#top">Link</a></div>
          {/each}
        {/each}
      </div>
    </section>
    <section>
      <h2>Frames <span class="muted">Era sets</span></h2>
      {#each data.config.eras as e (e.id)}<ProfileHero name="Ada ({e.name})" banner={null} frame="frame-{e.id}" title={null} ornament={null} showcase={[]} cards={new Map()} />{/each}
    </section>
  {/if}
</div>

<style>
  h1 { font-size: 28px; }
  section { margin: 22px 0; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
  h2 { font-family: var(--font-body); font-size: 15px; display: flex; gap: 10px; align-items: baseline; }
  h2 .muted { font-weight: 400; font-size: 12px; }
  .colors { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 6px; }
  .sample { background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; display: flex; gap: 8px; align-items: center; }
  .sample .m { color: var(--muted); font-size: 12px; flex: 1; }
</style>
