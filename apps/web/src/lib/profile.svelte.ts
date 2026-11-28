import { levelProgress, XP, XP_REPEAT_WINDOW_MS, type LemmaSource, type LevelTier } from "@intellectify/engine";
import { EconomyStore } from "./economy.svelte";
import { celebrate, toast } from "./celebrations.svelte";
import { withRetry } from "./retry";
import { shiftOverrides, storeShiftOverrides, type ShiftMap } from "./keypad";
import { emptyProfile, type Backend, type CourseProgress, type DailyRecord, type DailyState, type Placement, type Profile, type PublicCourse, type User } from "./backend";
import { addProblem, addXp, mergeStats, roll } from "./activity";
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
  /** The saved profile couldn't be loaded: nothing is saved this session (see load()). */
  failed = $state(false);
  /** Why it didn't load (Firestore's error code, or the message), shown in the banner for diagnosis. */
  loadError = $state<string | null>(null);
  /** Set when a grant crosses a level boundary; the layout shows it as a toast. */
  levelUp = $state<LevelUp | null>(null);
  progress = $derived(levelProgress(this.profile.xp));
  /** The Lemma economy (SPEC §13): it earns alongside every XP grant and saves with the batched write. */
  readonly economy: EconomyStore;

  constructor(
    private readonly backend: Backend,
    private user: User,
  ) {
    this.economy = new EconomyStore(backend, user, this);
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
  /** How long to wait before re-reading a profile that looks new. */
  static readonly CONFIRM_NEW_MS = 1500;

  private schedule() {
    this.dirty = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), ProfileStore.PUBLISH_DELAY_MS);
  }

  /** The economy changed: save it with the next batched write. */
  touch() {
    this.schedule();
  }

  /** Save counters and the public mirror now, if anything changed. */
  async flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.dirty || !this.loaded || this.failed) return;
    this.dirty = false;
    const courses = this.pendingCourses;
    const achievements = this.pendingAchievements;
    this.pendingCourses = {};
    this.pendingAchievements = {};
    // XP, the daily record and the counters are saved as whole values, so first take in anything newer
    // already saved (another tab or device, or an earlier session): an out-of-date tab never lowers them.
    try {
      const latest = await this.backend.loadProfile(this.user.uid);
      this.profile = {
        ...this.profile,
        xp: Math.max(this.profile.xp, latest.xp),
        daily: newerDaily(this.profile.daily, latest.daily),
        stats: mergeStats(this.profile.stats, latest.stats),
      };
    } catch {
      // Can't check what's saved: try again later rather than risk overwriting it.
      this.pendingCourses = { ...courses, ...this.pendingCourses };
      this.pendingAchievements = { ...achievements, ...this.pendingAchievements };
      this.dirty = true;
      return;
    }
    const d = this.profile.daily;
    let economy: Awaited<ReturnType<EconomyStore["takeSave"]>> = null;
    try {
      economy = await this.economy.takeSave();
    } catch {
      // The saved economy couldn't be read: it waits for the next save.
    }
    try {
      const banned = await loadBannedWords();
      const eco = this.economy.publicMirror();
      await this.backend.savePublic(this.user, $state.snapshot(this.profile.stats), {
        uid: this.user.uid,
        displayName: safeName(this.user.displayName, banned),
        xp: this.profile.xp,
        stats: $state.snapshot(this.profile.stats),
        daily: d ? { streak: d.streak, best: d.best, last: d.lastSolved } : null,
        achievements,
        courses,
        updatedAt: Date.now(),
        ...(this.user.joined ? { joined: this.user.joined } : {}),
        ...(eco ? { economy: eco } : {}),
      }, economy);
    } catch {
      if (economy) this.economy.restoreSave(economy);
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
      let loaded = await withRetry(() => this.backend.loadProfile(this.user.uid));
      // Looks new (no maths mark, never visited)? Read once more before believing it: treating a real
      // student as new reruns onboarding and grants a second visit bonus.
      if (!loaded.placement?.tiers || !loaded.lastVisitDay) {
        await new Promise((r) => setTimeout(r, ProfileStore.CONFIRM_NEW_MS));
        const again = await this.backend.loadProfile(this.user.uid).catch(() => null);
        if (again && (again.placement?.tiers || again.lastVisitDay || again.xp > loaded.xp)) loaded = again;
      }
      this.profile = loaded;
    } catch (err) {
      this.loadError = (err as { code?: string }).code ?? (err as Error).message ?? null;
      // Not "a new student": the saved profile just didn't load. Save nothing this session, so nothing
      // real is overwritten, and say so (layout banner); a reload tries again.
      this.failed = true;
      this.economy.failed = true;
      this.loaded = true;
      return;
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
    // Only now that the profile has loaded: name, email and last seen.
    void this.backend.markSeen(this.user).catch(() => {});
    void this.economy.load();
  }

  /** Settings › Show rewards (SPEC §13). */
  async setShowRewards(on: boolean) {
    this.profile = { ...this.profile, showRewards: on };
    await this.backend.saveSettings(this.user.uid, { showRewards: on });
  }

  /** Add XP (and its Lemmas, SPEC §13.1), update the level immediately, and persist. */
  async grant(amount: number, extra: { questionId?: string; visitDay?: string } = {}, source: LemmaSource = "other") {
    if (this.failed || (amount <= 0 && !extra.visitDay)) return;
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
    if (amount > 0) this.economy.award(source, amount);
    if (after.level > before.level) {
      const newTier = after.tier.key !== before.tier.key;
      this.levelUp = { level: after.level, tier: after.tier, newTier };
      if (newTier) {
        celebrate({ kind: "tier", level: after.level, tier: after.tier });
        this.economy.onTier(after.tier.key);
      } else toast({ kind: "levelUp", level: after.level, tier: after.tier });
    }
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
    if (this.failed) throw new Error("Your profile didn't load, so this can't be saved. Reload the page.");
    const shiftKeys = shiftOverrides(map);
    storeShiftOverrides(shiftKeys);
    this.profile = { ...this.profile, shiftKeys };
    await this.backend.saveShiftKeys(this.user.uid, shiftKeys);
  }

  /** Save the onboarding placement; new skills start at its tier for their course from now on. */
  async setPlacement(placement: Placement) {
    if (this.failed) throw new Error("Your profile didn't load. Reload the page.");
    this.profile = { ...this.profile, placement };
    setStartTiers(placement.tiers);
    if (this.user.anonymous) writeAnonPlacement(placement);
    await this.backend.setPlacement(this.user.uid, placement);
  }

  /**
   * Record a daily problem (SPEC §8.5): solving extends the streak; trying without solving doesn't break
   * today's entry; after the solution was revealed nothing counts. `bonus` is the daily bonus XP granted
   * (SPEC §12.4: 30 + 10 × tier on the first solve of each day's problem); `solved` whether it counted as a solve.
   */
  async recordDaily(key: string, day: string, solved: boolean, tier = 0): Promise<{ bonus: number; solved: boolean }> {
    if (this.failed) return { bonus: 0, solved: false };
    const prev = await this.latestDaily();
    if (prev.done[key] === "revealed") return { bonus: 0, solved: false };
    if (prev.done[key] === "solved" || (!solved && prev.done[key] === "tried")) return { bonus: 0, solved };
    const streak = solved ? nextStreak(prev, day) : prev.streak;
    const firstOfDay = solved && prev.lastSolved !== day && !Object.entries(prev.done).some(([k, v]) => v === "solved" && k.startsWith(`${day}:`));
    const recent = Object.entries({ ...prev.done, [key]: solved ? "solved" : "tried" }).slice(-40);
    const daily: DailyRecord = { lastSolved: solved ? day : prev.lastSolved, streak, best: Math.max(prev.best, streak), done: Object.fromEntries(recent) as DailyRecord["done"] };
    this.profile = { ...this.profile, daily };
    if (solved) this.economy.onDailySolved(firstOfDay, fullWeek(daily, day));
    this.schedule();
    try {
      await this.backend.saveDaily(this.user, daily);
    } catch {
      // Saved locally in the store; a failed save is retried with the next daily problem.
    }
    if (!solved || !tier) return { bonus: 0, solved };
    const bonus = XP.daily(tier);
    await this.grant(bonus, {}, "daily");
    return { bonus, solved };
  }

  /**
   * The solution of a daily problem was shown before it was solved (SPEC §8.5): that day's problem can no
   * longer count as solved. Does nothing once it's solved.
   */
  async revealDaily(key: string): Promise<void> {
    if (this.failed) return;
    const prev = await this.latestDaily();
    if (prev.done[key] === "solved" || prev.done[key] === "revealed") return;
    const recent = Object.entries({ ...prev.done, [key]: "revealed" }).slice(-40);
    const daily: DailyRecord = { ...prev, done: Object.fromEntries(recent) as DailyRecord["done"] };
    this.profile = { ...this.profile, daily };
    this.schedule();
    try {
      await this.backend.saveDaily(this.user, daily);
    } catch {
      // Saved locally in the store; a failed save is retried with the next daily problem.
    }
  }

  /** The daily record is saved whole: start from the latest saved one, not this tab's copy. */
  private async latestDaily(): Promise<DailyRecord> {
    const latest = await this.backend.loadProfile(this.user.uid).catch(() => null);
    if (latest) this.profile = { ...this.profile, daily: newerDaily(this.profile.daily, latest.daily) };
    return this.profile.daily ?? { lastSolved: null, streak: 0, best: 0, done: {} };
  }

  /**
   * XP for a marked written answer (SPEC §12.4: 24 × tier × rubric score). A proof already written once
   * earns a fifth of that, however long ago: it's much easier the second time.
   */
  async grantWritten(questionId: string, tier: number, score: number): Promise<number> {
    const full = XP.freeResponse(tier, score);
    const amount = this.profile.questionXpAt[questionId] ? Math.round(full * WRITTEN_REPEAT_RATE) : full;
    await this.grant(amount, { questionId }, "question");
    return amount;
  }

  /** XP for reading a skill's tutorial, the first time only (SPEC §12.4). */
  async grantTutorial(course: string, skill: string): Promise<number> {
    const key = `tutorial:${course}:${skill}`;
    if (!this.loaded || this.profile.questionXpAt[key]) return 0;
    await this.grant(XP.tutorialFirstRead, { questionId: key });
    return XP.tutorialFirstRead;
  }

  /** XP for a discussion post or comment (SPEC §12.4: 20, at most 3 a Perth day). */
  async grantPost(): Promise<number> {
    const day = perthDay();
    const n = [1, 2, 3].find((i) => !this.profile.questionXpAt[`post:${day}:${i}`]);
    if (!this.loaded || !n) return 0;
    await this.grant(XP.discussionPost, { questionId: `post:${day}:${n}` });
    return XP.discussionPost;
  }

  /** XP for a resolved question, applying the 30-day repeat rule. Returns the amount granted. */
  async grantQuestion(questionId: string, tier: number, outcome: number): Promise<number> {
    const last = this.profile.questionXpAt[questionId];
    const amount = last && Date.now() - last < XP_REPEAT_WINDOW_MS ? 0 : XP.question(tier, outcome);
    await this.grant(amount, { questionId }, "question");
    return amount;
  }
}

