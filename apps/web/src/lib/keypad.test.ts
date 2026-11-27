import { describe, expect, it } from "vitest";
import katex from "katex";
import { BASIC, FULL, GREEK, SHIFT_SLOTS, faceOf, loadShiftMap, phoneLayouts, saveShiftMap, shiftChoices } from "./keypad";

describe("maths keypad", () => {
  it("every key's face is valid LaTeX", () => {
    const keys = [...BASIC, ...GREEK.flatMap((g) => g.keys), ...FULL.flatMap((g) => g.keys)];
    expect(keys.length).toBeGreaterThan(150);
    for (const key of keys) expect(() => katex.renderToString(faceOf(key), { throwOnError: true }), key.name).not.toThrow();
  });
  it("defaults Shift to the ClassPad's Spec keys, with ClassPad-only buttons moved onto ours", () => {
    const d = Object.fromEntries(SHIFT_SLOTS.map((s) => [s.id, s.defaultShift]));
    expect(d.eq).toBe("\\operatorname{solve}\\left(#0\\right)");
    expect([d.open, d.close]).toEqual(["[", "]"]);
    expect(d["1"]).toBe("\\sin\\left(#0\\right)"); // no Spec entry: ClassPad default
    expect(d.forall).toBe("\\Rightarrow"); // from (−)
    expect(d.e).toBe("\\infty"); // from EXP
    // Every default is a named choice in Settings.
    const named = new Set(shiftChoices().flatMap((g) => g.keys.map((k) => k.insert)));
    for (const v of Object.values(d)) if (v) expect(named.has(v), v).toBe(true);
  });
  it("gives phones a 123 tab with y, z and Shift keys, letters, Basic, Greek and each Full group", () => {
    const l = phoneLayouts() as { label?: string; rows?: { latex?: string; shift?: { insert: string } }[][] }[];
    expect(l.length).toBe(4 + FULL.length);
    expect(l[1]).toBe("alphabetic");
    const row2 = l[0]!.rows![1]!;
    expect(row2.slice(0, 2).map((c) => c.latex)).toEqual(["y", "z"]); // where < and > were
    expect(row2[0]!.shift!.insert).toBe("f\\left(x\\right)"); // ClassPad Spec: y → f(x)
    // Tabs are glyphs, not words, so they fit on a phone.
    for (const t of l.slice(2)) expect((t.label ?? "").replace(/<[^>]+>/g, "").length).toBeLessThanOrEqual(3);
  });
  it("keeps a student's own Shift keys over the defaults", () => {
    const store = new Map<string, string>();
    globalThis.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } as Storage;
    expect(loadShiftMap()["7"]).toBe("\\operatorname{diff}\\left(#0\\right)"); // ClassPad Spec default
    saveShiftMap({ ...loadShiftMap(), "7": "\\sin\\left(#0\\right)", y: null });
    const m = loadShiftMap();
    expect(m["7"]).toBe("\\sin\\left(#0\\right)");
    expect(m.y).toBeNull(); // turned off
    expect(m.z).toBe(SHIFT_SLOTS.find((s) => s.id === "z")!.defaultShift);
    const shifted = (phoneLayouts(m) as { rows: { shift?: { insert: string } }[][] }[])[0]!.rows[0]![3]!;
    expect(shifted.shift!.insert).toBe("\\sin\\left(#0\\right)");
  });
});
