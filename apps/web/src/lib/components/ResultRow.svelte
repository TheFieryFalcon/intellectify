<script lang="ts">
  /**
   * What answering did (SPEC §6.1): outcome, θ and its change, score, rank and XP. Shown after an
   * auto-marked question resolves and under a written answer's mark once it's applied.
   */
  import type { RankLevel } from "@intellectify/engine";
  import RankDot from "./RankDot.svelte";
  import { RANK_LABEL, score } from "$lib/ranks";

  let { outcome, theta, deltaTheta, rankBefore, rankAfter, xp }: { outcome: number; theta: number; deltaTheta: number; rankBefore: number; rankAfter: number; xp: number } = $props();
  const fmtDelta = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d))}`;
</script>

<div class="result-row">
  <div><span class="k">Outcome</span><span class="v">{Math.round(outcome * 100)}%</span></div>
  <div><span class="k">θ</span><span class="v">{Math.round(theta)} <span class:up={deltaTheta >= 0} class:down={deltaTheta < 0}>{fmtDelta(deltaTheta)}</span></span></div>
  <div><span class="k">Score</span><span class="v">{score(theta)}</span></div>
  <div><span class="k">Rank</span><span class="v"><RankDot rank={rankAfter as RankLevel} label /></span></div>
  <div><span class="k">XP</span><span class="v xp">+{xp}</span></div>
</div>
{#if rankAfter > rankBefore}
  <p class="rank-up">Rank up: {RANK_LABEL[rankBefore as RankLevel]} → {RANK_LABEL[rankAfter as RankLevel]}</p>
{:else if rankAfter < rankBefore}
  <p class="muted rank-down">Rank down: {RANK_LABEL[rankBefore as RankLevel]} → {RANK_LABEL[rankAfter as RankLevel]}</p>
{/if}

<style>
  .result-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  @media (max-width: 520px) { .result-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .result-row div { display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .up { color: var(--good); font-size: 13px; }
  .down { color: var(--bad); font-size: 13px; }
  .xp { color: var(--accent); }
  .rank-up { font-weight: 600; color: var(--accent); margin: 10px 0 0; }
  .rank-down { margin: 10px 0 0; }
</style>
