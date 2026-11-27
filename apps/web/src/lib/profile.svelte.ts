import { levelProgress, XP, XP_REPEAT_WINDOW_MS, type LevelTier } from "@intellectify/engine";
import { shiftOverrides, storeShiftOverrides, type ShiftMap } from "./keypad";
import { emptyProfile, type Backend, type CourseProgress, type DailyRecord, type Placement, type Profile, type PublicCourse, type User } from "./backend";
import { addProblem, addXp, roll } from "./activity";
import type { CourseBundle } from "./content";
import { publicCourse } from "./public";
import { loadBannedWords, safeName } from "./moderation";
import { nextStreak } from "./daily";
import { setStartTiers } from "./practice";

/** Today's date in Perth (YYYY-MM-DD): days roll over at local midnight for WA students. */
export const perthDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth" }).format(d);

const ANON_PLACEMENT = "intellectify:anon-placement";
const anonCountKey = (uid: string) => `intellectify:anon-count:${uid}`;
/** Questions this anonymous account has answered, as counted in this browser. */
export const anonCount = (uid: string): number => {
  try {
    return Number(localStorage.getItem(anonCountKey(uid))) || 0;
  } catch {
    return 0;
  }
};
const readAnonPlacement = (): Placement | null => {
  try {
    const p = JSON.parse(localStorage.getItem(ANON_PLACEMENT) ?? "null") as Placement | null;
    return p?.tiers ? p : null;
  } catch {
    return null;
  }
};
const writeAnonPlacement = (p: Placement) => {
  try {
    localStorage.setItem(ANON_PLACEMENT, JSON.stringify(p));
  } catch {
    /* storage blocked: asked again next time */
  }
};

export interface LevelUp {
  level: number;
  tier: LevelTier;
  /** True when this level-up also reached a new tier. */
  newTier: boolean;
}

/** Account-wide XP and level for the signed-in user (SPEC §12.4). */
export class ProfileStore {
  profile = $state<Profile>(emptyProfile());
  loaded = $state(false);
  /** Set when a grant crosses a level boundary; the layout shows it as a toast. */
  levelUp = $state<LevelUp | null>(null);
  progress = $derived(levelProgress(this.profile.xp));

