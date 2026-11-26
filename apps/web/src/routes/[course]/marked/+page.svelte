<script lang="ts">
  /** Every written answer for this course: waiting, marked and appealed. */
  import { indexSkills } from "$lib/content";
  import { markingFor } from "$lib/marking.svelte";
  import { session } from "$lib/session.svelte";

  let { data } = $props();
  const marking = $derived(markingFor(session.backend, session.user));
  const jobs = $derived((marking?.jobs ?? []).filter((j) => j.course === data.course.id));
  const index = $derived(indexSkills(data.course));
  const fmt = (t: number) => new Date(t).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const state = (j: (typeof jobs)[number]) =>
    j.status === "pending" ? "Waiting" : j.status === "failed" ? "Not marked" : j.appeal?.status === "pending" ? "Appealed" : `${Math.round((j.appeal?.result ?? j.result)!.score * 100)}%`;
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  <h1>Marked</h1>
  {#if !marking?.loaded}
    <p class="muted">Loading…</p>
  {:else if !jobs.length}
    <p class="muted">No written answers yet</p>
  {:else}
    <ul class="list">
      {#each jobs as j (j.id)}
        <li>
          <a href="/{data.course.id}/marked/{j.id}">
            <span class="name">{index.get(j.skill)?.skill.name ?? j.skill}</span>
            <span class="muted when">{fmt(j.createdAt)}</span>
            <span class="state" class:wait={j.status === "pending" || j.appeal?.status === "pending"}>{state(j)}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; }
  .crumbs a { color: var(--muted); text-decoration: none; }
  h1 { margin: 0 0 14px; font-size: 26px; }
  .list { list-style: none; margin: 0; padding: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }
  .list li + li { border-top: 1px solid var(--line); }
  .list a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--ink); text-decoration: none; }
  .list a:hover { background: var(--region); }
  .name { flex: 1; min-width: 0; }
  .when { font-size: 12px; }
  .state { font-weight: 600; font-variant-numeric: tabular-nums; min-width: 72px; text-align: right; }
  .state.wait { color: var(--muted); font-weight: 500; }
</style>
