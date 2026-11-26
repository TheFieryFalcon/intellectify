import { CONFIG, SKILL_SIZE, type RankLevel, type SkillSize, type Tier } from "./config.js";
import { clampTheta, pCorrect, placementTheta, tierOf, updateTheta } from "./rating.js";
import { countsForGate, emptyGates, nextRank, recordGate, type GateCounts } from "./ranks.js";

/** Per-student, per-skill state (content skills and response skills share this shape). */
export interface SkillState {
  theta: number;
  rank: RankLevel;
  gates: GateCounts;
  /** Questions resolved in this skill. */
  resolved: number;
  /** Selection shift from "Drop a tier" (SPEC §5.3). Never changes θ. */
  dropTier: boolean;
}

/** New state when a student first opens a skill, placed at a starting tier (default Tier 3). */
export function newSkillState(startTier: Tier = CONFIG.defaultStartTier): SkillState {
  return { theta: placementTheta(startTier), rank: 0, gates: emptyGates(), resolved: 0, dropTier: false };
}

export interface ApplyResult {
  state: SkillState;
  deltaTheta: number;
  rankBefore: RankLevel;
  rankAfter: RankLevel;
}

/**
 * Apply one resolved question to a skill.
 * @param rating the question's rating (or, for response skills, that skill's difficulty on the question)
 * @param outcome final outcome in [0, 1]
 * @param weight 1 for the primary skill, CONFIG.secondaryWeight for secondary skills
 * @param size the skill's size (SPEC §3.3): bigger skills move θ more slowly and need more correct answers per rank
 */
export function applyOutcome(state: SkillState, rating: number, outcome: number, weight = 1, size: SkillSize = "medium"): ApplyResult {
  const rules = SKILL_SIZE[size];
  const theta = updateTheta(state.theta, rating, outcome, weight * rules.kScale);
  const gates = recordGate(state.gates, tierOf(rating), outcome);
  const rank = nextRank(state.rank, theta, gates, size);
  return {
    state: { ...state, theta, gates, rank, resolved: state.resolved + 1 },
    deltaTheta: theta - state.theta,
    rankBefore: state.rank,
    rankAfter: rank,
  };
}

/**
 * Change the outcome of a question already applied, e.g. after an appeal re-mark (SPEC §10.3).
 * θ moves by K·w·(new − old): exactly what the first update would have differed by, since both
 * use the same expected score. The gate count is corrected if the answer crosses the gate line.
 * `resolved` is unchanged: it's the same question.
 */
export function reviseOutcome(state: SkillState, rating: number, oldOutcome: number, newOutcome: number, weight = 1, size: SkillSize = "medium"): ApplyResult {
  const rules = SKILL_SIZE[size];
  const theta = clampTheta(state.theta + CONFIG.k * weight * rules.kScale * (newOutcome - oldOutcome));
  let gates = state.gates;
  const was = countsForGate(oldOutcome);
  const now = countsForGate(newOutcome);
  if (was !== now) {
    const t = tierOf(rating);
    gates = [...gates] as GateCounts;
    gates[t] = Math.max(0, (gates[t] ?? 0) + (now ? 1 : -1));
  }
  const rank = nextRank(state.rank, theta, gates, size);
  return { state: { ...state, theta, gates, rank }, deltaTheta: theta - state.theta, rankBefore: state.rank, rankAfter: rank };
}

/** One part of a question as it affects a skill: its own rating, its outcome, and its share of the marks. */
export interface PartOutcome {
  rating: number;
  outcome: number;
  /** marks / total marks; the shares of a question's parts add to 1. */
  share: number;
}

/**
 * Apply a resolved question part by part (SPEC §5.1): each part counts against its own rating, weighted
 * by its share of the marks, all from the same starting θ. Adding an easy part never makes a question
 * count as easier: it only adds a small, honest update of its own. With one part this is applyOutcome.
 * Each part counts toward the rank gate at its own tier.
 */
export function applyParts(state: SkillState, parts: PartOutcome[], weight = 1, size: SkillSize = "medium"): ApplyResult {
  const rules = SKILL_SIZE[size];
  let delta = 0;
  let gates = state.gates;
  for (const p of parts) {
    if (p.outcome < 0 || p.outcome > 1 || Number.isNaN(p.outcome)) throw new RangeError(`outcome must be in [0, 1], got ${p.outcome}`);
    delta += CONFIG.k * weight * rules.kScale * p.share * (p.outcome - pCorrect(state.theta, p.rating));
    gates = recordGate(gates, tierOf(p.rating), p.outcome);
  }
  const theta = clampTheta(state.theta + delta);
  const rank = nextRank(state.rank, theta, gates, size);
  return { state: { ...state, theta, gates, rank, resolved: state.resolved + 1 }, deltaTheta: theta - state.theta, rankBefore: state.rank, rankAfter: rank };
}

/** Change applied part outcomes (an appeal re-mark, SPEC §10.3): the exact difference, part by part. */
export function reviseParts(state: SkillState, before: PartOutcome[], after: PartOutcome[], weight = 1, size: SkillSize = "medium"): ApplyResult {
  let s = state;
  let delta = 0;
  before.forEach((b, i) => {
    const a = after[i]!;
    const r = reviseOutcome(s, b.rating, b.outcome, a.outcome, weight * b.share, size);
    delta += r.deltaTheta;
    s = r.state;
  });
  return { state: s, deltaTheta: delta, rankBefore: state.rank, rankAfter: s.rank };
}
