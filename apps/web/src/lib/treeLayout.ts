import dagre from "dagre";
import type { CourseBundle } from "./content";

/** Node box: progress shape on top, label below. */
export const NODE_W = 112;
/** Height of the shape area by skill size (SPEC §15.2): small circle, medium circle, small diamond, large diamond. */
export const SHAPE_H = { small: 32, medium: 44, large: 50, cornerstone: 68 } as const;
/** Label metrics (must match .label in TechTree.svelte). */
export const LABEL_W = 108;
const LABEL_LINE = 14.5;
const LABEL_GAP = 7;
/** Roughly how many characters of the 11px label font fit on one line. */
const CHARS_PER_LINE = 18;

/** Lines a label wraps to, estimated by greedy word wrap. */
export function labelLines(text: string): number {
  let lines = 1;
  let len = 0;
  for (const word of text.split(/\s+/)) {
    if (len && len + 1 + word.length > CHARS_PER_LINE) {
      lines++;
      len = word.length;
    } else len += (len ? 1 : 0) + word.length;
  }
  return lines;
}
export const nodeHeight = (size: keyof typeof SHAPE_H, name: string) => SHAPE_H[size] + LABEL_GAP + labelLines(name) * LABEL_LINE + 4;
const SECTION_LABEL = 30;
/** Row at the foot of each section for its quiz and Challenge (with clear space above it), and one below each unit for its quiz. */
const REVIEW_ROW = 110;
/** From a region's bottom edge up to its review icons' centers. */
const REVIEW_FROM_BOTTOM = 45;
const UNIT_QUIZ_ROW = 86;
/** Review icon size (must match .review in TechTree.svelte). */
export const REVIEW_SIZE = 38;
const UNIT_HEADER = 34;
const YEAR_HEADER = 40;
const UNIT_GAP = 28;
const SECTION_GAP = 14;

export interface LaidOutNode {
  id: string;
  unit: number;
  /** Top-left of the node box. */
  x: number;
  y: number;
  /** Node height (shape plus label). */
  h: number;
  /** Center of the shape. */
  cx: number;
  cy: number;
  /** Half the shape's height (its "radius"). */
  r: number;
}
export interface LaidOutRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface LaidOutEdge {
  from: string;
  to: string;
  /** Prerequisite in another section or unit: drawn only while a chain is highlighted. */
  hidden: boolean;
  d: string;
}
/** A review on the map (SPEC §8): a section's quiz and Challenge, and each unit's quiz. */
export interface LaidOutReview {
  kind: "section-quiz" | "challenge" | "unit-quiz";
  /** Section ID, or unit number as text. */
  id: string;
  /** Center of the icon. */
  cx: number;
  cy: number;
}
export interface TreeLayout {
  width: number;
  height: number;
  nodes: Map<string, LaidOutNode>;
  regions: LaidOutRegion[];
  edges: LaidOutEdge[];
  reviews: LaidOutReview[];
  headers: { kind: "year" | "unit"; text: string; x: number; y: number }[];
}

/**
 * One map per course (SPEC §15.2): units stacked top to bottom, Year 11 above Year 12.
 * Each section is its own layered graph (dagre), so skills branch the way their prerequisites do;
 * a unit's sections sit side by side, top-aligned.
 */
