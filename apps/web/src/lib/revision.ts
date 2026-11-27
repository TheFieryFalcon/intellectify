/**
 * Revision modes (SPEC §8.6): Exam Revision (Easy = Tiers 2 and 3, Hard = Tiers 3 and 4, half each) and
 * Custom Revision (any tiers, type and tags, over the course, a unit, a section or a skill).
 * Questions come from the question index, so every pool (practice, quizzes, Challenges) is in play.
 */
import type { QuestionIndexEntry } from "./content";

export type Scope = { kind: "course" } | { kind: "unit"; unit: number } | { kind: "section"; id: string } | { kind: "skill"; id: string };
export type ExamLevel = "easy" | "hard";
export const EXAM_TIERS: Record<ExamLevel, [number, number]> = { easy: [2, 3], hard: [3, 4] };

export interface RevisionSpec {
  mode: "exam" | "custom";
  scope: Scope;
  /** Exam only. */
  level: ExamLevel;
  /** Custom only: empty = any. */
  tiers: number[];
  kind: "" | "auto" | "written";
  tags: string[];
  /** Custom only: include questions that draw on a later unit. */
  later: boolean;
}

export function parseScope(s: string | null): Scope {
  const [k, v = ""] = (s ?? "").split(/:(.*)/s);
  if (k === "unit" && Number(v)) return { kind: "unit", unit: Number(v) };
  if ((k === "section" || k === "skill") && v) return { kind: k, id: v };
  return { kind: "course" };
}
export const scopeKey = (s: Scope) => (s.kind === "course" ? "course" : s.kind === "unit" ? `unit:${s.unit}` : `${s.kind}:${s.id}`);

export function specFromParams(p: URLSearchParams): RevisionSpec {
  const list = (k: string) => (p.get(k) ?? "").split(",").filter(Boolean);
  const kind = p.get("kind");
  return {
    mode: p.get("mode") === "custom" ? "custom" : "exam",
    scope: parseScope(p.get("scope")),
    level: p.get("level") === "hard" ? "hard" : "easy",
    tiers: list("tier").map(Number).filter((t) => t >= 1 && t <= 6).sort(),
    kind: kind === "auto" || kind === "written" ? kind : "",
    tags: list("tag"),
    later: p.get("later") === "1",
  };
}

export function specToParams(s: RevisionSpec): URLSearchParams {
  const p = new URLSearchParams({ mode: s.mode, scope: scopeKey(s.scope) });
  if (s.mode === "exam") p.set("level", s.level);
  else {
    if (s.tiers.length) p.set("tier", s.tiers.join(","));
    if (s.tags.length) p.set("tag", s.tags.join(","));
    if (s.later) p.set("later", "1");
  }
  if (s.kind) p.set("kind", s.kind);
  return p;
}

export function inScope(e: QuestionIndexEntry, s: Scope): boolean {
  if (s.kind === "unit") return e.unit === s.unit;
  if (s.kind === "section") return e.section === s.id;
  if (s.kind === "skill") return e.skills.includes(s.id);
  return true;
}

/** Every question the session can serve. */
export function candidates(index: QuestionIndexEntry[], s: RevisionSpec): QuestionIndexEntry[] {
  const tiers = s.mode === "exam" ? EXAM_TIERS[s.level] : s.tiers;
  return index.filter(
    (e) =>
      inScope(e, s.scope) &&
      (!tiers.length || tiers.includes(e.tier)) &&
      (!s.kind || e.kind === s.kind) &&
      (!s.tags.length || s.tags.some((t) => e.tags.includes(t))) &&
      (s.mode === "custom" ? s.later || !e.later : !e.later),
  );
}

/**
 * The next question. Exam: a fair coin picks one of the two tiers (the other if it has run dry).
 * Prefers questions not yet served this session, then ones never answered; random among the best.
 */
export function pickNext(
  pool: QuestionIndexEntry[],
  s: RevisionSpec,
  used: ReadonlySet<string>,
  answered: ReadonlySet<string>,
  rand: () => number = Math.random,
): QuestionIndexEntry | null {
  let from = pool;
  if (s.mode === "exam") {
    const [a, b] = EXAM_TIERS[s.level];
    const first = rand() < 0.5 ? a : b;
    const fresh = (t: number) => pool.filter((e) => e.tier === t && !used.has(e.id));
    from = fresh(first).length ? pool.filter((e) => e.tier === first) : fresh(first === a ? b : a).length ? pool.filter((e) => e.tier !== first) : pool;
  }
  if (!from.length) return null;
  const unused = from.filter((e) => !used.has(e.id));
  const tierA = unused.length ? unused : from;
  const neverAnswered = tierA.filter((e) => !answered.has(e.id));
  const best = neverAnswered.length ? neverAnswered : tierA;
  return best[Math.floor(rand() * best.length)] ?? null;
}
