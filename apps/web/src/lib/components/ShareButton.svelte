<script lang="ts">
  /** Share this exact problem (SPEC §15.4c): the phone's share sheet where there is one, else copy the link. */
  import type { QuestionT } from "$lib/content";
  import type { WordPicks } from "@intellectify/content/template";
  import { sharePath } from "$lib/share";

  let { course, question, variant, words }: { course: string; question: Pick<QuestionT, "id">; variant: number | null; words: WordPicks | null } = $props();
  let note = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function share() {
    const url = new URL(sharePath(course, question, variant, words), location.origin).toString();
    const say = (t: string) => {
      note = t;
      clearTimeout(timer);
      timer = setTimeout(() => (note = null), 2500);
    };
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Try this problem", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      say("Link copied");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      // No clipboard access: show the link to copy by hand.
      prompt("Copy this link", url);
    }
  }
</script>

<span class="share">
  <button type="button" class="btn link" onclick={share} title="Send a link to this exact problem">Share</button>
  {#if note}<span class="note" role="status">{note}</span>{/if}
</span>

<style>
  .share { display: inline-flex; align-items: center; gap: 8px; }
  .note { font-size: 12px; color: var(--good); }
</style>
