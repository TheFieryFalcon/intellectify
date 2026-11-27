/**
 * Written answers are stored as text with mathematics between $ signs (SPEC §6.3), which the marker and
 * the Markdown renderer read. The editor shows the mathematics as maths; these split and join that text.
 */
export type Segment = { kind: "text"; text: string } | { kind: "math"; latex: string };

/** Split at $…$ (and $$…$$); "\$" is a literal dollar. An unclosed $ stays text. */
export function splitMath(src: string): Segment[] {
  const out: Segment[] = [];
  let text = "";
  let i = 0;
  while (i < src.length) {
    if (src[i] === "\\" && src[i + 1] === "$") {
      text += "\\$";
      i += 2;
      continue;
    }
    if (src[i] === "$") {
      const fence = src[i + 1] === "$" ? "$$" : "$";
      let j = i + fence.length;
      while (j < src.length && !(src.startsWith(fence, j) && src[j - 1] !== "\\")) j++;
      if (j < src.length) {
        if (text) out.push({ kind: "text", text });
        text = "";
        out.push({ kind: "math", latex: src.slice(i + fence.length, j).trim() });
        i = j + fence.length;
        continue;
      }
    }
    text += src[i];
    i++;
  }
  if (text) out.push({ kind: "text", text });
  return out;
}

/** Join segments back into stored text; empty maths is dropped. */
export function joinMath(segments: Segment[]): string {
  return segments.map((s) => (s.kind === "text" ? s.text : s.latex.trim() ? `$${s.latex.trim()}$` : "")).join("");
}
