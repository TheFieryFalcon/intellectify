<script lang="ts">
  import { SKILL_SIZE, type RankLevel } from "@intellectify/engine";
  import type { CourseProgress } from "$lib/backend";
  import type { CourseBundle } from "$lib/content";
  import { score } from "$lib/ranks";
  import RankDot from "./RankDot.svelte";

  let { course, progress }: { course: CourseBundle; progress: CourseProgress } = $props();

  type Col = "name" | "rank" | "score" | "theta" | "gate" | "questions";
  let sortBy = $state<Col | null>(null);
  let dir = $state(1);

  const rows = $derived(
    course.units.flatMap((u) =>
      u.sections.flatMap((s) =>
        s.skills.map((k) => {
          const st = progress.skills[k.id];
          const theta = st && st.resolved > 0 ? Math.round(st.theta) : null;
          const rank = (st?.rank ?? 0) as RankLevel;
          const nextTier = Math.min(rank + 1, 5);
          const gate = st ? st.gates.slice(nextTier).reduce((a, b) => a + b, 0) : 0;
          return { k, unit: u.number, section: s, rank, theta, score: theta === null ? null : score(theta), gate: rank === 5 ? null : Math.min(gate, SKILL_SIZE[k.size].gateCount), need: SKILL_SIZE[k.size].gateCount, nextTier };
        }),
      ),
    ),
  );
  const sorted = $derived.by(() => {
    if (!sortBy) return rows;
    const key = sortBy;
    const v = (r: (typeof rows)[number]) => (key === "name" ? r.k.name : key === "questions" ? r.k.questionCount : (r[key] ?? -1));
    return [...rows].sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * dir);
  });
  const sort = (c: Col) => (sortBy === c ? (dir = -dir) : ((sortBy = c), (dir = c === "name" ? 1 : -1)));
  const aria = (c: Col) => (sortBy === c ? (dir > 0 ? "ascending" : "descending") : "none");
  const TIER_RANK = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
</script>

<div class="wrap-table">
  <table>
    <thead>
      <tr>
        <th aria-sort={aria("name")}><button onclick={() => sort("name")}>Skill</button></th>
        <th aria-sort={aria("rank")}><button onclick={() => sort("rank")}>Rank</button></th>
        <th aria-sort={aria("score")} class="num"><button onclick={() => sort("score")}>Score</button></th>
        <th aria-sort={aria("theta")} class="num"><button onclick={() => sort("theta")}>θ</button></th>
        <th aria-sort={aria("gate")}><button onclick={() => sort("gate")}>Next gate</button></th>
        <th aria-sort={aria("questions")} class="num"><button onclick={() => sort("questions")}>Questions</button></th>
      </tr>
    </thead>
    <tbody>
      {#each sorted as r, i (r.k.id)}
        {#if !sortBy && (i === 0 || sorted[i - 1]!.section.id !== r.section.id)}
          <tr class="group"><td colspan="6">Unit {r.unit} · {r.section.name}</td></tr>
        {/if}
        <tr>
          <td><a href="/{course.id}/skill/{r.k.id}">{r.k.name}</a></td>
          <td><RankDot rank={r.rank} label /></td>
          <td class="num">{r.score ?? ""}</td>
          <td class="num">{r.theta ?? ""}</td>
          <td class="muted">{r.gate === null ? "" : `${TIER_RANK[r.nextTier]} ${r.gate}/${r.need}`}</td>
          <td class="num">{r.k.questionCount}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .wrap-table { overflow-x: auto; }
  table { width: 100%; min-width: 640px; border-collapse: collapse; }
  th, td { text-align: left; padding: 9px 8px; border-bottom: 1px solid var(--line); }
  th button { all: unset; cursor: pointer; font-size: 11px; font-weight: 500; color: var(--muted); }
  th[aria-sort="ascending"] button::after { content: " ↑"; }
  th[aria-sort="descending"] button::after { content: " ↓"; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  th.num button { display: block; text-align: right; }
  td a { color: var(--ink); text-decoration: none; }
  td a:hover { color: var(--accent); }
  tr.group td { padding-top: 22px; font-size: 11px; color: var(--muted); border-bottom-color: var(--ink); }
</style>
