<script lang="ts">
  /**
   * A free-response question (SPEC §6.3): one written answer per rubric part, one submission.
   * Mathematics goes between $…$; the preview renders it as the marker will read it.
   */
  import { tierOf } from "@intellectify/engine";
  import { MAX_ANSWER } from "@intellectify/content/marking";
  import type { QuestionT } from "$lib/content";
  import Markdown from "./Markdown.svelte";

  let { question, onsubmit, submitted = false }: { question: QuestionT; onsubmit: (answers: Record<string, string>) => void | Promise<void>; submitted?: boolean } = $props();

  const parts = $derived(question.parts.filter((p) => p.rubric));
  const tier = $derived(tierOf(question.rating));
  const points = $derived(parts.reduce((a, p) => a + p.rubric!.criteria.reduce((b, c) => b + c.points, 0), 0));
  let answers = $state<Record<string, string>>({});
  let preview = $state(false);
  let sending = $state(false);
  const ready = $derived(parts.every((p) => (answers[p.id] ?? "").trim().length > 0));

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!ready || sending || submitted) return;
    sending = true;
    await onsubmit(Object.fromEntries(parts.map((p) => [p.id, answers[p.id]!.trim()])));
    sending = false;
  }
</script>

<article class="question">
  <div class="meta">
    <span class="tier">Tier {tier}</span>
    <span class="muted">Rating {question.rating}</span>
    <span class="muted">Written · {points} mark{points === 1 ? "" : "s"}</span>
    {#if question.requiresCalculator}<span class="muted">Calculator</span>{/if}
    <span class="muted right">1 submission</span>
  </div>

  <Markdown text={question.stem} />

  <form onsubmit={submit}>
    {#each parts as p (p.id)}
      <div class="part">
        {#if parts.length > 1}<span class="part-id">({p.id})</span>{/if}
        <div class="part-body">
          {#if p.prompt}<Markdown text={p.prompt} />{/if}
          {#if preview || submitted}
            <div class="preview" aria-live="polite">
              {#if (answers[p.id] ?? "").trim()}<Markdown text={answers[p.id]!} />{:else}<p class="muted">—</p>{/if}
            </div>
          {:else}
            <textarea
              bind:value={answers[p.id]}
              rows="8"
              maxlength={MAX_ANSWER}
              placeholder="Your working. Maths between $ signs, e.g. $N = 7k$"
              aria-label="Answer{parts.length > 1 ? ` to part ${p.id}` : ''}"
              disabled={sending}
            ></textarea>
            <span class="count muted">{(answers[p.id] ?? "").length} / {MAX_ANSWER}</span>
          {/if}
        </div>
      </div>
    {/each}

    {#if !submitted}
      <div class="actions">
        <button class="btn primary" disabled={!ready || sending}>{sending ? "Submitting" : "Submit for marking"}</button>
        <button type="button" class="btn quiet" onclick={() => (preview = !preview)}>{preview ? "Edit" : "Preview"}</button>
      </div>
    {/if}
  </form>
</article>

<style>
  .question { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 12px; margin-bottom: 14px; }
  .tier { font-weight: 600; color: var(--accent); }
  .right { margin-left: auto; }
  form { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
  .part { display: flex; gap: 10px; }
  .part-id { font-weight: 600; padding-top: 2px; }
  .part-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  textarea { font: inherit; font-size: 15px; line-height: 1.5; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; min-height: 140px; }
  textarea:focus { outline: none; border-color: var(--accent); }
  .preview { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: var(--bg); min-height: 60px; }
  .count { font-size: 11px; align-self: flex-end; }
  .actions { display: flex; gap: 8px; }
</style>
