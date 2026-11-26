<script lang="ts">
  /** Onboarding placement (SPEC §5.3): the student's current maths mark sets their starting tier in each course. */
  import { goto } from "$app/navigation";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { placementTiers, type MarkSource } from "@intellectify/engine";
  import { profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";

  const YEARS: { year: 11 | 12; options: { id: MarkSource; label: string }[] }[] = [
    { year: 11, options: [{ id: "y11-methods", label: "Methods" }, { id: "y11-specialist", label: "Specialist" }] },
    { year: 12, options: [{ id: "y12-methods", label: "Methods" }, { id: "y12-specialist", label: "Specialist" }] },
  ];

  const profile = $derived(profileFor(session.backend, session.user));
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mark = $state<number | null>(null);
  let source = $state<MarkSource | null>(null);
  let saving = $state(false);
  const valid = $derived(mark !== null && Number.isFinite(mark) && mark >= 0 && mark <= 100 && source !== null);

  /** Typed marks are clamped to 0–100 and whole numbers. */
  function setMark(v: number) {
    mark = Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : null;
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!profile || !valid || saving) return;
    saving = true;
    const tiers = placementTiers(mark!, source!);
    await profile.setPlacement({ mark: mark!, source: source!, tiers: { ...tiers }, at: Date.now() });
    goto("/", { replaceState: true });
  }
</script>

<div class="wrap narrow">
  <form class="card" onsubmit={save} in:fly={{ y: 12, duration: reduced ? 0 : 320, easing: cubicOut }}>
    <h1>Welcome</h1>

    <div class="field">
      <label for="mark">Most recent maths mark</label>
      <div class="mark">
        <!-- svelte-ignore a11y_autofocus -->
        <input
          id="mark"
          type="number"
          inputmode="numeric"
          min="0"
          max="100"
          step="1"
          placeholder="—"
          autofocus
          value={mark ?? ""}
          oninput={(e) => setMark(e.currentTarget.valueAsNumber)}
        />
        <span class="pct">%</span>
      </div>
      <input
        class="slider"
        class:unset={mark === null}
        type="range"
        min="0"
        max="100"
        step="1"
        aria-label="Mark"
        value={mark ?? 50}
        style="--fill: {mark ?? 0}%"
        oninput={(e) => setMark(e.currentTarget.valueAsNumber)}
      />
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
  label[for="mark"], legend { font-size: 13px; color: var(--muted); padding: 0; margin-bottom: 10px; }
  fieldset legend { float: left; width: 100%; }

  .mark { display: flex; align-items: baseline; gap: 4px; border-bottom: 2px solid var(--line); transition: border-color 0.15s; }
  .mark:focus-within { border-color: var(--accent); }
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
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .mark input::-webkit-inner-spin-button, .mark input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .mark input::placeholder { color: var(--edge); }
  .pct { font-size: 22px; color: var(--muted); }

  .slider { -webkit-appearance: none; appearance: none; width: 100%; height: 22px; background: none; margin: 4px 0 0; cursor: pointer; }
  .slider::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, var(--accent) var(--fill), var(--track) var(--fill)); }
  .slider::-moz-range-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, var(--accent) var(--fill), var(--track) var(--fill)); }
  .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; margin-top: -7px; border-radius: 50%; background: var(--surface); border: 2px solid var(--accent); box-shadow: 0 1px 3px rgb(0 0 0 / 0.15); transition: transform 0.12s; }
  .slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--surface); border: 2px solid var(--accent); }
  .slider:active::-webkit-slider-thumb { transform: scale(1.12); }
  .slider.unset::-webkit-slider-thumb { border-color: var(--edge); }
  .slider.unset::-moz-range-thumb { border-color: var(--edge); }
  .slider:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 4px; }

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
    .source, .slider::-webkit-slider-thumb { transition: none; }
    .spin { animation-duration: 2s; }
  }
</style>
