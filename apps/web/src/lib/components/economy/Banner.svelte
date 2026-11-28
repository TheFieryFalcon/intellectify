<script lang="ts">
  /**
   * A profile banner (SPEC §13.6, §13.8), in CSS and SVG; `null` is the plain default. Axiom banners have
   * their own art or a colorful style; shop banners are geometric patterns in the student's color (--accent).
   */
  import { styleOf } from "$lib/economy.svelte";

  let { id, name = "" }: { id: string | null; name?: string } = $props();
  const st = $derived(styleOf(id));
  const sets = Array.from({ length: 9 }, (_, i) => i);
  const colors = $derived(st?.colors ?? []);
  const grad = $derived(colors.join(", "));
  const uid = Math.random().toString(36).slice(2, 8);
  /** Pattern tile sizes, by geometric pattern. */
  const TILE: Record<string, [number, number]> = { hexagons: [28, 48.5], triangles: [30, 26], rings: [40, 40], chevrons: [32, 20], lattice: [20, 20], waves: [80, 16] };
  const stars = Array.from({ length: 60 }, (_, i) => ({ x: (i * 37.3) % 400, y: (i * 53.7) % 120, r: 0.4 + ((i * 7) % 5) / 6, d: (i % 9) * 0.4 }));
</script>

<div class="banner b-{id ?? 'default'} k-{st?.kind ?? 'art'} m-{st?.motion ?? 'none'}" style="--g: {grad}; --c0: {colors[0] ?? 'transparent'}; --c1: {colors[1] ?? colors[0] ?? 'transparent'}; --c2: {colors[2] ?? colors[1] ?? 'transparent'}; --c3: {colors[3] ?? colors[2] ?? 'transparent'}" aria-hidden="true">
  {#if id === "venn"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice"><circle class="c l" cx="170" cy="60" r="42" /><circle class="c r" cx="230" cy="60" r="42" /></svg>
  {:else if id === "union"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
      {#each sets as i (i)}<circle class="s" style="--i:{i}; --x:{40 + ((i * 97) % 320)}px; --y:{20 + ((i * 53) % 80)}px" cx="0" cy="0" r={8 + (i % 3) * 4} />{/each}
      <circle class="big" cx="200" cy="60" r="34" />
    </svg>
  {:else if id === "unreachable"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
      <g class="ladder"><line x1="180" y1="130" x2="196" y2="-10" /><line x1="220" y1="130" x2="204" y2="-10" />
        {#each [0, 1, 2, 3, 4, 5, 6, 7] as k (k)}<text x="200" y={118 - k * 17} font-size={14 - k}>ℵ<tspan font-size="7" dy="3">{k}</tspan></text>{/each}</g>
    </svg>
  {:else if id === "embedding"}
    <div class="nest"><div class="nest"><div class="nest"><span class="nm">{name}</span></div><span class="nm">{name}</span></div><span class="nm">{name}</span></div>
  {:else if st?.kind === "waves"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="none">
      {#each colors.slice(1) as col, i (i)}<path class="wave" style="--i:{i}" fill={col} d={`M0 ${55 + i * 18} ${Array.from({ length: 41 }, (_, k) => `L${k * 20} ${55 + i * 18 + Math.sin(k / 2 + i) * (10 - i * 2)}`).join(" ")} L800 120 L0 120 Z`} />{/each}
    </svg>
  {:else if st?.kind === "stars"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
      {#each stars as s, i (i)}<circle class="star" style="--d:{s.d}s" cx={s.x} cy={s.y} r={s.r} fill={colors[2] ?? "#fff"} />{/each}
    </svg>
  {:else if st?.kind === "geo"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="p-{uid}" patternUnits="userSpaceOnUse" width={TILE[st.pattern ?? "hexagons"]?.[0] ?? 28} height={TILE[st.pattern ?? "hexagons"]?.[1] ?? 48.5}>
          {#if st.pattern === "hexagons"}<path d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 32 L14 48.5" />
          {:else if st.pattern === "triangles"}<path class="fill" d="M0 26 L15 0 L30 26 Z" /><path d="M15 0 L30 26 M0 26 L15 0" />
          {:else if st.pattern === "rings"}<circle cx="20" cy="20" r="19" /><circle cx="0" cy="20" r="19" /><circle cx="40" cy="20" r="19" />
          {:else if st.pattern === "chevrons"}<path d="M0 4 L16 16 L32 4" />
          {:else if st.pattern === "lattice"}<path d="M0 10 L10 0 L20 10 L10 20 Z" />
          {:else if st.pattern === "waves"}<path d="M0 8 Q 20 0 40 8 T 80 8" />{/if}
        </pattern>
      </defs>
      {#if st.pattern === "concentric"}
        {#each Array.from({ length: 14 }, (_, i) => i) as i (i)}<circle class="ring" style="--i:{i}" cx="330" cy="60" r={12 + i * 18} />{/each}
      {:else}
        <rect class="geo-fill" width="400" height="120" fill="url(#p-{uid})" />
      {/if}
    </svg>
  {/if}
</div>

<style>
  .banner { position: relative; height: 100%; min-height: 120px; overflow: hidden; background: linear-gradient(135deg, var(--region), var(--accent-soft)); color: var(--accent); }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .k-art svg :is(circle, path, line), .k-geo svg :is(circle, path) { fill: none; stroke: currentColor; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
  .b-venn .c { fill: color-mix(in srgb, currentColor 12%, transparent); }
  .b-venn .l { animation: slideL 6s ease-in-out infinite; }
  .b-venn .r { animation: slideR 6s ease-in-out infinite; }
  @keyframes slideL { 0%, 15% { transform: translateX(-40px); } 45%, 70% { transform: translateX(30px); } 100% { transform: translateX(-40px); } }
  @keyframes slideR { 0%, 15% { transform: translateX(40px); } 45%, 70% { transform: translateX(-30px); } 100% { transform: translateX(40px); } }
  .b-union .s { transform: translate(var(--x), var(--y)); animation: gather 8s ease-in-out infinite; animation-delay: calc(var(--i) * -0.4s); }
  .b-union .big { opacity: 0; animation: appear 8s ease-in-out infinite; }
  @keyframes gather { 0%, 10% { transform: translate(var(--x), var(--y)); opacity: 1; } 60%, 75% { transform: translate(200px, 60px) scale(0.3); opacity: 0; } 100% { transform: translate(var(--x), var(--y)); opacity: 1; } }
  @keyframes appear { 0%, 50% { opacity: 0; } 65%, 80% { opacity: 1; } 100% { opacity: 0; } }
  .b-unreachable text { fill: currentColor; stroke: none; text-anchor: middle; font-family: var(--font-display); }
  .b-unreachable .ladder { animation: climb 10s linear infinite; }
  @keyframes climb { from { transform: translateY(0); } to { transform: translateY(-17px); } }
  .b-embedding { display: grid; place-items: center; }
  .nest { position: relative; border: 1px solid currentColor; border-radius: 6px; padding: 10% 14%; display: grid; place-items: center; width: 70%; height: 70%; }
  .banner > .nest { width: 82%; height: 76%; }
  .nm { position: absolute; left: 8px; bottom: 4px; font-family: var(--font-display); font-size: 12px; opacity: 0.8; white-space: nowrap; }
  .nest .nest .nm { font-size: 9px; }
  .nest .nest .nest .nm { font-size: 7px; }

  /* Colorful styles (Axiom banners). */
  .k-gradient { background: linear-gradient(120deg, var(--g)); background-size: 200% 200%; }
  .k-mesh { background: radial-gradient(circle at 20% 30%, var(--c1), transparent 55%), radial-gradient(circle at 80% 70%, var(--c2), transparent 50%), radial-gradient(circle at 60% 10%, var(--c3), transparent 45%), var(--c0); background-size: 160% 160%; }
  .k-waves { background: linear-gradient(180deg, var(--c0), var(--c0)); }
  .k-waves .wave { opacity: 0.85; }
  .k-stars { background: radial-gradient(ellipse at 50% 120%, var(--c1), var(--c0) 70%); }
  .k-stars .star { animation: tw 3s ease-in-out infinite; animation-delay: var(--d); }
  .k-stripes { background: repeating-linear-gradient(45deg, var(--c0) 0 14px, var(--c1) 14px 28px, var(--c2) 28px 42px); }
  .m-drift { animation: drift 14s ease-in-out infinite alternate; }
  .m-drift.k-waves .wave { animation: sway 9s ease-in-out infinite alternate; animation-delay: calc(var(--i) * -2s); }
  .m-shimmer::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%) -150% 0 / 60% 100% no-repeat; animation: shine 5s ease-in-out infinite; }
  @keyframes drift { from { background-position: 0% 30%; } to { background-position: 100% 70%; } }
  @keyframes sway { from { transform: translateX(0); } to { transform: translateX(-120px); } }
  @keyframes shine { 0%, 30% { background-position: -150% 0; } 100% { background-position: 250% 0; } }
  @keyframes tw { 50% { opacity: 0.2; } }

  /* Geometric shop banners: the student's color on a quiet ground. */
  .k-geo { background: color-mix(in srgb, var(--accent) 7%, var(--surface)); }
  .k-geo path, .k-geo circle { stroke-width: 1; opacity: 0.55; }
  .k-geo .fill { fill: color-mix(in srgb, currentColor 14%, transparent); stroke: none; }
  .k-geo .ring { opacity: calc(0.7 - var(--i) * 0.045); }
  @media (prefers-reduced-motion: reduce) { .banner, .banner *, .banner::after { animation: none !important; } }
</style>
