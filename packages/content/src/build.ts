import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { checkAnswer } from "@intellectify/checker";
import { SKILL_SIZE, tierOf, type SkillSize } from "@intellectify/engine";
import { fillTemplate } from "./template.js";
import { diagramErrors } from "./diagram-check.js";
import { loadTutorials, type Tutorial } from "./tutorials.js";
import { CourseManifest, CurriculumVersion, Question, ResponseSkills, type CourseManifestT, type CurriculumVersionT, type QuestionT } from "./schema.js";

/* The bundle the web app loads. One per course. */
export interface BundleSkill {
  id: string;
  name: string;
  summary: string;
  size: SkillSize;
  dotPoints: string[];
  reviewDotPoints: string[];
  prereqs: string[];
  external: { course: string; version: string; dotPoints: string[]; note: string }[];
  /** Weight in roll-ups: number of dot points (including review dot points it covers). */
  weight: number;
  questionCount: number;
  hasTutorial: boolean;
}
export interface BundleSection {
  id: string;
  code: string;
  name: string;
  hours: number;
  skills: BundleSkill[];
}
export interface CourseBundle {
  id: string;
  name: string;
  versions: { year: number; id: string; effectiveFrom: string }[];
  units: { number: number; year: number; sections: BundleSection[] }[];
  responseSkills: { id: string; name: string }[];
}
export interface BuildResult {
  bundles: { course: CourseBundle; questions: Record<string, QuestionT[]>; tutorials: Tutorial[] }[];
  errors: string[];
  warnings: string[];
}

const readYaml = (path: string): unknown => parseYaml(readFileSync(path, "utf8"));
const listYaml = (dir: string): string[] => {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listYaml(p));
    else if (/\.ya?ml$/.test(name)) out.push(p);
  }
  return out.sort();
};

