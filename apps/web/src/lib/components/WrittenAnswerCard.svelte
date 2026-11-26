<script lang="ts">
  /**
   * A free-response question (SPEC §6.3): one written answer per rubric part, one submission.
   * Mathematics goes between $…$; the preview renders it as the marker will read it.
   */
  import { tierOf } from "@intellectify/engine";
  import { MAX_ANSWER } from "@intellectify/content/marking";
  import type { QuestionT } from "$lib/content";
  import Markdown from "./Markdown.svelte";
  import PaperFirst from "./PaperFirst.svelte";
  import PaperTip from "./PaperTip.svelte";
  import { shrinkPhoto, transcribePhoto } from "$lib/photo";
  import { session } from "$lib/session.svelte";

  let { question, onsubmit, submitted = false }: { question: QuestionT; onsubmit: (answers: Record<string, string>) => void | Promise<void>; submitted?: boolean } = $props();

  const parts = $derived(question.parts.filter((p) => p.rubric));
  const tier = $derived(tierOf(question.rating));
  const points = $derived(parts.reduce((a, p) => a + p.rubric!.criteria.reduce((b, c) => b + c.points, 0), 0));
  let answers = $state<Record<string, string>>({});
  let preview = $state(false);
  /** Photo answers (SPEC §10.5): per part, reading in progress, an error, or text that came from a photo. */
  let reading = $state<Record<string, boolean>>({});
  let photoError = $state<Record<string, string>>({});
  let fromPhoto = $state<Record<string, boolean>>({});

  async function usePhoto(partId: string, e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file || !session.backend) return;
    reading[partId] = true;
    photoError[partId] = "";
    try {
      const text = await transcribePhoto(session.backend, await shrinkPhoto(file));
      const before = (answers[partId] ?? "").trim();
      answers[partId] = before ? `${before}\n\n${text}` : text;
      fromPhoto[partId] = true;
      preview = false;
    } catch (err) {
      photoError[partId] = (err as Error).message;
    } finally {
      reading[partId] = false;
    }
  }
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
    <PaperFirst />
    <span class="muted right">1 submission</span>
  </div>
  <PaperTip written />

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
            <div class="under">
              <label class="photo btn quiet" class:busy={reading[p.id]}>
                <input type="file" accept="image/*" capture="environment" disabled={reading[p.id] || sending} onchange={(e) => usePhoto(p.id, e)} />
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5.5 H4.6 L5.8 3.8 H10.2 L11.4 5.5 H14 V12.6 H2 Z" /><circle cx="8" cy="8.9" r="2.3" /></svg>
                {reading[p.id] ? "Reading photo" : "Photo"}
              </label>
              {#if fromPhoto[p.id] && !reading[p.id]}<span class="from-photo">From photo · check it</span>{/if}
              {#if photoError[p.id]}<span class="photo-error" role="status">{photoError[p.id]}</span>{/if}
              <span class="count muted">{(answers[p.id] ?? "").length} / {MAX_ANSWER}</span>
            </div>
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
  .under { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .count { font-size: 11px; margin-left: auto; }
  .photo { position: relative; padding: 4px 8px; font-size: 13px; gap: 5px; }
  .photo input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .photo svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linejoin: round; }
  .photo.busy { opacity: 0.6; }
  .photo:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
  .from-photo { font-size: 12px; color: var(--accent); font-weight: 500; }
  .photo-error { font-size: 12px; color: var(--bad); }
  .actions { display: flex; gap: 8px; }
</style>
