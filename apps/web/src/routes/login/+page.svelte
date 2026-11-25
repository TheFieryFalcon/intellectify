<script lang="ts">
  import { goto } from "$app/navigation";
  import { firebaseConfigured } from "$lib/backend";
  import { session } from "$lib/session.svelte";

  let email = $state("");
  let sent = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (session.user) goto("/specialist", { replaceState: true });
  });

  async function run(fn: () => Promise<void>) {
    error = null;
    busy = true;
    try {
      await fn();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<div class="wrap narrow">
  <div class="card">
    <h1>Sign in</h1>
    <p class="muted">Practise WACE Mathematics Specialist, from recall to well beyond the exam.</p>

    {#if firebaseConfigured}
      <button class="btn primary wide" disabled={busy} onclick={() => run(() => session.backend!.signInWithGoogle())}>Continue with Google</button>
      <div class="or muted">or</div>
      {#if sent}
        <p>We've sent a sign-in link to <strong>{email}</strong>. Open it on this device to finish.</p>
      {:else}
        <form onsubmit={(e) => { e.preventDefault(); run(async () => { await session.backend!.sendEmailLink(email); sent = true; }); }}>
          <label for="email">Email</label>
          <input id="email" type="email" required bind:value={email} autocomplete="email" />
          <button class="btn wide" disabled={busy || !email}>Email me a sign-in link</button>
        </form>
      {/if}
    {:else}
      <p>Firebase isn't configured yet, so sign-in runs in local mode. Your progress will be saved in this browser.</p>
      <button class="btn primary wide" disabled={busy} onclick={() => run(() => session.backend!.signInAsGuest())}>Continue</button>
    {/if}

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </div>
</div>

<style>
  .card { max-width: 400px; margin: 48px auto; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
  h1 { margin: 0; font-size: 26px; }
  p { margin: 0; }
  form { display: flex; flex-direction: column; gap: 8px; }
  label { font-size: 12px; color: var(--muted); }
  .wide { width: 100%; justify-content: center; }
  .or { text-align: center; font-size: 12px; }
  .error { color: var(--bad); }
</style>
