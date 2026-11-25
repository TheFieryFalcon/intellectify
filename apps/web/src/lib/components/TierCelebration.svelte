<script lang="ts">
  import type { LevelUp } from "$lib/profile.svelte";
  import TierGem from "./TierGem.svelte";

  /** Full-screen moment for reaching a new level tier (SPEC §12.4). Bigger and brighter at higher tiers. */
  let { levelUp, onclose }: { levelUp: LevelUp; onclose: () => void } = $props();
  const key = $derived(levelUp.tier.key);
  const grand = $derived(["ruby", "tanzanite", "vibranium", "solarium", "antimatter"].includes(key));
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<div class="overlay {key}" class:grand role="dialog" aria-modal="true" aria-label="New tier: {levelUp.tier.name}">
  <button class="backdrop" aria-label="Close" onclick={onclose}></button>
  <div class="card" style="--t: var(--lvl-{key})">
    <div class="burst" aria-hidden="true"></div>
    <TierGem tier={key} size={grand ? 72 : 56} />
    <p class="eyebrow">New tier</p>
    <h2>{levelUp.tier.name}</h2>
    <p class="level">Level {levelUp.level}</p>
    <button class="btn" onclick={onclose}>Continue</button>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 16px; background: rgba(10, 14, 22, 0.55); backdrop-filter: blur(3px); animation: fade 0.3s ease-out; }
  .overlay.antimatter { background: radial-gradient(circle at center, rgba(40, 18, 80, 0.85), rgba(3, 1, 10, 0.92)); }
  .overlay.solarium { background: radial-gradient(circle at center, rgba(120, 70, 0, 0.55), rgba(10, 8, 2, 0.8)); }
  .backdrop { position: absolute; inset: 0; border: 0; background: none; cursor: default; }
  .card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 36px 48px 28px; border-radius: 20px; background: var(--surface); border: 2px solid var(--t); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35); animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1); overflow: hidden; }
  .grand .card { box-shadow: 0 0 60px color-mix(in srgb, var(--t) 60%, transparent), 0 20px 60px rgba(0, 0, 0, 0.4); }
  .burst { position: absolute; inset: -40%; background: repeating-conic-gradient(color-mix(in srgb, var(--t) 9%, transparent) 0 10deg, transparent 10deg 30deg); animation: spin 20s linear infinite; pointer-events: none; }
  .antimatter .burst { background: repeating-conic-gradient(rgba(124, 77, 255, 0.1) 0 10deg, transparent 10deg 20deg, rgba(58, 216, 255, 0.07) 20deg 30deg, transparent 30deg 40deg); }
  .eyebrow { margin: 10px 0 0; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); position: relative; }
  h2 { margin: 0; font-size: 36px; color: var(--t); position: relative; }
  .grand h2 { font-size: 44px; }
  .antimatter h2 { background: linear-gradient(90deg, #ff4fd8, #7c4dff, #3ad8ff, #59ffa0, #ff4fd8); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: flow 3s linear infinite; }
  .level { margin: 0 0 12px; color: var(--muted); position: relative; font-variant-numeric: tabular-nums; }
  .btn { position: relative; }
  @keyframes fade { from { opacity: 0; } }
  @keyframes pop { from { transform: scale(0.7); opacity: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes flow { from { background-position: 0% 0; } to { background-position: 200% 0; } }
  @media (prefers-reduced-motion: reduce) { .overlay, .card, .burst, h2 { animation: none !important; } }
</style>
