import dagre from "dagre";
import type { CourseBundle } from "./content";

/** Node box: progress shape on top, label below. */
export const NODE_W = 104;
/** Height of the shape area by skill size (SPEC §15.2): small circle, medium circle, small diamond, large diamond. */
export const SHAPE_H = { small: 32, medium: 44, large: 50, cornerstone: 68 } as const;
/** Label and gap below the shape. */
const LABEL_H = 40;
export const nodeHeight = (size: keyof typeof SHAPE_H) => SHAPE_H[size] + LABEL_H;
const SECTION_LABEL = 30;
const UNIT_HEADER = 34;
const YEAR_HEADER = 40;
const UNIT_GAP = 28;

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
  crossUnit: boolean;
  d: string;
}
export interface TreeLayout {
  width: number;
  height: number;
  nodes: Map<string, LaidOutNode>;
  regions: LaidOutRegion[];
  edges: LaidOutEdge[];
  headers: { kind: "year" | "unit"; text: string; x: number; y: number }[];
}

/**
 * One map per course (SPEC §15.2): units stacked top to bottom, Year 11 above Year 12.
 * Each unit is a layered graph (dagre) with sections as compound clusters, so skills branch
 * the way their prerequisites do instead of sitting in columns.
 */
export function layoutTree(course: CourseBundle): TreeLayout {
  const graphs = course.units.map((u) => {
    const g = new dagre.graphlib.Graph({ compound: true });
    g.setGraph({ rankdir: "TB", nodesep: 8, ranksep: 26, marginx: 6, marginy: 6 });
    g.setDefaultEdgeLabel(() => ({}));
    const inUnit = new Set(u.sections.flatMap((s) => s.skills.map((k) => k.id)));
    for (const s of u.sections) {
      g.setNode(`sec:${s.id}`, {});
      for (const k of s.skills) {
        g.setNode(k.id, { width: NODE_W, height: nodeHeight(k.size) });
        g.setParent(k.id, `sec:${s.id}`);
      }
    }
    for (const s of u.sections) for (const k of s.skills) for (const p of k.prereqs) if (inUnit.has(p)) g.setEdge(p, k.id);
    dagre.layout(g);
    return { unit: u, g, w: g.graph().width ?? 0, h: (g.graph().height ?? 0) + SECTION_LABEL };
  });

  const width = Math.max(...graphs.map((x) => x.w));
  const nodes = new Map<string, LaidOutNode>();
  const regions: LaidOutRegion[] = [];
  const headers: TreeLayout["headers"] = [];
  let y = 0;
  let year: number | null = null;

  for (const { unit, g, w, h } of graphs) {
    if (unit.year !== year) {
      year = unit.year;
      headers.push({ kind: "year", text: `Year ${year}`, x: 0, y });
      y += YEAR_HEADER;
    }
    headers.push({ kind: "unit", text: `Unit ${unit.number}`, x: 0, y });
    y += UNIT_HEADER;
    const ox = (width - w) / 2;
    for (const s of unit.sections) {
      const c = g.node(`sec:${s.id}`);
      regions.push({ id: s.id, name: s.name, x: ox + c.x - c.width / 2, y: y + c.y - c.height / 2, w: c.width, h: c.height + SECTION_LABEL });
      for (const k of s.skills) {
        const n = g.node(k.id);
        const x = ox + n.x - NODE_W / 2;
        const h = nodeHeight(k.size);
        const top = y + n.y - h / 2 + SECTION_LABEL;
        nodes.set(k.id, { id: k.id, unit: unit.number, x, y: top, h, cx: x + NODE_W / 2, cy: top + SHAPE_H[k.size] / 2 });
      }
    }
    y += h + UNIT_GAP;
  }

  const edges: LaidOutEdge[] = [];
  for (const u of course.units)
    for (const s of u.sections)
      for (const k of s.skills)
        for (const p of k.prereqs) {
          const a = nodes.get(p);
          const b = nodes.get(k.id);
          if (!a || !b) continue;
          const x1 = a.cx, y1 = a.y + a.h - 4;
          const x2 = b.cx, y2 = b.y - 3;
          const bend = Math.max(18, (y2 - y1) * 0.5);
          edges.push({ from: p, to: k.id, crossUnit: a.unit !== b.unit, d: `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}` });
        }

  return { width, height: y, nodes, regions, edges, headers };
}
