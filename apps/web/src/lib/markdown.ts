import { mapDiagrams, renderDiagram } from "@intellectify/content/diagram";
import katex from "katex";
import { marked } from "marked";

/**
 * Render question Markdown with $inline$ and $$display$$ LaTeX.
 * Math is rendered first and swapped back in after Markdown, so Markdown never mangles it.
 * Content comes from our own reviewed question files, so the HTML is trusted.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Glossary hovers (SPEC §3.2): the first mention of each term (or its plural) becomes a <dfn> with its
 * definition, shown on hover, tap or focus. Runs on the text with math and figures already set aside.
 */
export function linkGlossary(text: string, terms: { term: string; definition: string }[]): string {
  if (!terms.length) return text;
  const byKey = new Map(terms.map((t) => [t.term.toLowerCase(), t]));
  const sorted = [...byKey.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![\\w@-])(${sorted.map(reEsc).join("|")})(s|es)?(?![\\w@-])`, "gi");
  const used = new Set<string>();
  return text.replace(re, (whole: string, word: string) => {
    const t = byKey.get(word.toLowerCase());
    if (!t || used.has(t.term)) return whole;
    used.add(t.term);
    return `<dfn class="gloss" tabindex="0">${whole}<span class="gloss-def" role="tooltip"><strong>${esc(t.term)}</strong> ${esc(t.definition)}</span></dfn>`;
  });
}

/**
 * `breaks`: a single newline is a line break (a student's own writing keeps the lines they typed);
 * otherwise Markdown joins lines into one paragraph, as authored content expects.
 */
export function renderMarkdown(src: string, opts: { inline?: boolean; breaks?: boolean; glossary?: { term: string; definition: string }[] } = {}): string {
  // Diagrams first (SPEC §9.4): their YAML must not be touched by the math or Markdown passes.
  const figures: string[] = [];
  const tex = (t: string) => katex.renderToString(t, { throwOnError: false, strict: "ignore" });
  src = mapDiagrams(
    src,
    (d) => (figures.push(`<figure class="diagram-wrap">${renderDiagram(d, tex)}</figure>`), `\n\n@@FIG${figures.length - 1}@@\n\n`),
    (err) => (figures.push(`<pre class="diagram-error">${err.message.replace(/</g, "&lt;")}</pre>`), `\n\n@@FIG${figures.length - 1}@@\n\n`),
  );
  const math: string[] = [];
  const keep = (tex: string, displayMode: boolean) => {
    math.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false, strict: "ignore" }));
    return `@@MATH${math.length - 1}@@`;
  };
  const protectedSrc = src
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t: string) => keep(t, true))
    .replace(/(?<!\\)\$([^$]+?)\$/g, (_, t: string) => keep(t, false))
    .replace(/\\\$/g, "$");
  const linked = opts.glossary?.length ? linkGlossary(protectedSrc, opts.glossary) : protectedSrc;
  const breaks = !!opts.breaks;
  const html = opts.inline ? (marked.parseInline(linked, { async: false, breaks }) as string) : (marked.parse(linked, { async: false, breaks }) as string);
  return html
    .replace(/@@MATH(\d+)@@/g, (_, i: string) => math[Number(i)]!)
    .replace(/(?:<p>)?@@FIG(\d+)@@(?:<\/p>)?/g, (_, i: string) => figures[Number(i)]!);
}

/**
 * A student's own writing (discussion posts, SPEC §13.1): Markdown and LaTeX, no diagrams or glossary,
 * sanitized by `purify` (DOMPurify in the browser) before KaTeX output is swapped back in.
 * Spoilers: `||label: hidden||` or `||hidden||` become blurred spans revealed on click, with the label
 * (or "Spoiler") as a tooltip. Math and Markdown work inside them.
 */
export function renderUserMarkdown(src: string, purify: (html: string) => string): string {
  const math: string[] = [];
  const keep = (tex: string, displayMode: boolean) => {
    math.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false, strict: "ignore", trust: false, maxExpand: 500, maxSize: 20 }));
    return `@@MATH${math.length - 1}@@`;
  };
  const spoilers: { label: string; body: string }[] = [];
  const withSpoilers = src.replace(/\|\|([\s\S]+?)\|\|/g, (_, inner: string) => {
    const m = /^([^:$|\n]{1,60}):\s([\s\S]+)$/.exec(inner);
    spoilers.push(m ? { label: m[1]!.trim(), body: m[2]! } : { label: "", body: inner });
    return `@@SPOIL${spoilers.length - 1}@@`;
  });
  const protect = (t: string) =>
    t
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, x: string) => keep(x, true))
      .replace(/(?<!\\)\$([^$]+?)\$/g, (_, x: string) => keep(x, false))
      .replace(/\\\$/g, "$")
      // Raw HTML shows as typed (and "x < 3" stays text); the sanitizer is a second layer.
      .replace(/</g, "&lt;");
  const md = (t: string, inline: boolean) => purify((inline ? marked.parseInline(protect(t), { async: false, breaks: true }) : marked.parse(protect(t), { async: false, breaks: true })) as string);
  const spoilerHtml = spoilers.map(
    (sp) => `<span class="spoiler" tabindex="0" role="button" aria-label="${esc(sp.label ? `Spoiler: ${sp.label}` : "Spoiler")}" data-label="${esc(sp.label || "Spoiler")}"><span class="spoiler-body">${md(sp.body, true)}</span></span>`,
  );
  return md(withSpoilers, false)
    .replace(/@@SPOIL(\d+)@@/g, (_, i: string) => spoilerHtml[Number(i)]!)
    .replace(/@@MATH(\d+)@@/g, (_, i: string) => math[Number(i)]!);
}
