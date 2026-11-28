/**
 * The Lemma economy for the signed-in student (SPEC §13): earning alongside XP, Research, purchases, packs,
 * Axioms, Conjectures and cosmetics. Formulas are in @intellectify/engine (economy.ts); this store holds the
 * state, saves it with the profile's batched write and keeps the celebration queue fed.
 */
import {
  axiomsReached,
  balanceOf,
  buyCheapest,
  buyCosmetic,
  buyInstitute,
  buyPacks,
  buyTheorem,
  collectedCount,
  emptyEconomy,
  eraComplete,
  freePackEra,
  grantPacks,
  HOUR_MS,
  latestEra,
  LEVEL_TIERS,
  lemmaAward,
  mergeEconomy,
  openPack,
  proveAxioms,
  proveConjecture,
  researchDue,
  researchRate,
  setStaff,
  staffSlots,
  tierPacks,
  timeWarp,
  type AchievementTier,
  type AwardPart,
  type AxiomDef,
  type BuyAmount,
  type CardDef,
  type ConjectureDef,
  type CosmeticDef,
  type ColorDef,
  type CosmeticStyle,
  type CosmeticSlot,
  type EconomyConfig,
  type EconomyContext,
  type EconomyState,
  type LemmaSource,
  type PackResult,
  type TheoremId,
} from "@intellectify/engine";
import { withRetry } from "./retry";
import type { Backend, EconomySave, PublicEconomy, User } from "./backend";
import type { ProfileStore } from "./profile.svelte";
import { celebrate } from "./celebrations.svelte";

/** A card as the app gets it (content/cards, built into economy.json). */
export interface Card extends CardDef {
  flourished?: number;
  circa?: ("born" | "died")[];
  wikidata?: string;
  portrait: { file: string; source: string; author: string; license: string } | null;
  related?: string[];
  blurb: string;
}
export interface EconomyData {
  config: EconomyConfig;
  cards: Card[];
}

let dataPromise: Promise<EconomyData> | null = null;
export const loadEconomyData = (f: typeof fetch = fetch): Promise<EconomyData> =>
  (dataPromise ??= f("/content/economy.json").then(async (r) => {
    if (!r.ok) throw new Error(`economy.json: ${r.status}`);
    const data = (await r.json()) as EconomyData;
    cosmetics.map = Object.fromEntries([...data.config.shop, ...data.config.axioms.list.flatMap((a) => a.cosmetics)].map((c) => [c.id, c]));
    cosmetics.colors = Object.fromEntries((data.config.colors ?? []).map((c) => [c.id, c]));
    return data;
  }));

/** Every shop and Axiom cosmetic by id, once economy.json has loaded: how each one is drawn. */
export const cosmetics = $state<{ map: Record<string, CosmeticDef>; colors: Record<string, ColorDef> }>({ map: {}, colors: {} });
export const styleOf = (id: string | null | undefined): CosmeticStyle | null => (id ? (cosmetics.map[id]?.style ?? null) : null);

export const portraitUrl = (c: Pick<Card, "portrait">) => (c.portrait ? `/content/cards/${c.portrait.file}` : null);

/** Listeners told when the economy changes (economy achievements re-check then). */
const changeListeners = new Set<() => void>();
export const onEconomyChange = (fn: () => void) => changeListeners.add(fn);

/** What the answer just shown earned in Lemmas (SPEC §13.11 Result row). */
export interface AnswerLemmas {
  parts: AwardPart[];
  warp: { hours: number; lemmas: number } | null;
}
export const answerLemmas = $state<{ current: AnswerLemmas | null }>({ current: null });
/** A new answer is being recorded: its Lemmas start from zero. */
export const beginAnswer = () => (answerLemmas.current = { parts: [], warp: null });

const tierIndex = (key: string) => LEVEL_TIERS.findIndex((t) => t.key === key);

export class EconomyStore {
  state = $state<EconomyState>(emptyEconomy());
  data = $state<EconomyData | null>(null);
  loaded = $state(false);
  /** The saved economy couldn't be loaded: nothing is saved this session. */
  failed = $state(false);
  /** Research per day, all multipliers included. */
  rate = $derived(this.data && this.loaded ? researchRate(this.data.config, this.state, this.cardMap, this.ctx) : 0);
  balance = $derived(balanceOf(this.state));
  /** Snapshot at the start of this hub visit (SPEC §13.11 Since last visit). */
  visitStart = $state<EconomyState["lastVisit"]>(null);

