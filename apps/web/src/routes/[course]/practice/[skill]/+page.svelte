<script lang="ts">
  import { page } from "$app/state";
  import { maxAttempts, tierOf, type RankLevel } from "@intellectify/engine";
  import type { AnswerSpec } from "@intellectify/checker";
  import Markdown from "$lib/components/Markdown.svelte";
  import MathField from "$lib/components/MathField.svelte";
  import RankDot from "$lib/components/RankDot.svelte";
  import { indexSkills, loadQuestions, type QuestionT } from "$lib/content";
  import { computeRollups, scoreQuestion, serveQuestion, stateOrNew, type ResultSummary, type Served } from "$lib/practice";
  import { RANK_LABEL, score } from "$lib/ranks";
  import { courseProgress } from "$lib/session.svelte";

  let { data } = $props();
  const skillId = $derived(page.params.skill);
  const entry = $derived(indexSkills(data.course).get(skillId));
  const store = $derived(courseProgress(data.course.id));

  type PartState = { answer: string; choice: string[]; attempts: number; solvedOn: number | null; done: boolean; message: string | null };

  let pool = $state<QuestionT[] | null>(null);
  let served = $state<Served | null>(null);
  let parts = $state<PartState[]>([]);
  let summary = $state<ResultSummary | null>(null);
  let checking = $state(false);
  let checker: typeof import("@intellectify/checker") | null = null;

  const question = $derived(served?.question ?? null);
  const tier = $derived(question ? tierOf(question.rating) : 3);
  const allowed = $derived(maxAttempts(tier));
  const resolved = $derived(parts.length > 0 && parts.every((p) => p.done));

  // Load the pool when the skill changes, once progress is available.
  let loadedFor = "";
  $effect(() => {
    if (!store?.loaded || loadedFor === skillId) return;
    loadedFor = skillId;
    pool = null;
    loadQuestions(fetch, data.course.id, skillId).then((qs) => {
      pool = qs;
      next();
    });
    import("@intellectify/checker").then((m) => (checker = m));
  });

  function next() {
    if (!store || !pool) return;
    summary = null;
    served = serveQuestion(pool, stateOrNew(store.progress, skillId));
    parts = (served?.question.parts ?? []).map(() => ({ answer: "", choice: [], attempts: 0, solvedOn: null, done: false, message: null }));
  }

  const isChoice = (spec: AnswerSpec | undefined) => spec?.type === "mcq" || spec?.type === "multi-select";

  async function check() {
    if (!question || resolved || checking) return;
    checking = true;
    checker ??= await import("@intellectify/checker");
    question.parts.forEach((p, i) => {
      const st = parts[i]!;
      if (st.done || !p.answer) return;
      const given = isChoice(p.answer) ? (p.answer.type === "mcq" ? (st.choice[0] ?? "") : st.choice) : st.answer;
      if ((typeof given === "string" && !given.trim()) || (Array.isArray(given) && given.length === 0)) {
        st.message = "Enter an answer first.";
        return;
      }
      const verdict = checker!.checkAnswer(p.answer as AnswerSpec, given);
      st.attempts += 1;
      if (verdict.correct) {
        st.solvedOn = st.attempts;
        st.done = true;
        st.message = null;
      } else {
        const left = allowed - st.attempts;
        st.message = left > 0 ? `${verdict.message} ${left} attempt${left === 1 ? "" : "s"} left.` : verdict.message;
        if (left <= 0) st.done = true;
      }
    });
    checking = false;
    if (parts.every((p) => p.done)) await finish();
  }

  async function giveUp() {
    parts.forEach((p) => {
      if (!p.done) {
        p.done = true;
        p.message = null;
      }
    });
    await finish();
  }

  async function finish() {
    if (!question || !store || !served) return;
    const result = scoreQuestion(
      store.progress,
      question,
      question.parts.map((p, i) => ({ id: p.id, marks: p.marks, solvedOn: parts[i]!.solvedOn })),
    );
    const after = { ...store.progress, skills: { ...store.progress.skills, ...result.changes.skills }, responseSkills: { ...store.progress.responseSkills, ...result.changes.responseSkills } };
    const rollups = computeRollups(data.course, after);
    summary = result;
    await store.save(
      { ...result.changes, rollupRanks: rollups.ranks },
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        course: data.course.id,
        questionId: question.id,
        questionVersion: question.version,
        variant: served.variant,
        skill: question.skills.primary,
        rating: question.rating,
        outcome: result.outcome,
        parts: question.parts.map((p, i) => ({ id: p.id, solvedOn: parts[i]!.solvedOn, answers: [parts[i]!.answer || parts[i]!.choice.join(",")] })),
        deltaTheta: result.primary.deltaTheta,
        at: Date.now(),
      },
    );
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
    <p class="muted">No questions yet.</p>
  {:else}
    <article class="question">
      <div class="meta">
        <span class="tier">Tier {tier}</span>
        <span class="muted">Rating {question.rating}</span>
        {#if question.requiresCalculator}<span class="muted">Calculator</span>{/if}
        {#if !resolved}<span class="muted attempts">{allowed === Infinity ? "Unlimited attempts" : `${allowed} attempt${allowed === 1 ? "" : "s"} per part`}</span>{/if}
      </div>

      <Markdown text={question.stem} />

      <form onsubmit={(e) => { e.preventDefault(); check(); }}>
        {#each question.parts as p, i (p.id)}
          {@const st = parts[i]!}
          <div class="part" class:solved={st.solvedOn !== null} class:failed={st.done && st.solvedOn === null}>
            {#if question.parts.length > 1}<span class="part-id">({p.id})</span>{/if}
            <div class="part-body">
              {#if p.prompt}<Markdown text={p.prompt} />{/if}
              {#if isChoice(p.answer)}
                <div class="options" role={p.answer?.type === "mcq" ? "radiogroup" : "group"}>
                  {#each p.options ?? [] as o (o.id)}
                    <label class="option" class:picked={st.choice.includes(o.id)}>
                      {#if p.answer?.type === "mcq"}
                        <input type="radio" name="part-{p.id}" value={o.id} disabled={st.done} checked={st.choice[0] === o.id} onchange={() => (st.choice = [o.id])} />
                      {:else}
                        <input type="checkbox" value={o.id} disabled={st.done} checked={st.choice.includes(o.id)}
                          onchange={(e) => (st.choice = e.currentTarget.checked ? [...st.choice, o.id] : st.choice.filter((c) => c !== o.id))} />
                      {/if}
                      <Markdown text={o.text} inline />
                    </label>
                  {/each}
                </div>
              {:else}
                <MathField bind:value={st.answer} disabled={st.done} label="Answer{question.parts.length > 1 ? ` to part ${p.id}` : ''}" onsubmit={check} />
              {/if}
              {#if st.solvedOn !== null}
                <p class="feedback good">Correct{st.solvedOn > 1 ? ` on attempt ${st.solvedOn}` : ""}.</p>
              {:else if st.message}
                <p class="feedback bad" role="status">{st.message}</p>
              {/if}
            </div>
          </div>
        {/each}

        {#if !resolved}
          <div class="actions">
            <button class="btn primary" disabled={checking}>Check</button>
            <button type="button" class="btn quiet" onclick={giveUp}>Give up</button>
          </div>
        {/if}
      </form>
    </article>

    {#if resolved && summary}
      {@const p = summary.primary}
      <section class="result">
        <div class="result-row">
          <div><span class="k">Outcome</span><span class="v">{Math.round(summary.outcome * 100)}%</span></div>
          <div><span class="k">θ</span><span class="v">{Math.round(p.after.theta)} <span class:up={p.deltaTheta >= 0} class:down={p.deltaTheta < 0}>{fmtDelta(p.deltaTheta)}</span></span></div>
          <div><span class="k">Score</span><span class="v">{score(p.after.theta)}</span></div>
          <div><span class="k">Rank</span><span class="v"><RankDot rank={p.rankAfter as RankLevel} label /></span></div>
        </div>
        {#if p.rankAfter > p.rankBefore}
          <p class="rank-up">Rank up: {RANK_LABEL[p.rankBefore]} → {RANK_LABEL[p.rankAfter]}</p>
        {:else if p.rankAfter < p.rankBefore}
          <p class="muted">Rank dropped to {RANK_LABEL[p.rankAfter]}.</p>
        {/if}
        {#if store.error}<p class="feedback bad">{store.error}</p>{/if}
        <h2>Solution</h2>
        <Markdown text={question.solution} />
        <div class="actions"><button class="btn primary" onclick={next}>Next question</button></div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .question, .result { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .result { margin-top: 16px; }
  .meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 12px; margin-bottom: 14px; }
  .tier { font-weight: 600; color: var(--accent); }
  .attempts { margin-left: auto; }
  form { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
  .part { display: flex; gap: 10px; }
  .part-id { font-weight: 600; padding-top: 2px; }
  .part-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .part.solved :global(.field) { border-color: var(--good); }
  .part.failed :global(.field) { border-color: var(--bad); }
  .options { display: flex; flex-direction: column; gap: 6px; }
  .option { display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; cursor: pointer; }
  .option.picked { border-color: var(--accent); background: var(--accent-soft); }
  .feedback { margin: 0; font-size: 13px; }
  .good { color: var(--good); }
  .bad { color: var(--bad); }
  .actions { display: flex; gap: 8px; }
  .result-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  @media (max-width: 520px) { .result-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .result-row div { display: flex; flex-direction: column; gap: 2px; }
  .k { font-size: 11px; color: var(--muted); }
  .v { font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .up { color: var(--good); font-size: 13px; }
  .down { color: var(--bad); font-size: 13px; }
  .rank-up { font-weight: 600; color: var(--accent); }
  h2 { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--muted); margin: 18px 0 8px; }
</style>
