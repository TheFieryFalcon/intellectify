<script lang="ts">
  import ShareButton from "$lib/components/ShareButton.svelte";
  import TutorialButton from "$lib/components/TutorialButton.svelte";
  import ResultRow from "$lib/components/ResultRow.svelte";
  import ReportButton from "$lib/components/ReportButton.svelte";
  const MODE = "challenge" as const;
  /** Section Challenge: Tier 4–5 problems across a section, untimed and resumable (SPEC §8.4). */
  import { page } from "$app/state";
  import { freeResponseOutcome, XP } from "@intellectify/engine";
  import { isRubricMarked } from "@intellectify/content/marking";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import { markingFor } from "$lib/marking.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import RankDot from "$lib/components/RankDot.svelte";
  import { loadSectionReviews, loadWords, type QuestionT } from "$lib/content";
  import { reserve, type PartResult, type ResultSummary, type Served } from "$lib/practice";
  import { recordResult } from "$lib/record";
  import { serve, slopeOf, type ChallengeState } from "$lib/review";
  import SlopeMark from "$lib/components/SlopeMark.svelte";
  import { SLOPES } from "@intellectify/content/reviews";
  import { profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";

  let { data } = $props();
  const sectionId = $derived(page.params.section);
  const section = $derived(data.course.units.flatMap((u) => u.sections).find((s) => s.id === sectionId) ?? null);
  const store = $derived(courseProgress(data.course.id));
  const profile = $derived(profileFor(session.backend, session.user));
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  const marking = $derived(markingFor(session.backend, session.user));

  let pool = $state<Map<string, QuestionT> | null>(null);
  /** The Challenge's fixed sequence (SPEC §8.4). */
  let sequence = $state<QuestionT[]>([]);
  let ch = $state<ChallengeState | null | undefined>(undefined);
  let resolved = $state(false);
  let lastOutcome = $state(0);
  /** The last auto-marked result, for its result row. */
  let lastResult = $state<{ summary: ResultSummary; xp: number } | null>(null);
  let finishing = $state(false);

  /** Skills below Gold get the soft-gate notice. */
  const belowGold = $derived(section?.skills.filter((k) => (store?.progress.skills[k.id]?.rank ?? 0) < 3) ?? []);

  let loadedFor = "";
  $effect(() => {
    const user = session.user, backend = session.backend;
    if (!store?.loaded || !section || !user || !backend || loadedFor === sectionId) return;
    loadedFor = sectionId;
    // The Challenge draws only from its own authored pool (SPEC §8.4), never from practice.
    Promise.all([loadSectionReviews(fetch, data.course.id, sectionId), loadWords(fetch)]).then(async ([r]) => {
      sequence = r.challenge;
      pool = new Map(r.challenge.map((q) => [q.id, q] as [string, QuestionT]));
      ch = await backend.loadChallenge(user.uid, data.course.id, sectionId);
    });
  });

  const save = (s: ChallengeState | null) => session.backend && session.user && session.backend.saveChallenge(session.user.uid, data.course.id, sectionId, s);

  async function start() {
    if (!section) return;
    const served = sequence.map((q) => serve(q));
    ch = { questions: served.map((s) => ({ id: s.question.id, variant: s.variant, words: s.words })), results: [], startedAt: Date.now(), finishedAt: null };
    resolved = false;
    await save(ch);
  }

  /** The current question, rebuilt from its saved ID and variant. */
  const current = $derived.by((): Served | null => {
    if (!ch || !pool || ch.finishedAt) return null;
    const ref = ch.questions[ch.results.length - (resolved ? 1 : 0)];
    const q = ref && pool.get(ref.id);
    if (!q) return null;
    return reserve(q, ref.variant, ref.words);
  });

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !current || !ch) return;
    const r = await recordResult({ course: data.course, store, profile, served: current, parts, answers, achievements, mode: MODE });
    lastOutcome = r.summary.outcome;
    lastResult = r;
    ch = { ...ch, results: [...ch.results, { id: current.question.id, outcome: r.summary.outcome, firstTry: parts.every((p) => p.solvedOn === 1) }] };
    resolved = true;
    await save(ch);
  }

  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !current || !ch) return;
    const q = current.question;
    const job = await marking.submit({ course: data.course.id, skill: q.skills.primary, question: q, variant: current.variant, words: current.words, mode: MODE, answers });
    ch = { ...ch, results: [...ch.results, { id: q.id, outcome: null, firstTry: false, jobId: job.id }] };
    resolved = true;
    await save(ch);
  }

  /** Later-unit sections a problem draws on (SPEC §8.4), with their unit, for the notice. */
  const sectionsById = $derived(new Map(data.course.units.flatMap((u) => u.sections.map((s) => [s.id, { name: s.name, unit: u.number }] as const))));
  const laterContent = (q: QuestionT) => q.requires.map((id) => sectionsById.get(id)).filter((x) => !!x);

  /** Skip a problem that needs a later unit: no θ change, and left out of the average. */
  async function skip() {
    if (!ch || !current) return;
    ch = { ...ch, results: [...ch.results, { id: current.question.id, outcome: null, firstTry: false, skipped: true }] };
    resolved = false;
    await save(ch);
    await next();
  }

  /** Written answers take their outcome from the marking queue as marks arrive. */
  const settled = $derived(
    (ch?.results ?? []).map((r) => {
      if (!r.jobId) return r;
      const job = marking?.job(r.jobId);
      const res = job?.appeal?.result ?? job?.result;
      return { ...r, outcome: job?.status === "failed" ? 0 : res ? freeResponseOutcome(res.score) : r.outcome, firstTry: res ? res.score >= 0.6 : r.firstTry };
    }),
  );
  const pending = $derived(settled.filter((r) => r.outcome === null && !r.skipped).length);
  /** Problems actually attempted (skipped ones don't count). */
  const attempted = $derived(settled.filter((r) => !r.skipped));

  // Challenge achievements wait until every written answer is marked; marks are saved into the challenge.
  let reported = false;
  $effect(() => {
    if (!ch?.finishedAt || pending > 0 || reported || !store) return;
    reported = true;
    const changed = settled.some((r, i) => r.outcome !== ch!.results[i]?.outcome);
    if (changed) {
      ch = { ...ch, results: settled };
      void save(ch);
    }
    const avg = attempted.reduce((t, r) => t + (r.outcome ?? 0), 0) / Math.max(1, attempted.length);
    // A sweep needs every problem done first time, so skipping one rules it out.
    void achievements?.challenge({ section: sectionId, average: avg, allFirstTry: settled.every((r) => r.firstTry) }, store, profile);
  });

  async function next() {
    if (!ch) return;
    resolved = false;
    if (ch.results.length >= ch.questions.length) {
      finishing = true;
      ch = { ...ch, finishedAt: Date.now() };
      await save(ch);
      if (profile) await profile.grant(XP.sectionChallenge);
      finishing = false;
    }
  }

  async function restart() {
    await save(null);
    ch = null;
  }

  const average = $derived(attempted.length ? attempted.reduce((t, r) => t + (r.outcome ?? 0), 0) / attempted.length : 0);
  const skipped = $derived(settled.length - attempted.length);
  const shown = $derived(ch ? ch.results.length - (resolved ? 1 : 0) : 0);
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a> › {section?.name ?? ""}</p>

  {#if !section}
    <p class="muted">Not found</p>
  {:else if !store?.loaded || pool === null || ch === undefined}
    <p class="muted">Loading…</p>
  {:else if ch === null}
    <section class="card">
      <h1>Section Challenge · {section.name}</h1>
      <p class="muted">{sequence.length} problems · untimed · progress saved{#if sequence.some((q) => q.requires.length)}{" · "}{sequence.filter((q) => q.requires.length).length} use a later unit (skippable){/if}</p>
      <p class="ramp">
        {#each SLOPES as g, i (g)}{#if i}<span class="arrow">→</span>{/if}<SlopeMark slope={g} label />
          <span class="muted count">{sequence.filter((q) => slopeOf(q.rating) === g).length}</span>{/each}
      </p>
      {#if belowGold.length}
        <div class="notice" role="note">
          <strong>Recommended at Gold</strong>
          <ul>{#each belowGold as k (k.id)}<li><RankDot rank={store.progress.skills[k.id]?.rank ?? 0} /> <a href="/{data.course.id}/skill/{k.id}">{k.name}</a></li>{/each}</ul>
        </div>
      {/if}
      <div class="actions"><button class="btn primary" onclick={start}>Start</button></div>
    </section>
  {:else if ch.finishedAt}
    <section class="card">
      <h1>Section Challenge · {section.name}</h1>
      <div class="stats">
        <div><span class="k">Average outcome</span><span class="v">{pending ? "…" : `${Math.round(average * 100)}%`}</span></div>
        <div><span class="k">{pending ? "Marking" : "First try"}</span><span class="v">{pending || `${attempted.filter((r) => r.firstTry).length} / ${attempted.length}`}</span></div>
        {#if skipped}<div><span class="k">Skipped</span><span class="v">{skipped}</span></div>{/if}
        <div><span class="k">Bonus XP</span><span class="v xp">+{XP.sectionChallenge}</span></div>
      </div>
      <div class="actions">
        <a class="btn primary" href="/{data.course.id}">Back to the tree</a>
        <button class="btn" onclick={restart}>Try again</button>
      </div>
    </section>
  {:else if current}
    <div class="progress">
      <span>Section Challenge · {section.name}</span>
      <span class="num"><SlopeMark slope={slopeOf(current.question.rating)} label /> · {shown + 1} / {ch.questions.length}</span>
    </div>
    <div class="bar"><span style="width:{(100 * ch.results.length) / ch.questions.length}%"></span></div>
    {#if !resolved && laterContent(current.question).length}
      <div class="later" role="note">
        <span>Uses {laterContent(current.question).map((s) => `Unit ${s.unit} · ${s.name}`).join(", ")}</span>
        <button class="btn quiet" onclick={skip}>Skip</button>
      </div>
    {/if}
    <div class="share-row"><span class="tools"><TutorialButton course={data.course} skill={current.question.skills.primary} /><ShareButton course={data.course.id} question={current.question} variant={current.variant} words={current.words} /><ReportButton course={data.course.id} question={current.question} variant={current.variant} words={current.words} /></span></div>
    {#key shown}
      {#if isRubricMarked(current.question)}
        <WrittenAnswerCard question={current.question} onsubmit={submitWritten} submitted={resolved} />
      {:else}
        <QuestionCard question={current.question} onresolve={resolve} />
      {/if}
    {/key}
    {#if resolved}
      {@const last = ch.results.at(-1)}
      {@const job = last?.jobId && marking ? marking.job(last.jobId) : null}
      <section class="card after">
        {#if job && marking}
          <MarkView {job} queue={marking} />
        {:else}
          {#if lastResult}<ResultRow outcome={lastResult.summary.outcome} theta={lastResult.summary.primary.after.theta} deltaTheta={lastResult.summary.primary.deltaTheta} rankBefore={lastResult.summary.primary.rankBefore} rankAfter={lastResult.summary.primary.rankAfter} xp={lastResult.xp} />{/if}
        {/if}
        <h2>Solution</h2>
        <Markdown text={current.question.solution} />
        <div class="actions"><button class="btn primary" disabled={finishing} onclick={next}>{ch.results.length < ch.questions.length ? "Next problem" : "Finish"}</button></div>
      </section>
    {/if}
  {:else}
    <p class="muted">This Challenge has changed. <button class="link" onclick={restart}>Start again</button></p>
  {/if}
</div>

<style>
  .ramp { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; }
  .ramp .arrow { color: var(--muted); }
  .later { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 8px 8px 8px 14px; border-radius: 10px; background: var(--region); font-size: 13px; color: var(--muted); }
  .ramp .count { font-size: 12px; margin-left: -4px; }
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .progress { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .bar { height: 4px; background: var(--track); border-radius: 2px; margin-bottom: 14px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); transition: width 0.3s; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .after { margin-top: 16px; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 14px 0 8px; }
  .notice { margin: 14px 0 0; padding: 10px 14px; border-radius: 8px; background: var(--accent-soft); font-size: 13px; }
  .notice ul { margin: 6px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .notice a { color: var(--ink); }
  .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 14px 0 6px; }
  .stats div { display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 18px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .xp { color: var(--accent); }
  .num { font-variant-numeric: tabular-nums; }
  .actions { display: flex; gap: 8px; margin-top: 20px; }
  .link { background: none; border: 0; padding: 0; color: var(--accent); cursor: pointer; font: inherit; }
  .share-row { display: flex; justify-content: flex-end; margin: 0 0 6px; }
</style>
