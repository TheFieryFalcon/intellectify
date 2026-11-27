<script lang="ts">
  import { renderMarkdown } from "$lib/markdown";
  import { glossaryTerms } from "$lib/glossary.svelte";

  /** `glossary={false}` for a student's own writing: no definition hovers, and the line breaks they typed are kept. */
  let { text, inline = false, glossary = true }: { text: string; inline?: boolean; glossary?: boolean } = $props();
  const html = $derived(renderMarkdown(text, { inline, breaks: !glossary, glossary: glossary ? glossaryTerms() : undefined }));
</script>

{#if inline}
  <span class="md">{@html html}</span>
{:else}
  <div class="md">{@html html}</div>
{/if}

<style>
  .md :global(p) { margin: 0 0 0.7em; }
  .md :global(p:last-child) { margin-bottom: 0; }
  /* Glossary hovers (SPEC §3.2): the definition shows on hover, tap or keyboard focus. */
  .md :global(dfn.gloss) { position: relative; font-style: inherit; text-decoration: underline dotted var(--muted); text-underline-offset: 3px; cursor: help; outline: none; }
  .md :global(dfn.gloss:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
  .md :global(.gloss-def) {
    display: none; position: absolute; z-index: 30; left: 0; bottom: calc(100% + 6px); width: max-content; max-width: min(280px, 80vw);
    padding: 8px 10px; border-radius: 8px; background: var(--surface); color: var(--ink); border: 1px solid var(--line);
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.18); font-size: 13px; line-height: 1.4; font-weight: 400; text-align: left; white-space: normal;
  }
  .md :global(.gloss-def strong) { display: block; margin-bottom: 2px; }
  .md :global(dfn.gloss:hover .gloss-def), .md :global(dfn.gloss:focus .gloss-def) { display: block; }
  .md :global(.katex-display) { margin: 0.6em 0; overflow-x: auto; overflow-y: hidden; }
</style>
