<script lang="ts">
  import type { RankLevel } from "@intellectify/engine";
  import { RANK_LABEL, rankKey } from "$lib/ranks";

  let { rank, label = false }: { rank: RankLevel; label?: boolean } = $props();
</script>

<span class="rank" style="--r: var(--{rankKey(rank)}); --hi: var(--{rankKey(rank)}-hi, var(--{rankKey(rank)}))">
  <span class="dot" class:unranked={rank === 0}></span>{#if label}<span>{RANK_LABEL[rank]}</span>{/if}
</span>

<style>
  .rank { display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(160deg, var(--hi) -30%, var(--r) 55%); flex: none; }
  .dot.unranked { background: var(--unranked); box-shadow: inset 0 0 0 1.5px var(--edge); }
</style>
