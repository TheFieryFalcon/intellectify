/**
 * The Lemma economy (docs/SPEC.md §13): pure functions, unit-tested like level.ts.
 *
 * Values (theorems, institutes, Conjectures, Axioms, packs, shop) live in content/economy.yaml and arrive
 * here as an `EconomyConfig`. Nothing in this file touches θ, ranks, gates, marking or selection.
 */
import { LEVEL_TIERS } from "./level.js";

/* ───────────────────────── Types ───────────────────────── */

export type Rarity = "silver" | "gold" | "platinum" | "diamond";
/** Highest first: the order of grids, shelves and pickers. */
export const RARITIES: readonly Rarity[] = ["diamond", "platinum", "gold", "silver"];
export const RARITY_NAME: Record<Rarity, string> = { silver: "Silver", gold: "Gold", platinum: "Platinum", diamond: "Diamond" };

export type TheoremId =
  | "successor"
  | "distributive"
  | "geometric"
  | "ivt"
  | "euler"
  | "binomial"
  | "harmonic"
  | "pigeonhole"
  | "lln"
  | "golden"
  | "recurrence";

export type CosmeticSlot = "keypad" | "celebration" | "banner" | "nodeTheme" | "frame" | "title" | "lemmaIcon" | "nameOrnament";
export const COSMETIC_SLOTS: readonly CosmeticSlot[] = ["keypad", "celebration", "banner", "nodeTheme", "frame", "title", "lemmaIcon", "nameOrnament"];

export interface TheoremDef {
  id: TheoremId;
  name: string;
  /** One line of KaTeX. */
  statement: string;
  /** What it boosts, as a bare label ("Resolved questions"). */
  boosts: string;
  base: number;
  growth: number;
  requires: { theorem: TheoremId; level: number } | null;
  maxLevel?: number;
  /** Set while the boosted feature doesn't exist yet (Binomial Theorem before games). */
  unavailable?: boolean;
  /** Position on the hand-placed proof tree (SPEC §13.11), in the tree's 1000 × 640 coordinate space. */
  x: number;
  y: number;
}

export interface EraDef {
  id: string;
  name: string;
  years: string;
  institute: { id: string; name: string; base: number; output: number };
  packPrice: number;
}

export interface CosmeticDef {
  id: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  /** Shop items only. */
  price?: number;
}

export interface AxiomDef {
  id: string;
  name: string;
  /** Lifetime Lemmas at which it's reached. */
  at: number;
  hours: number;
  group: "zfc" | "large";
  statement: string;
  cosmetic: CosmeticDef;
  title: string | null;
}

export interface ConjectureDef {
  id: string;
  name: string;
  statement: string;
  /** "1852, Chebyshev"; null for the two open problems. */
  proved: string | null;
}

export type TierKey = (typeof LEVEL_TIERS)[number]["key"];
export type AchievementTier = "platinum" | "diamond" | "ruby" | "tanzanite" | "vibranium" | "solarium" | "antimatter";

export interface EconomyConfig {
  theorems: TheoremDef[];
  eras: EraDef[];
  institutes: { growth: number };
  staff: { boost: Record<Rarity, number>; foilFactor: number; copiesPerSlot: number; maxSlots: number };
  timeWarp: { xp: number; hours: number };
  conjectures: { first: number; step: number; multiplier: number; list: ConjectureDef[] };
  axioms: { bonus: number; list: AxiomDef[] };
  corollaries: { perAchievementPoint: number; perLevelTier: number; perEraSet: number };
  packs: {
    size: number;
    odds: { common: Record<Rarity, number>; last: Record<Rarity, number> };
    pity: number;
    pityStep: number;
    pityMin: number;
    foilOneIn: number;
    duplicate: Record<Rarity, number>;
    levelTier: Partial<Record<TierKey, { packs: number; era: number }>>;
    achievement: Record<AchievementTier, { packs: number; era: number }>;
    challenge: number;
    fullWeek: number;
  };
  shop: CosmeticDef[];
  /** Hub tabs: lifetime Lemmas for Research, Research per day for Conjectures (SPEC §13.11). */
  tabs: { research: number; conjecturesRate: number };
}

export interface CardDef {
  id: string;
  name: string;
  era: string;
  rarity: Rarity;
  born: number;
  /** Absent for someone living. */
  died?: number;
  fields: string[];
}

export interface OwnedCard {
  n: number;
  foil: boolean;
}

export interface PackCounts {
  /** Every pack this era has received (granted or bought); only goes up. */
  granted: number;
  /** Packs opened; only goes up. */
  opened: number;
  /** Packs opened since the last Diamond. */
  pity: number;
}

export interface Equipped {
  title: string | null;
  frame: string | null;
  banner: string | null;
  keypad: string | null;
  celebration: string | null;
  nodeTheme: string | null;
  lemmaIcon: string | null;
  nameOrnament: string | null;
  showcase: string[];
}

