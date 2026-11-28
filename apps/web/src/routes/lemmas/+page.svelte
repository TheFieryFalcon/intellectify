<script lang="ts">
  /**
   * The Lemmas hub (SPEC §13.11): a summary strip over seven tabs, in the archive look. Tabs open as the
   * economy grows; the rest wait as quiet silhouettes under Later.
   */
  import "$lib/archive.css";
  import "$lib/archive-tokens.css";
  import { onMount } from "svelte";
  import { eraUnlocked, lemmasShort, type BuyAmount } from "@intellectify/engine";
  import { profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";
  import AxiomLadder from "$lib/components/economy/AxiomLadder.svelte";
  import CollectionShelves from "$lib/components/economy/CollectionShelves.svelte";
  import ConjectureLedger from "$lib/components/economy/ConjectureLedger.svelte";
  import HubSummary from "$lib/components/economy/HubSummary.svelte";
  import PacksTab from "$lib/components/economy/PacksTab.svelte";
  import ResearchTab from "$lib/components/economy/ResearchTab.svelte";
  import ShopTab from "$lib/components/economy/ShopTab.svelte";
  import TheoremTree from "$lib/components/economy/TheoremTree.svelte";
  import Constellations from "$lib/components/economy/Constellations.svelte";

  type TabId = "theorems" | "research" | "conjectures" | "axioms" | "packs" | "collection" | "shop";
  const TABS: { id: TabId; name: string; note: string }[] = [
    { id: "theorems", name: "Theorems", note: "Theorems raise what you earn. Each one opens once the theorems it rests on are proven far enough." },
    { id: "research", name: "Research", note: "Institutes earn Lemmas while you're away; cards you place in their slots boost them." },
    { id: "conjectures", name: "Conjectures", note: "Each Conjecture your institutes prove multiplies Research by 2.5, for good." },
    { id: "axioms", name: "Axioms", note: "Axioms are milestones of Lemmas earned. Prove one to claim its bonus and its cosmetic." },
    { id: "packs", name: "Packs", note: "A pack holds three cards from one era, and the last is always Gold or better." },
    { id: "collection", name: "Collection", note: "Every card you collect is kept here. Complete an era's set for its frame." },
    { id: "shop", name: "Shop", note: "Cosmetics change how things look, and nothing else." },
  ];
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

  const profile = $derived(profileFor(session.backend, session.user));
  const economy = $derived(profile?.economy ?? null);
  const cfg = $derived(economy?.config ?? null);
  const ready = $derived(!!economy?.loaded && !!cfg && !economy.failed);

  const openTabs = $derived.by(() => {
    if (!economy || !cfg) return new Set<TabId>(["theorems", "packs", "collection", "shop"]);
    const s = economy.state;
    const set = new Set<TabId>(["theorems", "packs", "collection", "shop"]);
    if (s.lemmasEarned >= cfg.tabs.research) set.add("research");
    if (economy.reached > 0) set.add("axioms");
    if (economy.rate >= cfg.tabs.conjecturesRate || s.conjectures > 0) set.add("conjectures");
    return set;
  });
  const condition: Record<TabId, string> = $derived({
    theorems: "",
    packs: "",
    collection: "",
    shop: "",
    research: cfg ? `${lemmasShort(cfg.tabs.research)} earned` : "",
    axioms: cfg ? `${lemmasShort(cfg.axioms.list[0]!.at)} earned` : "",
    conjectures: cfg ? `Research ${lemmasShort(cfg.tabs.conjecturesRate)}/day` : "",
  });

  const KEY = "intellectify:lemmas";
  const readPrefs = (): { tab?: TabId; seen?: TabId[] } => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "{}");
    } catch {
      return {};
    }
  };
  const prefs = readPrefs();
  let tab = $state<TabId>(prefs.tab ?? "theorems");
  let seen = $state<TabId[]>(prefs.seen ?? []);
  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ tab, seen }));
    } catch {
      /* storage blocked: forgets */
    }
  });
  $effect(() => {
    if (!openTabs.has(tab)) tab = "theorems";
  });
  let amount = $state<BuyAmount>(1);
  let menu = $state(false);
  let notice = $state<string | null>(null);
  $effect(() => {
    if (!notice) return;
    const t = setTimeout(() => (notice = null), 3500);
    return () => clearTimeout(t);
  });

  // Since last visit: from the end of the last visit; it resets when the student leaves or hides the page.
  let entered = false;
  $effect(() => {
    if (ready && economy && !entered) {
      entered = true;
      economy.enterHub();
    }
  });
  onMount(() => {
    const hide = () => {
      if (document.visibilityState === "hidden" && economy?.loaded) {
        economy.leaveHub();
        economy.enterHub();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      if (economy?.loaded && !economy.failed) economy.leaveHub();
    };
  });

  // The archive's stage (SPEC §13.11): the latest unlocked era; then night with each proven large cardinal
  // once every era is open; then constellations with each Conjecture once all 18 Axioms are proven.
  const stage = $derived.by(() => {
    if (!economy || !cfg) return { era: "antiquity", night: 0, stars: 0 };
    const s = economy.state;
    const eras = cfg.eras.filter((e) => eraUnlocked(cfg, s, e.id));
    const era = eras.at(-1)?.id ?? "antiquity";
    const all = eras.length === cfg.eras.length;
    const night = all ? Math.max(0, Math.min(9, s.axiomsProven - 9)) : 0;
    const stars = all && s.axiomsProven >= cfg.axioms.list.length ? s.conjectures : 0;
    return { era, night, stars };
  });

  const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || !!t.closest("math-field"));
  function keys(e: KeyboardEvent) {
    if (!ready || !economy || typing(e.target) || document.querySelector('[role="dialog"]')) return;
    const m = /^Digit([1-7])$/.exec(e.code);
    if (e.shiftKey && m && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = TABS[Number(m[1]) - 1]!;
      if (openTabs.has(t.id)) {
        e.preventDefault();
        select(t.id);
      }
    } else if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey && (tab === "theorems" || tab === "research")) {
      e.preventDefault();
      const r = economy.buyMax(tab);
      notice = r.count ? `Bought ${r.count} ${r.count === 1 ? "level" : "levels"} · ${lemmasShort(r.cost)}` : "Nothing affordable";
    }
  }
  function select(id: TabId) {
    tab = id;
    menu = false;
  }
  const dismissNote = (id: TabId) => (seen = [...seen, id]);
  const current = $derived(TABS.find((t) => t.id === tab)!);
  const later = $derived(TABS.filter((t) => !openTabs.has(t.id)));
