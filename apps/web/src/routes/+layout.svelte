<script lang="ts">
  import "../app.css";
  import "katex/dist/katex.min.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { session, startSession } from "$lib/session.svelte";

  let { children } = $props();
  startSession();

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
        <button class="btn quiet" onclick={() => session.backend?.signOut()}>Sign out</button>
      </nav>
    {/if}
  </div>
  {#if session.backend?.kind === "local" && session.user}
    <p class="local">Local mode: progress is saved in this browser.</p>
  {/if}
</header>

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
</style>
