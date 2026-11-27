<script lang="ts">
  /** Answer history (SPEC §15.4b): every answer given in this browser, newest first. Local only. */
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import PastAnswer from "$lib/components/PastAnswer.svelte";
  import { indexSkills, loadQuestionIndex, type QuestionIndexEntry } from "$lib/content";
  import { clearHistory, listHistory, type HistoryEntry, type HistoryMode } from "$lib/history";
  import { markingFor } from "$lib/marking.svelte";
  import { session } from "$lib/session.svelte";

  let { data } = $props();
  const skills = $derived(indexSkills(data.course));
  const marking = $derived(markingFor(session.backend, session.user));

  let entries = $state<HistoryEntry[]>([]);
  let titles = $state(new Map<string, QuestionIndexEntry>());
  $effect(() => {
    entries = listHistory(data.course.id);
    loadQuestionIndex(fetch, data.course.id).then((ix) => (titles = new Map(ix.map((q) => [q.id, q]))));
  });

  const get = (k: string) => page.url.searchParams.get(k) ?? "";
  function set(k: string, v: string) {
    const next = new URLSearchParams(page.url.searchParams);
    if (v) next.set(k, v);
    else next.delete(k);
    goto(`?${next}`, { replaceState: true, keepFocus: true, noScroll: true });
  }

  const MODES: [HistoryMode, string][] = [["practice", "Practice"], ["quiz", "Quiz"], ["challenge", "Challenge"], ["daily", "Daily"], ["revision", "Revision"], ["shared", "Shared"]];
  const modeLabel = (m: HistoryMode) => MODES.find(([v]) => v === m)?.[1] ?? m;

  /** 0–1 for a resolved answer; null while a written answer waits for marking. */
  function outcomeOf(e: HistoryEntry): number | null {
    if (!e.jobId) return e.outcome;
    const j = marking?.job(e.jobId);
    const r = j?.appeal?.result ?? j?.result;
    return r ? r.score : null;
  }

  const shown = $derived(
    entries.filter((e) => {
      const o = outcomeOf(e);
      return (
        (!get("skill") || e.skill === get("skill")) &&
        (!get("mode") || e.mode === get("mode")) &&
        (!get("result") || (get("result") === "right" ? o !== null && o >= 0.6 : get("result") === "wrong" ? o !== null && o < 0.6 : o === null))
      );
    }),
  );
  const days = $derived.by(() => {
    const out: { day: string; items: HistoryEntry[] }[] = [];
    for (const e of shown) {
      const day = new Date(e.at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      if (out.at(-1)?.day !== day) out.push({ day, items: [] });
      out.at(-1)!.items.push(e);
    }
    return out;
  });

  let open = $state<string | null>(null);
  const time = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const pct = (o: number | null) => (o === null ? "Marking" : `${Math.round(o * 100)}%`);

  function clear() {
    if (!confirm("Clear your answer history in this browser?")) return;
    clearHistory(data.course.id);
    entries = [];
  }
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  <h1>History <span class="count muted">{shown.length}</span></h1>
  <p class="muted small">Saved in this browser only</p>

  <div class="controls filters">
    <label>Skill <select value={get("skill")} onchange={(e) => set("skill", e.currentTarget.value)}><option value="">All</option>{#each [...skills.values()] as k (k.skill.id)}<option value={k.skill.id}>{k.skill.name}</option>{/each}</select></label>
    <label>Mode <select value={get("mode")} onchange={(e) => set("mode", e.currentTarget.value)}><option value="">All</option>{#each MODES as [v, l] (v)}<option value={v}>{l}</option>{/each}</select></label>
    <label>Result <select value={get("result")} onchange={(e) => set("result", e.currentTarget.value)}><option value="">Any</option><option value="right">60% or more</option><option value="wrong">Under 60%</option><option value="pending">Marking</option></select></label>
    {#if entries.length}<button class="btn link clear" onclick={clear}>Clear history</button>{/if}
  </div>

  {#if !shown.length}
    <p class="muted">{entries.length ? "No answers match" : "No answers yet"}</p>
  {/if}
  {#each days as d (d.day)}
    <h2>{d.day}</h2>
    <ul class="list">
      {#each d.items as e (e.id)}
        {@const ix = titles.get(e.questionId)}
        {@const o = outcomeOf(e)}
        <li>
          <button class="row" onclick={() => (open = open === e.id ? null : e.id)} aria-expanded={open === e.id}>
            <span class="time muted">{time(e.at)}</span>
            <span class="title">{ix?.title ?? e.questionId}</span>
            <span class="meta muted">{skills.get(e.skill)?.skill.name ?? e.skill} · {modeLabel(e.mode)}{ix ? ` · T${ix.tier}` : ""}</span>
            <span class="score" class:good={o !== null && o >= 0.6} class:bad={o !== null && o < 0.6}>{pct(o)}</span>
          </button>
          {#if open === e.id}<div class="body"><PastAnswer entry={e} /></div>{/if}
        </li>
      {/each}
    </ul>
  {/each}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; }
  .crumbs a { color: var(--muted); text-decoration: none; }
  h1 { margin: 0 0 2px; font-size: 26px; }
  .count { font-family: var(--font-body); font-size: 14px; font-weight: 400; }
  .small { font-size: 12px; margin: 0 0 12px; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin-bottom: 8px; font-size: 13px; color: var(--muted); }
  .controls label { display: flex; align-items: center; gap: 6px; }
  .controls select { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; max-width: 220px; }
  .clear { margin-left: auto; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--muted); margin: 18px 0 6px; }
  .list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
  li + li { border-top: 1px solid var(--line); }
  .row { display: grid; grid-template-columns: 6ch minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; width: 100%; padding: 9px 14px; background: none; border: 0; text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
  .row:hover { background: var(--region); }
  .time { font-size: 12px; font-variant-numeric: tabular-nums; }
  .title { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { grid-column: 2; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .score { grid-column: 3; grid-row: 1 / 3; font-size: 13px; font-variant-numeric: tabular-nums; color: var(--muted); }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .body { padding: 12px 16px 16px; border-top: 1px dashed var(--line); }
</style>
