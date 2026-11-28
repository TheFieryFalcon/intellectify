<script lang="ts">
  /**
   * Your own marking key (SPEC §10.4): instant marking with no queue. The key stays in this browser and
   * goes only to the provider, never to Intellectify's servers.
   */
  import { maxEffort } from "@intellectify/content/marking";
  import { loadByok, loadEffort, PROVIDER_LABEL, saveByok, saveEffort, testKey, type ByokProvider } from "$lib/byok";
  import { profileFor } from "$lib/profile.svelte";
  import ShiftKeySettings from "$lib/components/ShiftKeySettings.svelte";
  import { quotaOut, setStylus, stylusOn } from "$lib/ink";
  import { session } from "$lib/session.svelte";
  import { loadBannedWords } from "$lib/moderation";
  import { cleanName, NAME_MAX, nameError } from "$lib/names";

  /** Display name (SPEC §12.3): shown on leaderboards, profiles and discussions. */
  const profile = $derived(profileFor(session.backend, session.user));
  /** The owner's account (the `admin` claim) gets a link to the error reports. */
  let admin = $state(false);
  $effect(() => void session.backend?.isAdmin().then((a) => (admin = a)).catch(() => {}));
  let name = $state(session.user?.displayName ?? "");
  let banned = $state<string[]>([]);
  $effect(() => void loadBannedWords().then((w) => (banned = w)));
  const nameErr = $derived(nameError(name, banned));
  const nameChanged = $derived(cleanName(name) !== session.user?.displayName);
  let nameNote = $state<string | null>(null);
  let renaming = $state(false);
  async function rename(e: SubmitEvent) {
    e.preventDefault();
    if (!profile || nameErr || !nameChanged || renaming) return;
    renaming = true;
    nameNote = null;
    try {
      await profile.rename(cleanName(name));
      name = cleanName(name);
      nameNote = "Saved";
    } catch {
      nameNote = "Couldn't save. Try again.";
    } finally {
      renaming = false;
    }
  }

  /** Handwriting pad (SPEC §7.2, §16.5): on unless turned off, per browser. */
  let stylus = $state(stylusOn());
  const handwritingOut = quotaOut();

  const saved = loadByok();
  let provider = $state<ByokProvider>(saved?.provider ?? "gemini");
  let key = $state("");
  let current = $state(saved);
  let show = $state(false);

  /** Marking effort (SPEC §10.4): 1–2 free, 1–10 with an own key. */
  const marker = $derived(current?.provider ?? "free");
  const top = $derived(maxEffort(marker));
  const EFFORT_MAX = 10;
  let effort = $state(loadEffort(saved?.provider ?? "free"));
  $effect(() => {
    effort = loadEffort(marker);
  });
  const setEffort = (v: number) => {
    effort = v;
    saveEffort(marker, v);
  };

  const masked = (k: string) => (k.length > 8 ? `${k.slice(0, 4)}…${k.slice(-4)}` : "••••");
  function save(e: SubmitEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    current = { provider, key: key.trim() };
    saveByok(current);
    key = "";
  }
  function remove() {
    saveByok(null);
    current = null;
    tested = null;
  }
  /** Test the saved key (or the one being typed) with the provider. */
  let tested = $state<string | null>(null);
  let testing = $state(false);
  async function test() {
    const byok = key.trim() ? { provider, key: key.trim() } : current;
    if (!byok || testing) return;
    testing = true;
    tested = null;
    const r = await testKey(byok);
    tested = r === "ok" ? "Key works" : r === "refused" ? `${PROVIDER_LABEL[byok.provider]} refused this key` : `Couldn't reach ${PROVIDER_LABEL[byok.provider]}`;
    testing = false;
  }
</script>

