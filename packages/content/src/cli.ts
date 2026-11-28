/**
 * Validate content and emit JSON bundles for the web app.
 *   pnpm content            (from the repo root)
 * Output: apps/web/static/content/<course>/course.json and questions/<skillId>.json
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildContent } from "./build.js";
import { buildQuestionIndex } from "./question-index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentDir = join(root, "content");
const outDir = join(root, "apps/web/static/content");

const { bundles, achievements, economy, words, errors, warnings } = buildContent(contentDir);
warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  console.error(`\n${errors.length} content error(s). Nothing was written.`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
for (const { course, questions, sectionReviews, unitReviews, tutorials } of bundles) {
  const dir = join(outDir, course.id);
  mkdirSync(join(dir, "questions"), { recursive: true });
  writeFileSync(join(dir, "course.json"), JSON.stringify(course));
  for (const [skillId, qs] of Object.entries(questions)) writeFileSync(join(dir, "questions", `${skillId}.json`), JSON.stringify(qs));
  mkdirSync(join(dir, "reviews"), { recursive: true });
  for (const [id, r] of Object.entries(sectionReviews)) writeFileSync(join(dir, "reviews", `section-${id}.json`), JSON.stringify(r));
  for (const [n, r] of Object.entries(unitReviews)) writeFileSync(join(dir, "reviews", `unit-${n}.json`), JSON.stringify(r));
  mkdirSync(join(dir, "tutorials"), { recursive: true });
  for (const t of tutorials) writeFileSync(join(dir, "tutorials", `${t.skill}.json`), JSON.stringify({ skill: t.skill, terms: t.terms, markdown: t.markdown }));
  const glossary = tutorials.flatMap((t) => t.terms.map((x) => ({ ...x, skill: t.skill }))).sort((a, b) => a.term.localeCompare(b.term));
  writeFileSync(join(dir, "glossary.json"), JSON.stringify(glossary));
  writeFileSync(join(dir, "question-index.json"), JSON.stringify(buildQuestionIndex(course, questions, sectionReviews, unitReviews)));
  const skills = course.units.flatMap((u) => u.sections.flatMap((s) => s.skills));
  const qCount = Object.values(questions).reduce((a, q) => a + q.length, 0);
  console.log(`${course.id}: ${skills.length} skills, ${qCount} questions, ${tutorials.length} tutorials → ${dir}`);
}
writeFileSync(join(outDir, "achievements.json"), JSON.stringify(achievements));
writeFileSync(join(outDir, "words.json"), JSON.stringify(words));
if (economy) {
  writeFileSync(join(outDir, "economy.json"), JSON.stringify(economy));
  // Portraits (SPEC §13.11): the ink-wash WebPs, served next to the bundle as /content/cards/portraits/<id>.webp.
  cpSync(join(contentDir, "cards/portraits"), join(outDir, "cards/portraits"), { recursive: true, filter: (src) => !src.includes("/source") && !/\.(ya?ml|md|py)$/.test(src) });
  const eras = [...new Set(economy.cards.map((c) => c.era))];
  console.log(`economy: ${economy.cards.length} cards in ${eras.length} eras (${eras.join(", ")})`);
}
// Banned words (SPEC §14.2): the same list firestore.rules checks (see scripts/banned-rules.mjs).
const bannedFile = join(contentDir, "banned-words.txt");
const banned = existsSync(bannedFile)
  ? readFileSync(bannedFile, "utf8").split("\n").map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith("#"))
  : [];
writeFileSync(join(outDir, "banned-words.json"), JSON.stringify(banned));
console.log(`achievements: ${achievements.length} (${achievements.filter((a) => a.rule.kind !== "pending").length} earnable now)`);
writeFileSync(join(outDir, "index.json"), JSON.stringify(bundles.map((b) => ({ id: b.course.id, name: b.course.name }))));
