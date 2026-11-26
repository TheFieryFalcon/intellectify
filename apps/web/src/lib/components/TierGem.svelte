<script lang="ts">
  /**
   * Level-tier gem (SPEC §12.4). Basic→Diamond are calm, matching the rank colors.
   * The achievement-only tiers escalate as rewards:
   *   Ruby: faceted with a passing shine
   *   Tanzanite: faceted, shimmering violet-blue, with a sparkle
   *   Vibranium: metallic sheen and a slow pulsing glow
   *   Solarium: a radiant sun with turning rays
   *   Antimatter: a black core inside a swirling iridescent ring, with orbiting motes
   */
  let { tier, size = 12 }: { tier: string; size?: number } = $props();
  const fancy = $derived(["ruby", "tanzanite", "vibranium", "solarium", "antimatter"].includes(tier));
</script>

<span class="gem-wrap {tier}" class:fancy style="--s: {size}px" aria-hidden="true">
  {#if tier === "solarium"}<span class="rays"></span>{/if}
  {#if tier === "antimatter"}<span class="ring"></span><span class="mote m1"></span><span class="mote m2"></span>{/if}
  <span class="gem"></span>
  {#if tier === "tanzanite"}<span class="sparkle"></span>{/if}
</span>

<style>
  .gem-wrap { position: relative; display: inline-grid; place-items: center; width: calc(var(--s) * 1.5); height: calc(var(--s) * 1.5); flex: none; }
  .gem { width: var(--s); height: var(--s); transform: rotate(45deg); border-radius: calc(var(--s) * 0.18); background: var(--lvl-basic); position: relative; overflow: hidden; }

  /* Calm tiers: two-tone fill in the rank color */
  .bronze .gem { background: linear-gradient(160deg, var(--bronze-hi), var(--bronze) 60%); }
  .silver .gem { background: linear-gradient(160deg, var(--silver-hi), var(--silver) 60%); }
  .gold .gem { background: linear-gradient(160deg, var(--gold-hi), var(--gold) 60%); }
  .platinum .gem { background: linear-gradient(160deg, var(--platinum-hi), var(--platinum) 60%); }
  .diamond .gem { background: linear-gradient(160deg, var(--diamond-hi), var(--diamond) 60%); }

  /* Ruby: faceted red, a shine sweeps across every few seconds */
  .ruby .gem { background: conic-gradient(from 45deg, #ff7aa0, #b3204f, #6d0b2c, #b3204f, #ff7aa0, #d33a68, #6d0b2c, #d33a68, #ff7aa0); }
  .fancy .gem::after { content: ""; position: absolute; inset: -50%; background: linear-gradient(100deg, transparent 40%, rgba(255, 255, 255, 0.75) 50%, transparent 60%); transform: translateX(-100%); animation: shine 3.2s ease-in-out infinite; }

  /* Tanzanite: violet-blue facets that shift hue, plus a twinkling sparkle */
  .tanzanite .gem { background: conic-gradient(from 20deg, #a9a6ff, #4f4fc2, #2a1f7a, #6c5ce7, #a9a6ff, #4f4fc2, #2a1f7a, #8d8cff, #a9a6ff); animation: hue 6s ease-in-out infinite; }
  .sparkle { position: absolute; top: 2%; right: 4%; width: calc(var(--s) * 0.42); height: calc(var(--s) * 0.42); background: #fff; clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%); filter: drop-shadow(0 0 2px #c9c8ff); animation: twinkle 2.4s ease-in-out infinite; }

  /* Vibranium: dark metallic violet, moving sheen, slow pulsing glow */
  .vibranium .gem { background: linear-gradient(135deg, #3b3657, #8a84b8 35%, #2b2742 55%, #a49fd0 75%, #3b3657); background-size: 300% 300%; animation: metal 4s linear infinite, pulse 3s ease-in-out infinite; }

  /* Solarium: golden core with turning rays and a warm glow */
  .solarium .gem { background: radial-gradient(circle at 35% 35%, #fff3c4, #f4b73a 45%, #c96a00); box-shadow: 0 0 calc(var(--s) * 0.6) rgba(244, 183, 58, 0.8); }
  .rays { position: absolute; inset: -30%; border-radius: 50%; background: repeating-conic-gradient(rgba(244, 183, 58, 0.55) 0 8deg, transparent 8deg 30deg); -webkit-mask: radial-gradient(circle, transparent 28%, #000 30%, transparent 70%); mask: radial-gradient(circle, transparent 28%, #000 30%, transparent 70%); animation: spin 12s linear infinite; }

  /* Antimatter: a void inside a swirling iridescent ring, with orbiting motes */
  .antimatter .gem { background: radial-gradient(circle at 40% 40%, #2a1650, #05010d 70%); box-shadow: inset 0 0 calc(var(--s) * 0.3) #7c4dff, 0 0 calc(var(--s) * 0.5) rgba(124, 77, 255, 0.6); }
  .ring { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(#ff4fd8, #7c4dff, #3ad8ff, #59ffa0, #ffe14f, #ff4fd8); -webkit-mask: radial-gradient(circle, transparent 54%, #000 56%, #000 64%, transparent 66%); mask: radial-gradient(circle, transparent 54%, #000 56%, #000 64%, transparent 66%); animation: spin 4s linear infinite; }
  .mote { position: absolute; width: max(2px, calc(var(--s) * 0.08)); height: max(2px, calc(var(--s) * 0.08)); border-radius: 50%; background: #e9dcff; box-shadow: 0 0 4px #b48cff; top: 50%; left: 50%; offset-path: none; transform-origin: 0 0; }
  .m1 { animation: orbit 3s linear infinite; }
  .m2 { animation: orbit 3s linear infinite reverse; animation-delay: -1.5s; }

  @keyframes shine { 0%, 60% { transform: translateX(-100%); } 85%, 100% { transform: translateX(100%); } }
  @keyframes hue { 0%, 100% { filter: hue-rotate(0deg) saturate(1); } 50% { filter: hue-rotate(-25deg) saturate(1.3); } }
  @keyframes twinkle { 0%, 100% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1); } }
  @keyframes metal { from { background-position: 0% 0%; } to { background-position: 300% 300%; } }
  @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 rgba(164, 159, 208, 0); } 50% { box-shadow: 0 0 calc(var(--s) * 0.6) rgba(164, 159, 208, 0.9); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes orbit { from { transform: rotate(0deg) translateX(calc(var(--s) * 0.7)); } to { transform: rotate(360deg) translateX(calc(var(--s) * 0.7)); } }

  @media (prefers-reduced-motion: reduce) {
    .gem, .gem::after, .rays, .ring, .mote, .sparkle { animation: none !important; }
  }
</style>
