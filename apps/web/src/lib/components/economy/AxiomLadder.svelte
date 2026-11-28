<script lang="ts">
  /**
   * Axioms (SPEC §13.11): a ladder of 18 in two groups, ZFC and Large cardinals: name, threshold, statement
   * as marginalia, cosmetic and title. Proven inked with the date; reached shows Prove; next shows progress;
   * later are pencil, their cosmetics a silhouette with the condition.
   */
  import type { EconomyStore } from "$lib/economy.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";
  import Title from "./Title.svelte";

  let { economy }: { economy: EconomyStore } = $props();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  const reached = $derived(economy.reached);
  const date = (t: number) => new Date(t).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const groups = $derived([
    { name: "ZFC", list: cfg.axioms.list.slice(0, 9), offset: 0 },
    { name: "Large cardinals", list: cfg.axioms.list.slice(9), offset: 9 },
  ]);
</script>

{#each groups as g (g.name)}
  <h3 class="group pl">{g.name}</h3>
  <ol class="ladder">
    {#each g.list as a, j (a.id)}
      {@const i = g.offset + j}
      {@const proven = i < s.axiomsProven}
      {@const isReached = i < reached}
      <li class="rung with-margin" class:pencil={!isReached} class:inked={proven}>
        <div class="main">
          <span class="in" aria-hidden="true">∈</span>
          <div>
            <h4>{a.name} <span class="at num"><LemmaAmount value={a.at} /></span></h4>
            {#if proven}
              <p class="meta">Proved {s.axiomDates[i] ? date(s.axiomDates[i]!) : ""}</p>
            {:else if isReached}
              <button class="ink-btn" onclick={() => economy.proveAxioms()}>Prove</button>
            {:else if i === reached}
              <p class="meta num"><LemmaAmount value={s.lemmasEarned} /> / <LemmaAmount value={a.at} /></p>
            {/if}
            <p class="unlock">
              {#if proven}{a.cosmetic.name}{:else}<span class="sil">{a.cosmetic.name}</span>{/if}
              {#if a.title} · {#if proven}<Title title={a.title} />{:else}<span class="sil">{a.title}</span>{/if}{/if}
              · +5%
            </p>
          </div>
        </div>
        <p class="margin">{a.statement}</p>
      </li>
    {/each}
  </ol>
{/each}

<style>
  .group { margin: 18px 0 4px; font-size: 15px; }
  .ladder { list-style: none; padding: 0; margin: 0; }
  .rung { padding: 9px 0; border-bottom: 1px solid var(--line); }
  .main { display: flex; gap: 12px; }
  .in { font-family: var(--font-display); font-size: 20px; color: var(--pencil); width: 20px; }
  .inked .in { color: var(--gilt); }
  h4 { margin: 0; font-family: var(--font-display); font-size: 16px; font-variant: small-caps; letter-spacing: 0.04em; }
  .at { font-family: var(--font-body); font-variant: normal; font-size: 12px; color: var(--pencil); margin-left: 6px; letter-spacing: 0; }
  .pencil h4 { color: var(--pencil); }
  .meta { margin: 2px 0; font-size: 13px; }
  .unlock { margin: 3px 0 0; font-size: 12px; color: var(--pencil); }
  .sil { border: 1px dashed var(--pencil); border-radius: 3px; padding: 0 5px; }
  .margin { margin: 4px 0 0; }
</style>
