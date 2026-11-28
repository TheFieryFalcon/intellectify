<script lang="ts">
  /** Onboarding placement (SPEC §5.3): the student's current maths mark sets their starting tier in each course. */
  import { goto } from "$app/navigation";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { placementTiers, type MarkSource } from "@intellectify/engine";
  import { profileFor } from "$lib/profile.svelte";
  import { session } from "$lib/session.svelte";
  import { loadBannedWords } from "$lib/moderation";
  import { cleanName, NAME_MAX, nameError } from "$lib/names";
  import RankDot from "$lib/components/RankDot.svelte";
  import { RANK_FLOOR, type RankLevel } from "@intellectify/engine";

  const YEARS: { year: 11 | 12; options: { id: MarkSource; label: string }[] }[] = [
    { year: 11, options: [{ id: "y11-methods", label: "Methods" }, { id: "y11-specialist", label: "Specialist" }] },
    { year: 12, options: [{ id: "y12-methods", label: "Methods" }, { id: "y12-specialist", label: "Specialist" }] },
  ];

  const profile = $derived(profileFor(session.backend, session.user));
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let text = $state("");
  /** The typed mark, if it's a number from 0 to 100 (decimals allowed, rounded). */
  const mark = $derived.by(() => {
    const t = text.trim().replace(/%$/, "");
    if (!/^\d{1,3}(\.\d*)?$/.test(t)) return null;
    const v = Math.round(Number(t));
    return v >= 0 && v <= 100 ? v : null;
  });
  let source = $state<MarkSource | null>(null);
  let saving = $state(false);
  /** Google gives the account's real name, so Google sign-ups choose the name others will see (SPEC §12.3). */
  const needsName = $derived(!!session.user?.google && !profile?.profile.nameSet);
  const needsPlacement = $derived(!profile?.profile.placement?.tiers);
  let name = $state(session.user?.displayName ?? "");
  let banned = $state<string[]>([]);
  $effect(() => void loadBannedWords().then((w) => (banned = w)));
  const nameErr = $derived(needsName ? nameError(name, banned) : null);
  /** A short tour after the maths mark (SPEC §16.5): the map, tiers, ranks and gates, the score. */
  let touring = $state(false);
  let slide = $state(0);
  const SLIDES = ["The map", "Tiers", "Ranks", "Score"] as const;
  const TIERS = [
    [1, "1000–1249", "Recall"],
    [2, "1250–1399", "Routine"],
    [3, "1400–1549", "Exam"],
    [4, "1550–1699", "Hardest exam"],
    [5, "1700–1999", "Beyond the exam"],
    [6, "2000+", "Monthly problems"],
  ] as const;
  /** One step at a time: the name first (Google sign-ups), then the maths mark, then the tour. */
  const step = $derived(touring ? "tour" : needsName ? "name" : needsPlacement ? "placement" : "done");
  const valid = $derived(step === "name" ? !nameErr : step === "placement" ? mark !== null && source !== null : true);
  const invalid = $derived(text.trim() !== "" && mark === null);


  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!profile || !valid || saving) return;
    saving = true;
    if (step === "name") {
      await profile.rename(cleanName(name));
      saving = false;
      if (needsPlacement) return; // on to the maths mark
    } else if (step === "placement") {
      await profile.setPlacement({ mark: mark!, source: source!, tiers: { ...placementTiers(mark!, source!) }, at: Date.now() });
      saving = false;
      touring = true;
      return;
    } else if (step === "tour" && slide < SLIDES.length - 1) {
      saving = false;
      slide += 1;
      return;
    }
    goto("/", { replaceState: true });
  }
</script>

