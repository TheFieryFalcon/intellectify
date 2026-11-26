<script lang="ts">
  /** Section quiz (8) and unit quiz (15): a fixed tier mix across the skills (SPEC §8.2, §8.3). */
  import { page } from "$app/state";
  import { freeResponseOutcome, XP, type RankLevel } from "@intellectify/engine";
  import { isRubricMarked } from "@intellectify/content/marking";
  import WrittenAnswerCard from "$lib/components/WrittenAnswerCard.svelte";
  import MarkView from "$lib/components/MarkView.svelte";
  import { markingFor } from "$lib/marking.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import RankDot from "$lib/components/RankDot.svelte";
  import { loadSectionReviews, loadUnitReviews, loadWords } from "$lib/content";
  import { getStartTier, stateOrNew, type PartResult, type Served } from "$lib/practice";
  import { RANK_LABEL } from "$lib/ranks";
  import { recordResult } from "$lib/record";
  import { buildQuiz, bySkill, QUIZ_MIX } from "$lib/review";
  import { profileFor } from "$lib/profile.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import type { StoredSkillState } from "$lib/backend";

  let { data } = $props();
  const scope = $derived(page.params.scope === "unit" ? "unit" : "section");
  const store = $derived(courseProgress(data.course.id));
  const profile = $derived(profileFor(session.backend, session.user));
  const achievements = $derived(achievementsFor(session.backend, session.user, data.course));
  const marking = $derived(markingFor(session.backend, session.user));

  /** The skills in scope, and a name for the header. */
  const target = $derived.by(() => {
    for (const u of data.course.units) {
      if (scope === "unit" && String(u.number) === page.params.id) return { name: `Unit ${u.number}`, skills: u.sections.flatMap((s) => s.skills) };
      for (const s of u.sections) if (scope === "section" && s.id === page.params.id) return { name: s.name, skills: s.skills };
    }
    return null;
  });

  let quiz = $state<Served[] | null>(null);
  let index = $state(0);
  let resolved = $state(false);
  /** One per answered question; written answers carry their marking job until the mark lands. */
  let results = $state<{ skill: string; outcome: number | null; firstTry: boolean; jobId?: string }[]>([]);
  /** Written answers take their outcome from the marking queue as marks arrive. */
  const settled = $derived(
    results.map((r) => {
      if (!r.jobId) return r;
      const job = marking?.job(r.jobId);
      const res = job?.appeal?.result ?? job?.result;
      return { ...r, outcome: job?.status === "failed" ? 0 : res ? freeResponseOutcome(res.score) : null, firstTry: !!res && res.score >= 0.6 };
    }),
  );
  const pending = $derived(settled.filter((r) => r.outcome === null).length);
  let xp = $state(0);
  let before: Record<string, StoredSkillState | undefined> = {};
  let done = $state(false);

  let loadedFor = "";
  $effect(() => {
    if (!store?.loaded || !target || loadedFor === page.url.pathname) return;
    loadedFor = page.url.pathname;
    const skills = target.skills;
    // Quizzes draw only from their own authored pool (SPEC §8), never from practice.
    const pool = loadWords(fetch).then(() => scope === "unit" ? loadUnitReviews(fetch, data.course.id, Number(page.params.id)).then((r) => r.unitQuiz) : loadSectionReviews(fetch, data.course.id, page.params.id!).then((r) => r.sectionQuiz));
    pool.then((qs) => {
      quiz = buildQuiz(bySkill(qs), QUIZ_MIX[scope]);
      // A skill opened for the first time starts from its default placement.
      before = Object.fromEntries(skills.map((k) => [k.id, stateOrNew(store!.progress, k.id, getStartTier(data.course.id))]));
    });
  });

  const current = $derived(quiz?.[index] ?? null);

  async function resolve(parts: PartResult[], answers: string[]) {
    if (!store || !current) return;
    const r = await recordResult({ course: data.course, store, profile, served: current, parts, answers, achievements });
    results = [...results, { skill: current.question.skills.primary, outcome: r.summary.outcome, firstTry: parts.every((p) => p.solvedOn === 1) }];
    xp += r.xp;
    resolved = true;
  }

  async function submitWritten(answers: Record<string, string>) {
    if (!marking || !current) return;
    const q = current.question;
    const job = await marking.submit({ course: data.course.id, skill: q.skills.primary, question: q, variant: current.variant, words: current.words, answers });
    results = [...results, { skill: q.skills.primary, outcome: null, firstTry: false, jobId: job.id }];
    resolved = true;
  }

  // Quiz achievements wait until every written answer is marked.
  let reported = false;
  $effect(() => {
    if (!done || pending > 0 || reported || !store) return;
    reported = true;
    const unit = scope === "unit" ? Number(page.params.id) : (data.course.units.find((u) => u.sections.some((sec) => sec.id === page.params.id))?.number ?? 0);
    void achievements?.quiz({ scope, unit, correct: settled.filter((r) => (r.outcome ?? 0) > 0.6).length, total: settled.length, allFirstTry: settled.every((r) => r.firstTry) }, store, profile);
  });

  async function next() {
    if (!quiz) return;
    if (index + 1 < quiz.length) {
      index++;
      resolved = false;
      return;
    }
    done = true;
    const bonus = scope === "unit" ? XP.unitQuiz : XP.sectionQuiz;
    if (profile) await profile.grant(bonus);
    xp += bonus;
  }

  const correct = $derived(settled.filter((r) => (r.outcome ?? 0) > 0.6).length);
  const skillName = (id: string) => target?.skills.find((k) => k.id === id)?.name ?? id;
  const rows = $derived(
    target?.skills
      .map((k) => {
        const mine = settled.filter((r) => r.skill === k.id);
        const b = before[k.id], a = store?.progress.skills[k.id];
        return { id: k.id, n: mine.length, right: mine.filter((r) => (r.outcome ?? 0) > 0.6).length, dTheta: a && b ? a.theta - b.theta : null, from: (b?.rank ?? 0) as RankLevel, to: (a?.rank ?? 0) as RankLevel };
      })
      .filter((r) => r.n > 0) ?? [],
  );
  const fmt = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d))}`;
</script>

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a> › {target?.name ?? ""}</p>

  {#if !target}
    <p class="muted">Not found</p>
  {:else if !store?.loaded || quiz === null}
    <p class="muted">Loading…</p>
  {:else if quiz.length === 0}
    <p class="muted">No questions yet</p>
  {:else if done}
    <section class="card">
      <h1>{scope === "unit" ? "Unit quiz" : "Section quiz"} · {target.name}</h1>
      <div class="stats">
        <div><span class="k">Correct</span><span class="v">{correct} / {quiz.length}</span></div>
        <div><span class="k">{pending ? "Marking" : "First try"}</span><span class="v">{pending || settled.filter((r) => r.firstTry).length}</span></div>
        <div><span class="k">XP</span><span class="v xp">+{xp}</span></div>
      </div>
      <table>
        <thead><tr><th>Skill</th><th>Correct</th><th>θ</th><th>Rank</th></tr></thead>
        <tbody>
          {#each rows as r (r.id)}
            <tr>
              <td><a href="/{data.course.id}/skill/{r.id}">{skillName(r.id)}</a></td>
              <td class="num">{r.right} / {r.n}</td>
              <td class="num">{r.dTheta === null ? "" : fmt(r.dTheta)}</td>
              <td><RankDot rank={r.to} label />{#if r.to !== r.from}<span class="muted"> from {RANK_LABEL[r.from]}</span>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="actions"><a class="btn primary" href="/{data.course.id}">Back to the tree</a></div>
    </section>
  {:else if current}
    <div class="progress" aria-label="Question {index + 1} of {quiz.length}">
      <span>{scope === "unit" ? "Unit quiz" : "Section quiz"} · {target.name}</span>
      <span class="num">{index + 1} / {quiz.length}</span>
    </div>
    <div class="bar"><span style="width:{(100 * (index + (resolved ? 1 : 0))) / quiz.length}%"></span></div>
    {#key index}
      {#if isRubricMarked(current.question)}
        <WrittenAnswerCard question={current.question} onsubmit={submitWritten} submitted={resolved} />
      {:else}
        <QuestionCard question={current.question} onresolve={resolve} />
      {/if}
    {/key}
    {#if resolved}
      {@const last = results.at(-1)!}
      {@const job = last.jobId && marking ? marking.job(last.jobId) : null}
      <section class="card after">
        {#if job && marking}
          <MarkView {job} queue={marking} />
        {:else}
          <p class:good={(last.outcome ?? 0) > 0.6} class:bad={(last.outcome ?? 0) <= 0.6} class="verdict">{(last.outcome ?? 0) > 0.6 ? "Correct" : "Not this time"}</p>
        {/if}
        <h2>Solution</h2>
        <Markdown text={current.question.solution} />
        <div class="actions"><button class="btn primary" onclick={next}>{index + 1 < quiz.length ? "Next question" : "Finish"}</button></div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .progress { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .bar { height: 4px; background: var(--track); border-radius: 2px; margin-bottom: 14px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); transition: width 0.3s; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .after { margin-top: 16px; }
  h1 { font-size: 22px; margin: 0 0 14px; }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 14px 0 8px; }
  .verdict { margin: 0; font-weight: 600; }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
  .stats div { display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 18px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .xp { color: var(--accent); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
  th { text-align: left; font-weight: 500; color: var(--muted); font-size: 11px; padding: 6px 4px; border-bottom: 1px solid var(--line); }
  td { padding: 8px 4px; border-bottom: 1px solid var(--line); }
  td a { color: var(--ink); text-decoration: none; }
  td a:hover { color: var(--accent); }
  .num { font-variant-numeric: tabular-nums; }
  .actions { display: flex; gap: 8px; margin-top: 12px; }
</style>
