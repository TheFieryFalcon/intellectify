import { describe, expect, it } from "vitest";
import { readShare, sharePath } from "./share";

const lists = { person: ["Adam", "Priya", "Kai"], aircraft: ["plane", "jet"] };
const q = { id: "spec.vectors.flight-path", variants: [{ a: 1 }, { a: 2 }, { a: 3 }], words: { who: "person", craft: "aircraft" } };

describe("share links", () => {
  it("round-trips the exact variant and words", () => {
    const path = sharePath("specialist", q, 2, { who: 1, craft: 0 });
    expect(path).toBe("/specialist/problem/spec.vectors.flight-path?v=2&w=who.1,craft.0");
    const url = new URL(path, "https://x.test");
    expect(readShare(url.searchParams, q, lists)).toEqual({ variant: 2, words: { who: 1, craft: 0 } });
  });
  it("handles questions without variants or words", () => {
    const plain: { id: string; variants?: undefined; words?: undefined } = { id: "spec.logic.converse" };
    const path = sharePath("specialist", plain, null, null);
    expect(path).toBe("/specialist/problem/spec.logic.converse");
    expect(readShare(new URLSearchParams(""), plain, lists)).toEqual({ variant: null, words: null });
  });
  it("rejects links that no longer fit the question", () => {
    expect(readShare(new URLSearchParams("v=7&w=who.1,craft.0"), q, lists)).toBeNull();
    expect(readShare(new URLSearchParams("v=1&w=who.9,craft.0"), q, lists)).toBeNull();
    expect(readShare(new URLSearchParams("v=1&w=who.1"), q, lists)).toBeNull();
    expect(readShare(new URLSearchParams("v=1&w=bad"), q, lists)).toBeNull();
  });
});
