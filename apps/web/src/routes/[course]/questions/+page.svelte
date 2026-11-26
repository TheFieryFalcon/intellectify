<script lang="ts">
  /**
   * Every question in the course (SPEC §15.3a): filter, sort and group, with solutions a click away.
   * Filters live in the URL, so a view can be bookmarked or shared.
   */
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import QuestionList from "$lib/components/QuestionList.svelte";
  import { indexSkills, loadQuestionIndex, type QuestionIndexEntry } from "$lib/content";
  import { answeredIds } from "$lib/practice";
  import { courseProgress } from "$lib/session.svelte";

  let { data } = $props();
  const store = $derived(courseProgress(data.course.id));
  const answered = $derived(store ? answeredIds(store.progress) : new Set<string>());
  const skills = $derived(indexSkills(data.course));
  const skillName = (id: string) => skills.get(id)?.skill.name ?? id;
  const sections = $derived(data.course.units.flatMap((u) => u.sections.map((s) => ({ id: s.id, name: s.name, unit: u.number, year: u.year }))));

  let all = $state<QuestionIndexEntry[]>([]);
  $effect(() => void loadQuestionIndex(fetch, data.course.id).then((q) => (all = q)));

  const p = $derived(page.url.searchParams);
  const get = (k: string) => p.get(k) ?? "";
  function set(k: string, v: string) {
    const next = new URLSearchParams(page.url.searchParams);
    if (v) next.set(k, v);
    else next.delete(k);
    goto(`?${next}`, { replaceState: true, keepFocus: true, noScroll: true });
  }

  const tags = $derived([...new Set(all.flatMap((q) => q.tags))].sort());
  const POOLS: [string, string][] = [["practice", "Practice"], ["section-quiz", "Section quiz"], ["unit-quiz", "Unit quiz"], ["challenge", "Challenge"]];

  const filtered = $derived.by(() => {
    const text = get("q").toLowerCase();
    return all.filter(
      (q) =>
        (!get("tier") || q.tier === Number(get("tier"))) &&
        (!get("kind") || q.kind === get("kind")) &&
        (!get("tag") || q.tags.includes(get("tag"))) &&
        (!get("skill") || q.skills.includes(get("skill"))) &&
        (!get("section") || q.section === get("section")) &&
        (!get("unit") || q.unit === Number(get("unit"))) &&
        (!get("year") || q.year === Number(get("year"))) &&
        (!get("pool") || q.pool === get("pool")) &&
        (!get("later") || q.later === (get("later") === "yes")) &&
        (!get("answered") || answered.has(q.id) === (get("answered") === "yes")) &&
        (!text || q.title.toLowerCase().includes(text) || skillName(q.skill).toLowerCase().includes(text)),
    );
  });

  const sorted = $derived.by(() => {
    const by = get("sort") || "easy";
    const xs = [...filtered];
    if (by === "easy") xs.sort((a, b) => a.rating - b.rating);
    else if (by === "hard") xs.sort((a, b) => b.rating - a.rating);
    else if (by === "name") xs.sort((a, b) => a.title.localeCompare(b.title));
    else if (by === "tag") xs.sort((a, b) => (a.tags[0] ?? "").localeCompare(b.tags[0] ?? "") || a.rating - b.rating);
    return xs;
  });

  /** Groups in a sensible order; a question with several tags or skills appears under each. */
  const groups = $derived.by((): { key: string; label: string; items: QuestionIndexEntry[] }[] => {
    const by = get("group");
    if (!by) return [{ key: "all", label: "", items: sorted }];
    const keyed = new Map<string, QuestionIndexEntry[]>();
    const add = (k: string, q: QuestionIndexEntry) => keyed.set(k, [...(keyed.get(k) ?? []), q]);
    for (const q of sorted) {
      if (by === "tier") add(`Tier ${q.tier}`, q);
      else if (by === "tag") q.tags.forEach((t) => add(t, q));
      else if (by === "skill") q.skills.forEach((s) => add(skillName(s), q));
      else if (by === "section") add(sections.find((s) => s.id === q.section)?.name ?? q.section, q);
      else if (by === "answered") add(answered.has(q.id) ? "Answered" : "Not answered", q);
    }
    return [...keyed.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([k, items]) => ({ key: k, label: k, items }));
  });
</script>

