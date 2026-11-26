<script lang="ts">
  /** Achievement shelves by tier (SPEC §12.1). Secret criteria show as ??? until earned. */
  import TierGem from "$lib/components/TierGem.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { session } from "$lib/session.svelte";

  let { data } = $props();
  const store = $derived(achievementsFor(session.backend, session.user, data.course));
  const TIERS = ["platinum", "diamond", "ruby", "tanzanite", "vibranium", "solarium", "antimatter"] as const;
  const NAMES: Record<string, string> = { platinum: "Platinum", diamond: "Diamond", ruby: "Ruby", tanzanite: "Tanzanite", vibranium: "Vibranium", solarium: "Solarium", antimatter: "Antimatter" };
  const earnedCount = $derived(store ? Object.keys(store.earned).length : 0);
  const points = $derived(store ? store.defs.filter((a) => store.earned[a.id]).reduce((t, a) => t + a.points, 0) : 0);
  const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
</script>

<div class="wrap">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a> › Achievements</p>
  <h1>Achievements</h1>

  {#if !store?.loaded}
    <p class="muted">Loading…</p>
  {:else}
    <p class="summary"><span class="num">{earnedCount} / {store.defs.length}</span> <span class="muted">earned</span> · <span class="num">{points}</span> <span class="muted">points</span></p>
    {#each TIERS as tier (tier)}
      {@const list = store.defs.filter((a) => a.tier === tier)}
      {#if list.length}
        <section>
          <h2><TierGem {tier} size={13} /> {NAMES[tier]} <span class="muted">· {list[0]!.points} points · {list.filter((a) => store.earned[a.id]).length} / {list.length}</span></h2>
          <ul class="shelf">
            {#each list as a (a.id)}
              {@const got = store.earned[a.id]}
              <li class:got class:pending={a.rule.kind === "pending"}>
                <span class="badge"><TierGem {tier} size={got ? 20 : 16} /></span>
                <div>
                  <p class="name">{a.name}{#if a.secret}<span class="lock" title="Secret">🔒</span>{/if}</p>
                  <p class="crit">{a.secret && !got ? "???" : a.criterion}</p>
                  {#if got}<p class="when">{fmtDate(got)}</p>{:else if a.rule.kind === "pending"}<p class="when muted">Not available yet</p>{/if}
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {/each}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  h1 { margin: 0 0 6px; font-size: 28px; }
  .summary { margin: 0 0 18px; font-size: 14px; }
  .num { font-variant-numeric: tabular-nums; font-weight: 600; }
  section { margin-bottom: 26px; }
  h2 { display: flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 15px; font-weight: 600; margin: 0 0 10px; }
  h2 .muted { font-weight: 400; font-size: 13px; }
  .shelf { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
  li { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); opacity: 0.62; }
  li.got { opacity: 1; border-color: color-mix(in srgb, var(--accent) 35%, var(--line)); box-shadow: 0 2px 10px rgba(15, 22, 35, 0.06); }
  li:not(.got) .badge { filter: grayscale(0.85); }
  li.pending { opacity: 0.45; }
  .badge { flex: none; width: 32px; display: grid; place-items: center; padding-top: 2px; }
  .name { margin: 0; font-weight: 600; font-size: 14px; }
  .lock { margin-left: 6px; font-size: 11px; }
  .crit { margin: 2px 0 0; font-size: 13px; color: var(--muted); line-height: 1.35; }
  .when { margin: 4px 0 0; font-size: 11px; color: var(--accent); }
  .when.muted { color: var(--muted); }
</style>