/** users/{uid}/meta/economy (SPEC §13.10). Every counter only goes up. */
export interface EconomyState {
  lemmasEarned: number;
  lemmasSpent: number;
  /** Axioms claimed with Prove (SPEC §13.6); reached ones follow from lemmasEarned. */
  axiomsProven: number;
  /** When each proven Axiom was claimed (ms), in order. */
  axiomDates: number[];
  /** Server time (ms) up to which Research has been credited; null before the first credit. */
  researchCreditedAt: number | null;
  /** Hours of Research credited in all (passive and Time Warp), for "Since last visit". */
  researchHours: number;
  /** XP towards the next Time Warp. */
  warpXp: number;
  theorems: Partial<Record<TheoremId, number>>;
  /** Institute copies per era id. */
  institutes: Record<string, number>;
  conjectures: number;
  conjectureDates: number[];
  packs: Record<string, PackCounts>;
  cards: Record<string, OwnedCard>;
  /** Staff slots per era id: slot → card id (null = empty). */
  staff: Record<string, (string | null)[]>;
  owned: string[];
  titles: string[];
  equipped: Equipped;
  /** Earned achievements, "<course>:<id>" → points, for the achievement corollary. */
  achievements: Record<string, number>;
  /** Highest level tier index reached (0 = Basic), so tier packs are granted once. */
  tierReached: number;
  /** Days with a daily problem solved, ever (Geometric Series). */
  dailyDays: number;
  /** Mondays of Full Weeks already paid a pack. */
  fullWeeks: string[];
  /** The end of the last hub visit (SPEC §13.11 "Since last visit"). */
  lastVisit: { balance: number; earned: number; researchHours: number } | null;
}

export const emptyEquipped = (): Equipped => ({ title: null, frame: null, banner: null, keypad: null, celebration: null, nodeTheme: null, lemmaIcon: null, nameOrnament: null, showcase: [] });

export const emptyEconomy = (): EconomyState => ({
  lemmasEarned: 0,
  lemmasSpent: 0,
  axiomsProven: 0,
  axiomDates: [],
  researchCreditedAt: null,
  researchHours: 0,
  warpXp: 0,
  theorems: {},
  institutes: {},
  conjectures: 0,
  conjectureDates: [],
  packs: {},
  cards: {},
  staff: {},
  owned: [],
  titles: [],
  equipped: emptyEquipped(),
  achievements: {},
  tierReached: 0,
  dailyDays: 0,
  fullWeeks: [],
  lastVisit: null,
});

export const balanceOf = (s: EconomyState) => Math.max(0, s.lemmasEarned - s.lemmasSpent);

/* ───────────────────────── SI notation (SPEC §13.1) ───────────────────────── */

const PREFIXES = [
  ["k", "kilo"],
  ["M", "mega"],
  ["G", "giga"],
  ["T", "tera"],
  ["P", "peta"],
  ["E", "exa"],
  ["Z", "zetta"],
  ["Y", "yotta"],
  ["R", "ronna"],
  ["Q", "quetta"],
] as const;

/** The number part and prefix index (−1 = none) at three significant figures. */
function siParts(x: number): { text: string; prefix: number } {
  const v = Math.max(0, x);
  if (v < 1000) {
    const r = Number.isInteger(v) ? v : v >= 100 ? Math.round(v) : Number(v.toPrecision(3));
    if (r >= 1000) return siParts(1000);
    return { text: String(r), prefix: -1 };
  }
  let e = Math.min(Math.floor(Math.log10(v) / 3), PREFIXES.length);
  let m = v / 10 ** (3 * e);
  let rounded = Number(m.toPrecision(3));
  if (rounded >= 1000 && e < PREFIXES.length) {
    e += 1;
    m = v / 10 ** (3 * e);
    rounded = Number(m.toPrecision(3));
  }
  const digits = rounded >= 100 ? 0 : rounded >= 10 ? 1 : 2;
  const text = rounded >= 1000 ? Number(rounded.toPrecision(3)).toLocaleString("en-US") : rounded.toFixed(digits);
  return { text, prefix: e - 1 };
}

/** Short form for tight spaces: "850 ∴", "100 k∴", "4.56 M∴". */
export function lemmasShort(x: number): string {
  const { text, prefix } = siParts(x);
  return prefix < 0 ? `${text} ∴` : `${text} ${PREFIXES[prefix]![0]}∴`;
}

/** Long form, for tooltips and screen readers: "850 lemmas", "4.56 megalemmas". */
export function lemmasLong(x: number): string {
  const { text, prefix } = siParts(x);
  if (prefix < 0) return `${text} ${text === "1" ? "lemma" : "lemmas"}`;
  return `${text} ${PREFIXES[prefix]![1]}lemmas`;
}

/** A plain count in SI form without the ∴ ("10.8 k"), for rates and labels. */
export function siNumber(x: number): string {
  const { text, prefix } = siParts(x);
  return prefix < 0 ? text : `${text} ${PREFIXES[prefix]![0]}`;
}

