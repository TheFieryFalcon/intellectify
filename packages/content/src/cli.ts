/**
 * Validate content and emit JSON bundles for the web app.
 *   pnpm content            (from the repo root)
 * Output: apps/web/static/content/<course>/course.json and questions/<skillId>.json
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildContent } from "./build.js";
import { buildQuestionIndex } from "./question-index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentDir = join(root, "content");
const outDir = join(root, "apps/web/static/content");

const { bundles, achievements, words, errors, warnings } = buildContent(contentDir);
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
console.log(`achievements: ${achievements.length} (${achievements.filter((a) => a.rule.kind !== "pending").length} earnable now)`);
writeFileSync(join(outDir, "index.json"), JSON.stringify(bundles.map((b) => ({ id: b.course.id, name: b.course.name }))));
