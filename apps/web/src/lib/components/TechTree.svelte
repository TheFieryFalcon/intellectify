<script lang="ts">
  import type { RankLevel } from "@intellectify/engine";
  import type { CourseProgress } from "$lib/backend";
  import type { CourseBundle } from "$lib/content";
  import type { Rollups } from "$lib/practice";
  import { RANK_LABEL, rankKey, rankVars, score } from "$lib/ranks";
  import { LABEL_W, layoutTree, NODE_W, REVIEW_SIZE, SHAPE_H, type LaidOutReview } from "$lib/treeLayout";
  import { styleOf } from "$lib/economy.svelte";

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

  /* Node themes (SPEC §13.6, §13.8): cosmetic only. Axiom themes have their own drawing or a palette;
     shop themes are geometric, in the student's color. */
  const tst = $derived(styleOf(theme));
  const themeClass = $derived(!theme ? "" : tst?.kind === "palette" ? `theme-palette theme-${theme} m-${tst.motion ?? "none"}` : tst?.kind === "geo" ? `theme-geo-${tst.pattern}` : `theme-${theme}`);
  const isDark = (hex: string) => {
    const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return 0.299 * v[0]! + 0.587 * v[1]! + 0.114 * v[2]! < 128;
  };
  // A palette theme is self-contained: it sets every color the map uses, so it looks the same on light and dark pages.
  const themeVars = $derived.by(() => {
    if (tst?.kind !== "palette" || !tst.colors) return "";
    const [bg, region, edge, label] = tst.colors as [string, string, string, string];
    const dark = isDark(bg);
    const ink = dark ? "#eef1ff" : "#1f2430";
    const muted = dark ? "#a9b3cf" : "#5b6170";
    return `--t0:${bg};--t1:${region};--t2:${edge};--t3:${label};--tink:${ink};--bg:${bg};--region:${region};--surface:${label};--unranked:${label};--ink:${ink};--muted:${muted};--edge:${edge};--line:color-mix(in srgb, ${edge} 35%, ${region});--track:color-mix(in srgb, ${edge} 30%, ${region});`;
  });
  const straightEdges = $derived(theme === "hasse" || (tst?.kind === "geo" && tst.pattern === "lattice"));
  /** Supercompact: every node starts folded into the map's center. */
  const center = $derived({ x: layout.width / 2, y: layout.height / 2 });
  /** Hasse and Lattice: every curve segment becomes a straight line between its ends, so paths keep their routing. */
  const straight = (d: string) =>
    // Edges routed across sections (several curves) keep their curves, so no line cuts through other sections.
    (d.match(/[CSQ]/gi)?.length ?? 0) > 1 ? d : d.replace(/([CSQ])([^MLCSQZ]*)/gi, (_m, cmd: string, args: string) => {
      const n = args.trim().split(/[\s,]+/).filter(Boolean);
      const per = /c/i.test(cmd) ? 6 : 4;
      const out: string[] = [];
      for (let i = 0; i + per <= n.length; i += per) out.push(`${cmd === cmd.toLowerCase() ? "l" : "L"}${n[i + per - 2]} ${n[i + per - 1]}`);
      return out.join(" ") + " ";
    }) ;
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
  /** Well-Founded: each section stands on its own strip of ground, with roots under the skills nothing builds on. */
  const ground = $derived(theme === "well-founded" ? layout.regions : []);
  const roots = $derived.by(() => {
    if (theme !== "well-founded") return [];
    const out: { x: number; y: number; floor: number }[] = [];
    for (const s of skills) {
      if (dependents.get(s.id)?.length) continue;
      const n = layout.nodes.get(s.id);
      const r = n && layout.regions.find((g) => n.x >= g.x && n.x <= g.x + g.w && n.y >= g.y && n.y <= g.y + g.h);
      if (n && r) out.push({ x: n.x + NODE_W / 2, y: n.y, floor: r.y + r.h + 2 });
    }
    return out;
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
  <div class="map {themeClass}" class:focus={!!chain} style="width:{layout.width}px;height:{layout.height}px;{themeVars}">
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
            {" "}({RANK_LABEL[rollups.units[Number(h.text.split(" ")[1])]!.rank]}){/if}
        </text>
      {/each}
      {#each layout.edges as e (e.from + e.to)}
        <path d={straightEdges ? straight(e.d) : e.d} class:hidden={e.hidden} class:lit={edgeLit(e.from, e.to)} class:branch={branch.has(e.from) && branch.has(e.to)} />
      {/each}
      {#each ground as g (g.id)}
        <rect class="earth" x={g.x + 6} y={g.y + g.h + 2} width={g.w - 12} height="12" rx="3" />
        <line class="ground" x1={g.x + 6} y1={g.y + g.h + 2} x2={g.x + g.w - 6} y2={g.y + g.h + 2} />
      {/each}
      {#each roots as r, i (i)}
        <path class="root" d="M{r.x} {r.floor} c -2 3, -6 6, -11 9 M{r.x} {r.floor} c 2 3, 5 6, 10 9 M{r.x} {r.floor} l 0.5 10" />
      {/each}
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
        style="left:{n.x}px;top:{n.y}px;width:{NODE_W}px;{rankVars(st.rank, st.theta)};--fx:{center.x - n.x - NODE_W / 2}px;--fy:{center.y - n.y}px"
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
  /* Well-Founded (Regularity): every section stands on its own strip of ground, roots under its last skills. */
  .theme-well-founded .earth { fill: color-mix(in srgb, var(--ink) 7%, transparent); }
  .theme-well-founded .ground { stroke: color-mix(in srgb, var(--ink) 70%, transparent); stroke-width: 1.5; }
  .theme-well-founded .root { fill: none; stroke: color-mix(in srgb, var(--ink) 45%, transparent); stroke-width: 1.2; stroke-linecap: round; }
  /* Hasse (Power Set): straight lattice lines, every node a hollow point. */
  .theme-hasse .region { fill: none; stroke: var(--line); stroke-dasharray: 2 4; }
  .theme-hasse .edges path:not(.hidden) { stroke: var(--ink); stroke-width: 1.2; opacity: 0.75; }
  .theme-hasse .ring { box-shadow: 0 0 0 3px var(--bg), 0 0 0 4.5px var(--ink); }
  .theme-hasse .label { background: var(--bg); box-shadow: 0 0 0 2px var(--bg); }
  /* Tree Property (Weakly Compact): one unbroken branch glows from the root to the top; the rest recede. */
  .theme-tree-property .edges path:not(.hidden) { opacity: 0.45; }
  .theme-tree-property .edges path.branch:not(.hidden) { opacity: 1; stroke: var(--gold); stroke-width: 3.5; filter: drop-shadow(0 0 5px var(--gold)); }
  .theme-tree-property .node:not(.branch) { opacity: 0.7; }
  .theme-tree-property .node.branch .ring { box-shadow: 0 0 0 3px var(--region), 0 0 14px 5px var(--gold); }
  .theme-tree-property .node.branch .label { font-weight: 600; }
  /* Supercompact: the whole tree folds into one point and unfolds when the map opens. */
  .theme-supercompact .region { fill: color-mix(in srgb, var(--accent) 5%, var(--region)); }
  .theme-supercompact .ring { box-shadow: 0 0 0 3px var(--region), 0 0 0 4px color-mix(in srgb, var(--accent) 40%, transparent); }
  .theme-supercompact .node { animation: unfold 1.4s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
  .theme-supercompact .edges path:not(.hidden), .theme-supercompact .region, .theme-supercompact text { animation: appear 1.4s ease-out both; }
  @keyframes unfold { from { transform: translate(var(--fx), var(--fy)) scale(0.05) rotate(-180deg); opacity: 0; } 35% { opacity: 1; } }
  @keyframes appear { 0%, 55% { opacity: 0; } }

  /* Palettes (Axiom themes): a self-contained panel (the variables above set every color inside it). */
  .theme-palette { background: var(--t0); border-radius: 14px; box-shadow: 0 0 0 8px var(--t0); }
  .theme-palette .edges path:not(.hidden) { stroke: var(--t2); stroke-width: 1.6; }
  .theme-palette :is(.region-label, .year, .unit) { fill: var(--tink); opacity: 0.75; }
  .theme-palette .node, .theme-palette .review { color: var(--tink); }
  .theme-palette .label { background: var(--t3); box-shadow: 0 0 0 2px var(--t3); }
  .theme-palette.m-glow .edges path:not(.hidden) { filter: drop-shadow(0 0 3px color-mix(in srgb, var(--t2) 80%, transparent)); }
  .theme-palette.m-glow .ring { box-shadow: 0 0 0 3px var(--t1), 0 0 10px 1px color-mix(in srgb, var(--t2) 55%, transparent); }
  /* Gilded (Huge): ivory leaves, hairline gold rules, serif lettering. */
  .theme-gilded-map .region { stroke: #c9a24a; stroke-width: 1; }
  .theme-gilded-map .edges path:not(.hidden) { stroke-width: 1.3; }
  .theme-gilded-map .ring { box-shadow: 0 0 0 3px var(--t1), 0 0 0 4px #c9a24a; }
  .theme-gilded-map .label { font-family: var(--font-display); font-size: 12px; color: #3b2f1c; }
  .theme-gilded-map :is(.region-label, .unit) { fill: #8a6a1f; opacity: 1; font-variant: small-caps; letter-spacing: 0.04em; }
  .theme-gilded-map .year { fill: #8a6a1f; opacity: 1; }
  /* Geometric shop themes, in the student's color. */
  .theme-geo-outline .region { fill: none; stroke: color-mix(in srgb, var(--accent) 35%, var(--line)); }
  .theme-geo-outline .edges path:not(.hidden) { stroke: var(--accent); stroke-width: 1; }
  .theme-geo-outline .disc { background: var(--bg); color: var(--ink); border: 2px solid var(--r); }
  .theme-geo-outline .label { background: var(--bg); box-shadow: 0 0 0 2px var(--bg); }
  .theme-geo-bold .edges path:not(.hidden) { stroke: var(--accent); stroke-width: 3.5; stroke-linecap: round; }
  .theme-geo-bold .ring { box-shadow: 0 0 0 3px var(--region), 0 0 0 5px var(--accent); }
  .theme-geo-dotted { background: radial-gradient(color-mix(in srgb, var(--accent) 35%, transparent) 1px, transparent 1.2px) 0 0 / 14px 14px; }
  .theme-geo-dotted .region { fill: color-mix(in srgb, var(--region) 85%, transparent); }
  .theme-geo-dotted .edges path:not(.hidden) { stroke: var(--accent); stroke-width: 2.4; stroke-dasharray: 0.1 6; stroke-linecap: round; }
  .theme-geo-lattice .region { fill: none; stroke: var(--line); }
  .theme-geo-lattice .edges path:not(.hidden) { stroke: var(--accent); stroke-width: 1.3; }
  .theme-geo-lattice .ring, .theme-geo-lattice .disc { border-radius: 4px; }
  .theme-geo-glow .edges path:not(.hidden) { stroke: var(--accent); stroke-width: 1.8; filter: drop-shadow(0 0 4px var(--accent)); }
  .theme-geo-glow .ring { box-shadow: 0 0 0 3px var(--region), 0 0 14px 3px color-mix(in srgb, var(--accent) 60%, transparent); }
  @media (prefers-reduced-motion: reduce) { .theme-supercompact .node, .theme-supercompact .edges path:not(.hidden), .theme-supercompact .region, .theme-supercompact text { animation: none; } }
  .label { font-size: 11px; line-height: 14.5px; padding: 0 3px; border-radius: 4px; background: var(--region); box-shadow: 0 0 0 2px var(--region); }
</style>
