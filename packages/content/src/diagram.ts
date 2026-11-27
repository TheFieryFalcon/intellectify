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
 * Graphs: `function` (y in terms of x, broken at asymptotes), `parametric` (x and y, and z in 3D, in terms
 * of t), `line` (infinite, clipped to the view), `ray`, `region` (shaded between two graphs), `slopefield`
 * (dy/dx in terms of x and y), and `axes` with ticks (multiples of π shown as fractions of π).
 * 3D: give `projection` and three-number points; the view fits itself. `sphere` is 3D only.
 *
 * Numbers may be written as formulas ("pi/2", "2sqrt(3)") and as `{{param}}` placeholders, filled before
 * parsing. Browser-safe: no Node imports.
 */
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { compile, evalConst } from "./expr.js";

/** A number, or a constant formula such as "pi/3" or "2sqrt(3)". */
const num = z.union([z.number(), z.string()]).transform((v, ctx) => {
  try {
    return evalConst(v);
  } catch (err) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `expected a number: ${(err as Error).message}` });
    return z.NEVER;
  }
});
const coord = z.union([z.tuple([num, num, num]), z.tuple([num, num])]);
const pt = z.union([z.string().min(1), coord]);
const dir = z.enum(["n", "ne", "e", "se", "s", "sw", "w", "nw", "c"]);
const color = z.enum(["ink", "accent", "muted", "good", "bad"]).default("ink");
const label = z.string().min(1).optional();
const formula = z.union([z.string().min(1), z.number().transform(String)]);

const Element = z.discriminatedUnion("type", [
  z.object({ type: z.literal("point"), at: pt, label, pos: dir.optional(), dot: z.boolean().default(true), open: z.boolean().default(false) }),
  z.object({ type: z.literal("segment"), from: pt, to: pt, label, side: z.enum(["left", "right"]).default("left"), dashed: z.boolean().default(false), ticks: z.number().int().min(0).max(3).default(0), color }),
  z.object({ type: z.literal("vector"), from: pt, to: pt, label, side: z.enum(["left", "right"]).default("left"), dashed: z.boolean().default(false), color: color.default("accent") }),
  z.object({ type: z.literal("angle"), at: pt, from: pt, to: pt, label, right: z.boolean().default(false), radius: z.number().positive().default(18) }),
  z.object({ type: z.literal("circle"), center: pt, radius: num.optional(), through: pt.optional(), dashed: z.boolean().default(false), fill: z.boolean().default(false), color }),
  z.object({ type: z.literal("polygon"), points: z.array(pt).min(3), fill: z.boolean().default(false), dashed: z.boolean().default(false), color }),
  z.object({ type: z.literal("text"), at: pt, text: z.string().min(1), pos: dir.default("c") }),
  z.object({ type: z.literal("north"), at: pt, length: num.default(1) }),
  /** y = fn(x). `domain` limits x; `labelAt` is the x where the label sits. */
  z.object({ type: z.literal("function"), fn: formula, domain: z.tuple([num, num]).optional(), label, labelAt: num.optional(), dashed: z.boolean().default(false), color: color.default("accent") }),
  /** (x(t), y(t)), or (x, y, z) in 3D, for t in `t`. */
  z.object({ type: z.literal("parametric"), x: formula, y: formula, z: formula.optional(), t: z.tuple([num, num]), label, dashed: z.boolean().default(false), color: color.default("accent") }),
  /** An infinite line: through two points, x = c, y = c, or y = slope·x + intercept. */
  z.object({ type: z.literal("line"), through: z.tuple([pt, pt]).optional(), x: num.optional(), y: num.optional(), slope: num.optional(), intercept: num.optional(), label, dashed: z.boolean().default(false), color }),
  /** A ray from a point, through another point or at an angle (degrees, anticlockwise from the positive x-axis). */
  z.object({ type: z.literal("ray"), from: pt, through: pt.optional(), angle: num.optional(), open: z.boolean().default(false), label, dashed: z.boolean().default(false), color }),
  /** The area between y = fn(x) and y = fn2(x) (default the x-axis), for x from `from` to `to`. */
  z.object({ type: z.literal("region"), fn: formula, fn2: formula.default("0"), from: num, to: num, color: color.default("accent") }),
  /** Short segments with slope dydx(x, y) at grid points `step` apart. */
  z.object({ type: z.literal("slopefield"), dydx: formula, step: num.default(1), color: color.default("muted") }),
  /** 3D only: a sphere's outline and (dashed) equator. */
  z.object({ type: z.literal("sphere"), center: pt, radius: num, color }),
]);

