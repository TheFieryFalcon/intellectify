<script lang="ts">
  /**
   * Research: institutes and staff (SPEC §13.11). One row per institute in era order, with its staff strip.
   * Clicking a slot opens a picker of the era's owned cards, sorted by boost; nothing fills a slot by itself.
   */
  import { cardBoost, copiesOf, eraUnlocked, globalMultipliers, instituteOutput, nextSlotAt, RARITIES, RARITY_NAME, researchMultipliers, staffBoost, staffSlots, type BuyAmount } from "@intellectify/engine";
  import { portraitUrl, type EconomyStore } from "$lib/economy.svelte";
  import BuyButton from "./BuyButton.svelte";
  import CardFace from "./CardFace.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";
  import { buildLabel } from "$lib/cosmetics";
  import Sheet from "./Sheet.svelte";

  let { economy, amount }: { economy: EconomyStore; amount: BuyAmount } = $props();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  const mult = $derived([...researchMultipliers(cfg, s), ...globalMultipliers(cfg, s, economy.ctx)].reduce((t, m) => t * m.factor, 1));
  let picking = $state<{ era: string; slot: number } | null>(null);
  const owned = (era: string) =>
    economy
      .cardsOf(era)
      .filter((c) => (s.cards[c.id]?.n ?? 0) > 0)
      .map((c) => ({ card: c, foil: !!s.cards[c.id]?.foil, boost: cardBoost(cfg, c.rarity, !!s.cards[c.id]?.foil) }))
      .sort((a, b) => b.boost - a.boost || RARITIES.indexOf(a.card.rarity) - RARITIES.indexOf(b.card.rarity) || a.card.name.localeCompare(b.card.name));
  const pct = (f: number) => `+${Math.round(f * 100)}%`;
</script>

