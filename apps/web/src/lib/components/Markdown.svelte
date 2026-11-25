<script lang="ts">
  import { renderMarkdown } from "$lib/markdown";

  let { text, inline = false }: { text: string; inline?: boolean } = $props();
  const html = $derived(renderMarkdown(text, { inline }));
</script>

{#if inline}
  <span class="md">{@html html}</span>
{:else}
  <div class="md">{@html html}</div>
{/if}

<style>
  .md :global(p) { margin: 0 0 0.7em; }
  .md :global(p:last-child) { margin-bottom: 0; }
  .md :global(.katex-display) { margin: 0.6em 0; overflow-x: auto; overflow-y: hidden; }
</style>
