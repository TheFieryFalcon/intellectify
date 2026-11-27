import { beforeEach, describe, expect, it } from "vitest";
import { addHistory, clearHistory, listHistory, MAX } from "./history";

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  };
});

const base = { course: "c", skill: "s", questionId: "q", variant: null, words: null, mode: "practice" as const, answers: ["1"], solvedOn: [1], outcome: 1 };

describe("history", () => {
  it("lists newest first, per course", () => {
    addHistory({ ...base, questionId: "a", at: 1 });
    addHistory({ ...base, questionId: "b", at: 2 });
    addHistory({ ...base, course: "other" });
    expect(listHistory("c").map((e) => e.questionId)).toEqual(["b", "a"]);
    expect(listHistory("other")).toHaveLength(1);
  });
  it("keeps at most MAX entries", () => {
    for (let i = 0; i < MAX + 5; i++) addHistory({ ...base, questionId: `q${i}` });
    const all = listHistory("c");
    expect(all).toHaveLength(MAX);
    expect(all[0]!.questionId).toBe(`q${MAX + 4}`);
  });
  it("clears, and survives broken storage", () => {
    addHistory(base);
    clearHistory("c");
    expect(listHistory("c")).toEqual([]);
    mem.set("intellectify:history:c", "{not json");
    expect(listHistory("c")).toEqual([]);
    (globalThis as { localStorage?: unknown }).localStorage = undefined;
    expect(() => addHistory(base)).not.toThrow();
  });
});