/** Load, validate and assemble all content under `contentDir`. Never throws on bad content; reports errors instead. */
export function buildContent(contentDir: string): BuildResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bundles: BuildResult["bundles"] = [];
  const rel = (p: string) => relative(contentDir, p);

  const rsParsed = ResponseSkills.safeParse(readYaml(join(contentDir, "response-skills.yaml")));
  if (!rsParsed.success) errors.push(`response-skills.yaml: ${rsParsed.error.issues.map((i) => i.message).join("; ")}`);
  const responseSkills = rsParsed.success ? rsParsed.data : [];
  const rsIds = new Set(responseSkills.map((r) => r.id));

  const curriculumDir = join(contentDir, "curriculum");
  for (const courseId of readdirSync(curriculumDir)) {
    const courseDir = join(curriculumDir, courseId);
    if (!statSync(courseDir).isDirectory()) continue;
    const manifestParsed = CourseManifest.safeParse(readYaml(join(courseDir, "course.yaml")));
    if (!manifestParsed.success) {
      errors.push(`${courseId}/course.yaml: ${manifestParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    const manifest: CourseManifestT = manifestParsed.data;

    // Load the current version for each year: together they form one continuous map.
    const versions: CurriculumVersionT[] = [];
    for (const [year, v] of Object.entries(manifest.versions)) {
      const path = join(courseDir, `${v.current}.yaml`);
      const parsed = CurriculumVersion.safeParse(readYaml(path));
      if (!parsed.success) {
        errors.push(`${rel(path)}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        continue;
      }
      if (`y${parsed.data.year}` !== year) errors.push(`${rel(path)}: year ${parsed.data.year} doesn't match manifest key ${year}`);
      versions.push(parsed.data);
    }
    versions.sort((a, b) => a.year - b.year);

    // Index skills and check structure.
    const skillUnit = new Map<string, number>();
    const prereqsOf = new Map<string, string[]>();
    const reviewFor = new Map<string, string[]>();
    for (const v of versions) {
      for (const u of v.units) {
        for (const s of u.sections) {
          const covered: string[] = [];
          for (const k of s.skills) {
            if (skillUnit.has(k.id)) errors.push(`duplicate skill ID ${k.id}`);
            if (!k.id.startsWith(`${manifest.skillIdPrefix}.${s.id}.`)) errors.push(`${k.id}: ID should start with ${manifest.skillIdPrefix}.${s.id}.`);
            skillUnit.set(k.id, u.number);
            prereqsOf.set(k.id, k.prereqs);
            covered.push(...k.dotPoints);
          }
          for (const r of s.reviewDotPoints) {
            covered.push(...r.dotPoints);
            reviewFor.set(r.skill, [...(reviewFor.get(r.skill) ?? []), ...r.dotPoints]);
          }
          const expected = Array.from({ length: s.dotPointCount }, (_, i) => `${s.code}.${i + 1}`);
          const seen = new Map<string, number>();
          covered.forEach((d) => seen.set(d, (seen.get(d) ?? 0) + 1));
          const missing = expected.filter((d) => !seen.has(d));
          const extra = [...seen.keys()].filter((d) => !expected.includes(d));
          const dupes = [...seen].filter(([, n]) => n > 1).map(([d]) => d);
          if (missing.length) errors.push(`${v.id} ${s.code}: dot points not covered: ${missing.join(", ")}`);
          if (extra.length) errors.push(`${v.id} ${s.code}: unknown dot points: ${extra.join(", ")}`);
          if (dupes.length) errors.push(`${v.id} ${s.code}: dot points covered more than once: ${dupes.join(", ")}`);
        }
      }
    }
    for (const [id, pre] of prereqsOf) {
      for (const p of pre) {
        if (!skillUnit.has(p)) errors.push(`${id}: unknown prerequisite ${p}`);
        else if (skillUnit.get(p)! > skillUnit.get(id)!) errors.push(`${id}: prerequisite ${p} is in a later unit`);
      }
    }
    for (const skill of reviewFor.keys()) if (!skillUnit.has(skill)) errors.push(`reviewDotPoints refer to unknown skill ${skill}`);
    const cycle = findCycle(prereqsOf);
    if (cycle) errors.push(`prerequisite cycle: ${cycle.join(" → ")}`);

    // Tutorials (SPEC §3.2).
    const skillDotPoints = new Map<string, string[]>();
    for (const v of versions) for (const u of v.units) for (const s of u.sections) for (const k of s.skills) skillDotPoints.set(k.id, [...k.dotPoints, ...(reviewFor.get(k.id) ?? [])]);
    const tutorials = loadTutorials(contentDir, courseId, skillDotPoints, errors, warnings);

    // Questions.
    const questions: Record<string, QuestionT[]> = {};
    const qDir = join(contentDir, "questions", courseId);
    const qIds = new Set<string>();
    let files: string[] = [];
    try {
      files = listYaml(qDir);
    } catch {
      warnings.push(`${courseId}: no questions directory`);
    }
    for (const file of files) {
      const raw = readYaml(file);
      const docs = Array.isArray(raw) ? raw : [raw];
      for (const doc of docs) {
        const parsed = Question.safeParse(doc);
        if (!parsed.success) {
          errors.push(`${rel(file)}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
          continue;
        }
        const q = parsed.data;
        const where = `${rel(file)} (${q.id})`;
        if (qIds.has(q.id)) errors.push(`${where}: duplicate question ID`);
        qIds.add(q.id);
        for (const s of [q.skills.primary, ...q.skills.secondary]) if (!skillUnit.has(s)) errors.push(`${where}: unknown skill ${s}`);
        for (const r of Object.keys(q.responseSkills)) if (!rsIds.has(r)) errors.push(`${where}: unknown response skill ${r}`);
        if (tierOf(q.rating) === 6 && !q.parts.every((p) => p.rubric)) warnings.push(`${where}: Tier 6 questions are normally milestone-marked free response`);
        // MCQ keys and diagrams may be templated ({{key}}), so check them once per filled variant.
        for (const params of q.variants ?? [{}]) {
          const filled = q.variants ? fillTemplate(q, params) : q;
          const texts = [filled.stem, filled.solution, ...filled.parts.flatMap((p) => [p.prompt ?? "", ...(p.options ?? []).map((o) => o.text)])];
          for (const t of texts) for (const e of diagramErrors(t)) errors.push(`${where}${q.variants ? ` variant ${JSON.stringify(params)}` : ""}: ${e}`);
          for (const p of filled.parts) {
            if (p.answer && p.options && (p.answer.type === "mcq" || p.answer.type === "multi-select")) {
              const ids = new Set(p.options.map((o) => o.id));
              const keys = Array.isArray(p.answer.key) ? p.answer.key : [p.answer.key];
              for (const k of keys) if (!ids.has(k)) errors.push(`${where} part ${p.id}: answer ${k} isn't one of the options`);
            }
          }
        }
        // Self-check: every answer key must be accepted by its own checker, for every variant.
        for (const params of q.variants ?? [{}]) {
          const filled = fillTemplate(q, params);
          for (const p of filled.parts) {
            if (!p.answer || p.answer.type === "mcq" || p.answer.type === "multi-select") continue;
            const keyLatex = keyAsLatex(p.answer);
            try {
              const v = checkAnswer(p.answer, keyLatex);
              if (!v.correct) errors.push(`${where} part ${p.id}${q.variants ? ` variant ${JSON.stringify(params)}` : ""}: key fails its own check (${v.message})`);
            } catch (err) {
              errors.push(`${where} part ${p.id}: key could not be checked (${(err as Error).message})`);
            }
          }
          const leftover = JSON.stringify(filled).match(/\{\{\s*\w+\s*\}\}/);
          if (leftover) errors.push(`${where}: unfilled placeholder ${leftover[0]}`);
        }
        (questions[q.skills.primary] ??= []).push(q);
      }
    }

    const unitYear = new Map<number, number>();
    versions.forEach((v) => v.units.forEach((u) => unitYear.set(u.number, v.year)));
    const course: CourseBundle = {
      id: manifest.id,
      name: manifest.name,
      versions: versions.map((v) => ({ year: v.year, id: v.id, effectiveFrom: v.source.effectiveFrom })),
      responseSkills,
      units: versions
        .flatMap((v) => v.units)
        .sort((a, b) => a.number - b.number)
        .map((u) => ({
          number: u.number,
          year: unitYear.get(u.number)!,
          sections: u.sections.map((s) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            hours: s.hours,
            skills: s.skills.map((k) => {
              const review = reviewFor.get(k.id) ?? [];
              // Size targets (SPEC §3.3), checked once a skill has any questions.
              const qs = questions[k.id] ?? [];
              const rules = SKILL_SIZE[k.size];
              const tier5 = qs.filter((q) => tierOf(q.rating) === 5).length;
              if (qs.length && qs.length < rules.minQuestions) warnings.push(`${k.id} (${k.size}): ${qs.length} questions; needs at least ${rules.minQuestions}`);
              if (qs.length && tier5 < rules.minTier5) warnings.push(`${k.id} (${k.size}): ${tier5} Tier 5 questions; needs at least ${rules.minTier5}`);
              return {
                id: k.id,
                name: k.name,
                summary: k.summary,
                size: k.size,
                dotPoints: k.dotPoints,
                reviewDotPoints: review,
                prereqs: k.prereqs,
                external: k.external,
                weight: k.dotPoints.length + review.length,
                questionCount: questions[k.id]?.length ?? 0,
                hasTutorial: tutorials.has(k.id),
              };
            }),
          })),
        })),
    };
    bundles.push({ course, questions, tutorials: [...tutorials.values()] });
  }
  return { bundles, errors, warnings };
}

/** LaTeX that should satisfy a spec: its own key, rendered as a student would type it. */
function keyAsLatex(spec: Exclude<QuestionT["parts"][number]["answer"], undefined>): string {
  switch (spec.type) {
    case "numeric":
    case "expression":
    case "equation":
      return String(spec.key);
    case "vector":
      return `\\left(${spec.key.join(",")}\\right)`;
    case "matrix":
      return `\\begin{pmatrix}${spec.key.map((r) => r.join("&")).join("\\\\")}\\end{pmatrix}`;
    case "set":
    case "list":
      return spec.key.join(",");
    default:
      return "";
  }
}

function findCycle(graph: Map<string, string[]>): string[] | null {
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (n: string): string[] | null => {
    if (state.get(n) === 2) return null;
    if (state.get(n) === 1) return [...stack.slice(stack.indexOf(n)), n];
    state.set(n, 1);
    stack.push(n);
    for (const p of graph.get(n) ?? []) {
      const c = visit(p);
      if (c) return c;
    }
    stack.pop();
    state.set(n, 2);
    return null;
  };
  for (const n of graph.keys()) {
    const c = visit(n);
    if (c) return c;
  }
  return null;
}