  /** Earned and spent since the last successful save; they go out as increments. */
  private pendingEarned = 0;
  private pendingSpent = 0;
  /** Awards and events that arrived before the economy loaded, applied once it has. */
  private queued: (() => void)[] = [];
  /** Run now if loaded, else once loaded (never if the load failed). */
  private whenLoaded(fn: () => void) {
    if (this.failed) return;
    if (this.loaded && this.data) fn();
    else this.queued.push(fn);
  }
  private researchTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly backend: Backend,
    private readonly user: User,
    private readonly profile: ProfileStore,
  ) {}

  get config(): EconomyConfig | null {
    return this.data?.config ?? null;
  }
  get cardMap(): Map<string, Card> {
    if (this.#cardsFrom !== this.data) {
      this.#cardsFrom = this.data;
      this.#cardMap = new Map((this.data?.cards ?? []).map((c) => [c.id, c]));
    }
    return this.#cardMap;
  }
  #cardMap = new Map<string, Card>();
  #cardsFrom: EconomyData | null = null;
  cardsOf(era: string): Card[] {
    return (this.data?.cards ?? []).filter((c) => c.era === era);
  }
  get released(): Set<string> {
    return new Set((this.data?.cards ?? []).map((c) => c.era));
  }
  get ctx(): EconomyContext {
    const cfg = this.data?.config;
    return {
      questions: this.profile.profile.stats?.problems ?? 0,
      dailyDays: this.state.dailyDays,
      tiers: Math.max(0, tierIndex(this.profile.progress.tier.key)),
      eraSets: cfg ? cfg.eras.filter((e) => eraComplete(this.state, this.cardsOf(e.id))).length : 0,
    };
  }
  /** Settings › Show rewards (SPEC §13): the economy keeps running, but nothing of it shows. */
  get visible(): boolean {
    return this.profile.profile.showRewards !== false;
  }

  async load() {
    try {
      this.data = await loadEconomyData();
      const saved = await withRetry(() => this.backend.loadEconomy(this.user.uid));
      this.state = saved ?? emptyEconomy();
    } catch {
      this.failed = true;
      this.loaded = true;
      return;
    }
    this.loaded = true;
    // Packs for level tiers already reached before the economy existed count once.
    const idx = tierIndex(this.profile.progress.tier.key);
    if (idx > this.state.tierReached) this.apply(tierPacks(this.data.config, this.state, idx, this.released).state);
    for (const fn of this.queued.splice(0)) fn();
    await this.creditResearch();
    // Crediting runs on load; while the app stays open it catches up every few minutes too.
    if (typeof window !== "undefined") this.researchTimer = setInterval(() => void this.creditResearch(), 10 * 60_000);
  }

  /** Research due since it was last credited, in whole hours of server time (SPEC §13.3). */
  async creditResearch() {
    if (this.failed || !this.loaded || !this.data) return;
    const cfg = this.data.config;
    try {
      let credited = { hours: 0, lemmas: 0 };
      const saved = await this.backend.creditResearch(this.user.uid, (s, now) => {
        if (s.researchCreditedAt === null) return { lemmas: 0, hours: 0, creditedAt: now };
        const due = researchDue(s, now);
        // The rate as it is now, with this tab's unsaved purchases.
        const rate = researchRate(cfg, mergeEconomy(this.state, s), this.cardMap, this.ctx);
        credited = { hours: due.hours, lemmas: Math.floor((rate / 24) * due.hours) };
        return { ...credited, creditedAt: due.creditedAt };
      });
      // The transaction wrote lemmasEarned directly: take it in without counting it as pending.
      this.state = { ...this.state, lemmasEarned: this.state.lemmasEarned + credited.lemmas, researchHours: this.state.researchHours + credited.hours, researchCreditedAt: saved.researchCreditedAt };
    } catch {
      /* offline or refused: tried again later; being away never loses anything */
    }
  }

  /** Replace the state, counting what was earned or spent as pending, and schedule the batched save. */
  private apply(next: EconomyState) {
    this.pendingEarned += Math.max(0, next.lemmasEarned - this.state.lemmasEarned);
    this.pendingSpent += Math.max(0, next.lemmasSpent - this.state.lemmasSpent);
    this.state = next;
    if (!this.failed) {
      this.profile.touch();
      for (const fn of changeListeners) fn();
    }
  }

  /** Counts and feats for the economy achievements (SPEC §12.1, §13). */
  achievementStats(): { stats: Record<string, number>; feats: string[] } | null {
    if (!this.loaded || !this.data) return null;
    const cfg = this.data.config;
    const s = this.state;
    const held = Object.entries(s.cards).filter(([, c]) => c.n > 0);
    const diamondEras = new Set(held.map(([id]) => this.cardMap.get(id)).filter((c) => c?.rarity === "diamond").map((c) => c!.era));
    return {
      stats: {
        packsOpened: Object.values(s.packs).reduce((t, p) => t + p.opened, 0),
        institutes: Object.values(s.institutes).reduce((t, n) => t + n, 0),
        theoremLevels: Object.values(s.theorems).reduce((t, n) => t + (n ?? 0), 0),
        fullStaff: cfg.eras.filter((e) => staffSlots(cfg, s.institutes[e.id] ?? 0) >= cfg.staff.maxSlots && (s.staff[e.id] ?? []).slice(0, cfg.staff.maxSlots).filter(Boolean).length >= cfg.staff.maxSlots).length,
        foils: held.filter(([, c]) => c.foil).length,
        cards: held.length,
        sets: cfg.eras.filter((e) => eraComplete(s, this.cardsOf(e.id))).length,
        warps: s.warps ?? 0,
        diamondEras: diamondEras.size,
      },
      feats: s.feats ?? [],
    };
  }

  /**
   * Lemmas for an XP award (SPEC §13.1), plus the Time Warp it may fire (§13.3). Called by the profile for
   * every grant; awards before the economy has loaded wait for it.
   */
  award(source: LemmaSource, xp: number): AwardPart | null {
    if (xp <= 0 || this.failed) return null;
    if (!this.loaded || !this.data) {
      this.queued.push(() => void this.award(source, xp));
      return null;
    }
    const cfg = this.data.config;
    const part = lemmaAward(cfg, this.state, source, xp, this.ctx);
    const warp = timeWarp(cfg, this.state.warpXp, xp);
    const warpLemmas = warp.warps ? Math.floor((this.rate / 24) * cfg.timeWarp.hours * warp.warps) : 0;
    this.apply({
      ...this.state,
      lemmasEarned: this.state.lemmasEarned + part.lemmas + warpLemmas,
      warpXp: warp.warpXp,
      warps: (this.state.warps ?? 0) + warp.warps,
      researchHours: this.state.researchHours + cfg.timeWarp.hours * warp.warps,
    });
    const row = answerLemmas.current;
    if (row) {
      row.parts.push(part);
      if (warp.warps) row.warp = { hours: (row.warp?.hours ?? 0) + cfg.timeWarp.hours * warp.warps, lemmas: (row.warp?.lemmas ?? 0) + warpLemmas };
    }
    return part;
  }

  /** A level tier was reached (SPEC §13.7): its packs, in its era. */
  onTier(key: string) {
    this.whenLoaded(() => {
      const idx = tierIndex(key);
      if (idx > this.state.tierReached) this.apply(tierPacks(this.data!.config, this.state, idx, this.released).state);
    });
  }

  /**
   * A course's earned achievements (on load, and after each new one): the corollary, titles and, for any
   * not counted yet (earned before the economy too), their packs (SPEC §13.5, §13.7, §13.9).
   */
  onAchievements(course: string, earned: { id: string; tier: string; points: number; title?: string }[]) {
    this.whenLoaded(() => this.syncAchievements(course, earned));
  }
  private syncAchievements(course: string, earned: { id: string; tier: string; points: number; title?: string }[]) {
    const cfg = this.data!.config;
    let s = this.state;
    const achievements = { ...s.achievements };
    const titles = new Set(s.titles);
    for (const a of earned) {
      const key = `${course}:${a.id}`;
      const isNew = !(key in achievements);
      achievements[key] = a.points;
      if (a.title) titles.add(a.title);
      if (isNew) {
        const rule = cfg.packs.achievement[a.tier as AchievementTier];
        if (rule) s = grantPacks(s, freePackEra(cfg, s, rule.era, this.released), rule.packs);
      }
    }
    if (Object.keys(achievements).length === Object.keys(s.achievements).length && titles.size === s.titles.length && s === this.state && earned.every((a) => s.achievements[`${course}:${a.id}`] === a.points)) return;
    this.apply({ ...s, achievements, titles: [...titles] });
  }

  /** A Section Challenge finished (SPEC §13.7): 1 pack of the latest unlocked era. */
  onChallenge() {
    this.whenLoaded(() => this.apply(grantPacks(this.state, latestEra(this.data!.config, this.state, this.released), this.data!.config.packs.challenge)));
  }

  /** A daily problem solved on a new day (Geometric Series counts days), and a Full Week's pack. */
  onDailySolved(firstOfDay: boolean, fullWeekMonday: string | null) {
    this.whenLoaded(() => this.dailySolved(firstOfDay, fullWeekMonday));
  }
  private dailySolved(firstOfDay: boolean, fullWeekMonday: string | null) {
    if (!this.data) return;
    let s = this.state;
    if (firstOfDay) s = { ...s, dailyDays: s.dailyDays + 1 };
    if (fullWeekMonday && !s.fullWeeks.includes(fullWeekMonday)) {
      s = grantPacks({ ...s, fullWeeks: [...s.fullWeeks, fullWeekMonday].slice(-60) }, latestEra(this.data.config, s, this.released), this.data.config.packs.fullWeek);
    }
    if (s !== this.state) this.apply(s);
  }

  /* ───────────── Hub actions (SPEC §13.11). No confirmations, no undo. ───────────── */

  buyTheorem(id: TheoremId, amount: BuyAmount) {
    if (!this.data) return 0;
    const r = buyTheorem(this.data.config, this.state, id, amount);
    if (r.count) this.apply(r.state);
    return r.count;
  }
  buyInstitute(era: string, amount: BuyAmount) {
    if (!this.data) return 0;
    const r = buyInstitute(this.data.config, this.state, era, amount);
    if (r.count) this.apply(r.state);
    return r.count;
  }
  buyMax(tab: "theorems" | "research") {
    if (!this.data) return { count: 0, cost: 0 };
    const r = buyCheapest(this.data.config, this.state, tab);
    if (r.count) this.apply(r.state);
    return r;
  }
  buyPacks(era: string, n: number) {
    if (!this.data) return false;
    const e = this.data.config.eras.find((x) => x.id === era);
    if (!e || e.packPrice * n > this.balance) return false;
    this.apply(buyPacks(this.data.config, this.state, era, n));
    return true;
  }
  /** Open up to `n` packs of an era; returns each pack's cards. */
  openPacks(era: string, n: number): PackResult[] {
    if (!this.data) return [];
    const cards = this.cardsOf(era);
    const out: PackResult[] = [];
    let s = this.state;
    for (let i = 0; i < n; i++) {
      const p = s.packs[era];
      if (!p || p.granted - p.opened <= 0) break;
      const r = openPack(this.data.config, s, this.user.uid, era, cards);
      s = r.state;
      out.push(r.result);
    }
    if (out.some((r) => r.cards.filter((c) => c.rarity === "diamond").length >= 2) && !(s.feats ?? []).includes("luckyDraw")) s = { ...s, feats: [...(s.feats ?? []), "luckyDraw"] };
    if (out.length) this.apply(s);
    return out;
  }
  /** Prove every reached Axiom (free). The celebrations queue plays them. */
  proveAxioms(): AxiomDef[] {
    if (!this.data) return [];
    const r = proveAxioms(this.data.config, this.state, Date.now());
    if (!r.proven.length) return [];
    this.apply(r.state);
    celebrate({ kind: "axiom", axioms: r.proven });
    return r.proven;
  }
  proveConjecture(): ConjectureDef | null {
    if (!this.data) return null;
    const next = proveConjecture(this.data.config, this.state, Date.now());
    if (!next) return null;
    const c = this.data.config.conjectures.list[this.state.conjectures]!;
    const before = this.rate;
    this.apply(next);
    celebrate({ kind: "conjecture", conjecture: c, index: next.conjectures - 1, rateBefore: before, rateAfter: researchRate(this.data.config, next, this.cardMap, this.ctx) });
    return c;
  }
  buyCosmetic(id: string) {
    if (!this.data) return false;
    const next = buyCosmetic(this.data.config, this.state, id);
    if (!next) return false;
    this.apply(next);
    return true;
  }
  /** Equip a cosmetic or title (null = Default). */
  equip(slot: CosmeticSlot, id: string | null) {
    this.apply({ ...this.state, equipped: { ...this.state.equipped, [slot]: id } });
  }
  setShowcase(ids: string[]) {
    this.apply({ ...this.state, equipped: { ...this.state.equipped, showcase: ids.slice(0, 3) } });
  }
  setStaff(era: string, slot: number, card: string | null) {
    if (!this.data) return;
    this.apply(setStaff(this.data.config, this.state, era, slot, card));
  }

  /** Start a hub visit: remember where the last one ended, for Since last visit. */
  enterHub() {
    this.visitStart = this.state.lastVisit;
    void this.creditResearch();
  }
  /** End a hub visit (leaving it, or hiding the page). */
  leaveHub() {
    this.apply({ ...this.state, lastVisit: { balance: this.balance, earned: this.state.lemmasEarned, researchHours: this.state.researchHours } });
  }

  /* ───────────── Ownership (SPEC §13.8–13.9) ───────────── */

  /** Cosmetics the student can equip in a slot: bought, from Axioms, or frames from completed sets. */
  ownedIn(slot: CosmeticSlot): string[] {
    if (!this.data) return [];
    if (slot === "title") return this.state.titles;
    if (slot === "frame") return this.data.config.eras.filter((e) => eraComplete(this.state, this.cardsOf(e.id))).map((e) => `frame-${e.id}`);
    const ids = [...this.data.config.shop, ...this.data.config.axioms.list.flatMap((a) => a.cosmetics)].filter((c) => c.slot === slot).map((c) => c.id);
    return ids.filter((id) => this.state.owned.includes(id));
  }

  /* ───────────── Saving ───────────── */

  /**
   * What the next batched save writes, after taking in the latest saved copy (another tab or device) so
   * nothing is lowered. Null when there's nothing to save or it can't be checked.
   */
  async takeSave(): Promise<EconomySave | null> {
    if (!this.loaded || this.failed) return null;
    let saved: EconomyState | null;
    try {
      saved = await this.backend.loadEconomy(this.user.uid);
    } catch {
      throw new Error("economy: couldn't read the saved copy");
    }
    const earned = this.pendingEarned;
    const spent = this.pendingSpent;
    if (saved) {
      const merged = mergeEconomy(this.state, saved);
      this.state = { ...merged, lemmasEarned: saved.lemmasEarned + earned, lemmasSpent: saved.lemmasSpent + spent, researchCreditedAt: saved.researchCreditedAt ?? this.state.researchCreditedAt };
    }
    this.pendingEarned = 0;
    this.pendingSpent = 0;
    const { lemmasEarned: _e, lemmasSpent: _s, researchCreditedAt: _r, ...fields } = $state.snapshot(this.state) as EconomyState;
    return { fields, earned, spent };
  }
  /** The save failed: keep the increments for the next one. */
  restoreSave(s: EconomySave) {
    this.pendingEarned += s.earned;
    this.pendingSpent += s.spent;
  }

  /** The public mirror's economy (SPEC §13.10). */
  publicMirror(): PublicEconomy | null {
    if (!this.loaded || this.failed) return null;
    const e = this.state.equipped;
    return {
      equipped: { title: e.title, frame: e.frame, banner: e.banner, nameOrnament: e.nameOrnament, showcase: e.showcase },
      cards: Object.fromEntries(Object.entries(this.state.cards).filter(([, c]) => c.n > 0).map(([id, c]) => [id, c.foil ? 1 : 0])),
      lemmasEarned: this.state.lemmasEarned,
      axiomsProven: this.state.axiomsProven,
    };
  }

  get collected() {
    return collectedCount(this.state);
  }
  get reached() {
    return this.data ? axiomsReached(this.data.config, this.state) : 0;
  }
  /** An Axiom is reached but not proven: the header's pip (SPEC §13.11). */
  get toProve() {
    return Math.max(0, this.reached - this.state.axiomsProven);
  }

  dispose() {
    if (this.researchTimer) clearInterval(this.researchTimer);
  }
}

/** Hours a duration in ms is, for "Research 14 h". */
export const hoursOf = (ms: number) => Math.floor(ms / HOUR_MS);
