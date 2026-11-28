<script lang="ts">
  /**
   * A card (SPEC §13.11): a 5:7 card with the portrait, name and rarity, in its rarity's archive material
   * (Silver pewter, Gold gilt leaf, Platinum engraved steel, Diamond cut crystal over vellum). The rarity is
   * written on the frame too. A foil card's sheen follows the pointer or a dragged finger; reduced motion
   * shows a still gilt rim. `silhouette` shows an uncollected card: name, rarity and fields only.
   */
  import { RARITY_NAME } from "@intellectify/engine";
  import { portraitUrl, type Card } from "$lib/economy.svelte";

  let { card, width = 96, foil = false, silhouette = false, count = 0, onclick }: { card: Card; width?: number; foil?: boolean; silhouette?: boolean; count?: number; onclick?: () => void } = $props();
  let x = $state(50);
  let y = $state(50);
  const move = (e: PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x = ((e.clientX - r.left) / r.width) * 100;
    y = ((e.clientY - r.top) / r.height) * 100;
  };
  const url = $derived(silhouette ? null : portraitUrl(card));
  const initials = $derived(card.name.split(/\s+/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).slice(0, 2).map((w) => w[0]).join(""));
  const small = $derived(width < 140);
</script>

<svelte:element
  this={onclick ? "button" : "div"}
  class="card {card.rarity}"
  class:foil={foil && !silhouette}
  class:silhouette
  class:small
  style="--w:{width}px; --mx:{x}%; --my:{y}%"
  onpointermove={foil ? move : undefined}
  {onclick}
  type={onclick ? "button" : undefined}
  role={onclick ? "button" : "img"}
  aria-label="{card.name} · {RARITY_NAME[card.rarity]}{silhouette ? ' · Not collected' : ''}{foil ? ' · Foil' : ''}"
>
  <span class="art">
    {#if url}<img src={url} alt="" loading="lazy" decoding="async" />{:else}<span class="mono">{initials}</span>{/if}
  </span>
  <span class="plate">
    <span class="name">{card.name}</span>
    {#if silhouette && !small}<span class="fields">{card.fields.join(" · ")}</span>{/if}
    <span class="rarity">{RARITY_NAME[card.rarity]}</span>
  </span>
  {#if count > 1}<span class="count">×{count}</span>{/if}
  {#if foil && !silhouette}<span class="sheen" aria-hidden="true"></span>{/if}
</svelte:element>

<style>
  .card { --frame: #8f969e; --frame-hi: #d6dadf; position: relative; display: flex; flex-direction: column; width: var(--w); aspect-ratio: 5 / 7; padding: calc(var(--w) * 0.045); border-radius: calc(var(--w) * 0.06); background: linear-gradient(145deg, var(--frame-hi), var(--frame) 45%, var(--frame-hi) 70%, var(--frame)); border: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); color: #1c1a16; font: inherit; text-align: center; cursor: default; overflow: hidden; flex: none; }
  button.card { cursor: pointer; }
  button.card:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.22); }
  button.card:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .silver { --frame: #7c8288; --frame-hi: #c3c7cb; }
  .gold { --frame: #b08a2e; --frame-hi: #f1d98a; }
  .platinum { --frame: #5d6b74; --frame-hi: #dfe7ec; background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.12) 0 1px, transparent 1px 3px), linear-gradient(145deg, var(--frame-hi), var(--frame) 45%, var(--frame-hi) 70%, var(--frame)); }
  .diamond { --frame: #9fc6e6; --frame-hi: #f4fbff; background: conic-gradient(from 30deg, #f4fbff, #b9dcf5, #eaf6ff, #a6cdea, #f4fbff, #cfe7f8, #f4fbff); }
  .art { position: relative; flex: 1; border-radius: calc(var(--w) * 0.035); background: #efe8d8; overflow: hidden; display: grid; place-items: center; }
  .diamond .art { background: #f3ecda; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8); }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mono { font-family: var(--font-display); font-size: calc(var(--w) * 0.3); color: #6d6455; letter-spacing: 0.04em; }
  .plate { display: flex; flex-direction: column; gap: 1px; padding-top: calc(var(--w) * 0.035); min-height: calc(var(--w) * 0.3); justify-content: center; }
  .name { font-family: var(--font-display); font-weight: 600; font-size: calc(var(--w) * 0.085); line-height: 1.1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
  .small .name { font-size: 10px; }
  .rarity { font-size: max(8px, calc(var(--w) * 0.055)); letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75; }
  .fields { font-size: calc(var(--w) * 0.05); opacity: 0.7; }
  .silhouette .art { background: #d8d2c4; }
  .silhouette .mono { color: #b4ac9b; }
  .silhouette { filter: grayscale(0.7); opacity: 0.75; }
  .count { position: absolute; top: 6px; right: 6px; background: var(--ink); color: var(--surface); font-size: 10px; font-weight: 600; border-radius: 999px; padding: 1px 6px; }
  .sheen { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: color-dodge; background: radial-gradient(circle at var(--mx) var(--my), rgba(255, 255, 255, 0.55), transparent 40%), linear-gradient(115deg, transparent 20%, rgba(255, 80, 200, 0.25) 35%, rgba(80, 220, 255, 0.25) 50%, rgba(140, 255, 120, 0.22) 65%, transparent 80%); background-size: 100% 100%, 250% 250%; background-position: 0 0, var(--mx) var(--my); }
  .foil { box-shadow: 0 0 0 1px #e8c96a, 0 2px 8px rgba(200, 160, 40, 0.5); }
  @media (prefers-reduced-motion: reduce) { .sheen { display: none; } .foil { box-shadow: 0 0 0 2px #d9b44a; } }
</style>