  constructor(
    private readonly backend: Backend,
    private user: User,
  ) {
    // Save the public mirror before the page goes away (a debounced save may be waiting).
    if (typeof document !== "undefined") {
      const now = () => void this.flush();
      document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && now());
      addEventListener("pagehide", now);
    }
  }

  /**
   * Public mirror (SPEC §12.2–12.3): changes collect here and are saved together a few seconds after the
   * last one, so a run of answers costs one write, not one per answer.
   */
  private dirty = false;
  private pendingCourses: Record<string, PublicCourse> = {};
  private pendingAchievements: Record<string, { ids: string[]; points: number }> = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  static readonly PUBLISH_DELAY_MS = 15_000;

  private schedule() {
    this.dirty = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), ProfileStore.PUBLISH_DELAY_MS);
  }

  /** Save counters and the public mirror now, if anything changed. */
  async flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.dirty || !this.loaded) return;
    this.dirty = false;
    const courses = this.pendingCourses;
    const achievements = this.pendingAchievements;
    this.pendingCourses = {};
    this.pendingAchievements = {};
    const d = this.profile.daily;
    try {
      const banned = await loadBannedWords();
      await this.backend.savePublic(this.user, $state.snapshot(this.profile.stats), {
        uid: this.user.uid,
        displayName: safeName(this.user.displayName, banned),
        xp: this.profile.xp,
        stats: $state.snapshot(this.profile.stats),
        daily: d ? { streak: d.streak, best: d.best, last: d.lastSolved } : null,
        achievements,
        courses,
        updatedAt: Date.now(),
      });
    } catch {
      // Keep the changes for the next try.
      this.pendingCourses = { ...courses, ...this.pendingCourses };
      this.pendingAchievements = { ...achievements, ...this.pendingAchievements };
      this.dirty = true;
    }
  }

  /** One more problem done (any mode). */
  countProblem() {
    this.profile = { ...this.profile, stats: addProblem(this.profile.stats, perthDay()) };
    // The anonymous limit (SPEC §2.1a) can't wait for the batched save: count it here at once.
    if (this.user.anonymous) {
      try {
        localStorage.setItem(anonCountKey(this.user.uid), String(anonCount(this.user.uid) + 1));
      } catch {
        /* storage blocked: the saved stats still count */
      }
    }
    this.schedule();
  }

  /** A course's ranks changed. */
  publishCourse(course: CourseBundle, progress: CourseProgress) {
    this.pendingCourses[course.id] = publicCourse(course, progress);
    this.schedule();
  }

  /** A course's earned achievements changed. */
  publishAchievements(course: string, ids: string[], points: number) {
    this.pendingAchievements[course] = { ids, points };
    this.schedule();
  }

  async load() {
    try {
      this.profile = await this.backend.loadProfile(this.user.uid);
    } catch {
      // Offline or blocked: start from zero locally; grants still try to save.
    }
    // Deploy previews: each anonymous sign-in is a new account. Reuse this browser's last anonymous
    // placement instead of asking for the maths mark every time.
    if (this.user.anonymous && !this.profile.placement?.tiers) {
      const saved = readAnonPlacement();
      if (saved) {
        this.profile = { ...this.profile, placement: saved };
        void this.backend.setPlacement(this.user.uid, saved).catch(() => {});
      }
    }
    if (this.profile.placement?.tiers) setStartTiers(this.profile.placement.tiers);
    // The account's phone keyboard Shift keys follow the student to this device.
    if (this.profile.shiftKeys) storeShiftOverrides(this.profile.shiftKeys);
    this.profile = { ...this.profile, stats: roll(this.profile.stats, perthDay()) };
    this.loaded = true;
    const today = perthDay();
    if (this.profile.lastVisitDay !== today) await this.grant(XP.firstVisitOfDay, { visitDay: today });
  }

  /** Add XP, update the level immediately, and persist. */
  async grant(amount: number, extra: { questionId?: string; visitDay?: string } = {}) {
    if (amount <= 0 && !extra.visitDay) return;
    const before = levelProgress(this.profile.xp);
    this.profile = {
      ...this.profile,
      xp: this.profile.xp + amount,
      questionXpAt: extra.questionId ? { ...this.profile.questionXpAt, [extra.questionId]: Date.now() } : this.profile.questionXpAt,
      lastVisitDay: extra.visitDay ?? this.profile.lastVisitDay,
      stats: addXp(this.profile.stats, perthDay(), amount),
    };
    this.schedule();
    const after = levelProgress(this.profile.xp);
    if (after.level > before.level) this.levelUp = { level: after.level, tier: after.tier, newTier: after.tier.key !== before.tier.key };
    try {
      await this.backend.grantXp(this.user, { amount, ...extra });
    } catch {
      // A failed save loses this grant on reload; practice itself is unaffected.
    }
  }

  /** Change the display name (onboarding or Settings). Checked for banned words by the caller and the rules. */
  async rename(name: string) {
    await this.backend.setDisplayName(this.user, name);
    this.user = { ...this.user, displayName: name };
    this.profile = { ...this.profile, nameSet: true };
  }

  /** Save the phone keyboard Shift keys (SPEC §7.2), on this device and the account. */
  async setShiftKeys(map: ShiftMap) {
    const shiftKeys = shiftOverrides(map);
    storeShiftOverrides(shiftKeys);
    this.profile = { ...this.profile, shiftKeys };
    await this.backend.saveShiftKeys(this.user.uid, shiftKeys);
  }

  /** Save the onboarding placement; new skills start at its tier for their course from now on. */
  async setPlacement(placement: Placement) {
    this.profile = { ...this.profile, placement };
    setStartTiers(placement.tiers);
    if (this.user.anonymous) writeAnonPlacement(placement);
    await this.backend.setPlacement(this.user.uid, placement);
  }

  /** Record a daily problem (SPEC §8.5): solving extends the streak; trying without solving doesn't break today's entry. */
  async recordDaily(key: string, day: string, solved: boolean) {
    const prev: DailyRecord = this.profile.daily ?? { lastSolved: null, streak: 0, best: 0, done: {} };
    if (prev.done[key] === "solved" || (!solved && prev.done[key] === "tried")) return;
    const streak = solved ? nextStreak(prev, day) : prev.streak;
    const recent = Object.entries({ ...prev.done, [key]: solved ? "solved" : "tried" }).slice(-40);
    const daily: DailyRecord = { lastSolved: solved ? day : prev.lastSolved, streak, best: Math.max(prev.best, streak), done: Object.fromEntries(recent) as DailyRecord["done"] };
    this.profile = { ...this.profile, daily };
    this.schedule();
    try {
      await this.backend.saveDaily(this.user, daily);
    } catch {
      // Saved locally in the store; a failed save is retried with the next daily problem.
    }
  }

  /** XP for a resolved question, applying the 30-day repeat rule. Returns the amount granted. */
  async grantQuestion(questionId: string, tier: number, outcome: number): Promise<number> {
    const last = this.profile.questionXpAt[questionId];
    const amount = last && Date.now() - last < XP_REPEAT_WINDOW_MS ? 0 : XP.question(tier, outcome);
    await this.grant(amount, { questionId });
    return amount;
  }
}

let current: { key: string; store: ProfileStore } | null = null;
/** The profile store for the signed-in user, created and loaded on first use. */
export function profileFor(backend: Backend | null, user: User | null): ProfileStore | null {
  if (!backend || !user) return null;
  if (current?.key !== user.uid) {
    current = { key: user.uid, store: new ProfileStore(backend, user) };
    void current.store.load();
  }
  return current.store;
}
