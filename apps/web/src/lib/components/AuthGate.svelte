<script lang="ts">
  /**
   * The anonymous limit's dialog (SPEC §2.1a): sign up or log in to keep practicing. It can't be closed.
   * Signing up adds the login to this account (everything stays); logging in to an existing account
   * merges this progress into it. The page then reloads as the permanent account.
   */
  import { onMount } from "svelte";
  import { ANON_QUESTION_LIMIT } from "$lib/backend";
  import { session } from "$lib/session.svelte";
  import { findBanned, loadBannedWords } from "$lib/moderation";

  type Mode = "sign-up" | "sign-in";
  let mode = $state<Mode>("sign-up");
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  let dialog: HTMLDialogElement;

  onMount(() => dialog.showModal());

  async function run(action: () => Promise<boolean>) {
    busy = true;
    error = null;
    try {
      if (await action()) location.reload();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const backend = session.backend!;
    run(async () => {
      if (mode === "sign-up" && findBanned(name, await loadBannedWords())) throw new Error("That name has a word that isn't allowed. Choose another.");
      return backend.upgradeWithEmail(mode, name, email, password);
    });
  }
</script>

<!-- Escape can't close it: the limit is the point. -->
<dialog bind:this={dialog} class="gate" aria-labelledby="gate-title" oncancel={(e) => e.preventDefault()}>
  <h2 id="gate-title">Keep your progress</h2>
  <p class="muted">You've answered {ANON_QUESTION_LIMIT} questions. Sign up or log in to keep practicing. Your progress comes with you.</p>

  <button class="btn wide" disabled={busy} onclick={() => run(() => session.backend!.upgradeWithGoogle())}>Continue with Google</button>
  <div class="or muted">or</div>

  <div class="tabs" role="tablist">
    <button role="tab" aria-selected={mode === "sign-up"} class:on={mode === "sign-up"} onclick={() => ((mode = "sign-up"), (error = null))}>Sign up</button>
    <button role="tab" aria-selected={mode === "sign-in"} class:on={mode === "sign-in"} onclick={() => ((mode = "sign-in"), (error = null))}>Log in</button>
  </div>
  <form onsubmit={submit}>
    {#if mode === "sign-up"}
      <label>Display name <input type="text" autocomplete="nickname" maxlength="30" required minlength="2" bind:value={name} /></label>
    {/if}
    <label>Email <input type="email" autocomplete="email" required bind:value={email} /></label>
    <label>Password <input type="password" autocomplete={mode === "sign-up" ? "new-password" : "current-password"} required minlength="6" bind:value={password} /></label>
    <button class="btn primary wide" disabled={busy}>{busy ? "Saving" : mode === "sign-up" ? "Create account" : "Log in"}</button>
  </form>
  {#if error}<p class="bad" role="alert">{error}</p>{/if}
</dialog>

<style>
  .gate { width: min(400px, calc(100vw - 32px)); box-sizing: border-box; border: 1px solid var(--line); border-radius: 14px; padding: 28px 24px 24px; background: var(--surface); color: var(--ink); box-shadow: 0 16px 48px rgb(0 0 0 / 0.25); }
  .gate::backdrop { background: rgb(15 20 30 / 0.55); backdrop-filter: blur(3px); }
  h2 { margin: 0 0 6px; font-size: 22px; }
  p { margin: 0 0 18px; font-size: 13px; }
  .wide { width: 100%; justify-content: center; }
  .or { text-align: center; font-size: 12px; margin: 12px 0; }
  .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
  .tabs button { flex: 1; font: inherit; font-size: 13px; border: 0; background: none; padding: 6px; border-radius: 6px; color: var(--muted); cursor: pointer; }
  .tabs button.on { background: var(--region); color: var(--ink); }
  form { display: flex; flex-direction: column; gap: 10px; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
  input { font: inherit; font-size: 14px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .bad { color: var(--bad); margin: 12px 0 0; }
</style>
