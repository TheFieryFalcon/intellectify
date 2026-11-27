<script lang="ts">
  import ShareButton from "$lib/components/ShareButton.svelte";
  import TutorialButton from "$lib/components/TutorialButton.svelte";
  import ResultRow from "$lib/components/ResultRow.svelte";
  import ReportButton from "$lib/components/ReportButton.svelte";
  /**
   * A revision session (SPEC §8.6): questions one after another from the chosen mix, for as long as the
   * student likes. Normal attempt rules; answers update θ, XP and achievements like practice.
   */
  import { page } from "$app/state";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import { isRubricMarked } from "@intellectify/content/marking";
  import { markingFor } from "$lib/marking.svelte";
  import { indexSkills, loadIndexedQuestion, loadQuestionIndex, loadWords, type QuestionIndexEntry } from "$lib/content";
  import { answeredIds, serveOne, type PartResult, type ResultSummary, type Served } from "$lib/practice";
  import { recordResult } from "$lib/record";
  import { profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import { candidates, EXAM_TIERS, pickNext, specFromParams } from "$lib/revision";

  let { data } = $props();
  const store = $derived(courseProgress(data.course.id));
  const profile = $derived(profileFor(session.backend, session.user));
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  const marking = $derived(markingFor(session.backend, session.user));
  const skills = $derived(indexSkills(data.course));

  const spec = $derived(specFromParams(page.url.searchParams));
  const scopeName = $derived.by(() => {
    const s = spec.scope;
    if (s.kind === "unit") return `Unit ${s.unit}`;
    if (s.kind === "section") return data.course.units.flatMap((u) => u.sections).find((x) => x.id === s.id)?.name ?? s.id;
    if (s.kind === "skill") return skills.get(s.id)?.skill.name ?? s.id;
    if (s.kind === "subsection") return `${skills.get(s.skill)?.skill.name ?? s.skill} · ${s.name}`;
    return "Whole course";
  });
  const title = $derived(spec.mode === "exam" ? `Exam revision · ${spec.level === "hard" ? "Hard" : "Easy"}` : "Custom revision");
  const tierLabel = $derived(spec.mode === "exam" ? `Tiers ${EXAM_TIERS[spec.level].join(" and ")}` : spec.tiers.length ? `Tiers ${spec.tiers.join(", ")}` : "Any tier");

  let pool = $state<QuestionIndexEntry[] | null>(null);
  let served = $state<Served | null>(null);
  let summary = $state<ResultSummary | null>(null);
  let gained = $state(0);
  let jobId = $state<string | null>(null);
  const job = $derived(jobId && marking ? marking.job(jobId) : null);
  let round = $state(0);
  let loading = $state(false);
  const used = new Set<string>();
  /** This session's tally: outcomes of auto-marked answers; written ones count once marked. */
  let tally = $state<number[]>([]);
  let writtenJobs = $state<string[]>([]);
  const writtenScores = $derived(writtenJobs.map((id) => marking?.job(id)).map((j) => (j?.appeal?.result ?? j?.result)?.score).filter((x): x is number => x !== undefined));
  const scores = $derived([...tally, ...writtenScores]);
  const mean = $derived(scores.length ? Math.round((100 * scores.reduce((a, b) => a + b, 0)) / scores.length) : null);

  let started = "";
  $effect(() => {
    const key = page.url.search;
    if (!store?.loaded || started === key) return;
    started = key;
    used.clear();
    tally = [];
    writtenJobs = [];
    Promise.all([loadQuestionIndex(fetch, data.course.id), loadWords(fetch)]).then(([ix]) => {
      pool = candidates(ix, spec);
      next();
    });
  });

  async function next() {
    if (!pool || !store) return;
    loading = true;
    summary = null;
    jobId = null;
    const waiting = new Set((marking?.jobs ?? []).filter((j) => j.status === "pending").map((j) => j.questionId));
    const e = pickNext(pool.filter((x) => !waiting.has(x.id)), spec, used, answeredIds(store.progress));
    const q = e ? await loadIndexedQuestion(fetch, data.course.id, e) : null;
    if (e) used.add(e.id);
    served = q ? serveOne(q) : null;
    loading = false;
    round++;
  }

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !served) return;
    const r = await recordResult({ course: data.course, store, profile, served, parts, answers, achievements, mode: "revision" });
    summary = r.summary;
    gained = r.xp;
    tally = [...tally, r.summary.outcome];
  }

  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !served) return;
    const q = served.question;
    const j = await marking.submit({ course: data.course.id, skill: q.skills.primary, question: q, variant: served.variant, words: served.words, mode: "revision", answers });
    jobId = j.id;
    writtenJobs = [...writtenJobs, j.id];
  }
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a> › <a href="/{data.course.id}/revision">Revision</a></p>
  <h1>{title}</h1>
  <dl class="facts">
    <div><dt>Scope</dt><dd>{scopeName}</dd></div>
    <div><dt>Mix</dt><dd>{tierLabel}</dd></div>
    <div><dt>Done</dt><dd>{tally.length + writtenJobs.length}</dd></div>
    <div><dt>Average</dt><dd>{mean === null ? "—" : `${mean}%`}</dd></div>
  </dl>

  {#if !store?.loaded || pool === null || (loading && !served)}
    <p class="muted">Loading…</p>
  {:else if !served}
    <p class="muted">No questions match</p>
  {:else}
    {@const q = served.question}
    <div class="skill-row">
      <span class="skill muted">{skills.get(q.skills.primary)?.skill.name ?? q.skills.primary}</span>
      <span class="tools"><TutorialButton course={data.course} skill={q.skills.primary} /><ShareButton course={data.course.id} question={q} variant={served.variant} words={served.words} /><ReportButton course={data.course.id} question={q} variant={served.variant} words={served.words} /></span>
    </div>
    {#key round}
      {#if isRubricMarked(q)}
        <WrittenAnswerCard question={q} onsubmit={submitWritten} submitted={jobId !== null} />
      {:else}
        <QuestionCard question={q} onresolve={resolve} />
      {/if}
    {/key}
    {#if job && marking}
      <section class="card">
        <MarkView {job} queue={marking} />
        <h2>Solution</h2>
        <Markdown text={q.solution} />
        <div class="actions"><button class="btn primary" onclick={next}>Next question</button></div>
      </section>
    {/if}
    {#if summary}
      <section class="card">
        <ResultRow outcome={summary.outcome} theta={summary.primary.after.theta} deltaTheta={summary.primary.deltaTheta} rankBefore={summary.primary.rankBefore} rankAfter={summary.primary.rankAfter} xp={gained} />
        <h2>Solution</h2>
        <Markdown text={q.solution} />
        <div class="actions"><button class="btn primary" onclick={next}>Next question</button></div>
      </section>
    {/if}
    {#if !summary && !job}<div class="skip"><button class="btn link" onclick={next}>Skip</button></div>{/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  h1 { margin: 0 0 10px; font-size: 24px; }
  .facts { display: flex; flex-wrap: wrap; gap: 6px 22px; margin: 0 0 16px; }
  .facts div { display: flex; flex-direction: column; }
  dt { font-size: 11px; color: var(--muted); }
  dd { margin: 0; font-weight: 500; font-variant-numeric: tabular-nums; }
  .skill-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 6px; }
  .skill { font-size: 12px; }
  .card { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 18px 0 8px; }
  .actions { display: flex; gap: 8px; margin-top: 20px; }
  .skip { display: flex; justify-content: flex-end; margin-top: 8px; }
</style>
