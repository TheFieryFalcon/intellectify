import { CONFIG, SKILL_SIZE, type RankLevel, type SkillSize, type Tier } from "./config.js";
import { placementTheta, tierOf, updateTheta } from "./rating.js";
import { emptyGates, nextRank, recordGate, type GateCounts } from "./ranks.js";

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
  const rank = nextRank(state.rank, theta, gates, rules.gateCount);
  return {
    state: { ...state, theta, gates, rank, resolved: state.resolved + 1 },
    deltaTheta: theta - state.theta,
    rankBefore: state.rank,
    rankAfter: rank,
  };
}
