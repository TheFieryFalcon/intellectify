import { ATTEMPT_CREDIT, CONFIG, type Tier } from "./config.js";

/** Attempts allowed at a tier (SPEC §6.2). Tier 6 is unlimited. */
export function maxAttempts(tier: Tier): number {
  return tier === 6 ? Infinity : ATTEMPT_CREDIT[tier].length;
}

/**
 * Outcome for an auto-marked question that was solved on `attempt` (1-based).
 * Only the final outcome counts; wrong attempts before a success don't update θ.
 * Pass `attempt = null` when the student ran out of attempts or gave up.
 */
export function autoMarkedOutcome(tier: Tier, attempt: number | null): number {
  if (attempt === null) return 0;
  if (tier === 6) return 1;
  const credit = ATTEMPT_CREDIT[tier][attempt - 1];
  if (credit === undefined) throw new RangeError(`Tier ${tier} allows ${maxAttempts(tier)} attempts, got attempt ${attempt}`);
  return credit;
}

/** Free-response outcome from a rubric score s ∈ [0, 1]: s if s ≥ 0.6, else 0 (SPEC §6.3). */
export function freeResponseOutcome(s: number): number {
  if (s < 0 || s > 1) throw new RangeError(`rubric score must be in [0, 1], got ${s}`);
  return s >= CONFIG.freeResponseThreshold ? s : 0;
}

/** Multi-part outcome: the mark-weighted mean of part outcomes (SPEC §6.2). */
export function multiPartOutcome(parts: { outcome: number; marks: number }[]): number {
  const total = parts.reduce((a, p) => a + p.marks, 0);
  if (total <= 0) throw new RangeError("multi-part question needs positive marks");
  return parts.reduce((a, p) => a + p.outcome * p.marks, 0) / total;
}
