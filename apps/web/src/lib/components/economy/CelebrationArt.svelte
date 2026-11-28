<script lang="ts">
  /**
   * One answer celebration (SPEC §13.6, §13.8), drawn in CSS and SVG. `inline` draws it in a preview box
   * instead of over the page. Reduced motion shows the last frame, still.
   */
  let { id, inline = false }: { id: string; inline?: boolean } = $props();
  const symbols = ["x", "=", "2", "π", "√", "3"];
  const fib = [1, 1, 2, 3, 5, 8];
  const cx = [0, 1, 1, 0, -1, -1];
</script>

<div class="fx {id}" class:inline class:huge={id === "huge"} aria-hidden="true">
  {#if id === "pair"}
    <span class="spark a"></span><span class="spark b"></span><span class="flash"></span>
  {:else if id === "image"}
    <div class="map">
      {#each symbols as s, i (i)}
        <span class="sym" style="--i:{i}">{s}</span>
        <span class="star" style="--i:{i}">✦</span>
      {/each}
    </div>
  {:else if id === "banach-tarski"}
    <svg viewBox="-60 -40 120 80">
      {#each [0, 1, 2, 3, 4] as k (k)}
        <path class="piece" style="--k:{k}; --sx:{(k - 2) * 9}px; --sy:{(k % 2) * 20 - 10}px; --ex:{(k % 2) * 56 - 28}px" d="M0 0 L {22 * Math.cos((k * 2 * Math.PI) / 5)} {22 * Math.sin((k * 2 * Math.PI) / 5)} A 22 22 0 0 1 {22 * Math.cos(((k + 1) * 2 * Math.PI) / 5)} {22 * Math.sin(((k + 1) * 2 * Math.PI) / 5)} Z" />
      {/each}
      <circle class="twin" cx="-28" r="20" /><circle class="twin" cx="28" r="20" />
    </svg>
  {:else if id === "ultrafilter"}
    <svg viewBox="-60 -50 120 100">
      {#each [44, 34, 25, 17, 10] as r, i (r)}<ellipse class="ring" style="--i:{i}" cx="0" cy={-30 + i * 14} rx={r} ry={r / 4} />{/each}
      <path class="beam" d="M-40 -46 L 40 -46 L 4 44 L -4 44 Z" />
    </svg>
  {:else if id === "huge"}
    <span class="sun"></span>
    {#each Array.from({ length: 16 }, (_, i) => i) as i (i)}<span class="ray" style="--i:{i}"></span>{/each}
  {:else if id === "chalk-dust"}
    {#each Array.from({ length: 18 }, (_, i) => i) as i (i)}<span class="dust" style="--i:{i}; --dx:{((i * 37) % 21) - 10}; --s:{4 + (i % 4)}"></span>{/each}
  {:else if id === "ripple"}
    {#each [0, 1, 2] as i (i)}<span class="ring" style="--i:{i}"></span>{/each}
  {:else if id === "fibonacci"}
    <svg viewBox="-14 -10 28 20">
      {#each fib as n, i (i)}
        <rect class="sq" style="--i:{i}" x={cx[i]! * 2 - n / 2} y={(i % 3) - 1 - n / 2} width={n} height={n} />
      {/each}
      <path class="spiral" d="M0 0 a1 1 0 0 1 1 1 a2 2 0 0 1 -2 2 a3 3 0 0 1 -3 -3 a5 5 0 0 1 5 -5 a8 8 0 0 1 8 8" />
    </svg>
  {:else}
    <span class="spark a"></span>
  {/if}
</div>

<style>
  .fx { position: fixed; inset: 0; z-index: 35; display: grid; place-items: center; pointer-events: none; color: var(--accent); }
  .fx.inline { position: relative; inset: auto; height: 160px; z-index: auto; overflow: hidden; }
  .fx > * { grid-area: 1 / 1; }
  svg { width: 220px; height: auto; overflow: visible; }

  /* Pair: two sparks spiral together into one. */
  .spark { width: 12px; height: 12px; border-radius: 50%; background: currentColor; box-shadow: 0 0 16px currentColor; }
  .pair .a { animation: orbitA 1.2s ease-in forwards; }
  .pair .b { animation: orbitB 1.2s ease-in forwards; }
  .flash { width: 18px; height: 18px; border-radius: 50%; background: currentColor; box-shadow: 0 0 40px 10px currentColor; opacity: 0; animation: flash 1.6s ease-out forwards; }
  @keyframes orbitA { 0% { transform: rotate(0deg) translateX(80px); } 100% { transform: rotate(540deg) translateX(0); } }
  @keyframes orbitB { 0% { transform: rotate(180deg) translateX(80px); } 100% { transform: rotate(720deg) translateX(0); } }
  @keyframes flash { 0%, 70% { opacity: 0; transform: scale(0.4); } 80% { opacity: 1; transform: scale(1.4); } 100% { opacity: 0; transform: scale(2); } }

  /* Image: each symbol maps, one to one, onto a star. */
  .map { display: grid; grid-template-columns: repeat(6, 28px); grid-template-rows: 28px 60px 28px; font-family: var(--font-display); font-size: 22px; text-align: center; }
  .sym { grid-row: 1; grid-column: calc(var(--i) + 1); color: var(--ink); animation: fadeOut 1.6s ease forwards; animation-delay: calc(var(--i) * 0.08s); }
  .star { grid-row: 3; grid-column: calc(var(--i) + 1); opacity: 0; animation: drop 1.6s ease forwards; animation-delay: calc(var(--i) * 0.08s); }
  @keyframes fadeOut { 0%, 30% { opacity: 1; } 100% { opacity: 0.15; } }
  @keyframes drop { 0% { opacity: 0; transform: translateY(-88px) scale(0.5); } 50% { opacity: 1; } 100% { opacity: 1; transform: none; } }

  /* Banach–Tarski: a sphere splits into pieces that reassemble into two. */
  .piece { fill: color-mix(in srgb, currentColor 30%, transparent); stroke: currentColor; stroke-width: 0.8; animation: split 1.8s ease-in-out forwards; animation-delay: calc(var(--k) * 0.04s); }
  .twin { fill: none; stroke: currentColor; stroke-width: 1; opacity: 0; animation: twin 1.8s ease forwards; }
  @keyframes split { 0% { transform: none; opacity: 1; } 40% { transform: translate(var(--sx), var(--sy)) rotate(40deg); opacity: 1; } 80%, 100% { transform: translate(var(--ex), 0) scale(0.9); opacity: 0; } }
  @keyframes twin { 0%, 60% { opacity: 0; } 100% { opacity: 1; } }

  /* Ultrafilter: light pours down through a funnel of nested sets. */
  .ring { fill: none; stroke: currentColor; stroke-width: 1; opacity: 0; animation: ringIn 1.6s ease forwards; animation-delay: calc(var(--i) * 0.12s); }
  .beam { fill: color-mix(in srgb, currentColor 22%, transparent); transform-origin: 0 -46px; transform: scaleY(0); animation: pour 1.6s ease-in forwards 0.5s; }
  @keyframes ringIn { to { opacity: 0.9; } }
  @keyframes pour { to { transform: scaleY(1); } }

  /* Huge: the celebration fills the whole screen. */
  .huge { background: radial-gradient(circle, color-mix(in srgb, currentColor 30%, transparent), transparent 70%); animation: hugeBg 2s ease-out forwards; }
  .sun { width: 30vmin; height: 30vmin; border-radius: 50%; background: radial-gradient(circle, #fff, currentColor 60%, transparent 70%); animation: grow 2s ease-out forwards; }
  .ray { width: 4px; height: 120vmax; background: linear-gradient(transparent, color-mix(in srgb, currentColor 40%, transparent), transparent); transform: rotate(calc(var(--i) * 22.5deg)) scaleY(0); animation: rays 2s ease-out forwards; }
  @keyframes hugeBg { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes grow { 0% { transform: scale(0); } 50% { transform: scale(2.5); opacity: 1; } 100% { transform: scale(4); opacity: 0; } }
  @keyframes rays { 0% { transform: rotate(calc(var(--i) * 22.5deg)) scaleY(0); } 60% { transform: rotate(calc(var(--i) * 22.5deg)) scaleY(1); opacity: 1; } 100% { transform: rotate(calc(var(--i) * 22.5deg + 20deg)) scaleY(1); opacity: 0; } }

  /* Chalk dust: a puff drifts up from the answer. */
  .dust { width: calc(var(--s) * 1px); height: calc(var(--s) * 1px); border-radius: 50%; background: color-mix(in srgb, var(--ink) 30%, white); opacity: 0; animation: puff 1.6s ease-out forwards; animation-delay: calc(var(--i) * 0.03s); }
  @keyframes puff { 0% { opacity: 0.9; transform: translate(0, 30px); } 100% { opacity: 0; transform: translate(calc(var(--dx) * 8px), -90px) scale(2.5); } }

  /* Ripple: concentric rings spread out. */
  .ripple .ring { width: 40px; height: 40px; border-radius: 50%; border: 2px solid currentColor; opacity: 0; animation: ripple 1.5s ease-out forwards; animation-delay: calc(var(--i) * 0.22s); }
  @keyframes ripple { 0% { opacity: 0.9; transform: scale(0.3); } 100% { opacity: 0; transform: scale(6); } }

  /* Fibonacci: squares of 1, 1, 2, 3, 5, 8 spiral outward and fade. */
  .sq { fill: color-mix(in srgb, currentColor 10%, transparent); stroke: currentColor; stroke-width: 0.2; opacity: 0; animation: sq 1.8s ease forwards; animation-delay: calc(var(--i) * 0.15s); }
  .spiral { fill: none; stroke: currentColor; stroke-width: 0.35; stroke-dasharray: 60; stroke-dashoffset: 60; animation: draw 1.8s ease forwards 0.3s; }
  @keyframes sq { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
  @keyframes draw { to { stroke-dashoffset: 0; } }

  .fx:not(.inline) { animation: life 2.2s linear forwards; }
  @keyframes life { 0%, 85% { opacity: 1; } 100% { opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    .fx *, .fx { animation-duration: 0.001s !important; animation-delay: 0s !important; }
    .fx:not(.inline) { animation: none; opacity: 0; }
  }
</style>
