<script lang="ts">
  /** A Section Challenge grade: green circle, yellow square, red triangle, black diamond (shape and color). */
  import type { Slope } from "@intellectify/content/reviews";
  let { slope, label = false }: { slope: Slope; label?: boolean } = $props();
  const NAME = { green: "Green", yellow: "Yellow", red: "Red", black: "Black" } as const;
</script>

<span class="slope {slope}" title="{NAME[slope]} problem">
  <svg viewBox="0 0 12 12" aria-hidden="true">
    {#if slope === "green"}<circle cx="6" cy="6" r="5" />
    {:else if slope === "yellow"}<rect x="1.2" y="1.2" width="9.6" height="9.6" rx="1" />
    {:else if slope === "red"}<path d="M6 0.8 L11.4 10.8 L0.6 10.8 Z" />
    {:else}<path d="M6 0.6 L11.4 6 L6 11.4 L0.6 6 Z" />{/if}
  </svg>
  {#if label}<span>{NAME[slope]}</span>{:else}<span class="sr">{NAME[slope]} problem</span>{/if}
</span>

<style>
  .slope { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; vertical-align: middle; }
  svg { width: 12px; height: 12px; }
  .green svg { fill: #2f8a57; }
  .yellow svg { fill: #e0a800; }
  .red svg { fill: #d1453b; }
  .black svg { fill: var(--ink); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
