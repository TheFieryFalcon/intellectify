<script lang="ts">
  /**
   * A shared problem (SPEC §15.4c): exactly the question, numbers and words in the link. Answering it counts
   * like practice (θ, XP, achievements); written answers are marked as usual.
   */
  import { page } from "$app/state";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import ShareButton from "$lib/components/ShareButton.svelte";
  import TutorialButton from "$lib/components/TutorialButton.svelte";
  import ResultRow from "$lib/components/ResultRow.svelte";
  import ReportButton from "$lib/components/ReportButton.svelte";
  import { isRubricMarked } from "@intellectify/content/marking";
  import { markingFor } from "$lib/marking.svelte";
  import { indexSkills, loadIndexedQuestion, loadQuestionIndex, loadWords, wordLists, type QuestionIndexEntry } from "$lib/content";
  import { reserve, serveOne, type PartResult, type ResultSummary, type Served } from "$lib/practice";
  import { recordResult } from "$lib/record";
  import { profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import { readShare } from "$lib/share";

  let { data } = $props();
  const id = $derived(decodeURIComponent(page.params.id!));
  const store = $derived(courseProgress(data.course.id));
  const profile = $derived(profileFor(session.backend, session.user));
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  const marking = $derived(markingFor(session.backend, session.user));
  const skills = $derived(indexSkills(data.course));

  let entry = $state<QuestionIndexEntry | null>(null);
  let served = $state<Served | null | undefined>(undefined);
  /** The question changed since the link was made, so the numbers or names differ. */
  let changed = $state(false);
  let summary = $state<ResultSummary | null>(null);
  let gained = $state(0);
  let jobId = $state<string | null>(null);
  const job = $derived(jobId && marking ? marking.job(jobId) : null);

  let loadedFor = "";
  $effect(() => {
    const key = page.url.pathname + page.url.search;
    if (loadedFor === key) return;
    loadedFor = key;
    served = undefined;
    summary = null;
    jobId = null;
    Promise.all([loadQuestionIndex(fetch, data.course.id), loadWords(fetch)]).then(async ([ix]) => {
      entry = ix.find((q) => q.id === id) ?? null;
      const q = entry ? await loadIndexedQuestion(fetch, data.course.id, entry) : null;
      if (!q) return void (served = null);
      const asked = readShare(page.url.searchParams, q, wordLists());
      changed = !asked;
      served = asked ? reserve(q, asked.variant, asked.words) : serveOne(q);
    });
  });

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !served) return;
    const r = await recordResult({ course: data.course, store, profile, served, parts, answers, achievements, mode: "shared" });
    summary = r.summary;
    gained = r.xp;
  }
  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !served) return;
    const q = served.question;
    const j = await marking.submit({ course: data.course.id, skill: q.skills.primary, question: q, variant: served.variant, words: served.words, mode: "shared", answers });
    jobId = j.id;
  }
</script>

<div class="wrap narrow">
  <p class="crumbs">
    <a href="/{data.course.id}">{data.course.name}</a>
    {#if entry}› <a href="/{data.course.id}/skill/{entry.skill}">{skills.get(entry.skill)?.skill.name ?? entry.skill}</a>{/if}
  </p>
  <div class="head">
    <h1>{entry?.title ?? "Shared problem"}</h1>
    {#if served}<span class="tools"><TutorialButton course={data.course} skill={served.question.skills.primary} /><ShareButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} /><ReportButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} /></span>{/if}
  </div>
  {#if changed && served}<p class="muted small">This question has changed since the link was made, so its numbers or names may differ</p>{/if}

  {#if served === undefined || !store?.loaded}
    <p class="muted">Loading…</p>
  {:else if served === null}
    <p class="muted">This problem isn't in the course any more</p>
  {:else}
    {@const q = served.question}
    {#if isRubricMarked(q)}
      <WrittenAnswerCard question={q} onsubmit={submitWritten} submitted={jobId !== null} />
    {:else}
      <QuestionCard question={q} onresolve={resolve} />
    {/if}
    {#if job && marking}
      <section class="card">
        <MarkView {job} queue={marking} />
        <h2>Solution</h2>
        <Markdown text={q.solution} />
      </section>
    {/if}
    {#if summary}
      <section class="card">
        <ResultRow outcome={summary.outcome} theta={summary.primary.after.theta} deltaTheta={summary.primary.deltaTheta} rankBefore={summary.primary.rankBefore} rankAfter={summary.primary.rankAfter} xp={gained} />
        <h2>Solution</h2>
        <Markdown text={q.solution} />
      </section>
    {/if}
    {#if summary || job}
      <div class="actions"><a class="btn" href="/{data.course.id}/practice/{q.skills.primary}">Practice this skill</a></div>
    {/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  h1 { margin: 0; font-size: 24px; }
  .small { font-size: 12px; margin: -6px 0 12px; }
  .card { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 18px 0 8px; }
  .actions { margin-top: 20px; display: flex; gap: 8px; }
</style>
