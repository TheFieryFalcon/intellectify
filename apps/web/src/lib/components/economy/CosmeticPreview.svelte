<script lang="ts">
  /**
   * A live sample of a cosmetic (SPEC §13.11 Shop): a keypad skin as a working mini keypad, a celebration on
   * a sample answer with Replay, a banner as a profile hero with the student's own name, and a node theme on
   * one section of the student's real map.
   */
  import type { CosmeticEntry } from "$lib/cosmetics";
  import { loadCourse, type CourseBundle } from "$lib/content";
  import { computeRollups } from "$lib/practice";
  import { courseProgress } from "$lib/session.svelte";
  import { emptyProgress } from "$lib/backend";
  import MathKeypad from "../MathKeypad.svelte";
  import TechTree from "../TechTree.svelte";
  import CelebrationArt from "./CelebrationArt.svelte";
  import ProfileHero from "./ProfileHero.svelte";
  import Title from "./Title.svelte";

  let { item, name }: { item: CosmeticEntry; name: string } = $props();
  let typed = $state("");
  let replay = $state(0);
  let course = $state<CourseBundle | null>(null);
  $effect(() => {
    if (item.slot === "nodeTheme" && !course) void loadCourse(fetch, "specialist").then((c) => (course = c)).catch(() => {});
  });
  const section = $derived.by(() => {
    if (!course) return null;
    const unit = course.units[0]!;
    return { ...course, units: [{ ...unit, sections: unit.sections.slice(0, 1) }] } as CourseBundle;
  });
  // The student's real map (created outside any derived: the store holds state of its own).
  const store = item.slot === "nodeTheme" ? courseProgress("specialist") : null;
  const progress = $derived(store?.progress ?? emptyProgress());
</script>

<div class="preview">
  {#if item.slot === "keypad"}
    <p class="sample num">{typed || "Type with the keys"}</p>
    <MathKeypad skin={item.id} oninsert={(k) => (typed = `${typed}${k.insert.replace(/\\[a-z]+/g, (m) => m.slice(1)).replace(/[{}#?]/g, "")}`.slice(-40))} />
  {:else if item.slot === "celebration"}
    <div class="answer"><span class="num">x = 2π⁄3</span> <span class="ok">Correct</span></div>
    {#key replay}<CelebrationArt id={item.id} inline />{/key}
    <button class="btn link" onclick={() => replay++}>Replay</button>
  {:else if item.slot === "banner"}
    <ProfileHero {name} banner={item.id} frame={null} title={null} ornament={null} showcase={[]} cards={new Map()} />
  {:else if item.slot === "nodeTheme"}
    {#if section}<div class="tree"><TechTree course={section} {progress} rollups={computeRollups(section, progress)} readonly theme={item.id} /></div>{:else}<p class="muted">Loading…</p>{/if}
  {:else if item.slot === "title"}
    <Title title={item.id} />
  {:else if item.slot === "nameOrnament"}
    <ProfileHero {name} banner={null} frame={null} title={null} ornament={item.id} showcase={[]} cards={new Map()} />
  {/if}
</div>

<style>
  .preview { margin: 12px 0; }
  .sample { min-height: 24px; font-family: var(--font-display); font-size: 18px; border-bottom: 1px solid var(--line); margin: 0 0 6px; }
  .answer { display: flex; gap: 10px; align-items: center; font-size: 18px; }
  .ok { color: var(--good); font-size: 13px; font-weight: 600; }
  .tree { max-height: 360px; overflow: auto; border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: var(--bg); }
</style>
