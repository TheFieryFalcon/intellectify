import { describe, expect, it } from "vitest";
import { handleMark, type Deps } from "./mark";

const question = {
  id: "s.k.q1",
  version: 2,
  skills: { primary: "s.k", secondary: [] },
  rating: 1400,
  responseSkills: { proof: 1400 },
  stem: "Prove that {{n}} is odd.",
  solution: "{{n}} = 2k + 1.",
  parts: [{ id: "a", marks: 1, rubric: { criteria: [{ id: "c", description: "Shows it", points: 2, dimension: "proof" }] } }],
  variants: [{ n: 7 }],
};
const auto = { ...question, id: "s.k.auto", parts: [{ id: "a", marks: 1, answer: { type: "numeric", key: 1 } }] };
const worded = { ...question, id: "s.k.words", variants: undefined, words: { who: "person" }, stem: "{{who}} claims 7 is odd. Prove it." };

function deps(marker: (body: { model: string; messages: { content: string }[] }) => Response, extra: Partial<Deps> = {}): Deps & { seen: string[] } {
  const seen: string[] = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    seen.push(url);
    if (url.endsWith("/content/specialist/questions/s.k.json")) return Response.json([question, auto, worded]);
    if (url.endsWith("/content/words.json")) return Response.json({ person: ["Adam", "Priya", "Kai"] });
    if (url.includes("groq")) return marker(JSON.parse(init!.body as string));
    return new Response("not found", { status: 404 });
  }) as unknown as typeof globalThis.fetch;
  return { key: "k", firebaseProject: "p", models: ["m1"], groqKey: "g", fetch, verify: async (t) => (t === "good" ? "uid" : Promise.reject(new Error("bad"))), seen, ...extra };
}
const ok = (awarded: number) => () =>
  Response.json({ choices: [{ message: { content: JSON.stringify({ criteria: [{ id: "a.c", awarded, feedback: "f" }], feedback: "o" }) } }] });
const post = (body: unknown, token: string | null = "good") =>
  new Request("https://site.test/api/mark", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) });
const body = { course: "specialist", skill: "s.k", questionId: "s.k.q1", variant: 0, answers: { a: "7 = 2(3) + 1" } };

describe("/api/mark", () => {
  it("marks against the deployed question, filling its variant", async () => {
    let prompt = "";
    const d = deps((b) => ((prompt = b.messages[1]!.content), ok(1.5)()));
    const res = await handleMark(post(body), d);
    expect(res.status).toBe(200);
    const { result, questionVersion } = (await res.json()) as { result: { score: number }; questionVersion: number };
    expect(result.score).toBe(0.75);
    expect(questionVersion).toBe(2);
    expect(prompt).toContain("Prove that 7 is odd.");
    expect(d.seen[0]).toBe("https://site.test/content/specialist/questions/s.k.json");
  });
  it("requires a valid sign-in token", async () => {
    expect((await handleMark(post(body, null), deps(ok(1)))).status).toBe(401);
    expect((await handleMark(post(body, "forged"), deps(ok(1)))).status).toBe(401);
  });
  it("refuses bad input before calling the model", async () => {
    const d = deps(ok(1));
    for (const b of [
      { ...body, skill: "../../etc" },
      { ...body, answers: { a: "x".repeat(7000) } },
      { ...body, variant: 3 },
      { ...body, questionId: "s.k.auto" },
      { ...body, appeal: { argument: "" } },
    ])
      expect((await handleMark(post(b), d)).status).toBeGreaterThanOrEqual(400);
    expect(d.seen.some((u) => u.includes("groq"))).toBe(false);
  });
  it("marks with Groq only: effort 1 is one run, effort 2 (the default) three", async () => {
    const runs = async (effort?: number) => {
      const d = deps(ok(2));
      const res = await handleMark(post(effort === undefined ? body : { ...body, effort }), d);
      expect(((await res.json()) as { result: { model: string } }).result.model).toBe("openai/gpt-oss-120b");
      expect(d.seen.some((u) => u.includes("generativelanguage"))).toBe(false);
      return d.seen.filter((u) => u.includes("groq")).length;
    };
    expect([await runs(1), await runs(2), await runs()]).toEqual([1, 3, 3]);
    expect((await handleMark(post({ ...body, effort: 7 }), deps(ok(2)))).status).toBe(400);
    expect((await handleMark(post(body), deps(ok(2), { groqKey: undefined }))).status).toBe(503);
  });

  it("fills the words the question was served with, and refuses words it can't have had", async () => {
    let prompt = "";
    const d = deps((b) => ((prompt = b.messages[1]!.content), ok(2)()));
    const req = { ...body, questionId: "s.k.words", variant: null };
    expect((await handleMark(post({ ...req, words: { who: 1 } }), d)).status).toBe(200);
    expect(prompt).toContain("Priya claims 7 is odd.");
    for (const words of [{ who: 3 }, { who: 0.5 }, { them: 0 }, null, { who: 0, extra: 1 }]) expect((await handleMark(post({ ...req, words }), d)).status).toBe(400);
  });

  it("passes quota errors on as 429 so the client queues the job", async () => {
    const res = await handleMark(post(body), deps(() => new Response("quota", { status: 429 })));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
  it("is off without a key, and POST only", async () => {
    expect((await handleMark(post(body), deps(ok(1), { groqKey: undefined }))).status).toBe(503);
    expect((await handleMark(new Request("https://site.test/api/mark"), deps(ok(1)))).status).toBe(405);
  });
});
