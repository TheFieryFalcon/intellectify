<script lang="ts">
  /** Preview of the full-screen moments and their queue order (SPEC §13.11). */
  import { LEVEL_TIERS } from "@intellectify/engine";
  import { celebrate, toast } from "$lib/celebrations.svelte";
  import { loadEconomyData, type EconomyData } from "$lib/economy.svelte";

  let data = $state<EconomyData | null>(null);
  $effect(() => void loadEconomyData().then((d) => (data = d)));
  const ax = $derived(data?.config.axioms.list ?? []);
  const cj = $derived(data?.config.conjectures.list ?? []);
  const tier = LEVEL_TIERS[6]!;
</script>

<div class="wrap narrow">
  <h1>Celebrations</h1>
  {#if data}
    <div class="btns">
      <button class="btn" onclick={() => celebrate({ kind: "axiom", axioms: [ax[6]!] })}>Axiom (Infinity)</button>
      <button class="btn" onclick={() => celebrate({ kind: "axiom", axioms: ax.slice(2, 5) })}>Prove 3</button>
      <button class="btn" onclick={() => celebrate({ kind: "conjecture", conjecture: cj[5]!, index: 5, rateBefore: 2.1e9, rateAfter: 5.25e9 })}>Conjecture</button>
      <button class="btn" onclick={() => celebrate({ kind: "conjecture", conjecture: cj[11]!, index: 11, rateBefore: 3e20, rateAfter: 7.5e20 })}>P versus NP</button>
      <button class="btn" onclick={() => { celebrate({ kind: "conjecture", conjecture: cj[0]!, index: 0, rateBefore: 2e5, rateAfter: 5e5 }); celebrate({ kind: "axiom", axioms: [ax[9]!] }); celebrate({ kind: "tier", level: tier.minLevel, tier }); }}>Queue: Conjecture, Axiom, tier</button>
      <button class="btn" onclick={() => { toast({ kind: "levelUp", level: 42, tier: LEVEL_TIERS[2]! }); toast({ kind: "achievement", achievement: { id: "P1", name: "Groundwork", tier: "platinum", points: 10, secret: false, criterion: "", rule: { kind: "flag", flag: "x" } } }); toast({ kind: "rankUp", rank: 3, label: "Vector projection: Gold" }); }}>Toasts: level, achievement, rank-up</button>
    </div>
    <p class="muted">Queued moments play smallest first: tier, then Axiom, then Conjecture. Toasts play rank-up, achievement, level-up.</p>
  {/if}
</div>

<style>
  h1 { font-size: 28px; }
  .btns { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
