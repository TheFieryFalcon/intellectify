<script lang="ts">
  /**
   * The hub summary (SPEC §13.11): Since last visit, balance, Research, the Time Warp meter, the next Axiom
   * (or Prove), the buy amount and Multipliers.
   */
  import { corollaryParts, globalMultipliers, instituteOutput, researchMultipliers, sourceMultipliers, staffBoost, type BuyAmount, type LemmaSource } from "@intellectify/engine";
  import type { EconomyStore } from "$lib/economy.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";
  import Sheet from "./Sheet.svelte";
  import { nextAxiom } from "@intellectify/engine";

  let { economy, amount = $bindable() }: { economy: EconomyStore; amount: BuyAmount } = $props();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  const since = $derived.by(() => {
    const v = economy.visitStart;
    if (!v) return null;
    const earned = s.lemmasEarned - v.earned;
    const hours = s.researchHours - v.researchHours;
    return earned >= 1 ? { earned, hours } : null;
  });
  const next = $derived(nextAxiom(cfg, s));
  let panel = $state(false);
  const fmt = (f: number) => `×${f >= 100 ? Math.round(f).toLocaleString("en-US") : f.toFixed(f >= 10 ? 1 : 3).replace(/0+$/, "").replace(/\.$/, "")}`;
  const ctx = $derived(economy.ctx);
  const SOURCES: [LemmaSource, string][] = [["question", "Resolved questions"], ["quiz", "Quiz and Challenge bonuses"], ["daily", "Daily problem"], ["rankUp", "Rank-ups"], ["achievement", "Achievements"], ["other", "Everything else"]];
  const cor = $derived(corollaryParts(cfg, s, ctx));
</script>

<section class="summary" aria-label="Summary">
  {#if since}
    <p class="since">Since last visit: <LemmaAmount value={since.earned} sign />{#if since.hours}, Research {since.hours} h{/if}</p>
  {/if}
  <div class="row">
    <span class="bal num"><LemmaAmount value={economy.balance} /></span>
    {#if s.lemmasEarned >= cfg.tabs.research || economy.rate > 0}<span class="chip">Research <LemmaAmount value={economy.rate} per="/day" /></span>{/if}
    <span class="warp" title="Every {cfg.timeWarp.xp} XP credits {cfg.timeWarp.hours} hours of Research">
      Time Warp <span class="num">{Math.round(s.warpXp)} / {cfg.timeWarp.xp} XP</span>
      <span class="meter" aria-hidden="true"><span style="width:{(100 * s.warpXp) / cfg.timeWarp.xp}%"></span></span>
    </span>
    {#if next}
      {#if next.reached}
        <button class="ink-btn prove" onclick={() => economy.proveAxioms()}>{next.toProve > 1 ? `Prove ${next.toProve}` : `Prove ${next.axiom.name}`}</button>
      {:else}
        <span class="axiom">{next.axiom.name} <span class="num"><LemmaAmount value={s.lemmasEarned} /> / <LemmaAmount value={next.axiom.at} /></span></span>
      {/if}
    {/if}
    <span class="amount" role="radiogroup" aria-label="Buy amount">
      {#each [1, 10, "max"] as const as a (a)}
        <button role="radio" aria-checked={amount === a} class:on={amount === a} onclick={() => (amount = a)}>{a === "max" ? "Max" : `×${a}`}</button>
      {/each}
    </span>
    <button class="btn link" onclick={() => (panel = true)}>Multipliers</button>
  </div>
</section>

{#if panel}
  <Sheet label="Multipliers" onclose={() => (panel = false)}>
    <h2>Multipliers</h2>
    <h3>Practice</h3>
    <dl>
      {#each SOURCES as [src, name] (src)}
        {@const ms = [...sourceMultipliers(s, src, ctx), ...globalMultipliers(cfg, s, ctx)]}
        <dt>{name}</dt><dd>{ms.length ? ms.map((m) => `${m.label} ${fmt(m.factor)}`).join(", ") : "—"}{#if ms.length}<strong> = {fmt(ms.reduce((t, m) => t * m.factor, 1))}</strong>{/if}</dd>
      {/each}
      {#if s.theorems.successor}<dt>Successor Function</dt><dd>+{2 * (s.theorems.successor ?? 0)} ∴ per question, before multipliers</dd>{/if}
    </dl>
    <h3>Corollaries</h3>
    <dl>
      <dt>Achievements</dt><dd>+{(cor.achievements * 100).toFixed(1).replace(/\.0$/, "")}%</dd>
      <dt>Level tiers</dt><dd>+{Math.round(cor.tiers * 100)}%</dd>
      <dt>Era sets</dt><dd>+{Math.round(cor.eraSets * 100)}%</dd>
      <dt>Axioms</dt><dd>+{Math.round(s.axiomsProven * cfg.axioms.bonus * 100)}%</dd>
    </dl>
    <h3>Research</h3>
    <dl>
      {#each cfg.eras.filter((e) => (s.institutes[e.id] ?? 0) > 0) as e (e.id)}
        <dt>{e.institute.name}</dt><dd>Staff +{Math.round(staffBoost(cfg, s, e.id, economy.cardMap) * 100)}%, <LemmaAmount value={instituteOutput(cfg, s, e, economy.cardMap)} per="/day" /></dd>
      {/each}
      {#each [...researchMultipliers(cfg, s), ...globalMultipliers(cfg, s, ctx)] as m (m.label)}<dt>{m.label}</dt><dd>{fmt(m.factor)}</dd>{/each}
      <dt>Total</dt><dd><strong><LemmaAmount value={economy.rate} per="/day" /></strong></dd>
    </dl>
  </Sheet>
{/if}

<style>
  .summary { padding: 12px 0; border-bottom: 3px double var(--rule); }
  .since { margin: 0 0 6px; font-family: var(--font-display); font-style: italic; color: var(--pencil); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; }
  .bal { font-family: var(--font-display); font-size: 26px; font-weight: 600; }
  .chip { font-size: 13px; border: 1px solid var(--rule); border-radius: 999px; padding: 2px 10px; }
  .warp { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
  .meter { width: 60px; height: 3px; background: color-mix(in srgb, var(--pencil) 35%, transparent); display: inline-block; }
  .meter span { display: block; height: 100%; background: var(--ink-archive); }
  .axiom { font-size: 13px; }
  .amount { display: inline-flex; border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; }
  .amount button { font: inherit; font-size: 12px; border: 0; background: none; color: var(--ink-archive); padding: 3px 9px; cursor: pointer; }
  .amount button.on { background: var(--ink-archive); color: var(--paper); }
  h2 { margin: 0 0 10px; }
  h3 { font-family: var(--font-body); font-size: 13px; margin: 14px 0 6px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; margin: 0; font-size: 13px; }
  dt { color: var(--muted); }
  dd { margin: 0; font-variant-numeric: lining-nums tabular-nums; }
</style>