/* ───────────────────────── Geometric costs ───────────────────────── */

/** Cost of the next `count` levels, starting from `level` owned: base × growth^n summed. */
export function seriesCost(base: number, growth: number, level: number, count: number): number {
  if (count <= 0) return 0;
  // Whole Lemmas, so balances stay whole numbers (and lemmasSpent ≤ lemmasEarned is exact).
  return Math.ceil((base * growth ** level * (growth ** count - 1)) / (growth - 1) - 1e-9);
}

/** How many next levels `budget` buys, capped by `max` more levels. */
export function maxAffordable(base: number, growth: number, level: number, budget: number, max = Infinity): number {
  const first = seriesCost(base, growth, level, 1);
  if (budget < first || max <= 0) return 0;
  let n = Math.floor(Math.log((budget * (growth - 1)) / (base * growth ** level) + 1) / Math.log(growth));
  // Floating point: step to the exact boundary.
  while (n > 0 && seriesCost(base, growth, level, n) > budget) n--;
  while (seriesCost(base, growth, level, n + 1) <= budget) n++;
  return Math.min(n, max);
}

export type BuyAmount = 1 | 10 | "max";

/** The count and cost a buy button shows for one item (SPEC §13.11 Buying). */
export function buyQuote(base: number, growth: number, level: number, budget: number, amount: BuyAmount, maxLevel = Infinity): { count: number; cost: number; affordable: boolean } {
  const room = maxLevel - level;
  if (amount === "max") {
    const count = maxAffordable(base, growth, level, budget, room);
    const shown = Math.max(count, Math.min(1, room));
    return { count, cost: seriesCost(base, growth, level, shown), affordable: count > 0 };
  }
  const count = Math.min(amount, room);
  const cost = seriesCost(base, growth, level, count);
  return { count, cost, affordable: count > 0 && cost <= budget };
}

/* ───────────────────────── Theorems (SPEC §13.2) ───────────────────────── */

export const levelOf = (s: EconomyState, id: TheoremId) => s.theorems[id] ?? 0;
export const theoremDef = (cfg: EconomyConfig, id: TheoremId) => cfg.theorems.find((t) => t.id === id)!;

export function theoremUnlocked(cfg: EconomyConfig, s: EconomyState, id: TheoremId): boolean {
  const t = theoremDef(cfg, id);
  return !t.requires || levelOf(s, t.requires.theorem) >= t.requires.level;
}

export function theoremCanBuy(cfg: EconomyConfig, s: EconomyState, id: TheoremId): boolean {
  const t = theoremDef(cfg, id);
  return !t.unavailable && theoremUnlocked(cfg, s, id) && levelOf(s, id) < (t.maxLevel ?? Infinity);
}

export const harmonic = (n: number) => {
  if (n <= 0) return 0;
  if (n < 1e5) {
    let h = 0;
    for (let k = 1; k <= n; k++) h += 1 / k;
    return h;
  }
  return Math.log(n) + 0.5772156649 + 1 / (2 * n);
};

export interface EconomyContext {
  /** Questions resolved ever (Harmonic Series). */
  questions: number;
  /** Days with a daily problem solved, ever (Geometric Series). */
  dailyDays: number;
  /** Level tiers reached beyond Basic (corollary). */
  tiers: number;
  /** Released, completed era sets (corollary). */
  eraSets: number;
}

/** The Geometric Series bonus per level: 1% × (1 + r + … + r^(k−1)), r = 0.95. */
export const geometricPerLevel = (k: number) => (0.01 * (1 - 0.95 ** Math.max(0, k))) / 0.05;

/** A theorem's numeric effect at `level` (a fraction for percentages, Lemmas for Successor, packs for LLN). */
export function theoremEffect(id: TheoremId, level: number, ctx: Pick<EconomyContext, "questions" | "dailyDays">): number {
  switch (id) {
    case "successor":
      return 2 * level;
    case "distributive":
      return 0.1 * level;
    case "geometric":
      return level * geometricPerLevel(ctx.dailyDays);
    case "ivt":
    case "euler":
      return 0.15 * level;
    case "binomial":
      return 0.1 * level;
    case "harmonic":
      return 0.005 * harmonic(ctx.questions) * level;
    case "pigeonhole":
      return 0.25 * level;
    case "lln":
      return 4 * level;
    case "golden":
      return 0.0618 * level;
    case "recurrence":
      return 0.1 * level;
  }
}

const pct = (f: number) => {
  const p = f * 100;
  const s = p >= 100 ? Math.round(p).toLocaleString("en-US") : p >= 10 ? p.toFixed(1).replace(/\.0$/, "") : p.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
  return `+${s}%`;
};

/** The effect as a bare label: "+24 ∴/question", "+30%", "Diamond pity 72". */
export function theoremEffectLabel(cfg: EconomyConfig, id: TheoremId, level: number, ctx: Pick<EconomyContext, "questions" | "dailyDays">): string {
  const v = theoremEffect(id, level, ctx);
  if (id === "successor") return `+${v} ∴/question`;
  if (id === "lln") return `Diamond pity ${pityThreshold(cfg, level)}`;
  return pct(v);
}

