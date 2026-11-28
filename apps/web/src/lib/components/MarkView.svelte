<script lang="ts">
  /** A marking job's state: waiting, the rubric breakdown, and the one appeal (SPEC §10.1–10.3). */
  import { MAX_ARGUMENT, type MarkResult } from "@intellectify/content/marking";
  import type { MarkingJob } from "$lib/backend";
  import type { MarkingQueue } from "$lib/marking.svelte";
  import { loadByok } from "$lib/byok";
  import Markdown from "./Markdown.svelte";
  import ResultRow from "./ResultRow.svelte";

  let { job, queue }: { job: MarkingJob; queue: MarkingQueue } = $props();

  const busy = $derived(queue.busy === job.id);
  const final = $derived<MarkResult | null>(job.appeal?.result ?? job.result);
  const pct = (s: number) => `${Math.round(s * 100)}%`;
  const label = (id: string) => id.split(".").slice(1).join(".");
  const own = loadByok();
  let argument = $state("");
  let appealing = $state(false);
  let sent = $state(false);

  const when = (t: number) => {
    const s = Math.max(0, Math.round((t - Date.now()) / 1000));
    return s < 60 ? `${s} s` : `${Math.round(s / 60)} min`;
  };

  async function sendAppeal(e: SubmitEvent) {
    e.preventDefault();
    if (!argument.trim()) return;
    sent = true;
    await queue.appeal(job.id, argument.trim());
  }
</script>

<section class="mark">
  {#if job.status === "pending"}
    <div class="waiting" role="status">
      <span class="spin" aria-hidden="true"></span>
      <div>
        <strong>{busy ? "Marking" : "Queued for marking"}</strong>
        {#if !busy && job.attempts > 0}<span class="muted"> · retry in {when(job.nextTryAt)}</span>{/if}
        {#if job.lastError && !busy}<p class="muted small">{job.lastError}</p>{/if}
      </div>
      {#if !busy && job.attempts > 0}<button class="btn quiet" onclick={() => queue.retryNow(job.id)}>Retry now</button>{/if}
    </div>
    {#if !own && job.attempts > 0}<p class="small muted">Free marking is busy. <a href="/settings">Add your own key</a> for instant marking.</p>{/if}
  {:else if job.status === "failed"}
    <p class="bad">Not marked: {job.lastError}</p>
    <button class="btn link" onclick={() => queue.retryNow(job.id)}>Try again</button>
  {:else if final}
    <div class="score">
      <span class="k">Score</span>
      <span class="v">{pct(final.score)}</span>
      {#if job.appeal?.status === "marked" && job.result}<span class="muted small">Appeal: {pct(job.result.score)} → {pct(final.score)}</span>{/if}
    </div>
    <table class="criteria">
      <tbody>
        {#each final.criteria as c (c.id)}
          <tr>
            <td class="pts" class:full={c.awarded === c.points} class:none={c.awarded === 0}>{c.awarded}/{c.points}</td>
            <td>
              <span class="dim">{c.dimension}</span>
              {#if c.feedback}<Markdown text={c.feedback} inline />{:else}<span class="muted">{label(c.id)}</span>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if final.feedback}<div class="overall"><Markdown text={final.feedback} /></div>{/if}
    {#if job.effect}
      {@const e = job.effect}
      <div class="effect"><ResultRow outcome={e.outcome} theta={e.theta} deltaTheta={e.deltaTheta} rankBefore={e.rankBefore} rankAfter={e.rankAfter} xp={e.xp} lemmas={e.lemmas ?? null} /></div>
    {/if}

    {#if job.appeal?.status === "pending"}
      <div class="waiting" role="status"><span class="spin" aria-hidden="true"></span><strong>{busy ? "Re-marking" : "Appeal queued"}</strong></div>
    {:else if job.appeal?.status === "failed"}
      <p class="bad small">Appeal not marked: {job.appeal.lastError}</p>
    {:else if !job.appeal && !sent}
      {#if appealing}
        <form class="appeal" onsubmit={sendAppeal}>
          <label for="arg-{job.id}" class="small muted">Which point is wrong, and why? Point to your original working. Final: up or down.</label>
          <textarea id="arg-{job.id}" bind:value={argument} rows="4" maxlength={MAX_ARGUMENT}></textarea>
          <div class="actions">
            <button class="btn primary" disabled={!argument.trim()}>Appeal</button>
            <button type="button" class="btn quiet" onclick={() => (appealing = false)}>Cancel</button>
          </div>
        </form>
      {:else}
        <button class="btn link appeal-btn" onclick={() => (appealing = true)}>Appeal this score</button>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .mark { display: flex; flex-direction: column; gap: 12px; }
  .waiting { display: flex; align-items: center; gap: 12px; }
  .waiting .btn { margin-left: auto; }
  .spin { width: 16px; height: 16px; flex: none; border-radius: 50%; border: 2px solid var(--accent); border-right-color: transparent; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spin { animation-duration: 2.4s; } }
  .small { font-size: 12px; margin: 2px 0 0; }
  .bad { color: var(--bad); margin: 0; }
  .score { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .criteria { width: 100%; border-collapse: collapse; font-size: 14px; }
  .criteria td { padding: 8px 6px; border-top: 1px solid var(--line); vertical-align: top; }
  .pts { width: 44px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--muted); }
  .pts.full { color: var(--good); }
  .pts.none { color: var(--bad); }
  .dim { display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; margin-right: 6px; }
  .overall { font-size: 14px; }
  .appeal { display: flex; flex-direction: column; gap: 8px; }
  .appeal textarea { font: inherit; font-size: 14px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .actions { display: flex; gap: 8px; }
  .appeal-btn { align-self: flex-start; padding-left: 0; }
  .effect { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
</style>
