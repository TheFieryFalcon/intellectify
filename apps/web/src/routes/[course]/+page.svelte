<script lang="ts">
  import { RANKS, type RankLevel } from "@intellectify/engine";
  import RankDot from "$lib/components/RankDot.svelte";
  import SkillTable from "$lib/components/SkillTable.svelte";
  import TechTree from "$lib/components/TechTree.svelte";
  import { computeRollups } from "$lib/practice";
  import { RANK_LABEL } from "$lib/ranks";
  import { courseProgress } from "$lib/session.svelte";

  let { data } = $props();
  const store = $derived(courseProgress(data.course.id));
  const rollups = $derived(store ? computeRollups(data.course, store.progress) : null);

  const VIEW_KEY = "intellectify:view";
  let view = $state<"tree" | "table">(readView());
  function readView(): "tree" | "table" {
    try {
      return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "tree";
    } catch {
      return "tree";
    }
  }
  function setView(v: "tree" | "table") {
    view = v;
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  }
</script>

<div class="wrap">
  <div class="head">
    <div>
      <h1>{data.course.name}</h1>
      {#if rollups}<p class="muted course-rank"><RankDot rank={rollups.course.rank} /> Course rank: {RANK_LABEL[rollups.course.rank]}</p>{/if}
    </div>
    <div class="toggles" role="group" aria-label="View">
      <button aria-pressed={view === "tree"} onclick={() => setView("tree")}>Tree</button>
      <button aria-pressed={view === "table"} onclick={() => setView("table")}>Table</button>
    </div>
  </div>
  <div class="key">
    {#each RANKS as _, i (i)}<span><RankDot rank={i as RankLevel} label /></span>{/each}
  </div>

  {#if store?.error}<p class="error" role="alert">{store.error}</p>{/if}
  {#if !store || !store.loaded || !rollups}
    <p class="muted">Loading your progress…</p>
  {:else if view === "tree"}
    <TechTree course={data.course} progress={store.progress} {rollups} />
  {:else}
    <SkillTable course={data.course} progress={store.progress} />
  {/if}
</div>

<style>
  .head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
  h1 { margin: 0; font-size: 28px; }
  .course-rank { margin: 4px 0 0; display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .toggles { display: flex; gap: 16px; }
  .toggles button { border: 0; background: none; color: var(--muted); padding: 2px 0; cursor: pointer; border-bottom: 1.5px solid transparent; }
  .toggles button[aria-pressed="true"] { color: var(--ink); border-bottom-color: var(--ink); }
  .key { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: var(--muted); margin-bottom: 18px; }
  .error { color: var(--bad); }
</style>