/* ───────────────────────── Multipliers and awards (SPEC §13.1, §13.5) ───────────────────────── */

export type LemmaSource = "question" | "quiz" | "daily" | "rankUp" | "achievement" | "game" | "other";

/** Corollaries, added into one factor: achievements, level tiers, era sets. */
export function corollaryParts(cfg: EconomyConfig, s: EconomyState, ctx: Pick<EconomyContext, "tiers" | "eraSets">) {
  const points = Object.values(s.achievements).reduce((t, p) => t + p, 0);
  return {
    achievements: points * cfg.corollaries.perAchievementPoint,
    tiers: ctx.tiers * cfg.corollaries.perLevelTier,
    eraSets: ctx.eraSets * cfg.corollaries.perEraSet,
  };
}

export interface Multiplier {
  label: string;
  /** The factor it multiplies by. */
  factor: number;
}

/** Multipliers on every source, practice and Research: Golden Ratio, corollaries and Axioms. */
export function globalMultipliers(cfg: EconomyConfig, s: EconomyState, ctx: EconomyContext): Multiplier[] {
  const c = corollaryParts(cfg, s, ctx);
  const out: Multiplier[] = [];
  const golden = levelOf(s, "golden");
  if (golden) out.push({ label: "Golden Ratio", factor: 1 + theoremEffect("golden", golden, ctx) });
  const cor = c.achievements + c.tiers + c.eraSets;
  if (cor) out.push({ label: "Corollaries", factor: 1 + cor });
  if (s.axiomsProven) out.push({ label: "Axioms", factor: 1 + cfg.axioms.bonus * s.axiomsProven });
  return out;
}

const product = (ms: Multiplier[]) => ms.reduce((t, m) => t * m.factor, 1);

/** Multipliers on one active source: its own theorem, then Harmonic Series (all active sources). */
export function sourceMultipliers(s: EconomyState, source: LemmaSource, ctx: EconomyContext): Multiplier[] {
  const out: Multiplier[] = [];
  const own: Partial<Record<LemmaSource, TheoremId>> = { quiz: "distributive", daily: "geometric", rankUp: "ivt", achievement: "euler", game: "binomial" };
  const id = own[source];
  if (id && levelOf(s, id)) out.push({ label: NAMES[id], factor: 1 + theoremEffect(id, levelOf(s, id), ctx) });
  const h = levelOf(s, "harmonic");
  if (h) out.push({ label: NAMES.harmonic, factor: 1 + theoremEffect("harmonic", h, ctx) });
  return out;
}

const NAMES: Record<TheoremId, string> = {
  successor: "Successor Function",
  distributive: "Distributive Law",
  geometric: "Geometric Series",
  ivt: "Intermediate Value Theorem",
  euler: "Euler's Identity",
  binomial: "Binomial Theorem",
  harmonic: "Harmonic Series",
  pigeonhole: "Pigeonhole Principle",
  lln: "Law of Large Numbers",
  golden: "Golden Ratio",
  recurrence: "Recurrence Relation",
};

export interface AwardPart {
  source: LemmaSource;
  xp: number;
  flat: number;
  multipliers: Multiplier[];
  lemmas: number;
}

/** Lemmas for one XP award: (XP + flat bonuses) × source multipliers × global multipliers, rounded. */
export function lemmaAward(cfg: EconomyConfig, s: EconomyState, source: LemmaSource, xp: number, ctx: EconomyContext): AwardPart {
  if (xp <= 0) return { source, xp: 0, flat: 0, multipliers: [], lemmas: 0 };
  const flat = source === "question" ? theoremEffect("successor", levelOf(s, "successor"), ctx) : 0;
  const multipliers = [...sourceMultipliers(s, source, ctx), ...globalMultipliers(cfg, s, ctx)];
  return { source, xp, flat, multipliers, lemmas: Math.round((xp + flat) * product(multipliers)) };
}

/* ───────────────────────── Research (SPEC §13.3–13.4) ───────────────────────── */

export const eraIndex = (cfg: EconomyConfig, era: string) => cfg.eras.findIndex((e) => e.id === era);
export const copiesOf = (s: EconomyState, era: string) => s.institutes[era] ?? 0;

/** An era (its packs and its institute) is open from the start (Antiquity) or once the previous era's institute is built. */
export function eraUnlocked(cfg: EconomyConfig, s: EconomyState, era: string): boolean {
  const i = eraIndex(cfg, era);
  return i === 0 || (i > 0 && copiesOf(s, cfg.eras[i - 1]!.id) >= 1);
}

export const instituteCost = (cfg: EconomyConfig, era: EraDef, copies: number, count: number) => seriesCost(era.institute.base, cfg.institutes.growth, copies, count);

