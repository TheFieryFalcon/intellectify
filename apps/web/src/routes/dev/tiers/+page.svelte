<script lang="ts">
  // Preview of every level tier's badge, gem and celebration (SPEC §12.4).
  import { LEVEL_TIERS, levelProgress, xpForLevel } from "@intellectify/engine";
  import LevelBadge from "$lib/components/LevelBadge.svelte";
  import TierCelebration from "$lib/components/TierCelebration.svelte";
  import TierGem from "$lib/components/TierGem.svelte";

  let shown = $state<(typeof LEVEL_TIERS)[number] | null>(null);
</script>

<div class="wrap narrow">
  <h1>Level tiers</h1>
  <div class="grid">
    {#each LEVEL_TIERS as t (t.key)}
      {@const p = levelProgress(xpForLevel(t.minLevel) + Math.round((xpForLevel(t.minLevel + 1) - xpForLevel(t.minLevel)) * 0.6))}
      <button class="row" onclick={() => (shown = t)}>
        <TierGem tier={t.key} size={34} />
        <span class="name">{t.name}</span>
        <span class="muted">from level {t.minLevel}</span>
        <LevelBadge progress={p} bar />
      </button>
    {/each}
  </div>
  <p class="muted">Select a tier to preview its celebration.</p>
</div>

{#if shown}
  <TierCelebration levelUp={{ level: shown.minLevel, tier: shown, newTier: true }} onclose={() => (shown = null)} />
{/if}

<style>
  h1 { font-size: 28px; }
  .grid { display: flex; flex-direction: column; gap: 6px; }
  .row { all: unset; cursor: pointer; display: grid; grid-template-columns: 60px 120px 1fr auto; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
  .row:hover { border-color: var(--edge); }
  .name { font-weight: 600; }
</style>
