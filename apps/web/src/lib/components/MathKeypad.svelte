<script lang="ts">
  /**
   * The maths keypad (SPEC §7.2): Basic, Greek and Full tabs of buttons that insert mathematics into the
   * answer being written, so students never need LaTeX. Buttons don't take focus, so the caret stays put.
   * Shown or hidden by the student; the choice is remembered in this browser.
   */
  import katex from "katex";
  import { BASIC, FULL, GREEK, faceOf, type Key, type KeyGroup } from "$lib/keypad";

  import { currentEconomy } from "$lib/profile.svelte";
  import { styleOf } from "$lib/economy.svelte";

  /** `skin` overrides the equipped keypad skin (SPEC §13.8), for previews. */
  let { oninsert, skin }: { oninsert: (key: Key) => void; skin?: string | null } = $props();
  const economy = currentEconomy();
  const shownSkin = $derived(skin !== undefined ? skin : (economy?.state.equipped.keypad ?? null));
  const st = $derived(styleOf(shownSkin));
  /** The class a skin draws with: its own (Axiom art), a palette, or a geometric pattern. */
  const skinClass = $derived(!shownSkin ? "" : st?.kind === "palette" ? `skin-palette m-${st.motion ?? "none"}` : st?.kind === "geo" ? `skin-geo-${st.pattern}` : `skin-${shownSkin}`);
  const skinVars = $derived(st?.kind === "palette" ? (st.colors ?? []).map((c, i) => `--p${i}:${c}`).join(";") : "");

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

<div class="keypad {skinClass}" style={skinVars} class:closed={!open}>
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

  /* Keypad skins (SPEC §13.6, §13.8): cosmetic only. Every skin sets its own key, text and chrome colors, so
     glyphs stay readable on light and dark pages. Shop skins are geometric, in the student's color. */
  .keypad { position: relative; overflow: hidden; --kp-text: var(--ink); --kp-chrome: var(--muted); }
  .keypad > :not(.stars) { position: relative; }
  .keypad[class*="skin-"] .tabs button, .keypad[class*="skin-"] .toggle, .keypad[class*="skin-"] .group { color: var(--kp-chrome); }
  .keypad[class*="skin-"] .tabs button.on { background: var(--kp-on, var(--surface)); color: var(--kp-text); }
  .keypad[class*="skin-"] .key { color: var(--kp-text); }
  .keypad[class*="skin-"] .key :global(.katex .mord.amsrm), .keypad[class*="skin-"] .key :global(.katex .amsrm) { color: var(--kp-chrome); }

  /* Set-Builder (Specification): keys framed like { x ∣ … } over a fine sieve. */
  .skin-set-builder { background-image: radial-gradient(color-mix(in srgb, var(--ink) 14%, transparent) 0.7px, transparent 0.8px); background-size: 5px 5px; }
  .skin-set-builder .key { position: relative; border-radius: 4px; border-left: 2px solid var(--accent); border-right: 2px solid var(--accent); border-top-color: transparent; border-bottom-color: transparent; background: var(--surface); }

  /* Stationary (Mahlo): the keys hold still while a field of stars turns behind them. */
  .skin-stationary { --kp-text: #eef1ff; --kp-chrome: #aab4dc; --kp-on: rgba(255, 255, 255, 0.12); background: radial-gradient(ellipse at 50% 120%, #1d2752, #070a18 70%); border-color: #232b4d; }
  .skin-stationary .stars { position: absolute; inset: -60%; background: radial-gradient(1px 1px at 10% 20%, #fff, transparent), radial-gradient(1px 1px at 30% 70%, #cfd8ff, transparent), radial-gradient(1.5px 1.5px at 60% 40%, #fff, transparent), radial-gradient(1px 1px at 80% 80%, #fff, transparent), radial-gradient(1px 1px at 45% 10%, #dfe4ff, transparent), radial-gradient(1px 1px at 90% 30%, #fff, transparent); background-size: 110px 110px; animation: turn 120s linear infinite; pointer-events: none; opacity: 0.8; }
  .skin-stationary .key { background: rgba(255, 255, 255, 0.07); border-color: rgba(200, 210, 255, 0.18); backdrop-filter: blur(1px); }
  .skin-stationary .key:hover { border-color: #aab4ff; background: rgba(255, 255, 255, 0.12); }

  /* Determinacy (Woodin): keys light alternately, like moves in an infinite game. */
  .skin-determinacy .key { animation: move 3s steps(1) infinite; }
  .skin-determinacy .key:nth-child(even) { animation-delay: 1.5s; }
  @keyframes move { 0% { box-shadow: inset 0 -2px 0 var(--accent); border-color: color-mix(in srgb, var(--accent) 60%, var(--line)); } 50% { box-shadow: none; } }

  /* Palettes (Axiom keypads): background, key, text and border colors. */
  .skin-palette { --kp-text: var(--p2); --kp-chrome: color-mix(in srgb, var(--p2) 70%, var(--p0)); --kp-on: var(--p1); background: var(--p0); border-color: var(--p3); }
  .skin-palette .key { background: var(--p1); border-color: var(--p3); }
  .skin-palette .key:hover { border-color: var(--p2); }
  .skin-palette.m-shimmer .key { background: linear-gradient(110deg, var(--p1) 40%, color-mix(in srgb, var(--p1) 70%, white) 50%, var(--p1) 60%) 0 0 / 300% 100%; animation: keyshine 6s linear infinite; }
  .skin-palette.m-glow .key { box-shadow: 0 0 6px color-mix(in srgb, var(--p3) 60%, transparent); }
  .skin-palette.m-iridescent .key { background: linear-gradient(120deg, var(--p1), color-mix(in srgb, var(--p3) 35%, var(--p1)), color-mix(in srgb, #a5f3fc 30%, var(--p1)), var(--p1)) 0 0 / 300% 300%; animation: keyshine 8s linear infinite; }
  @keyframes keyshine { to { background-position: 300% 0; } }

  /* Geometric shop skins, in the student's color. */
  .skin-geo-outline .key { background: transparent; border-color: var(--accent); }
  .skin-geo-outline { background: transparent; }
  .skin-geo-pill .key { border-radius: 999px; background: var(--surface); }
  .skin-geo-pill .tabs button { border-radius: 999px; }
  .skin-geo-inset { background: var(--region); }
  .skin-geo-inset .key { background: var(--region); border-color: transparent; box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.08); }
  .skin-geo-tinted { background: color-mix(in srgb, var(--accent) 10%, var(--region)); border-color: color-mix(in srgb, var(--accent) 30%, var(--line)); }
  .skin-geo-tinted .key { background: color-mix(in srgb, var(--accent) 14%, var(--surface)); border-color: color-mix(in srgb, var(--accent) 35%, var(--line)); }
  .skin-geo-block .key { border-radius: 2px; border-width: 1px 1px 3px; border-color: var(--line) var(--line) var(--accent); background: var(--surface); }
  .skin-geo-block .key:active { border-bottom-width: 1px; }
  @keyframes turn { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .stars, .key { animation: none !important; } }
</style>