/** Staff slots for a number of copies: 1 with the first, one more every `copiesPerSlot` copies after it, capped. */
export function staffSlots(cfg: EconomyConfig, copies: number): number {
  if (copies <= 0) return 0;
  return Math.min(cfg.staff.maxSlots, 1 + Math.floor((copies - 1) / cfg.staff.copiesPerSlot));
}

/** The copy at which the next slot opens, or null at the cap. */
export function nextSlotAt(cfg: EconomyConfig, copies: number): number | null {
  const slots = staffSlots(cfg, copies);
  if (slots >= cfg.staff.maxSlots) return null;
  return copies <= 0 ? 1 : slots * cfg.staff.copiesPerSlot + 1;
}

export function cardBoost(cfg: EconomyConfig, rarity: Rarity, foil: boolean): number {
  return cfg.staff.boost[rarity] * (foil ? cfg.staff.foilFactor : 1);
}

/** Total staff boost for an era's institute (0.64 = +64%). Only slots that exist and hold an owned card of the era count. */
export function staffBoost(cfg: EconomyConfig, s: EconomyState, era: string, cards: Map<string, CardDef>): number {
  const slots = staffSlots(cfg, copiesOf(s, era));
  let total = 0;
  for (const id of (s.staff[era] ?? []).slice(0, slots)) {
    if (!id) continue;
    const card = cards.get(id);
    const own = s.cards[id];
    if (card && card.era === era && own && own.n > 0) total += cardBoost(cfg, card.rarity, own.foil);
  }
  return total;
}

/** Multipliers on Research only: Recurrence Relation and Conjectures. */
export function researchMultipliers(cfg: EconomyConfig, s: EconomyState): Multiplier[] {
  const out: Multiplier[] = [];
  const r = levelOf(s, "recurrence");
  if (r) out.push({ label: NAMES.recurrence, factor: 1 + 0.1 * r });
  if (s.conjectures) out.push({ label: "Conjectures", factor: cfg.conjectures.multiplier ** s.conjectures });
  return out;
}

/** One institute's output per day, staff boost included but before the Research multipliers. */
export function instituteOutput(cfg: EconomyConfig, s: EconomyState, era: EraDef, cards: Map<string, CardDef>): number {
  return copiesOf(s, era.id) * era.institute.output * (1 + staffBoost(cfg, s, era.id, cards));
}

/** Research in Lemmas per day, every multiplier included. */
export function researchRate(cfg: EconomyConfig, s: EconomyState, cards: Map<string, CardDef>, ctx: EconomyContext, conjectures = s.conjectures): number {
  const base = cfg.eras.reduce((t, e) => t + instituteOutput(cfg, s, e, cards), 0);
  return base * product(researchMultipliers(cfg, { ...s, conjectures })) * product(globalMultipliers(cfg, s, ctx));
}

export const HOUR_MS = 3_600_000;

/** Whole hours of Research due at server time `now`, and where crediting moves to. */
export function researchDue(s: EconomyState, now: number): { hours: number; creditedAt: number } {
  if (s.researchCreditedAt === null || now <= s.researchCreditedAt) return { hours: 0, creditedAt: s.researchCreditedAt ?? now };
  const hours = Math.floor((now - s.researchCreditedAt) / HOUR_MS);
  return { hours, creditedAt: s.researchCreditedAt + hours * HOUR_MS };
}

/** Time Warp: XP added to the meter, and how many warps fire. */
export function timeWarp(cfg: EconomyConfig, warpXp: number, xp: number): { warps: number; warpXp: number } {
  const total = warpXp + Math.max(0, xp);
  const warps = Math.floor(total / cfg.timeWarp.xp);
  return { warps, warpXp: total - warps * cfg.timeWarp.xp };
}

export const conjectureCost = (cfg: EconomyConfig, k: number) => cfg.conjectures.first * cfg.conjectures.step ** k;

/* ───────────────────────── Axioms (SPEC §13.6) ───────────────────────── */

export const axiomsReached = (cfg: EconomyConfig, s: EconomyState) => cfg.axioms.list.filter((a) => s.lemmasEarned >= a.at).length;

/** The next Axiom to show in the summary: the first reached-but-unproven one, else the next to reach. */
export function nextAxiom(cfg: EconomyConfig, s: EconomyState): { axiom: AxiomDef; reached: boolean; toProve: number } | null {
  const reached = axiomsReached(cfg, s);
  const toProve = Math.max(0, reached - s.axiomsProven);
  if (toProve > 0) return { axiom: cfg.axioms.list[reached - 1]!, reached: true, toProve };
  const next = cfg.axioms.list[reached];
  return next ? { axiom: next, reached: false, toProve: 0 } : null;
}

/* ───────────────────────── Packs (SPEC §13.7) ───────────────────────── */

export function pityThreshold(cfg: EconomyConfig, llnLevel: number): number {
  return Math.max(cfg.packs.pityMin, cfg.packs.pity - cfg.packs.pityStep * llnLevel);
}

