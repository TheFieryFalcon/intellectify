import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { checkAnswer } from "@intellectify/checker";
import { dateOfDay, parseTermWeek, SKILL_SIZE, terms as ruleTerms, tierOf, type SchoolYear, type SkillSize } from "@intellectify/engine";
import { z } from "zod";
import { fillTemplate, wordParams, type WordLists, type WordPicks } from "./template.js";
import { diagramErrors } from "./diagram-check.js";
import { loadAchievements, type AchievementT } from "./achievements.js";
import { loadTutorials, type Tutorial } from "./tutorials.js";
import { CHALLENGE_RATING, challengeLength, QUIZ_MIX, QUIZ_POOL_FACTOR, slopeOf, type SectionReviews, type UnitReviews } from "./reviews.js";
import { CourseManifest, CurriculumVersion, Question, ResponseSkills, WordListsFile, type CourseManifestT, type CurriculumVersionT, type QuestionT } from "./schema.js";

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
  /** Named points within the skill (SPEC §3), in the order the curriculum lists them. */
  subsections: string[];
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
  /** When each year group learns each block of skills (SPEC §8.5), for the daily problem. */
  schedules: CourseSchedule[];
  /** WA school years from content/calendar (SPEC §8.6): term dates and exam periods. */
  calendars?: SchoolYear[];
}
/** A course outline: blocks of skills by school week (12-slot order, from parseTermWeek). */
export interface CourseSchedule {
  yearGroup: number;
  year: number;
  blocks: { from: number; to: number; name: string; skills: string[] }[];
}
const day = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const text = v instanceof Date ? v.toISOString().slice(0, 10) : v;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) ctx.addIssue({ code: "custom", message: `"${text}" isn't a date (YYYY-MM-DD)` });
  return text;
});
const CalendarFile = z.object({
  year: z.number().int().min(2020),
  terms: z.array(z.object({ term: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), start: day, end: day })).length(4),
  semesters: z.array(z.object({ semester: z.union([z.literal(1), z.literal(2)]), terms: z.array(z.number().int().min(1).max(4)).min(1) })).optional(),
  exams: z.array(z.object({ name: z.string().min(1), start: day, end: day, yearGroups: z.array(z.number().int()).optional() })).optional(),
});

/** Calendar files (SPEC §8.6): dates in order, terms within their year, and a note where they differ from the WA rule. */
export function loadCalendars(dir: string, errors: string[], warnings: string[]): SchoolYear[] {
  const out: SchoolYear[] = [];
  for (const file of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort() : []) {
    const parsed = CalendarFile.safeParse(readYaml(join(dir, file)));
    const where = `calendar/${file}`;
    if (!parsed.success) {
      errors.push(`${where}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    const cal = parsed.data as SchoolYear;
    if (file !== `${cal.year}.yaml`) errors.push(`${where}: year ${cal.year} belongs in ${cal.year}.yaml`);
    const sorted = [...cal.terms].sort((a, b) => a.term - b.term);
    if (sorted.some((t, i) => t.term !== i + 1)) errors.push(`${where}: needs Terms 1, 2, 3 and 4 once each`);
    sorted.forEach((t, i) => {
      const start = dateOfDay(t.start), end = dateOfDay(t.end);
      if (start.getUTCFullYear() !== cal.year || end.getUTCFullYear() !== cal.year) errors.push(`${where}: Term ${t.term} isn't in ${cal.year}`);
      if (end < start) errors.push(`${where}: Term ${t.term} ends before it starts`);
      if ([0, 6].includes(start.getUTCDay()) || [0, 6].includes(end.getUTCDay())) errors.push(`${where}: Term ${t.term} starts or ends on a weekend`);
      const next = sorted[i + 1];
      if (next && dateOfDay(next.start) <= end) errors.push(`${where}: Term ${next.term} starts before Term ${t.term} ends`);
    });
    for (const e of cal.exams ?? []) if (e.end < e.start) errors.push(`${where}: ${e.name} ends before it starts`);
    const rule = ruleTerms(cal.year);
    const differ = sorted.filter((t, i) => rule[i] && dateOfDay(t.start).getTime() !== rule[i]!.start.getTime()).map((t) => t.term);
    if (differ.length) warnings.push(`${where}: Term ${differ.join(", ")} starts differ from the WA rule (fine if the published dates say so)`);
    out.push(cal);
  }
  return out;
}

