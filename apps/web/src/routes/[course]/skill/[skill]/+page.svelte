<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { GATE_COUNT, newSkillState, RANK_FLOOR, type RankLevel, type Tier } from "@intellectify/engine";
  import RankDot from "$lib/components/RankDot.svelte";
  import { dependentsOf, indexSkills } from "$lib/content";
  import { toStored } from "$lib/practice";
  import { RANK_LABEL, score } from "$lib/ranks";
  import { courseProgress } from "$lib/session.svelte";

  let { data } = $props();
  const index = $derived(indexSkills(data.course));
  const entry = $derived(index.get(page.params.skill));
  const store = $derived(courseProgress(data.course.id));
  const skillState = $derived(entry && store ? store.progress.skills[entry.skill.id] : undefined);
  const leadsTo = $derived(entry ? dependentsOf(data.course, entry.skill.id) : []);
  const rank = $derived((skillState?.rank ?? 0) as RankLevel);

  /** What the next rank still needs, e.g. "Bronze: 1/3 correct at Tier 1+". */
  const nextGoal = $derived.by(() => {
    if (!skillState || rank === 5) return null;
    const next = (rank + 1) as Exclude<RankLevel, 0>;
    const correct = Math.min(skillState.gates.slice(next).reduce((a, b) => a + b, 0), GATE_COUNT);
    const needs = [`${correct}/${GATE_COUNT} correct at Tier ${next}+`];
    if (skillState.theta < RANK_FLOOR[next]) needs.push(`θ ${RANK_FLOOR[next]}`);
    return `${RANK_LABEL[next]}: ${needs.join(", ")}`;
  });

  let startTier = $state<Tier>(3);
  const rankOf = (id: string) => (store?.progress.skills[id]?.rank ?? 0) as RankLevel;

  async function start() {
    if (!entry || !store) return;
    if (!skillState) await store.saveSkill(entry.skill.id, toStored(newSkillState(startTier)));
    goto(`/${data.course.id}/practice/${entry.skill.id}`);
  }
  async function toggleDrop() {
    if (!entry || !store || !skillState) return;
    await store.saveSkill(entry.skill.id, { ...skillState, dropTier: !skillState.dropTier, updatedAt: Date.now() });
  }
</script>

<div class="wrap narrow">
  {#if !entry}
    <h1>Skill not found</h1>
    <p><a href="/{data.course.id}">Back to the map</a></p>
  {:else}
    <a class="back" href="/{data.course.id}">← Unit {entry.unit} · {entry.section.name}</a>
    <h1>{entry.skill.name}</h1>
    <p class="summary">{entry.skill.summary}</p>

    <div class="status">
      <RankDot {rank} label />
      {#if skillState?.resolved}
        <span>Score {score(skillState.theta)}</span>
        <span class="muted">θ {Math.round(skillState.theta)}</span>
      {/if}
      {#if nextGoal}<span class="muted goal">Next: {nextGoal}</span>{/if}
    </div>

    {#if entry.skill.questionCount === 0}
      <p class="muted">No questions yet.</p>
      {#if entry.skill.hasTutorial}<p><a class="btn" href="/{data.course.id}/learn/{entry.skill.id}">Learn</a></p>{/if}
    {:else}
      <div class="actions">
        {#if !skillState}
          <div class="tiers" role="radiogroup" aria-label="Starting tier">
            <span class="muted">Start at</span>
            {#each [1, 2, 3, 4, 5] as t (t)}
              <button role="radio" aria-checked={startTier === t} class:on={startTier === t} onclick={() => (startTier = t as Tier)}>Tier {t}</button>
            {/each}
          </div>
        {/if}
        <button class="btn primary" onclick={start}>Practice</button>
        {#if entry.skill.hasTutorial}<a class="btn" href="/{data.course.id}/learn/{entry.skill.id}">Learn</a>{/if}
        {#if skillState}
          <label class="drop"><input type="checkbox" checked={skillState.dropTier} onchange={toggleDrop} /> Easier questions</label>
        {/if}
      </div>
    {/if}

    <dl>
      <dt>Dot points</dt>
      <dd>{[...entry.skill.dotPoints, ...entry.skill.reviewDotPoints].join(", ")}</dd>
      {#if entry.skill.prereqs.length || entry.skill.external.length}
        <dt>Suggested first</dt>
        <dd class="links">
          {#each entry.skill.prereqs as id (id)}
            <a href="/{data.course.id}/skill/{id}"><RankDot rank={rankOf(id)} /> {index.get(id)?.skill.name}</a>
          {/each}
          {#each entry.skill.external as e (e.dotPoints.join())}<span class="muted">Methods: {e.note}</span>{/each}
        </dd>
      {/if}
      {#if leadsTo.length}
        <dt>Leads to</dt>
        <dd class="links">
          {#each leadsTo as s (s.id)}<a href="/{data.course.id}/skill/{s.id}"><RankDot rank={rankOf(s.id)} /> {s.name}</a>{/each}
        </dd>
      {/if}
    </dl>
  {/if}
</div>

<style>
  .back { font-size: 13px; color: var(--muted); text-decoration: none; }
  .back:hover { color: var(--accent); }
  h1 { font-size: 30px; margin: 6px 0 6px; }
  .summary { margin: 0 0 16px; max-width: 62ch; color: var(--muted); }
  .status { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; font-variant-numeric: tabular-nums; }
  .goal { font-size: 13px; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; margin: 20px 0 28px; }
  .tiers { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .tiers span { margin-right: 4px; }
  .tiers button { border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
  .tiers button.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .drop { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 10px 20px; margin: 0; }
  dt { color: var(--muted); font-size: 13px; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }
  .links { display: flex; flex-direction: column; gap: 4px; }
  .links a { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; }
  .links a:hover { color: var(--accent); }
  @media (max-width: 520px) { dl { grid-template-columns: 1fr; gap: 2px; } dd { margin-bottom: 10px; } }
</style>
