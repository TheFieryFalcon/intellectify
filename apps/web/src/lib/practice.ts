import {
  applyOutcome,
  autoMarkedOutcome,
  CONFIG,
  multiPartOutcome,
  newSkillState,
  pickQuestion,
  rollUp,
  tierOf,
  type RankLevel,
  type RollupChild,
  type Tier,
} from "@intellectify/engine";
import { fillTemplate } from "@intellectify/content/template";
import type { CourseProgress, StoredSkillState } from "./backend";
import type { CourseBundle, QuestionT } from "./content";

const SEEN_LIMIT = 200;
const RECENT = 20;

export const toStored = (s: ReturnType<typeof newSkillState>, seen: string[] = []): StoredSkillState => ({ ...s, seen, updatedAt: Date.now() });

/** A skill's state, or a fresh one placed at `startTier` if it hasn't been opened. */
export function stateOrNew(progress: CourseProgress, skillId: string, startTier: Tier = CONFIG.defaultStartTier): StoredSkillState {
  return progress.skills[skillId] ?? toStored(newSkillState(startTier));
}

/** Free-response parts need LLM marking (Phase 1), so Phase 0 practice only serves auto-marked questions. */
export const isAutoMarked = (q: QuestionT) => q.parts.every((p) => p.answer);

export interface Served {
  question: QuestionT;
  variant: number | null;
}

/** Choose the next question for a skill and fill in a random variant. */
export function serveQuestion(pool: QuestionT[], state: StoredSkillState, hidden: ReadonlySet<string> = new Set()): Served | null {
  const candidates = pool.filter(isAutoMarked);
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
export function scoreQuestion(progress: CourseProgress, question: QuestionT, parts: PartResult[]): ResultSummary {
  const tier = tierOf(question.rating);
  const outcome = multiPartOutcome(parts.map((p) => ({ marks: p.marks, outcome: autoMarkedOutcome(tier, p.solvedOn) })));

  const skills: Record<string, StoredSkillState> = {};
  const primaryId = question.skills.primary;
  const before = stateOrNew(progress, primaryId);
  const primary = applyOutcome(before, question.rating, outcome, 1);
  skills[primaryId] = toStored(primary.state, [...before.seen, question.id].slice(-SEEN_LIMIT));

  for (const id of question.skills.secondary) {
    const s = stateOrNew(progress, id);
    skills[id] = toStored(applyOutcome(s, question.rating, outcome, CONFIG.secondaryWeight).state, s.seen);
  }

  const responseSkills: Record<string, StoredSkillState> = {};
  for (const [id, difficulty] of Object.entries(question.responseSkills)) {
    const s = progress.responseSkills[id] ?? toStored(newSkillState());
    responseSkills[id] = toStored(applyOutcome(s, difficulty, outcome).state);
  }

  return {
    outcome,
    tier,
    primary: { id: primaryId, before, after: skills[primaryId]!, deltaTheta: primary.deltaTheta, rankBefore: primary.rankBefore, rankAfter: primary.rankAfter },
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