export function layoutTree(course: CourseBundle): TreeLayout {
  const units = course.units.map((u) => {
    const sections = u.sections.map((s) => {
      // Try dagre's three rankers: fewest crossings first, then the shortest total edge length.
      let best: { g: dagre.graphlib.Graph; cost: number } | null = null;
      for (const ranker of ["network-simplex", "tight-tree", "longest-path"] as const) {
        const g = buildSectionGraph(s, ranker);
        dagre.layout(g);
        untangle(g, s);
        const length = g.edges().reduce((t, e) => t + Math.abs(g.node(e.w).y - g.node(e.v).y) + Math.abs(g.node(e.w).x - g.node(e.v).x) * 0.25, 0);
        const cost = countCrossings(g) * 1e6 + length;
        if (!best || cost < best.cost - 0.5) best = { g, cost };
      }
      const g = best!.g;
      return { section: s, g, w: g.graph().width ?? 0, h: (g.graph().height ?? 0) + SECTION_LABEL };
    });
    const w = sections.reduce((t, x) => t + x.w, 0) + SECTION_GAP * Math.max(0, sections.length - 1);
    return { unit: u, sections, w, h: Math.max(...sections.map((x) => x.h)) + REVIEW_ROW };
  });

  const width = Math.max(...units.map((x) => x.w));
  const nodes = new Map<string, LaidOutNode>();
  const regions: LaidOutRegion[] = [];
  const headers: TreeLayout["headers"] = [];
  const edges: LaidOutEdge[] = [];
  const reviews: LaidOutReview[] = [];
  let y = 0;
  let year: number | null = null;

  for (const { unit, sections, w, h } of units) {
    if (unit.year !== year) {
      year = unit.year;
      headers.push({ kind: "year", text: `Year ${year}`, x: 0, y });
      y += YEAR_HEADER;
    }
    headers.push({ kind: "unit", text: `Unit ${unit.number}`, x: 0, y });
    y += UNIT_HEADER;
    let ox = (width - w) / 2;
    for (const { section: s, g, w: sw } of sections) {
      // Every region in a unit gets the same height, so their bottoms line up too.
      regions.push({ id: s.id, name: s.name, x: ox, y, w: sw, h });
      // The section's quiz and Challenge sit side by side at the foot of its region.
      const ry = y + h - REVIEW_FROM_BOTTOM;
      reviews.push({ kind: "section-quiz", id: s.id, cx: ox + sw / 2 - 44, cy: ry }, { kind: "challenge", id: s.id, cx: ox + sw / 2 + 44, cy: ry });
      for (const k of s.skills) {
        const n = g.node(k.id);
        const x = ox + n.x - NODE_W / 2;
        const nh = nodeHeight(k.size, k.name);
        const top = y + n.y - nh / 2 + SECTION_LABEL;
        nodes.set(k.id, { id: k.id, unit: unit.number, x, y: top, h: nh, cx: x + NODE_W / 2, cy: top + SHAPE_H[k.size] / 2, r: SHAPE_H[k.size] / 2 });
      }
      // Edges inside a section follow dagre's routes, which pass between nodes instead of through them.
      for (const e of g.edges()) {
        const a = nodes.get(e.v);
        const b = nodes.get(e.w);
        const pts = g.edge(e)?.points ?? [];
        if (!a || !b) continue;
        const start = { x: a.cx, y: a.y + a.h };
        const end = { x: b.cx, y: b.y - 2 };
        // Keep only route points strictly between the stubs, so the curve never doubles back.
        const mid = pts
          .slice(1, -1)
          .map((p) => ({ x: ox + p.x, y: y + p.y + SECTION_LABEL }))
          .filter((p) => p.y > start.y + 14 && p.y < end.y - 14);
        if (pts.length <= 3 || !mid.length) {
          // Neighboring rows: a simple S-curve, vertical at both ends.
          const bend = (end.y - start.y) / 2;
          edges.push({ from: e.v, to: e.w, hidden: false, d: `M${start.x},${start.y} C${start.x},${start.y + bend} ${end.x},${end.y - bend} ${end.x},${end.y}` });
        } else {
          // Longer edges follow dagre's lane between nodes, with short vertical stubs at both ends.
          const route = [start, { x: start.x, y: start.y + 10 }, ...mid, { x: end.x, y: end.y - 10 }, end];
          edges.push({ from: e.v, to: e.w, hidden: false, d: smoothPath(route) });
        }
      }
      ox += sw + SECTION_GAP;
    }
    y += h;
    // The unit quiz, centered below the unit's sections.
    reviews.push({ kind: "unit-quiz", id: String(unit.number), cx: width / 2, cy: y + UNIT_QUIZ_ROW / 2 - 4 });
    y += UNIT_QUIZ_ROW + UNIT_GAP;
  }

  // Prerequisites in another section or unit are only drawn while a chain is highlighted.
  const sectionOfSkill = new Map(course.units.flatMap((u) => u.sections.flatMap((s) => s.skills.map((k) => [k.id, s.id] as const))));
  for (const u of course.units)
    for (const s of u.sections)
      for (const k of s.skills)
        for (const p of k.prereqs) {
          const a = nodes.get(p);
          const b = nodes.get(k.id);
          if (!a || !b || sectionOfSkill.get(p) === s.id) continue;
          if (a.unit === b.unit) {
            // Sections sit side by side: join the shapes sideways, so the curve never loops back on itself.
            const dir = Math.sign(b.cx - a.cx) || 1;
            const x1 = a.cx + dir * (a.r + 4), x2 = b.cx - dir * (b.r + 4);
            const bend = Math.max(30, Math.abs(x2 - x1) * 0.45) * dir;
            edges.push({ from: p, to: k.id, hidden: true, d: `M${x1},${a.cy} C${x1 + bend},${a.cy} ${x2 - bend},${b.cy} ${x2},${b.cy}` });
          } else {
            // Units are stacked: an earlier unit is always above.
            const x1 = a.cx, y1 = a.y + a.h;
            const x2 = b.cx, y2 = b.y - 2;
            const bend = Math.max(24, Math.abs(y2 - y1) * 0.5);
            edges.push({ from: p, to: k.id, hidden: true, d: `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}` });
          }
        }

  return { width, height: y, nodes, regions, edges, reviews, headers };
}

type Section = CourseBundle["units"][number]["sections"][number];

