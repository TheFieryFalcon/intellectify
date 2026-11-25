<script lang="ts">
  import type { RankLevel } from "@intellectify/engine";
  import type { CourseProgress } from "$lib/backend";
  import type { CourseBundle } from "$lib/content";
  import type { Rollups } from "$lib/practice";
  import { RANK_LABEL, rankKey, rankVars, score } from "$lib/ranks";
  import { LABEL_W, layoutTree, NODE_W, SHAPE_H } from "$lib/treeLayout";

  let { course, progress, rollups }: { course: CourseBundle; progress: CourseProgress; rollups: Rollups } = $props();

  const layout = $derived(layoutTree(course));
  const skills = $derived(course.units.flatMap((u) => u.sections.flatMap((s) => s.skills)));
  const prereqs = $derived(new Map(skills.map((s) => [s.id, s.prereqs])));
  const dependents = $derived.by(() => {
    const m = new Map<string, string[]>();
    for (const s of skills) for (const p of s.prereqs) m.set(p, [...(m.get(p) ?? []), s.id]);
    return m;
  });

  let focused = $state<string | null>(null);

  const reach = (id: string, next: (x: string) => string[] | undefined) => {
    const seen = new Set<string>();
    const stack = [id];
    while (stack.length) for (const y of next(stack.pop()!) ?? []) if (!seen.has(y)) (seen.add(y), stack.push(y));
    return seen;
  };
  const chain = $derived.by(() => {
    if (!focused) return null;
    const up = reach(focused, (x) => prereqs.get(x));
    const down = reach(focused, (x) => dependents.get(x));
    return { up, down, all: new Set([focused, ...up, ...down]) };
  });
  const edgeLit = (from: string, to: string) =>
    !!chain && ((chain.up.has(from) && (to === focused || chain.up.has(to))) || (chain.down.has(to) && (from === focused || chain.down.has(from))));

  const stateOf = (id: string) => {
    const s = progress.skills[id];
    const theta = s && s.resolved > 0 ? s.theta : null;
    return { rank: (s?.rank ?? 0) as RankLevel, theta };
  };
</script>

<div class="scroll">
  <div class="map" class:focus={!!chain} style="width:{layout.width}px;height:{layout.height}px">
    <svg width={layout.width} height={layout.height} aria-hidden="true">
      {#each layout.regions as r (r.id)}
        <rect class="region" x={r.x} y={r.y} width={r.w} height={r.h} rx="18" />
        <text class="region-label" x={r.x + 14} y={r.y + 20}>
          {r.name}
          {#if rollups.sections[r.id]?.rank}· {RANK_LABEL[rollups.sections[r.id]!.rank]}{/if}
        </text>
      {/each}
      {#each layout.headers as h, i (i)}
        <text class={h.kind} x={h.x} y={h.y + (h.kind === "year" ? 22 : 18)}>
          {h.text}{#if h.kind === "unit" && rollups.units[Number(h.text.split(" ")[1])]?.rank}
            · {RANK_LABEL[rollups.units[Number(h.text.split(" ")[1])]!.rank]}{/if}
        </text>
      {/each}
      {#each layout.edges as e (e.from + e.to)}
        <path d={e.d} class:hidden={e.hidden} class:lit={edgeLit(e.from, e.to)} />
      {/each}
    </svg>

    {#each skills as s (s.id)}
      {@const n = layout.nodes.get(s.id)!}
      {@const st = stateOf(s.id)}
      <a
        class="node {rankKey(st.rank)} size-{s.size}"
        class:lit={chain?.all.has(s.id)}
        href="/{course.id}/skill/{s.id}"
        style="left:{n.x}px;top:{n.y}px;width:{NODE_W}px;{rankVars(st.rank, st.theta)}"
        aria-label="{s.name}, {s.size}, {RANK_LABEL[st.rank]}{st.theta === null ? '' : `, score ${score(st.theta)}`}"
        onmouseenter={() => (focused = s.id)}
        onmouseleave={() => (focused = null)}
        onfocus={() => (focused = s.id)}
        onblur={() => (focused = null)}
      >
        <span class="shape" style="height:{SHAPE_H[s.size]}px">
          <span class="ring"><span class="disc"><span class="num">{st.theta === null ? "" : score(st.theta)}</span></span></span>
        </span>
        <span class="label" style="max-width:{LABEL_W}px">{s.name}</span>
      </a>
    {/each}
  </div>
</div>

<style>
  .scroll { overflow-x: auto; padding-bottom: 8px; }
  .map { position: relative; margin: 0 auto; }
  svg { position: absolute; inset: 0; overflow: visible; }
  .region { fill: var(--region); }
  .region-label { fill: var(--muted); font-size: 11.5px; font-weight: 500; }
  .year { fill: var(--muted); font-family: var(--font-display); font-size: 16px; }
  .unit { fill: var(--muted); font-size: 12px; font-weight: 600; }
  path { fill: none; stroke: var(--edge); stroke-width: 1.3; stroke-linecap: round; transition: opacity 0.15s, stroke 0.15s; }
  path.hidden { opacity: 0; }
  path.lit { stroke: var(--accent); stroke-width: 1.6; opacity: 1; }
  .map.focus path:not(.lit) { opacity: 0.12; }
  .map.focus path.hidden:not(.lit) { opacity: 0; }

  .node { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; text-decoration: none; color: var(--ink); transition: opacity 0.15s; }
  .map.focus .node:not(.lit) { opacity: 0.3; }
  /* Shape by skill size (SPEC §15.2): small circle, medium circle, small diamond (large), large diamond (cornerstone). */
  .shape { display: grid; place-items: center; }
  .ring { --side: 44px; width: var(--side); height: var(--side); border-radius: 50%; padding: 3px; background: conic-gradient(var(--next) calc(var(--p) * 1turn), var(--track) 0); box-shadow: 0 0 0 3px var(--region); transition: transform 0.15s; }
  .disc { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--region); background: linear-gradient(160deg, var(--hi) -30%, var(--r) 55%); color: #fff; font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .size-small .ring { --side: 32px; padding: 2.5px; }
  .size-small .disc { font-size: 9.5px; }
  .size-large .ring, .size-cornerstone .ring { --side: 35px; border-radius: 5px; transform: rotate(45deg); background: conic-gradient(from -45deg, var(--next) calc(var(--p) * 1turn), var(--track) 0); }
  .size-cornerstone .ring { --side: 48px; border-radius: 7px; padding: 3.5px; }
  .size-large .disc, .size-cornerstone .disc { border-radius: 3px; background: linear-gradient(115deg, var(--hi) -30%, var(--r) 55%); }
  .size-large .num, .size-cornerstone .num { transform: rotate(-45deg); }
  .size-cornerstone .disc { font-size: 12.5px; }
  .node.silver .disc, .node.gold .disc, .node.platinum .disc { color: #1c2330; }
  .node.unranked .ring { background: var(--track); }
  .node.unranked .disc { background: var(--unranked); color: var(--muted); }
  .node:hover .ring { transform: scale(1.07); }
  .node.size-large:hover .ring, .node.size-cornerstone:hover .ring { transform: rotate(45deg) scale(1.07); }
  .node:focus-visible { outline: none; }
  .node:focus-visible .ring { outline: 2px solid var(--accent); outline-offset: 3px; }
  /* A soft background behind labels so nearby lines never cut through the text. */
  .label { font-size: 11px; line-height: 14.5px; padding: 0 3px; border-radius: 4px; background: var(--region); box-shadow: 0 0 0 2px var(--region); }
</style>
