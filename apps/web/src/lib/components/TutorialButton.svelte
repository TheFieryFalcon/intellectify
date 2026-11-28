<script lang="ts">
  /**
   * The skill's tutorial beside the question (SPEC §16.4): a side panel on computers, a bottom sheet on
   * phones. It doesn't block the question, so the student can read and answer at once.
   */
  import Markdown from "./Markdown.svelte";
  import { indexSkills, loadTutorial, type CourseBundle, type TutorialT } from "$lib/content";

  let { course, skill }: { course: CourseBundle; skill: string } = $props();

  const entry = $derived(indexSkills(course).get(skill));
  const uid = `tut-${Math.random().toString(36).slice(2, 9)}`;
  let panel = $state<HTMLDialogElement>();
  let tutorial = $state<TutorialT | null | undefined>(undefined);
  let loadedFor = "";

  function open() {
    if (loadedFor !== skill) {
      loadedFor = skill;
      tutorial = undefined;
      loadTutorial(fetch, course.id, skill).then((t) => {
        if (loadedFor === skill) tutorial = t;
      });
    }
    panel?.show();
    panel?.querySelector<HTMLElement>(".close")?.focus();
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && panel?.open && panel.contains(document.activeElement)) panel.close();
  }
</script>

<svelte:window {onkeydown} />
{#if entry?.skill.hasTutorial}
  <button type="button" class="btn link" onclick={open} aria-controls={uid}>Tutorial</button>
  <dialog bind:this={panel} id={uid} class="panel" aria-labelledby="{uid}-title">
    <header>
      <h2 id="{uid}-title">{entry.skill.name}</h2>
      <button type="button" class="close" onclick={() => panel?.close()} aria-label="Close tutorial">×</button>
    </header>
    <div class="body">
      {#if tutorial === undefined}<p class="muted">Loading…</p>
      {:else if tutorial === null}<p class="muted">No tutorial yet</p>
      {:else}<Markdown text={tutorial.markdown} />{/if}
    </div>
  </dialog>
{/if}

<style>
  .panel {
    position: fixed;
    inset: 0 0 0 auto;
    margin: 0;
    width: min(460px, 100vw);
    height: 100dvh;
    max-height: none;
    box-sizing: border-box;
    padding: 0;
    border: 0;
    border-left: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    box-shadow: -12px 0 40px rgb(0 0 0 / 0.15);
    z-index: 50;
    flex-direction: column;
  }
  .panel[open] { display: flex; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
  h2 { margin: 0; font-size: 18px; }
  .close { font: inherit; font-size: 24px; line-height: 1; padding: 2px 8px; border: 0; background: none; color: var(--muted); cursor: pointer; border-radius: 6px; }
  .close:hover, .close:focus-visible { color: var(--ink); background: var(--region); }
  .body { overflow-y: auto; padding: 4px 18px 24px; line-height: 1.6; font-size: 15px; }
  .body :global(h2) { font-size: 17px; margin: 20px 0 6px; }
  .body :global(h3) { font-size: 15px; margin: 16px 0 4px; }
  .body :global(ul) { padding-left: 20px; }
  .body :global(table) { border-collapse: collapse; }
  .body :global(th), .body :global(td) { border: 1px solid var(--line); padding: 4px 8px; }
  .body :global(svg) { max-width: 100%; height: auto; }
  .body :global(.katex-display) { overflow-x: auto; overflow-y: hidden; padding: 2px 0; }
  @media (max-width: 640px) {
    .panel { inset: auto 0 0 0; width: 100vw; height: 72dvh; border-left: 0; border-top: 1px solid var(--line); border-radius: 14px 14px 0 0; box-shadow: 0 -12px 40px rgb(0 0 0 / 0.2); }
  }
</style>
