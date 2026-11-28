<script lang="ts">
  /**
   * What answering did (SPEC §6.1, §13.11): outcome, θ and its change, score, rank, XP and Lemmas. Shown after
   * an auto-marked question resolves and under a written answer's mark once it's applied. While it shows, a
   * level-tier celebration waits (it plays after Next, or when the screen is left).
   */
  import type { RankLevel } from "@intellectify/engine";
  import { onMount } from "svelte";
  import RankDot from "./RankDot.svelte";
  import { RANK_LABEL, score } from "$lib/ranks";
  import { hold } from "$lib/celebrations.svelte";
  import { answerLemmas } from "$lib/economy.svelte";
  import { currentEconomy } from "$lib/profile.svelte";
  import LemmaAmount from "./economy/LemmaAmount.svelte";

  let { outcome, theta, deltaTheta, rankBefore, rankAfter, xp, lemmas }: { outcome: number; theta: number; deltaTheta: number; rankBefore: number; rankAfter: number; xp: number; lemmas?: number | null } = $props();
  const fmtDelta = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d))}`;
  const economy = currentEconomy();
  // The answer just recorded, unless a stored amount was passed (a written answer's mark, shown later).
  const live = lemmas === undefined ? answerLemmas.current : null;
  const total = $derived(lemmas ?? live?.parts.reduce((t, p) => t + p.lemmas, 0) ?? 0);
  const show = $derived(economy?.visible !== false && (total > 0 || !!live?.warp));
  const breakdown = $derived(
    (live?.parts ?? [])
      .filter((p) => p.lemmas > 0)
      .map((p) => [`${p.xp} XP${p.flat ? ` + ${p.flat} (Successor Function)` : ""}`, ...p.multipliers.map((m) => `× ${m.factor.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} ${m.label}`), `= ${p.lemmas} ∴`].join(" "))
      .join("\n"),
  );
  onMount(() => {
    hold.count++;
    return () => void (hold.count = Math.max(0, hold.count - 1));
  });
</script>

<div class="result-row" class:lemmas={show}>
  <div><span class="k">Outcome</span><span class="v">{Math.round(outcome * 100)}%</span></div>
  <div><span class="k">θ</span><span class="v">{Math.round(theta)} <span class:up={deltaTheta >= 0} class:down={deltaTheta < 0}>{fmtDelta(deltaTheta)}</span></span></div>
  <div><span class="k">Score</span><span class="v">{score(theta)}</span></div>
  <div><span class="k">Rank</span><span class="v"><RankDot rank={rankAfter as RankLevel} label /></span></div>
  <div><span class="k">{show ? "Earned" : "XP"}</span><span class="v xp">+{xp}{show ? " XP" : ""}{#if show} · <button type="button" class="chip" title={breakdown || undefined}><LemmaAmount value={total} sign /></button>{/if}</span></div>
</div>
{#if show && live?.warp}
  <p class="warp">Time Warp +{live.warp.hours} h · <LemmaAmount value={live.warp.lemmas} sign /></p>
{/if}
{#if rankAfter > rankBefore}
  <p class="rank-up">Rank up: {RANK_LABEL[rankBefore as RankLevel]} → {RANK_LABEL[rankAfter as RankLevel]}</p>
{:else if rankAfter < rankBefore}
  <p class="muted rank-down">Rank down: {RANK_LABEL[rankBefore as RankLevel]} → {RANK_LABEL[rankAfter as RankLevel]}</p>
{/if}

<style>
  .result-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  .result-row.lemmas { grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1.6fr); }
  @media (max-width: 520px) { .result-row, .result-row.lemmas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .result-row div { display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .up { color: var(--good); font-size: 13px; }
  .down { color: var(--bad); font-size: 13px; }
  .xp { color: var(--accent); white-space: nowrap; }
  .chip { font: inherit; color: var(--ink); background: none; border: 0; padding: 0; cursor: help; }
  .chip:focus-visible { outline: 2px solid var(--accent); border-radius: 4px; }
  .warp { margin: 8px 0 0; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .rank-up { font-weight: 600; color: var(--accent); margin: 10px 0 0; }
  .rank-down { margin: 10px 0 0; }
</style>
