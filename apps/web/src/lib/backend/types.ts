import type { WordPicks } from "@intellectify/content/template";
import type { MarkSource, RankLevel, SkillState, Tier } from "@intellectify/engine";
import type { MarkResult } from "@intellectify/content/marking";
import type { ActivityStats } from "../activity";
export type { ActivityStats };

export interface User {
  uid: string;
  displayName: string;
  email: string | null;
  /** True for the local-only guest used when Firebase isn't configured. */
  local: boolean;
  /** Signed in anonymously (Firebase), e.g. to test deploy previews. Kept off public leaderboards. */
  anonymous?: boolean;
  /** Signed in with Google: the name came from Google, so onboarding asks for one. */
  google?: boolean;
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
  /** Daily problems (SPEC §8.5): streak and recent days. */
  daily: DailyRecord | null;
  /** Problems done and XP by period, for leaderboards (SPEC §12.2). */
  stats: ActivityStats | null;
  /** The student has chosen their display name (sign-up form, onboarding or Settings). */
  nameSet?: boolean;
}

/** A skill's rank and θ (null until resolved), as shown to other students. */
export interface PublicSkill {
  r: RankLevel;
  t: number | null;
}

/** One course on a public profile: what the read-only tech tree and the course board need. */
export interface PublicCourse {
  rank: RankLevel;
  theta: number | null;
  skills: Record<string, PublicSkill>;
  responseSkills: Record<string, PublicSkill>;
  /** The hidden-buffer roll-up ranks ("section:<id>", "unit:<n>", "course"). */
  rollupRanks: Record<string, RankLevel>;
}

/**
 * The public mirror of a student (publicProfiles/{uid}): everything leaderboards and profile pages show,
 * in one document, so a board costs one read per student (SPEC §12.2–12.3, §16.3).
 */
export interface PublicProfile {
  uid: string;
  displayName: string;
  xp: number;
  stats: ActivityStats | null;
  daily: { streak: number; best: number; last: string | null } | null;
  /** Earned achievement ids and their points, per course. */
  achievements: Record<string, { ids: string[]; points: number }>;
  courses: Record<string, PublicCourse>;
  updatedAt: number;
}

export interface DailyRecord {
  /** Perth date of the last solved daily problem. */
  lastSolved: string | null;
  streak: number;
  best: number;
  /** Recent daily problems by "<day>:<course>:<year group>": solved, or tried without solving. */
  done: Record<string, "solved" | "tried">;
}

export interface Placement {
  mark: number;
  source: MarkSource;
  /** Starting tier per course id, e.g. { specialist: 4, methods: 5 }. */
  tiers: Record<string, Tier>;
  at: number;
}

export const emptyProfile = (): Profile => ({ xp: 0, questionXpAt: {}, lastVisitDay: null, placement: null, daily: null, stats: null });

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
  questions: { id: string; variant: number | null; words?: WordPicks | null }[];
  /** One entry per finished question, in order. A written answer has a null outcome until its mark lands. */
  results: { id: string; outcome: number | null; firstTry: boolean; jobId?: string; skipped?: boolean }[];
  startedAt: number;
  finishedAt: number | null;
}

/** Achievement stats (opaque here; see lib/achievements.ts) and earned achievements with their dates. */
export interface AchievementRecord {
  stats: unknown;
  earned: Record<string, number>;
}

/**
 * A free-response answer waiting for, or holding, its LLM mark (SPEC §10.2). Saved before the first
 * marking attempt, so it survives closing the app; the open app retries with backoff.
 */
export interface MarkingJob {
  id: string;
  course: string;
  skill: string;
  questionId: string;
  questionVersion: number;
  variant: number | null;
  /** Words picked when it was served (SPEC §9.6). */
  words?: WordPicks | null;
  /** Set for a daily problem (SPEC §8.5): "<day>:<course>:<year group>", so the mark can extend the streak. */
  daily?: string | null;
  answers: Record<string, string>;
  createdAt: number;
  /** pending: waiting to be marked; marked: has a result; failed: can't be marked (e.g. the question was removed). */
  status: "pending" | "marked" | "failed";
  attempts: number;
  nextTryAt: number;
  lastError: string | null;
  result: MarkResult | null;
  /** The result has been applied to θ, ranks, XP and achievements. */
  applied: boolean;
  /** One appeal per marked answer (SPEC §10.3). */
  appeal: {
    argument: string;
    status: "pending" | "marked" | "failed";
    attempts: number;
    nextTryAt: number;
    lastError: string | null;
    result: MarkResult | null;
    applied: boolean;
  } | null;
}

/** A discussion thread for one daily problem (SPEC §13.1): key "<day>:<course>:<year group>". */
export interface ThreadSummary {
  key: string;
  day: string;
  course: string;
  year: number;
  questionId: string;
  posts: number;
  updatedAt: number;
  /** Every post's text, for search. */
  text: string;
}

export interface Post {
  id: string;
  uid: string;
  name: string;
  /** Markdown and LaTeX, with ||spoilers||. */
  body: string;
  at: number;
  /** The post this comments on; null for a top-level post. */
  parent: string | null;
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
  /**
   * Anonymous accounts only (SPEC §2.1a): keep the progress by adding a login to this account, or, if
   * that login already has an account, by logging in to it and merging this progress in. Resolves true
   * once signed in to the permanent account (false if the student cancelled).
   */
  upgradeWithGoogle(): Promise<boolean>;
  upgradeWithEmail(mode: "sign-up" | "sign-in", name: string, email: string, password: string): Promise<boolean>;

  loadProfile(uid: string): Promise<Profile>;
  /** Save the onboarding placement. */
  setPlacement(uid: string, placement: Placement): Promise<void>;
  /** Change the display name everywhere it's stored (account, profile, public mirror). */
  setDisplayName(user: User, name: string): Promise<void>;
  /** Add XP to the profile. */
  grantXp(user: User, grant: XpGrant): Promise<void>;
  /** Save the daily-problem record. */
  saveDaily(user: User, daily: DailyRecord): Promise<void>;
  /**
   * Save the activity counters and the public mirror together (one batch). Called at most every few
   * seconds, not per answer. Anonymous accounts keep their counters but stay off the public mirror.
   */
  savePublic(user: User, stats: ActivityStats | null, pub: PublicProfile): Promise<void>;
  /** Every public profile, for leaderboards and profile pages. */
  listPublic(): Promise<PublicProfile[]>;

  /** Discussion threads with posts, most recently active first (SPEC §13). */
  listThreads(): Promise<ThreadSummary[]>;
  loadPosts(key: string): Promise<Post[]>;
  /** Add a post or comment, creating the thread on its first post. */
  addPost(user: User, thread: Pick<ThreadSummary, "key" | "day" | "course" | "year" | "questionId">, body: string, parent: string | null, name: string): Promise<Post>;
  /** Delete one of your own posts. */
  deletePost(key: string, post: Post): Promise<void>;

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

  /** Recent marking jobs, newest first. */
  loadMarkingJobs(uid: string): Promise<MarkingJob[]>;
  saveMarkingJob(uid: string, job: MarkingJob): Promise<void>;
  /** A fresh ID token for calls to /api/mark; null in local mode. */
  idToken(): Promise<string | null>;
}
