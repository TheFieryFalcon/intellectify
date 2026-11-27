/**
 * Verify every question's answer key against its SymPy `verify` code (docs/SPEC.md §11.2).
 *   pnpm verify            (from the repo root; needs python3 with sympy and pyyaml)
 * SymPy's answer must pass the app's own checker against the question's key, for every variant.
 * Form rules are ignored here: this checks values; the build already checks that keys pass their form rules.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAnswer, type AnswerSpec } from "@intellectify/checker";
import { buildContent } from "./build.js";
import type { QuestionT } from "./schema.js";
import { fillTemplate } from "./template.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const { bundles, errors: buildErrors } = buildContent(join(root, "content"));
if (buildErrors.length) {
  buildErrors.forEach((e) => console.error(`content error: ${e}`));
  process.exit(1);
}
const byId = new Map<string, QuestionT>();
for (const b of bundles) {
  const pools = [
    ...Object.values(b.questions),
    ...Object.values(b.sectionReviews).flatMap((r) => [r.sectionQuiz, r.challenge]),
    ...Object.values(b.unitReviews).map((r) => r.unitQuiz),
  ];
  for (const qs of pools) for (const q of qs) byId.set(q.id, q);
}

const run = spawnSync("python3", [join(root, "scripts/verify_questions.py"), join(root, "content/questions")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
if (run.error) {
  console.error(`couldn't run python3: ${run.error.message}`);
  process.exit(1);
}

type Line = { question: string; variant: number | null; part?: string; kind?: "latex" | "list" | "choice"; value?: string | string[]; error?: string };
const lines: Line[] = run.stdout.split("\n").filter(Boolean).map((l) => JSON.parse(l) as Line);
const errors: string[] = [];
const covered = new Map<string, Set<string>>();

for (const line of lines) {
  const where = `${line.question}${line.variant !== null ? ` variant ${line.variant}` : ""}`;
  if (line.error) {
    errors.push(`${where}: verify code failed\n${line.error}`);
    continue;
  }
  const q = byId.get(line.question);
  if (!q) {
    errors.push(`${where}: unknown question`);
    continue;
  }
  const filled = line.variant !== null && q.variants ? fillTemplate(q, q.variants[line.variant]!) : q;
  const part = filled.parts.find((p) => p.id === line.part);
  if (!part?.answer) {
    errors.push(`${where}: verify returned part "${line.part}", which has no auto-marked answer`);
    continue;
  }
  (covered.get(where) ?? covered.set(where, new Set()).get(where)!).add(part.id);
  const spec = { ...part.answer, form: undefined } as AnswerSpec;
  let given: string | string[];
  if (line.kind === "choice") given = String(line.value);
  else if (line.kind === "list") given = spec.type === "vector" ? `\\left(${(line.value as string[]).join(",")}\\right)` : (line.value as string[]).join(spec.type === "features" ? "\n" : ",");
  else given = String(line.value);
  try {
    const verdict = checkAnswer(spec, given);
    if (!verdict.correct) errors.push(`${where} part ${part.id}: SymPy says ${JSON.stringify(given)}, which doesn't match the key ${JSON.stringify("key" in part.answer ? part.answer.key : part.answer.features.map((f) => f.key))} (${verdict.message})`);
  } catch (err) {
    errors.push(`${where} part ${part.id}: couldn't compare (${(err as Error).message})`);
  }
}

// Every auto-marked part of every question with verify code must be covered, for every variant.
const missing: string[] = [];
for (const q of byId.values()) {
  const autoParts = q.parts.filter((p) => p.answer).map((p) => p.id);
  if (!q.verify) {
    if (autoParts.length && q.parts.some((p) => p.answer && p.answer.type !== "mcq" && p.answer.type !== "multi-select")) missing.push(q.id);
    continue;
  }
  const variants = q.variants?.length ? q.variants.map((_, i) => `${q.id} variant ${i}`) : [q.id];
  for (const v of variants) for (const p of autoParts) if (!covered.get(v)?.has(p)) errors.push(`${v}: verify didn't return part ${p}`);
}

// Every computed answer must be machine-checked (SPEC §11.2).
for (const id of missing) errors.push(`${id}: computed answers need verify code`);
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  console.error(`\n${errors.length} verification error(s).`);
  process.exit(1);
}
console.log(`verified ${lines.length} answer(s) across ${covered.size} question/variant(s)`);
