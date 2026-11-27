<script lang="ts">
  import ShareButton from "$lib/components/ShareButton.svelte";
  import TutorialButton from "$lib/components/TutorialButton.svelte";
  import ReportButton from "$lib/components/ReportButton.svelte";
  import { page } from "$app/state";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import ResultRow from "$lib/components/ResultRow.svelte";
  import { isRubricMarked } from "@intellectify/content/marking";
  import { markingFor } from "$lib/marking.svelte";
  import { indexSkills, loadQuestions, loadWords, wordLists, type QuestionT } from "$lib/content";
  import { getStartTier, reserve, serveQuestion, stateOrNew, type PartResult, type ResultSummary, type Served } from "$lib/practice";
  import { recordResult } from "$lib/record";
  import { serve } from "$lib/review";
  import { profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import PastAnswer from "$lib/components/PastAnswer.svelte";
  import { listHistory, type HistoryEntry } from "$lib/history";
  import { loadCurrent, saveCurrent } from "$lib/current";
  import { validPicks } from "@intellectify/content/template";

  let { data } = $props();
  const skillId = $derived(page.params.skill);
  const entry = $derived(indexSkills(data.course).get(skillId));
  const store = $derived(courseProgress(data.course.id));
  const profile = $derived(profileFor(session.backend, session.user));
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  const marking = $derived(markingFor(session.backend, session.user));
  /** The marking job for the current written answer, once submitted. */
  let jobId = $state<string | null>(null);
  const job = $derived(jobId && marking ? marking.job(jobId) : null);

  let pool = $state<QuestionT[] | null>(null);
  let served = $state<Served | null>(null);
  let summary = $state<ResultSummary | null>(null);
  let xpGained = $state(0);
  /** Bumped for every new question, so the card resets. */
  let round = $state(0);
  const question = $derived(served?.question ?? null);

  /** Back (SPEC §15.4b): earlier answers in this skill, from local history, newest first. 0 = the current question. */
  let past = $state<HistoryEntry[]>([]);
  let back = $state(0);
  const snapshot = () => {
    past = listHistory(data.course.id).filter((e) => e.skill === skillId).slice(0, 50);
    back = 0;
  };
  const ago = (t: number) => new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  // Load the pool when the skill changes, once progress is available.
  let loadedFor = "";
  $effect(() => {
    if (!store?.loaded || loadedFor === skillId) return;
    loadedFor = skillId;
    pool = null;
    Promise.all([loadQuestions(fetch, data.course.id, skillId), loadWords(fetch)]).then(([qs]) => {
      pool = qs;
      // A link to one question (?q=<id>) serves it first; practice then carries on as usual.
      const wanted = page.url.searchParams.get("q");
      const q = wanted ? qs.find((x) => x.id === wanted) : undefined;
      // Otherwise the question left unanswered here last time comes back, numbers and words included.
      const kept = loadCurrent(data.course.id, skillId);
      const keptQ = !q && kept ? qs.find((x) => x.id === kept.id) : undefined;
      const keptOk =
        keptQ && kept && (keptQ.variants?.length ? kept.variant !== null && kept.variant < keptQ.variants.length : kept.variant === null) && validPicks(keptQ.words, kept.words, wordLists());
      if (q || keptOk) {
        served = q ? serve(q) : reserve(keptQ!, kept!.variant, kept!.words);
        remember();
        snapshot();
        summary = null;
        jobId = null;
        round++;
      } else next();
    });
  });

  function next() {
    if (!store || !pool) return;
    summary = null;
    xpGained = 0;
    jobId = null;
    // Written answers still waiting to be marked count as seen (SPEC §5.4): don't serve them again meanwhile.
    const waiting = new Set((marking?.jobs ?? []).filter((j) => j.status === "pending").map((j) => j.questionId));
    served = serveQuestion(pool, stateOrNew(store.progress, skillId, getStartTier(data.course.id)), waiting);
    remember();
    snapshot();
    round++;
  }

  /** Keep the served question until it's answered (SPEC §15.4d); forget it once it is. */
  const remember = () => saveCurrent(data.course.id, skillId, served ? { id: served.question.id, variant: served.variant, words: served.words } : null);
  const forget = () => saveCurrent(data.course.id, skillId, null);

  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !served) return;
    const j = await marking.submit({ course: data.course.id, skill: skillId, question: served.question, variant: served.variant, words: served.words, answers });
    jobId = j.id;
    forget();
  }

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !served) return;
    forget();
    const r = await recordResult({ course: data.course, store, profile, served, parts, answers, achievements });
    summary = r.summary;
    xpGained = r.xp;
  }

