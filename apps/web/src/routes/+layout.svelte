<script lang="ts">
  import AuthGate from "$lib/components/AuthGate.svelte";
  import { gate } from "$lib/gate.svelte";
  import { achievementToasts } from "$lib/achievements.svelte";
  import "../app.css";
  import "katex/dist/katex.min.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import LevelBadge from "$lib/components/LevelBadge.svelte";
  import TierCelebration from "$lib/components/TierCelebration.svelte";
  import TierGem from "$lib/components/TierGem.svelte";
  import { profileFor } from "$lib/profile.svelte";
  import { markingFor, markingToasts } from "$lib/marking.svelte";
  import { session, startSession } from "$lib/session.svelte";

  let { children } = $props();
  startSession();

  const profile = $derived(profileFor(session.backend, session.user));
  // Free-response marking runs in the background wherever the student is (SPEC §10.2).
  const marking = $derived(markingFor(session.backend, session.user));

  $effect(() => {
    if (!markingToasts.length) return;
    const t = setTimeout(() => markingToasts.shift(), 6000);
    return () => clearTimeout(t);
  });

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
    if (profile?.loaded && (!profile.profile.placement?.tiers || (session.user?.google && !profile.profile.nameSet)) && !publicRoute && !page.url.pathname.startsWith("/onboarding") && !page.url.pathname.startsWith("/dev"))
      goto("/onboarding", { replaceState: true });
  });
</script>

<header>
  <div class="bar">
    <a class="brand" href="/">Intellectify</a>
    {#if session.user}
      <nav>
        <a href="/specialist">Specialist</a>
        {#if marking?.waiting}<a class="marking" href="/specialist/marked" title="Written answers waiting for a mark">Marking {marking.waiting}</a>{/if}
        <a href="/leaderboards">Leaderboards</a>
        <a class="who muted" href="/profile/{session.user.uid}">{session.user.displayName}</a>
        {#if profile?.loaded}<a class="lvl" href="/profile/{session.user.uid}" aria-label="Your profile"><LevelBadge progress={profile.progress} bar /></a>{/if}
        <a class="settings" href="/settings">Settings</a>
        <button class="btn link signout" onclick={() => session.backend?.signOut()}>Sign out</button>
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

{#if markingToasts.length}
  {@const m = markingToasts[0]!}
  <div class="toast marked" role="status">
    <a href="/{m.course}/marked/{m.jobId}"><span class="muted">{m.appeal ? "Appeal re-marked" : "Marked"}</span> {Math.round(m.score * 100)}%</a>
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

{#if gate.open && session.user?.anonymous}<AuthGate />{/if}

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
  nav a.who { font-size: 13px; color: var(--muted); font-weight: 400; }
  nav a.settings { font-size: 13px; color: var(--muted); font-weight: 400; }
  .local { margin: 0; padding: 6px 16px; text-align: center; font-size: 12px; color: var(--muted); background: var(--region); }
  .loading { text-align: center; padding: 64px 16px; }
  .toast.achievement { bottom: calc(env(safe-area-inset-bottom, 0px) + 76px); }
  .toast.marked { bottom: calc(env(safe-area-inset-bottom, 0px) + 128px); }
  .toast.marked a { color: var(--ink); text-decoration: none; }
  nav a.marking { font-size: 13px; color: var(--accent); }
  nav a.lvl { display: inline-flex; color: var(--ink); }
  nav .signout { font-size: 13px; }
  /* Phones: the nav takes its own row under the brand; the name hides (the level badge links to the profile). */
  @media (max-width: 640px) {
    .bar { flex-wrap: wrap; row-gap: 4px; padding: 8px 16px; }
    nav { width: 100%; justify-content: space-between; gap: 10px; font-size: 13px; }
    nav a.who { display: none; }
    nav a.lvl :global(.track) { display: none; }
  }
  .toast .pts { color: var(--accent); font-variant-numeric: tabular-nums; }
  .toast { position: fixed; z-index: 30; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); box-shadow: 0 8px 24px rgba(15, 22, 35, 0.18); font-weight: 500; animation: rise 0.25s ease-out; }
  @keyframes rise { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
</style>
