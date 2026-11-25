<script lang="ts">
  import type { LevelProgress } from "@intellectify/engine";

  let { progress, bar = false }: { progress: LevelProgress; bar?: boolean } = $props();
</script>

<span class="badge" style="--t: var(--lvl-{progress.tier.key})" title="{progress.tier.name} · {progress.into}/{progress.needed} XP to level {progress.level + 1}">
  <span class="gem"></span>
  <span class="lv">Lv {progress.level}</span>
  {#if bar}
    <span class="track" aria-hidden="true"><span class="fill" style="width:{(100 * progress.into) / progress.needed}%"></span></span>
  {/if}
</span>

<style>
  .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .gem { width: 11px; height: 11px; transform: rotate(45deg); border-radius: 2px; background: var(--t); flex: none; }
  .track { width: 48px; height: 4px; border-radius: 2px; background: var(--track); overflow: hidden; }
  .fill { display: block; height: 100%; background: var(--t); }
</style>
