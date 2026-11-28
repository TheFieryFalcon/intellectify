/**
 * The archive's stage (SPEC §13.11): the latest unlocked era; then night with each proven large cardinal once
 * every era is open; then constellations with each Conjecture once all 18 Axioms are proven.
 */
import { eraUnlocked } from "@intellectify/engine";
import type { EconomyStore } from "./economy.svelte";

export function archiveStage(economy: EconomyStore | null): { era: string; night: number; stars: number } {
  const cfg = economy?.config;
  if (!economy || !cfg) return { era: "antiquity", night: 0, stars: 0 };
  const s = economy.state;
  const eras = cfg.eras.filter((e) => eraUnlocked(cfg, s, e.id));
  const all = eras.length === cfg.eras.length;
  return {
    era: eras.at(-1)?.id ?? "antiquity",
    night: all ? Math.max(0, Math.min(9, s.axiomsProven - 9)) : 0,
    stars: all && s.axiomsProven >= cfg.axioms.list.length ? s.conjectures : 0,
  };
}
