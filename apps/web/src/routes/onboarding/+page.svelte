<script lang="ts">
  /** Onboarding placement (SPEC §5.3): the student's current maths mark sets their starting tier in each course. */
  import { goto } from "$app/navigation";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { placementTiers, type MarkSource } from "@intellectify/engine";
  import { profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";
  import { loadBannedWords } from "$lib/moderation";
  import { cleanName, NAME_MAX, nameError } from "$lib/names";

  const YEARS: { year: 11 | 12; options: { id: MarkSource; label: string }[] }[] = [
    { year: 11, options: [{ id: "y11-methods", label: "Methods" }, { id: "y11-specialist", label: "Specialist" }] },
    { year: 12, options: [{ id: "y12-methods", label: "Methods" }, { id: "y12-specialist", label: "Specialist" }] },
  ];

  const profile = $derived(profileFor(session.backend, session.user));
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let text = $state("");
  /** The typed mark, if it's a number from 0 to 100 (decimals allowed, rounded). */
  const mark = $derived.by(() => {
    const t = text.trim().replace(/%$/, "");
    if (!/^\d{1,3}(\.\d*)?$/.test(t)) return null;
    const v = Math.round(Number(t));
    return v >= 0 && v <= 100 ? v : null;
  });
  let source = $state<MarkSource | null>(null);
  let saving = $state(false);
  /** Google gives the account's real name, so Google sign-ups choose the name others will see (SPEC §12.3). */
  const needsName = $derived(!!session.user?.google && !profile?.profile.nameSet);
  const needsPlacement = $derived(!profile?.profile.placement?.tiers);
  let name = $state(session.user?.displayName ?? "");
  let banned = $state<string[]>([]);
  $effect(() => void loadBannedWords().then((w) => (banned = w)));
  const nameErr = $derived(needsName ? nameError(name, banned) : null);
  const valid = $derived((!needsName || !nameErr) && (!needsPlacement || (mark !== null && source !== null)));
  const invalid = $derived(text.trim() !== "" && mark === null);


  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!profile || !valid || saving) return;
    saving = true;
    if (needsName) await profile.rename(cleanName(name));
    if (needsPlacement) await profile.setPlacement({ mark: mark!, source: source!, tiers: { ...placementTiers(mark!, source!) }, at: Date.now() });
    goto("/", { replaceState: true });
  }
</script>

<div class="wrap narrow">
  <form class="card" onsubmit={save} in:fly={{ y: 12, duration: reduced ? 0 : 320, easing: cubicOut }}>
    <h1>Welcome</h1>

    {#if needsName}
      <div class="field">
        <label for="name">Display name</label>
        <input id="name" class="name" type="text" autocomplete="nickname" maxlength={NAME_MAX} bind:value={name} aria-invalid={!!nameErr && name.trim() !== ""} />
        {#if nameErr && name.trim() !== ""}<p class="err">{nameErr}</p>{:else}<p class="hint">Shown on leaderboards and in discussions</p>{/if}
      </div>
    {/if}

    {#if needsPlacement}
    <div class="field">
      <label for="mark">Most recent maths mark</label>
      <div class="mark" class:bad={invalid}>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          id="mark"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          maxlength="5"
          placeholder="—"
          autofocus
          bind:value={text}
        />
        <span class="pct">%</span>
      </div>
    </div>

    <fieldset class="field">
      <legend>From</legend>
      <div class="sources" role="radiogroup">
        <label class="source full" class:on={source === "y10"}>
          <input type="radio" name="source" value="y10" checked={source === "y10"} onchange={() => (source = "y10")} />
          Year 10
        </label>
        {#each YEARS as y (y.year)}
          {#each y.options as o (o.id)}
            <label class="source" class:on={source === o.id}>
              <input type="radio" name="source" value={o.id} checked={source === o.id} onchange={() => (source = o.id)} />
              <span class="yr">Year {y.year}</span>{o.label}
            </label>
          {/each}
        {/each}
      </div>
    </fieldset>
    {/if}

    <button class="btn primary go" disabled={!valid || saving}>
      {#if saving}<span class="spin" aria-hidden="true"></span>{/if}
      {saving ? "Setting up" : "Continue"}
    </button>
  </form>
</div>

<style>
  .card {
    max-width: 420px;
    margin: 56px auto;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 32px 28px 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.05);
  }
  h1 { margin: 0; font-size: 28px; }
  .field { display: flex; flex-direction: column; gap: 10px; border: 0; padding: 0; margin: 0; min-width: 0; }
  .name { font: 500 18px var(--font-body); color: var(--ink); background: none; border: 0; border-bottom: 2px solid var(--line); padding: 4px 0 6px; outline: none; }
  .name:focus { border-color: var(--accent); }
  .name[aria-invalid="true"] { border-color: var(--bad); }
  .hint, .err { margin: -4px 0 0; font-size: 12px; }
  .hint { color: var(--muted); }
  .err { color: var(--bad); }
  label[for="name"], label[for="mark"], legend { font-size: 13px; color: var(--muted); padding: 0; margin-bottom: 10px; }
  fieldset legend { float: left; width: 100%; }

  .mark { display: flex; align-items: baseline; gap: 4px; border-bottom: 2px solid var(--line); transition: border-color 0.15s; }
  .mark:focus-within { border-color: var(--accent); }
  .mark.bad, .mark.bad:focus-within { border-color: var(--bad); }
  .mark input {
    flex: 1;
    min-width: 0;
    font: 600 40px/1.1 var(--font-body);
    font-variant-numeric: tabular-nums;
    border: 0;
    background: none;
    color: var(--ink);
    padding: 2px 0 6px;
    outline: none;
  }
  .mark input::placeholder { color: var(--edge); }
  .pct { font-size: 22px; color: var(--muted); }


  .sources { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .source {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-height: 52px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
    color: var(--ink);
    font-size: 15px;
    font-weight: 500;
    transition: border-color 0.15s, background-color 0.15s, color 0.15s, transform 0.1s;
  }
  .source:hover { border-color: var(--edge); }
  .source:active { transform: scale(0.98); }
  .source.full { grid-column: 1 / -1; min-height: 44px; }
  .source input { position: absolute; opacity: 0; pointer-events: none; }
  .yr { font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: 0.02em; }
  .source.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .source.on .yr { color: var(--accent); }
  .source:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }

  .go { width: 100%; justify-content: center; padding: 12px 14px; font-size: 15px; transition: opacity 0.15s, filter 0.15s; }
  .spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .source { transition: none; }
    .spin { animation-duration: 2s; }
  }
</style>
