<script lang="ts">
  /**
   * Editing your own profile hero (SPEC §13.11): each field opens a picker sheet, with silhouettes for
   * locked items as in the Wardrobe. Changes save at once with the next batched write.
   */
  import { RARITIES } from "@intellectify/engine";
  import { catalogue } from "$lib/cosmetics";
  import type { EconomyStore } from "$lib/economy.svelte";
  import type { ProfileStore } from "$lib/profile.svelte";
  import { loadBannedWords } from "$lib/moderation";
  import { cleanName, NAME_MAX, nameError } from "$lib/names";
  import { session } from "$lib/session.svelte";
  import { loadTitles, titles } from "$lib/titles.svelte";
  import Banner from "./Banner.svelte";
  import CardFace from "./CardFace.svelte";
  import Sheet from "./Sheet.svelte";
  import Title from "./Title.svelte";

  let { field, economy, profile, onclose }: { field: "name" | "banner" | "frame" | "title" | "showcase"; economy: EconomyStore; profile: ProfileStore | null; onclose: () => void } = $props();
  loadTitles();
  const cfg = $derived(economy.config!);
  const s = $derived(economy.state);
  const slot = $derived(field === "name" || field === "showcase" ? null : field);
  const items = $derived(slot ? catalogue(cfg, titles.map).filter((c) => c.slot === slot) : []);
  const owned = $derived(slot ? economy.ownedIn(slot) : []);

  let name = $state(session.user?.displayName ?? "");
  let banned = $state<string[]>([]);
  $effect(() => void loadBannedWords().then((w) => (banned = w)));
  const err = $derived(nameError(name, banned));
  let saving = $state(false);
  let note = $state<string | null>(null);
  async function rename(e: SubmitEvent) {
    e.preventDefault();
    if (!profile || err || saving) return;
    saving = true;
    try {
      await profile.rename(cleanName(name));
      onclose();
    } catch {
      note = "Couldn't save. Try again.";
    } finally {
      saving = false;
    }
  }

  const collected = $derived(
    (economy.data?.cards ?? []).filter((c) => (s.cards[c.id]?.n ?? 0) > 0).sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) || a.name.localeCompare(b.name)),
  );
  const toggle = (id: string) => {
    const cur = s.equipped.showcase;
    economy.setShowcase(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3));
  };
</script>

<Sheet label="Edit {field}" {onclose} wide>
  {#if field === "name"}
    <h2>Display name</h2>
    <form onsubmit={rename}>
      <input type="text" maxlength={NAME_MAX} bind:value={name} aria-invalid={!!err} aria-label="Display name" />
      {#if err && name.trim()}<p class="err">{err}</p>{:else if note}<p class="err">{note}</p>{/if}
      <button class="btn primary" disabled={!!err || saving}>Save</button>
    </form>
  {:else if field === "showcase"}
    <h2>Showcase</h2>
    <p class="muted">Up to 3 cards · {s.equipped.showcase.length} chosen</p>
    <div class="cards">
      {#each collected as c (c.id)}
        <div class="pickcard" class:on={s.equipped.showcase.includes(c.id)}>
          <CardFace card={c} width={84} foil={!!s.cards[c.id]?.foil} onclick={() => toggle(c.id)} />
        </div>
      {:else}
        <p class="muted">No cards yet</p>
      {/each}
    </div>
  {:else if slot}
    <h2>{field === "banner" ? "Banner" : field === "frame" ? "Frame" : "Title"}</h2>
    <ul class="opts">
      <li><button class="opt" class:on={!s.equipped[slot]} onclick={() => economy.equip(slot, null)}>Default</button></li>
      {#each items as c (c.id)}
        {@const mine = owned.includes(c.id)}
        <li>
          {#if mine}
            <button class="opt" class:on={s.equipped[slot] === c.id} onclick={() => economy.equip(slot, c.id)}>
              {#if field === "banner"}<span class="mini"><Banner id={c.id} /></span>{/if}
              {#if field === "title"}<Title title={c.id} />{:else}{c.name}{/if}
            </button>
          {:else}
            <span class="opt locked">{field === "title" ? "?" : c.name} · {c.price !== undefined ? "Shop" : c.condition}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>

<style>
  h2 { margin: 0 0 10px; }
  form { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
  .err { color: var(--bad); font-size: 12px; margin: 0; }
  .cards { display: flex; flex-wrap: wrap; gap: 8px; }
  .pickcard { border-radius: 8px; padding: 2px; border: 2px solid transparent; }
  .pickcard.on { border-color: var(--accent); }
  .opts { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
  .opt { width: 100%; display: flex; align-items: center; gap: 10px; font: inherit; text-align: left; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); cursor: pointer; min-height: 44px; }
  .opt.on { border-color: var(--accent); background: var(--accent-soft); }
  .opt.locked { color: var(--muted); border-style: dashed; cursor: default; background: none; }
  .mini { width: 90px; height: 34px; border-radius: 4px; overflow: hidden; flex: none; }
  .mini :global(.banner) { min-height: 34px; height: 34px; }
</style>
