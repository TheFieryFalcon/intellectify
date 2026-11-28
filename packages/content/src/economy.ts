/**
 * The Lemma economy's content (SPEC §13): content/economy.yaml and content/cards/<era>.yaml.
 * The build checks them, then writes one static JSON file for the app.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { COSMETIC_SLOTS, RARITIES, type CardDef, type EconomyConfig, type TheoremId } from "@intellectify/engine";
import type { AchievementT } from "./achievements.js";

const THEOREM_IDS: TheoremId[] = ["successor", "distributive", "geometric", "ivt", "euler", "binomial", "harmonic", "pigeonhole", "lln", "golden", "recurrence"];
const ERA_IDS = ["antiquity", "golden-age", "renaissance", "enlightenment", "steam-age", "machine-age", "space-age"] as const;
/** The years each era covers (SPEC §13.7): a person sits in the era of their major work. */
export const ERA_YEARS: Record<(typeof ERA_IDS)[number], [number, number]> = {
  antiquity: [-Infinity, 500],
  "golden-age": [500, 1400],
  renaissance: [1400, 1650],
  enlightenment: [1650, 1800],
  "steam-age": [1800, 1880],
  "machine-age": [1880, 1955],
  "space-age": [1955, Infinity],
};

const num = z.number().positive();
const rarityMap = z.object({ silver: z.number().min(0), gold: z.number().min(0), platinum: z.number().min(0), diamond: z.number().min(0) });
const cosmetic = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), slot: z.enum(COSMETIC_SLOTS as unknown as [string, ...string[]]), name: z.string().min(1), description: z.string().min(1), price: num.optional() });
const tierRule = z.object({ packs: z.number().int().positive(), era: z.number().int().min(0).max(6) });

export const EconomyFile = z.object({
  theorems: z.array(
    z.object({
      id: z.enum(THEOREM_IDS as [TheoremId, ...TheoremId[]]),
      name: z.string().min(1),
      statement: z.string().min(1),
      boosts: z.string().min(1),
      base: num,
      growth: z.number().gt(1),
      requires: z.object({ theorem: z.enum(THEOREM_IDS as [TheoremId, ...TheoremId[]]), level: z.number().int().positive() }).nullable(),
      maxLevel: z.number().int().positive().optional(),
      unavailable: z.boolean().optional(),
      x: z.number().min(0).max(1000),
      y: z.number().min(0).max(640),
    }),
  ),
  institutes: z.object({ growth: z.number().gt(1) }),
  eras: z.array(
    z.object({
      id: z.enum(ERA_IDS),
      name: z.string().min(1),
      years: z.string().min(1),
      packPrice: num,
      institute: z.object({ id: z.string().min(1), name: z.string().min(1), base: num, output: num }),
    }),
  ),
  staff: z.object({ boost: rarityMap, foilFactor: num, copiesPerSlot: z.number().int().positive(), maxSlots: z.number().int().positive() }),
  timeWarp: z.object({ xp: z.number().int().positive(), hours: num }),
  conjectures: z.object({
    first: num,
    step: z.number().gt(1),
    multiplier: z.number().gt(1),
    list: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), statement: z.string().min(1), proved: z.string().min(1).nullable() })),
  }),
  axioms: z.object({
    bonus: num,
    list: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        at: num,
        hours: num,
        group: z.enum(["zfc", "large"]),
        statement: z.string().min(1),
        cosmetic,
        title: z.string().min(1).nullable(),
      }),
    ),
  }),
  corollaries: z.object({ perAchievementPoint: num, perLevelTier: num, perEraSet: num }),
  packs: z.object({
    size: z.number().int().positive(),
    odds: z.object({ common: rarityMap, last: rarityMap }),
    pity: z.object({ diamond: z.number().int().positive(), platinum: z.number().int().positive(), step: z.number().min(0).max(0.1) }),
    foilOneIn: z.number().int().positive(),
    duplicate: rarityMap,
    levelTier: z.record(z.string(), tierRule),
    achievement: z.object({ platinum: tierRule, diamond: tierRule, ruby: tierRule, tanzanite: tierRule, vibranium: tierRule, solarium: tierRule, antimatter: tierRule }),
    challenge: z.number().int().positive(),
    fullWeek: z.number().int().positive(),
  }),
  shop: z.array(cosmetic.extend({ price: num })),
  tabs: z.object({ research: num, conjecturesRate: num }),
});

