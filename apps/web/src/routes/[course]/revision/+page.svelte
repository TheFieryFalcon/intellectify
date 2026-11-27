<script lang="ts">
  /** Revision (SPEC §8.6): Exam Revision at two levels, or Custom Revision with any filters. */
  import { loadQuestionIndex, type QuestionIndexEntry } from "$lib/content";
  import { candidates, specToParams, parseScope, type ExamLevel, type RevisionSpec } from "$lib/revision";

  let { data } = $props();

  let index = $state<QuestionIndexEntry[]>([]);
  $effect(() => void loadQuestionIndex(fetch, data.course.id).then((ix) => (index = ix)));

  // Only places that have questions are offered.
  const has = (f: (e: QuestionIndexEntry) => boolean) => index.some(f);
  const units = $derived(data.course.units.filter((u) => has((e) => e.unit === u.number)));
  const sections = $derived(data.course.units.flatMap((u) => u.sections).filter((s) => has((e) => e.section === s.id)));
  const skills = $derived(data.course.units.flatMap((u) => u.sections.flatMap((s) => s.skills)).filter((k) => has((e) => e.skills.includes(k.id))));
  const tags = $derived([...new Set(index.flatMap((e) => e.tags))].sort());

  let examLevel = $state<ExamLevel>("easy");
  let examScope = $state("course");
  let examKind = $state<"" | "auto" | "written">("");

  let scope = $state("course");
  let tiers = $state<number[]>([]);
  let kind = $state<"" | "auto" | "written">("");
  let picked = $state<string[]>([]);
  let later = $state(false);

  const examSpec = $derived<RevisionSpec>({ mode: "exam", scope: parseScope(examScope), level: examLevel, tiers: [], kind: examKind, tags: [], later: false });
  const customSpec = $derived<RevisionSpec>({ mode: "custom", scope: parseScope(scope), level: "easy", tiers: [...tiers].sort(), kind, tags: picked, later });
  const examCount = $derived(candidates(index, examSpec).length);
  const customCount = $derived(candidates(index, customSpec).length);
  const href = (s: RevisionSpec) => `/${data.course.id}/revision/run?${specToParams(s)}`;
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
</script>

{#snippet scopeSelect(value: string, set: (v: string) => void)}
  <select {value} onchange={(e) => set(e.currentTarget.value)}>
    <option value="course">Whole course</option>
    <optgroup label="Units">{#each units as u (u.number)}<option value="unit:{u.number}">Unit {u.number}</option>{/each}</optgroup>
    <optgroup label="Sections">{#each sections as s (s.id)}<option value="section:{s.id}">{s.name}</option>{/each}</optgroup>
    <optgroup label="Skills">{#each skills as k (k.id)}<option value="skill:{k.id}">{k.name}</option>{/each}</optgroup>
  </select>
{/snippet}

{#snippet typeSelect(value: string, set: (v: "" | "auto" | "written") => void)}
  <select {value} onchange={(e) => set(e.currentTarget.value as "" | "auto" | "written")}>
    <option value="">Any</option><option value="auto">Auto-marked</option><option value="written">Written</option>
  </select>
{/snippet}

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  <h1>Revision</h1>

  <section class="card">
    <h2>Exam revision</h2>
    <div class="levels" role="radiogroup" aria-label="Level">
      {#each [["easy", "Easy", "Tiers 2 and 3"], ["hard", "Hard", "Tiers 3 and 4"]] as const as [v, label, meta] (v)}
        <label class="level" class:on={examLevel === v}>
          <input type="radio" name="level" value={v} checked={examLevel === v} onchange={() => (examLevel = v)} />
          <span class="name">{label}</span><span class="muted small">{meta} · half each</span>
        </label>
      {/each}
    </div>
    <div class="row">
      <label>Scope {@render scopeSelect(examScope, (v) => (examScope = v))}</label>
      <label>Type {@render typeSelect(examKind, (v) => (examKind = v))}</label>
    </div>
    <div class="go">
      <span class="muted small">{examCount} questions</span>
      <a class="btn primary" class:disabled={!examCount} aria-disabled={!examCount} href={examCount ? href(examSpec) : undefined}>Start</a>
    </div>
  </section>

  <section class="card">
    <h2>Custom revision</h2>
    <div class="row">
      <label>Scope {@render scopeSelect(scope, (v) => (scope = v))}</label>
      <label>Type {@render typeSelect(kind, (v) => (kind = v))}</label>
    </div>
    <fieldset>
      <legend>Tiers <span class="muted small">{tiers.length ? "" : "· any"}</span></legend>
      <div class="chips">
        {#each [1, 2, 3, 4, 5, 6] as t (t)}
          <label class="chip" class:on={tiers.includes(t)}><input type="checkbox" checked={tiers.includes(t)} onchange={() => (tiers = toggle(tiers, t))} />T{t}</label>
        {/each}
      </div>
    </fieldset>
    <fieldset>
      <legend>Tags <span class="muted small">{picked.length ? "· any of these" : "· any"}</span></legend>
      <div class="chips">
        {#each tags as t (t)}
          <label class="chip" class:on={picked.includes(t)}><input type="checkbox" checked={picked.includes(t)} onchange={() => (picked = toggle(picked, t))} />{t}</label>
        {/each}
      </div>
    </fieldset>
    <label class="check"><input type="checkbox" bind:checked={later} /> Include questions that need later units</label>
    <div class="go">
      <span class="muted small">{customCount} questions</span>
      <a class="btn primary" class:disabled={!customCount} aria-disabled={!customCount} href={customCount ? href(customSpec) : undefined}>Start</a>
    </div>
  </section>
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; }
  .crumbs a { color: var(--muted); text-decoration: none; }
  h1 { margin: 0 0 16px; font-size: 26px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 14px; }
  h2 { margin: 0; font-size: 18px; }
  .levels { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .level { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; cursor: pointer; }
  .level.on { border-color: var(--accent); background: var(--accent-soft); }
  .level input { position: absolute; opacity: 0; pointer-events: none; }
  .level:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
  .name { font-weight: 600; }
  .row { display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 13px; color: var(--muted); }
  .row label { display: flex; align-items: center; gap: 6px; }
  select { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; max-width: 260px; }
  fieldset { border: 0; margin: 0; padding: 0; }
  legend { font-size: 13px; color: var(--muted); margin-bottom: 6px; padding: 0; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { font-size: 13px; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; cursor: pointer; text-transform: capitalize; }
  .chip.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .chip input { position: absolute; opacity: 0; pointer-events: none; }
  .chip:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
  .check { font-size: 13px; display: flex; gap: 8px; align-items: center; }
  .go { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
  .small { font-size: 12px; }
  .disabled { opacity: 0.5; pointer-events: none; }
</style>
