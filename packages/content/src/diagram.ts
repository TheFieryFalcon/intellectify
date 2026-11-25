/**
 * Declarative diagrams (SPEC §9.4). A diagram is a fenced block in any Markdown (tutorials, stems,
 * solutions), written in YAML:
 *
 *   ```diagram
 *   view: [-1, 6, -1, 5]          # xmin, xmax, ymin, ymax (math coordinates, y up)
 *   points: { O: [0, 0], A: [4, 1], B: [1, 3] }
 *   draw:
 *     - { type: vector, from: O, to: A, label: '\mathbf{a}' }
 *     - { type: angle, at: O, from: A, to: B, label: '\theta' }
 *   ```
 *
 * Values may be `{{param}}` placeholders; they are filled before parsing. Browser-safe: no Node imports.
 */
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const num = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/, "expected a number")]).transform(Number);
const coord = z.tuple([num, num]);
const pt = z.union([z.string().min(1), coord]);
const dir = z.enum(["n", "ne", "e", "se", "s", "sw", "w", "nw", "c"]);
const color = z.enum(["ink", "accent", "muted", "good", "bad"]).default("ink");
const label = z.string().min(1).optional();

const Element = z.discriminatedUnion("type", [
  z.object({ type: z.literal("point"), at: pt, label, pos: dir.optional(), dot: z.boolean().default(true) }),
  z.object({ type: z.literal("segment"), from: pt, to: pt, label, side: z.enum(["left", "right"]).default("left"), dashed: z.boolean().default(false), ticks: z.number().int().min(0).max(3).default(0), color }),
  z.object({ type: z.literal("vector"), from: pt, to: pt, label, side: z.enum(["left", "right"]).default("left"), dashed: z.boolean().default(false), color: color.default("accent") }),
  z.object({ type: z.literal("angle"), at: pt, from: pt, to: pt, label, right: z.boolean().default(false), radius: z.number().positive().default(18) }),
  z.object({ type: z.literal("circle"), center: pt, radius: num.optional(), through: pt.optional(), dashed: z.boolean().default(false), color }),
  z.object({ type: z.literal("polygon"), points: z.array(pt).min(3), fill: z.boolean().default(false), dashed: z.boolean().default(false), color }),
  z.object({ type: z.literal("text"), at: pt, text: z.string().min(1), pos: dir.default("c") }),
  z.object({ type: z.literal("north"), at: pt, length: num.default(1) }),
]);

export const Diagram = z.object({
  /** xmin, xmax, ymin, ymax in math coordinates. */
  view: z.tuple([num, num, num, num]).refine(([x0, x1, y0, y1]) => x1 > x0 && y1 > y0, "view must be [xmin, xmax, ymin, ymax] with max > min"),
  /** Rendered width in pixels (the diagram scales down on narrow screens). */
  width: z.number().int().min(120).max(720).default(320),
  axes: z.boolean().default(false),
  grid: z.boolean().default(false),
  points: z.record(coord).default({}),
  draw: z.array(Element).min(1),
  /** Screen-reader description. */
  alt: z.string().optional(),
});
export type DiagramT = z.infer<typeof Diagram>;
type Pt = z.infer<typeof pt>;

