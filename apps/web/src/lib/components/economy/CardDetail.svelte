<script lang="ts">
  /**
   * A card's detail view (SPEC §13.11): the enlarged card, dates, era, fields, blurb, related-skill chips,
   * copies, foil, its staff slot and the portrait credit. `owned` is absent on someone else's profile.
   */
  import { currentEconomy } from "$lib/profile.svelte";
  import type { Card } from "$lib/economy.svelte";
  import { skillNames } from "$lib/skillNames";
  import CardFace from "./CardFace.svelte";
  import Sheet from "./Sheet.svelte";

  let { card, owned, mine = true, onclose }: { card: Card; owned: { n: number; foil: boolean } | null; mine?: boolean; onclose: () => void } = $props();
  const held = $derived(!!owned && owned.n > 0);
  const economy = currentEconomy();
  const era = $derived(economy?.config?.eras.find((e) => e.id === card.era));
  const slot = $derived.by(() => {
    if (!held || !mine || !economy) return null;
    const i = (economy.state.staff[card.era] ?? []).indexOf(card.id);
    return i >= 0 ? `${era?.institute.name ?? "Institute"} · slot ${i + 1}` : null;
  });
  const year = (y: number) => (y < 0 ? `${-y} BC` : `${y}`);
  const dates = $derived.by(() => {
    const c = (k: "born" | "died") => (card.circa?.includes(k) ? "c. " : "");
    if (card.flourished !== undefined && card.died === undefined) return `fl. ${year(card.flourished)}`;
    if (card.died === undefined) return `born ${c("born")}${year(card.born)}`;
    return `${c("born")}${year(card.born)} – ${c("died")}${year(card.died)}`;
  });
  let skills = $state<Map<string, { course: string; name: string }>>(new Map());
  $effect(() => void (card.related?.length && skillNames().then((m) => (skills = m))));
  const isUrl = (s: string) => /^https?:\/\//.test(s);
  /** CC BY and CC BY-SA portraits are adapted (the ink wash) and say so. */
  const adapted = (license: string) => (license.startsWith("CC BY") || license === "Attribution" ? " · Adapted" : "");
</script>

<Sheet label={card.name} {onclose} wide>
  <div class="detail">
    <CardFace {card} width={Math.min(320, typeof window !== "undefined" ? window.innerWidth - 80 : 320)} foil={!!owned?.foil} silhouette={!held} />
    <div class="facts">
      <h2>{card.name}</h2>
      <p class="muted">{held ? dates : "Not collected"} · {era?.name ?? card.era}</p>
      <ul class="chips">{#each card.fields as f (f)}<li>{f}</li>{/each}</ul>
      {#if held}<p class="blurb">{card.blurb}</p>{/if}
      {#if card.related?.length}
        <ul class="chips skills">
          {#each card.related as id (id)}
            {@const s = skills.get(id)}
            <li><a href={s ? `/${s.course}/skill/${id}` : undefined}>{s?.name ?? id}</a></li>
          {/each}
        </ul>
      {/if}
      {#if held && mine && owned}
        <dl>
          <dt>Copies</dt><dd>{owned.n}</dd>
          <dt>Finish</dt><dd>{owned.foil ? "Foil" : "Standard"}</dd>
          <dt>Staff</dt><dd>{slot ?? "Not slotted"}</dd>
        </dl>
      {/if}
      {#if held && card.portrait}
        <p class="credit">Portrait: {card.portrait.author ? `${card.portrait.author.slice(0, 120)}${card.portrait.author.length > 120 ? "…" : ""} · ` : ""}{card.portrait.license}{adapted(card.portrait.license)} · {#if isUrl(card.portrait.source)}<a href={card.portrait.source} target="_blank" rel="noopener noreferrer">Source</a>{:else}{card.portrait.source}{/if}</p>
      {/if}
    </div>
  </div>
</Sheet>

<style>
  .detail { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .facts { width: 100%; }
  h2 { margin: 0; font-size: 22px; }
  .muted { margin: 2px 0 8px; }
  .chips { list-style: none; padding: 0; margin: 0 0 10px; display: flex; flex-wrap: wrap; gap: 4px; }
  .chips li { font-size: 12px; border: 1px solid var(--line); border-radius: 999px; padding: 2px 9px; }
  .skills li { border-color: var(--accent); }
  .skills a { text-decoration: none; }
  .blurb { font-family: var(--font-display); font-size: 15px; line-height: 1.5; margin: 0 0 12px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 14px; margin: 0 0 12px; font-size: 13px; }
  dt { color: var(--muted); }
  dd { margin: 0; }
  .credit { font-size: 11px; color: var(--muted); margin: 0; overflow-wrap: anywhere; }
</style>