export const CardFile = z.object({
  era: z.enum(ERA_IDS),
  cards: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
      name: z.string().min(1),
      born: z.number().int().optional(),
      died: z.number().int().optional(),
      flourished: z.number().int().optional(),
      circa: z.array(z.enum(["born", "died"])).optional(),
      work: z.number().int(),
      fields: z.array(z.string().min(1)).min(1),
      rarity: z.enum(["silver", "gold", "platinum", "diamond"]),
      wikidata: z.string().regex(/^Q\d+$/).optional(),
      portrait: z.object({ file: z.string().min(1), source: z.string().min(1), author: z.string(), license: z.string().min(1) }).nullable(),
      related: z.array(z.string()).optional(),
      blurb: z.string().min(1),
    }),
  ),
});
export type CardT = z.infer<typeof CardFile>["cards"][number] & { era: string };

export interface EconomyBundle {
  config: EconomyConfig;
  cards: (CardDef & Omit<CardT, keyof CardDef>)[];
}

export function loadEconomy(contentDir: string, skillIds: Set<string>, achievements: AchievementT[], errors: string[], warnings: string[]): EconomyBundle | null {
  const path = join(contentDir, "economy.yaml");
  if (!existsSync(path)) return null;
  const parsed = EconomyFile.safeParse(parseYaml(readFileSync(path, "utf8")));
  if (!parsed.success) {
    errors.push(`economy.yaml: ${parsed.error.issues.slice(0, 6).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    return null;
  }
  const cfg = parsed.data as unknown as EconomyConfig;
  const e = (m: string) => errors.push(`economy.yaml: ${m}`);

  // Theorems: all eleven once each; requirements name other theorems; no cycles (prerequisites listed first).
  const ids = cfg.theorems.map((t) => t.id);
  for (const id of THEOREM_IDS) if (ids.filter((x) => x === id).length !== 1) e(`theorem ${id} must appear once`);
  cfg.theorems.forEach((t, i) => {
    if (t.requires && !ids.slice(0, i).includes(t.requires.theorem)) e(`${t.id} requires ${t.requires.theorem}, which must come before it`);
    if (t.requires && t.requires.theorem === t.id) e(`${t.id} requires itself`);
  });
  // Eras in order, institutes and pack prices rising.
  if (cfg.eras.map((x) => x.id).join() !== ERA_IDS.join()) e(`eras must be ${ERA_IDS.join(", ")} in that order`);
  cfg.eras.forEach((x, i) => {
    const prev = cfg.eras[i - 1];
    if (prev && (x.institute.base <= prev.institute.base || x.packPrice <= prev.packPrice || x.institute.output <= prev.institute.output)) e(`${x.id}: institute cost, output and pack price must rise era by era`);
  });
  if (cfg.packs.size < 1 || cfg.packs.odds.last.silver !== 0) e("packs: the last card is the guaranteed Gold or better (silver: 0)");
  if (cfg.packs.pity.platinum >= cfg.packs.pity.diamond) e("packs: the Platinum guarantee must come sooner than the Diamond one");
  if (cfg.staff.maxSlots >= 20) e("staff.maxSlots must stay below the set size (about 24)");
  // Axioms: 18 (9 ZFC then 9 large cardinals), thresholds rising, six titles.
  const ax = cfg.axioms.list;
  if (ax.length !== 18) e(`there must be 18 Axioms (found ${ax.length})`);
  ax.forEach((a, i) => {
    if (i > 0 && a.at <= ax[i - 1]!.at) e(`Axiom ${a.name}: threshold must be above ${ax[i - 1]!.name}'s`);
    if (a.group !== (i < 9 ? "zfc" : "large")) e(`Axiom ${a.name}: should be ${i < 9 ? "zfc" : "large"}`);
    if (a.cosmetic.price !== undefined) e(`Axiom ${a.name}: its cosmetic can't have a price`);
  });
  if (ax.filter((a) => a.title).length !== 6) e("six Axioms give titles");
  // Conjectures: 12, the last two open.
  const cj = cfg.conjectures.list;
  if (cj.length !== 12) e(`there must be 12 Conjectures (found ${cj.length})`);
  if (cj.slice(0, -1).some((c) => c.proved === null)) e("only the last Conjecture can still be open (proved: null)");
  // Cosmetics: unique ids; no frames, titles, icons or ornaments in the shop.
  const cosmeticIds = [...cfg.shop.map((c) => c.id), ...ax.map((a) => a.cosmetic.id), ...cfg.eras.map((x) => `frame-${x.id}`)];
  const dup = cosmeticIds.filter((id, i) => cosmeticIds.indexOf(id) !== i);
  if (dup.length) e(`duplicate cosmetic ids: ${[...new Set(dup)].join(", ")}`);
  for (const c of cfg.shop) if (!["keypad", "celebration", "banner", "nodeTheme"].includes(c.slot)) e(`shop item ${c.id}: ${c.slot} can't be bought`);

  // Titles (SPEC §13.9): every Tanzanite-and-up achievement has one, no lower tier does, and all are unique.
  const high = ["tanzanite", "vibranium", "solarium", "antimatter"];
  for (const a of achievements) {
    if (high.includes(a.tier) && !a.title) errors.push(`achievements.yaml: ${a.id} (${a.tier}) needs a title`);
    if (!high.includes(a.tier) && a.title) errors.push(`achievements.yaml: ${a.id} (${a.tier}) can't have a title`);
  }
  const titles = [...achievements.map((a) => a.title).filter(Boolean), ...ax.map((a) => a.title).filter(Boolean)] as string[];
  const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (dupTitles.length) errors.push(`titles must be unique: ${[...new Set(dupTitles)].join(", ")}`);

  // Cards. The full rule checks (dates, era ranges, rarity counts, blurbs, portrait licenses, eponymous
  // skills) are scripts/verify_cards.py; the build checks what the app relies on.
  const cards: EconomyBundle["cards"] = [];
  const dir = join(contentDir, "cards");
  for (const file of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort() : []) {
    const where = `cards/${file}`;
    const p = CardFile.safeParse(parseYaml(readFileSync(join(dir, file), "utf8")));
    if (!p.success) {
      errors.push(`${where}: ${p.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    const { era, cards: list } = p.data;
    if (file !== `${era}.yaml`) errors.push(`${where}: era ${era} belongs in ${era}.yaml`);
    const [from, to] = ERA_YEARS[era];
    for (const c of list) {
      const at = `${where}: ${c.id}`;
      if (!(c.work >= from && c.work < to)) errors.push(`${at}: major work in ${c.work} is outside ${era}`);
      for (const s of c.related ?? []) if (!skillIds.has(s)) errors.push(`${at}: unknown skill ${s}`);
      if (c.portrait && !existsSync(join(dir, c.portrait.file))) errors.push(`${at}: portrait ${c.portrait.file} is missing`);
      if (!c.portrait) warnings.push(`${at}: no portrait yet`);
      cards.push({ ...c, era, born: c.born ?? c.flourished ?? c.work });
    }
    for (const r of RARITIES) {
      const count = list.filter((c) => c.rarity === r).length;
      if (count < (r === "diamond" ? 3 : 4)) errors.push(`${where}: ${count} ${r} cards; needs at least ${r === "diamond" ? 3 : 4}`);
    }
  }
  const cardIds = cards.map((c) => c.id);
  const dupCards = cardIds.filter((id, i) => cardIds.indexOf(id) !== i);
  if (dupCards.length) errors.push(`cards: duplicate ids ${[...new Set(dupCards)].join(", ")}`);
  const missing = ERA_IDS.filter((e) => !cards.some((c) => c.era === e));
  if (missing.length) errors.push(`cards: no set for ${missing.join(", ")} (all seven eras launch together, §13.7)`);
  return { config: cfg, cards };
}
