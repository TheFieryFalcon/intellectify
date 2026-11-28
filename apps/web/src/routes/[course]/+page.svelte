<script lang="ts">
  import { RANKS, type RankLevel } from "@intellectify/engine";
  import RankDot from "$lib/components/RankDot.svelte";
  import SkillTable from "$lib/components/SkillTable.svelte";
  import TechTree from "$lib/components/TechTree.svelte";
  import CourseLinks from "$lib/components/CourseLinks.svelte";
  import { computeRollups } from "$lib/practice";
  import { RANK_LABEL } from "$lib/ranks";
  import { courseProgress, session } from "$lib/session.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { currentEconomy, profileFor } from "$lib/profile.svelte";

  let { data } = $props();
  const store = $derived(courseProgress(data.course.id));
  const rollups = $derived(store ? computeRollups(data.course, store.progress) : null);
  // Best Section Challenge result per section, for the map.
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  $effect(() => void achievements?.load());
  // Refresh this course on the public mirror once per tab session (SPEC §12.2), so progress made before
  // leaderboards existed, or on another device, shows without waiting for the next answer.
  const profile = $derived(profileFor(session.backend, session.user));
  $effect(() => {
    if (!store?.loaded || !profile?.loaded || !achievements?.loaded) return;
    const flag = `intellectify:published:${data.course.id}`;
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
    } catch {
      return;
    }
    void achievements.syncReports(store, profile);
    if (!Object.keys(store.progress.skills).length && !Object.keys(achievements.earned).length) return;
    profile.publishCourse(data.course, store.progress);
    const ids = Object.keys(achievements.earned);
    profile.publishAchievements(data.course.id, ids, achievements.defs.filter((a) => ids.includes(a.id)).reduce((t, a) => t + a.points, 0));
  });
  const challengeBest = $derived(Object.fromEntries(Object.entries(achievements?.stats.challenges ?? {}).map(([k, v]) => [k, v.best])));

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

<div class="wrap wide">
  <div class="head">
    <div>
      <h1>{data.course.name}</h1>
      {#if rollups}<p class="muted course-rank"><RankDot rank={rollups.course.rank} /> Course rank: {RANK_LABEL[rollups.course.rank]}</p>{/if}
    </div>
    <a class="ach" href="/{data.course.id}/achievements">Achievements</a>
    <div class="toggles" role="group" aria-label="View">
      <button aria-pressed={view === "tree"} onclick={() => setView("tree")}>Tree</button>
      <button aria-pressed={view === "table"} onclick={() => setView("table")}>Table</button>
    </div>
  </div>
  <div class="key">
    {#each RANKS as _, i (i)}<span><RankDot rank={i as RankLevel} label /></span>{/each}
    <span class="sep" aria-hidden="true"></span>
    {#each ["small", "medium", "large", "cornerstone"] as size (size)}<span class="size"><span class="shape {size}" aria-hidden="true"></span>{size}</span>{/each}
  </div>

  <CourseLinks course={data.course.id} />

  {#if store?.error}<p class="error" role="alert">{store.error}</p>{/if}
  {#if !store || !store.loaded || !rollups}
    <p class="muted">Loading your progress…</p>
  {:else if view === "tree"}
    <TechTree course={data.course} progress={store.progress} {rollups} {challengeBest} theme={currentEconomy()?.state.equipped.nodeTheme ?? null} />
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
  .ach { margin-left: auto; margin-right: 12px; font-size: 13px; color: var(--muted); text-decoration: none; align-self: flex-end; padding-bottom: 6px; }
  .ach:hover { color: var(--accent); }
  .key { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; font-size: 12px; color: var(--muted); margin-bottom: 18px; }
  .sep { width: 1px; height: 14px; background: var(--line); }
  .size { display: inline-flex; align-items: center; gap: 6px; text-transform: capitalize; }
  .shape { display: inline-block; flex: none; border: 1.5px solid var(--edge); background: var(--surface); }
  .shape.small { width: 8px; height: 8px; border-radius: 50%; }
  .shape.medium { width: 11px; height: 11px; border-radius: 50%; }
  .shape.large { width: 8px; height: 8px; border-radius: 1.5px; transform: rotate(45deg); margin: 0 1px; }
  .shape.cornerstone { width: 11px; height: 11px; border-radius: 2px; transform: rotate(45deg); margin: 0 2px; }
  .error { color: var(--bad); }
  /* Phones: the view links sit in one row under the title, starting at the left gutter. */
  @media (max-width: 640px) {
    .head { align-items: center; gap: 8px; }
    .ach { margin-left: 0; padding-bottom: 2px; }
    .key { gap: 6px 12px; }
  }
</style>
