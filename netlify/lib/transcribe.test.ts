import { describe, expect, it } from "vitest";
import { handleTranscribe } from "./transcribe";
import type { Deps } from "./mark";

const png = "data:image/png;base64,iVBORw0KGgo=";
function deps(reply: () => Response, extra: Partial<Deps> = {}): Deps & { calls: unknown[] } {
  const calls: unknown[] = [];
  const fetch = (async (_url: string, init: RequestInit) => (calls.push(JSON.parse(init.body as string)), reply())) as unknown as typeof globalThis.fetch;
  return { key: "k", firebaseProject: "p", models: ["m1"], fetch, verify: async (t) => (t === "good" ? "uid" : Promise.reject(new Error("bad"))), calls, ...extra };
}
const post = (body: unknown, token: string | null = "good") =>
  new Request("https://site.test/api/transcribe", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) });
const ok = (text: string) => () => Response.json({ choices: [{ message: { content: text } }] });

describe("/api/transcribe", () => {
  it("returns the transcription and sends the photo as an image part", async () => {
    const d = deps(ok("Let $n = 2k + 1$."));
    const res = await handleTranscribe(post({ image: png }), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: "Let $n = 2k + 1$." });
    const msg = (d.calls[0] as { messages: { content: unknown }[] }).messages[1]!.content as { type: string; image_url?: { url: string } }[];
    expect(msg.some((p) => p.type === "image_url" && p.image_url?.url === png)).toBe(true);
  });
  it("needs a sign-in, and only accepts a photo", async () => {
    expect((await handleTranscribe(post({ image: png }, null), deps(ok("x")))).status).toBe(401);
    const d = deps(ok("x"));
    for (const image of ["https://evil.test/a.png", "data:text/html;base64,PGgxPg==", "data:image/png;base64," + "A".repeat(4_000_001), 42]) {
      expect((await handleTranscribe(post({ image }), d)).status).toBe(400);
    }
    expect(d.calls).toHaveLength(0);
  });
  it("reads several photos as pages of one answer, in order", async () => {
    const d = deps(ok("page one\npage two"));
    const two = "data:image/jpeg;base64,/9j/2wBD";
    expect((await handleTranscribe(post({ images: [png, two] }), d)).status).toBe(200);
    const parts = (d.calls[0] as { messages: { content: unknown }[] }).messages[1]!.content as { type: string; image_url?: { url: string } }[];
    expect(parts.filter((p) => p.type === "image_url").map((p) => p.image_url!.url)).toEqual([png, two]);
    expect((await handleTranscribe(post({ images: Array(7).fill(png) }), d)).status).toBe(400);
  });
  it("passes quota errors on as 429", async () => {
    expect((await handleTranscribe(post({ image: png }), deps(() => new Response("q", { status: 429 })))).status).toBe(429);
  });
});
