<script lang="ts">
  /**
   * Conjectures: the ledger (SPEC §13.11). Proven entries carry a Proved stamp, the student's date and the
   * real prover; the next shows its cost, statement, the Research it would give and Prove; later ones are
   * pencil. The open problem sits below a double rule labeled Open.
   */
  import { conjectureCost, researchRate } from "@intellectify/engine";
  import type { EconomyStore } from "$lib/economy.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";

  let { economy }: { economy: EconomyStore } = $props();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  const list = $derived(cfg.conjectures.list);
  const firstOpen = $derived(list.findIndex((c) => c.proved === null));
  const date = (t: number) => new Date(t).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const nextRate = $derived(s.conjectures < list.length ? researchRate(cfg, s, economy.cardMap, economy.ctx, s.conjectures + 1) : 0);
</script>

<ol class="ledger">
  {#each list as c, i (c.id)}
    {#if i === firstOpen}<li class="open-rule" aria-hidden="true"><span>Open</span></li>{/if}
    {@const cost = conjectureCost(cfg, i)}
    <li class="entry with-margin" class:pencil={i > s.conjectures} class:proven={i < s.conjectures}>
      <div class="main">
        <span class="no num">{i + 1}</span>
        <div>
          <h3>{c.name}</h3>
          {#if i < s.conjectures}
            <p class="meta"><span class="stamp">Proved</span> {s.conjectureDates[i] ? date(s.conjectureDates[i]!) : ""} · <span class="real">{c.proved ?? "Open"}</span></p>
          {:else if i === s.conjectures}
            <p class="meta num"><LemmaAmount value={cost} /> · ×{cfg.conjectures.multiplier} → <LemmaAmount value={nextRate} per="/day" /></p>
            <button class="ink-btn" class:pencil={cost > economy.balance} disabled={cost > economy.balance} onclick={() => economy.proveConjecture()}>Prove · <LemmaAmount value={cost} /></button>
          {:else}
            <p class="meta num"><LemmaAmount value={cost} /></p>
          {/if}
        </div>
      </div>
      <p class="margin">{c.statement}</p>
    </li>
  {/each}
</ol>

<style>
  .ledger { list-style: none; padding: 0; margin: 14px 0; border-left: 1px solid var(--rule); }
  .entry { padding: 10px 0 10px 16px; border-bottom: 1px solid var(--line); }
  .main { display: flex; gap: 14px; align-items: flex-start; }
  .no { font-family: var(--font-display); min-width: 2ch; color: var(--pencil); }
  h3 { margin: 0; font-size: 17px; }
  .entry.pencil h3, .entry.pencil .meta { color: var(--pencil); }
  .meta { margin: 2px 0 6px; font-size: 13px; }
  .stamp { display: inline-block; transform: rotate(-4deg); border: 2px solid var(--gilt); color: var(--gilt); padding: 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 3px; }
  .real { color: var(--pencil); }
  .margin { margin: 4px 0 0; }
  .open-rule { border-top: 3px double var(--rule); margin: 16px 0 4px; padding: 2px 16px; }
  .open-rule span { font-family: var(--font-display); font-variant: small-caps; letter-spacing: 0.08em; color: var(--pencil); }
</style>
