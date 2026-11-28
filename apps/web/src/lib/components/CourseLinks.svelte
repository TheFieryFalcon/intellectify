<script lang="ts">
  /** Tiles above the map: modes outside the skill tree (daily problem, revision, questions, boards). */
  import { currentStreak, dailyTier } from "$lib/daily";
  import { perthDay, profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";
  import { listHistory } from "$lib/history";

  let { course }: { course: string } = $props();
  const profile = $derived(profileFor(session.backend, session.user));
  const day = perthDay();
  const streak = $derived(currentStreak(profile?.profile.daily, day));
  const solvedToday = $derived(Object.entries(profile?.profile.daily?.done ?? {}).some(([k, v]) => k.startsWith(`${day}:${course}:`) && v === "solved"));

  let answers = $state(0);
  $effect(() => void (answers = listHistory(course).length));

  const tiles = $derived([
    { href: `/${course}/daily`, title: "Daily", meta: [`Tier ${dailyTier(day)}`, `Streak ${streak}`, ...(solvedToday ? ["Solved"] : [])] },
    { href: `/${course}/revision`, title: "Revision", meta: ["Exam", "Custom"] },
    { href: `/${course}/questions`, title: "Questions", meta: ["Every question", "Solutions"] },
    { href: `/${course}/discussions`, title: "Discussions", meta: ["Daily problems"] },
    { href: `/${course}/history`, title: "History", meta: [`${answers} answer${answers === 1 ? "" : "s"}`] },
  ]);
</script>

<nav class="links" aria-label="Modes">
  {#each tiles as t (t.href)}
    <a href={t.href} class="tile">
      <span class="title">{t.title}</span>
      <span class="meta">{t.meta.join(", ")}</span>
    </a>
  {/each}
</nav>

<style>
  .links { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 0 0 16px; max-width: 900px; }
  @media (max-width: 640px) { .links { grid-template-columns: 1fr 1fr; } }
  .tile { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 10px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); text-decoration: none; transition: border-color 0.15s; }
  .tile:hover, .tile:focus-visible { border-color: var(--accent); }
  .title { font-weight: 600; font-size: 14px; }
  .meta { font-size: 12px; color: var(--muted); }
</style>
