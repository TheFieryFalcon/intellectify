<script lang="ts">
  /**
   * Discussions (SPEC §13.1): one thread per daily problem, open the whole time. Reached only from here
   * (never from problem screens). Search by date, problem and text.
   */
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { dateOfDay } from "@intellectify/engine";
  import type { ThreadSummary } from "$lib/backend";
  import { loadQuestionIndex, type QuestionIndexEntry } from "$lib/content";
  import { dailyKey, dailyProblem } from "$lib/dailyProblem";
  import { listThreads } from "$lib/discussions";
  import { perthDay } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";
  import type { YearGroup } from "$lib/daily";

  let { data } = $props();
  const today = perthDay();

  let threads = $state<ThreadSummary[] | null>(null);
  let failed = $state(false);
  let index = $state(new Map<string, QuestionIndexEntry>());
  $effect(() => {
    if (!session.backend || threads !== null) return;
    listThreads(session.backend)
      .then((t) => (threads = t.filter((x) => x.course === data.course.id)))
      .catch(() => ((failed = true), (threads = [])));
  });
  $effect(() => void loadQuestionIndex(fetch, data.course.id).then((ix) => (index = new Map(ix.map((q) => [q.id, q])))));

  const get = (k: string) => page.url.searchParams.get(k) ?? "";
  function set(k: string, v: string) {
    const next = new URLSearchParams(page.url.searchParams);
    if (v) next.set(k, v);
    else next.delete(k);
    goto(`?${next}`, { replaceState: true, keepFocus: true, noScroll: true });
  }

  /** Threads for a day that has none yet: today, or a searched date, can still be opened and started. */
  let extra = $state<ThreadSummary[]>([]);
  $effect(() => {
    const day = get("date") && get("date") <= today ? get("date") : today;
    const years: YearGroup[] = [11, 12];
    Promise.all(years.map((y) => dailyProblem(fetch, data.course, day, y).then((d) => ({ y, d })))).then((xs) => {
      extra = xs
        .filter((x) => x.d.served)
        .map(({ y, d }) => ({ key: dailyKey(day, data.course.id, y), day, course: data.course.id, year: y, questionId: d.served!.question.id, posts: 0, updatedAt: 0, text: "" }));
    });
  });

  const rows = $derived.by(() => {
    const have = new Set((threads ?? []).map((t) => t.key));
    const all = [...extra.filter((t) => !have.has(t.key)), ...(threads ?? [])];
    const text = get("q").toLowerCase();
    return all
      .filter(
        (t) =>
          (!get("date") || t.day === get("date")) &&
          (!get("year") || t.year === Number(get("year"))) &&
          (!text || t.text.toLowerCase().includes(text) || (index.get(t.questionId)?.title ?? t.questionId).toLowerCase().includes(text)),
      )
      .sort((a, b) => b.day.localeCompare(a.day) || a.year - b.year);
  });

  const dayLabel = (d: string) => new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(dateOfDay(d));
  const ago = (t: number) => (t ? new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  <h1>Discussions</h1>

  <div class="controls filters">
    <input class="search" type="search" placeholder="Search problems and posts" value={get("q")} oninput={(e) => set("q", e.currentTarget.value)} aria-label="Search" />
    <label>Date <input type="date" max={today} value={get("date")} onchange={(e) => set("date", e.currentTarget.value)} /></label>
    <label>Year <select value={get("year")} onchange={(e) => set("year", e.currentTarget.value)}><option value="">All</option><option value="11">11</option><option value="12">12</option></select></label>
  </div>

  {#if failed}<p class="bad">Couldn't load discussions</p>{/if}
  {#if threads === null}
    <p class="muted">Loading…</p>
  {:else if !rows.length}
    <p class="muted">No discussions match</p>
  {:else}
    <ul class="threads">
      {#each rows as t (t.key)}
        {@const q = index.get(t.questionId)}
        <li>
          <a href="/{data.course.id}/discussions/{t.key}">
            <span class="title">{q?.title ?? t.questionId}</span>
            <span class="meta muted">{dayLabel(t.day)} · Year {t.year}{q ? ` · Tier ${q.tier}` : ""}</span>
            <span class="count" class:none={!t.posts}>{t.posts} post{t.posts === 1 ? "" : "s"}</span>
            {#if t.updatedAt}<span class="when muted">{ago(t.updatedAt)}</span>{/if}
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
  .controls { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin-bottom: 14px; font-size: 13px; color: var(--muted); }
  .controls label { display: flex; align-items: center; gap: 6px; }
  .controls select, .controls input { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; }
  .search { flex: 1 1 200px; max-width: 320px; }
  .threads { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
  .threads li + li { border-top: 1px solid var(--line); }
  .threads a { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; padding: 10px 14px; color: var(--ink); text-decoration: none; }
  .threads a:hover { background: var(--region); }
  .title { font-weight: 500; }
  .meta { font-size: 12px; grid-column: 1; }
  .count { grid-column: 2; grid-row: 1; font-size: 13px; text-align: right; }
  .count.none { color: var(--muted); }
  .when { grid-column: 2; grid-row: 2; font-size: 12px; text-align: right; }
  .bad { color: var(--bad); }
</style>
