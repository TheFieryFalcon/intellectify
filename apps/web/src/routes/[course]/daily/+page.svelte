<script lang="ts">
  import ShareButton from "$lib/components/ShareButton.svelte";
  import TutorialButton from "$lib/components/TutorialButton.svelte";
  import ReportButton from "$lib/components/ReportButton.svelte";
  /**
   * Daily problem (SPEC §8.5): one per year group per day, the same for everyone, targeting the block the
   * year group has just learnt, at the day's tier. Normal attempt rules; it updates θ like any problem.
   */
  import { page } from "$app/state";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import ResultRow from "$lib/components/ResultRow.svelte";
  import { isRubricMarked } from "@intellectify/content/marking";
  import { markingFor } from "$lib/marking.svelte";
  import { indexSkills } from "$lib/content";
  import { type PartResult, type ResultSummary, type Served } from "$lib/practice";
  import { recordResult } from "$lib/record";
  import { perthDay, profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import { currentStreak, dailyTarget, dailyTier, yearGroupOf, type YearGroup } from "$lib/daily";
  import { dateOfDay, tierOf } from "@intellectify/engine";
  import { dailyProblem } from "$lib/dailyProblem";
  import { onDaily } from "$lib/achievements";

  let { data } = $props();
  const store = $derived(courseProgress(data.course.id));
  const profile = $derived(profileFor(session.backend, session.user));
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  const marking = $derived(markingFor(session.backend, session.user));

  const day = perthDay();
  const tier = dailyTier(day);
  const own = $derived(yearGroupOf(profile?.profile.placement?.source));
  const year = $derived<YearGroup>(page.url.searchParams.get("y") === "12" ? 12 : page.url.searchParams.get("y") === "11" ? 11 : own);
  const key = $derived(`${day}:${data.course.id}:${year}`);
  const done = $derived(profile?.profile.daily?.done[key] ?? null);
  const streak = $derived(currentStreak(profile?.profile.daily, day));

  const skills = $derived(indexSkills(data.course));
  const target = $derived(
    dailyTarget(data.course.schedules, year, day, (id) => (skills.get(id)?.skill.questionCount ?? 0) > 0, [...skills.keys()], data.course.calendars ?? []),
  );

  let served = $state<Served | null>(null);
  let loading = $state(true);
  let summary = $state<ResultSummary | null>(null);
  /** XP from answering plus the daily bonus. */
  let xpGained = $state(0);
  let dailyBonus = $state(0);
  let jobId = $state<string | null>(null);
  const job = $derived(jobId && marking ? marking.job(jobId) : null);

  // The day's question: the same seed everywhere picks the same question, variant and words.
  let loadedFor = "";
  $effect(() => {
    const t = target;
    const k = key;
    if (!store?.loaded || loadedFor === k) return;
    loadedFor = k;
    loading = true;
    served = null;
    summary = null;
    jobId = null;
    if (!t) {
      loading = false;
      return;
    }
    dailyProblem(fetch, data.course, day, year).then((d) => {
      served = d.served;
      loading = false;
    });
  });

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !served || !profile) return;
    const r = await recordResult({ course: data.course, store, profile, served, parts, answers, achievements, mode: "daily" });
    summary = r.summary;
    xpGained = r.xp;
    const solved = r.summary.outcome > 0;
    const bonus = await profile.recordDaily(key, day, solved, tierOf(served.question.rating));
    dailyBonus = bonus;
    await achievements?.event(
      (s) => onDaily(s, { day, solved, firstTry: solved && parts.every((p) => p.solvedOn === 1), streak: profile.profile.daily?.streak ?? 0 }),
      store,
      profile,
    );
  }

  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !served || !profile) return;
    const j = await marking.submit({ course: data.course.id, skill: served.question.skills.primary, question: served.question, variant: served.variant, words: served.words, daily: key, answers });
    jobId = j.id;
    await profile.recordDaily(key, day, false);
  }

  const dayLabel = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(dateOfDay(day));
  const yearHref = (y: YearGroup) => `/${data.course.id}/daily?y=${y}`;
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a></p>
  <header>
    <h1>Daily problem</h1>
    <nav class="years" aria-label="Year group">
      {#each [11, 12] as const as y (y)}
        <a href={yearHref(y)} class:on={year === y} aria-current={year === y ? "page" : undefined}>Year {y}</a>
      {/each}
    </nav>
  </header>
  <dl class="facts">
    <div><dt>Day</dt><dd>{dayLabel}</dd></div>
    <div><dt>Tier</dt><dd>{tier}</dd></div>
    {#if target}<div><dt>Topic</dt><dd>{target.name}{#if target.earlier}<span class="muted"> · latest with questions</span>{/if}</dd></div>{/if}
    <div><dt>Streak</dt><dd>{streak}{#if profile?.profile.daily?.best}<span class="muted"> · best {profile.profile.daily.best}</span>{/if}</dd></div>
  </dl>

  {#if loading || !store?.loaded}
    <p class="muted">Loading…</p>
  {:else if !served}
    <p class="muted">No daily problem for Year {year} yet</p>
  {:else if done && !summary && !job}
    <section class="card">
      <p class="status">{done === "solved" ? "Solved today" : "Tried today"}</p>
      <Markdown text={served.question.stem} />
      <h2>Solution</h2>
      <Markdown text={served.question.solution} />
    </section>
  {:else}
    <div class="share-row"><span class="tools"><TutorialButton course={data.course} skill={served.question.skills.primary} /><ShareButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} /><ReportButton course={data.course.id} question={served.question} variant={served.variant} words={served.words} /></span></div>
    {#if isRubricMarked(served.question)}
      <WrittenAnswerCard question={served.question} onsubmit={submitWritten} submitted={jobId !== null} />
    {:else}
      <QuestionCard question={served.question} onresolve={resolve} />
    {/if}
    {#if job && marking}
      <section class="card">
        <MarkView {job} queue={marking} />
        <h2>Solution</h2>
        <Markdown text={served.question.solution} />
      </section>
    {/if}
    {#if summary}
      <section class="card">
        <p class="status">{summary.outcome > 0 ? "Solved" : "Not solved"}{#if dailyBonus} · daily bonus +{dailyBonus} XP{/if}</p>
        <ResultRow outcome={summary.outcome} theta={summary.primary.after.theta} deltaTheta={summary.primary.deltaTheta} rankBefore={summary.primary.rankBefore} rankAfter={summary.primary.rankAfter} xp={xpGained + dailyBonus} />
        <h2>Solution</h2>
        <Markdown text={served.question.solution} />
      </section>
    {/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 26px; }
  .years { display: flex; gap: 4px; background: var(--region); border-radius: 999px; padding: 3px; }
  .years a { padding: 5px 12px; border-radius: 999px; font-size: 13px; color: var(--muted); text-decoration: none; }
  .years a.on { background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgb(0 0 0 / 0.08); }
  .facts { display: flex; flex-wrap: wrap; gap: 6px 22px; margin: 14px 0 16px; font-size: 14px; }
  .facts div { display: flex; flex-direction: column; gap: 2px; }
  .facts dt { font-size: 11px; color: var(--muted); }
  .facts dd { margin: 0; display: flex; align-items: center; gap: 5px; }
  .card { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .status { margin: 0 0 10px; font-weight: 600; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 18px 0 8px; }
  .share-row { display: flex; justify-content: flex-end; margin: 0 0 6px; }
</style>
