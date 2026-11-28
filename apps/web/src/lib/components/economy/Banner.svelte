<script lang="ts">
  /** A profile banner (SPEC §13.6, §13.8), in CSS and SVG; `null` is the plain default. */
  let { id, name = "" }: { id: string | null; name?: string } = $props();
  const sets = Array.from({ length: 9 }, (_, i) => i);
</script>

<div class="banner b-{id ?? 'default'}" aria-hidden="true">
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
  {:else if id === "tessellation"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice"><defs><pattern id="hex" width="28" height="48.5" patternUnits="userSpaceOnUse"><path d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 32 L14 48.5" /></pattern></defs><rect width="400" height="120" fill="url(#hex)" /></svg>
  {:else if id === "sine-waves"}
    <svg viewBox="0 0 400 120" preserveAspectRatio="none">
      {#each [1, 2, 3] as f (f)}<path class="w" style="--f:{f}" d={`M0 60 ${Array.from({ length: 81 }, (_, i) => `L${i * 10} ${60 + Math.sin((i * f) / 4) * (30 / f)}`).join(" ")}`} />{/each}
    </svg>
  {:else if id === "mandelbrot"}
    <svg viewBox="-2.2 -1.05 3 2.1" preserveAspectRatio="xMidYMid slice"><path class="m" d="M0.25 0 C0.3 0.45 -0.1 0.65 -0.4 0.6 C-0.55 0.58 -0.7 0.3 -0.75 0.12 C-0.85 0.2 -1.1 0.25 -1.25 0.1 C-1.4 0.1 -1.45 0 -1.25 -0.1 C-1.1 -0.25 -0.85 -0.2 -0.75 -0.12 C-0.7 -0.3 -0.55 -0.58 -0.4 -0.6 C-0.1 -0.65 0.3 -0.45 0.25 0 Z M-1.75 0 L-1.4 0" /><circle class="m" cx="-1.31" cy="0" r="0.06" /><circle class="m" cx="-0.12" cy="0.74" r="0.09" /><circle class="m" cx="-0.12" cy="-0.74" r="0.09" /></svg>
  {/if}
</div>

<style>
  .banner { position: relative; height: 100%; min-height: 120px; overflow: hidden; background: linear-gradient(135deg, var(--region), var(--accent-soft)); color: var(--accent); }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  svg :is(circle, path, line) { fill: none; stroke: currentColor; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
  .b-venn .c { fill: color-mix(in srgb, currentColor 12%, transparent); }
  .b-venn .l { animation: slideL 6s ease-in-out infinite; }
  .b-venn .r { animation: slideR 6s ease-in-out infinite; }
  @keyframes slideL { 0%, 15% { transform: translateX(-40px); } 45%, 70% { transform: translateX(30px); } 100% { transform: translateX(-40px); } }
  @keyframes slideR { 0%, 15% { transform: translateX(40px); } 45%, 70% { transform: translateX(-30px); } 100% { transform: translateX(40px); } }
  .b-union .s { transform: translate(var(--x), var(--y)); animation: gather 8s ease-in-out infinite; animation-delay: calc(var(--i) * -0.4s); }
  .b-union .big { opacity: 0; animation: appear 8s ease-in-out infinite; }
  @keyframes gather { 0%, 10% { transform: translate(var(--x), var(--y)); opacity: 1; } 60%, 75% { transform: translate(200px, 60px) scale(0.3); opacity: 0; } 100% { transform: translate(var(--x), var(--y)); opacity: 1; } }
  @keyframes appear { 0%, 50% { opacity: 0; } 65%, 80% { opacity: 1; } 100% { opacity: 0; } }
  .b-unreachable text { fill: currentColor; text-anchor: middle; font-family: var(--font-display); }
  .b-unreachable .ladder { animation: climb 10s linear infinite; }
  @keyframes climb { from { transform: translateY(0); } to { transform: translateY(-17px); } }
  .b-embedding { display: grid; place-items: center; }
  .nest { position: relative; border: 1px solid currentColor; border-radius: 6px; padding: 10% 14%; display: grid; place-items: center; width: 70%; height: 70%; }
  .banner > .nest { width: 82%; height: 76%; }
  .nm { position: absolute; left: 8px; bottom: 4px; font-family: var(--font-display); font-size: 12px; opacity: 0.8; white-space: nowrap; }
  .nest .nest .nm { font-size: 9px; }
  .nest .nest .nest .nm { font-size: 7px; }
  .b-tessellation path { stroke-width: 1; opacity: 0.5; }
  .b-sine-waves .w { opacity: 0.6; animation: wave calc(6s * var(--f)) linear infinite; }
  @keyframes wave { from { transform: translateX(0); } to { transform: translateX(-60px); } }
  .b-mandelbrot { background: linear-gradient(135deg, var(--surface), var(--region)); }
  .b-mandelbrot .m { stroke-width: 1.2; }
  @media (prefers-reduced-motion: reduce) { .banner * { animation: none !important; } }
</style>