export const packCounts = (s: EconomyState, era: string): PackCounts => s.packs[era] ?? { granted: 0, opened: 0, pity: 0 };
export const unopened = (s: EconomyState, era: string) => {
  const p = packCounts(s, era);
  return Math.max(0, p.granted - p.opened);
};

/** Packs left until the guaranteed Diamond: "Diamond in ≤ 61". */
export const diamondIn = (cfg: EconomyConfig, s: EconomyState, era: string) => pityThreshold(cfg, levelOf(s, "lln")) - packCounts(s, era).pity;

/** cyrb53: a fast, well-mixed 53-bit string hash. */
export function hash53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32: a small seeded generator of uniform numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0 || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRarity(odds: Record<Rarity, number>, r: number): Rarity {
  let acc = 0;
  const total = RARITIES.reduce((t, k) => t + (odds[k] ?? 0), 0);
  for (const k of ["silver", "gold", "platinum", "diamond"] as Rarity[]) {
    acc += (odds[k] ?? 0) / total;
    if (r < acc) return k;
  }
  return "diamond";
}

export interface PulledCard {
  id: string;
  rarity: Rarity;
  foil: boolean;
  /** What it did: a new card, a duplicate turned into Lemmas, or a foil finish for one already held. */
  result: "new" | "duplicate" | "foilUpgrade";
  /** Copies held after this card (the ×2 badge). */
  count: number;
  lemmas: number;
}

export interface PackResult {
  era: string;
  cards: PulledCard[];
  lemmas: number;
  diamond: boolean;
}

/**
 * Roll one pack, fixed in advance by a seeded hash of the uid, the era and that era's packs-opened count
 * (SPEC §13.7), so reloading can't re-roll it. Returns the cards and the new state.
 */
export function openPack(cfg: EconomyConfig, s: EconomyState, uid: string, era: string, eraCards: CardDef[]): { state: EconomyState; result: PackResult } {
  const counts = packCounts(s, era);
  if (counts.granted - counts.opened <= 0) throw new Error("No pack to open");
  const rand = seededRandom(hash53(`${uid}:${era}:${counts.opened}`));
  const byRarity = new Map<Rarity, CardDef[]>(RARITIES.map((r) => [r, eraCards.filter((c) => c.rarity === r)]));
  const rarities: Rarity[] = [];
  for (let i = 0; i < cfg.packs.size; i++) rarities.push(pickRarity(i === cfg.packs.size - 1 ? cfg.packs.odds.last : cfg.packs.odds.common, rand()));
  const threshold = pityThreshold(cfg, levelOf(s, "lln"));
  if (!rarities.includes("diamond") && counts.pity + 1 >= threshold) rarities[cfg.packs.size - 1] = "diamond";

  const cards = { ...s.cards };
  const pulled: PulledCard[] = [];
  const dupBonus = 1 + theoremEffect("pigeonhole", levelOf(s, "pigeonhole"), { questions: 0, dailyDays: 0 });
  for (const rarity of rarities) {
    let pool = byRarity.get(rarity) ?? [];
    if (!pool.length) pool = eraCards;
    if (rarity === "diamond") {
      // No duplicate Diamonds until every Diamond in the era is collected.
      const missing = pool.filter((c) => !(cards[c.id]?.n > 0));
      if (missing.length) pool = missing;
    }
    const card = pool[Math.floor(rand() * pool.length)]!;
    const foil = rand() < 1 / cfg.packs.foilOneIn;
    const held = cards[card.id];
    let result: PulledCard["result"];
    let lemmas = 0;
    if (!held || held.n <= 0) {
      result = "new";
      cards[card.id] = { n: 1, foil };
    } else if (foil && !held.foil) {
      result = "foilUpgrade";
      cards[card.id] = { n: held.n + 1, foil: true };
    } else {
      result = "duplicate";
      lemmas = Math.round(cfg.packs.duplicate[card.rarity] * dupBonus);
      cards[card.id] = { n: held.n + 1, foil: held.foil };
    }
    pulled.push({ id: card.id, rarity: card.rarity, foil, result, count: cards[card.id]!.n, lemmas });
  }
  const diamond = pulled.some((c) => c.rarity === "diamond");
  const lemmas = pulled.reduce((t, c) => t + c.lemmas, 0);
  const state: EconomyState = {
    ...s,
    cards,
    lemmasEarned: s.lemmasEarned + lemmas,
    packs: { ...s.packs, [era]: { granted: counts.granted, opened: counts.opened + 1, pity: diamond ? 0 : counts.pity + 1 } },
  };
  return { state, result: { era, cards: pulled, lemmas, diamond } };
}

/** The era a free pack comes from: the source's era, capped at the latest unlocked, released era. */
export function freePackEra(cfg: EconomyConfig, s: EconomyState, sourceEra: number, released: Set<string>): string | null {
  for (let i = Math.min(sourceEra, cfg.eras.length - 1); i >= 0; i--) {
    const e = cfg.eras[i]!;
    if (released.has(e.id) && eraUnlocked(cfg, s, e.id)) return e.id;
  }
  return null;
}

