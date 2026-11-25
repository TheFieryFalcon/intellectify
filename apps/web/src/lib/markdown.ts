import katex from "katex";
import { marked } from "marked";

/**
 * Render question Markdown with $inline$ and $$display$$ LaTeX.
 * Math is rendered first and swapped back in after Markdown, so Markdown never mangles it.
 * Content comes from our own reviewed question files, so the HTML is trusted.
 */
export function renderMarkdown(src: string, opts: { inline?: boolean } = {}): string {
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
  return html.replace(/@@MATH(\d+)@@/g, (_, i: string) => math[Number(i)]!);
}
