<script lang="ts">
  import { goto } from "$app/navigation";
  import { anonymousAllowed, firebaseConfigured } from "$lib/backend";
  import { session } from "$lib/session.svelte";
  import { findBanned, loadBannedWords } from "$lib/moderation";

  type Mode = "sign-in" | "sign-up" | "reset";
  let mode = $state<Mode>("sign-in");
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  $effect(() => {
    if (session.user) goto("/specialist", { replaceState: true });
  });

  function switchTo(m: Mode) {
    mode = m;
    error = null;
    notice = null;
  }

  async function run(fn: () => Promise<void>) {
    error = null;
    notice = null;
    busy = true;
    try {
      await fn();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      busy = false;
    }
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const backend = session.backend!;
    if (mode === "sign-in") run(() => backend.signInWithEmail(email, password));
    else if (mode === "sign-up")
      run(async () => {
        if (findBanned(name, await loadBannedWords())) throw new Error("That name has a word that isn't allowed. Choose another.");
        await backend.signUpWithEmail(name, email, password);
      });
    else
      run(async () => {
        await backend.sendPasswordReset(email);
        notice = `If an account exists for ${email}, a reset link is on its way.`;
      });
  }
</script>

<div class="wrap narrow">
  <div class="card">
    <h1>{mode === "sign-up" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}</h1>

    {#if firebaseConfigured}
      {#if mode !== "reset"}
        <button class="btn wide" disabled={busy} onclick={() => run(() => session.backend!.signInWithGoogle())}>Continue with Google</button>
        {#if anonymousAllowed}<button class="btn wide" disabled={busy} onclick={() => run(() => session.backend!.signInAsGuest())}>Continue anonymously</button>{/if}
        <div class="or muted">or</div>
      {/if}

      <form onsubmit={submit}>
        {#if mode === "sign-up"}
          <label for="name">Username</label>
          <input id="name" type="text" bind:value={name} autocomplete="username" />
        {/if}
        <label for="email">Email</label>
        <input id="email" type="email" required bind:value={email} autocomplete="email" />
        {#if mode !== "reset"}
          <label for="password">Password</label>
          <input id="password" type="password" required minlength="6" bind:value={password} autocomplete={mode === "sign-up" ? "new-password" : "current-password"} />
        {/if}
        <button class="btn primary wide" disabled={busy}>
          {mode === "sign-up" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
        </button>
      </form>

      <div class="links">
        {#if mode === "sign-in"}
          <button class="link" onclick={() => switchTo("sign-up")}>Create account</button>
          <button class="link" onclick={() => switchTo("reset")}>Forgot password?</button>
        {:else}
          <button class="link" onclick={() => switchTo("sign-in")}>Back to sign in</button>
        {/if}
      </div>
    {:else}
      <p class="muted">Local mode · saved in this browser</p>
      <button class="btn primary wide" disabled={busy} onclick={() => run(() => session.backend!.signInAsGuest())}>Continue</button>
    {/if}

    {#if notice}<p class="notice" role="status">{notice}</p>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </div>
</div>

<style>
  .card { max-width: 380px; margin: 48px auto; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  p { margin: 0; }
  form { display: flex; flex-direction: column; gap: 6px; }
  label { font-size: 12px; color: var(--muted); margin-top: 4px; }
  input[type="password"] { font: inherit; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); width: 100%; }
  form .btn { margin-top: 8px; }
  .wide { width: 100%; justify-content: center; }
  .or { text-align: center; font-size: 12px; }
  .links { display: flex; justify-content: space-between; }
  .link { border: 0; background: none; padding: 0; color: var(--accent); cursor: pointer; font-size: 13px; }
  .notice { color: var(--good); font-size: 13px; }
  .error { color: var(--bad); font-size: 13px; }
</style>
