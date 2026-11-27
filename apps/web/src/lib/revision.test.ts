import { describe, expect, it } from "vitest";
import type { QuestionIndexEntry } from "./content";
import { candidates, parseScope, pickNext, specFromParams, specToParams, type RevisionSpec } from "./revision";

const q = (id: string, tier: number, extra: Partial<QuestionIndexEntry> = {}): QuestionIndexEntry => ({
  id, title: id, skill: "a", skills: ["a"], section: "s1", unit: 1, year: 11, rating: 1000, tier, kind: "auto",
  answerTypes: ["numeric"], tags: ["calculation"], pool: "practice", later: false, calculator: false, variants: 0, source: "x", ...extra,
});
const exam = (level: "easy" | "hard"): RevisionSpec => specFromParams(new URLSearchParams({ mode: "exam", level }));

describe("revision", () => {
  it("parses scopes and round-trips specs", () => {
    expect(parseScope("unit:2")).toEqual({ kind: "unit", unit: 2 });
    expect(parseScope("section:spec.geo:x")).toEqual({ kind: "section", id: "spec.geo:x" });
    expect(parseScope("nonsense")).toEqual({ kind: "course" });
    const s = specFromParams(new URLSearchParams("mode=custom&scope=skill:a&tier=4,2&kind=written&tag=proof&later=1"));
    expect(specFromParams(specToParams(s))).toEqual(s);
  });

  it("exam modes keep only their two tiers and skip later-unit questions", () => {
    const ix = [q("t1", 1), q("t2", 2), q("t3", 3), q("t4", 4), q("t3l", 3, { later: true })];
    expect(candidates(ix, exam("easy")).map((e) => e.id)).toEqual(["t2", "t3"]);
    expect(candidates(ix, exam("hard")).map((e) => e.id)).toEqual(["t3", "t4"]);
  });

  it("custom filters by scope, tier, type, tag and later units", () => {
    const ix = [q("a", 2), q("b", 2, { unit: 2 }), q("c", 3, { kind: "written", tags: ["proof"] }), q("d", 2, { later: true })];
    const spec = (p: string) => specFromParams(new URLSearchParams(`mode=custom&${p}`));
    expect(candidates(ix, spec("scope=unit:1")).map((e) => e.id)).toEqual(["a", "c"]);
    expect(candidates(ix, spec("tier=2")).map((e) => e.id)).toEqual(["a", "b"]);
    expect(candidates(ix, spec("tier=2&later=1")).map((e) => e.id)).toEqual(["a", "b", "d"]);
    expect(candidates(ix, spec("kind=written")).map((e) => e.id)).toEqual(["c"]);
    expect(candidates(ix, spec("tag=proof")).map((e) => e.id)).toEqual(["c"]);
  });

  it("exam picks are about half of each tier", () => {
    const pool = [...Array(50)].flatMap((_, i) => [q(`a${i}`, 2), q(`b${i}`, 3)]);
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const tiers = [...Array(2000)].map(() => pickNext(pool, exam("easy"), new Set(), new Set(), rand)!.tier);
    const share = tiers.filter((t) => t === 2).length / tiers.length;
    expect(share).toBeGreaterThan(0.45);
    expect(share).toBeLessThan(0.55);
  });

  it("prefers unserved, then unanswered questions, and falls back to the other tier", () => {
    const pool = [q("a", 2), q("b", 2), q("c", 3)];
    const s = exam("easy");
    expect(pickNext(pool, s, new Set(["a"]), new Set(), () => 0.1)!.id).toBe("b");
    expect(pickNext(pool, s, new Set(), new Set(["a"]), () => 0.1)!.id).toBe("b");
    expect(pickNext(pool, s, new Set(["a", "b"]), new Set(), () => 0.1)!.id).toBe("c");
    expect(pickNext(pool, s, new Set(["a", "b", "c"]), new Set(), () => 0.1)).not.toBeNull();
    expect(pickNext([], s, new Set(), new Set())).toBeNull();
  });
});
