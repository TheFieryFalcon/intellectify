<script lang="ts">
  /** Onboarding placement (SPEC §5.3): the student's current maths mark sets their starting tier in each course. */
  import { goto } from "$app/navigation";
  import { placementTiers, type MarkSource } from "@intellectify/engine";
  import { profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";

  const SOURCES: { id: MarkSource; label: string }[] = [
    { id: "y10", label: "Year 10" },
    { id: "y11-methods", label: "Year 11 Methods" },
    { id: "y11-specialist", label: "Year 11 Specialist" },
    { id: "y12-methods", label: "Year 12 Methods" },
    { id: "y12-specialist", label: "Year 12 Specialist" },
  ];

  const profile = $derived(profileFor(session.backend, session.user));
  let mark = $state<number | null>(null);
  let source = $state<MarkSource | null>(null);
  let saving = $state(false);
  const valid = $derived(mark !== null && mark >= 0 && mark <= 100 && source !== null);
  const tiers = $derived(valid ? placementTiers(mark!, source!) : null);

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!profile || !tiers) return;
    saving = true;
    await profile.setPlacement({ mark: mark!, source: source!, tiers: { ...tiers }, at: Date.now() });
    goto("/", { replaceState: true });
  }
</script>

<div class="wrap narrow">
  <form class="card" onsubmit={save}>
    <h1>Your starting level</h1>
    <label for="mark">Most recent maths mark (%)</label>
    <input id="mark" type="number" inputmode="numeric" min="0" max="100" step="1" required bind:value={mark} />
    <fieldset>
      <legend>Mark from</legend>
      <div class="sources">
        {#each SOURCES as s (s.id)}
          <label class="source" class:on={source === s.id} class:full={s.id === "y10"}>
            <input type="radio" name="source" value={s.id} checked={source === s.id} onchange={() => (source = s.id)} />{s.label}
          </label>
        {/each}
      </div>
    </fieldset>
    {#if tiers}
      <dl class="result">
        <dt>Specialist</dt><dd>Tier {tiers.specialist}</dd>
        <dt>Methods</dt><dd>Tier {tiers.methods}</dd>
      </dl>
    {/if}
    <button class="btn primary wide" disabled={!valid || saving}>Continue</button>
  </form>
</div>

<style>
  .card { max-width: 400px; margin: 48px auto; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 10px; }
  h1 { margin: 0 0 6px; font-size: 24px; }
  label, legend { font-size: 12px; color: var(--muted); }
  input[type="number"] { font: inherit; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  fieldset { border: 0; padding: 0; margin: 6px 0 0; }
  .sources { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
  .source { position: relative; display: flex; justify-content: center; text-align: center; padding: 8px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; color: var(--ink); font-size: 14px; }
  .source.full { grid-column: 1 / -1; }
  .source input { position: absolute; opacity: 0; pointer-events: none; }
  .source.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .source:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
  .result { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; margin: 6px 0 0; font-size: 14px; }
  .result dt { color: var(--muted); }
  .result dd { margin: 0; font-weight: 600; }
  .wide { width: 100%; margin-top: 6px; }
</style>
