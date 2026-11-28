<script lang="ts">
  /** One past answer from the local history (SPEC §16.4b): the question as served, the answers given, and the solution. */
  import Markdown from "./Markdown.svelte";
  import MarkView from "./MarkView.svelte";
  import { loadIndexedQuestion, loadQuestionIndex, loadWords, type QuestionT } from "$lib/content";
  import type { HistoryEntry } from "$lib/history";
  import { reserve } from "$lib/practice";
  import { markingFor } from "$lib/marking.svelte";
  import { session } from "$lib/session.svelte";

  let { entry, solution = true }: { entry: HistoryEntry; solution?: boolean } = $props();

  const marking = $derived(markingFor(session.backend, session.user));
  const job = $derived(entry.jobId && marking ? marking.job(entry.jobId) : null);

  let q = $state<QuestionT | null | undefined>(undefined);
  $effect(() => {
    const e = entry;
    q = undefined;
    Promise.all([loadQuestionIndex(fetch, e.course), loadWords(fetch)])
      .then(([index]) => {
        const hit = index.find((x) => x.id === e.questionId);
        return hit ? loadIndexedQuestion(fetch, e.course, hit) : null;
      })
      .then((full) => {
        if (e === entry) q = full ? reserve(full, e.variant, e.words).question : null;
      });
  });

  /** An answer as the student gave it: option text for choices, typeset math otherwise. */
  function shown(part: QuestionT["parts"][number], given: string): string {
    if (!given) return "";
    if (part.answer?.type === "mcq" || part.answer?.type === "multi-select")
      return given
        .split(",")
        .map((id) => part.options?.find((o) => o.id === id)?.text ?? id)
        .join("; ");
    if (part.answer?.type === "features") {
      const lines = given.split("\n");
      return part.answer.features.map((f, j) => `${f.label}: ${lines[j] === "none" || !lines[j] ? "None" : "$" + lines[j] + "$"}`).join("  \n");
    }
    return "$" + given + "$";
  }
</script>

{#if q === undefined}
  <p class="muted">Loading…</p>
{:else if q === null}
  <p class="muted">This question is no longer in the course</p>
{:else}
  <div class="past">
    <Markdown text={q.stem} />
    {#each q.parts as p, i (p.id)}
      {@const given = entry.answers[i] ?? ""}
      {@const solved = entry.solvedOn?.[i] ?? null}
      <div class="part">
        {#if q.parts.length > 1}<span class="pid">({p.id})</span>{/if}
        <div class="body">
          {#if p.prompt}<Markdown text={p.prompt} />{/if}
          <div class="given" class:good={entry.solvedOn && solved !== null} class:bad={entry.solvedOn && solved === null}>
            <span class="k">Your answer</span>
            {#if given}<Markdown text={entry.jobId ? given : shown(p, given)} glossary={false} />{:else}<span class="muted">—</span>{/if}
            {#if entry.solvedOn}<span class="verdict">{solved !== null ? (solved > 1 ? `Correct on attempt ${solved}` : "Correct") : "Not solved"}</span>{/if}
          </div>
        </div>
      </div>
    {/each}
    {#if entry.jobId}
      {#if job && marking}<MarkView {job} queue={marking} />{:else}<p class="muted small">Score not available in this browser</p>{/if}
    {/if}
    {#if solution}
      <h3>Solution</h3>
      <Markdown text={q.solution} />
    {/if}
  </div>
{/if}

<style>
  .past { display: flex; flex-direction: column; gap: 10px; }
  .part { display: flex; gap: 10px; }
  .pid { font-weight: 600; padding-top: 2px; }
  .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .given { border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
  .given.good { border-color: var(--good); }
  .given.bad { border-color: var(--bad); }
  .k { font-size: 11px; color: var(--muted); }
  .verdict { font-size: 12px; }
  .good .verdict { color: var(--good); }
  .bad .verdict { color: var(--bad); }
  .small { font-size: 12px; }
  h3 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 8px 0 0; }
</style>
