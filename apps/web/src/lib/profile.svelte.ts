import { levelProgress, XP, XP_REPEAT_WINDOW_MS, type LevelTier } from "@intellectify/engine";
import { emptyProfile, type Backend, type Placement, type Profile, type User } from "./backend";
import { setStartTier } from "./practice";

/** Today's date in Perth (YYYY-MM-DD): days roll over at local midnight for WA students. */
export const perthDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth" }).format(d);

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
    private readonly user: User,
  ) {}

  async load() {
    try {
      this.profile = await this.backend.loadProfile(this.user.uid);
    } catch {
      // Offline or blocked: start from zero locally; grants still try to save.
    }
    if (this.profile.placement) setStartTier(this.profile.placement.tier);
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
    };
    const after = levelProgress(this.profile.xp);
    if (after.level > before.level) this.levelUp = { level: after.level, tier: after.tier, newTier: after.tier.key !== before.tier.key };
    try {
      await this.backend.grantXp(this.user, { amount, ...extra });
    } catch {
      // A failed save loses this grant on reload; practice itself is unaffected.
    }
  }

  /** Save the onboarding placement; new skills start at its tier from now on. */
  async setPlacement(placement: Placement) {
    this.profile = { ...this.profile, placement };
    setStartTier(placement.tier);
    await this.backend.setPlacement(this.user.uid, placement);
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
