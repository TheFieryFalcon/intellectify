<script lang="ts">
  /**
   * The profile hero (SPEC §13.11): the banner across the top, the name in its frame with the title under it,
   * overlapping the banner's lower edge, and the three showcase cards on the right (below on phones).
   * `onedit` adds an Edit button to each field on the student's own profile.
   */
  import type { Snippet } from "svelte";
  import type { Card } from "$lib/economy.svelte";
  import Banner from "./Banner.svelte";
  import CardFace from "./CardFace.svelte";
  import Title from "./Title.svelte";
  import { styleOf } from "$lib/economy.svelte";

  let { name, banner, frame, title, ornament, showcase, cards, foils = {}, onedit, extra }: {
    name: string;
    banner: string | null;
    frame: string | null;
    title: string | null;
    ornament: string | null;
    showcase: string[];
    cards: Map<string, Card>;
    foils?: Record<string, boolean>;
    onedit?: (field: "name" | "banner" | "frame" | "title" | "showcase") => void;
    extra?: Snippet;
  } = $props();
  // Name ornaments (SPEC §13.6): Rank-into-Rank's Edge, or a colored style.
  const orn = $derived(styleOf(ornament));
  const ornClass = $derived(!ornament ? "" : ornament === "edge" ? "orn-edge" : orn ? `orn-${orn.kind} m-${orn.motion ?? "none"}` : "");
  const ornVars = $derived(orn?.colors ? `--o0:${orn.colors[0]};--o1:${orn.colors[1] ?? orn.colors[0]};--og:${orn.colors.join(", ")}` : "");
</script>

<header class="hero">
  <div class="banner-wrap">
    <Banner id={banner} {name} />
    {#if onedit}<button class="edit b" onclick={() => onedit("banner")}>Edit</button>{/if}
  </div>
  <div class="row">
    <div class="who">
      <div class="namebox {frame ?? ''}">
        <h1 class="name {ornClass}" style={ornVars}>{name}</h1>
        {#if onedit}<span class="edits"><button class="edit" onclick={() => onedit("name")}>Edit name</button><button class="edit" onclick={() => onedit("frame")}>Edit frame</button></span>{/if}
      </div>
      <div class="titleline">
        {#if title}<Title {title} />{/if}
        {#if onedit}<button class="edit" onclick={() => onedit("title")}>{title ? "Edit" : "Add title"}</button>{/if}
      </div>
      {#if extra}{@render extra()}{/if}
    </div>
    <div class="showcase">
      {#each showcase.slice(0, 3) as id (id)}
        {@const c = cards.get(id)}
        {#if c}<CardFace card={c} width={84} foil={!!foils[id]} />{/if}
      {/each}
      {#if onedit}<button class="edit" onclick={() => onedit("showcase")}>{showcase.length ? "Edit" : "Showcase"}</button>{/if}
    </div>
  </div>
</header>

<style>
  .hero { margin-bottom: 12px; }
  .banner-wrap { position: relative; height: 140px; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); }
  .banner-wrap :global(.banner) { height: 140px; }
  .row { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: -34px; padding: 0 16px; position: relative; flex-wrap: wrap; }
  .namebox { display: inline-flex; align-items: center; gap: 10px; background: var(--surface); padding: 8px 16px; border-radius: 10px; border: 1px solid var(--line); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); flex-wrap: wrap; }
  .name { margin: 0; font-size: 28px; position: relative; }
  .titleline { display: flex; gap: 8px; align-items: center; margin: 6px 0 0 4px; min-height: 22px; }
  .showcase { display: flex; gap: 8px; align-items: flex-end; }
  .edit { font: inherit; font-size: 12px; color: var(--muted); background: none; border: 0; padding: 2px 4px; cursor: pointer; text-decoration: underline; }
  .edit.b { position: absolute; top: 8px; right: 10px; background: var(--surface); border-radius: 6px; padding: 3px 8px; text-decoration: none; border: 1px solid var(--line); }
  .edits { display: inline-flex; gap: 4px; }
  /* Era frames (SPEC §13.7): from completed sets only. */
  .frame-antiquity { border: 3px double #7a5c3a; background: #f3ead2; color: #3a2817; }
  .frame-golden-age { border: 2px solid #c9a227; box-shadow: inset 0 0 0 3px #26457a, 0 4px 14px rgba(0, 0, 0, 0.1); background: #f6eed9; color: #28203c; }
  .frame-renaissance { border: 1px solid #5a4a3a; outline: 1px solid #5a4a3a; outline-offset: 3px; background: #f4efe3; color: #2b2622; }
  .frame-enlightenment { border-top: 4px double #444; border-bottom: 4px double #444; border-radius: 0; background: #f8f4eb; color: #1c1c1c; }
  .frame-steam-age { border: 3px solid #b5893c; background: linear-gradient(#fbf3e1, #efe3c6); color: #2b2925; box-shadow: inset 0 0 0 1px #7f5e25; }
  .frame-machine-age { border: 2px solid #cfe0f7; background: #1f3f6e; color: #eef4ff; }
  .frame-space-age { border: 1px solid #6b7aa6; background: radial-gradient(circle at 30% 20%, #20264a, #0b0e1c); color: #f3f5ff; }
  .namebox[class*="frame-"] .edit { color: inherit; opacity: 0.75; }
  /* Edge (Rank-into-Rank): a hairline of light runs and flickers along the name's edge. */
  .orn-edge { background: linear-gradient(100deg, currentColor 40%, color-mix(in srgb, var(--accent) 70%, white) 47%, #fff 50%, color-mix(in srgb, var(--accent) 70%, white) 53%, currentColor 60%) 0 0 / 260% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 0.7px var(--accent)); animation: edge 3.6s linear infinite; }
  @keyframes edge { from { background-position: 130% 0; } 70% { filter: drop-shadow(0 0 0.7px var(--accent)); } 73% { filter: drop-shadow(0 0 2.5px var(--accent)); } 76% { filter: drop-shadow(0 0 0.7px var(--accent)); } to { background-position: -130% 0; } }
  /* Colored ornaments (Axiom unlocks). */
  .orn-gradient { background: linear-gradient(90deg, var(--og)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .orn-shimmer { background: linear-gradient(90deg, var(--og), var(--o0)) 0 0 / 200% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: orn-shimmer 5s linear infinite; }
  .orn-glow { text-shadow: 0 0 6px var(--o0), 0 0 14px color-mix(in srgb, var(--o0) 60%, transparent); }
  .orn-glow.m-twinkle { animation: twinkle 3s ease-in-out infinite; }
  @keyframes orn-shimmer { to { background-position: -200% 0; } }
  @keyframes twinkle { 50% { text-shadow: 0 0 2px var(--o0), 0 0 6px color-mix(in srgb, var(--o0) 40%, transparent); } }
  @media (max-width: 640px) { .row { margin-top: -26px; padding: 0 8px; } .name { font-size: 22px; } }
  @media (prefers-reduced-motion: reduce) { .name { animation: none !important; } }
</style>
