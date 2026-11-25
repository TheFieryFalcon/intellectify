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
  const started = $derived(!!skillState);
  const leadsTo = $derived(entry ? dependentsOf(data.course, entry.skill.id) : []);

  let startTier = $state<Tier>(3);

  const rankOf = (id: string) => (store?.progress.skills[id]?.rank ?? 0) as RankLevel;
  const gateFor = (k: number) => (skillState ? skillState?.gates.slice(k).reduce((a, b) => a + b, 0) : 0);

  async function start() {
    if (!entry || !store) return;
    if (!started) await store.saveSkill(entry.skill.id, toStored(newSkillState(startTier)));
    goto(`/${data.course.id}/practice/${entry.skill.id}`);
  }
  async function toggleDrop() {
    if (!entry || !store || !skillState) return;
    await store.saveSkill(entry.skill.id, { ...skillState, dropTier: !skillState?.dropTier, updatedAt: Date.now() });
  }
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  {#if !entry}
    <h1>Skill not found</h1>
    <p>There's no skill called "{page.params.skill}" in this course.</p>
  {:else}
    <p class="where muted">Year {entry.year} · Unit {entry.unit} · {entry.section.name}</p>
    <h1>{entry.skill.name}</h1>
    <p class="summary">{entry.skill.summary}</p>

    <div class="stats">
      <div><span class="k">Rank</span><span class="v"><RankDot rank={skillState?.rank ?? 0} label /></span></div>
      <div><span class="k">Score</span><span class="v">{skillState?.resolved ? score(skillState?.theta) : "—"}</span></div>
      <div><span class="k">θ</span><span class="v">{skillState ? Math.round(skillState?.theta) : "—"}</span></div>
      <div><span class="k">Answered</span><span class="v">{skillState?.resolved ?? 0}</span></div>
    </div>

    <section class="practice">
      {#if entry.skill.questionCount === 0}
        <p class="muted">No questions for this skill yet.</p>
      {:else if !started}
        <fieldset>
          <legend>Where do you want to start?</legend>
          <div class="tiers">
            {#each [1, 2, 3, 4, 5] as t (t)}
              <label class:on={startTier === t}><input type="radio" name="tier" value={t} bind:group={startTier} />Tier {t}</label>
            {/each}
          </div>
          <p class="muted hint">Tier 3 is typical exam standard. Pick higher if you've practised this elsewhere.</p>
        </fieldset>
        <button class="btn primary" onclick={start}>Start practising</button>
      {:else}
        <div class="row">
          <button class="btn primary" onclick={start}>Practise</button>
          <label class="drop"><input type="checkbox" checked={skillState!.dropTier} onchange={toggleDrop} /> Easier questions (drop a tier)</label>
        </div>
      {/if}
    </section>

    {#if skillState}
      <section>
        <h2>Rank gates</h2>
        <ul class="gates">
          {#each [1, 2, 3, 4, 5] as k (k)}
            {@const g = Math.min(gateFor(k), GATE_COUNT)}
            <li>
              <RankDot rank={k as RankLevel} label />
              <span class="muted">θ ≥ {RANK_FLOOR[k as 1]} and {g}/{GATE_COUNT} correct at Tier {k}+</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section>
      <h2>Dot points</h2>
      <p class="dps">
        {#each entry.skill.dotPoints as d (d)}<span>{d}</span>{/each}
        {#each entry.skill.reviewDotPoints as d (d)}<span class="review" title="Year 12 review of this skill">{d}</span>{/each}
      </p>
    </section>

    {#if entry.skill.prereqs.length || entry.skill.external.length}
      <section>
        <h2>Suggested first</h2>
        <ul class="links">
          {#each entry.skill.prereqs as id (id)}
            <li><a href="/{data.course.id}/skill/{id}"><RankDot rank={rankOf(id)} /> {index.get(id)?.skill.name}</a></li>
          {/each}
          {#each entry.skill.external as e (e.dotPoints.join())}
            <li class="muted">Methods: {e.note}</li>
          {/each}
        </ul>
        <p class="muted hint">Suggestions only. You can practise this skill now.</p>
      </section>
    {/if}

    {#if leadsTo.length}
      <section>
        <h2>Leads to</h2>
        <ul class="links">
          {#each leadsTo as s (s.id)}
            <li><a href="/{data.course.id}/skill/{s.id}"><RankDot rank={rankOf(s.id)} /> {s.name}</a></li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 8px; font-size: 13px; }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .where { margin: 0; font-size: 13px; }
  h1 { font-size: 30px; margin: 4px 0 8px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 0 0 8px; }
  .summary { margin: 0 0 20px; max-width: 62ch; }
  section { margin-top: 24px; }
  .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .stats div { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 16px; font-weight: 500; font-variant-numeric: tabular-nums; }
  @media (max-width: 520px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .practice { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
  fieldset { border: 0; padding: 0; margin: 0; }
  legend { font-weight: 500; margin-bottom: 8px; }
  .tiers { display: flex; flex-wrap: wrap; gap: 6px; }
  .tiers label { border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; cursor: pointer; }
  .tiers label.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .tiers input { position: absolute; opacity: 0; pointer-events: none; }
  .hint { font-size: 12px; margin: 8px 0 0; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
  .drop { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .gates li { display: flex; gap: 12px; align-items: center; font-size: 13px; }
  .gates li :global(.rank) { min-width: 90px; }
  .links a { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; }
  .links a:hover { color: var(--accent); }
  .dps { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
  .dps span { font-size: 12px; border: 1px solid var(--line); border-radius: 6px; padding: 1px 7px; background: var(--surface); font-variant-numeric: tabular-nums; }
  .dps span.review { border-style: dashed; }
</style>
