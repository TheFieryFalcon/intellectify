<script lang="ts">
  /**
   * A number that rolls from its old value to the new one over about 600 ms, ease-out (SPEC §13.11).
   * The tooltip shows the final value at once; reduced motion swaps instantly.
   */
  import { lemmasLong, lemmasShort } from "@intellectify/engine";

  let { value }: { value: number } = $props();
  let shown = $state(value);
  let raf = 0;
  const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  $effect(() => {
    const to = value;
    const from = shown;
    cancelAnimationFrame(raf);
    if (reduced() || from === to) {
      shown = to;
      return;
    }
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 600);
      const e = 1 - (1 - k) ** 3;
      shown = from + (to - from) * e;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });
</script>

<span class="count" title={lemmasLong(value)}>{lemmasShort(Math.round(shown)).replace(/ ?∴$/, "")}</span>

<style>
  .count { font-variant-numeric: lining-nums tabular-nums; }
</style>
