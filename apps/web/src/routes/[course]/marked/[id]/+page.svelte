<script lang="ts">
  /** One marked (or waiting) written answer: the question, the answer, the rubric breakdown and the appeal. */
  import { page } from "$app/state";
  import Markdown from "$lib/components/Markdown.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import { indexSkills, type QuestionT } from "$lib/content";
  import { jobQuestion, markingFor } from "$lib/marking.svelte";
  import { session } from "$lib/session.svelte";

  let { data } = $props();
  const marking = $derived(markingFor(session.backend, session.user));
  const job = $derived(marking?.loaded ? marking.job(page.params.id!) : undefined);
  const skill = $derived(job ? indexSkills(data.course).get(job.skill) : undefined);
  let question = $state<QuestionT | null>(null);
  $effect(() => {
    if (job) jobQuestion(job).then((q) => (question = q));
  });
  const fmt = (t: number) => new Date(t).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
</script>

<div class="wrap narrow">
  <p class="crumbs">
    <a href="/{data.course.id}">{data.course.name}</a>
    {#if skill}› <a href="/{data.course.id}/skill/{skill.skill.id}">{skill.skill.name}</a>{/if}
    › <a href="/{data.course.id}/marked">Marked</a>
  </p>
  {#if job === undefined}
    <p class="muted">Loading…</p>
  {:else if job === null || !marking}
    <p class="muted">Not found</p>
  {:else}
    <section class="card">
      <p class="muted small">{fmt(job.createdAt)}</p>
      {#if question}<Markdown text={question.stem} />{/if}
      <h2>Your answer</h2>
      {#each Object.entries(job.answers) as [part, text] (part)}
        <div class="answer">
          {#if Object.keys(job.answers).length > 1}<span class="part-id">({part})</span>{/if}
          <Markdown {text} glossary={false} />
        </div>
      {/each}
      <h2>Marking</h2>
      <MarkView {job} queue={marking} />
      {#if question && job.status !== "pending"}
        <h2>Solution</h2>
        <Markdown text={question.solution} />
      {/if}
    </section>
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .small { font-size: 12px; margin: 0 0 8px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 20px 0 8px; }
  .answer { display: flex; gap: 8px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
  .part-id { font-weight: 600; }
</style>
