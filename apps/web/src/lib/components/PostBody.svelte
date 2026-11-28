<script lang="ts">
  /** A discussion post (SPEC §14.1): sanitized Markdown and LaTeX, with spoilers revealed on click or Enter. */
  import DOMPurify from "dompurify";
  import { renderUserMarkdown } from "$lib/markdown";

  let { text }: { text: string } = $props();
  const html = $derived(renderUserMarkdown(text, (h) => DOMPurify.sanitize(h)));

  function reveal(e: Event) {
    const el = (e.target as HTMLElement).closest(".spoiler");
    if (!el) return;
    if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    // On touch, the first tap shows the label (what's hidden); the next tap reveals it.
    if ("pointerType" in e && (e as PointerEvent).pointerType === "touch" && !el.classList.contains("shown") && document.activeElement !== el) {
      (el as HTMLElement).focus();
      return;
    }
    el.classList.toggle("shown");
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="post-body" onclick={reveal} onkeydown={reveal}>{@html html}</div>

<style>
  .post-body { overflow-wrap: anywhere; }
  .post-body :global(p) { margin: 0 0 0.6em; }
  .post-body :global(p:last-child) { margin-bottom: 0; }
  .post-body :global(.katex-display) { overflow-x: auto; overflow-y: hidden; }
  .post-body :global(pre) { overflow-x: auto; background: var(--region); padding: 8px 10px; border-radius: 6px; }
  .post-body :global(.spoiler) { position: relative; cursor: pointer; border-radius: 4px; background: var(--region); outline: none; }
  .post-body :global(.spoiler:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
  .post-body :global(.spoiler .spoiler-body) { filter: blur(6px); user-select: none; transition: filter 0.15s; }
  .post-body :global(.spoiler.shown .spoiler-body) { filter: none; user-select: text; }
  .post-body :global(.spoiler:not(.shown):hover::after), .post-body :global(.spoiler:not(.shown):focus::after) {
    content: attr(data-label); position: absolute; left: 0; bottom: calc(100% + 6px); z-index: 20; white-space: nowrap;
    padding: 4px 8px; border-radius: 6px; background: var(--ink); color: var(--surface); font-size: 12px;
  }
</style>
