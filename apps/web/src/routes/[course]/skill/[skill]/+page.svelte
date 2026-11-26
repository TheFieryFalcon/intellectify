<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { gateCount as gateFor, newSkillState, RANK_FLOOR, type RankLevel, type Tier } from "@intellectify/engine";
  import RankDot from "$lib/components/RankDot.svelte";
  import QuestionList from "$lib/components/QuestionList.svelte";
  import { dependentsOf, indexSkills, loadQuestionIndex, type QuestionIndexEntry } from "$lib/content";
  import { answeredIds } from "$lib/practice";
  import { getStartTier, toStored } from "$lib/practice";
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
    const gateCount = gateFor(next, entry?.skill.size);
    const correct = Math.min(skillState.gates.slice(next).reduce((a, b) => a + b, 0), gateCount);
    const needs = [`${correct}/${gateCount} correct at Tier ${next}+`];
    if (skillState.theta < RANK_FLOOR[next]) needs.push(`θ ${RANK_FLOOR[next]}`);
    return `${RANK_LABEL[next]}: ${needs.join(", ")}`;
  });


  /** Overview, or the skill's Questions tab (SPEC §15.3a). */
  const tab = $derived(page.url.searchParams.get("tab") === "questions" ? "questions" : "overview");
  let listed = $state<QuestionIndexEntry[]>([]);
  $effect(() => {
    const id = entry?.skill.id;
    if (!id) return;
    loadQuestionIndex(fetch, data.course.id).then((all) => (listed = all.filter((q) => q.skill === id).sort((a, b) => a.rating - b.rating)));
  });
  const answered = $derived(store ? answeredIds(store.progress) : new Set<string>());

  const rankOf = (id: string) => (store?.progress.skills[id]?.rank ?? 0) as RankLevel;

  async function start() {
    if (!entry || !store) return;
    if (!skillState) await store.saveSkill(entry.skill.id, toStored(newSkillState(getStartTier(data.course.id))));
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
    <nav class="tabs" aria-label="Skill">
      <a href="?tab=overview" class:on={tab === "overview"} aria-current={tab === "overview" ? "page" : undefined}>Overview</a>
      <a href="?tab=questions" class:on={tab === "questions"} aria-current={tab === "questions" ? "page" : undefined}>Questions <span class="muted">{listed.length}</span></a>
    </nav>
    {#if tab === "questions"}
      {#if listed.length}<QuestionList course={data.course.id} entries={listed} {answered} />{:else}<p class="muted">No questions yet</p>{/if}
    {:else}

    <div class="status">
      <RankDot {rank} label />
      {#if skillState?.resolved}
        <span>Score {score(skillState.theta)}</span>
        <span class="muted">θ {Math.round(skillState.theta)}</span>
      {/if}
      {#if nextGoal}<span class="muted goal">Next: {nextGoal}</span>{/if}
    </div>

    {#if entry.skill.questionCount === 0}
      <p class="muted">No questions yet</p>
      {#if entry.skill.hasTutorial}<p><a class="btn" href="/{data.course.id}/learn/{entry.skill.id}">Learn</a></p>{/if}
    {:else}
      <div class="actions">

        <button class="btn primary" onclick={start}>Practice</button>
        {#if entry.skill.hasTutorial}<a class="btn" href="/{data.course.id}/learn/{entry.skill.id}">Learn</a>{/if}
        {#if skillState}
          <label class="drop"><input type="checkbox" checked={skillState.dropTier} onchange={toggleDrop} /> Easier questions</label>
        {/if}
      </div>
    {/if}

    <nav class="reviews" aria-label="Reviews">
      <span class="label">Review</span>
      <a href="/{data.course.id}/quiz/section/{entry.section.id}">Section quiz</a>
      <a href="/{data.course.id}/quiz/unit/{entry.unit}">Unit {entry.unit} quiz</a>
      <a href="/{data.course.id}/challenge/{entry.section.id}">Section Challenge</a>
    </nav>

    <dl>
      <dt>Size</dt>
      <dd class="size">{entry.skill.size}</dd>
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
  {/if}
</div>

<style>
  .size { text-transform: capitalize; }
  .tabs { display: flex; gap: 18px; margin: 0 0 16px; border-bottom: 1px solid var(--line); font-size: 14px; }
  .tabs a { padding: 6px 0; color: var(--muted); text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tabs a.on { color: var(--ink); border-color: var(--accent); }
  .reviews { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; margin: 18px 0 4px; font-size: 13px; }
  .reviews .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-right: 4px; }
  .reviews a { padding: 3px 10px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); text-decoration: none; background: var(--surface); }
  .reviews a:hover { border-color: var(--accent); color: var(--accent); }
  .back { font-size: 13px; color: var(--muted); text-decoration: none; }
  .back:hover { color: var(--accent); }
  h1 { font-size: 30px; margin: 6px 0 6px; }
  .summary { margin: 0 0 16px; max-width: 62ch; color: var(--muted); }
  .status { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; font-variant-numeric: tabular-nums; }
  .goal { font-size: 13px; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; margin: 20px 0 28px; }
  .drop { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 10px 20px; margin: 0; }
  dt { color: var(--muted); font-size: 13px; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }
  .links { display: flex; flex-direction: column; gap: 4px; }
  .links a { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; }
  .links a:hover { color: var(--accent); }
  @media (max-width: 520px) { dl { grid-template-columns: 1fr; gap: 2px; } dd { margin-bottom: 10px; } }
</style>
