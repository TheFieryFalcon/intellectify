/**
 * Review settings (SPEC §8.2–8.4), shared by the content build's pool checks and the app.
 * Browser-safe.
 */
export type Pool = "practice" | "section-quiz" | "unit-quiz" | "challenge";

/** Questions per tier in each quiz. Config-driven. */
export const QUIZ_MIX: Record<"section" | "unit", Partial<Record<1 | 2 | 3 | 4 | 5, number>>> = {
  section: { 1: 2, 2: 2, 3: 3, 4: 1 },
  unit: { 1: 2, 2: 4, 3: 6, 4: 3 },
};

/** A quiz pool should hold this many times its mix, so retakes differ. */
export const QUIZ_POOL_FACTOR = 2;

/** Section Challenge length scales with section size: its dot points, clamped to 10–15. */
export const challengeLength = (dotPointCount: number) => Math.max(10, Math.min(15, dotPointCount));

/** Section Challenge problems are Tier 4–5. */
export const CHALLENGE_RATING: [number, number] = [1550, 2000];

/**
 * Section Challenge grades: green (Tier 4), yellow (1700–1849), red (1850–1949), black (1950–1999).
 * A Challenge is a fixed, authored sequence that climbs green → yellow → red and ends on one black problem.
 */
export type Slope = "green" | "yellow" | "red" | "black";
export const SLOPES: Slope[] = ["green", "yellow", "red", "black"];
export const SLOPE_FLOOR: Record<Slope, number> = { green: 1550, yellow: 1700, red: 1850, black: 1950 };
export const slopeOf = (rating: number): Slope => (rating >= 1950 ? "black" : rating >= 1850 ? "red" : rating >= 1700 ? "yellow" : "green");

/** Review content for one section and one unit, as written by the build. */
export interface SectionReviews<Q> {
  sectionQuiz: Q[];
  /** The Section Challenge, in its fixed order. */
  challenge: Q[];
}
export interface UnitReviews<Q> {
  unitQuiz: Q[];
}
