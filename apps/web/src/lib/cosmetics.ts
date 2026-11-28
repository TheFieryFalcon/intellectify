/**
 * Every cosmetic by slot (SPEC §13.8–13.9): shop items, Axiom cosmetics, era frames and titles, with the
 * condition a locked one shows ("Axiom · Union · 700 k∴", "Machine Age set", "Achievement · Keystone").
 */
import { lemmasShort, type CosmeticSlot, type EconomyConfig } from "@intellectify/engine";
import type { TitleInfo } from "./titles.svelte";

export interface CosmeticEntry {
  id: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  price?: number;
  /** For items that can't be bought: how they're unlocked. */
  condition?: string;
}

export const SLOT_NAME: Record<CosmeticSlot, string> = {
  keypad: "Keypad skin",
  celebration: "Celebration",
  banner: "Banner",
  nodeTheme: "Node theme",
  frame: "Frame",
  title: "Title",
  lemmaIcon: "Lemma icon",
  nameOrnament: "Name ornament",
};

export function catalogue(cfg: EconomyConfig, titles: Record<string, TitleInfo>): CosmeticEntry[] {
  const out: CosmeticEntry[] = cfg.shop.map((c) => ({ ...c }));
  for (const a of cfg.axioms.list) {
    out.push({ ...a.cosmetic, condition: `Axiom · ${a.name} · ${lemmasShort(a.at)}` });
  }
  for (const e of cfg.eras) out.push({ id: `frame-${e.id}`, slot: "frame", name: e.name, description: `Complete the ${e.name} set`, condition: `${e.name} set` });
  for (const t of Object.values(titles)) {
    out.push({ id: t.title, slot: "title", name: t.title, description: t.kind === "axiom" ? `Axiom · ${t.source}` : t.source, condition: t.kind === "axiom" ? `Axiom · ${t.source}` : `Achievement · ${t.title}` });
  }
  return out;
}

/** A locked era's condition: "Build an Academy", "Build a House of Wisdom" (SPEC §13.7). */
export const buildLabel = (institute: string) => `Build ${/^[AEIOU]/.test(institute) ? "an" : "a"} ${institute}`;