const Axes = z.union([
  z.boolean(),
  z.object({
    /** Axis labels (LaTeX); defaults x, y, z. For an Argand diagram: '\text{Re}' and '\text{Im}'. */
    x: z.string().optional(),
    y: z.string().optional(),
    z: z.string().optional(),
    /** Tick spacing: one value for both axes or [x, y]. A spacing with pi in it labels ticks in multiples of π. */
    ticks: z.union([formula, z.tuple([formula, formula])]).optional(),
    /** Number the ticks (default true when there are ticks). */
    numbers: z.boolean().default(true),
    /** 3D: how far each axis runs from the origin. */
    length: num.optional(),
  }),
]);

export const Diagram = z
  .object({
    /** xmin, xmax, ymin, ymax in math coordinates. Optional in 3D, where the view fits the drawing. */
    view: z
      .tuple([num, num, num, num])
      .refine(([x0, x1, y0, y1]) => x1 > x0 && y1 > y0, "view must be [xmin, xmax, ymin, ymax] with max > min")
      .optional(),
    /** Rendered width in pixels (the diagram scales down on narrow screens). */
    width: z.number().int().min(120).max(720).default(320),
    axes: Axes.default(false),
    grid: z.boolean().default(false),
    /** 3D: look from this direction (degrees). Points then take three coordinates. */
    projection: z.object({ azimuth: num.default(30), elevation: num.default(20) }).optional(),
    points: z.record(coord).default({}),
    draw: z.array(Element).min(1),
    /** Screen-reader description. */
    alt: z.string().optional(),
  })
  .refine((d) => d.view || d.projection, { message: "view is required (except in 3D, where it fits the drawing)", path: ["view"] });
export type DiagramT = z.infer<typeof Diagram>;
type Pt = z.infer<typeof pt>;
type ElementT = z.infer<typeof Element>;