<div class="wrap">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  <h1>Questions <span class="count muted">{filtered.length} of {all.length}</span></h1>

  <div class="controls">
    <input class="search" type="search" placeholder="Search" value={get("q")} oninput={(e) => set("q", e.currentTarget.value)} aria-label="Search questions" />
    <label>Tier <select value={get("tier")} onchange={(e) => set("tier", e.currentTarget.value)}><option value="">All</option>{#each [1, 2, 3, 4, 5, 6] as t (t)}<option value={String(t)}>{t}</option>{/each}</select></label>
    <label>Type <select value={get("kind")} onchange={(e) => set("kind", e.currentTarget.value)}><option value="">All</option><option value="auto">Auto-marked</option><option value="written">Written</option></select></label>
    <label>Tag <select value={get("tag")} onchange={(e) => set("tag", e.currentTarget.value)}><option value="">All</option>{#each tags as t (t)}<option value={t}>{t}</option>{/each}</select></label>
    <label>Year <select value={get("year")} onchange={(e) => set("year", e.currentTarget.value)}><option value="">All</option><option value="11">11</option><option value="12">12</option></select></label>
    <label>Unit <select value={get("unit")} onchange={(e) => set("unit", e.currentTarget.value)}><option value="">All</option>{#each data.course.units as u (u.number)}<option value={String(u.number)}>{u.number}</option>{/each}</select></label>
    <label>Section <select value={get("section")} onchange={(e) => set("section", e.currentTarget.value)}><option value="">All</option>{#each sections as s (s.id)}<option value={s.id}>{s.name}</option>{/each}</select></label>
    <label>Skill <select value={get("skill")} onchange={(e) => set("skill", e.currentTarget.value)}><option value="">All</option>{#each [...skills.values()] as k (k.skill.id)}<option value={k.skill.id}>{k.skill.name}</option>{/each}</select></label>
    <label>Pool <select value={get("pool")} onchange={(e) => set("pool", e.currentTarget.value)}><option value="">All</option>{#each POOLS as [v, l] (v)}<option value={v}>{l}</option>{/each}</select></label>
    <label>Later units <select value={get("later")} onchange={(e) => set("later", e.currentTarget.value)}><option value="">Any</option><option value="yes">Needed</option><option value="no">Not needed</option></select></label>
    <label>Answered <select value={get("answered")} onchange={(e) => set("answered", e.currentTarget.value)}><option value="">Any</option><option value="yes">Yes</option><option value="no">No</option></select></label>
    <label>Sort <select value={get("sort") || "easy"} onchange={(e) => set("sort", e.currentTarget.value)}><option value="easy">Easiest first</option><option value="hard">Hardest first</option><option value="name">Name</option><option value="tag">Tag</option></select></label>
    <label>Group <select value={get("group")} onchange={(e) => set("group", e.currentTarget.value)}><option value="">None</option><option value="tier">Tier</option><option value="tag">Tag</option><option value="skill">Skill</option><option value="section">Section</option><option value="answered">Answered</option></select></label>
    {#if [...p.keys()].length}<button class="btn quiet" onclick={() => goto("?", { replaceState: true, noScroll: true })}>Clear</button>{/if}
  </div>

  {#if !all.length}
    <p class="muted">Loading…</p>
  {:else if !filtered.length}
    <p class="muted">No questions match</p>
  {:else}
    {#each groups as g (g.key)}
      {#if g.label}<h2>{g.label} <span class="muted">{g.items.length}</span></h2>{/if}
      <QuestionList course={data.course.id} entries={g.items.slice(0, 300)} {skillName} {answered} />
      {#if g.items.length > 300}<p class="muted small">Showing 300 of {g.items.length}: narrow the filters to see the rest</p>{/if}
    {/each}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; }
  .crumbs a { color: var(--muted); text-decoration: none; }
  h1 { margin: 0 0 12px; font-size: 26px; }
  .count { font-family: var(--font-body); font-size: 14px; font-weight: 400; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin-bottom: 16px; font-size: 13px; color: var(--muted); }
  .controls label { display: flex; align-items: center; gap: 6px; }
  .controls select, .search { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; max-width: 200px; }
  .search { min-width: 180px; flex: 1 1 180px; max-width: 280px; }
  h2 { font-family: var(--font-body); font-size: 13px; font-weight: 600; margin: 18px 0 8px; text-transform: capitalize; }
  .small { font-size: 12px; }
</style>
