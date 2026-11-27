<script lang="ts">
  /**
   * Shift keys for the phone keyboard's 123 tab (SPEC §7.2), like a Casio ClassPad: each key's shifted
   * symbol, chosen from every keypad key. Saved to the account, so it follows the student.
   */
  import katex from "katex";
  import { SHIFT_SLOTS, faceForInsert, loadShiftMap, shiftChoices, type ShiftMap } from "$lib/keypad";
  import type { ProfileStore } from "$lib/profile.svelte";

  let { profile }: { profile: ProfileStore | null } = $props();

  let map = $state<ShiftMap>(loadShiftMap());
  // Once the profile loads, its saved keys (now on this device) win.
  $effect(() => {
    if (profile?.loaded) map = loadShiftMap();
  });
  let note = $state<string | null>(null);
  const groups = shiftChoices();
  const nameOf = new Map(groups.flatMap((g) => g.keys.map((k) => [k.insert, k.name] as const)));
  const tex = (latex: string) => katex.renderToString(latex, { throwOnError: false, strict: "ignore" });
  const box = (latex: string) => latex.replace(/#[0?@]/g, "\\square");

  async function set(id: string, insert: string) {
    map = { ...map, [id]: insert || null };
    note = null;
    try {
      await profile?.setShiftKeys(map);
      note = "Saved";
    } catch {
      note = "Couldn't save. Try again.";
    }
  }
  async function reset() {
    map = Object.fromEntries(SHIFT_SLOTS.map((s) => [s.id, s.defaultShift]));
    await set(SHIFT_SLOTS[0]!.id, map[SHIFT_SLOTS[0]!.id] ?? "");
  }
</script>

<section class="card">
  <h2>Shift keys</h2>
  <p class="muted small">On a phone's maths keyboard, Shift on the 123 tab types these instead.</p>
  <div class="grid">
    {#each SHIFT_SLOTS as s (s.id)}
      <label class="slot">
        <span class="base" aria-hidden="true">{@html tex(box(s.face ?? s.base))}</span>
        <span class="sr">{s.name}, shifted</span>
        <select value={map[s.id] ?? ""} onchange={(e) => set(s.id, e.currentTarget.value)} title={map[s.id] ? (nameOf.get(map[s.id]!) ?? "") : "Same key"}>
          <option value="">Same key</option>
          {#each groups as g (g.name)}
            <optgroup label={g.name}>{#each g.keys as key (key.insert)}<option value={key.insert}>{key.name}</option>{/each}</optgroup>
          {/each}
          {#if map[s.id] && !nameOf.has(map[s.id]!)}<option value={map[s.id]}>{map[s.id]}</option>{/if}
        </select>
        <span class="shifted" aria-hidden="true">{#if map[s.id]}{@html tex(box(faceForInsert(map[s.id]!)))}{/if}</span>
      </label>
    {/each}
  </div>
  <div class="foot">
    <button type="button" class="btn link" onclick={reset}>Reset to defaults</button>
    {#if note}<span class="note" role="status">{note}</span>{/if}
  </div>
</section>

<style>
  .card { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  h2 { margin: 0; font-size: 18px; }
  .small { font-size: 13px; margin: -4px 0 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px 14px; }
  .slot { display: grid; grid-template-columns: 34px 1fr 40px; align-items: center; gap: 8px; }
  .base { display: flex; align-items: center; justify-content: center; height: 32px; border: 1px solid var(--line); border-radius: 6px; background: var(--region); font-size: 15px; }
  .shifted { font-size: 15px; color: var(--accent); text-align: center; }
  select { font: inherit; font-size: 13px; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 6px; min-width: 0; width: 100%; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .foot { display: flex; align-items: center; gap: 12px; }
  .note { font-size: 12px; color: var(--good); }
</style>
