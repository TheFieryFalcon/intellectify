<script lang="ts">
  /**
   * One answer celebration (SPEC §13.6, §13.8), drawn in CSS and SVG. Axiom celebrations have their own art
   * or a colorful style; shop celebrations are geometric, in the student's color (--accent). `inline` draws
   * it in a preview box instead of over the page. Reduced motion shows nothing moving.
   */
  import { styleOf } from "$lib/economy.svelte";

  let { id, inline = false }: { id: string; inline?: boolean } = $props();
  const st = $derived(styleOf(id));
  const colors = $derived(st?.colors?.length ? st.colors : ["var(--accent)"]);
  const kind = $derived(st?.kind === "geo" ? `geo-${st.pattern}` : (st?.kind ?? id));
  const symbols = ["x", "=", "2", "π", "√", "3"];
  // Deterministic scatter: particle i gets fixed offsets, so every play looks the same.
  const N = Array.from({ length: 28 }, (_, i) => ({ i, x: ((i * 37) % 100) - 50, y: ((i * 53) % 100) - 50, r: (i * 47) % 360, d: (i % 7) * 0.06, s: 0.6 + ((i * 13) % 10) / 10 }));
  const col = (i: number) => colors[i % colors.length];
</script>

<div class="fx k-{kind}" class:inline aria-hidden="true">
  {#if kind === "pair"}
    <span class="spark a"></span><span class="spark b"></span><span class="flash"></span>
  {:else if kind === "image"}
    <div class="map">
      {#each symbols as s, i (i)}
        <span class="sym" style="--i:{i}">{s}</span>
        <span class="star" style="--i:{i}">✦</span>
      {/each}
    </div>
  {:else if kind === "banach-tarski"}
    <svg viewBox="-60 -40 120 80">
      {#each [0, 1, 2, 3, 4] as k (k)}
        <path class="piece" style="--k:{k}; --sx:{(k - 2) * 9}px; --sy:{(k % 2) * 20 - 10}px; --ex:{(k % 2) * 56 - 28}px" d="M0 0 L {22 * Math.cos((k * 2 * Math.PI) / 5)} {22 * Math.sin((k * 2 * Math.PI) / 5)} A 22 22 0 0 1 {22 * Math.cos(((k + 1) * 2 * Math.PI) / 5)} {22 * Math.sin(((k + 1) * 2 * Math.PI) / 5)} Z" />
      {/each}
      <circle class="twin" cx="-28" r="20" /><circle class="twin" cx="28" r="20" />
    </svg>
  {:else if kind === "ultrafilter"}
    <svg viewBox="-60 -50 120 100">
      {#each [44, 34, 25, 17, 10] as r, i (r)}<ellipse class="ring" style="--i:{i}" cx="0" cy={-30 + i * 14} rx={r} ry={r / 4} />{/each}
      <path class="beam" d="M-40 -46 L 40 -46 L 4 44 L -4 44 Z" />
    </svg>
  {:else if kind === "huge"}
    <span class="wash"></span>
    <span class="core"></span>
    {#each Array.from({ length: 24 }, (_, i) => i) as i (i)}<span class="ray" style="--i:{i}"></span>{/each}
    {#each [0, 1, 2] as i (i)}<span class="shock" style="--i:{i}"></span>{/each}
  {:else if kind === "confetti"}
    {#each N as p (p.i)}<span class="bit" style="--x:{p.x}; --r:{p.r}deg; --d:{p.d}s; --s:{p.s}; background:{col(p.i)}"></span>{/each}
  {:else if kind === "sparkles"}
    {#each N.slice(0, 16) as p (p.i)}<span class="spk" style="--x:{p.x}; --y:{p.y}; --d:{p.d * 2}s; color:{col(p.i)}">✦</span>{/each}
  {:else if kind === "bubbles"}
    {#each N.slice(0, 18) as p (p.i)}<span class="bub" style="--x:{p.x}; --d:{p.d * 2}s; --s:{p.s}; border-color:{col(p.i)}"></span>{/each}
  {:else if kind === "petals"}
    {#each N.slice(0, 20) as p (p.i)}<span class="petal" style="--x:{p.x}; --r:{p.r}deg; --d:{p.d * 2}s; background:{col(p.i)}"></span>{/each}
  {:else if kind === "fireworks"}
    {#each [[-25, -15], [20, -25], [5, 10]] as [cx, cy], b (b)}
      {#each Array.from({ length: 14 }, (_, k) => k) as k (k)}<span class="fw" style="--cx:{cx}; --cy:{cy}; --a:{(k * 360) / 14}deg; --d:{b * 0.35}s; background:{col(b + k)}"></span>{/each}
    {/each}
  {:else if kind === "glow"}
    <span class="halo" style="--c:{col(0)}; --c2:{col(1)}"></span>
  {:else if kind === "geo-ripple"}
    {#each [0, 1, 2, 3] as i (i)}<span class="g-ring" style="--i:{i}"></span>{/each}
  {:else if kind === "geo-burst"}
    {#each Array.from({ length: 16 }, (_, i) => i) as i (i)}<span class="g-line" style="--a:{i * 22.5}deg; --i:{i}"></span>{/each}
  {:else if kind === "geo-squares"}
    {#each Array.from({ length: 10 }, (_, i) => i) as i (i)}<span class="g-sq" style="--a:{i * 36}deg; --i:{i}"></span>{/each}
  {:else if kind === "geo-shards"}
    {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}<span class="g-tri" style="--a:{i * 30}deg; --i:{i}"></span>{/each}
  {:else if kind === "geo-orbit"}
    {#each Array.from({ length: 8 }, (_, i) => i) as i (i)}<span class="g-dot" style="--a:{i * 45}deg; --i:{i}"></span>{/each}
    <span class="g-ring settle"></span>
  {:else}
    <span class="spark a"></span>
  {/if}
</div>

<style>
  .fx { position: fixed; inset: 0; z-index: 35; display: grid; place-items: center; pointer-events: none; color: var(--accent); overflow: hidden; animation: life 2.4s linear forwards; }
  .fx.inline { position: relative; inset: auto; height: 180px; z-index: auto; animation: none; border-radius: 8px; background: color-mix(in srgb, var(--region) 60%, transparent); }
  .fx > * { grid-area: 1 / 1; }
  svg { width: 220px; height: auto; overflow: visible; }
  @keyframes life { 0%, 85% { opacity: 1; } 100% { opacity: 0; } }

  /* Pair: two sparks spiral together into one. */
  .spark { width: 12px; height: 12px; border-radius: 50%; background: currentColor; box-shadow: 0 0 16px currentColor; }
  .k-pair .a { animation: orbitA 1.2s ease-in forwards; }
  .k-pair .b { animation: orbitB 1.2s ease-in forwards; }
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
  .k-huge { color: #ffcf5a; }
  .wash { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(255, 236, 170, 0.95), rgba(255, 180, 60, 0.55) 35%, rgba(120, 40, 160, 0.35) 70%, transparent 100%); animation: wash 2.2s ease-out forwards; }
  .core { width: 40px; height: 40px; border-radius: 50%; background: #fffbe6; box-shadow: 0 0 60px 30px #ffe08a, 0 0 140px 70px rgba(255, 170, 40, 0.6); animation: core 2.2s ease-out forwards; }
  .ray { width: 6px; height: 150vmax; background: linear-gradient(transparent 5%, rgba(255, 230, 150, 0.85) 45%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 230, 150, 0.85) 55%, transparent 95%); transform: rotate(calc(var(--i) * 15deg)) scaleY(0); animation: rays 2.2s ease-out forwards; }
  .shock { width: 60px; height: 60px; border-radius: 50%; border: 3px solid #fff3c4; animation: shock 1.8s ease-out forwards; animation-delay: calc(var(--i) * 0.25s); opacity: 0; }
  .inline .ray { height: 160%; }
  @keyframes wash { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes core { 0% { transform: scale(0); } 25% { transform: scale(3); } 100% { transform: scale(6); opacity: 0; } }
  @keyframes rays { 0% { transform: rotate(calc(var(--i) * 15deg)) scaleY(0); opacity: 1; } 45% { transform: rotate(calc(var(--i) * 15deg + 10deg)) scaleY(1); opacity: 1; } 100% { transform: rotate(calc(var(--i) * 15deg + 25deg)) scaleY(1); opacity: 0; } }
  @keyframes shock { 0% { transform: scale(0.2); opacity: 1; } 100% { transform: scale(18); opacity: 0; } }

  /* Colorful styles (Axiom celebrations). */
  .bit { position: absolute; top: -10%; left: calc(50% + var(--x) * 1%); width: 8px; height: 13px; border-radius: 2px; transform: rotate(var(--r)); animation: fall 2.1s cubic-bezier(0.3, 0.6, 0.6, 1) forwards; animation-delay: var(--d); }
  .inline .bit { top: -12px; }
  @keyframes fall { 0% { transform: translateY(0) rotate(var(--r)); opacity: 1; } 100% { transform: translateY(110vh) rotate(calc(var(--r) + 540deg)); opacity: 0.9; } }
  .inline .bit { animation-name: fallIn; }
  @keyframes fallIn { 0% { transform: translateY(0) rotate(var(--r)); } 100% { transform: translateY(200px) rotate(calc(var(--r) + 540deg)); } }
  .spk { font-size: 22px; transform: translate(calc(var(--x) * 2.4px), calc(var(--y) * 1.6px)) scale(0); animation: spk 1.4s ease-out forwards; animation-delay: var(--d); text-shadow: 0 0 8px currentColor; }
  @keyframes spk { 40% { transform: translate(calc(var(--x) * 2.4px), calc(var(--y) * 1.6px)) scale(1.3); opacity: 1; } 100% { transform: translate(calc(var(--x) * 2.8px), calc(var(--y) * 1.9px)) scale(0.2); opacity: 0; } }
  .bub { position: absolute; bottom: -20px; left: calc(50% + var(--x) * 1%); width: calc(var(--s) * 26px); height: calc(var(--s) * 26px); border-radius: 50%; border: 2px solid; background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), transparent 40%); animation: rise 2s ease-out forwards; animation-delay: var(--d); }
  @keyframes rise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; transform: translateY(-160px) scale(1); } 100% { transform: translateY(-180px) scale(1.4); opacity: 0; } }
  .petal { position: absolute; top: -12px; left: calc(50% + var(--x) * 1%); width: 12px; height: 8px; border-radius: 80% 0 80% 0; animation: drift 2.2s ease-in forwards; animation-delay: var(--d); }
  @keyframes drift { 0% { transform: translate(0, 0) rotate(var(--r)); opacity: 1; } 50% { transform: translate(18px, 100px) rotate(calc(var(--r) + 140deg)); } 100% { transform: translate(-10px, 200px) rotate(calc(var(--r) + 300deg)); opacity: 0; } }
  .fw { position: absolute; left: calc(50% + var(--cx) * 1%); top: calc(50% + var(--cy) * 1%); width: 6px; height: 6px; border-radius: 50%; transform: rotate(var(--a)) translateX(0); opacity: 0; animation: fw 1.4s ease-out forwards; animation-delay: var(--d); box-shadow: 0 0 6px currentColor; }
  @keyframes fw { 0% { opacity: 1; transform: rotate(var(--a)) translateX(0); } 70% { opacity: 1; } 100% { opacity: 0; transform: rotate(var(--a)) translateX(70px) translateY(14px); } }
  .halo { width: 80px; height: 80px; border-radius: 50%; box-shadow: 0 0 0 6px var(--c), 0 0 40px 18px var(--c2); animation: halo 1.8s ease-out forwards; }
  @keyframes halo { 0% { transform: scale(0.3); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(3); opacity: 0; } }

  /* Geometric shop celebrations, in the student's color. */
  .g-ring { width: 40px; height: 40px; border-radius: 50%; border: 2px solid currentColor; opacity: 0; animation: gring 1.6s ease-out forwards; animation-delay: calc(var(--i) * 0.18s); }
  @keyframes gring { 0% { opacity: 0.9; transform: scale(0.3); } 100% { opacity: 0; transform: scale(6); } }
  .g-line { width: 2px; height: 46px; background: currentColor; border-radius: 1px; transform: rotate(var(--a)) translateY(-30px) scaleY(0); animation: gline 1.2s ease-out forwards; }
  @keyframes gline { 0% { transform: rotate(var(--a)) translateY(-20px) scaleY(0); opacity: 1; } 50% { transform: rotate(var(--a)) translateY(-70px) scaleY(1); opacity: 1; } 100% { transform: rotate(var(--a)) translateY(-120px) scaleY(0.2); opacity: 0; } }
  .g-sq { width: 16px; height: 16px; border: 2px solid currentColor; animation: gsq 1.5s ease-out forwards; }
  @keyframes gsq { 0% { transform: rotate(var(--a)) translateX(0) rotate(0); opacity: 1; } 100% { transform: rotate(var(--a)) translateX(110px) rotate(180deg); opacity: 0; } }
  .g-tri { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 14px solid currentColor; animation: gtri 1.4s ease-out forwards; }
  @keyframes gtri { 0% { transform: rotate(var(--a)) translateY(0) rotate(0); opacity: 1; } 100% { transform: rotate(var(--a)) translateY(-120px) rotate(220deg); opacity: 0; } }
  .g-dot { width: 9px; height: 9px; border-radius: 50%; background: currentColor; animation: gorbit 1.6s ease-in-out forwards; }
  @keyframes gorbit { 0% { transform: rotate(var(--a)) translateX(90px); opacity: 0; } 20% { opacity: 1; } 80% { transform: rotate(calc(var(--a) + 360deg)) translateX(40px); opacity: 1; } 100% { transform: rotate(calc(var(--a) + 400deg)) translateX(40px); opacity: 0; } }
  .g-ring.settle { width: 80px; height: 80px; animation: settle 1.6s ease-out forwards; }
  @keyframes settle { 0%, 60% { opacity: 0; transform: scale(0.8); } 80% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.1); } }

  @media (prefers-reduced-motion: reduce) {
    .fx:not(.inline) { display: none; }
    .fx * { animation-duration: 0.001s !important; animation-delay: 0s !important; }
  }
</style>
