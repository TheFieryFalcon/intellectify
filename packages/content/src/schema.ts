import { z } from "zod";

/* ───────────────────────── Curriculum (docs/SPEC.md §3, §3.1) ───────────────────────── */

const dotPoint = z.string().regex(/^\d+\.\d+\.\d+$/, "dot point IDs look like 1.2.6");

export const ExternalPrereq = z.object({
  course: z.string(),
  version: z.string(),
  dotPoints: z.array(dotPoint).min(1),
  note: z.string(),
});

export const Skill = z.object({
  id: z.string().regex(/^[a-z]+\.[a-z0-9-]+\.[a-z0-9-]+$/, "skill IDs look like spec.section.skill"),
  name: z.string().min(1),
  summary: z.string().min(1),
  /** SPEC §3.3: sets the question targets and how much it takes to rank up. */
  size: z.enum(["small", "medium", "large", "cornerstone"]),
  dotPoints: z.array(dotPoint).min(1),
  prereqs: z.array(z.string()).default([]),
  external: z.array(ExternalPrereq).default([]),
  /**
   * Subsections (SPEC §3): the specific points the skill covers, named in words ("Pascal's rule"), never by
   * dot-point number. Every question in the skill is tagged with one.
   */
  subsections: z.array(z.string().min(1).max(60)).default([]),
});

export const Section = z.object({
  id: z.string(),
  code: z.string().regex(/^\d\.\d$/),
  dotPointCount: z.number().int().positive(),
  name: z.string(),
  hours: z.number().positive(),
  reviewDotPoints: z.array(z.object({ dotPoints: z.array(dotPoint).min(1), skill: z.string() })).default([]),
  skills: z.array(Skill).min(1),
});

export const CurriculumVersion = z.object({
  id: z.string(),
  course: z.string(),
  year: z.union([z.literal(11), z.literal(12)]),
  source: z.object({ title: z.string(), publisher: z.string(), effectiveFrom: z.union([z.string(), z.date()]).transform(String) }),
  units: z.array(z.object({ number: z.number().int().min(1).max(4), sections: z.array(Section).min(1) })).min(1),
});

export const CourseManifest = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  skillIdPrefix: z.string(),
  versions: z.record(z.object({ current: z.string(), available: z.array(z.string()).min(1) })),
});

/* ───────────────────────── Questions (docs/SPEC.md §7, §9, §11.2) ───────────────────────── */

const formRule = z.enum([
  "exact",
  "simplified-fraction",
  "rationalized-denominator",
  "factored",
  "expanded",
  "cartesian",
  "polar",
  "exponential",
  "constant-of-integration",
]);
const varSpec = z.object({
  domain: z.tuple([z.number(), z.number()]).optional(),
  avoid: z.array(z.number()).optional(),
  complex: z.boolean().optional(),
});
const vars = z.record(varSpec).optional();
const common = { form: z.array(formRule).optional(), tolerance: z.number().positive().optional() };

export const AnswerSpec = z.discriminatedUnion("type", [
  z.object({ type: z.literal("numeric"), key: z.union([z.string(), z.number()]), sigFigs: z.number().int().positive().optional(), ...common }),
  z.object({ type: z.literal("expression"), key: z.string(), vars, samples: z.number().int().positive().optional(), upToConstant: z.boolean().optional(), ...common }),
  z.object({ type: z.literal("equation"), key: z.string(), vars, samples: z.number().int().positive().optional(), ...common }),
  z.object({ type: z.literal("vector"), key: z.array(z.string()).min(2).max(3), vars, ...common }),
  z.object({ type: z.literal("matrix"), key: z.array(z.array(z.string()).min(1)).min(1), vars, ...common }),
  z.object({ type: z.literal("set"), key: z.array(z.string()).min(1), vars, element: z.enum(["expression", "equation"]).optional(), ...common }),
  z.object({ type: z.literal("list"), key: z.array(z.string()).min(1), vars, element: z.enum(["expression", "equation"]).optional(), ...common }),
  z.object({ type: z.literal("mcq"), key: z.string() }),
  z.object({ type: z.literal("multi-select"), key: z.array(z.string()).min(1) }),
]);

