<script lang="ts">
  import { page } from "$app/state";
  import Markdown from "$lib/components/Markdown.svelte";
  import { indexSkills, loadTutorial, type TutorialT } from "$lib/content";

  let { data } = $props();
  const entry = $derived(indexSkills(data.course).get(page.params.skill));
  let tutorial = $state<TutorialT | null | undefined>(undefined);
  $effect(() => {
    const id = page.params.skill;
    tutorial = undefined;
    loadTutorial(fetch, data.course.id, id).then((t) => (tutorial = t));
  });
</script>

<div class="wrap narrow">
  <a class="back" href="/{data.course.id}/skill/{page.params.skill}">← {entry?.skill.name ?? "Skill"}</a>
  {#if tutorial === undefined}
    <p class="muted">Loading…</p>
  {:else if tutorial === null}
    <h1>{entry?.skill.name}</h1>
    <p class="muted">No tutorial for this skill yet.</p>
  {:else}
    <article>
      <h1>{entry?.skill.name}</h1>
      <Markdown text={tutorial.markdown} />
    </article>
    <p class="end"><a class="btn primary" href="/{data.course.id}/practice/{page.params.skill}">Practice this skill</a></p>
  {/if}
</div>

<style>
  .back { font-size: 13px; color: var(--muted); text-decoration: none; }
  .back:hover { color: var(--accent); }
  h1 { font-size: 30px; margin: 6px 0 16px; }
  article { line-height: 1.65; max-width: 68ch; }
  article :global(h2) { font-size: 20px; margin: 28px 0 8px; }
  article :global(h3) { font-family: var(--font-body); font-size: 15px; font-weight: 600; margin: 20px 0 6px; }
  article :global(strong) { font-weight: 600; }
  article :global(ul) { padding-left: 20px; }
  article :global(li) { margin: 4px 0; }
  article :global(blockquote) { margin: 12px 0; padding: 8px 14px; border-left: 3px solid var(--accent); background: var(--accent-soft); border-radius: 0 8px 8px 0; }
  article :global(table) { border-collapse: collapse; margin: 10px 0; }
  article :global(th), article :global(td) { border: 1px solid var(--line); padding: 6px 10px; }
  .end { margin-top: 28px; }
</style>
