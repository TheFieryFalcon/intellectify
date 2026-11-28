<script lang="ts">
  /**
   * The maths keypad (SPEC §7.2): Basic, Greek and Full tabs of buttons that insert mathematics into the
   * answer being written, so students never need LaTeX. Buttons don't take focus, so the caret stays put.
   * Shown or hidden by the student; the choice is remembered in this browser.
   */
  import katex from "katex";
  import { BASIC, FULL, GREEK, faceOf, type Key, type KeyGroup } from "$lib/keypad";

  import { currentEconomy } from "$lib/profile.svelte";

  /** `skin` overrides the equipped keypad skin (SPEC §13.8), for previews. */
  let { oninsert, skin }: { oninsert: (key: Key) => void; skin?: string | null } = $props();
  const economy = currentEconomy();
  const shownSkin = $derived(skin !== undefined ? skin : (economy?.state.equipped.keypad ?? null));

  type Tab = "basic" | "greek" | "full";
  const TABS: [Tab, string][] = [["basic", "Basic"], ["greek", "Greek"], ["full", "Full"]];
  const STORE = "intellectify:keypad";
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE) ?? "{}") as { open?: boolean; tab?: Tab };
    } catch {
      return {};
    }
  };
  const saved = read();
  let open = $state(saved.open ?? true);
  let tab = $state<Tab>(saved.tab ?? "basic");
  $effect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ open, tab }));
    } catch {
      // Storage blocked: the keypad just forgets.
    }
  });

  const faces = new Map<string, string>();
  const face = (key: Key) => {
    const f = faceOf(key);
    let html = faces.get(f);
    if (!html) faces.set(f, (html = katex.renderToString(f, { throwOnError: false, strict: "ignore" })));
    return html;
  };
  const groups = $derived<KeyGroup[]>(tab === "basic" ? [{ name: "", keys: BASIC }] : tab === "greek" ? GREEK : FULL);
</script>

