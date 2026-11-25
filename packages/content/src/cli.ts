/**
 * Validate content and emit JSON bundles for the web app.
 *   pnpm content            (from the repo root)
 * Output: apps/web/static/content/<course>/course.json and questions/<skillId>.json
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildContent } from "./build.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentDir = join(root, "content");
const outDir = join(root, "apps/web/static/content");

const { bundles, errors, warnings } = buildContent(contentDir);
warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  console.error(`\n${errors.length} content error(s). Nothing was written.`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
for (const { course, questions } of bundles) {
  const dir = join(outDir, course.id);
  mkdirSync(join(dir, "questions"), { recursive: true });
  writeFileSync(join(dir, "course.json"), JSON.stringify(course));
  for (const [skillId, qs] of Object.entries(questions)) writeFileSync(join(dir, "questions", `${skillId}.json`), JSON.stringify(qs));
  const skills = course.units.flatMap((u) => u.sections.flatMap((s) => s.skills));
  const qCount = Object.values(questions).reduce((a, q) => a + q.length, 0);
  console.log(`${course.id}: ${skills.length} skills, ${qCount} questions → ${dir}`);
}
writeFileSync(join(outDir, "index.json"), JSON.stringify(bundles.map((b) => ({ id: b.course.id, name: b.course.name }))));