const ScheduleFile = z.object({
  course: z.string(),
  yearGroup: z.number().int().min(7).max(12),
  year: z.number().int().min(2020),
  blocks: z.array(z.object({ from: z.string(), to: z.string(), name: z.string().min(1), dotPoints: z.array(z.string()).min(1) })).min(1),
});
export interface BuildResult {
  bundles: {
    course: CourseBundle;
    /** Practice pools, by primary skill. */
    questions: Record<string, QuestionT[]>;
    /** Review pools (SPEC §8): by section ID, and by unit number. */
    sectionReviews: Record<string, SectionReviews<QuestionT>>;
    unitReviews: Record<number, UnitReviews<QuestionT>>;
    tutorials: Tutorial[];
  }[];
  achievements: AchievementT[];
  /** Word lists (SPEC §9.6), shared by every course. */
  words: WordLists;
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
  const wordsParsed = WordListsFile.safeParse(readYaml(join(contentDir, "words.yaml")));
  if (!wordsParsed.success) errors.push(`words.yaml: ${wordsParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  const words: WordLists = wordsParsed.success ? wordsParsed.data : {};
  const calendars = loadCalendars(join(contentDir, "calendar"), errors, warnings);

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
    const skillSection = new Map<string, string>();
    /** Section ID → its unit and year, for `requires` checks. */
    const sectionPlace = new Map<string, { unit: number; year: number }>();
    const prereqsOf = new Map<string, string[]>();
    const reviewFor = new Map<string, string[]>();
    /** Skill ID → its subsections (SPEC §3). */
    const subsectionsOf = new Map<string, string[]>();
    for (const v of versions) {
      for (const u of v.units) {
        for (const s of u.sections) {
          sectionPlace.set(s.id, { unit: u.number, year: v.year });
          const covered: string[] = [];
          for (const k of s.skills) {
            if (skillUnit.has(k.id)) errors.push(`duplicate skill ID ${k.id}`);
            if (!k.id.startsWith(`${manifest.skillIdPrefix}.${s.id}.`)) errors.push(`${k.id}: ID should start with ${manifest.skillIdPrefix}.${s.id}.`);
            skillUnit.set(k.id, u.number);
            skillSection.set(k.id, s.id);
            prereqsOf.set(k.id, k.prereqs);
            subsectionsOf.set(k.id, k.subsections);
            if (new Set(k.subsections).size !== k.subsections.length) errors.push(`${k.id}: duplicate subsection`);
            for (const n of k.subsections) if (/^\d+(\.\d+)*$/.test(n.trim())) errors.push(`${k.id}: subsection "${n}" should be named in words, not by number`);
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
    const sectionReviews: Record<string, SectionReviews<QuestionT>> = {};
    const unitReviews: Record<number, UnitReviews<QuestionT>> = {};
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
        // Every question names one of its primary skill's subsections (SPEC §3).
        const subs = subsectionsOf.get(q.skills.primary) ?? [];
        if (!q.subsection) errors.push(`${where}: no subsection${subs.length ? ` (one of: ${subs.join("; ")})` : ` (${q.skills.primary} lists none yet)`}`);
        else if (!subs.includes(q.subsection)) errors.push(`${where}: subsection "${q.subsection}" isn't one of ${q.skills.primary}'s (${subs.join("; ") || "none listed"})`);
        for (const r of Object.keys(q.responseSkills)) if (!rsIds.has(r)) errors.push(`${where}: unknown response skill ${r}`);
        // Response-skill tagging rules (SPEC §5.6).
        if (!Object.keys(q.responseSkills).length) errors.push(`${where}: no response skills`);
        for (const c of q.parts.flatMap((p) => p.rubric?.criteria ?? [])) {
          if (!rsIds.has(c.dimension)) errors.push(`${where}: rubric criterion ${c.id} has unknown dimension ${c.dimension}`);
          else if (!(c.dimension in q.responseSkills)) errors.push(`${where}: rubric dimension ${c.dimension} isn't in responseSkills`);
        }
        if (q.skills.secondary.length && !("synthesis" in q.responseSkills)) errors.push(`${where}: cross-skill questions exercise synthesis`);
        if (q.parts.some((p) => p.answer && p.answer.type !== "mcq" && p.answer.type !== "multi-select") && !("calculation" in q.responseSkills))
          errors.push(`${where}: a computed answer exercises calculation`);
        if (tierOf(q.rating) === 6 && !q.parts.every((p) => p.rubric)) warnings.push(`${where}: Tier 6 questions are normally milestone-marked free response`);
        // Word variety (SPEC §9.6): known lists, and words never reach an answer or the verify code.
        const firstPicks: WordPicks | null = q.words ? Object.fromEntries(Object.keys(q.words).map((slot) => [slot, 0])) : null;
        for (const [slot, list] of Object.entries(q.words ?? {})) {
          if (!words[list]) errors.push(`${where}: words slot ${slot} uses unknown list ${list}`);
          if (!/^[a-z]\w*$/.test(slot) || (q.variants ?? []).some((v) => slot in v)) errors.push(`${where}: words slot ${slot} must be a plain name not used by a variant`);
          const used = new RegExp(`\\{\\{\\s*${slot}(\\.\\w+)?\\s*\\}\\}`);
          if (q.parts.some((p) => p.answer && used.test(JSON.stringify(p.answer))) || used.test(q.verify ?? "")) errors.push(`${where}: words slot ${slot} can't change an answer`);
          if (![q.stem, q.solution, ...q.parts.map((p) => p.prompt ?? "")].some((t) => used.test(t))) warnings.push(`${where}: words slot ${slot} is never used`);
        }
        // MCQ keys and diagrams may be templated ({{key}}), so check them once per filled variant.
        for (const params of q.variants ?? [{}]) {
          const filled = fillTemplate(q, { ...params, ...wordParams(q.words, firstPicks, words) });
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
          const filled = fillTemplate(q, { ...params, ...wordParams(q.words, firstPicks, words) });
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
        // Later-unit content (SPEC §8.4): Challenges only, a later unit, and never across from Year 11 to Year 12.
        for (const id of q.requires) {
          const at = sectionPlace.get(id);
          const home = skillUnit.has(q.skills.primary) ? sectionPlace.get(skillSection.get(q.skills.primary)!) : undefined;
          if (q.pool !== "challenge") errors.push(`${where}: only Section Challenge problems may require later content`);
          else if (!at) errors.push(`${where}: requires unknown section ${id}`);
          else if (home && at.unit <= home.unit) errors.push(`${where}: ${id} isn't in a later unit, so it isn't "later content"`);
          else if (home && at.year !== home.year) errors.push(`${where}: a Year ${home.year} Challenge can't require Year ${at.year} content (${id})`);
        }
        // Ratings are per part (SPEC §5.1); the question's rating is its hardest part's, so an easy part never lowers it.
        const own = q.parts.filter((p) => p.rating !== undefined).map((p) => p.rating!);
        if (own.some((r) => r > q.rating)) errors.push(`${where}: a part is rated above the question; the question's rating must be its hardest part's`);
        if (own.length === q.parts.length && own.length && Math.max(...own) !== q.rating) errors.push(`${where}: the question's rating (${q.rating}) must equal its hardest part's (${Math.max(...own)})`);
        if (q.pool === "practice") (questions[q.skills.primary] ??= []).push(q);
        else if (skillUnit.has(q.skills.primary)) {
          if (q.pool === "challenge" && (q.rating < CHALLENGE_RATING[0] || q.rating >= CHALLENGE_RATING[1])) errors.push(`${where}: Section Challenge problems are Tier 4–5`);
          if (q.pool === "unit-quiz") (unitReviews[skillUnit.get(q.skills.primary)!] ??= { unitQuiz: [] }).unitQuiz.push(q);
          else {
            const r = (sectionReviews[skillSection.get(q.skills.primary)!] ??= { sectionQuiz: [], challenge: [] });
            (q.pool === "challenge" ? r.challenge : r.sectionQuiz).push(q);
          }
        }
      }
    }

    // Course outlines (SPEC §8.5): dot points become skills, weeks become 12-slot orders.
    const schedules: CourseSchedule[] = [];
    const schedDir = join(contentDir, "schedules");
    const allSkills = versions.flatMap((v) => v.units.flatMap((u) => u.sections.flatMap((s) => s.skills)));
    const knownDots = new Set(allSkills.flatMap((k) => k.dotPoints));
    for (const file of existsSync(schedDir) ? readdirSync(schedDir).filter((f) => f.endsWith(".yaml")) : []) {
      const parsed = ScheduleFile.safeParse(readYaml(join(schedDir, file)));
      if (!parsed.success) {
        errors.push(`schedules/${file}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        continue;
      }
      if (parsed.data.course !== manifest.id) continue;
      const blocks = parsed.data.blocks.map((b, i) => {
        const from = parseTermWeek(b.from), to = parseTermWeek(b.to);
        if (from === null || to === null || to < from) errors.push(`schedules/${file} block ${i + 1}: bad weeks "${b.from}" to "${b.to}"`);
        for (const d of b.dotPoints) if (!knownDots.has(d)) errors.push(`schedules/${file} block ${i + 1}: unknown dot point ${d}`);
        const skills = allSkills.filter((k) => k.dotPoints.some((d) => b.dotPoints.includes(d))).map((k) => k.id);
        if (!skills.length) errors.push(`schedules/${file} block ${i + 1}: no skill covers its dot points`);
        return { from: from ?? 0, to: to ?? 0, name: b.name, skills };
      });
      schedules.push({ yearGroup: parsed.data.yearGroup, year: parsed.data.year, blocks });
    }

    const unitYear = new Map<number, number>();
    versions.forEach((v) => v.units.forEach((u) => unitYear.set(u.number, v.year)));
    const course: CourseBundle = {
      id: manifest.id,
      name: manifest.name,
      versions: versions.map((v) => ({ year: v.year, id: v.id, effectiveFrom: v.source.effectiveFrom })),
      responseSkills,
      schedules,
      calendars,
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
              for (const n of k.subsections) if (qs.length && !qs.some((q) => q.subsection === n)) warnings.push(`${k.id}: no practice questions in subsection "${n}"`);
              return {
                id: k.id,
                name: k.name,
                summary: k.summary,
                size: k.size,
                dotPoints: k.dotPoints,
                reviewDotPoints: review,
                prereqs: k.prereqs,
                external: k.external,
                subsections: k.subsections,
                weight: k.dotPoints.length + review.length,
                questionCount: questions[k.id]?.length ?? 0,
                hasTutorial: tutorials.has(k.id),
              };
            }),
          })),
        })),
    };
    // Review pools (SPEC §8): enough for varied retakes, checked once a pool has any questions.
    const tierCount = (qs: QuestionT[]) => qs.reduce<Record<number, number>>((m, q) => ((m[tierOf(q.rating)] = (m[tierOf(q.rating)] ?? 0) + 1), m), {});
    const checkQuiz = (name: string, qs: QuestionT[], mix: Partial<Record<number, number>>) => {
      if (!qs.length) return;
      const have = tierCount(qs);
      for (const [t, n] of Object.entries(mix)) if ((have[Number(t)] ?? 0) < n! * QUIZ_POOL_FACTOR) warnings.push(`${name}: ${have[Number(t)] ?? 0} Tier ${t} questions; needs ${n! * QUIZ_POOL_FACTOR}`);
    };
    for (const u of course.units) {
      checkQuiz(`unit ${u.number} quiz pool`, unitReviews[u.number]?.unitQuiz ?? [], QUIZ_MIX.unit);
      for (const s of u.sections) {
        const r = sectionReviews[s.id];
        if (!r) continue;
        checkQuiz(`${s.id} section quiz pool`, r.sectionQuiz, QUIZ_MIX.section);
        // The Section Challenge (SPEC §8.4): a fixed sequence, file order, climbing to one black finale.
        const ch = r.challenge;
        if (!ch.length) continue;
        const len = challengeLength(s.skills.reduce((t, k) => t + k.dotPoints.length, 0));
        if (ch.length !== len) warnings.push(`${s.id} Challenge: ${ch.length} problems; should be ${len}`);
        ch.forEach((q, i) => i > 0 && q.rating < ch[i - 1]!.rating && errors.push(`${s.id} Challenge: ${q.id} is easier than the problem before it`));
        const blacks = ch.filter((q) => slopeOf(q.rating) === "black");
        if (blacks.length !== 1 || slopeOf(ch.at(-1)!.rating) !== "black") errors.push(`${s.id} Challenge: needs exactly one black problem (rated 1950–1999), last`);
        for (const g of ["green", "yellow", "red"] as const) if (!ch.some((q) => slopeOf(q.rating) === g)) warnings.push(`${s.id} Challenge: no ${g} problem`);
        const cross = ch.filter((q) => q.skills.secondary.length).length;
        if (cross * 3 < len) warnings.push(`${s.id} Challenge: ${cross} cross-skill problems; needs ${Math.ceil(len / 3)}`);
      }
    }
    bundles.push({ course, questions, sectionReviews, unitReviews, tutorials: [...tutorials.values()] });
  }
  return { bundles, achievements: loadAchievements(contentDir, errors), words, errors, warnings };
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
    case "interval":
    case "complex":
      return spec.key;
    case "features":
      return spec.features.map((f) => (f.key.length ? f.key.join(",") : "none")).join("\n");
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
