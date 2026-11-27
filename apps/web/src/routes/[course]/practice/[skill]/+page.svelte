<script lang="ts">
  import ShareButton from "$lib/components/ShareButton.svelte";
  import { page } from "$app/state";
  import type { RankLevel } from "@intellectify/engine";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import { isRubricMarked } from "@intellectify/content/marking";
  import { markingFor } from "$lib/marking.svelte";
  import RankDot from "$lib/components/RankDot.svelte";
  import { indexSkills, loadQuestions, loadWords, type QuestionT } from "$lib/content";
  import { getStartTier, serveQuestion, stateOrNew, type PartResult, type ResultSummary, type Served } from "$lib/practice";
  import { RANK_LABEL, score } from "$lib/ranks";
  import { recordResult } from "$lib/record";
  import { serve } from "$lib/review";
  import { profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import PastAnswer from "$lib/components/PastAnswer.svelte";
  import { listHistory, type HistoryEntry } from "$lib/history";

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
      if (q) {
        served = serve(q);
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
    snapshot();
    round++;
  }

  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !served) return;
    const j = await marking.submit({ course: data.course.id, skill: skillId, question: served.question, variant: served.variant, words: served.words, answers });
    jobId = j.id;
  }

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !served) return;
    const r = await recordResult({ course: data.course, store, profile, served, parts, answers, achievements });
    summary = r.summary;
    xpGained = r.xp;
  }

  const fmtDelta = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d))}`;
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
      <button class="btn link" disabled={back >= past.length} onclick={() => back++}>← Back</button>
      {#if back > 0}
        <span class="muted small">{ago(past[back - 1]!.at)} · {back} of {past.length}</span>
        <button class="btn link" onclick={() => back--}>Forward →</button>
        <button class="btn link" onclick={() => (back = 0)}>Current question</button>
      {/if}
      <span class="nav-end">
        {#if back === 0 && served}<ShareButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} />{/if}
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
        <div class="result-row">
          <div><span class="k">Outcome</span><span class="v">{Math.round(summary.outcome * 100)}%</span></div>
          <div><span class="k">θ</span><span class="v">{Math.round(p.after.theta)} <span class:up={p.deltaTheta >= 0} class:down={p.deltaTheta < 0}>{fmtDelta(p.deltaTheta)}</span></span></div>
          <div><span class="k">Score</span><span class="v">{score(p.after.theta)}</span></div>
          <div><span class="k">Rank</span><span class="v"><RankDot rank={p.rankAfter as RankLevel} label /></span></div>
          <div><span class="k">XP</span><span class="v xp">+{xpGained}</span></div>
        </div>
        {#if p.rankAfter > p.rankBefore}
          <p class="rank-up">Rank up: {RANK_LABEL[p.rankBefore]} → {RANK_LABEL[p.rankAfter]}</p>
        {:else if p.rankAfter < p.rankBefore}
          <p class="muted">Rank down: {RANK_LABEL[p.rankBefore]} → {RANK_LABEL[p.rankAfter]}</p>
        {/if}
        {#if store.error}<p class="feedback bad">{store.error}</p>{/if}
        <h2>Solution</h2>
        <Markdown text={question.solution} />
        <div class="actions"><button class="btn primary" onclick={next}>Next question</button></div>
      </section>
    {/if}
    </div>
  {/if}
</div>

<style>
  .history-nav { display: flex; align-items: center; gap: 6px 16px; margin: -4px 0 10px; flex-wrap: wrap; }
  .nav-end { margin-left: auto; display: inline-flex; align-items: center; gap: 16px; }
  .small { font-size: 12px; }
  .result.past { margin-top: 0; }
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .result { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .feedback { margin: 0; font-size: 13px; }
  .bad { color: var(--bad); }
  .actions { display: flex; gap: 8px; }
  .result-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  @media (max-width: 520px) { .result-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .result-row div { display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .up { color: var(--good); font-size: 13px; }
  .xp { color: var(--accent); }
  .down { color: var(--bad); font-size: 13px; }
  .rank-up { font-weight: 600; color: var(--accent); }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 18px 0 8px; }
</style>