<ol class="rows">
  {#each cfg.eras as e, i (e.id)}
    {@const open = eraUnlocked(cfg, s, e.id)}
    {@const n = copiesOf(s, e.id)}
    {@const slots = staffSlots(cfg, n)}
    <li class="row plate" class:pencil={!open}>
      {#if !open}
        <div class="sealed"><span class="seal" aria-hidden="true">{["I", "II", "III", "IV", "V", "VI", "VII"][i]}</span><div><h3>{e.institute.name}</h3><p class="pl">{e.name} · {buildLabel(cfg.eras[i - 1]!.institute.name)}</p></div></div>
      {:else}
        <div class="head">
          <span class="engr" aria-hidden="true">{["I", "II", "III", "IV", "V", "VI", "VII"][i]}</span>
          <div class="what"><h3>{e.institute.name}</h3><p class="pl">{e.name} · <span class="num">{n}</span> {n === 1 ? "copy" : "copies"}</p></div>
          <div class="out num">
            <span title="Per copy, staff included"><LemmaAmount value={e.institute.output * (1 + staffBoost(cfg, s, e.id, economy.cardMap)) * mult} per="/day" /> each</span>
            <strong><LemmaAmount value={instituteOutput(cfg, s, e, economy.cardMap) * mult} per="/day" /></strong>
          </div>
          <div class="buy"><BuyButton base={e.institute.base} growth={cfg.institutes.growth} level={n} budget={economy.balance} {amount} onbuy={(a) => economy.buyInstitute(e.id, a)} /></div>
        </div>
        {#if n > 0}
          <div class="staff">
            <div class="slots">
              {#each Array.from({ length: slots }, (_, k) => k) as k (k)}
                {@const id = s.staff[e.id]?.[k] ?? null}
                {@const card = id ? economy.cardMap.get(id) : null}
                <button class="slot {card?.rarity ?? 'empty'}" onclick={() => (picking = { era: e.id, slot: k })} aria-label={card ? `Slot ${k + 1}: ${card.name}` : `Slot ${k + 1}: empty`}>
                  {#if card && portraitUrl(card)}<img src={portraitUrl(card)} alt="" loading="lazy" />{:else if card}<span>{card.name.slice(0, 2)}</span>{/if}
                </button>
              {/each}
            </div>
            <span class="num">Staff {pct(staffBoost(cfg, s, e.id, economy.cardMap))}</span>
            {#if nextSlotAt(cfg, n) !== null}<span class="pl">Next slot · copy {nextSlotAt(cfg, n)}</span>{:else}<span class="pl">{slots} / {cfg.staff.maxSlots} slots</span>{/if}
          </div>
        {/if}
      {/if}
    </li>
  {/each}
</ol>

{#if picking}
  {@const p = picking}
  {@const current = s.staff[p.era]?.[p.slot] ?? null}
  <Sheet label="Choose staff" onclose={() => (picking = null)}>
    <h2>Slot {p.slot + 1}</h2>
    {#if current}<button class="btn" onclick={() => { economy.setStaff(p.era, p.slot, null); picking = null; }}>Remove</button>{/if}
    <ul class="pick">
      {#each owned(p.era) as o (o.card.id)}
        {@const where = (s.staff[p.era] ?? []).indexOf(o.card.id)}
        <li>
          <button onclick={() => { economy.setStaff(p.era, p.slot, o.card.id); picking = null; }} aria-label="{o.card.name}, {RARITY_NAME[o.card.rarity]}{o.foil ? ' foil' : ''}, {pct(o.boost)}{where >= 0 ? ', slotted' : ''}">
            <CardFace card={o.card} width={64} foil={o.foil} />
            <span class="pname">{o.card.name}</span>
            <span class="num">{pct(o.boost)}</span>
            {#if where >= 0}<span class="tag">{where === p.slot ? "Here" : "Slotted"}</span>{/if}
          </button>
        </li>
      {:else}
        <li class="muted">No cards from this era yet</li>
      {/each}
    </ul>
  </Sheet>
{/if}

<style>
  .rows { list-style: none; padding: 0; margin: 14px 0; display: grid; gap: 12px; }
  .row { padding: 12px 14px; }
  .row.pencil { background: transparent; border: 1px dashed var(--pencil); }
  .row.pencil::before, .row.pencil::after { display: none; }
  .head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: 12px; align-items: center; }
  .engr, .seal { font-family: var(--font-display); font-size: 20px; width: 44px; height: 44px; display: grid; place-items: center; border: 3px double var(--rule); border-radius: 50%; color: var(--gilt); }
  h3 { margin: 0; font-size: 17px; }
  .pl { margin: 0; font-size: 13px; }
  .out { display: flex; flex-direction: column; align-items: flex-end; font-size: 12px; }
  .out strong { font-size: 15px; }
  .sealed { display: flex; gap: 12px; align-items: center; }

  .staff { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--line); font-size: 13px; }
  .slots { display: flex; flex-wrap: wrap; gap: 6px; }
  .slot { width: 44px; height: 56px; padding: 2px; border-radius: 5px; border: 2px solid var(--frame, var(--rule)); background: var(--paper); cursor: pointer; overflow: hidden; display: grid; place-items: center; font-size: 11px; color: var(--ink-archive); }
  .slot img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }
  .slot.empty { border: 1px dashed var(--pencil); }
  .slot.silver { --frame: #7c8288; } .slot.gold { --frame: #c9a227; } .slot.platinum { --frame: #8fa3ae; } .slot.diamond { --frame: #8cc4ef; }
  .pick { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 6px; }
  .pick button { width: 100%; display: grid; grid-template-columns: auto 1fr auto auto; gap: 10px; align-items: center; font: inherit; color: inherit; background: none; border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; cursor: pointer; text-align: left; }
  .pick button:hover { border-color: var(--edge); }
  .pname { font-weight: 500; }
  .tag { font-size: 11px; color: var(--muted); }
  @media (max-width: 640px) { .head { grid-template-columns: auto minmax(0, 1fr); } .out, .buy { grid-column: 1 / -1; align-items: flex-start; } }
</style>