/** The latest unlocked, released era (Section Challenge and Full Week packs). */
export const latestEra = (cfg: EconomyConfig, s: EconomyState, released: Set<string>) => freePackEra(cfg, s, cfg.eras.length - 1, released);

export function grantPacks(s: EconomyState, era: string | null, n: number): EconomyState {
  if (!era || n <= 0) return s;
  const c = packCounts(s, era);
  return { ...s, packs: { ...s.packs, [era]: { ...c, granted: c.granted + n } } };
}

/** Packs for reaching level tiers: every tier above the last one paid, each in its own era. */
export function tierPacks(cfg: EconomyConfig, s: EconomyState, tierIndex: number, released: Set<string>): { state: EconomyState; grants: { era: string; packs: number }[] } {
  let state = s;
  const grants: { era: string; packs: number }[] = [];
  for (let i = s.tierReached + 1; i <= tierIndex; i++) {
    const rule = cfg.packs.levelTier[LEVEL_TIERS[i]!.key];
    if (!rule) continue;
    const era = freePackEra(cfg, state, rule.era, released);
    if (era) {
      state = grantPacks(state, era, rule.packs);
      grants.push({ era, packs: rule.packs });
    }
  }
  return { state: { ...state, tierReached: Math.max(s.tierReached, tierIndex) }, grants };
}

/** An era set is complete once every card in it is held. */
export function eraComplete(s: EconomyState, eraCards: CardDef[]): boolean {
  return eraCards.length > 0 && eraCards.every((c) => (s.cards[c.id]?.n ?? 0) > 0);
}

export const collectedCount = (s: EconomyState) => Object.values(s.cards).filter((c) => c.n > 0).length;

/* ───────────────────────── Buying (SPEC §13.11) ───────────────────────── */

export function spend(s: EconomyState, cost: number): EconomyState {
  if (cost > balanceOf(s) + 1e-9) throw new Error("Not enough Lemmas");
  return { ...s, lemmasSpent: s.lemmasSpent + cost };
}

export function buyTheorem(cfg: EconomyConfig, s: EconomyState, id: TheoremId, amount: BuyAmount): { state: EconomyState; count: number; cost: number } {
  if (!theoremCanBuy(cfg, s, id)) return { state: s, count: 0, cost: 0 };
  const t = theoremDef(cfg, id);
  const q = buyQuote(t.base, t.growth, levelOf(s, id), balanceOf(s), amount, t.maxLevel);
  if (!q.affordable) return { state: s, count: 0, cost: 0 };
  return { state: { ...spend(s, q.cost), theorems: { ...s.theorems, [id]: levelOf(s, id) + q.count } }, count: q.count, cost: q.cost };
}

export function buyInstitute(cfg: EconomyConfig, s: EconomyState, era: string, amount: BuyAmount): { state: EconomyState; count: number; cost: number } {
  const e = cfg.eras.find((x) => x.id === era);
  if (!e || !eraUnlocked(cfg, s, era)) return { state: s, count: 0, cost: 0 };
  const q = buyQuote(e.institute.base, cfg.institutes.growth, copiesOf(s, era), balanceOf(s), amount);
  if (!q.affordable) return { state: s, count: 0, cost: 0 };
  return { state: { ...spend(s, q.cost), institutes: { ...s.institutes, [era]: copiesOf(s, era) + q.count } }, count: q.count, cost: q.cost };
}

/**
 * M (SPEC §13.11): buy the single cheapest next level on the tab, again and again (theorems it newly
 * unlocks included) until nothing more is affordable.
 */
export function buyCheapest(cfg: EconomyConfig, s: EconomyState, tab: "theorems" | "research"): { state: EconomyState; count: number; cost: number } {
  let state = s;
  let count = 0;
  let cost = 0;
  for (let guard = 0; guard < 100_000; guard++) {
    const options: { price: number; apply: (x: EconomyState) => EconomyState }[] = [];
    if (tab === "theorems") {
      for (const t of cfg.theorems) {
        if (!theoremCanBuy(cfg, state, t.id)) continue;
        const L = levelOf(state, t.id);
        options.push({ price: seriesCost(t.base, t.growth, L, 1), apply: (x) => ({ ...x, theorems: { ...x.theorems, [t.id]: L + 1 } }) });
      }
    } else {
      for (const e of cfg.eras) {
        if (!eraUnlocked(cfg, state, e.id)) continue;
        const n = copiesOf(state, e.id);
        options.push({ price: instituteCost(cfg, e, n, 1), apply: (x) => ({ ...x, institutes: { ...x.institutes, [e.id]: n + 1 } }) });
      }
    }
    options.sort((a, b) => a.price - b.price);
    const best = options[0];
    if (!best || best.price > balanceOf(state)) break;
    state = best.apply(spend(state, best.price));
    count++;
    cost += best.price;
  }
  return { state, count, cost };
}

