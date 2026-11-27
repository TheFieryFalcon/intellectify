<script lang="ts">
  /** One-time tip explaining "Paper first", until dismissed. */
  import { dismissPaperTip, paperTip } from "$lib/paper.svelte";
  let { written = false }: { written?: boolean } = $props();
</script>

{#if !paperTip.dismissed}
  <div class="tip" role="note">
    <span>Work harder questions on paper first, then enter your answer here.{#if written}{" "}Written answers can be photographed.{/if}</span>
    <button class="btn quiet" onclick={dismissPaperTip}>Got it</button>
  </div>
{/if}

<style>
  .tip { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: -4px 0 14px; padding: 8px 8px 8px 12px; border-radius: 8px; background: var(--accent-soft); color: var(--ink); font-size: 13px; }
  .tip .btn { white-space: nowrap; }
</style>
