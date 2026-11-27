<script lang="ts">
  import { checkGate, gateReady } from "$lib/gate.svelte";
  /**
   * One question: stem, parts and answer inputs, with attempts per part (SPEC §15.4).
   * Calls `onresolve` once every part is solved, out of attempts, or given up.
   */
  import { maxAttempts, tierOf } from "@intellectify/engine";
  import type { AnswerSpec } from "@intellectify/checker";
  import type { QuestionT } from "$lib/content";
  import { partRating } from "@intellectify/content/schema";
  import type { PartResult } from "$lib/practice";
  import Markdown from "./Markdown.svelte";
  import MathField from "./MathField.svelte";
  import MathKeypad from "./MathKeypad.svelte";
  import type { Key } from "$lib/keypad";
  import PaperFirst from "./PaperFirst.svelte";
  import PaperTip from "./PaperTip.svelte";
  import { paperFirst } from "$lib/paper.svelte";

  let { question, onresolve, header = true }: { question: QuestionT; onresolve: (parts: PartResult[], answers: string[]) => void | Promise<void>; header?: boolean } = $props();

  type PartState = { answer: string; choice: string[]; attempts: number; solvedOn: number | null; done: boolean; message: string | null };
  const fresh = (q: QuestionT): PartState[] => q.parts.map(() => ({ answer: "", choice: [], attempts: 0, solvedOn: null, done: false, message: null }));
  let parts = $state<PartState[]>(fresh(question));
  let checking = $state(false);
  let checker: typeof import("@intellectify/checker") | null = null;
  import("@intellectify/checker").then((m) => (checker = m));

  const tier = $derived(tierOf(question.rating));
  /** Ratings are per part (SPEC §5.1): each part has its own tier and attempts. */
  const partTiers = $derived(question.parts.map((p) => tierOf(partRating(question, p))));
  const mixed = $derived(new Set(partTiers).size > 1);
  const allowedFor = (i: number) => maxAttempts(partTiers[i] ?? tier);
  const allowed = $derived(maxAttempts(tier));
  const resolved = $derived(parts.length > 0 && parts.every((p) => p.done));
  const isChoice = (spec: AnswerSpec | undefined) => spec?.type === "mcq" || spec?.type === "multi-select";

  /** One keypad per question (computers; phones use the field's own keyboard): it types into the last answer box used. */
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  let fields = $state<(MathField | undefined)[]>([]);
  let active = $state(0);
  const typed = $derived(question.parts.some((p) => !isChoice(p.answer)));
  function press(key: Key) {
    const open = (i: number) => !isChoice(question.parts[i]?.answer) && !parts[i]?.done && fields[i];
    const i = open(active) ? active : question.parts.findIndex((_, j) => open(j));
    if (i >= 0) fields[i]!.insert(key);
  }

  async function check() {
    if (resolved || checking) return;
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
        const left = allowedFor(i) - st.attempts;
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
    await onresolve(
      question.parts.map((p, i) => ({ id: p.id, marks: p.marks, solvedOn: parts[i]!.solvedOn })),
      parts.map((p) => p.answer || p.choice.join(",")),
    );
  }

  // A new question: anonymous accounts past their limit must sign up or log in first (SPEC §2.1a).
  let gateChecked = false;
  $effect(() => {
    if (gateChecked || !gateReady()) return;
    gateChecked = true;
    checkGate();
  });
</script>

<article class="question">
  {#if header}
    <div class="meta">
      <span class="tier">Tier {tier}</span>
      <span class="muted">Rating {question.rating}</span>
      {#if question.requiresCalculator}<span class="muted">Calculator</span>{/if}
      {#if paperFirst(question)}<PaperFirst />{/if}
      {#if !resolved && !mixed}<span class="muted attempts">{allowed === Infinity ? "Unlimited attempts" : `${allowed} attempt${allowed === 1 ? "" : "s"} per part`}</span>{/if}
    </div>
    {#if paperFirst(question)}<PaperTip />{/if}
  {/if}

  <Markdown text={question.stem} />

  <form onsubmit={(e) => { e.preventDefault(); check(); }}>
    {#each question.parts as p, i (p.id)}
      {@const st = parts[i]!}
      <div class="part" class:solved={st.solvedOn !== null} class:failed={st.done && st.solvedOn === null}>
        {#if question.parts.length > 1}<span class="part-id">({p.id}){#if mixed}<span class="part-tier">T{partTiers[i]}</span>{/if}</span>{/if}
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
            <MathField bind:this={fields[i]} bind:value={st.answer} disabled={st.done} label="Answer{question.parts.length > 1 ? ` to part ${p.id}` : ''}" onsubmit={check} onfocus={() => (active = i)} />
          {/if}
          {#if st.solvedOn !== null}
            <p class="feedback good">Correct{st.solvedOn > 1 ? ` on attempt ${st.solvedOn}` : ""}</p>
          {:else if st.message}
            <p class="feedback bad" role="status">{st.message}</p>
          {/if}
        </div>
      </div>
    {/each}

    {#if !resolved && typed && !touch}<MathKeypad oninsert={press} />{/if}

    {#if !resolved}
      <div class="actions">
        <button class="btn primary" disabled={checking}>Check</button>
        <button type="button" class="btn quiet" onclick={giveUp}>Give up</button>
      </div>
    {/if}
  </form>
</article>

<style>
  .question { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; }
  .meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 12px; margin-bottom: 14px; }
  .tier { font-weight: 600; color: var(--accent); }
  .attempts { margin-left: auto; }
  form { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
  .part { display: flex; gap: 10px; }
  .part-id { font-weight: 600; padding-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .part-tier { font-size: 10px; font-weight: 600; color: var(--accent); }
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
</style>
