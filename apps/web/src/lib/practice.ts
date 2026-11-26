import {
  applyOutcome,
  autoMarkedOutcome,
  CONFIG,
  freeResponseOutcome,
  multiPartOutcome,
  newSkillState,
  pickQuestion,
  reviseOutcome,
  rollUp,
  tierOf,
  type RankLevel,
  type RollupChild,
  type SkillSize,
  type Tier,
} from "@intellectify/engine";
import { fillTemplate } from "@intellectify/content/template";
import type { CourseProgress, StoredSkillState } from "./backend";
import type { CourseBundle, QuestionT } from "./content";
import type { MarkResult } from "@intellectify/content/marking";

const SEEN_LIMIT = 200;
const RECENT = 20;

export const toStored = (s: ReturnType<typeof newSkillState>, seen: string[] = []): StoredSkillState => ({ ...s, seen, updatedAt: Date.now() });

/** The student's starting tier per course from onboarding (SPEC §5.3); Tier 3 until they've given a mark. */
let startTiers: Record<string, Tier> = {};
export const setStartTiers = (tiers: Record<string, Tier>) => (startTiers = { ...tiers });
export const getStartTier = (course: string): Tier => startTiers[course] ?? CONFIG.defaultStartTier;

/** A skill's state, or a fresh one placed at the student's starting tier if it hasn't been opened. */
export function stateOrNew(progress: CourseProgress, skillId: string, tier: Tier = CONFIG.defaultStartTier): StoredSkillState {
  return progress.skills[skillId] ?? toStored(newSkillState(tier));
}

/** Every part has an answer key (no LLM marking needed). Quizzes and challenges serve only these. */
export const isAutoMarked = (q: QuestionT) => q.parts.every((p) => p.answer);

export interface Served {
  question: QuestionT;
  variant: number | null;
}

/** Choose the next question for a skill and fill in a random variant. */
export function serveQuestion(pool: QuestionT[], state: StoredSkillState, hidden: ReadonlySet<string> = new Set(), opts: { freeResponse?: boolean } = {}): Served | null {
  const candidates = opts.freeResponse === false ? pool.filter(isAutoMarked) : pool;
  const picked = pickQuestion(candidates, state.theta, {
    dropTier: state.dropTier,
    recentlySeen: new Set(state.seen.slice(-RECENT)),
    everSeen: new Set(state.seen),
    hidden,
  });
  if (!picked) return null;
  if (!picked.variants?.length) return { question: picked, variant: null };
  const variant = Math.floor(Math.random() * picked.variants.length);
  return { question: fillTemplate(picked, picked.variants[variant]!), variant };
}

export interface PartResult {
  id: string;
  marks: number;
  /** Attempt that solved it, or null if it was never solved. */
  solvedOn: number | null;
}

export interface ResultSummary {
  outcome: number;
  tier: Tier;
  primary: { id: string; before: StoredSkillState; after: StoredSkillState; deltaTheta: number; rankBefore: RankLevel; rankAfter: RankLevel };
  changes: { skills: Record<string, StoredSkillState>; responseSkills: Record<string, StoredSkillState> };
}

/** Apply a resolved question to every skill it touches (SPEC §5.1, §5.6). Pure: returns the new states. */
export function scoreQuestion(
  progress: CourseProgress,
  question: QuestionT,
  parts: PartResult[],
  sizeOf: (skillId: string) => SkillSize = () => "medium",
  startTier: Tier = CONFIG.defaultStartTier,
): ResultSummary {
  const tier = tierOf(question.rating);
  const outcome = multiPartOutcome(parts.map((p) => ({ marks: p.marks, outcome: autoMarkedOutcome(tier, p.solvedOn) })));
  // Auto-marked: every listed response skill gets the question's outcome.
  const rs = Object.fromEntries(Object.keys(question.responseSkills).map((id) => [id, outcome]));
  return applyOutcomes(progress, question, outcome, rs, sizeOf, startTier);
}

/**
 * Apply an LLM-marked answer (SPEC §6.3, §5.6): content skills get freeResponseOutcome(s), and each
 * rubric dimension updates its response skill with that dimension's own score.
 */
export function scoreMarked(
  progress: CourseProgress,
  question: QuestionT,
  result: MarkResult,
  sizeOf: (skillId: string) => SkillSize = () => "medium",
  startTier: Tier = CONFIG.defaultStartTier,
): ResultSummary {
  return applyOutcomes(progress, question, freeResponseOutcome(Math.min(1, Math.max(0, result.score))), result.dimensions, sizeOf, startTier);
}