const FORMULA_VARS: Record<string, readonly string[]> = { function: ["x"], region: ["x"], parametric: ["t"], slopefield: ["x", "y"] };

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
  const is3d = !!d.projection;
  // Every named point must be defined, with the right number of coordinates.
  for (const [name, c] of Object.entries(d.points)) if (c.length !== (is3d ? 3 : 2)) throw new Error(`diagram: point ${name} needs ${is3d ? 3 : 2} coordinates`);
  const refs: Pt[] = [];
  for (const e of d.draw) {
    if ("at" in e) refs.push(e.at);
    if ("from" in e && typeof e.from !== "number") refs.push(e.from as Pt);
    if ("to" in e && typeof e.to !== "number") refs.push(e.to as Pt);
    if (e.type === "circle") {
      refs.push(e.center);
      if (e.through) refs.push(e.through);
      if (e.radius === undefined && !e.through) throw new Error("diagram: a circle needs a radius or a through point");
      if (is3d) throw new Error("diagram: circles are 2D only (use sphere, or a parametric curve, in 3D)");
    }
    if (e.type === "polygon") refs.push(...e.points);
    if (e.type === "sphere") {
      refs.push(e.center);
      if (!is3d) throw new Error("diagram: a sphere needs a projection (3D)");
    }
    if (e.type === "line") {
      const ways = [e.through, e.x, e.y, e.slope].filter((v) => v !== undefined).length;
      if (ways !== 1) throw new Error("diagram: a line needs exactly one of through, x, y or slope");
      if (e.through) refs.push(...e.through);
      if (is3d && !e.through) throw new Error("diagram: in 3D a line needs through: [P, Q]");
    }
    if (e.type === "ray") {
      if ((e.through === undefined) === (e.angle === undefined)) throw new Error("diagram: a ray needs exactly one of through or angle");
      if (e.through) refs.push(e.through);
      if (is3d && !e.through) throw new Error("diagram: in 3D a ray needs a through point");
    }
    if ((e.type === "function" || e.type === "region" || e.type === "slopefield") && is3d) throw new Error(`diagram: ${e.type} is 2D only`);
    if (e.type === "parametric" && !is3d && e.z !== undefined) throw new Error("diagram: a parametric z needs a projection (3D)");
    if (e.type === "parametric" && is3d && e.z === undefined) throw new Error("diagram: in 3D a parametric curve needs z");
    // Formulas must compile, in the variables their element allows.
    const vars = FORMULA_VARS[e.type];
    if (vars) {
      const srcs =
        e.type === "parametric" ? [e.x, e.y, ...(e.z ? [e.z] : [])] : e.type === "region" ? [e.fn, e.fn2] : e.type === "slopefield" ? [e.dydx] : e.type === "function" ? [e.fn] : [];
      for (const s of srcs) {
        try {
          compile(s, vars);
        } catch (err) {
          throw new Error(`diagram: ${e.type} "${s}": ${(err as Error).message}`);
        }
      }
    }
  }
  for (const p of refs) {
    if (typeof p === "string" && !(p in d.points)) throw new Error(`diagram: unknown point "${p}"`);
    if (typeof p !== "string" && p.length !== (is3d ? 3 : 2)) throw new Error(`diagram: [${p.join(", ")}] needs ${is3d ? 3 : 2} coordinates`);
  }
  // "\\" in a label is a LaTeX line break, which is almost always a doubled backslash by mistake.
  for (const e of d.draw) {
    const text = "label" in e ? e.label : e.type === "text" ? e.text : undefined;
    if (text?.includes("\\\\")) throw new Error(`diagram: label "${text}" contains a doubled backslash`);
  }
  if (d.axes && typeof d.axes === "object" && d.axes.ticks !== undefined) {
    for (const t of Array.isArray(d.axes.ticks) ? d.axes.ticks : [d.axes.ticks]) {
      const v = evalConst(t);
      if (!(v > 0)) throw new Error(`diagram: tick spacing "${t}" must be positive`);
    }
  }
  return d;
}

/** Fenced diagram blocks in Markdown. */
export const DIAGRAM_BLOCK = /```diagram[^\S\n]*\n([\s\S]*?)```/g;

const COLOR: Record<string, string> = { ink: "var(--ink)", accent: "var(--accent)", muted: "var(--muted)", good: "var(--good)", bad: "var(--bad)" };
const PAD = 22;
const r1 = (n: number) => Math.round(n * 10) / 10;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const DEG = Math.PI / 180;
/** Unique clip-path ids when several diagrams share a page. */
let clipSeq = 0;

/** A tick value as LaTeX: multiples of π as fractions of π when the spacing is in π. */
export function tickLabel(v: number, inPi: boolean): string {
  if (inPi) {
    const r = v / Math.PI;
    for (let q = 1; q <= 12; q++) {
      const p = Math.round(r * q);
      if (Math.abs(p / q - r) < 1e-9) {
        if (p === 0) return "0";
        const sign = p < 0 ? "-" : "";
        const a = Math.abs(p);
        const top = a === 1 ? "\\pi" : `${a}\\pi`;
        return q === 1 ? `${sign}${top}` : `${sign}\\frac{${top}}{${q}}`;
      }
    }
  }
  return String(Number(v.toFixed(3)));
}

/** The part of the line p + t·d inside the box, for t in [tMin, tMax] (Liang–Barsky), or null. */
function clipLine(p: [number, number], dv: [number, number], box: [number, number, number, number], tMin = -Infinity, tMax = Infinity): [number, number] | null {
  let [lo, hi] = [tMin, tMax];
  const [x0, x1, y0, y1] = box;
  const tests: [number, number][] = [
    [-dv[0], p[0] - x0],
    [dv[0], x1 - p[0]],
    [-dv[1], p[1] - y0],
    [dv[1], y1 - p[1]],
  ];
  for (const [pp, q] of tests) {
    if (Math.abs(pp) < 1e-12) {
      if (q < 0) return null;
    } else {
      const t = q / pp;
      if (pp < 0) lo = Math.max(lo, t);
      else hi = Math.min(hi, t);
    }
  }
  return lo <= hi && Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null;
}

