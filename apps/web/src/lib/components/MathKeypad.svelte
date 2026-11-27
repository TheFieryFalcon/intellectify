<script lang="ts">
  /**
   * The maths keypad (SPEC §7.2): Basic, Greek and Full tabs of buttons that insert mathematics into the
   * answer being written, so students never need LaTeX. Buttons don't take focus, so the caret stays put.
   * Shown or hidden by the student; the choice is remembered in this browser.
   */
  import katex from "katex";
  import { BASIC, FULL, GREEK, faceOf, type Key, type KeyGroup } from "$lib/keypad";

  let { oninsert }: { oninsert: (key: Key) => void } = $props();

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

<div class="keypad" class:closed={!open}>
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
  .key :global(.katex .mord.amsrm), .key :global(.katex .amsrm) { color: var(--muted); }
</style>
