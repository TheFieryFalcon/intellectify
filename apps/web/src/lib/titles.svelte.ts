/**
 * Titles (SPEC §13.9): every Tanzanite-and-up achievement and six Axioms unlock one. This maps each title
 * to where it comes from, for its style and tooltip.
 */
import { loadAchievementDefs } from "./achievements.svelte";
import { loadEconomyData } from "./economy.svelte";

export interface TitleInfo {
  title: string;
  /** The achievement tier, or "axiom". */
  kind: "tanzanite" | "vibranium" | "solarium" | "antimatter" | "axiom";
  /** The achievement's or the Axiom's name. */
  source: string;
  /** The achievement's id (T1, S2 …), for its own effect; the Axiom's id otherwise. */
  id: string;
}

export const titles = $state<{ map: Record<string, TitleInfo> }>({ map: {} });
let started = false;
export function loadTitles() {
  if (started || typeof fetch === "undefined") return;
  started = true;
  void Promise.all([loadAchievementDefs().catch(() => []), loadEconomyData().catch(() => null)]).then(([defs, eco]) => {
    const map: Record<string, TitleInfo> = {};
    for (const a of defs) if (a.title) map[a.title] = { title: a.title, kind: a.tier as TitleInfo["kind"], source: a.name, id: a.id };
    for (const a of eco?.config.axioms.list ?? []) if (a.title) map[a.title] = { title: a.title, kind: "axiom", source: a.name, id: a.id };
    titles.map = map;
  });
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
