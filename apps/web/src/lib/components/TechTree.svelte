<script lang="ts">
  import type { RankLevel } from "@intellectify/engine";
  import type { CourseProgress } from "$lib/backend";
  import type { CourseBundle } from "$lib/content";
  import type { Rollups } from "$lib/practice";
  import { RANK_LABEL, rankKey, rankVars, score } from "$lib/ranks";
  import { LABEL_W, layoutTree, NODE_W, REVIEW_SIZE, SHAPE_H, type LaidOutReview } from "$lib/treeLayout";

  let {
    course,
    progress,
    rollups,
    challengeBest = {},
    readonly = false,
    theme = null,
  }: { course: CourseBundle; progress: CourseProgress; rollups: Rollups; challengeBest?: Record<string, number>; readonly?: boolean; theme?: string | null } = $props();

  const sectionName = (id: string) => course.units.flatMap((u) => u.sections).find((s) => s.id === id)?.name ?? id;
  const reviewHref = (r: LaidOutReview) =>
    r.kind === "challenge" ? `/${course.id}/challenge/${r.id}` : r.kind === "unit-quiz" ? `/${course.id}/quiz/unit/${r.id}` : `/${course.id}/quiz/section/${r.id}`;
  const reviewLabel = (r: LaidOutReview) => (r.kind === "challenge" ? "Challenge" : r.kind === "unit-quiz" ? `Unit ${r.id} quiz` : "Quiz");
  const reviewAria = (r: LaidOutReview) =>
    r.kind === "challenge" ? `Section Challenge: ${sectionName(r.id)}` : r.kind === "unit-quiz" ? `Unit ${r.id} quiz` : `Section quiz: ${sectionName(r.id)}`;

  const layout = $derived(layoutTree(course));
  const skills = $derived(course.units.flatMap((u) => u.sections.flatMap((s) => s.skills)));
  const prereqs = $derived(new Map(skills.map((s) => [s.id, s.prereqs])));
  const dependents = $derived.by(() => {
    const m = new Map<string, string[]>();
    for (const s of skills) for (const p of s.prereqs) m.set(p, [...(m.get(p) ?? []), s.id]);
    return m;
  });

  /* Node themes (SPEC §13.6, §13.8): cosmetic only. */
  /** Hasse: edges as straight lattice lines between their ends. */
  const straight = (d: string) => {
    const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    return nums.length >= 4 ? `M${nums[0]} ${nums[1]} L${nums.at(-2)} ${nums.at(-1)}` : d;
  };
  /** Tree Property: one unbroken branch, the longest chain of prerequisites. */
  const branch = $derived.by(() => {
    if (theme !== "tree-property") return new Set<string>();
    const memo = new Map<string, string[]>();
    const longest = (id: string): string[] => {
      if (memo.has(id)) return memo.get(id)!;
      memo.set(id, [id]);
      let best: string[] = [];
      for (const p of prereqs.get(id) ?? []) if (prereqs.has(p)) { const c = longest(p); if (c.length > best.length) best = c; }
      const out = [...best, id];
      memo.set(id, out);
      return out;
    };
    let top: string[] = [];
    for (const s of skills) { const c = longest(s.id); if (c.length > top.length) top = c; }
    return new Set(top);
  });
  /** Well-Founded: roots under the skills with no prerequisites. */
  const roots = $derived(theme === "well-founded" ? skills.filter((s) => !s.prereqs.some((p) => prereqs.has(p))).map((s) => layout.nodes.get(s.id)!).filter(Boolean) : []);

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
  <div class="map {theme ? `theme-${theme}` : ''}" class:focus={!!chain} style="width:{layout.width}px;height:{layout.height + (theme === 'well-founded' ? 40 : 0)}px">
    <svg class="edges" width={layout.width} height={layout.height} aria-hidden="true">
      {#each layout.regions as r (r.id)}
        <rect class="region" x={r.x} y={r.y} width={r.w} height={r.h} rx="18" />
        <text class="region-label" x={r.x + 14} y={r.y + 20}>
          {r.name}
          {#if rollups.sections[r.id]?.rank}({RANK_LABEL[rollups.sections[r.id]!.rank]}){/if}
        </text>
      {/each}
      {#each layout.headers as h, i (i)}
        <text class={h.kind} x={h.x} y={h.y + (h.kind === "year" ? 22 : 18)}>
          {h.text}{#if h.kind === "unit" && rollups.units[Number(h.text.split(" ")[1])]?.rank}
            ({RANK_LABEL[rollups.units[Number(h.text.split(" ")[1])]!.rank]}){/if}
        </text>
      {/each}
      {#each layout.edges as e (e.from + e.to)}
        <path d={theme === "hasse" ? straight(e.d) : e.d} class:hidden={e.hidden} class:lit={edgeLit(e.from, e.to)} class:branch={branch.has(e.from) && branch.has(e.to)} />
      {/each}
      {#if theme === "well-founded"}
        <line class="ground" x1="0" y1={layout.height + 24} x2={layout.width} y2={layout.height + 24} />
        {#each roots as n, i (i)}<path class="root" d="M{n.x + NODE_W / 2} {n.y + 46} q -6 {12 + (i % 3) * 4} -14 {20 + (i % 2) * 6} M{n.x + NODE_W / 2} {n.y + 46} q 5 {14 + (i % 2) * 5} 12 {22 + (i % 3) * 4}" />{/each}
      {/if}
    </svg>

    {#each readonly ? [] : layout.reviews as r (r.kind + r.id)}
      {@const best = r.kind === "challenge" ? challengeBest[r.id] : undefined}
      <a
        class="review {r.kind}"
        href={reviewHref(r)}
        style="left:{r.cx - NODE_W / 2}px;top:{r.cy - REVIEW_SIZE / 2}px;width:{NODE_W}px"
        aria-label="{reviewAria(r)}{best !== undefined && best >= 0 ? `, best ${Math.round(best * 100)}%` : ''}"
      >
        <span class="tile" aria-hidden="true">
          {#if r.kind === "challenge"}
            <svg viewBox="0 0 24 24"><path d="M3 19 L9.5 8 L13 13.5 L15.5 10 L21 19 Z" /><path class="flag" d="M9.5 8 V3.5 L13 4.8 L9.5 6.1" /></svg>
          {:else if r.kind === "unit-quiz"}
            <svg viewBox="0 0 24 24"><path d="M12 3.2 L14.6 8.6 L20.5 9.4 L16.2 13.5 L17.3 19.4 L12 16.6 L6.7 19.4 L7.8 13.5 L3.5 9.4 L9.4 8.6 Z" /></svg>
          {:else}
            <svg viewBox="0 0 24 24"><path class="line" d="M10 7 H19 M10 12 H19 M10 17 H19" /><path class="tick" d="M4 7 L5.5 8.5 L8 5.5 M4 12 L5.5 13.5 L8 10.5 M4 17 L5.5 18.5 L8 15.5" /></svg>
          {/if}
        </span>
        <span class="label">{reviewLabel(r)}{#if best !== undefined && best >= 0}<span class="best"> {Math.round(best * 100)}%</span>{/if}</span>
      </a>
    {/each}

    {#each skills as s (s.id)}
      {@const n = layout.nodes.get(s.id)!}
      {@const st = stateOf(s.id)}
      <a
        class="node {rankKey(st.rank)} size-{s.size}"
        class:lit={chain?.all.has(s.id)}
        class:branch={branch.has(s.id)}
        href={readonly ? undefined : `/${course.id}/skill/${s.id}`}
        tabindex={readonly ? 0 : undefined}
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
  /* Phones: the map scrolls edge to edge, so wide units aren't cut off at the gutter. */
  @media (max-width: 640px) { .scroll { margin: 0 -16px; padding: 0 16px 8px; } }
  .map { position: relative; margin: 0 auto; }
  svg.edges { position: absolute; inset: 0; overflow: visible; }
  .region { fill: var(--region); }
  .region-label { fill: var(--muted); font-size: 11.5px; font-weight: 500; }
  .year { fill: var(--muted); font-family: var(--font-display); font-size: 16px; }
  .unit { fill: var(--muted); font-size: 12px; font-weight: 600; }
  .edges path { fill: none; stroke: var(--edge); stroke-width: 1.3; stroke-linecap: round; transition: opacity 0.15s, stroke 0.15s; }
  .edges path.hidden { opacity: 0; }
  .edges path.lit { stroke: var(--accent); stroke-width: 1.6; opacity: 1; }
  .map.focus .edges path:not(.lit) { opacity: 0.12; }
  .map.focus .edges path.hidden:not(.lit) { opacity: 0; }

  .node { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; text-decoration: none; color: var(--ink); transition: opacity 0.15s; }
  .map.focus .node:not(.lit) { opacity: 0.3; }
  /* Shape by skill size (SPEC §16.2): small circle, medium circle, small diamond (large), large diamond (cornerstone). */
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
  /* Reviews (SPEC §8): a quiz tile, a summit for the Challenge, a star badge for the unit quiz. */
  .review { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; color: var(--ink); transition: opacity 0.15s; }
  .map.focus .review { opacity: 0.3; }
  .tile { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; background: var(--surface); border: 1.5px solid var(--edge); box-shadow: 0 0 0 3px var(--region); transition: transform 0.15s, border-color 0.15s; }
  .tile svg { width: 22px; height: 22px; fill: none; stroke: var(--muted); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .section-quiz .tick { stroke: var(--accent); }
  .challenge .tile { background: #1f2a3d; border-color: #1f2a3d; }
  .challenge .tile svg path { fill: #e8edf5; stroke: #e8edf5; stroke-width: 1.2; }
  .challenge .tile svg .flag { fill: #e5484d; stroke: #e5484d; }
  .unit-quiz .tile { width: 44px; height: 44px; border-radius: 50%; background: var(--accent-soft); border-color: var(--accent); }
  .unit-quiz .tile svg path { fill: var(--accent); stroke: var(--accent); stroke-width: 1; }
  .review:hover .tile { transform: scale(1.08); border-color: var(--accent); }
  .review:focus-visible { outline: none; }
  .review:focus-visible .tile { outline: 2px solid var(--accent); outline-offset: 3px; }
  .best { color: var(--muted); font-variant-numeric: tabular-nums; }
  /* Node themes. */
  .theme-well-founded .ground { stroke: var(--ink); stroke-width: 1.5; }
  .theme-well-founded .root { fill: none; stroke: var(--muted); stroke-width: 1; }
  .theme-hasse .edges path { stroke-dasharray: none; stroke-width: 1; stroke: var(--muted); }
  .theme-hasse .ring { box-shadow: 0 0 0 3px var(--region), 0 0 0 4px var(--muted); }
  .theme-tree-property .edges path.branch { stroke: var(--gold); stroke-width: 3; filter: drop-shadow(0 0 4px var(--gold)); }
  .theme-tree-property .node.branch .ring { box-shadow: 0 0 0 3px var(--region), 0 0 10px 3px var(--gold); }
  .theme-supercompact { animation: unfold 1.1s cubic-bezier(0.2, 0.9, 0.3, 1) both; transform-origin: 50% 50%; }
  @keyframes unfold { from { transform: scale(0.01); opacity: 0; } 30% { opacity: 1; } }
  .theme-chalk .edges path { stroke: color-mix(in srgb, var(--ink) 55%, transparent); stroke-width: 2.2; stroke-dasharray: 7 2 1 2; stroke-linecap: round; }
  .theme-chalk .disc { border-style: dashed; }
  .theme-blueprint { background: #1f3f6e linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 20px 20px; border-radius: 12px; }
  .theme-blueprint .region { fill: rgba(255, 255, 255, 0.05); stroke: rgba(255, 255, 255, 0.4); stroke-dasharray: 4 3; }
  .theme-blueprint .edges path { stroke: #e8f1ff; }
  .theme-blueprint :is(.region-label, .year, .unit) { fill: #cfe0f7; }
  .theme-blueprint .label { background: #1f3f6e; box-shadow: 0 0 0 2px #1f3f6e; color: #eef4ff; }
  .theme-blueprint .ring { box-shadow: 0 0 0 3px #1f3f6e; }
  .theme-stained-glass .edges path { stroke: #2b2b2b; stroke-width: 3.5; }
  .theme-stained-glass .disc { border: 2px solid #2b2b2b; background: linear-gradient(160deg, color-mix(in srgb, var(--r) 70%, #fff) -10%, var(--r) 50%, color-mix(in srgb, var(--r) 60%, #6a2bd9) 100%); }
  .theme-stained-glass .ring { box-shadow: 0 0 0 3px #2b2b2b; }
  @media (prefers-reduced-motion: reduce) { .theme-supercompact { animation: none; } }
  .label { font-size: 11px; line-height: 14.5px; padding: 0 3px; border-radius: 4px; background: var(--region); box-shadow: 0 0 0 2px var(--region); }
</style>
