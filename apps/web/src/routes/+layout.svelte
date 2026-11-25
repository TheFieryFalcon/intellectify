<script lang="ts">
  import "../app.css";
  import "katex/dist/katex.min.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import LevelBadge from "$lib/components/LevelBadge.svelte";
  import { profileFor } from "$lib/profile.svelte";
  import { session, startSession } from "$lib/session.svelte";

  let { children } = $props();
  startSession();

  const profile = $derived(profileFor(session.backend, session.user));

  // Level-up toast: shows for a few seconds after a grant crosses a level boundary.
  $effect(() => {
    if (!profile?.levelUp) return;
    const t = setTimeout(() => profile && (profile.levelUp = null), 4000);
    return () => clearTimeout(t);
  });

  const publicRoute = $derived(page.url.pathname.startsWith("/login") || page.url.pathname.startsWith("/auth"));
  $effect(() => {
    if (session.ready && !session.user && !publicRoute) goto("/login", { replaceState: true });
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
    <p class="local">Local mode: progress is saved in this browser.</p>
  {/if}
</header>

{#if profile?.levelUp}
  <div class="toast" class:big={profile.levelUp.newTier} role="status" style="--t: var(--lvl-{profile.levelUp.tier.key})">
    <span class="gem"></span>
    <span>Level {profile.levelUp.level}{#if profile.levelUp.newTier} · <strong>{profile.levelUp.tier.name}</strong>{/if}</span>
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
  .toast { position: fixed; z-index: 30; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); box-shadow: 0 8px 24px rgba(15, 22, 35, 0.18); font-weight: 500; animation: rise 0.25s ease-out; }
  .toast.big { padding: 14px 24px; font-size: 16px; border-color: var(--t); }
  .toast .gem { width: 12px; height: 12px; transform: rotate(45deg); border-radius: 2px; background: var(--t); }
  @keyframes rise { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
</style>
