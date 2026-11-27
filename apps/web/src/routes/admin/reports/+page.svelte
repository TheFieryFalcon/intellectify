<script lang="ts">
  /**
   * Error reports for the owner (SPEC §11.4). Confirming one awards the reporter XP and achievements the
   * next time they open the course; fix the content in the next release.
   */
  import type { Report } from "$lib/backend";
  import { session } from "$lib/session.svelte";
  import { sharePath } from "$lib/share";

  type Status = Report["status"];
  const TABS: { id: Status; label: string }[] = [
    { id: "open", label: "Open" },
    { id: "confirmed", label: "Confirmed" },
    { id: "dismissed", label: "Dismissed" },
  ];

  let admin = $state<boolean | null>(null);
  let reports = $state<Report[] | null>(null);
  let failed = $state(false);
  let tab = $state<Status>("open");
  let busy = $state<string | null>(null);
  const shown = $derived((reports ?? []).filter((r) => r.status === tab));
  const count = (s: Status) => (reports ?? []).filter((r) => r.status === s).length;

  $effect(() => {
    const backend = session.backend;
    if (!backend || !session.user) return;
    backend.isAdmin().then(async (a) => {
      admin = a;
      if (!a) return;
      try {
        reports = await backend.listReports();
      } catch {
        failed = true;
      }
    });
  });

  async function set(r: Report, status: Status) {
    if (!session.backend || busy) return;
    busy = r.id;
    try {
      await session.backend.setReportStatus(r.id, status);
      reports = reports!.map((x) => (x.id === r.id ? { ...x, status } : x));
    } finally {
      busy = null;
    }
  }

  const href = (r: Report) => (r.kind === "tutorial" ? `/${r.course}/learn/${r.target}` : sharePath(r.course, { id: r.target }, r.variant, r.words));
  const when = (t: number) => new Date(t).toLocaleString("en-AU", { timeZone: "Australia/Perth", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
</script>

<div class="wrap narrow">
  <h1>Error reports</h1>
  {#if admin === null}
    <p class="muted">Loading…</p>
  {:else if !admin}
    <p class="muted">Only the owner can see this page</p>
  {:else if failed}
    <p class="muted">Couldn't load the reports</p>
  {:else if !reports}
    <p class="muted">Loading…</p>
  {:else}
    <div class="tabs" role="tablist">
      {#each TABS as t (t.id)}
        <button role="tab" aria-selected={tab === t.id} class:on={tab === t.id} onclick={() => (tab = t.id)}>{t.label} <span class="n">{count(t.id)}</span></button>
      {/each}
    </div>
    {#if !shown.length}
      <p class="muted">None</p>
    {/if}
    {#each shown as r (r.id)}
      <article class="card">
        <p class="what">
          <a href={href(r)} target="_blank" rel="noopener">{r.target}</a>
          <span class="muted">{r.kind === "tutorial" ? "Tutorial" : `Tier ${r.tier ?? "?"}`}{r.variant !== null ? ` · variant ${r.variant}` : ""}</span>
        </p>
        <p class="note">{r.note}</p>
        <div class="foot">
          <span class="muted"><a href="/profile/{r.uid}">{r.name}</a> · {when(r.at)}</span>
          <span class="acts">
            {#if r.status === "open"}
              <button class="btn" disabled={busy === r.id} onclick={() => set(r, "dismissed")}>Dismiss</button>
              <button class="btn primary" disabled={busy === r.id} onclick={() => set(r, "confirmed")}>Confirm</button>
            {:else}
              <button class="btn" disabled={busy === r.id} onclick={() => set(r, "open")}>Reopen</button>
            {/if}
          </span>
        </div>
      </article>
    {/each}
  {/if}
</div>

<style>
  h1 { margin: 0 0 14px; font-size: 26px; }
  .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
  .tabs button { font: inherit; font-size: 13px; border: 0; background: none; padding: 6px 12px; border-radius: 6px; color: var(--muted); cursor: pointer; }
  .tabs button.on { background: var(--region); color: var(--ink); }
  .n { font-variant-numeric: tabular-nums; opacity: 0.7; margin-left: 2px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
  .card + .card { margin-top: 12px; }
  .what { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; font-size: 14px; }
  .what a { font-family: var(--font-mono, monospace); font-size: 13px; word-break: break-all; }
  .what .muted { font-size: 12px; }
  .note { margin: 10px 0 12px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 12px; font-size: 12px; }
  .foot a { color: inherit; }
  .acts { display: flex; gap: 8px; }
</style>
