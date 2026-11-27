<script lang="ts">
  /**
   * Your own marking key (SPEC §10.4): instant marking with no queue. The key stays in this browser and
   * goes only to the provider, never to Intellectify's servers.
   */
  import { maxEffort } from "@intellectify/content/marking";
  import { loadByok, loadEffort, PROVIDER_LABEL, saveByok, saveEffort, type ByokProvider } from "$lib/byok";

  const saved = loadByok();
  let provider = $state<ByokProvider>(saved?.provider ?? "gemini");
  let key = $state("");
  let current = $state(saved);
  let show = $state(false);

  /** Marking effort (SPEC §10.4): 1–2 free, 1–10 with an own key. */
  const marker = $derived(current?.provider ?? "free");
  const top = $derived(maxEffort(marker));
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
  }
</script>

<div class="wrap narrow">
  <h1>Settings</h1>
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
        {#if current}<button type="button" class="btn quiet" onclick={remove}>Remove key</button>{/if}
      </div>
    </form>
  </section>

  <section class="card">
    <h2>Marking effort</h2>
    <div class="effort">
      <input
        id="effort"
        type="range"
        min="1"
        max={top}
        step="1"
        value={effort}
        aria-label="Marking effort"
        aria-valuetext="{effort} of {top}"
        oninput={(e) => setEffort(Number(e.currentTarget.value))}
      />
      <output for="effort">{effort}</output>
    </div>
    <dl class="facts">
      <dt>Range</dt>
      <dd>1–{top}</dd>
      {#if !current}
        <dt>Own key</dt>
        <dd>1–10</dd>
      {/if}
    </dl>
  </section>
</div>

<style>
  h1 { margin: 0 0 14px; font-size: 26px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
  h2 { margin: 0; font-family: var(--font-body); font-size: 15px; font-weight: 600; }
  .facts { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; margin: 0; font-size: 14px; }
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
  .keyrow input { flex: 1; min-width: 0; font: inherit; font-family: ui-monospace, monospace; font-size: 13px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .actions { display: flex; gap: 8px; }
  .wrap > .card + .card { margin-top: 16px; }
  .effort { display: flex; align-items: center; gap: 14px; }
  .effort input { flex: 1; min-width: 0; accent-color: var(--accent); }
  .effort output { min-width: 2ch; text-align: right; font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
