<script lang="ts">
  /** A public profile (SPEC §12.3), built from the same shared read as the leaderboards. */
  import { page } from "$app/state";
  import { levelProgress, type RankLevel } from "@intellectify/engine";
  import type { AchievementT } from "@intellectify/content";
  import LevelBadge from "$lib/components/LevelBadge.svelte";
  import RankDot from "$lib/components/RankDot.svelte";
  import TechTree from "$lib/components/TechTree.svelte";
  import TierGem from "$lib/components/TierGem.svelte";
  import { loadAchievementDefs } from "$lib/achievements.svelte";
  import { loadPublicProfiles } from "$lib/boards";
  import type { PublicProfile } from "$lib/backend";
  import { loadCourse, type CourseBundle } from "$lib/content";
  import { computeRollups } from "$lib/practice";
  import { achievementPoints, BOARDS, liveStreak, progressFromPublic, rankBoard } from "$lib/public";
  import { perthDay } from "$lib/profile.svelte";
  import { RANK_LABEL, score } from "$lib/ranks";
  import { session } from "$lib/session.svelte";
  import { currentEconomy, profileFor } from "$lib/profile.svelte";
  import { loadEconomyData, type Card, type EconomyData } from "$lib/economy.svelte";
  import ProfileHero from "$lib/components/economy/ProfileHero.svelte";
  import CollectionShelves from "$lib/components/economy/CollectionShelves.svelte";
  import ProfileEditor from "$lib/components/economy/ProfileEditor.svelte";

  const uid = $derived(page.params.uid!);
  let all = $state<PublicProfile[] | null>(null);
  let defs = $state<AchievementT[]>([]);
  let courses = $state<Record<string, CourseBundle>>({});

  $effect(() => {
    if (session.backend && all === null) void loadPublicProfiles(session.backend).then((x) => (all = x)).catch(() => (all = []));
  });
  $effect(() => void loadAchievementDefs().then((d) => (defs = d)));

  const p = $derived(all?.find((x) => x.uid === uid) ?? null);
  $effect(() => {
    for (const id of Object.keys(p?.courses ?? {})) if (!courses[id]) void loadCourse(fetch, id).then((c) => (courses = { ...courses, [id]: c })).catch(() => {});
  });

  const today = perthDay();
  const level = $derived(p ? levelProgress(p.xp) : null);
  const positions = $derived(
    p && all
      ? BOARDS.flatMap((b) =>
          (b.id === "course" ? Object.keys(p.courses ?? {}) : [""]).map((c) => {
            const rows = rankBoard(all!, b.id, today, c);
            const r = rows.find((x) => x.profile.uid === uid);
            return r ? { key: `${b.id}:${c}`, board: b.id, course: c, name: b.group === b.name ? b.name : `${b.group} · ${b.name}`, pos: r.pos, of: rows.length } : null;
          }),
        ).filter((x) => x !== null)
      : [],
  );
  const earned = $derived(
    Object.values(p?.achievements ?? {})
      .flatMap((a) => a.ids)
      .map((id) => defs.find((d) => d.id === id))
      .filter((d): d is AchievementT => !!d)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
  );
  const isMe = $derived(session.user?.uid === uid);

  // The economy on profiles (SPEC §12.3, §13.11): banner, framed name, title, showcase, collection, Axioms.
  let eco = $state<EconomyData | null>(null);
  $effect(() => void loadEconomyData().then((d) => (eco = d)).catch(() => {}));
  const mine = $derived(isMe ? currentEconomy() : null);
  const cards = $derived(new Map<string, Card>((eco?.cards ?? []).map((c) => [c.id, c])));
  const equipped = $derived(mine?.loaded ? mine.state.equipped : (p?.economy?.equipped ?? null));
  const owned = $derived.by(() => {
    if (mine?.loaded) return mine.state.cards;
    return Object.fromEntries(Object.entries(p?.economy?.cards ?? {}).map(([id, f]) => [id, { n: 1, foil: f === 1 }]));
  });
  const proven = $derived(mine?.loaded ? mine.state.axiomsProven : (p?.economy?.axiomsProven ?? 0));
  const foils = $derived(Object.fromEntries(Object.entries(owned).map(([id, o]) => [id, o.foil])));
  let editing = $state<"name" | "banner" | "frame" | "title" | "showcase" | null>(null);
</script>