export const Rubric = z.object({
  criteria: z.array(z.object({ id: z.string(), description: z.string(), points: z.number().positive(), dimension: z.string() })).min(1),
});

export const Part = z
  .object({
    id: z.string(),
    prompt: z.string().optional(),
    marks: z.number().positive().default(1),
    /** The part's own rating (SPEC §5.1); defaults to the question's. The question's rating is its hardest part's. */
    rating: z.number().int().min(1000).max(2400).optional(),
    /** Options for MCQ / multi-select parts. */
    options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
    answer: AnswerSpec.optional(),
    /** Free-response parts are LLM-marked against a rubric (Phase 1). */
    rubric: Rubric.optional(),
  })
  .refine((p) => Boolean(p.answer) !== Boolean(p.rubric), "a part needs exactly one of `answer` or `rubric`")
  .refine((p) => !(p.answer && (p.answer.type === "mcq" || p.answer.type === "multi-select")) || (p.options?.length ?? 0) >= 2, "MCQ parts need options");

export const Question = z.object({
  id: z.string().regex(/^[a-z0-9.-]+$/),
  version: z.number().int().positive().default(1),
  status: z.enum(["draft", "reviewed"]).default("draft"),
  skills: z.object({ primary: z.string(), secondary: z.array(z.string()).default([]) }),
  /** One of the primary skill's subsections (SPEC §3). */
  subsection: z.string().min(1).optional(),
  /** 1000 (incredibly easy) to 2000 (second-year uni); 2000+ is Tier 6. */
  rating: z.number().int().min(1000).max(2400),
  /**
   * Bookwork (SPEC §4): the task is to reproduce a proof the textbook teaches (a syllabus theorem or a standard
   * worked proof). Its ratings already include the 100-point bookwork discount.
   */
  bookwork: z.boolean().optional(),
  /** Difficulty per response skill, for auto-marked questions (SPEC §5.6). */
  responseSkills: z.record(z.number().int().min(1000).max(2400)).default({}),
  requiresCalculator: z.boolean().default(false),
  /** Which pool serves it (SPEC §8): practice, or a review pool that practice never serves. */
  pool: z.enum(["practice", "section-quiz", "unit-quiz", "challenge"]).default("practice"),
  /** Section Challenges only: sections of later units (same year) this problem draws on. Students may skip it (SPEC §8.4). */
  requires: z.array(z.string()).default([]),
  /** Short name for question lists; defaults to the id's last segment, humanized. */
  title: z.string().min(1).optional(),
  stem: z.string().min(1),
  parts: z.array(Part).min(1),
  solution: z.string().min(1),
  /** Pre-generated parameter sets; `{{name}}` placeholders are filled from one of these. */
  variants: z.array(z.record(z.union([z.string(), z.number()]))).optional(),
  /** Word variety (SPEC §9.6): slot → word list in content/words.yaml, picked at random on each serve. */
  words: z.record(z.string()).optional(),
  /** SymPy verification script, run offline (SPEC §11.3). */
  verify: z.string().optional(),
});

/** content/words.yaml: named word lists (SPEC §9.6). */
export const WordListsFile = z.record(z.array(z.union([z.string().min(1), z.record(z.string().min(1))])).min(2));

export const ResponseSkills = z.array(z.object({ id: z.string(), name: z.string() })).min(1);

export type SkillT = z.infer<typeof Skill>;
export type CurriculumVersionT = z.infer<typeof CurriculumVersion>;
export type CourseManifestT = z.infer<typeof CourseManifest>;
export type QuestionT = z.infer<typeof Question>;
export type AnswerSpecT = z.infer<typeof AnswerSpec>;

/** A part's rating: its own, or the question's (SPEC §5.1). */
export const partRating = (q: { rating: number }, p: { rating?: number }): number => p.rating ?? q.rating;
