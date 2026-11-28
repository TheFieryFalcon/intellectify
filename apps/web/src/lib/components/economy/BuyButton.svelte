<script lang="ts">
  /** A buy button for one item at the chosen amount (SPEC §13.11): inked when affordable, pencil (with its price) when not. */
  import { buyQuote, type BuyAmount } from "@intellectify/engine";
  import LemmaAmount from "./LemmaAmount.svelte";

  let { base, growth, level, budget, amount, maxLevel = Infinity, disabled = false, onbuy }: { base: number; growth: number; level: number; budget: number; amount: BuyAmount; maxLevel?: number; disabled?: boolean; onbuy: (amount: BuyAmount) => void } = $props();
  const q = $derived(buyQuote(base, growth, level, budget, amount, maxLevel));
  const maxed = $derived(level >= maxLevel);
</script>

{#if maxed}
  <span class="pl">Max level</span>
{:else}
  <button class="ink-btn" class:pencil={!q.affordable || disabled} disabled={!q.affordable || disabled} onclick={() => onbuy(amount)} title={amount === "max" ? "Max (M)" : undefined}>
    {amount === "max" ? `Max (${q.count})` : `×${amount}`} <LemmaAmount value={q.cost} />
  </button>
{/if}
