import type { MarkSource, RankLevel, SkillState, Tier } from "@intellectify/engine";

export interface User {
  uid: string;
  displayName: string;
  email: string | null;
  /** True for the local-only guest used when Firebase isn't configured. */
  local: boolean;
  /** Signed in anonymously (Firebase), e.g. to test deploy previews. Kept off public leaderboards. */
  anonymous?: boolean;
}

/** A skill's stored state: the engine's state plus selection history. */
export interface StoredSkillState extends SkillState {
  /** Question IDs answered in this skill, most recent last (bounded). */
  seen: string[];
  updatedAt: number;
}

export interface AttemptRecord {
  id: string;
  course: string;
  questionId: string;
  questionVersion: number;
  variant: number | null;
  skill: string;
  rating: number;
  outcome: number;
  /** Attempt number that solved each part, or null if not solved. */
  parts: { id: string; solvedOn: number | null; answers: string[] }[];
  deltaTheta: number;
  at: number;
}

export interface CourseProgress {
  skills: Record<string, StoredSkillState>;
  responseSkills: Record<string, StoredSkillState>;
  /** Rolled-up ranks for sections/units/course, kept for the hidden buffer. */
  rollupRanks: Record<string, RankLevel>;
}

export const emptyProgress = (): CourseProgress => ({ skills: {}, responseSkills: {}, rollupRanks: {} });

/** Account-wide profile data (SPEC §12.4). */
export interface Profile {
  /** Total XP, never decreasing. */
  xp: number;
  /** When each question last earned XP (key: question ID), for the 30-day repeat rule. */
  questionXpAt: Record<string, number>;
  /** Perth date (YYYY-MM-DD) of the last first-visit bonus. */
  lastVisitDay: string | null;
  /** Onboarding placement (SPEC §5.3): the maths mark given, where it's from, and the starting tier per course. */
  placement: Placement | null;
}

export interface Placement {
  mark: number;
  source: MarkSource;
  /** Starting tier per course id, e.g. { specialist: 4, methods: 5 }. */
  tiers: Record<string, Tier>;
  at: number;
}

export const emptyProfile = (): Profile => ({ xp: 0, questionXpAt: {}, lastVisitDay: null, placement: null });

export interface XpGrant {
  amount: number;
  /** Question that earned it, recorded for the repeat rule. */
  questionId?: string;
  /** Set when this grant is the first-visit bonus for that day. */
  visitDay?: string;
}

/** Everything the app needs from a backend. Firebase and local storage both implement it. */
/** Saved Section Challenge progress (SPEC §8.4: untimed, resumable). */
export interface ChallengeState {
  questions: { id: string; variant: number | null }[];
  /** One entry per finished question, in order. */
  results: { id: string; outcome: number; firstTry: boolean }[];
  startedAt: number;
  finishedAt: number | null;
}

/** Achievement stats (opaque here; see lib/achievements.ts) and earned achievements with their dates. */
export interface AchievementRecord {
  stats: unknown;
  earned: Record<string, number>;
}

export interface Backend {
  readonly kind: "firebase" | "local";
  /** Subscribe to sign-in changes; returns an unsubscribe function. */
  onUser(cb: (user: User | null) => void): () => void;
  signInWithGoogle(): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(name: string, email: string, password: string): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Local mode only: the single browser-local guest. */
  signInAsGuest(): Promise<void>;
  signOut(): Promise<void>;

  loadProfile(uid: string): Promise<Profile>;
  /** Save the onboarding placement. */
  setPlacement(uid: string, placement: Placement): Promise<void>;
  /** Add XP to the profile and the public leaderboard mirror. */
  grantXp(user: User, grant: XpGrant): Promise<void>;

  loadProgress(uid: string, course: string): Promise<CourseProgress>;
  /** Save changed states (and the attempt, if any) in one write batch. */
  saveResult(
    uid: string,
    course: string,
    changes: { skills: Record<string, StoredSkillState>; responseSkills: Record<string, StoredSkillState>; rollupRanks: Record<string, RankLevel> },
    attempt: AttemptRecord | null,
  ): Promise<void>;

  /** Achievement stats and earned achievements for one course (SPEC §12.1). */
  loadAchievements(uid: string, course: string): Promise<AchievementRecord | null>;
  saveAchievements(uid: string, course: string, record: AchievementRecord): Promise<void>;

  /** Section Challenge progress; `null` clears it (to start again). */
  loadChallenge(uid: string, course: string, section: string): Promise<ChallengeState | null>;
  saveChallenge(uid: string, course: string, section: string, state: ChallengeState | null): Promise<void>;
}
