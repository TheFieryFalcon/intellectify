<script lang="ts">
  /** A Lemma amount in short SI form, with the long name as its tooltip and accessible name (SPEC §13.1). */
  import { lemmasLong, lemmasShort } from "@intellectify/engine";

  let { value, per = "", sign = false, long = false }: { value: number; per?: string; sign?: boolean; long?: boolean } = $props();
  const short = $derived(`${sign ? "+" : ""}${lemmasShort(value)}${per}`);
  const name = $derived(`${sign ? "plus " : ""}${lemmasLong(value)}${per ? ` ${per.replace("/", "a ")}` : ""}`);
</script>

<span class="lemmas" title={name} aria-label={name}>{long ? name : short}</span>

<style>
  .lemmas { font-variant-numeric: lining-nums tabular-nums; white-space: nowrap; }
</style>
