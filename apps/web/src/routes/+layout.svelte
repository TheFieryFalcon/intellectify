<script lang="ts">
  import { achievementToasts } from "$lib/achievements.svelte";
  import "../app.css";
  import "katex/dist/katex.min.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import LevelBadge from "$lib/components/LevelBadge.svelte";
  import TierCelebration from "$lib/components/TierCelebration.svelte";
  import TierGem from "$lib/components/TierGem.svelte";
  import { profileFor } from "$lib/profile.svelte";
  import { session, startSession } from "$lib/session.svelte";

  let { children } = $props();
  startSession();

  const profile = $derived(profileFor(session.backend, session.user));

  // Achievement toasts: one at a time, a few seconds each (SPEC §12.1).
  $effect(() => {
    if (!achievementToasts.length) return;
    const t = setTimeout(() => achievementToasts.shift(), 4500);
    return () => clearTimeout(t);
  });

  // Level-up toast: shows for a few seconds after a grant crosses a level boundary.
  $effect(() => {
    if (!profile?.levelUp || profile.levelUp.newTier) return;
    const t = setTimeout(() => profile && (profile.levelUp = null), 4000);
    return () => clearTimeout(t);
  });

  const publicRoute = $derived(page.url.pathname.startsWith("/login") || page.url.pathname.startsWith("/auth"));
  $effect(() => {
    if (session.ready && !session.user && !publicRoute) goto("/login", { replaceState: true });
  });
  // Onboarding: signed-in students give their maths mark once, before anything else (SPEC §5.3).
  $effect(() => {
    if (profile?.loaded && !profile.profile.placement?.tiers && !publicRoute && !page.url.pathname.startsWith("/onboarding") && !page.url.pathname.startsWith("/dev"))
      goto("/onboarding", { replaceState: true });
  });
</script>

<header>
  <div class="bar">
    <a class="brand" href="/">Intellectify</a>
    {#if session.user}
      <nav>
        <a href="/specialist">Specialist</a>
        <span class="who muted">{session.user.displayName}</span>
        {#if profile?.loaded}<LevelBadge progress={profile.progress} bar />{/if}
        <button class="btn quiet" onclick={() => session.backend?.signOut()}>Sign out</button>
      </nav>
    {/if}
  </div>
  {#if session.backend?.kind === "local" && session.user}
    <p class="local">Local mode · saved in this browser</p>
  {/if}
</header>

{#if achievementToasts.length}
  {@const a = achievementToasts[0]!}
  <div class="toast achievement" role="status">
    <TierGem tier={a.tier} size={14} />
    <span><span class="muted">Achievement</span> {a.name} <span class="pts">+{a.points}</span></span>
  </div>
{/if}

{#if profile?.levelUp?.newTier}
  <TierCelebration levelUp={profile.levelUp} onclose={() => profile && (profile.levelUp = null)} />
{:else if profile?.levelUp}
  <div class="toast" role="status">
    <TierGem tier={profile.levelUp.tier.key} size={12} />
    <span>Level {profile.levelUp.level}</span>
  </div>
{/if}

<main>
  {#if !session.ready}
    <p class="loading muted">Loading…</p>
  {:else if session.user || publicRoute}
    {@render children()}
  {/if}
</main>

<style>
  header { border-bottom: 1px solid var(--line); background: var(--surface); }
  .bar { max-width: 1320px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .brand { font-family: var(--font-display); font-weight: 600; font-size: 20px; color: var(--ink); text-decoration: none; }
  nav { display: flex; align-items: center; gap: 14px; }
  nav a { color: var(--ink); text-decoration: none; font-weight: 500; }
  .who { font-size: 13px; }
  .local { margin: 0; padding: 6px 16px; text-align: center; font-size: 12px; color: var(--muted); background: var(--region); }
  .loading { text-align: center; padding: 64px 16px; }
  .toast.achievement { bottom: calc(env(safe-area-inset-bottom, 0px) + 76px); }
  .toast .pts { color: var(--accent); font-variant-numeric: tabular-nums; }
  .toast { position: fixed; z-index: 30; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); box-shadow: 0 8px 24px rgba(15, 22, 35, 0.18); font-weight: 500; animation: rise 0.25s ease-out; }
  @keyframes rise { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
</style>