<div class="wrap narrow">
  <h1>Settings</h1>
  {#if admin}<p class="admin"><a href="/admin/reports">Error reports</a></p>{/if}
  {#if session.user}
    <section class="card">
      <h2>Profile</h2>
      <form class="name-form" onsubmit={rename}>
        <div class="field">
          <label for="name">Display name</label>
          <div class="keyrow">
            <input id="name" class="text" type="text" autocomplete="nickname" maxlength={NAME_MAX} bind:value={name} oninput={() => (nameNote = null)} aria-invalid={!!nameErr} />
            <button class="btn primary" disabled={!!nameErr || !nameChanged || renaming}>Save</button>
          </div>
        </div>
        {#if nameErr && name.trim()}<p class="err">{nameErr}</p>{:else if nameNote}<p class="note">{nameNote}</p>{/if}
      </form>
    </section>
  {/if}
  {#if session.user}<ShiftKeySettings {profile} />{/if}
  <section class="card">
    <h2>Handwriting</h2>
    <label class="switch"><input type="checkbox" bind:checked={stylus} onchange={() => setStylus(stylus)} /> Handwriting pad</label>
    <dl class="facts">
      <dt>Reader</dt>
      <dd>{handwritingOut ? "AI (MyScript's free quota is used up this month)" : "MyScript, then AI if it's busy"}</dd>
    </dl>
  </section>
  <section class="card">
    <h2>Marking key</h2>
    <dl class="facts">
      <dt>Marking</dt>
      <dd>{current ? `Your ${PROVIDER_LABEL[current.provider]} key · ${masked(current.key)}` : "Free (shared, may queue)"}</dd>
      <dt>Stored</dt>
      <dd>This browser only</dd>
      <dt>Sent to</dt>
      <dd>{current ? PROVIDER_LABEL[current.provider] : "—"}</dd>
    </dl>

    <form onsubmit={save}>
      <fieldset>
        <legend>Provider</legend>
        <div class="providers">
          {#each Object.entries(PROVIDER_LABEL) as [id, name] (id)}
            <label class="provider" class:on={provider === id}>
              <input type="radio" name="provider" value={id} checked={provider === id} onchange={() => (provider = id as ByokProvider)} />{name}
            </label>
          {/each}
        </div>
      </fieldset>
      <div class="field">
        <label for="key">API key</label>
        <div class="keyrow">
          <input id="key" type={show ? "text" : "password"} autocomplete="off" spellcheck="false" bind:value={key} placeholder={current ? "Replace key" : "Paste key"} />
          <button type="button" class="btn link" onclick={() => (show = !show)}>{show ? "Hide" : "Show"}</button>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" disabled={!key.trim()}>Save</button>
        <button type="button" class="btn" onclick={test} disabled={testing || (!key.trim() && !current)}>{testing ? "Testing" : "Test key"}</button>
        {#if current}<button type="button" class="btn quiet" onclick={remove}>Remove key</button>{/if}
        {#if tested}<span class="note" class:err={tested !== "Key works"} role="status">{tested}</span>{/if}
      </div>
    </form>
  </section>

  <section class="card">
    <h2>Marking effort</h2>
    <div class="effort">
      <div class="slider">
      <input
        id="effort"
        type="range"
        min="1"
        max={EFFORT_MAX}
        step="1"
        value={effort}
        style="--fill: {(100 * (effort - 1)) / (EFFORT_MAX - 1)}%; --cap: {(100 * (top - 1)) / (EFFORT_MAX - 1)}%"
        aria-label="Marking effort"
        aria-valuetext={top < EFFORT_MAX ? `${effort} of ${EFFORT_MAX}, up to ${top} without your own key` : `${effort} of ${EFFORT_MAX}`}
        oninput={(e) => {
          // Levels above the cap show but can't be chosen: the thumb stops at the cap.
          const v = Math.min(Number(e.currentTarget.value), top);
          e.currentTarget.value = String(v);
          setEffort(v);
        }}
      />
      <div class="ticks" aria-hidden="true">
        {#each Array.from({ length: EFFORT_MAX }, (_, i) => i + 1) as n (n)}<span class:locked={n > top}>{n}</span>{/each}
      </div>
      </div>
      <output for="effort">{effort}</output>
    </div>
    {#if top < EFFORT_MAX}
      <dl class="facts">
        <dt>Free</dt>
        <dd>1–{top}</dd>
        <dt>Own key</dt>
        <dd>1–{EFFORT_MAX}</dd>
      </dl>
    {/if}
  </section>
</div>

<style>
  h1 { margin: 0 0 14px; font-size: 26px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
  h2 { margin: 0; font-family: var(--font-body); font-size: 15px; font-weight: 600; }
  .facts { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; margin: 0; font-size: 14px; }
  .switch { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
  .facts dt { color: var(--muted); }
  .facts dd { margin: 0; }
  form { display: flex; flex-direction: column; gap: 10px; }
  fieldset { border: 0; padding: 0; margin: 0; }
  legend, label[for="key"] { font-size: 12px; color: var(--muted); padding: 0; margin-bottom: 6px; }
  .providers { display: flex; gap: 8px; }
  .provider { position: relative; flex: 1; text-align: center; padding: 8px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; font-size: 14px; }
  .provider input { position: absolute; opacity: 0; pointer-events: none; }
  .provider.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .provider:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
  .keyrow { display: flex; align-items: center; gap: 12px; }
  .field label { display: block; }
  label[for="name"] { font-size: 12px; color: var(--muted); padding: 0; margin-bottom: 6px; }
  .name-form { display: flex; flex-direction: column; gap: 8px; }
  .text { flex: 1; min-width: 0; font: inherit; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .text[aria-invalid="true"] { border-color: var(--bad); }
  .err, .note { margin: 0; font-size: 12px; }
  .err { color: var(--bad); }
  .note { color: var(--good); }
  .keyrow input#key { flex: 1; min-width: 0; font: inherit; font-family: ui-monospace, monospace; font-size: 13px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .actions { display: flex; gap: 8px; }
  .wrap > .card + .card { margin-top: 16px; }
  .admin { margin: -8px 0 16px; font-size: 14px; }
  .effort { display: flex; align-items: flex-start; gap: 14px; }
  .slider { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  /* Track: chosen (accent), available (track), locked without an own key (hatched). */
  .effort input { width: 100%; margin: 0; appearance: none; -webkit-appearance: none; height: 22px; background: none; cursor: pointer; }
  .effort input::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, var(--accent) 0 var(--fill), var(--track) var(--fill) var(--cap), transparent var(--cap)), repeating-linear-gradient(135deg, var(--line) 0 4px, transparent 4px 8px); }
  .effort input::-moz-range-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, var(--accent) 0 var(--fill), var(--track) var(--fill) var(--cap), transparent var(--cap)), repeating-linear-gradient(135deg, var(--line) 0 4px, transparent 4px 8px); }
  .effort input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; margin-top: -6px; border-radius: 50%; background: var(--accent); border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--accent); }
  .effort input::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--accent); }
  .effort input:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 4px; }
  /* Numbers under the track, centered on the thumb's stops (9px in from each end). */
  .ticks { display: flex; justify-content: space-between; padding: 0 1px; font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .ticks span { width: 16px; text-align: center; }
  .ticks .locked { opacity: 0.45; }
  .effort output { line-height: 22px; min-width: 2ch; text-align: right; font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
