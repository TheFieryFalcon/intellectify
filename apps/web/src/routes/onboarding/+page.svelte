<script lang="ts">
  /** Onboarding placement (SPEC §5.3): the student's current maths mark sets their starting tier. */
  import { goto } from "$app/navigation";
  import { placementTier, type MarkYear } from "@intellectify/engine";
  import { profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";

  const profile = $derived(profileFor(session.backend, session.user));
  let mark = $state<number | null>(null);
  let year = $state<MarkYear | null>(null);
  let saving = $state(false);
  const valid = $derived(mark !== null && mark >= 0 && mark <= 100 && year !== null);
  const tier = $derived(valid ? placementTier(mark!, year!) : null);

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!valid || !profile || tier === null) return;
    saving = true;
    await profile.setPlacement({ mark: mark!, year: year!, tier: tier as 1 | 2 | 3 | 4, at: Date.now() });
    goto("/", { replaceState: true });
  }
</script>

<div class="wrap narrow">
  <form class="card" onsubmit={save}>
    <h1>Your starting level</h1>
    <label for="mark">Most recent maths mark (%)</label>
    <input id="mark" type="number" inputmode="numeric" min="0" max="100" step="1" required bind:value={mark} />
    <fieldset>
      <legend>Year of that mark</legend>
      <div class="years">
        {#each [10, 11, 12] as y (y)}
          <label class="year" class:on={year === y}><input type="radio" name="year" value={y} checked={year === y} onchange={() => (year = y as MarkYear)} />Year {y}</label>
        {/each}
      </div>
    </fieldset>
    {#if tier !== null}<p class="result">Start at <strong>Tier {tier}</strong></p>{/if}
    <button class="btn primary wide" disabled={!valid || saving}>Continue</button>
  </form>
</div>

<style>
  .card { max-width: 380px; margin: 48px auto; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 10px; }
  h1 { margin: 0 0 6px; font-size: 24px; }
  label, legend { font-size: 12px; color: var(--muted); }
  input[type="number"] { font: inherit; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  fieldset { border: 0; padding: 0; margin: 6px 0 0; }
  .years { display: flex; gap: 8px; margin-top: 6px; }
  .year { flex: 1; display: flex; justify-content: center; padding: 8px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; color: var(--ink); font-size: 14px; }
  .year input { position: absolute; opacity: 0; pointer-events: none; }
  .year.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .year:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
  .result { margin: 6px 0 0; font-size: 14px; }
  .wide { width: 100%; margin-top: 6px; }
</style>
