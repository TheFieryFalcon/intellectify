import { mapDiagrams, renderDiagram } from "@intellectify/content/diagram";
import katex from "katex";
import { marked } from "marked";

/**
 * Render question Markdown with $inline$ and $$display$$ LaTeX.
 * Math is rendered first and swapped back in after Markdown, so Markdown never mangles it.
 * Content comes from our own reviewed question files, so the HTML is trusted.
 */
export function renderMarkdown(src: string, opts: { inline?: boolean } = {}): string {
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
  const html = opts.inline ? (marked.parseInline(protectedSrc, { async: false }) as string) : (marked.parse(protectedSrc, { async: false }) as string);
  return html
    .replace(/@@MATH(\d+)@@/g, (_, i: string) => math[Number(i)]!)
    .replace(/(?:<p>)?@@FIG(\d+)@@(?:<\/p>)?/g, (_, i: string) => figures[Number(i)]!);
}
