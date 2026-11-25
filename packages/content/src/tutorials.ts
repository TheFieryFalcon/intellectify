import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { diagramErrors } from "./diagram-check.js";

/**
 * Tutorials (docs/SPEC.md §3.2): one Markdown file per skill at
 * content/tutorials/<course>/<skillId>.md, with YAML front matter.
 */
export const TutorialFront = z.object({
  skill: z.string(),
  status: z.enum(["draft", "reviewed"]).default("draft"),
  /** Glossary terms this tutorial defines (each defined exactly once per course). */
  terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).default([]),
});

export interface Tutorial {
  skill: string;
  status: "draft" | "reviewed";
  terms: { term: string; definition: string }[];
  markdown: string;
  proseWords: number;
  examples: number;
}

const REQUIRED_HEADINGS = ["## Key ideas", "## Method", "## Worked examples"];
export const PROSE_WARN = 700;
export const PROSE_MAX = 1000;

/** Words of explanatory prose: excludes worked examples, display/inline math and headings. */
export function proseWordCount(markdown: string): number {
  const beforeExamples = markdown.split(/^## Worked examples/m)[0] ?? "";
  const after = markdown.split(/^## Watch out/m)[1] ?? "";
  const text = (beforeExamples + "\n" + after)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/^#+ .*$/gm, " ")
    .replace(/[*_`>|-]/g, " ");
  return text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
}

export function loadTutorials(contentDir: string, course: string, skillDotPoints: Map<string, string[]>, errors: string[], warnings: string[]): Map<string, Tutorial> {
  const dir = join(contentDir, "tutorials", course);
  const out = new Map<string, Tutorial>();
  const termOwner = new Map<string, string>();
  if (!existsSync(dir)) {
    warnings.push(`${course}: no tutorials yet`);
    return out;
  }
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const raw = readFileSync(join(dir, name), "utf8");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const where = `tutorials/${course}/${name}`;
    if (!m) {
      errors.push(`${where}: missing front matter`);
      continue;
    }
    const front = TutorialFront.safeParse(parseYaml(m[1]!));
    if (!front.success) {
      errors.push(`${where}: ${front.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    const { skill, status, terms } = front.data;
    const markdown = m[2]!.trim();
    if (`${skill}.md` !== name) errors.push(`${where}: file name should be ${skill}.md`);
    if (!skillDotPoints.has(skill)) errors.push(`${where}: unknown skill ${skill}`);
    for (const h of REQUIRED_HEADINGS) if (!markdown.includes(`\n${h}`) && !markdown.startsWith(h)) errors.push(`${where}: missing heading "${h}"`);
    for (const e of diagramErrors(markdown)) errors.push(`${where}: ${e}`);
    const examples = (markdown.match(/^### Example/gm) ?? []).length;
    if (examples < 1 || examples > 3) errors.push(`${where}: needs 1–3 worked examples ("### Example …"), found ${examples}`);
    const proseWords = proseWordCount(markdown);
    if (proseWords > PROSE_MAX) errors.push(`${where}: ${proseWords} words of prose; the limit is ${PROSE_MAX}`);
    else if (proseWords > PROSE_WARN) warnings.push(`${where}: ${proseWords} words of prose; aim for at most ${PROSE_WARN}`);
    const watchOut = markdown.split(/^## Watch out/m)[1];
    if (watchOut && (watchOut.match(/^- /gm) ?? []).length > 3) errors.push(`${where}: "Watch out" has more than three points`);
    // Metadata (dot points, prerequisites) is rendered from the curriculum, not written in the body (SPEC §3.2, §15.1).
    if (!markdown.startsWith("## Key ideas")) errors.push(`${where}: the body must start at "## Key ideas"; dot points and prerequisites are shown from the curriculum`);
    for (const t of terms) {
      const key = t.term.toLowerCase();
      if (termOwner.has(key)) errors.push(`${where}: glossary term "${t.term}" is already defined by ${termOwner.get(key)}`);
      else termOwner.set(key, skill);
    }
    out.set(skill, { skill, status, terms, markdown, proseWords, examples });
  }
  return out;
}