</script>

<svelte:window onkeydown={keys} />

{#if profile?.loaded && profile.profile.showRewards === false}
  <div class="wrap narrow"><p class="muted">Rewards hidden · <a href="/settings">Settings</a></p></div>
{:else}
  <div class="archive" data-era={stage.era} data-night={stage.night || undefined} data-stars={stage.stars || undefined}>
    {#if stage.stars}<Constellations count={stage.stars} />{/if}
    <div class="wrap hub">
      {#if !economy || !economy.loaded}
        <p class="pl">Loading…</p>
      {:else if economy.failed || !cfg}
        <p>Couldn't load your Lemmas, so nothing here is being saved. <button class="btn link" onclick={() => location.reload()}>Reload</button></p>
      {:else}
        <div class="top">
          <HubSummary {economy} bind:amount />
          <nav class="tabs" aria-label="Lemmas">
            <button class="menu-btn" aria-expanded={menu} onclick={() => (menu = !menu)}>☰ <span>Pl. {ROMAN[TABS.indexOf(current)]} · {current.name}</span></button>
            <ul class:shown={menu}>
              {#each TABS as t, i (t.id)}
                {#if openTabs.has(t.id)}
                  <li><button class="tab" class:on={tab === t.id} aria-current={tab === t.id ? "page" : undefined} title="Shift+{i + 1}" onclick={() => select(t.id)}><span class="pl">Pl. {ROMAN[i]}</span> {t.name}</button></li>
                {/if}
              {/each}
              {#if later.length}
                <li class="later"><span class="pl">Later</span>{#each later as t (t.id)}<span class="sil" title={condition[t.id]}>{t.name} · {condition[t.id]}</span>{/each}</li>
              {/if}
            </ul>
          </nav>
        </div>

        <h1 class="sr">Lemmas · {current.name}</h1>
        {#if !seen.includes(tab)}
          <p class="note margin">{current.note} <button class="btn link" aria-label="Dismiss" onclick={() => dismissNote(tab)}>×</button></p>
        {/if}

        {#if tab === "theorems"}<TheoremTree {economy} {amount} />
        {:else if tab === "research"}<ResearchTab {economy} {amount} />
        {:else if tab === "conjectures"}<ConjectureLedger {economy} />
        {:else if tab === "axioms"}<AxiomLadder {economy} />
        {:else if tab === "packs"}<PacksTab {economy} />
        {:else if tab === "collection"}<CollectionShelves eras={cfg.eras} cards={economy.data?.cards ?? []} owned={economy.state.cards} />
        {:else if tab === "shop"}<ShopTab {economy} />{/if}
      {/if}
    </div>
  </div>
  {#if notice}<div class="hub-toast" role="status">{notice}</div>{/if}
{/if}

<style>
  .hub { position: relative; padding-top: 8px; }
  .top { position: sticky; top: 0; z-index: 5; background: var(--paper); background-image: inherit; padding-bottom: 4px; }
  .tabs ul { list-style: none; display: flex; flex-wrap: wrap; gap: 2px 4px; padding: 8px 0 0; margin: 0; align-items: center; }
  .tab { font: inherit; font-family: var(--font-display); font-size: 15px; background: none; border: 0; border-bottom: 2px solid transparent; color: var(--ink-archive); padding: 6px 10px; cursor: pointer; min-height: 40px; }
  .tab .pl { font-size: 12px; }
  .tab.on { border-bottom-color: var(--gilt); }
  .tab:focus-visible { outline: 2px solid var(--gilt); }
  .later { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-left: auto; font-size: 12px; }
  .sil { color: var(--pencil); border: 1px dashed var(--pencil); border-radius: 3px; padding: 1px 6px; }
  .menu-btn { display: none; }
  .note { margin: 10px 0 0; display: flex; gap: 8px; align-items: baseline; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .hub-toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 30; padding: 9px 18px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); box-shadow: 0 8px 24px rgba(15, 22, 35, 0.18); font-variant-numeric: lining-nums tabular-nums; }
  /* Phones: a ☰ menu in a sticky bar; the summary scrolls away. */
  @media (max-width: 640px) {
    .top { position: static; }
    .tabs { position: sticky; top: 0; z-index: 5; background: var(--paper); padding: 6px 0; border-bottom: 1px solid var(--line); }
    .menu-btn { display: flex; gap: 8px; align-items: center; font: inherit; font-family: var(--font-display); font-size: 16px; background: none; border: 0; color: var(--ink-archive); min-height: 44px; cursor: pointer; }
    .tabs ul { display: none; flex-direction: column; align-items: stretch; }
    .tabs ul.shown { display: flex; }
    .later { margin: 6px 0 0; }
    .tab { text-align: left; }
  }
</style>