<div class="wrap">
  {#if all === null}
    <p class="muted">Loading…</p>
  {:else if !p}
    <p class="muted">{isMe ? "Your profile appears here after your first answer" : "No profile here"}</p>
  {:else}
    <ProfileHero
      name={isMe && session.user ? session.user.displayName : p.displayName}
      banner={equipped?.banner ?? null}
      frame={equipped?.frame ?? null}
      title={equipped?.title ?? null}
      ornament={equipped?.nameOrnament ?? null}
      showcase={equipped?.showcase ?? []}
      {cards}
      {foils}
      onedit={isMe && mine?.loaded ? (f) => (editing = f) : undefined}
    >
      {#snippet extra()}
        {#if level}<p class="lvl"><LevelBadge progress={level} /> <span class="muted">{level.tier.name} · {p.xp.toLocaleString("en-US")} XP</span></p>{/if}
      {/snippet}
    </ProfileHero>
    {#if editing && mine && eco}<ProfileEditor field={editing} economy={mine} profile={profileFor(session.backend, session.user)} onclose={() => (editing = null)} />{/if}

    <dl class="facts">
      <div><dt>Problems</dt><dd>{(p.stats?.problems ?? 0).toLocaleString("en-US")}</dd></div>
      <div><dt>Daily streak</dt><dd>{liveStreak(p, today)}{#if p.daily?.best}<span class="muted"> · best {p.daily.best}</span>{/if}</dd></div>
      <div><dt>Achievement points</dt><dd>{achievementPoints(p)}</dd></div>
      {#if p.joined}<div><dt>Joined</dt><dd>{new Date(p.joined).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Perth" })}</dd></div>{/if}
    </dl>

    {#if positions.length}
      <section>
        <h2>Leaderboards</h2>
        <ul class="positions">
          {#each positions as x (x.key)}
            <li><a href="/leaderboards?b={x.board}{x.course ? `&course=${x.course}` : ''}"><span class="pos">#{x.pos}</span> <span>{x.board === "course" ? (courses[x.course]?.name ?? x.course) : x.name}</span> <span class="muted">of {x.of}</span></a></li>
          {/each}
        </ul>
      </section>
    {/if}

    {#each Object.entries(p.courses ?? {}) as [id, c] (id)}
      {@const bundle = courses[id]}
      {#if bundle}
        {@const progress = progressFromPublic(c)}
        <section>
          <h2>{bundle.name} <span class="course-rank"><RankDot rank={c.rank} label />{#if c.theta !== null}<span class="muted"> · {score(c.theta)}</span>{/if}</span></h2>
          {#if Object.keys(c.responseSkills ?? {}).length}
            <ul class="rs">
              {#each bundle.responseSkills as r (r.id)}
                {@const st = c.responseSkills[r.id]}
                <li><span class="muted">{r.name}</span> <RankDot rank={(st?.r ?? 0) as RankLevel} label />{#if st?.t != null}<span class="muted"> · {score(st.t)}</span>{/if}</li>
              {/each}
            </ul>
          {/if}
          <details class="tree">
            <summary>Tech tree</summary>
            <TechTree course={bundle} {progress} rollups={computeRollups(bundle, progress)} readonly />
          </details>
        </section>
      {/if}
    {/each}

    {#if eco}
      <section>
        <h2>Axioms <span class="muted count">{proven}</span></h2>
        {#if proven}
          <ul class="ach">
            {#each eco.config.axioms.list.slice(0, proven) as a (a.id)}<li><span class="in" aria-hidden="true">∈</span> <span class="aname">{a.name}</span></li>{/each}
          </ul>
        {:else}<p class="muted">None yet</p>{/if}
      </section>
      <section>
        <h2>Collection <span class="muted count">{Object.values(owned).filter((o) => o.n > 0).length} / {eco.cards.length}</span></h2>
        <details class="tree">
          <summary>Cards</summary>
          <CollectionShelves eras={eco.config.eras} cards={eco.cards} {owned} mine={isMe} />
        </details>
      </section>
    {/if}

    <section>
      <h2>Achievements <span class="muted count">{earned.length}</span></h2>
      {#if earned.length}
        <ul class="ach">
          {#each earned as a (a.id)}
            <li><TierGem tier={a.tier} size={13} /> <span class="aname">{a.name}</span>{#if a.secret}<span class="secret">Secret</span>{/if}<span class="muted pts">{a.points}</span></li>
          {/each}
        </ul>
      {:else}
        <p class="muted">None yet</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .lvl { font-size: 13px; display: inline-flex; gap: 8px; align-items: center; margin: 6px 0 0 4px; }
  .in { font-family: var(--font-display); color: #9aa4b1; }
  .facts { display: flex; flex-wrap: wrap; gap: 8px 28px; margin: 0 0 18px; }
  .facts div { display: flex; flex-direction: column; }
  dt { font-size: 11px; color: var(--muted); }
  dd { margin: 0; font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
  section { margin-top: 22px; }
  h2 { font-family: var(--font-body); font-size: 14px; font-weight: 600; margin: 0 0 10px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .course-rank { font-weight: 400; font-size: 13px; display: inline-flex; align-items: center; }
  .count { font-weight: 400; }
  .positions { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .positions a { display: inline-flex; gap: 6px; font-size: 13px; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; background: var(--surface); color: var(--ink); text-decoration: none; }
  .positions a:hover { border-color: var(--accent); }
  .pos { font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }
  .rs { list-style: none; padding: 0; margin: 0 0 12px; display: flex; flex-wrap: wrap; gap: 4px 20px; font-size: 13px; }
  .rs li { display: inline-flex; align-items: center; gap: 8px; }
  .tree summary { cursor: pointer; font-size: 13px; color: var(--muted); margin-bottom: 8px; }
  .ach { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 6px; }
  .ach li { display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; background: var(--surface); font-size: 13px; }
  .aname { flex: 1; min-width: 0; }
  .secret { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--accent); }
  .pts { font-variant-numeric: tabular-nums; font-size: 12px; }
</style>
