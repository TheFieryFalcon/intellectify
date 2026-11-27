<script lang="ts">
  import { checkGate, gateReady } from "$lib/gate.svelte";
  /**
   * A free-response question (SPEC §6.3): one written answer per rubric part, one submission.
   * Mathematics goes between $…$; the preview renders it as the marker will read it.
   */
  import { tierOf } from "@intellectify/engine";
  import { MAX_ANSWER } from "@intellectify/content/marking";
  import type { QuestionT } from "$lib/content";
  import Markdown from "./Markdown.svelte";
  import MathKeypad from "./MathKeypad.svelte";
  import { insertIntoText, type Key } from "$lib/keypad";
  import { tick } from "svelte";
  import PaperFirst from "./PaperFirst.svelte";
  import PaperTip from "./PaperTip.svelte";
  import { MAX_IMAGES, shrinkPhoto, transcribePhotos } from "$lib/photo";
  import { session } from "$lib/session.svelte";

  let { question, onsubmit, submitted = false }: { question: QuestionT; onsubmit: (answers: Record<string, string>) => void | Promise<void>; submitted?: boolean } = $props();

  const parts = $derived(question.parts.filter((p) => p.rubric));
  const tier = $derived(tierOf(question.rating));
  const points = $derived(parts.reduce((a, p) => a + p.rubric!.criteria.reduce((b, c) => b + c.points, 0), 0));
  let answers = $state<Record<string, string>>({});
  let preview = $state(false);
  /**
   * Photo answers (SPEC §10.5), per part: a tray of pages (camera shots or uploads, in order), read
   * together into text for the student to check. Photos stay on the device until read, then are dropped.
   */
  let photos = $state<Record<string, string[]>>({});
  let reading = $state<Record<string, boolean>>({});
  let photoError = $state<Record<string, string>>({});
  let fromPhoto = $state<Record<string, boolean>>({});

  async function addPhotos(partId: string, e: Event & { currentTarget: HTMLInputElement }) {
    const files = [...(e.currentTarget.files ?? [])];
    e.currentTarget.value = "";
    photoError[partId] = "";
    const room = MAX_IMAGES - (photos[partId]?.length ?? 0);
    if (files.length > room) photoError[partId] = `Up to ${MAX_IMAGES} photos per answer`;
    try {
      const shrunk = await Promise.all(files.slice(0, Math.max(0, room)).map(shrinkPhoto));
      photos[partId] = [...(photos[partId] ?? []), ...shrunk];
    } catch (err) {
      photoError[partId] = (err as Error).message;
    }
  }
  const removePhoto = (partId: string, i: number) => (photos[partId] = (photos[partId] ?? []).filter((_, j) => j !== i));

  async function readPhotos(partId: string) {
    const pages = photos[partId] ?? [];
    if (!pages.length || !session.backend) return;
    reading[partId] = true;
    photoError[partId] = "";
    try {
      const text = await transcribePhotos(session.backend, pages);
      const before = (answers[partId] ?? "").trim();
      answers[partId] = before ? `${before}\n\n${text}` : text;
      fromPhoto[partId] = true;
      photos[partId] = [];
      preview = false;
    } catch (err) {
      photoError[partId] = (err as Error).message;
    } finally {
      reading[partId] = false;
    }
  }

  /** The keypad types into the last answer box used, wrapping mathematics in $ signs (SPEC §7.2). */
  let boxes = $state<Record<string, HTMLTextAreaElement | undefined>>({});
  let activePart = $state<string | null>(null);
  async function press(key: Key) {
    const id = activePart && boxes[activePart] ? activePart : parts[0]?.id;
    const box = id ? boxes[id] : undefined;
    if (!id || !box || box.disabled) return;
    const text = answers[id] ?? "";
    const r = insertIntoText(text, box.selectionStart ?? text.length, box.selectionEnd ?? text.length, key.insert);
    if (r.text.length > MAX_ANSWER) return;
    answers[id] = r.text;
    await tick();
    box.focus();
    box.setSelectionRange(r.caret, r.caret);
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

  // A new question: anonymous accounts past their limit must sign up or log in first (SPEC §2.1a).
  let gateChecked = false;
  $effect(() => {
    if (gateChecked || !gateReady()) return;
    gateChecked = true;
    checkGate();
  });
</script>

<article class="question">
  <div class="meta">
    <span class="tier">Tier {tier}</span>
    <span class="muted">Rating {question.rating}</span>
    <span class="muted">Written · {points} point{points === 1 ? "" : "s"}</span>
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
              {#if (answers[p.id] ?? "").trim()}<Markdown text={answers[p.id]!} glossary={false} />{:else}<p class="muted">—</p>{/if}
            </div>
          {:else}
            <textarea
              bind:this={boxes[p.id]}
              onfocus={() => (activePart = p.id)}
              bind:value={answers[p.id]}
              rows="8"
              maxlength={MAX_ANSWER}
              placeholder="Your working. Use the maths keypad, or put maths between $ signs"
              aria-label="Answer{parts.length > 1 ? ` to part ${p.id}` : ''}"
              disabled={sending}
            ></textarea>
            {#if (answers[p.id] ?? "").includes("$")}
              <!-- Mathematics as it will read, so the keypad's LaTeX never has to be read raw. -->
              <div class="live" aria-hidden="true"><Markdown text={answers[p.id]!} glossary={false} /></div>
            {/if}
            {#if photos[p.id]?.length}
              <div class="tray">
                {#each photos[p.id] as img, i (img)}
                  <figure class="page">
                    <img src={img} alt="Page {i + 1}" />
                    <button type="button" class="remove" aria-label="Remove page {i + 1}" disabled={reading[p.id]} onclick={() => removePhoto(p.id, i)}>×</button>
                    <figcaption>{i + 1}</figcaption>
                  </figure>
                {/each}
                <button type="button" class="btn primary read" disabled={reading[p.id] || sending} onclick={() => readPhotos(p.id)}>
                  {reading[p.id] ? "Reading" : `Read ${photos[p.id]!.length} photo${photos[p.id]!.length === 1 ? "" : "s"}`}
                </button>
              </div>
            {/if}
            <div class="under">
              <label class="photo btn link">
                <input type="file" accept="image/*" capture="environment" disabled={reading[p.id] || sending} onchange={(e) => addPhotos(p.id, e)} />
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5.5 H4.6 L5.8 3.8 H10.2 L11.4 5.5 H14 V12.6 H2 Z" /><circle cx="8" cy="8.9" r="2.3" /></svg>
                Take photo
              </label>
              <label class="photo btn link">
                <input type="file" accept="image/*" multiple disabled={reading[p.id] || sending} onchange={(e) => addPhotos(p.id, e)} />
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 11 V3 M4.8 6.2 L8 3 L11.2 6.2 M2.5 10.5 V13 H13.5 V10.5" /></svg>
                Upload
              </label>
              {#if fromPhoto[p.id] && !reading[p.id]}<span class="from-photo">From photo · check it</span>{/if}
              {#if photoError[p.id]}<span class="photo-error" role="status">{photoError[p.id]}</span>{/if}
              <span class="count muted">{(answers[p.id] ?? "").length} / {MAX_ANSWER}</span>
            </div>
          {/if}
        </div>
      </div>
    {/each}

    {#if !submitted && !preview}<MathKeypad oninsert={press} />{/if}

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
  .under { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .count { font-size: 11px; margin-left: auto; }
  .photo { position: relative; gap: 5px; }
  .photo input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .photo svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linejoin: round; }
  .tray { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .page { position: relative; margin: 0; width: 64px; height: 84px; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; background: var(--bg); }
  .page img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .page figcaption { position: absolute; left: 4px; bottom: 3px; font-size: 10px; font-weight: 600; color: #fff; background: rgba(15, 22, 35, 0.6); border-radius: 3px; padding: 0 4px; }
  .page .remove { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border: 0; border-radius: 50%; background: rgba(15, 22, 35, 0.6); color: #fff; font-size: 12px; line-height: 18px; cursor: pointer; padding: 0; }
  .read { padding: 6px 12px; font-size: 13px; }
  .photo:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
  .from-photo { font-size: 12px; color: var(--accent); font-weight: 500; }
  .photo-error { font-size: 12px; color: var(--bad); }
  .actions { display: flex; gap: 8px; }
  .live { margin-top: 8px; padding: 8px 12px; border-left: 3px solid var(--accent-soft); font-size: 15px; color: var(--ink); max-height: 220px; overflow-y: auto; }
  .live :global(p) { margin: 0 0 6px; }
  .live :global(p:last-child) { margin-bottom: 0; }
</style>