<div class="wrap narrow">
  {#key step}
  <form class="card" onsubmit={save} in:fly={{ y: 12, duration: reduced ? 0 : 320, easing: cubicOut }}>
    {#if step === "tour"}
      <div class="tour-head">
        <h1>{SLIDES[slide]}</h1>
        <span class="muted count">{slide + 1}/{SLIDES.length}</span>
      </div>
      {#key slide}
        <div class="slide" in:fly={{ x: 16, duration: reduced ? 0 : 240, easing: cubicOut }}>
          {#if slide === 0}
            <p>Each node is a skill. Practice any of them, in any order.</p>
            <dl class="legend">
              <dt>Color</dt>
              <dd class="dots">{#each [0, 1, 2, 3, 4, 5] as r (r)}<RankDot rank={r as RankLevel} label />{/each}</dd>
              <dt>Shape</dt>
              <dd class="shapes">
                <span><i class="sh small-circle"></i>Small</span><span><i class="sh circle"></i>Medium</span><span><i class="sh small-diamond"></i>Large</span><span><i class="sh diamond"></i>Cornerstone</span>
              </dd>
            </dl>
          {:else if slide === 1}
            <p>Every question has a rating. Questions pick up near your level.</p>
            <table class="tiers">
              <tbody>
                {#each TIERS as [t, band, kind] (t)}<tr><th>Tier {t}</th><td>{band}</td><td class="muted">{kind}</td></tr>{/each}
              </tbody>
            </table>
          {:else if slide === 2}
            <p>Each skill has a rating, θ. A rank needs θ at its floor and 3 correct answers at its tier or higher. Bigger skills need a few more.</p>
            <table class="tiers">
              <tbody>
                {#each [1, 2, 3, 4, 5] as r (r)}<tr><th><RankDot rank={r as RankLevel} label /></th><td>θ {RANK_FLOOR[r as 1]}</td><td class="muted">3 at Tier {r}+</td></tr>{/each}
              </tbody>
            </table>
          {:else}
            <p>Your score, 0–100, is your chance of solving a typical exam question (rating 1500). 50 is about exam-ready.</p>
            <p class="score-demo"><span class="big">50</span><span class="muted">θ 1500</span></p>
          {/if}
        </div>
      {/key}
    {:else}
    <h1>{step === "placement" && session.user?.google ? "Your maths mark" : "Welcome"}</h1>
    {/if}

    {#if step === "name"}
      <div class="field">
        <label for="name">Display name</label>
        <input id="name" class="name" type="text" autocomplete="nickname" maxlength={NAME_MAX} bind:value={name} aria-invalid={!!nameErr && name.trim() !== ""} />
        {#if nameErr && name.trim() !== ""}<p class="err">{nameErr}</p>{:else}<p class="hint">Shown on leaderboards and in discussions</p>{/if}
      </div>
    {/if}

    {#if step === "placement"}
    <div class="field">
      <label for="mark">Most recent maths mark</label>
      <div class="mark" class:bad={invalid}>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          id="mark"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          maxlength="5"
          placeholder="—"
          autofocus
          bind:value={text}
        />
        <span class="pct">%</span>
      </div>
    </div>

    <fieldset class="field">
      <legend>From</legend>
      <div class="sources" role="radiogroup">
        <label class="source full" class:on={source === "y10"}>
          <input type="radio" name="source" value="y10" checked={source === "y10"} onchange={() => (source = "y10")} />
          Year 10
        </label>
        {#each YEARS as y (y.year)}
          {#each y.options as o (o.id)}
            <label class="source" class:on={source === o.id}>
              <input type="radio" name="source" value={o.id} checked={source === o.id} onchange={() => (source = o.id)} />
              <span class="yr">Year {y.year}</span>{o.label}
            </label>
          {/each}
        {/each}
      </div>
    </fieldset>
    {/if}

    <button class="btn primary go" disabled={!valid || saving}>
      {#if saving}<span class="spin" aria-hidden="true"></span>{/if}
      {saving ? "Setting up" : step === "tour" && slide === SLIDES.length - 1 ? "Start" : "Continue"}
    </button>
    {#if step === "tour" && slide < SLIDES.length - 1}<a class="skip" href="/" data-sveltekit-replacestate>Skip</a>{/if}
  </form>
  {/key}
</div>

<style>
  .card {
    max-width: 420px;
    margin: 56px auto;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 32px 28px 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.05);
  }
  h1 { margin: 0; font-size: 28px; }
  .tour-head { display: flex; align-items: baseline; justify-content: space-between; }
  .count { font-size: 13px; font-variant-numeric: tabular-nums; }
  .slide { display: flex; flex-direction: column; gap: 14px; }
  .slide p { margin: 0; line-height: 1.55; }
  .legend { display: grid; grid-template-columns: max-content 1fr; gap: 10px 14px; margin: 0; font-size: 13px; }
  .legend dt { color: var(--muted); }
  .legend dd { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 12px; }
  .shapes span { display: inline-flex; align-items: center; gap: 6px; }
  .sh { display: inline-block; border: 1.5px solid var(--edge); background: var(--unranked); }
  .sh.small-circle { width: 9px; height: 9px; border-radius: 50%; }
  .sh.circle { width: 13px; height: 13px; border-radius: 50%; }
  .sh.small-diamond { width: 9px; height: 9px; transform: rotate(45deg); }
  .sh.diamond { width: 13px; height: 13px; transform: rotate(45deg); }
  .tiers { border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums; }
  .tiers th { text-align: left; font-weight: 500; padding: 4px 16px 4px 0; }
  .tiers td { padding: 4px 16px 4px 0; }
  .score-demo { display: flex; align-items: baseline; gap: 12px; }
  .big { font-size: 40px; font-weight: 600; color: var(--accent); }
  .skip { align-self: center; font-size: 13px; color: var(--muted); margin-top: -12px; }
  .field { display: flex; flex-direction: column; gap: 10px; border: 0; padding: 0; margin: 0; min-width: 0; }
  .name { font: 500 18px var(--font-body); color: var(--ink); background: none; border: 0; border-bottom: 2px solid var(--line); padding: 4px 0 6px; outline: none; }
  .name:focus { border-color: var(--accent); }
  .name[aria-invalid="true"] { border-color: var(--bad); }
  .hint, .err { margin: -4px 0 0; font-size: 12px; }
  .hint { color: var(--muted); }
  .err { color: var(--bad); }
  label[for="name"], label[for="mark"], legend { font-size: 13px; color: var(--muted); padding: 0; margin-bottom: 10px; }
  fieldset legend { float: left; width: 100%; }

  .mark { display: flex; align-items: baseline; gap: 4px; border-bottom: 2px solid var(--line); transition: border-color 0.15s; }
  .mark:focus-within { border-color: var(--accent); }
  .mark.bad, .mark.bad:focus-within { border-color: var(--bad); }
  .mark input {
    flex: 1;
    min-width: 0;
    font: 600 40px/1.1 var(--font-body);
    font-variant-numeric: tabular-nums;
    border: 0;
    background: none;
    color: var(--ink);
    padding: 2px 0 6px;
    outline: none;
  }
  .mark input::placeholder { color: var(--edge); }
  .pct { font-size: 22px; color: var(--muted); }


  .sources { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .source {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-height: 52px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
    color: var(--ink);
    font-size: 15px;
    font-weight: 500;
    transition: border-color 0.15s, background-color 0.15s, color 0.15s, transform 0.1s;
  }
  .source:hover { border-color: var(--edge); }
  .source:active { transform: scale(0.98); }
  .source.full { grid-column: 1 / -1; min-height: 44px; }
  .source input { position: absolute; opacity: 0; pointer-events: none; }
  .yr { font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: 0.02em; }
  .source.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .source.on .yr { color: var(--accent); }
  .source:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }

  .go { width: 100%; justify-content: center; padding: 12px 14px; font-size: 15px; transition: opacity 0.15s, filter 0.15s; }
  .spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .source { transition: none; }
    .spin { animation-duration: 2s; }
  }
</style>