/** The daily record with the later solve; the "done" lists combine. */
function newerDaily(a: DailyRecord | null, b: DailyRecord | null): DailyRecord | null {
  if (!a || !b) return a ?? b;
  const later = (b.lastSolved ?? "") > (a.lastSolved ?? "") ? b : a;
  // Per problem the stronger state wins: solved, then revealed (a solve no longer counts), then tried.
  const rank = (s: DailyState | undefined) => (s === "solved" ? 3 : s === "revealed" ? 2 : s === "tried" ? 1 : 0);
  const merged: DailyRecord["done"] = { ...b.done, ...a.done };
  for (const [k, v] of Object.entries(b.done)) if (rank(v) > rank(merged[k])) merged[k] = v;
  const done = Object.fromEntries(Object.entries(merged).slice(-40)) as DailyRecord["done"];
  return { ...later, best: Math.max(a.best, b.best), done };
}

/** The Monday of `day`'s Mon–Sun week when every day of it has a solved daily problem (a Full Week, P8). */
export function fullWeek(daily: DailyRecord, day: string): string | null {
  const at = new Date(`${day}T00:00:00Z`);
  const monday = new Date(at.getTime() - ((at.getUTCDay() + 6) % 7) * 86_400_000);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86_400_000).toISOString().slice(0, 10));
  const solved = new Set(Object.entries(daily.done).filter(([, v]) => v === "solved").map(([k]) => k.split(":")[0]));
  return days.every((d) => solved.has(d)) ? days[0]! : null;
}

/** A repeated written answer earns this share of its XP (SPEC §12.4). */
export const WRITTEN_REPEAT_RATE = 0.2;

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

/** The signed-in student's economy, if a profile store exists. */
export const currentEconomy = (): EconomyStore | null => current?.store.economy ?? null;
/** The signed-in student's profile store, if one exists. */
export const currentProfile = (): ProfileStore | null => current?.store ?? null;
