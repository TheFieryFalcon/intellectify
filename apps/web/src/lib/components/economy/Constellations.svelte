<script lang="ts">
  /** The last stage of the archive (SPEC §13.11): one constellation per proven Conjecture, then the void. */
  let { count }: { count: number } = $props();
  // Twelve small figures, each a few stars and the lines between them, in a 100 × 100 sky.
  const FIGURES = [
    [[8, 10], [13, 6], [18, 11], [14, 16]], [[80, 8], [86, 12], [91, 7], [88, 18]], [[30, 30], [36, 26], [42, 31]],
    [[66, 34], [70, 28], [77, 31], [74, 38], [68, 40]], [[12, 50], [18, 46], [22, 54]], [[88, 52], [92, 46], [95, 56]],
    [[40, 66], [46, 62], [52, 68], [48, 74]], [[6, 80], [11, 74], [16, 82]], [[72, 80], [78, 76], [84, 84], [79, 90]],
    [[26, 90], [32, 86], [38, 92]], [[52, 12], [57, 8], [61, 14]], [[56, 46], [60, 42], [64, 48], [60, 54]],
  ];
</script>

<svg class="sky" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  {#each FIGURES.slice(0, count) as f, i (i)}
    <polyline points={f.map((p) => p.join(",")).join(" ")} />
    {#each f as p, j (j)}<circle cx={p[0]} cy={p[1]} r="0.35" />{/each}
  {/each}
</svg>

<style>
  svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  polyline { fill: none; stroke: var(--gilt); stroke-width: 0.08; opacity: 0.5; vector-effect: non-scaling-stroke; }
  circle { fill: var(--ink-archive); }
</style>
