<script lang="ts">
  import type { LevelProgress } from "@intellectify/engine";
  import TierGem from "./TierGem.svelte";

  let { progress, bar = false }: { progress: LevelProgress; bar?: boolean } = $props();
  const key = $derived(progress.tier.key);
  const fancy = $derived(["ruby", "tanzanite", "vibranium", "solarium", "antimatter"].includes(key));
</script>

<span class="badge {key}" class:fancy style="--t: var(--lvl-{key})" title="{progress.tier.name} · {progress.into}/{progress.needed} XP to level {progress.level + 1}">
  <TierGem tier={key} size={11} />
  <span class="lv">Lv {progress.level}</span>
  {#if bar}
    <span class="track" aria-hidden="true"><span class="fill" style="width:{(100 * progress.into) / progress.needed}%"></span></span>
  {/if}
</span>

<style>
  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .track { width: 48px; height: 4px; border-radius: 2px; background: var(--track); overflow: hidden; }
  .fill { display: block; height: 100%; background: var(--t); transition: width 0.6s ease-out; }

  /* High tiers: the level number and bar take on the tier's material */
  .fancy .lv { font-weight: 700; background-clip: text; -webkit-background-clip: text; color: transparent; background-size: 200% 100%; animation: flow 4s linear infinite; }
  .ruby .lv { background-image: linear-gradient(90deg, #b3204f, #ff7aa0, #b3204f); }
  .tanzanite .lv { background-image: linear-gradient(90deg, #4f4fc2, #a9a6ff, #4f4fc2); }
  .vibranium .lv { background-image: linear-gradient(90deg, #6d6896, #d9d5f5, #6d6896); }
  .solarium .lv { background-image: linear-gradient(90deg, #c96a00, #ffd86b, #c96a00); }
  .antimatter .lv { background-image: linear-gradient(90deg, #ff4fd8, #7c4dff, #3ad8ff, #59ffa0, #ff4fd8); }
  .fancy .fill { background-image: linear-gradient(90deg, var(--t), color-mix(in srgb, var(--t) 40%, white), var(--t)); background-size: 200% 100%; animation: flow 3s linear infinite; }
  .antimatter .fill { background-image: linear-gradient(90deg, #ff4fd8, #7c4dff, #3ad8ff, #59ffa0, #ff4fd8); }

  @keyframes flow { from { background-position: 0% 0; } to { background-position: 200% 0; } }
  @media (prefers-reduced-motion: reduce) { .fancy .lv, .fancy .fill { animation: none; } }
</style>
