<script lang="ts">
  /**
   * Report an error in a question or tutorial (SPEC §11.4). The report keeps the exact variant and words the
   * student saw, so the owner can open the same problem from the review page.
   */
  import { tierOf } from "@intellectify/engine";
  import type { QuestionT } from "$lib/content";
  import type { WordPicks } from "@intellectify/content/template";
  import { session } from "$lib/session.svelte";

  type Props =
    | { course: string; question: Pick<QuestionT, "id" | "rating">; variant: number | null; words: WordPicks | null; tutorial?: undefined }
    | { course: string; tutorial: string; question?: undefined; variant?: undefined; words?: undefined };
  let { course, question, variant, words, tutorial }: Props = $props();

  const NOTE_MAX = 2000;
  const uid = `report-${Math.random().toString(36).slice(2, 9)}`;
  let dialog = $state<HTMLDialogElement>();
  let note = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  let sent = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function open() {
    error = null;
    dialog?.showModal();
  }

  async function send(e: SubmitEvent) {
    e.preventDefault();
    const user = session.user;
    if (!user || !session.backend || !note.trim() || busy) return;
    busy = true;
    error = null;
    try {
      await session.backend.addReport(user, {
        course,
        kind: question ? "question" : "tutorial",
        target: question ? question.id : tutorial!,
        variant: question ? variant ?? null : null,
        words: question ? (words as Record<string, number> | null) ?? null : null,
        tier: question ? tierOf(question.rating) : null,
        note: note.trim().slice(0, NOTE_MAX),
      });
      dialog?.close();
      note = "";
      sent = true;
      clearTimeout(timer);
      timer = setTimeout(() => (sent = false), 2500);
    } catch {
      error = "Couldn't send the report. Try again.";
    } finally {
      busy = false;
    }
  }
</script>

{#if session.user}
  <span class="report">
    <button type="button" class="btn link" onclick={open} title="Tell us about a mistake here">Report error</button>
    {#if sent}<span class="note" role="status">Thanks, sent</span>{/if}
  </span>

  <dialog bind:this={dialog} class="sheet" aria-labelledby="{uid}-title">
    <form onsubmit={send}>
      <h2 id="{uid}-title">Report an error</h2>
      <label for="{uid}-note" class="muted">What's wrong?</label>
      <!-- svelte-ignore a11y_autofocus -->
      <textarea id="{uid}-note" rows="5" maxlength={NOTE_MAX} required autofocus bind:value={note}></textarea>
      {#if error}<p class="bad" role="alert">{error}</p>{/if}
      <div class="row">
        <button type="button" class="btn" onclick={() => dialog?.close()}>Cancel</button>
        <button class="btn primary" disabled={busy || !note.trim()}>{busy ? "Sending" : "Send"}</button>
      </div>
    </form>
  </dialog>
{/if}

<style>
  .report { display: inline-flex; align-items: center; gap: 8px; }
  .note { font-size: 12px; color: var(--good); }
  .sheet { width: min(440px, calc(100vw - 32px)); box-sizing: border-box; border: 1px solid var(--line); border-radius: 14px; padding: 24px; background: var(--surface); color: var(--ink); box-shadow: 0 16px 48px rgb(0 0 0 / 0.25); }
  .sheet::backdrop { background: rgb(15 20 30 / 0.45); }
  form { display: flex; flex-direction: column; gap: 10px; }
  h2 { margin: 0 0 4px; font-size: 20px; }
  label { font-size: 13px; }
  textarea { font: inherit; font-size: 14px; line-height: 1.5; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; }
  textarea:focus { outline: none; border-color: var(--accent); }
  .row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
  .bad { color: var(--bad); margin: 0; font-size: 13px; }
</style>
