<script lang="ts">
  /**
   * Pick a subsection (SPEC §3). With a skill, just that skill's subsections; otherwise every skill's,
   * grouped under the skill's name. The value is a subsection key ("<skill>/<name>"), or "" for all.
   */
  import type { CourseBundle } from "$lib/content";
  import { subKey, subsectionGroups } from "$lib/subsections";

  let {
    course,
    value,
    skill = "",
    any = "All",
    only = null,
    onchange,
  }: {
    course: CourseBundle;
    value: string;
    skill?: string;
    any?: string;
    /** Keys that have questions; others are left out. */
    only?: ReadonlySet<string> | null;
    onchange: (key: string) => void;
  } = $props();

  const groups = $derived(
    subsectionGroups(course, skill)
      .map((g) => ({ ...g, subsections: g.subsections.filter((n) => !only || only.has(subKey(g.id, n))) }))
      .filter((g) => g.subsections.length),
  );
</script>

<select {value} onchange={(e) => onchange(e.currentTarget.value)}>
  <option value="">{any}</option>
  {#if skill}
    {#each groups[0]?.subsections ?? [] as n (n)}<option value={subKey(skill, n)}>{n}</option>{/each}
  {:else}
    {#each groups as g (g.id)}
      <optgroup label={g.name}>{#each g.subsections as n (n)}<option value={subKey(g.id, n)}>{n}</option>{/each}</optgroup>
    {/each}
  {/if}
</select>

<style>
  select { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; max-width: 240px; }
</style>