/** Parse and validate a diagram's YAML. Throws an Error listing every problem. */
export function parseDiagram(yamlSrc: string): DiagramT {
  let raw: unknown;
  try {
    raw = parseYaml(yamlSrc);
  } catch (err) {
    throw new Error(`diagram YAML: ${(err as Error).message.split("\n")[0]}`);
  }
  const r = Diagram.safeParse(raw);
  if (!r.success) throw new Error(`diagram: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  const d = r.data;
  // Every named point must be defined.
  const refs: Pt[] = [];
  for (const e of d.draw) {
    if ("at" in e) refs.push(e.at);
    if ("from" in e) refs.push(e.from, e.to);
    if (e.type === "angle") refs.push(e.at);
    if (e.type === "circle") {
      refs.push(e.center);
      if (e.through) refs.push(e.through);
      if (e.radius === undefined && !e.through) throw new Error("diagram: a circle needs a radius or a through point");
    }
    if (e.type === "polygon") refs.push(...e.points);
  }
  for (const p of refs) if (typeof p === "string" && !(p in d.points)) throw new Error(`diagram: unknown point "${p}"`);
  return d;
}

/** Fenced diagram blocks in Markdown. */
export const DIAGRAM_BLOCK = /```diagram[^\S\n]*\n([\s\S]*?)```/g;

const COLOR: Record<string, string> = { ink: "var(--ink)", accent: "var(--accent)", muted: "var(--muted)", good: "var(--good)", bad: "var(--bad)" };
const PAD = 22;
const r1 = (n: number) => Math.round(n * 10) / 10;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Render a diagram to an SVG string. `tex` turns a LaTeX label into HTML (KaTeX in the app);
 * by default labels are shown as plain text.
 */
export function renderDiagram(d: DiagramT, tex: (latex: string) => string = esc): string {
  const [x0, x1, y0, y1] = d.view;
  const k = d.width / (x1 - x0);
  const W = d.width + 2 * PAD;
  const H = (y1 - y0) * k + 2 * PAD;
  const P = (p: Pt): [number, number] => {
    const [x, y] = typeof p === "string" ? d.points[p]! : p;
    return [PAD + (x - x0) * k, PAD + (y1 - y) * k];
  };
  const out: string[] = [];
  const labels: string[] = [];
  const usedColors = new Set<string>();

  /** A label anchored at (ax, ay), sitting on the side given by the unit direction (ux, uy) in screen space. */
  const putLabel = (text: string, ax: number, ay: number, ux: number, uy: number, gap = 7) => {
    const BW = 140, BH = 34;
    const x = ax + ux * gap, y = ay + uy * gap;
    const hx = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "center";
    const vy = uy > 0.35 ? "start" : uy < -0.35 ? "end" : "center";
    const bx = hx === "start" ? x : hx === "end" ? x - BW : x - BW / 2;
    const by = vy === "start" ? y : vy === "end" ? y - BH : y - BH / 2;
    labels.push(
      `<foreignObject x="${r1(bx)}" y="${r1(by)}" width="${BW}" height="${BH}"><div xmlns="http://www.w3.org/1999/xhtml" class="dl" style="justify-content:${hx === "center" ? "center" : `flex-${hx}`};align-items:${vy === "center" ? "center" : `flex-${vy}`}">${tex(text)}</div></foreignObject>`,
    );
  };
  const DIRS: Record<string, [number, number]> = { n: [0, -1], ne: [0.71, -0.71], e: [1, 0], se: [0.71, 0.71], s: [0, 1], sw: [-0.71, 0.71], w: [-1, 0], nw: [-0.71, -0.71], c: [0, 0] };

  // Grid and axes.
  if (d.grid) {
    for (let x = Math.ceil(x0); x <= x1; x++) out.push(`<line x1="${r1(PAD + (x - x0) * k)}" y1="${PAD}" x2="${r1(PAD + (x - x0) * k)}" y2="${r1(H - PAD)}" class="dg"/>`);
    for (let y = Math.ceil(y0); y <= y1; y++) out.push(`<line x1="${PAD}" y1="${r1(PAD + (y1 - y) * k)}" x2="${r1(W - PAD)}" y2="${r1(PAD + (y1 - y) * k)}" class="dg"/>`);
  }
  if (d.axes) {
    usedColors.add("muted");
    if (y0 <= 0 && y1 >= 0) {
      const [, ay] = P([0, 0]);
      out.push(`<line x1="${PAD - 6}" y1="${r1(ay)}" x2="${r1(W - PAD + 8)}" y2="${r1(ay)}" style="stroke:${COLOR.muted}" marker-end="url(#da-muted)"/>`);
      putLabel("x", W - PAD + 8, ay, 0, 1, 6);
    }
    if (x0 <= 0 && x1 >= 0) {
      const [ax] = P([0, 0]);
      out.push(`<line x1="${r1(ax)}" y1="${r1(H - PAD + 6)}" x2="${r1(ax)}" y2="${PAD - 8}" style="stroke:${COLOR.muted}" marker-end="url(#da-muted)"/>`);
      putLabel("y", ax, PAD - 8, 1, 0, 6);
    }
  }

  // Points named in `points` give a centroid, used to push point labels outward.
  const named = Object.values(d.points).map((c) => P(c));
  const cx = named.length ? named.reduce((t, p) => t + p[0], 0) / named.length : W / 2;
  const cy = named.length ? named.reduce((t, p) => t + p[1], 0) / named.length : H / 2;

  const lineLabel = (a: [number, number], b: [number, number], text: string, side: "left" | "right") => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    // Left of the direction of travel, as seen on screen.
    const s = side === "left" ? 1 : -1;
    const ux = (dy / len) * s, uy = (-dx / len) * s;
    putLabel(text, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ux, uy, 6);
  };

  for (const e of d.draw) {
    switch (e.type) {
      case "segment":
      case "vector": {
        const a = P(e.from), b = P(e.to);
        usedColors.add(e.color);
        const marker = e.type === "vector" ? ` marker-end="url(#da-${e.color})"` : "";
        // Stop vector lines short of the tip so the arrowhead stays sharp.
        let [bx, by] = b;
        if (e.type === "vector") {
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          bx -= ((b[0] - a[0]) / len) * 2;
          by -= ((b[1] - a[1]) / len) * 2;
        }
        out.push(`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(bx)}" y2="${r1(by)}" class="${e.type === "vector" ? "dv" : "ds"}${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"${marker}/>`);
        if (e.type === "segment" && e.ticks) {
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          const tx = (b[0] - a[0]) / len, ty = (b[1] - a[1]) / len;
          for (let i = 0; i < e.ticks; i++) {
            const o = (i - (e.ticks - 1) / 2) * 4;
            const px = mx + tx * o, py = my + ty * o;
            out.push(`<line x1="${r1(px - ty * 5)}" y1="${r1(py + tx * 5)}" x2="${r1(px + ty * 5)}" y2="${r1(py - tx * 5)}" class="ds" style="stroke:${COLOR[e.color]}"/>`);
          }
        }
        if (e.label) lineLabel(a, b, e.label, e.side);
        break;
      }
      case "point": {
        const [px, py] = P(e.at);
        if (e.dot) out.push(`<circle cx="${r1(px)}" cy="${r1(py)}" r="2.6" class="dp"/>`);
        if (e.label) {
          let u = e.pos ? DIRS[e.pos]! : [px - cx, py - cy];
          const n = Math.hypot(u[0]!, u[1]!);
          u = n > 1e-6 ? [u[0]! / n, u[1]! / n] : [0.71, -0.71];
          putLabel(e.label, px, py, u[0]!, u[1]!, 5);
        }
        break;
      }
      case "angle": {
        const o = P(e.at), a = P(e.from), b = P(e.to);
        const ta = Math.atan2(a[1] - o[1], a[0] - o[0]);
        let tb = Math.atan2(b[1] - o[1], b[0] - o[0]);
        let sweep = tb - ta;
        while (sweep <= -Math.PI) sweep += 2 * Math.PI;
        while (sweep > Math.PI) sweep -= 2 * Math.PI;
        tb = ta + sweep;
        const rad = e.radius;
        if (e.right) {
          const s = 10;
          const ua = [Math.cos(ta), Math.sin(ta)], ub = [Math.cos(tb), Math.sin(tb)];
          const p1 = [o[0] + ua[0]! * s, o[1] + ua[1]! * s], p3 = [o[0] + ub[0]! * s, o[1] + ub[1]! * s];
          const p2 = [p1[0]! + ub[0]! * s, p1[1]! + ub[1]! * s];
          out.push(`<path d="M${r1(p1[0]!)},${r1(p1[1]!)} L${r1(p2[0]!)},${r1(p2[1]!)} L${r1(p3[0]!)},${r1(p3[1]!)}" class="da"/>`);
        } else {
          const s1 = [o[0] + Math.cos(ta) * rad, o[1] + Math.sin(ta) * rad];
          const s2 = [o[0] + Math.cos(tb) * rad, o[1] + Math.sin(tb) * rad];
          out.push(`<path d="M${r1(s1[0]!)},${r1(s1[1]!)} A${rad},${rad} 0 0 ${sweep > 0 ? 1 : 0} ${r1(s2[0]!)},${r1(s2[1]!)}" class="da"/>`);
        }
        if (e.label) {
          const mid = ta + sweep / 2;
          const u = [Math.cos(mid), Math.sin(mid)];
          putLabel(e.label, o[0] + u[0]! * (rad + 2), o[1] + u[1]! * (rad + 2), u[0]!, u[1]!, 3);
        }
        break;
      }
      case "circle": {
        const c = P(e.center);
        let r: number;
        if (e.through) {
          const t = P(e.through);
          r = Math.hypot(t[0] - c[0], t[1] - c[1]);
        } else r = e.radius! * k;
        out.push(`<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(r)}" class="ds dn${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"/>`);
        break;
      }
      case "polygon": {
        const pts = e.points.map((p) => P(p).map(r1).join(",")).join(" ");
        out.push(`<polygon points="${pts}" class="ds${e.fill ? " df" : " dn"}${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"/>`);
        break;
      }
      case "text": {
        const [px, py] = P(e.at);
        const u = DIRS[e.pos]!;
        putLabel(e.text, px, py, u[0], u[1], e.pos === "c" ? 0 : 5);
        break;
      }
      case "north": {
        const [px, py] = P(e.at);
        const len = e.length * k;
        usedColors.add("muted");
        out.push(`<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px)}" y2="${r1(py - len)}" class="ds dd" style="stroke:${COLOR.muted}" marker-end="url(#da-muted)"/>`);
        putLabel("\\text{N}", px, py - len - 4, 0, -1, 2);
        break;
      }
    }
  }

  const markers = [...usedColors]
    .map((c) => `<marker id="da-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:${COLOR[c]}"/></marker>`)
    .join("");
  const alt = esc(d.alt ?? "Diagram");
  return `<svg class="diagram" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W)}" role="img" aria-label="${alt}"><defs>${markers}</defs>${out.join("")}${labels.join("")}</svg>`;
}

/** Replace every fenced diagram block in Markdown with `replace(spec)`. Errors go to `onError`. */
export function mapDiagrams(markdown: string, replace: (d: DiagramT) => string, onError: (err: Error) => string): string {
  return markdown.replace(DIAGRAM_BLOCK, (_, src: string) => {
    try {
      return replace(parseDiagram(src));
    } catch (err) {
      return onError(err as Error);
    }
  });
}
