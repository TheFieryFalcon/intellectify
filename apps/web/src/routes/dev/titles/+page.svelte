<script lang="ts">
  /** Preview of every title (SPEC §13.9), as on profiles, and calm as on leaderboard rows. */
  import { loadTitles, titles } from "$lib/titles.svelte";
  import Title from "$lib/components/economy/Title.svelte";

  loadTitles();
  const ORDER = ["tanzanite", "vibranium", "solarium", "antimatter", "axiom"];
  const groups = $derived(ORDER.map((k) => ({ k, list: Object.values(titles.map).filter((t) => t.kind === k) })));
</script>

<div class="wrap narrow">
  <h1>Titles</h1>
  {#each groups as g (g.k)}
    <h2>{g.k[0]!.toUpperCase()}{g.k.slice(1)}</h2>
    <ul>
      {#each g.list as t (t.title)}
        <li><span class="full"><Title title={t.title} /></span><span class="calm"><Title title={t.title} calm /></span><span class="muted">{t.source}</span></li>
      {/each}
    </ul>
  {/each}
</div>

<style>
  h1 { font-size: 28px; }
  h2 { font-family: var(--font-body); font-size: 14px; margin: 20px 0 6px; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
  li { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font-size: 15px; }
  .muted { font-size: 12px; }
</style>
