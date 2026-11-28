<script lang="ts">
  /**
   * A list of questions (SPEC §16.3a): tier, name, type and tags, with the question and its solution a
   * click away. Used by a skill's Questions tab and the course's Questions page.
   */
  import Markdown from "./Markdown.svelte";
  import ShareButton from "./ShareButton.svelte";
  import ReportButton from "./ReportButton.svelte";
  import { loadIndexedQuestion, loadWords, wordLists, type QuestionIndexEntry, type QuestionT } from "$lib/content";
  import { fillServed, pickWords, type WordPicks } from "@intellectify/content/template";

  let {
    course,
    entries,
    skillName = undefined,
    answered = new Set<string>(),
  }: { course: string; entries: QuestionIndexEntry[]; skillName?: (id: string) => string; answered?: ReadonlySet<string> } = $props();

  let open = $state<string | null>(null);
  let shown = $state<QuestionT | null>(null);
  let loading = $state(false);
  let shownVariant = $state<number | null>(null);
  let shownWords = $state<WordPicks | null>(null);

  async function toggle(e: QuestionIndexEntry) {
    if (open === e.id) {
      open = null;
      return;
    }
    open = e.id;
    shown = null;
    loading = true;
    const [q] = await Promise.all([loadIndexedQuestion(fetch, course, e), loadWords(fetch)]);
    // The first variant, with the first word of each list: a stable version to read.
    shownVariant = q?.variants?.length ? 0 : null;
    shownWords = q ? pickWords(q.words, wordLists(), () => 0) : null;
    shown = q ? fillServed(q, shownVariant, shownWords, wordLists()) : null;
    loading = false;
  }

  const POOL: Record<string, string> = { practice: "", "section-quiz": "Section quiz", "unit-quiz": "Unit quiz", challenge: "Challenge" };
</script>

<ul class="qlist">
  {#each entries as e (e.id)}
    <li class:open={open === e.id}>
      <button class="row" class:two={!!skillName} onclick={() => toggle(e)} aria-expanded={open === e.id}>
        <span class="tier t{e.tier}">T{e.tier}</span>
        <span class="title">{e.title}</span>
        {#if skillName}<span class="skill muted">{skillName(e.skill)}{e.subsection ? ` · ${e.subsection}` : ""}</span>{/if}
        <span class="meta muted">
          {!skillName && e.subsection ? `${e.subsection} · ` : ""}{e.kind === "written" ? "Written" : e.answerTypes.join(", ")}
          {#if POOL[e.pool]} · {POOL[e.pool]}{/if}
          {#if e.later} · Later unit{/if}
          {#if answered.has(e.id)} · <span class="done">Answered</span>{/if}
        </span>
        <span class="rating muted">{e.rating}</span>
      </button>
      {#if open === e.id}
        <div class="body">
          {#if loading}
            <p class="muted">Loading…</p>
          {:else if shown}
            <div class="tags">{#each e.tags as t (t)}<span class="tag">{t}</span>{/each}</div>
            <Markdown text={shown.stem} />
            {#each shown.parts as p (p.id)}
              {#if p.prompt}<div class="part"><span class="pid">({p.id})</span> <Markdown text={p.prompt} inline /></div>{/if}
            {/each}
            <h3>Solution</h3>
            <Markdown text={shown.solution} />
            <p class="row-actions">
              {#if e.pool === "practice"}<a class="btn" href="/{course}/practice/{e.skill}?q={e.id}">Practice this</a>{/if}
              <span class="tools"><ShareButton {course} question={shown} variant={shownVariant} words={shownWords} /><ReportButton {course} question={shown} variant={shownVariant} words={shownWords} /></span>
            </p>
          {/if}
        </div>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .qlist { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
  li + li { border-top: 1px solid var(--line); }
  .row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 4px 12px; width: 100%; padding: 9px 14px; background: none; border: 0; text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
  .row:hover { background: var(--region); }
  .row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .title { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .skill { grid-column: 2; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { font-size: 12px; text-align: right; }
  .rating { font-size: 12px; font-variant-numeric: tabular-nums; min-width: 3.5ch; text-align: right; }
  .row .tier { grid-column: 1; grid-row: 1; }
  .row .title { grid-column: 2; grid-row: 1; }
  .row .meta { grid-column: 3; grid-row: 1; }
  .row .rating { grid-column: 4; grid-row: 1; }
  .row .skill { grid-row: 2; }
  .row.two .meta, .row.two .rating { grid-row: 1 / 3; }
  .done { color: var(--good); }
  .tier { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: var(--region); color: var(--muted); font-variant-numeric: tabular-nums; }
  .tier.t3, .tier.t4 { color: var(--accent); }
  .tier.t5, .tier.t6 { background: var(--accent-soft); color: var(--accent); }
  .body { padding: 4px 16px 16px; border-top: 1px dashed var(--line); }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
  .tag { font-size: 11px; padding: 2px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); }
  .part { margin: 6px 0; }
  .pid { color: var(--muted); }
  .row-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  h3 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 16px 0 6px; }
  @media (max-width: 560px) {
    .row { grid-template-columns: auto minmax(0, 1fr) auto; }
    .row .rating, .row.two .rating { grid-column: 3; grid-row: 1; }
    .row .skill { grid-column: 2 / 4; grid-row: 2; }
    .row .meta { grid-column: 2 / 4; grid-row: 2; text-align: left; }
    .row.two .meta { grid-column: 2 / 4; grid-row: 3; }
  }
</style>
