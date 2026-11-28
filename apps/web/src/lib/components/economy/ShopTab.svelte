<script lang="ts">
  /**
   * Shop (SPEC §13.11), three sub-tabs. Wardrobe: what the student owns, by slot, with Equip / Equipped and
   * Default; items that can't be bought are silhouettes with their condition. Shop: geometric designs on
   * category shelves, drawn in the student's color, with price, Preview and Buy. Colors: a separate option
   * that recolors the whole site.
   */
  import { COSMETIC_SLOTS, lemmasShort, themeTokens, type ColorDef, type CosmeticSlot } from "@intellectify/engine";
  import { catalogue, SLOT_NAME, themeVars, type CosmeticEntry } from "$lib/cosmetics";
  import type { EconomyStore } from "$lib/economy.svelte";
  import { loadTitles, titles } from "$lib/titles.svelte";
  import { session } from "$lib/session.svelte";
  import CosmeticPreview from "./CosmeticPreview.svelte";
  import LemmaAmount from "./LemmaAmount.svelte";
  import Sheet from "./Sheet.svelte";
  import Title from "./Title.svelte";

  let { economy }: { economy: EconomyStore } = $props();
  loadTitles();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  let sub = $state<"wardrobe" | "shop" | "colors">("wardrobe");
  let preview = $state<CosmeticEntry | null>(null);
  const all = $derived(catalogue(cfg, titles.map));
  const SHOP_SLOTS: CosmeticSlot[] = ["banner", "keypad", "celebration", "nodeTheme"];
  const PREVIEWABLE: CosmeticSlot[] = ["banner", "keypad", "celebration", "nodeTheme", "lemmaIcon", "nameOrnament"];
  const owns = (c: CosmeticEntry) => economy.ownedIn(c.slot).includes(c.id);
  const equippedIn = (slot: CosmeticSlot) => (s.equipped[slot] as string | null | undefined) ?? null;
  const colorOwned = (c: ColorDef) => s.owned.includes(c.id);
  const axiomName = (id: string) => cfg.axioms.list.find((a) => a.id === id);
</script>

<div class="subtabs" role="tablist" aria-label="Shop">
  <button role="tab" aria-selected={sub === "wardrobe"} class:on={sub === "wardrobe"} onclick={() => (sub = "wardrobe")}>Wardrobe</button>
  <button role="tab" aria-selected={sub === "shop"} class:on={sub === "shop"} onclick={() => (sub = "shop")}>Shop</button>
  <button role="tab" aria-selected={sub === "colors"} class:on={sub === "colors"} onclick={() => (sub = "colors")}>Colors</button>
</div>

