import type { WordPicks } from "@intellectify/content/template";
import type { EconomyState, Equipped, MarkSource, RankLevel, SkillState, Tier } from "@intellectify/engine";
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
  /** When the account was created (ms), shown on the profile page as "Joined". */
  joined?: number;
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
  /**
   * When each question last earned XP (key: question ID), for the 30-day repeat rule. One-off grants use
   * keys here too: `tutorial:<course>:<skill>` (first read) and `post:<day>:<n>` (discussion posts, 3 a day).
   */
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
  /** Phone keyboard Shift keys the student changed from the defaults (SPEC §7.2); null = Shift types the key. */
  shiftKeys?: Record<string, string | null>;
  /** Settings › Show rewards (SPEC §13): false hides the whole Lemma economy for this student. */
  showRewards?: boolean;
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
 * in one document, so a board costs one read per student (SPEC §12.2–12.3, §17.3).
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
  /** When the account was created (ms). */
  joined?: number;
  /** The Lemma economy's public side (SPEC §13.10): what's equipped, the collection, and two board values. */
  economy?: PublicEconomy;
}

export interface PublicEconomy {
  equipped: Pick<Equipped, "title" | "frame" | "banner" | "nameOrnament" | "showcase">;
  /** Collected card ids: 1 for a foil, 0 otherwise. */
  cards: Record<string, 0 | 1>;
  lemmasEarned: number;
  axiomsProven: number;
}

/** One batched save of users/{uid}/meta/economy: everything but the two counters, which move by increments. */
export interface EconomySave {
  fields: Omit<EconomyState, "lemmasEarned" | "lemmasSpent" | "researchCreditedAt">;
  earned: number;
  spent: number;
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
  /** What applying it did, shown under the mark like an auto-marked result (XP includes a daily bonus). */
  effect?: { xp: number; outcome: number; theta: number; deltaTheta: number; rankBefore: number; rankAfter: number } | null;
  /** Paste detector signals (SPEC §7.2): blocked outside pastes, bursts, seconds to answer. */
  signals?: { blocked: number; bursts: number; seconds: number } | null;
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

/** A discussion thread for one daily problem (SPEC §14.1): key "<day>:<course>:<year group>". */
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

/** An error report on a question or tutorial (SPEC §11.4). The owner confirms or dismisses it. */
export interface Report {
  id: string;
  uid: string;
  name: string;
  course: string;
  kind: "question" | "tutorial";
  /** Question ID, or the skill ID for a tutorial. */
  target: string;
  /** The exact variant and words the student saw (questions only). */
  variant: number | null;
  words: Record<string, number> | null;
  /** The question's highest tier (questions only), for Counterexample (D21). */
  tier: number | null;
  note: string;
  at: number;
  status: "open" | "confirmed" | "dismissed";
}
export type NewReport = Omit<Report, "id" | "uid" | "name" | "at" | "status">;

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
  /** Save the student's phone keyboard Shift keys (only those changed from the defaults). */
  saveShiftKeys(uid: string, keys: Record<string, string | null>): Promise<void>;
  /** Change the display name everywhere it's stored (account, profile, public mirror). */
  setDisplayName(user: User, name: string): Promise<void>;
  /** Add XP to the profile. */
  grantXp(user: User, grant: XpGrant): Promise<void>;
  /**
   * Record name, email and "last seen" on the profile. Called only after the profile has loaded: written at
   * sign-in, the same moment as the load, it let Firestore answer the load with just these few fields.
   */
  markSeen(user: User): Promise<void>;
  /** Save the daily-problem record. */
  saveDaily(user: User, daily: DailyRecord): Promise<void>;
  /**
   * Save the activity counters and the public mirror together (one batch). Called at most every few
   * seconds, not per answer. Anonymous accounts keep their counters but stay off the public mirror.
   */
  savePublic(user: User, stats: ActivityStats | null, pub: PublicProfile, economy?: EconomySave | null): Promise<void>;
  /** Save profile settings (Show rewards). */
  saveSettings(uid: string, settings: Pick<Profile, "showRewards">): Promise<void>;

  /** The Lemma economy (SPEC §13.10), from the server only; null before the first save. */
  loadEconomy(uid: string): Promise<EconomyState | null>;
  /**
   * Credit Research (SPEC §13.3) in one transaction, using the server's clock: `credit` gets the saved
   * state and the server time (ms) and returns the Lemmas to add and where crediting moves to.
   * Returns the saved state afterwards.
   */
  creditResearch(uid: string, credit: (saved: EconomyState, now: number) => { lemmas: number; hours: number; creditedAt: number }): Promise<EconomyState>;
  /** Every public profile, for leaderboards and profile pages. */
  listPublic(): Promise<PublicProfile[]>;

  /** Discussion threads with posts, most recently active first (SPEC §14). */
  listThreads(): Promise<ThreadSummary[]>;
  loadPosts(key: string): Promise<Post[]>;
  /** Add a post or comment, creating the thread on its first post. */
  addPost(user: User, thread: Pick<ThreadSummary, "key" | "day" | "course" | "year" | "questionId">, body: string, parent: string | null, name: string): Promise<Post>;
  /** Delete one of your own posts. */
  deletePost(key: string, post: Post): Promise<void>;

  /** Report an error in a question or tutorial (SPEC §11.4). */
  addReport(user: User, report: NewReport): Promise<void>;
  /** This student's confirmed reports in one course, for achievements and XP. */
  confirmedReports(uid: string, course: string): Promise<Report[]>;
  /** The owner's review page: true for the owner's account (or one with the `admin` claim). */
  isAdmin(): Promise<boolean>;
  /** Every report, newest first (admin only). */
  listReports(): Promise<Report[]>;
  setReportStatus(id: string, status: Report["status"]): Promise<void>;

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