export function buyPacks(cfg: EconomyConfig, s: EconomyState, era: string, n: number): EconomyState {
  const e = cfg.eras.find((x) => x.id === era);
  if (!e || !eraUnlocked(cfg, s, era)) return s;
  return grantPacks(spend(s, e.packPrice * n), era, n);
}

export function proveConjecture(cfg: EconomyConfig, s: EconomyState, now: number): EconomyState | null {
  if (s.conjectures >= cfg.conjectures.list.length) return null;
  const cost = conjectureCost(cfg, s.conjectures);
  if (cost > balanceOf(s)) return null;
  return { ...spend(s, cost), conjectures: s.conjectures + 1, conjectureDates: [...s.conjectureDates, now] };
}

/** Prove every reached Axiom at once (free). Returns the newly proven ones. */
export function proveAxioms(cfg: EconomyConfig, s: EconomyState, now: number): { state: EconomyState; proven: AxiomDef[] } {
  const reached = axiomsReached(cfg, s);
  if (reached <= s.axiomsProven) return { state: s, proven: [] };
  const proven = cfg.axioms.list.slice(s.axiomsProven, reached);
  const titles = proven.map((a) => a.title).filter((t): t is string => !!t);
  return {
    state: {
      ...s,
      axiomsProven: reached,
      axiomDates: [...s.axiomDates, ...proven.map(() => now)],
      owned: [...new Set([...s.owned, ...proven.map((a) => a.cosmetic.id)])],
      titles: [...new Set([...s.titles, ...titles])],
    },
    proven,
  };
}

export function buyCosmetic(cfg: EconomyConfig, s: EconomyState, id: string): EconomyState | null {
  const item = cfg.shop.find((c) => c.id === id);
  if (!item || item.price === undefined || s.owned.includes(id) || item.price > balanceOf(s)) return null;
  return { ...spend(s, item.price), owned: [...s.owned, id] };
}

/** Put a card in a staff slot (moving it if it's already in one), or empty the slot with null. */
export function setStaff(cfg: EconomyConfig, s: EconomyState, era: string, slot: number, card: string | null): EconomyState {
  const slots = staffSlots(cfg, copiesOf(s, era));
  if (slot < 0 || slot >= slots) return s;
  const row = Array.from({ length: slots }, (_, i) => s.staff[era]?.[i] ?? null).map((id) => (card && id === card ? null : id));
  row[slot] = card;
  return { ...s, staff: { ...s.staff, [era]: row } };
}

/* ───────────────────────── Merging two copies (another tab or device) ───────────────────────── */

const maxRecord = (a: Record<string, number>, b: Record<string, number>) => {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
};

/**
 * Combine this tab's state with the latest saved one, so an out-of-date tab never lowers anything:
 * counters take the larger value, collections the union. Choices (equipped, staff, last visit) are this tab's.
 */
export function mergeEconomy(mine: EconomyState, saved: EconomyState): EconomyState {
  const packs: Record<string, PackCounts> = { ...mine.packs };
  for (const [era, p] of Object.entries(saved.packs)) {
    const m = packs[era];
    packs[era] = m ? (p.opened > m.opened ? { ...p, granted: Math.max(p.granted, m.granted) } : { ...m, granted: Math.max(p.granted, m.granted) }) : p;
  }
  const cards: Record<string, OwnedCard> = { ...mine.cards };
  for (const [id, c] of Object.entries(saved.cards)) {
    const m = cards[id];
    cards[id] = m ? { n: Math.max(m.n, c.n), foil: m.foil || c.foil } : c;
  }
  return {
    ...mine,
    lemmasEarned: Math.max(mine.lemmasEarned, saved.lemmasEarned),
    lemmasSpent: Math.max(mine.lemmasSpent, saved.lemmasSpent),
    axiomsProven: Math.max(mine.axiomsProven, saved.axiomsProven),
    axiomDates: mine.axiomDates.length >= saved.axiomDates.length ? mine.axiomDates : saved.axiomDates,
    researchCreditedAt: Math.max(mine.researchCreditedAt ?? 0, saved.researchCreditedAt ?? 0) || null,
    researchHours: Math.max(mine.researchHours, saved.researchHours),
    theorems: maxRecord(mine.theorems, saved.theorems),
    institutes: maxRecord(mine.institutes, saved.institutes),
    conjectures: Math.max(mine.conjectures, saved.conjectures),
    conjectureDates: mine.conjectureDates.length >= saved.conjectureDates.length ? mine.conjectureDates : saved.conjectureDates,
    packs,
    cards,
    owned: [...new Set([...mine.owned, ...saved.owned])],
    titles: [...new Set([...mine.titles, ...saved.titles])],
    achievements: { ...saved.achievements, ...mine.achievements },
    tierReached: Math.max(mine.tierReached, saved.tierReached),
    dailyDays: Math.max(mine.dailyDays, saved.dailyDays),
    fullWeeks: [...new Set([...mine.fullWeeks, ...saved.fullWeeks])],
  };
}
