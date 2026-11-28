/**
 * Celebration order (SPEC §13.11). Toasts play one at a time: rank-up, then achievement, then level-up.
 * Full-screen moments show one at a time, smallest first: level tier, then Axiom, then Conjecture. A level
 * tier reached on a problem screen waits until Next is pressed or the screen is left (the result row holds it).
 */
import type { AchievementT } from "@intellectify/content";
import type { AxiomDef, ConjectureDef, LevelTier } from "@intellectify/engine";

export type Toast =
  | { kind: "rankUp"; label: string; rank: number }
  | { kind: "achievement"; achievement: AchievementT }
  | { kind: "levelUp"; level: number; tier: LevelTier };

export type Moment =
  | { kind: "tier"; level: number; tier: LevelTier }
  | { kind: "axiom"; axioms: AxiomDef[] }
  | { kind: "conjecture"; conjecture: ConjectureDef; index: number; rateBefore: number; rateAfter: number };

const TOAST_ORDER: Record<Toast["kind"], number> = { rankUp: 0, achievement: 1, levelUp: 2 };
const MOMENT_ORDER: Record<Moment["kind"], number> = { tier: 0, axiom: 1, conjecture: 2 };

export const toasts = $state<Toast[]>([]);
export const moments = $state<Moment[]>([]);
/** While above 0, level-tier moments wait (a result row is showing). */
export const hold = $state({ count: 0 });

export function toast(t: Toast) {
  toasts.push(t);
  toasts.sort((a, b) => TOAST_ORDER[a.kind] - TOAST_ORDER[b.kind]);
}

export function celebrate(m: Moment) {
  moments.push(m);
  moments.sort((a, b) => MOMENT_ORDER[a.kind] - MOMENT_ORDER[b.kind]);
}

/** The moment to show now, if any. */
export function currentMoment(): Moment | null {
  const m = moments[0];
  if (!m) return null;
  if (m.kind === "tier" && hold.count > 0) return moments.find((x) => x.kind !== "tier") ?? null;
  return m;
}

export function dismissMoment(m: Moment) {
  const i = moments.indexOf(m);
  if (i >= 0) moments.splice(i, 1);
}