{#snippet keyButton(key: Key)}
  <button type="button" class="key" title={key.name} aria-label={key.name} onpointerdown={(e) => e.preventDefault()} onclick={() => oninsert(key)}>{@html face(key)}</button>
{/snippet}

<div class="keypad {shownSkin ? `skin-${shownSkin}` : ''}" class:closed={!open}>
  {#if shownSkin === "stationary"}<span class="stars" aria-hidden="true"></span>{/if}
  <div class="bar">
    {#if open}
      <div class="tabs" role="tablist" aria-label="Keypad">
        {#each TABS as [id, label] (id)}
          <button type="button" role="tab" aria-selected={tab === id} class:on={tab === id} onpointerdown={(e) => e.preventDefault()} onclick={() => (tab = id)}>{label}</button>
        {/each}
      </div>
    {/if}
    <button type="button" class="btn link toggle" onpointerdown={(e) => e.preventDefault()} onclick={() => (open = !open)} aria-expanded={open}>{open ? "Hide keypad" : "Maths keypad"}</button>
  </div>
  {#if open}
    <div class="body" class:scroll={tab === "full"} role="tabpanel">
      {#each groups as g (g.name)}
        {#if g.name}<p class="group">{g.name}</p>{/if}
        <div class="keys">{#each g.keys as key (key.name + key.insert)}{@render keyButton(key)}{/each}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .keypad { margin-top: 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--region); padding: 6px 8px 8px; }
  .keypad.closed { border: 0; background: none; padding: 0; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .closed .bar { justify-content: flex-start; }
  .tabs { display: flex; gap: 2px; }
  .tabs button { font: inherit; font-size: 13px; border: 0; background: none; padding: 5px 12px; border-radius: 6px; color: var(--muted); cursor: pointer; }
  .tabs button.on { background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgb(0 0 0 / 0.06); }
  .toggle { font-size: 12px; }
  .body { margin-top: 6px; }
  .body.scroll { max-height: 280px; overflow-y: auto; padding-right: 2px; }
  .group { margin: 8px 2px 4px; font-size: 11px; color: var(--muted); }
  .group:first-child { margin-top: 2px; }
  .keys { display: grid; grid-template-columns: repeat(auto-fill, minmax(46px, 1fr)); gap: 5px; }
  .key {
    height: 40px; min-width: 0; padding: 0 4px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface); color: var(--ink);
    cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 16px;
    transition: border-color 0.12s, background-color 0.12s;
  }
  .key:hover { border-color: var(--accent); }
  .key:active { background: var(--accent-soft); }
  .key:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .key :global(.katex) { font-size: 1em; }

  /* Keypad skins (SPEC §13.6, §13.8): cosmetic only. */
  .keypad { position: relative; overflow: hidden; }
  .keypad > :not(.stars) { position: relative; }
  .skin-set-builder { background-image: radial-gradient(color-mix(in srgb, var(--ink) 12%, transparent) 0.6px, transparent 0.7px); background-size: 4px 4px; }
  .skin-set-builder .key { position: relative; }
  .skin-set-builder .key::before { content: "{"; position: absolute; left: 3px; color: var(--muted); font-size: 13px; }
  .skin-set-builder .key::after { content: "∣ … }"; position: absolute; right: 3px; color: var(--muted); font-size: 8px; }
  .skin-stationary { background: #0d1224; }
  .skin-stationary .stars { position: absolute; inset: -50%; background: radial-gradient(1px 1px at 10% 20%, #fff, transparent), radial-gradient(1px 1px at 30% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 60% 40%, #fff, transparent), radial-gradient(1px 1px at 80% 80%, #fff, transparent), radial-gradient(1px 1px at 45% 10%, #fff, transparent), radial-gradient(1px 1px at 90% 30%, #fff, transparent); background-size: 120px 120px; animation: turn 80s linear infinite; pointer-events: none; }
  .skin-stationary .tabs button, .skin-stationary .toggle, .skin-stationary .group { color: #c8d2f0; }
  .skin-stationary .tabs button.on { background: #1f2a4d; color: #fff; }
  .skin-stationary .key { background: rgba(255, 255, 255, 0.92); }
  .skin-determinacy .key { animation: move 2.4s steps(1) infinite; }
  .skin-determinacy .key:nth-child(even) { animation-delay: 1.2s; }
  .skin-chalkboard { background: #2f4a3a; border-color: #23382b; }
  .skin-chalkboard .key { background: #345241; color: #f4f1e6; border-color: rgba(255, 255, 255, 0.25); font-family: "Comic Sans MS", var(--font-display); }
  .skin-chalkboard .tabs button, .skin-chalkboard .toggle, .skin-chalkboard .group { color: #dfe8de; }
  .skin-chalkboard .tabs button.on { background: #3f6350; color: #fff; }
  .skin-graph-paper { background: #fff linear-gradient(rgba(80, 130, 220, 0.18) 1px, transparent 1px) 0 0 / 8px 8px, linear-gradient(90deg, rgba(80, 130, 220, 0.18) 1px, transparent 1px) 0 0 / 8px 8px; }
  .skin-graph-paper .key { background: rgba(255, 255, 255, 0.75); border-color: rgba(80, 130, 220, 0.45); color: #1c2330; }
  .skin-brass { background: linear-gradient(135deg, #5b4318, #2e220c); }
  .skin-brass .key { background: linear-gradient(160deg, #f1d58a, #b58a3a 60%, #8a6524); color: #2a1d06; border-color: #6b4f1c; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4); }
  .skin-brass .tabs button, .skin-brass .toggle, .skin-brass .group { color: #f1d58a; }
  .skin-brass .tabs button.on { background: #7a5a22; color: #fff4d8; }
  @keyframes turn { to { transform: rotate(360deg); } }
  @keyframes move { 0% { box-shadow: 0 0 0 2px var(--accent); } 50% { box-shadow: none; } }
  @media (prefers-reduced-motion: reduce) { .stars, .skin-determinacy .key { animation: none !important; } }
  .key :global(.katex .mord.amsrm), .key :global(.katex .amsrm) { color: var(--muted); }
</style>