{#if sub === "wardrobe"}
  {#each COSMETIC_SLOTS as slot (slot)}
    {@const items = all.filter((c) => c.slot === slot)}
    <section class="slot">
      <h3>{SLOT_NAME[slot]}</h3>
      <ul class="items">
        <li class="item plate inked">
          <span class="nm">Default</span>
          {#if !equippedIn(slot)}<span class="pl">Equipped</span>{:else}<button class="ink-btn" onclick={() => economy.equip(slot, null)}>Equip</button>{/if}
        </li>
        {#each items as c (c.id)}
          {@const mine = owns(c)}
          <li class="item" class:plate={mine} class:pencil={!mine}>
            <span class="nm">{#if slot === "title" && mine}<Title title={c.id} />{:else}{c.name}{/if}</span>
            {#if mine}
              {#if equippedIn(slot) === c.id}<span class="pl">Equipped</span>{:else}<button class="ink-btn" onclick={() => economy.equip(slot, c.id)}>Equip</button>{/if}
              {#if PREVIEWABLE.includes(slot)}<button class="btn link" onclick={() => (preview = c)}>Preview</button>{/if}
            {:else}
              <span class="cond">{c.price !== undefined ? "Shop" : c.condition}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{:else if sub === "shop"}
  {#each SHOP_SLOTS as slot (slot)}
    <section class="slot">
      <h3>{SLOT_NAME[slot]}</h3>
      <ul class="items">
        {#each all.filter((c) => c.slot === slot && c.price !== undefined) as c (c.id)}
          {@const mine = s.owned.includes(c.id)}
          {@const can = c.price! <= economy.balance}
          <li class="item plate" class:pencil={!mine && !can}>
            <span class="nm">{c.name}<span class="desc">{c.description}</span></span>
            <span class="num price"><LemmaAmount value={c.price!} /></span>
            <button class="btn link" onclick={() => (preview = c)}>Preview</button>
            {#if mine}<span class="pl">Owned</span>{:else}<button class="ink-btn" class:pencil={!can} disabled={!can} onclick={() => economy.buyCosmetic(c.id)}>Buy</button>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{:else}
  <p class="margin">A color recolors the whole site, in light and dark. Designs from the Shop take it on too.</p>
  <ul class="colors">
    <li class="color plate inked">
      <span class="swatches"><span class="sw default-l"></span><span class="sw default-d"></span></span>
      <span class="nm">Default</span>
      {#if !s.equipped.theme}<span class="pl">Equipped</span>{:else}<button class="ink-btn" onclick={() => economy.equip("theme", null)}>Equip</button>{/if}
    </li>
    {#each cfg.colors ?? [] as c (c.id)}
      {@const t = themeTokens(c.style)}
      {@const mine = colorOwned(c)}
      {@const can = c.price !== undefined && c.price <= economy.balance}
      <li class="color" class:plate={mine || can} class:pencil={!mine && !can}>
        <span class="swatches" aria-hidden="true">
          {#each [t.light, t.dark] as v, i (i)}
            <span class="sw" style={themeVars(v)}><span class="bar"></span><span class="dot"></span></span>
          {/each}
        </span>
        <span class="nm">{c.name}<span class="desc">{c.description}</span></span>
        {#if mine}
          {#if s.equipped.theme === c.id}<span class="pl">Equipped</span>{:else}<button class="ink-btn" onclick={() => economy.equip("theme", c.id)}>Equip</button>{/if}
        {:else if c.price !== undefined}
          <button class="ink-btn" class:pencil={!can} disabled={!can} onclick={() => economy.buyCosmetic(c.id)}>Buy <LemmaAmount value={c.price} /></button>
        {:else if c.axiom}
          {@const a = axiomName(c.axiom)}
          <span class="cond">Axiom {a?.name ?? c.axiom}{a ? `, ${lemmasShort(a.at)}` : ""}</span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

{#if preview}
  {@const c = preview}
  {@const mine = economy.ownedIn(c.slot).includes(c.id)}
  <Sheet label="Preview: {c.name}" onclose={() => (preview = null)} wide>
    <p class="pl">{SLOT_NAME[c.slot]}</p>
    <h2>{c.name}</h2>
    <p class="margin">{c.description}</p>
    <CosmeticPreview item={c} name={session.user?.displayName ?? "You"} />
    <div class="actions">
      {#if mine}
        {#if equippedIn(c.slot) === c.id}<span class="pl">Equipped</span>{:else}<button class="ink-btn" onclick={() => economy.equip(c.slot, c.id)}>Equip</button>{/if}
      {:else if c.price !== undefined}
        <button class="ink-btn" class:pencil={c.price > economy.balance} disabled={c.price > economy.balance} onclick={() => economy.buyCosmetic(c.id)}>Buy <LemmaAmount value={c.price} /></button>
      {/if}
    </div>
  </Sheet>
{/if}

<style>
  .subtabs { display: flex; gap: 6px; margin: 12px 0; }
  .subtabs button { font: inherit; font-size: 13px; border: 1px solid var(--rule); background: none; color: var(--ink-archive); padding: 4px 14px; border-radius: 3px; cursor: pointer; }
  .subtabs button.on { background: var(--ink-archive); color: var(--paper); }
  .slot { margin: 14px 0; }
  h3 { margin: 0 0 6px; font-size: 16px; }
  .items, .colors { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 6px; }
  .item, .color { display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-size: 13px; min-height: 44px; }
  .item.pencil, .color.pencil { border: 1px dashed var(--pencil); color: var(--pencil); border-radius: 2px; }
  .nm { flex: 1; min-width: 0; display: flex; flex-direction: column; font-weight: 500; }
  .desc { font-weight: 400; font-size: 12px; color: var(--pencil); }
  .cond { font-size: 12px; }
  .actions { margin-top: 14px; }
  h2 { margin: 2px 0; }
  .swatches { display: flex; gap: 3px; flex: none; }
  .sw { width: 30px; height: 36px; border-radius: 4px; background: var(--bg); border: 1px solid var(--line); display: flex; flex-direction: column; justify-content: space-between; padding: 4px; }
  .sw .bar { height: 5px; border-radius: 2px; background: var(--ink); opacity: 0.85; width: 80%; }
  .sw .dot { height: 9px; border-radius: 3px; background: var(--accent); }
  .default-l { background: #fafbfc; } .default-d { background: #12161d; }
</style>
