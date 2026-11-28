/**
 * Reactive achievements for one course: loads definitions and the student's record, checks rules after
 * each event, grants XP and queues toasts (SPEC §12.1, §12.4).
 */
import { withRetry } from "./retry";
import type { AchievementT } from "@intellectify/content";
import { XP } from "@intellectify/engine";
import { emptyStats, evaluate, onChallenge, onQuestion, onQuiz, onReports, type AchievementStats, type QuestionEvent } from "./achievements";
import type { Backend, User } from "./backend";
import type { CourseBundle } from "./content";
import { computeRollups } from "./practice";
import type { ProfileStore } from "./profile.svelte";
import type { CourseProgressStore } from "./session.svelte";
import { toast } from "./celebrations.svelte";
import { currentEconomy } from "./profile.svelte";

let defsPromise: Promise<AchievementT[]> | null = null;
export const loadAchievementDefs = (f: typeof fetch = fetch) => (defsPromise ??= f("/content/achievements.json").then((r) => (r.ok ? r.json() : [])));

/** Newly earned achievements waiting to be shown, oldest first (shared by every course store). */
export const achievementToasts = $state<AchievementT[]>([]);

export class AchievementsStore {
  stats = $state<AchievementStats>(emptyStats());
  earned = $state<Record<string, number>>({});
  defs = $state<AchievementT[]>([]);
  loaded = $state(false);
  /** The saved record couldn't be loaded: nothing is evaluated or saved this session (no empty overwrite). */
  failed = $state(false);

  constructor(
    private backend: Backend,
    private user: User,
    private course: CourseBundle,
  ) {}

  private loading: Promise<void> | null = null;

  /** Load once; every event waits for this, so it never evaluates against empty stats. */
  load(): Promise<void> {
    return (this.loading ??= this.fetchRecord());
  }

  private async fetchRecord() {
    let rec: Awaited<ReturnType<Backend["loadAchievements"]>> = null;
    const defs = await loadAchievementDefs();
    try {
      rec = await withRetry(() => this.backend.loadAchievements(this.user.uid, this.course.id));
    } catch {
      this.failed = true;
    }
    this.defs = defs;
    if (rec) {
      this.stats = { ...emptyStats(), ...(rec.stats as Partial<AchievementStats>) };
      this.earned = rec.earned ?? {};
    }
    this.loaded = true;
    this.syncEconomy();
  }

  private async settle(stats: AchievementStats, store: CourseProgressStore, profile: ProfileStore | null) {
    if (this.failed) return [];
    const now = Date.now();
    const { stats: next, newly } = evaluate(this.defs, stats, { course: this.course, progress: store.progress, rollups: computeRollups(this.course, store.progress), now }, this.earned);
    this.stats = next;
    if (newly.length) {
      this.earned = { ...this.earned, ...Object.fromEntries(newly.map((a) => [a.id, now])) };
      achievementToasts.push(...newly);
      for (const a of newly) toast({ kind: "achievement", achievement: a });
      this.syncEconomy();
      if (profile) await profile.grant(newly.reduce((t, a) => t + XP.achievement(a.points), 0), {}, "achievement");
      const ids = Object.keys(this.earned);
      profile?.publishAchievements(this.course.id, ids, this.defs.filter((a) => ids.includes(a.id)).reduce((t, a) => t + a.points, 0));
    }
    await this.backend.saveAchievements(this.user.uid, this.course.id, { stats: this.snap(), earned: $state.snapshot(this.earned) }).catch(() => {});
    return newly;
  }

  /** Earned achievements feed the economy: the corollary, titles and their packs (SPEC §13.5, §13.7, §13.9). */
  private syncEconomy() {
    if (this.failed) return;
    const earned = this.defs.filter((d) => d.id in this.earned);
    currentEconomy()?.onAchievements(this.course.id, earned);
  }

  /** A plain copy of the stats (snapshot widens tuple types, so cast back). */
  private snap = () => $state.snapshot(this.stats) as AchievementStats;

  /** `then` applies a further event in the same save (e.g. a written answer's mark). */
  async question(e: QuestionEvent, store: CourseProgressStore, profile: ProfileStore | null, then: (s: AchievementStats) => AchievementStats = (x) => x) {
    await this.load();
    return this.settle(then(onQuestion(this.snap(), e)), store, profile);
  }
  async quiz(e: Parameters<typeof onQuiz>[1], store: CourseProgressStore, profile: ProfileStore | null) {
    await this.load();
    return this.settle(onQuiz(this.snap(), e), store, profile);
  }
  /** Any other event (daily, marked, appeal, post, flag): `update` turns the old stats into new ones. */
  async event(update: (s: AchievementStats) => AchievementStats, store: CourseProgressStore, profile: ProfileStore | null) {
    await this.load();
    return this.settle(update(this.snap()), store, profile);
  }
  /** Newly confirmed error reports earn XP (once each) and their achievements. Checked once per session. */
  async syncReports(store: CourseProgressStore, profile: ProfileStore | null) {
    await this.load();
    if (this.failed) return;
    const confirmed = await this.backend.confirmedReports(this.user.uid, this.course.id).catch(() => null);
    const fresh = confirmed ? confirmed.length - (this.stats.counts.reports ?? 0) : 0;
    if (!confirmed || fresh <= 0) return;
    if (profile) await profile.grant(fresh * XP.confirmedReport);
    await this.settle(onReports(this.snap(), confirmed), store, profile);
  }
  async challenge(e: Parameters<typeof onChallenge>[1], store: CourseProgressStore, profile: ProfileStore | null) {
    await this.load();
    return this.settle(onChallenge(this.snap(), e), store, profile);
  }
}

const stores = new Map<string, AchievementsStore>();
export function achievementsFor(backend: Backend | null, user: User | null, course: CourseBundle): AchievementsStore | null {
  if (!backend || !user) return null;
  const key = `${user.uid}:${course.id}`;
  let s = stores.get(key);
  if (!s) {
    s = new AchievementsStore(backend, user, course);
    stores.set(key, s);
    void s.load();
  }
  return s;
}