function applyOutcomes(
  progress: CourseProgress,
  question: QuestionT,
  outcome: number,
  responseOutcomes: Record<string, number>,
  sizeOf: (skillId: string) => SkillSize,
  startTier: Tier,
): ResultSummary {
  const skills: Record<string, StoredSkillState> = {};
  const primaryId = question.skills.primary;
  const before = stateOrNew(progress, primaryId, startTier);
  const primary = applyOutcome(before, question.rating, outcome, 1, sizeOf(primaryId));
  skills[primaryId] = toStored(primary.state, [...before.seen, question.id].slice(-SEEN_LIMIT));

  for (const id of question.skills.secondary) {
    const s = stateOrNew(progress, id, startTier);
    skills[id] = toStored(applyOutcome(s, question.rating, outcome, CONFIG.secondaryWeight, sizeOf(id)).state, s.seen);
  }

  const responseSkills: Record<string, StoredSkillState> = {};
  for (const [id, o] of Object.entries(responseOutcomes)) {
    const s = progress.responseSkills[id] ?? toStored(newSkillState());
    responseSkills[id] = toStored(applyOutcome(s, question.responseSkills[id] ?? question.rating, Math.min(1, Math.max(0, o))).state);
  }

  return {
    outcome,
    tier: tierOf(question.rating),
    primary: { id: primaryId, before, after: skills[primaryId]!, deltaTheta: primary.deltaTheta, rankBefore: primary.rankBefore, rankAfter: primary.rankAfter },
    changes: { skills, responseSkills },
  };
}

/** Correct an applied mark after an appeal re-mark (SPEC §10.3): every touched skill moves by the difference. */
export function reviseMarked(
  progress: CourseProgress,
  question: QuestionT,
  before: MarkResult,
  after: MarkResult,
  sizeOf: (skillId: string) => SkillSize = () => "medium",
  startTier: Tier = CONFIG.defaultStartTier,
): ResultSummary {
  const o1 = freeResponseOutcome(before.score);
  const o2 = freeResponseOutcome(after.score);
  const skills: Record<string, StoredSkillState> = {};
  const primaryId = question.skills.primary;
  const prev = stateOrNew(progress, primaryId, startTier);
  const primary = reviseOutcome(prev, question.rating, o1, o2, 1, sizeOf(primaryId));
  skills[primaryId] = toStored(primary.state, prev.seen);
  for (const id of question.skills.secondary) {
    const s = stateOrNew(progress, id, startTier);
    skills[id] = toStored(reviseOutcome(s, question.rating, o1, o2, CONFIG.secondaryWeight, sizeOf(id)).state, s.seen);
  }
  const responseSkills: Record<string, StoredSkillState> = {};
  for (const id of new Set([...Object.keys(before.dimensions), ...Object.keys(after.dimensions)])) {
    const s = progress.responseSkills[id];
    if (!s) continue;
    responseSkills[id] = toStored(reviseOutcome(s, question.responseSkills[id] ?? question.rating, before.dimensions[id] ?? 0, after.dimensions[id] ?? 0).state);
  }
  return {
    outcome: o2,
    tier: tierOf(question.rating),
    primary: { id: primaryId, before: prev, after: skills[primaryId]!, deltaTheta: primary.deltaTheta, rankBefore: primary.rankBefore, rankAfter: primary.rankAfter },
    changes: { skills, responseSkills },
  };
}

export interface Rollups {
  sections: Record<string, { theta: number | null; rank: RankLevel }>;
  units: Record<number, { theta: number | null; rank: RankLevel }>;
  course: { theta: number | null; rank: RankLevel };
  /** Flat map for persisting the hidden buffer: "section:<id>", "unit:<n>", "course". */
  ranks: Record<string, RankLevel>;
}

/** Section → unit → course roll-ups (SPEC §5.5). */
export function computeRollups(course: CourseBundle, progress: CourseProgress): Rollups {
  const prev = progress.rollupRanks;
  const sections: Rollups["sections"] = {};
  const units: Rollups["units"] = {};
  const ranks: Record<string, RankLevel> = {};
  const unitChildren: RollupChild[] = [];
  for (const u of course.units) {
    const sectionChildren: RollupChild[] = [];
    for (const s of u.sections) {
      const r = rollUp(
        s.skills.map((k) => {
          const st = progress.skills[k.id];
          return { theta: st?.resolved ? st.theta : null, rank: st?.rank ?? 0, weight: k.weight };
        }),
        prev[`section:${s.id}`] ?? 0,
      );
      sections[s.id] = r;
      ranks[`section:${s.id}`] = r.rank;
      sectionChildren.push(r);
    }
    const ur = rollUp(sectionChildren, prev[`unit:${u.number}`] ?? 0);
    units[u.number] = ur;
    ranks[`unit:${u.number}`] = ur.rank;
    unitChildren.push(ur);
  }
  const cr = rollUp(unitChildren, prev["course"] ?? 0);
  ranks["course"] = cr.rank;
  return { sections, units, course: cr, ranks };
}