/** The dagre graph for one section: its skills, joined by direct same-section prerequisites. */
function buildSectionGraph(s: Section, ranker: "network-simplex" | "tight-tree" | "longest-path"): dagre.graphlib.Graph {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 14, edgesep: 12, ranksep: 40, marginx: 14, marginy: 8, ranker });
  g.setDefaultEdgeLabel(() => ({}));
  for (const k of s.skills) g.setNode(k.id, { width: NODE_W, height: nodeHeight(k.size, k.name) });
  // Shortcuts are dropped: if A → B → C, the direct link A → C isn't drawn (hovering still traces it).
  const inSection = new Set(s.skills.map((k) => k.id));
  const local = new Map(s.skills.map((k) => [k.id, k.prereqs.filter((p) => inSection.has(p))]));
  const reaches = (from: string, to: string): boolean => {
    const stack = [to];
    const seen = new Set<string>();
    while (stack.length) {
      const x = stack.pop()!;
      for (const p of local.get(x) ?? []) {
        if (p === from) return true;
        if (!seen.has(p)) (seen.add(p), stack.push(p));
      }
    }
    return false;
  };
  for (const k of s.skills) {
    const direct = local.get(k.id)!;
    for (const p of direct) if (!direct.some((q) => q !== p && reaches(p, q))) g.setEdge(p, k.id);
  }
  return g;
}

/**
 * Dagre's ordering sometimes leaves avoidable crossings. Swap neighboring nodes in the
 * same row whenever that reduces crossings. Edges touching a moved node lose dagre's route
 * and are drawn as plain curves.
 */
function untangle(g: dagre.graphlib.Graph, s: Section): void {
  const moved = new Set<string>();
  {
    const rows = new Map<number, string[]>();
    for (const k of s.skills) {
      const key = Math.round(g.node(k.id).y);
      rows.set(key, [...(rows.get(key) ?? []), k.id]);
    }
    for (let pass = 0; pass < 4; pass++) {
      let improved = false;
      for (const ids of rows.values()) {
        ids.sort((a, b) => g.node(a).x - g.node(b).x);
        for (let i = 0; i + 1 < ids.length; i++) {
          const a = g.node(ids[i]!), b = g.node(ids[i + 1]!);
          const before = countCrossings(g);
          [a.x, b.x] = [b.x, a.x];
          if (countCrossings(g) < before) {
            improved = true;
            moved.add(ids[i]!).add(ids[i + 1]!);
            [ids[i], ids[i + 1]] = [ids[i + 1]!, ids[i]!];
          } else [a.x, b.x] = [b.x, a.x];
        }
      }
      if (!improved) break;
    }
  }
  for (const e of g.edges()) if (moved.has(e.v) || moved.has(e.w)) g.edge(e).points = [];
}

/** Pairs of edges whose straight center-to-center segments cross (a cheap proxy for visual crossings). */
function countCrossings(g: dagre.graphlib.Graph): number {
  const segs = g.edges().map((e) => {
    const a = g.node(e.v), b = g.node(e.w);
    return { v: e.v, w: e.w, x1: a.x, y1: a.y + a.height / 2, x2: b.x, y2: b.y - b.height / 2 };
  });
  const cross = (p: (typeof segs)[number], q: (typeof segs)[number]) => {
    if (p.v === q.v || p.w === q.w || p.v === q.w || p.w === q.v) return false;
    const d = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const d1 = d(p.x1, p.y1, p.x2, p.y2, q.x1, q.y1), d2 = d(p.x1, p.y1, p.x2, p.y2, q.x2, q.y2);
    const d3 = d(q.x1, q.y1, q.x2, q.y2, p.x1, p.y1), d4 = d(q.x1, q.y1, q.x2, q.y2, p.x2, p.y2);
    return d1 * d2 < 0 && d3 * d4 < 0;
  };
  let n = 0;
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) if (cross(segs[i]!, segs[j]!)) n++;
  return n;
}

/** A smooth curve through the route points (uniform cubic B-spline, as in d3's curveBasis). */
function smoothPath(pts: { x: number; y: number }[]): string {
  const f = (n: number) => Math.round(n * 10) / 10;
  if (pts.length < 3) return `M${f(pts[0]!.x)},${f(pts[0]!.y)} L${f(pts.at(-1)!.x)},${f(pts.at(-1)!.y)}`;
  let d = `M${f(pts[0]!.x)},${f(pts[0]!.y)}`;
  const p = pts;
  d += ` L${f((5 * p[0]!.x + p[1]!.x) / 6)},${f((5 * p[0]!.y + p[1]!.y) / 6)}`;
  const bez = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
    ` C${f((2 * a.x + b.x) / 3)},${f((2 * a.y + b.y) / 3)} ${f((a.x + 2 * b.x) / 3)},${f((a.y + 2 * b.y) / 3)} ${f((a.x + 4 * b.x + c.x) / 6)},${f((a.y + 4 * b.y + c.y) / 6)}`;
  for (let i = 2; i < p.length; i++) d += bez(p[i - 2]!, p[i - 1]!, p[i]!);
  const n = p.length;
  d += bez(p[n - 2]!, p[n - 1]!, p[n - 1]!);
  d += ` L${f(p[n - 1]!.x)},${f(p[n - 1]!.y)}`;
  return d;
}