</script>

<div class="wrap narrow">
  <p class="crumbs">
    <a href="/{data.course.id}">{data.course.name}</a>
    {#if entry}› <a href="/{data.course.id}/skill/{skillId}">{entry.skill.name}</a>{/if}
  </p>

  {#if !store?.loaded || pool === null}
    <p class="muted">Loading…</p>
  {:else if !question}
    <p class="muted">No questions yet</p>
  {:else}
    <div class="history-nav">
      <a class="btn link" href="/{data.course.id}">← Back</a>
      <span class="nav-end">
        {#if back === 0 && served}<span class="tools"><TutorialButton course={data.course} skill={served.question.skills.primary} /><ShareButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} /><ReportButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} /></span>{/if}
        <a class="btn link" href="/{data.course.id}/history?skill={skillId}">History</a>
      </span>
    </div>
    {#if back > 0}
      {#key past[back - 1]!.id}<section class="result past"><PastAnswer entry={past[back - 1]!} /></section>{/key}
    {/if}
    <div hidden={back > 0}>
    {#key round}
      {#if isRubricMarked(question)}
        <WrittenAnswerCard {question} onsubmit={submitWritten} submitted={jobId !== null} />
      {:else}
        <QuestionCard {question} onresolve={resolve} />
      {/if}
    {/key}

    {#if job && marking}
      <section class="result">
        <MarkView {job} queue={marking} />
        <h2>Solution</h2>
        <Markdown text={question.solution} />
        <div class="actions">
          <button class="btn primary" onclick={next}>Next question</button>
          <a class="btn quiet" href="/{data.course.id}/marked/{job.id}">Open</a>
        </div>
      </section>
    {/if}

    {#if summary}
      {@const p = summary.primary}
      <section class="result">
        <ResultRow outcome={summary.outcome} theta={p.after.theta} deltaTheta={p.deltaTheta} rankBefore={p.rankBefore} rankAfter={p.rankAfter} xp={xpGained} />
        {#if store.error}<p class="feedback bad">{store.error}</p>{/if}
        <h2>Solution</h2>
        <Markdown text={question.solution} />
        <div class="actions"><button class="btn primary" onclick={next}>Next question</button></div>
      </section>
    {/if}
    </div>
    <!-- Earlier answers in this skill (SPEC §15.4b), under the question. -->
    {#if past.length}
      <nav class="history-nav steps" aria-label="Earlier answers">
        <button class="btn link" disabled={back >= past.length} onclick={() => back++}>← Previous</button>
        {#if back > 0}
          <span class="muted small">{ago(past[back - 1]!.at)}</span>
          <button class="btn link" onclick={() => back--}>Next →</button>
          <button class="btn link" onclick={() => (back = 0)}>Current question</button>
        {/if}
      </nav>
    {/if}
  {/if}
</div>

<style>
  .history-nav { display: flex; align-items: center; gap: 6px 16px; margin: -4px 0 10px; flex-wrap: wrap; }
  .history-nav.steps { margin: 16px 0 0; }
  .nav-end { margin-left: auto; display: inline-flex; align-items: center; gap: 16px; }
  .small { font-size: 12px; }
  .result.past { margin-top: 0; }
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .result { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .feedback { margin: 0; font-size: 13px; }
  .bad { color: var(--bad); }
  .actions { display: flex; gap: 8px; margin-top: 20px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 18px 0 8px; }
</style>
