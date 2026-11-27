<script lang="ts">
  /** Leaderboards (SPEC §12.2): every board from one shared read of the public profiles. */
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { boardsReadAt, loadPublicProfiles } from "$lib/boards";
  import type { PublicProfile } from "$lib/backend";
  import { BOARDS, rankBoard, type BoardId } from "$lib/public";
  import { perthDay } from "$lib/profile.svelte";
  import { courseProgress, session } from "$lib/session.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { onFlag } from "$lib/achievements";
  import { loadCourse } from "$lib/content";
  import { profileFor } from "$lib/profile.svelte";
  import { dayBefore } from "$lib/activity";

  let profiles = $state<PublicProfile[] | null>(null);
  let failed = $state(false);
  let readAt = $state<number | null>(null);

  let courses = $state<{ id: string; name: string }[]>([]);
  $effect(() => void fetch("/content/index.json").then((r) => (r.ok ? r.json() : [])).then((c) => (courses = c)));

  async function load(force = false) {
    if (!session.backend) return;
    failed = false;
    try {
      profiles = await loadPublicProfiles(session.backend, force);
      readAt = boardsReadAt();
    } catch {
      failed = true;
    }
  }
  $effect(() => {
    if (session.backend && profiles === null) void load();
  });

  const board = $derived<BoardId>((BOARDS.find((b) => b.id === page.url.searchParams.get("b"))?.id ?? "xp") as BoardId);
  const course = $derived(page.url.searchParams.get("course") ?? courses[0]?.id ?? "specialist");
  const groups = [...new Set(BOARDS.map((b) => b.group))];
  const group = $derived(BOARDS.find((b) => b.id === board)!.group);
  const inGroup = $derived(BOARDS.filter((b) => b.group === group));
  const go = (b: BoardId, c = course) => goto(`?b=${b}${b === "course" ? `&course=${c}` : ""}`, { replaceState: true, noScroll: true, keepFocus: true });

  const today = perthDay();
  const rows = $derived(profiles ? rankBoard(profiles, board, today, course) : []);
  const me = $derived(session.user?.uid);
  const top = $derived(rows.slice(0, 100));
  const mine = $derived(rows.find((r) => r.profile.uid === me));
  // Top of the Month (achievement T12): #1 on a course board, with someone else on it, on the month's last day (Perth).
  let checkedTop = false;
  $effect(() => {
    const list = profiles;
    const user = session.user;
    if (!list || !user || !session.backend || checkedTop || !courses.length) return;
    checkedTop = true;
    const lastDay = dayBefore(`${nextMonth(today)}-01`) === today;
    if (!lastDay) return;
    for (const c of courses) {
      const board = rankBoard(list, "course", today, c.id);
      if (board.length < 2 || board[0]!.profile.uid !== user.uid || board[1]!.pos === 1) continue;
      void loadCourse(fetch, c.id).then((bundle) => {
        const store = courseProgress(c.id);
        if (store) void achievementsFor(session.backend, user, bundle)?.event((s) => onFlag(s, "topOfMonth"), store, profileFor(session.backend, user));
      });
    }
  });
  function nextMonth(day: string) {
    const [y, m] = day.split("-").map(Number) as [number, number];
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  const time = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
</script>

<div class="wrap narrow">
  <h1>Leaderboards</h1>

  <nav class="groups" aria-label="Board">
    {#each groups as g (g)}
      <button class:on={g === group} aria-pressed={g === group} onclick={() => go(BOARDS.find((b) => b.group === g)!.id)}>{g}</button>
    {/each}
  </nav>
  {#if inGroup.length > 1}
    <nav class="periods" aria-label="Period">
      {#each inGroup as b (b.id)}
        <button class:on={b.id === board} aria-pressed={b.id === board} onclick={() => go(b.id)}>{b.name}</button>
      {/each}
    </nav>
  {/if}
  {#if board === "course" && courses.length > 1}
    <label class="course">Course <select value={course} onchange={(e) => go("course", e.currentTarget.value)}>{#each courses as c (c.id)}<option value={c.id}>{c.name}</option>{/each}</select></label>
  {/if}

  {#if failed}
    <p class="bad">Couldn't load the boards. <button class="btn link" onclick={() => load(true)}>Try again</button></p>
  {:else if profiles === null}
    <p class="muted">Loading…</p>
  {:else if !rows.length}
    <p class="muted">No one on this board yet</p>
  {:else}
    <ol class="board">
      {#each top as r (r.profile.uid)}
        <li class:me={r.profile.uid === me}>
          <span class="pos">{r.pos}</span>
          <a class="name" href="/profile/{r.profile.uid}">{r.profile.displayName}</a>
          <span class="val">{r.label}</span>
        </li>
      {/each}
      {#if mine && !top.includes(mine)}
        <li class="gap" aria-hidden="true">⋯</li>
        <li class="me">
          <span class="pos">{mine.pos}</span>
          <a class="name" href="/profile/{mine.profile.uid}">{mine.profile.displayName}</a>
          <span class="val">{mine.label}</span>
        </li>
      {/if}
    </ol>
  {/if}
  {#if readAt}
    <p class="foot muted">Updated {time(readAt)} · <button class="link" onclick={() => load(true)}>Refresh</button></p>
  {/if}
</div>

<style>
  h1 { margin: 0 0 14px; font-size: 26px; }
  .groups, .periods { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .groups button, .periods button { font: inherit; font-size: 13px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 5px 12px; cursor: pointer; }
  .periods button { font-size: 12px; padding: 3px 10px; }
  button.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .course { display: flex; gap: 6px; align-items: center; font-size: 13px; color: var(--muted); margin-bottom: 10px; }
  .course select { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 4px 8px; }
  .board { list-style: none; margin: 6px 0 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
  .board li { display: grid; grid-template-columns: 3ch minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 9px 14px; }
  .board li + li { border-top: 1px solid var(--line); }
  .board li.me { background: var(--accent-soft); }
  .pos { font-variant-numeric: tabular-nums; color: var(--muted); text-align: right; }
  .name { color: var(--ink); text-decoration: none; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .name:hover { color: var(--accent); }
  .val { font-variant-numeric: tabular-nums; font-size: 13px; }
  .gap { justify-content: center; color: var(--muted); display: block !important; text-align: center; padding: 2px !important; }
  .foot { font-size: 12px; margin-top: 10px; }
  .link { font: inherit; background: none; border: 0; padding: 0; color: var(--muted); text-decoration: underline; cursor: pointer; }
  .bad { color: var(--bad); }
</style>