/**
 * Render a diagram to an SVG string. `tex` turns a LaTeX label into HTML (KaTeX in the app);
 * by default labels are shown as plain text.
 */
export function renderDiagram(d: DiagramT, tex: (latex: string) => string = esc): string {
  // 3D points project onto the screen plane (orthographic), in math units.
  const proj = d.projection;
  const right = proj ? [-Math.sin(proj.azimuth * DEG), Math.cos(proj.azimuth * DEG), 0] : null;
  const up = proj
    ? [-Math.cos(proj.azimuth * DEG) * Math.sin(proj.elevation * DEG), -Math.sin(proj.azimuth * DEG) * Math.sin(proj.elevation * DEG), Math.cos(proj.elevation * DEG)]
    : null;
  const flat = (c: number[]): [number, number] =>
    right && up ? [c[0]! * right[0]! + c[1]! * right[1]! + c[2]! * right[2]!, c[0]! * up[0]! + c[1]! * up[1]! + c[2]! * up[2]!] : [c[0]!, c[1]!];
  const coordOf = (p: Pt): number[] => (typeof p === "string" ? d.points[p]! : p);
  const M = (p: Pt) => flat(coordOf(p));

  const is3d = !!proj;
  const axes = d.axes === true ? { numbers: true } : d.axes || null;
  const axisLength = axes && "length" in axes && axes.length !== undefined ? axes.length : null;

  // Sample parametric curves once: they feed both the drawing and (in 3D) the fitted view.
  const curves = new Map<ElementT, ([number, number] | null)[]>();
  for (const e of d.draw) {
    if (e.type !== "parametric") continue;
    const fx = compile(e.x, ["t"]), fy = compile(e.y, ["t"]), fz = e.z ? compile(e.z, ["t"]) : null;
    const pts: ([number, number] | null)[] = [];
    const N = 400;
    for (let i = 0; i <= N; i++) {
      const t = e.t[0] + ((e.t[1] - e.t[0]) * i) / N;
      const c = fz ? [fx({ t }), fy({ t }), fz({ t })] : [fx({ t }), fy({ t })];
      pts.push(c.every(Number.isFinite) ? flat(c) : null);
    }
    curves.set(e, pts);
  }

  // The view: given, or (3D) fitted to everything drawn.
  let view = d.view as [number, number, number, number] | undefined;
  const axisLen3d = (() => {
    if (!is3d || !axes) return 0;
    if (axisLength) return axisLength;
    const all = Object.values(d.points).flat().map(Math.abs);
    return Math.max(2, ...all) * 1.25;
  })();
  if (!view) {
    const xs: number[] = [], ys: number[] = [];
    const add = ([x, y]: [number, number]) => (xs.push(x), ys.push(y));
    Object.values(d.points).forEach((c) => add(flat(c)));
    for (const e of d.draw) {
      const fields = e as unknown as Record<string, unknown>;
      for (const key of ["at", "from", "to", "center"]) if (Array.isArray(fields[key])) add(flat(fields[key] as number[]));
      if (e.type === "polygon") e.points.forEach((p) => add(M(p)));
      if (e.type === "sphere") {
        const [cx, cy] = M(e.center);
        add([cx - e.radius, cy - e.radius]);
        add([cx + e.radius, cy + e.radius]);
      }
      curves.get(e)?.forEach((p) => p && add(p));
    }
    if (axisLen3d) for (const c of [[axisLen3d, 0, 0], [0, axisLen3d, 0], [0, 0, axisLen3d], [0, 0, 0]]) add(flat(c));
    if (!xs.length) add([0, 0]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
    const m = span * 0.1;
    view = [Math.min(...xs) - m, Math.max(...xs) + m, Math.min(...ys) - m, Math.max(...ys) + m];
  }
  const [x0, x1, y0, y1] = view;
  const k = d.width / (x1 - x0);
  const W = d.width + 2 * PAD;
  const H = (y1 - y0) * k + 2 * PAD;
  const S = ([x, y]: [number, number]): [number, number] => [PAD + (x - x0) * k, PAD + (y1 - y) * k];
  const P = (p: Pt) => S(M(p));
  const out: string[] = [];
  const labels: string[] = [];
  const usedColors = new Set<string>();
  const clipId = `dclip${++clipSeq}`;
  let clipped = false;
  const clipAttr = () => ((clipped = true), ` clip-path="url(#${clipId})"`);

  /** A label anchored at (ax, ay), sitting on the side given by the unit direction (ux, uy) in screen space. */
  const putLabel = (text: string, ax: number, ay: number, ux: number, uy: number, gap = 7, cls = "dl") => {
    const BW = 140, BH = 34;
    const x = ax + ux * gap, y = ay + uy * gap;
    const hx = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "center";
    const vy = uy > 0.35 ? "start" : uy < -0.35 ? "end" : "center";
    const bx = hx === "start" ? x : hx === "end" ? x - BW : x - BW / 2;
    const by = vy === "start" ? y : vy === "end" ? y - BH : y - BH / 2;
    labels.push(
      `<foreignObject x="${r1(bx)}" y="${r1(by)}" width="${BW}" height="${BH}"><div xmlns="http://www.w3.org/1999/xhtml" class="${cls}" style="justify-content:${hx === "center" ? "center" : `flex-${hx}`};align-items:${vy === "center" ? "center" : `flex-${vy}`}">${tex(text)}</div></foreignObject>`,
    );
  };
  const DIRS: Record<string, [number, number]> = { n: [0, -1], ne: [0.71, -0.71], e: [1, 0], se: [0.71, 0.71], s: [0, 1], sw: [-0.71, 0.71], w: [-1, 0], nw: [-0.71, -0.71], c: [0, 0] };
  const path = (pts: ([number, number] | null)[]) => {
    let dstr = "", pen = false;
    for (const p of pts) {
      if (!p) {
        pen = false;
        continue;
      }
      const [sx, sy] = S(p);
      dstr += `${pen ? "L" : "M"}${r1(sx)},${r1(sy)}`;
      pen = true;
    }
    return dstr;
  };

  // Ticks (2D), shared by the grid and the axes.
  const tickSpec = axes && "ticks" in axes ? axes.ticks : undefined;
  const [tx, ty] = tickSpec === undefined ? [null, null] : Array.isArray(tickSpec) ? tickSpec : [tickSpec, tickSpec];
  const stepX = tx === null ? 1 : evalConst(tx), stepY = ty === null ? 1 : evalConst(ty);
  const stops = (a: number, b: number, step: number) => {
    const out: number[] = [];
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9 && out.length < 200; v += step) out.push(Math.abs(v) < 1e-9 ? 0 : v);
    return out;
  };

  // Grid and axes.
  if (d.grid && !is3d) {
    for (const x of stops(x0, x1, stepX)) out.push(`<line x1="${r1(PAD + (x - x0) * k)}" y1="${PAD}" x2="${r1(PAD + (x - x0) * k)}" y2="${r1(H - PAD)}" class="dg"/>`);
    for (const y of stops(y0, y1, stepY)) out.push(`<line x1="${PAD}" y1="${r1(PAD + (y1 - y) * k)}" x2="${r1(W - PAD)}" y2="${r1(PAD + (y1 - y) * k)}" class="dg"/>`);
  }
  if (axes && !is3d) {
    usedColors.add("muted");
    const xName = ("x" in axes && axes.x) || "x", yName = ("y" in axes && axes.y) || "y";
    const numbers = tickSpec !== undefined && axes.numbers !== false;
    if (y0 <= 0 && y1 >= 0) {
      const [, ay] = S([0, 0]);
      out.push(`<line x1="${PAD - 6}" y1="${r1(ay)}" x2="${r1(W - PAD + 8)}" y2="${r1(ay)}" style="stroke:${COLOR.muted}" marker-end="url(#da-muted)"/>`);
      putLabel(xName, W - PAD + 8, ay, 0, 1, 6);
      if (tx !== null) {
        const inPi = /pi|π/.test(String(tx));
        for (const x of stops(x0, x1, stepX)) {
          if (x === 0) continue;
          const [sx] = S([x, 0]);
          out.push(`<line x1="${r1(sx)}" y1="${r1(ay - 3)}" x2="${r1(sx)}" y2="${r1(ay + 3)}" style="stroke:${COLOR.muted}"/>`);
          if (numbers) putLabel(tickLabel(x, inPi), sx, ay + 3, 0, 1, 2, "dl dt");
        }
      }
    }
    if (x0 <= 0 && x1 >= 0) {
      const [ax] = S([0, 0]);
      out.push(`<line x1="${r1(ax)}" y1="${r1(H - PAD + 6)}" x2="${r1(ax)}" y2="${PAD - 8}" style="stroke:${COLOR.muted}" marker-end="url(#da-muted)"/>`);
      putLabel(yName, ax, PAD - 8, 1, 0, 6);
      if (ty !== null) {
        const inPi = /pi|π/.test(String(ty));
        for (const y of stops(y0, y1, stepY)) {
          if (y === 0) continue;
          const [, sy] = S([0, y]);
          out.push(`<line x1="${r1(ax - 3)}" y1="${r1(sy)}" x2="${r1(ax + 3)}" y2="${r1(sy)}" style="stroke:${COLOR.muted}"/>`);
          if (numbers) putLabel(tickLabel(y, inPi), ax - 3, sy, -1, 0, 3, "dl dt");
        }
      }
    }
  }
  if (axes && is3d) {
    usedColors.add("muted");
    const names = ["x" in axes && axes.x ? axes.x : "x", "y" in axes && axes.y ? axes.y : "y", "z" in axes && axes.z ? axes.z : "z"];
    const o = S(flat([0, 0, 0]));
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((u, i) => {
      const end = S(flat(u.map((c) => c * axisLen3d)));
      out.push(`<line x1="${r1(o[0])}" y1="${r1(o[1])}" x2="${r1(end[0])}" y2="${r1(end[1])}" style="stroke:${COLOR.muted}" marker-end="url(#da-muted)"/>`);
      const len = Math.hypot(end[0] - o[0], end[1] - o[1]) || 1;
      putLabel(names[i]!, end[0], end[1], (end[0] - o[0]) / len, (end[1] - o[1]) / len, 5);
    });
  }

  // Points named in `points` give a centroid, used to push point labels outward.
  const named = Object.values(d.points).map((c) => S(flat(c)));
  const cx = named.length ? named.reduce((t, p) => t + p[0], 0) / named.length : W / 2;
  const cy = named.length ? named.reduce((t, p) => t + p[1], 0) / named.length : H / 2;

  const lineLabel = (a: [number, number], b: [number, number], text: string, side: "left" | "right") => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    // Left of the direction of travel, as seen on screen.
    const s = side === "left" ? 1 : -1;
    const ux = (dy / len) * s, uy = (-dx / len) * s;
    putLabel(text, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ux, uy, 6);
  };
  /**
   * A label beside a curve, line or ray at a point on it: off to the side, at right angles to its
   * direction there (math-space `dir`), above or to the right by preference, and flipped near an edge so it
   * stays inside the drawing.
   */
  const endLabel = (text: string, at: [number, number], dir: [number, number]) => {
    const [sx, sy] = S(at);
    let tx = dir[0] * k, ty = -dir[1] * k;
    const tn = Math.hypot(tx, ty) || 1;
    tx /= tn;
    ty /= tn;
    let [ux, uy] = [-ty, tx];
    if (uy > 0.2 || (Math.abs(uy) <= 0.2 && ux < 0)) [ux, uy] = [-ux, -uy];
    if ((uy < -0.2 && sy < PAD + 40) || (ux > 0.2 && sx > W - PAD - 90) || (ux < -0.2 && sx < PAD + 90)) [ux, uy] = [-ux, -uy];
    putLabel(text, sx, sy, ux, uy, 8);
  };
  const box: [number, number, number, number] = [x0, x1, y0, y1];

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
          const tx2 = (b[0] - a[0]) / len, ty2 = (b[1] - a[1]) / len;
          for (let i = 0; i < e.ticks; i++) {
            const o = (i - (e.ticks - 1) / 2) * 4;
            const px = mx + tx2 * o, py = my + ty2 * o;
            out.push(`<line x1="${r1(px - ty2 * 5)}" y1="${r1(py + tx2 * 5)}" x2="${r1(px + ty2 * 5)}" y2="${r1(py - tx2 * 5)}" class="ds" style="stroke:${COLOR[e.color]}"/>`);
          }
        }
        if (e.label) lineLabel(a, b, e.label, e.side);
        break;
      }
      case "point": {
        const [px, py] = P(e.at);
        if (e.dot) out.push(e.open ? `<circle cx="${r1(px)}" cy="${r1(py)}" r="3.2" class="do"/>` : `<circle cx="${r1(px)}" cy="${r1(py)}" r="2.6" class="dp"/>`);
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
        out.push(`<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(r)}" class="ds${e.fill ? " df" : " dn"}${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"/>`);
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
      case "function": {
        const f = compile(e.fn, ["x"]);
        const a = Math.max(x0, e.domain?.[0] ?? -Infinity), b = Math.min(x1, e.domain?.[1] ?? Infinity);
        if (!(b > a)) break;
        const h = y1 - y0, lo = y0 - h, hi = y1 + h;
        const clamp = (y: number) => Math.min(hi, Math.max(lo, y));
        const pts: ([number, number] | null)[] = [];
        const N = 600;
        let prev: [number, number] | null = null;
        for (let i = 0; i <= N; i++) {
          const x = a + ((b - a) * i) / N;
          const y = f({ x });
          if (!Number.isFinite(y)) {
            pts.push(null);
            prev = null;
            continue;
          }
          // A big jump whose midpoint isn't between the two values crosses an asymptote: lift the pen.
          if (prev && Math.abs(y - prev[1]) > h) {
            const ym = f({ x: (x + prev[0]) / 2 });
            if (!Number.isFinite(ym) || ym < Math.min(y, prev[1]) || ym > Math.max(y, prev[1])) pts.push(null);
          }
          pts.push([x, clamp(y)]);
          prev = [x, y];
        }
        usedColors.add(e.color);
        out.push(`<path d="${path(pts)}" class="dc${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"${clipAttr()}/>`);
        if (e.label) {
          const lx = e.labelAt ?? a + (b - a) * 0.85;
          const ly = f({ x: lx });
          const slope = (f({ x: lx + 1e-4 }) - f({ x: lx - 1e-4 })) / 2e-4;
          if (Number.isFinite(ly) && ly >= y0 && ly <= y1) endLabel(e.label, [lx, ly], [1, Number.isFinite(slope) ? slope : 1e6]);
        }
        break;
      }
      case "parametric": {
        const pts = curves.get(e)!;
        usedColors.add(e.color);
        out.push(`<path d="${path(pts)}" class="dc${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"${is3d ? "" : clipAttr()}/>`);
        const live = pts.filter((p): p is [number, number] => !!p);
        const [a2, b2] = [live[live.length - 2], live[live.length - 1]];
        if (e.label && a2 && b2) endLabel(e.label, b2, [b2[0] - a2[0], b2[1] - a2[1]]);
        break;
      }
      case "line": {
        let p: [number, number], dv: [number, number];
        if (e.through) {
          p = M(e.through[0]);
          const q = M(e.through[1]);
          dv = [q[0] - p[0], q[1] - p[1]];
        } else if (e.x !== undefined) [p, dv] = [[e.x, 0], [0, 1]];
        else if (e.y !== undefined) [p, dv] = [[0, e.y], [1, 0]];
        else [p, dv] = [[0, e.intercept ?? 0], [1, e.slope!]];
        const t = clipLine(p, dv, box);
        if (!t) break;
        const A = S([p[0] + dv[0] * t[0], p[1] + dv[1] * t[0]]), B = S([p[0] + dv[0] * t[1], p[1] + dv[1] * t[1]]);
        usedColors.add(e.color);
        out.push(`<line x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}" class="ds${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"/>`);
        if (e.label) endLabel(e.label, [p[0] + dv[0] * (t[0] + (t[1] - t[0]) * 0.8), p[1] + dv[1] * (t[0] + (t[1] - t[0]) * 0.8)], dv);
        break;
      }
      case "ray": {
        const p = M(e.from);
        let dv: [number, number];
        if (e.through) {
          const q = M(e.through);
          dv = [q[0] - p[0], q[1] - p[1]];
        } else dv = [Math.cos(e.angle! * DEG), Math.sin(e.angle! * DEG)];
        const t = clipLine(p, dv, box, 0);
        usedColors.add(e.color);
        if (t) {
          const A = S([p[0] + dv[0] * t[0], p[1] + dv[1] * t[0]]), B = S([p[0] + dv[0] * t[1], p[1] + dv[1] * t[1]]);
          out.push(`<line x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}" class="ds${e.dashed ? " dd" : ""}" style="stroke:${COLOR[e.color]}"/>`);
          if (e.label) endLabel(e.label, [p[0] + dv[0] * t[1] * 0.75, p[1] + dv[1] * t[1] * 0.75], dv);
        }
        const [sx, sy] = S(p);
        out.push(e.open ? `<circle cx="${r1(sx)}" cy="${r1(sy)}" r="3.2" class="do"/>` : `<circle cx="${r1(sx)}" cy="${r1(sy)}" r="2.6" class="dp"/>`);
        break;
      }
      case "region": {
        const f = compile(e.fn, ["x"]), g = compile(e.fn2, ["x"]);
        const [a, b] = e.from <= e.to ? [e.from, e.to] : [e.to, e.from];
        const N = 200;
        const top: [number, number][] = [], bottom: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const x = a + ((b - a) * i) / N;
          const yf = f({ x }), yg = g({ x });
          if (Number.isFinite(yf) && Number.isFinite(yg)) {
            top.push([x, yf]);
            bottom.push([x, yg]);
          }
        }
        if (top.length < 2) break;
        const poly = [...top, ...bottom.reverse()].map((q) => S(q).map(r1).join(",")).join(" ");
        out.push(`<polygon points="${poly}" class="dr" style="fill:color-mix(in srgb, ${COLOR[e.color]} 16%, transparent)"${clipAttr()}/>`);
        break;
      }
      case "slopefield": {
        const f = compile(e.dydx, ["x", "y"]);
        const half = Math.min(e.step * k * 0.32, 14);
        usedColors.add(e.color);
        const segs: string[] = [];
        for (const x of stops(x0, x1, e.step)) {
          for (const y of stops(y0, y1, e.step)) {
            const m = f({ x, y });
            const [sx, sy] = S([x, y]);
            // Screen direction of slope m (y is flipped on screen); vertical where the slope is undefined.
            let ux = 1, uy = -m;
            if (!Number.isFinite(m)) [ux, uy] = [0, 1];
            const n = Math.hypot(ux, uy);
            ux /= n;
            uy /= n;
            segs.push(`M${r1(sx - ux * half)},${r1(sy - uy * half)}L${r1(sx + ux * half)},${r1(sy + uy * half)}`);
          }
        }
        out.push(`<path d="${segs.join("")}" class="dsf" style="stroke:${COLOR[e.color]}"/>`);
        break;
      }
      case "sphere": {
        const c3 = coordOf(e.center);
        const [sx, sy] = S(flat(c3));
        out.push(`<circle cx="${r1(sx)}" cy="${r1(sy)}" r="${r1(e.radius * k)}" class="ds dn" style="stroke:${COLOR[e.color]}"/>`);
        const eq: [number, number][] = [];
        for (let i = 0; i <= 120; i++) {
          const t = (2 * Math.PI * i) / 120;
          eq.push(flat([c3[0]! + e.radius * Math.cos(t), c3[1]! + e.radius * Math.sin(t), c3[2]!]));
        }
        out.push(`<path d="${path(eq)}" class="ds dn dd" style="stroke:${COLOR.muted}"/>`);
        break;
      }
    }
  }

  const markers = [...usedColors]
    .map((c) => `<marker id="da-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:${COLOR[c]}"/></marker>`)
    .join("");
  const clip = clipped ? `<clipPath id="${clipId}"><rect x="${PAD}" y="${PAD}" width="${r1(W - 2 * PAD)}" height="${r1(H - 2 * PAD)}"/></clipPath>` : "";
  const alt = esc(d.alt ?? "Diagram");
  return `<svg class="diagram" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W)}" role="img" aria-label="${alt}"><defs>${markers}${clip}</defs>${out.join("")}${labels.join("")}</svg>`;
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
