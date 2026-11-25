<script lang="ts">
  import { goto } from "$app/navigation";
  import { session } from "$lib/session.svelte";

  let status = $state<"working" | "error">("working");
  let message = $state("");
  let done = false;

  $effect(() => {
    const backend = session.backend;
    if (!backend || done) return;
    done = true;
    backend
      .completeEmailLink(location.href)
      .then((ok) => goto(ok ? "/specialist" : "/login", { replaceState: true }))
      .catch((err: Error) => {
        status = "error";
        message = err.message;
      });
  });
</script>

<div class="wrap narrow">
  {#if status === "working"}
    <p class="muted">Signing you in…</p>
  {:else}
    <p>That sign-in link didn't work: {message}</p>
    <p><a href="/login">Back to sign in</a></p>
  {/if}
</div>
