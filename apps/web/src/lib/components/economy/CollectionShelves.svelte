<script lang="ts">
  /**
   * The collection (SPEC §13.11): one shelf per era. The header shows the era, 14 / 24, foils, and a Complete
   * stamp once finished. Cards are grouped by rarity (Diamond first) and by birth year; uncollected ones are
   * silhouettes with their name, rarity and fields. Read-only on profiles.
   */
  import { RARITIES, type EraDef } from "@intellectify/engine";
  import type { Card } from "$lib/economy.svelte";
  import CardDetail from "./CardDetail.svelte";
  import CardFace from "./CardFace.svelte";

  let { eras, cards, owned, mine = true }: { eras: EraDef[]; cards: Card[]; owned: Record<string, { n: number; foil: boolean }>; mine?: boolean } = $props();
  let open = $state<Card | null>(null);
  const shelf = (era: string) => cards.filter((c) => c.era === era).sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) || a.born - b.born);
</script>

{#each eras as e (e.id)}
  {@const list = shelf(e.id)}
  {@const have = list.filter((c) => (owned[c.id]?.n ?? 0) > 0)}
  {@const complete = list.length > 0 && have.length === list.length}
  <section class="shelf">
    <h3>{e.name} <span class="num count">{have.length} / {list.length}</span>{#if have.some((c) => owned[c.id]?.foil)}<span class="num foils">Foils {have.filter((c) => owned[c.id]?.foil).length}</span>{/if}{#if complete}<span class="stamp frame-{e.id}">Complete</span>{/if}</h3>
    <div class="cards">
      {#each list as c (c.id)}
        {@const o = owned[c.id]}
        <CardFace card={c} foil={!!o?.foil} silhouette={!(o?.n > 0)} count={mine ? (o?.n ?? 0) : 0} onclick={() => (open = c)} />
      {/each}
    </div>
  </section>
{/each}

{#if open}<CardDetail card={open} owned={owned[open.id] ?? null} {mine} onclose={() => (open = null)} />{/if}

<style>
  .shelf { margin: 18px 0; }
  h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; margin: 0 0 8px; font-size: 17px; padding-bottom: 4px; border-bottom: 3px double var(--rule, var(--line)); }
  .count, .foils { font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--muted); }
  .stamp { font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gilt, var(--accent)); border: 2px solid currentColor; border-radius: 3px; padding: 0 6px; transform: rotate(-3deg); }
  .cards { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
