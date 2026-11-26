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

function deps(gemini: (body: { model: string; messages: { content: string }[] }) => Response, extra: Partial<Deps> = {}): Deps & { seen: string[] } {
  const seen: string[] = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    seen.push(url);
    if (url.endsWith("/content/specialist/questions/s.k.json")) return Response.json([question, auto]);
    if (url.includes("generativelanguage")) return gemini(JSON.parse(init!.body as string));
    return new Response("not found", { status: 404 });
  }) as unknown as typeof globalThis.fetch;
  return { key: "k", firebaseProject: "p", models: ["m1"], fetch, verify: async (t) => (t === "good" ? "uid" : Promise.reject(new Error("bad"))), seen, ...extra };
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
    expect(d.seen.some((u) => u.includes("generativelanguage"))).toBe(false);
  });
  it("passes quota errors on as 429 so the client queues the job", async () => {
    const res = await handleMark(post(body), deps(() => new Response("quota", { status: 429 })));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
  it("is off without a key, and POST only", async () => {
    expect((await handleMark(post(body), deps(ok(1), { key: undefined }))).status).toBe(503);
    expect((await handleMark(new Request("https://site.test/api/mark"), deps(ok(1)))).status).toBe(405);
  });
});
