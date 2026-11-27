import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { handleInk, hmacHex, type InkDeps } from "./ink";

const stroke = { x: [10, 20, 30], y: [10, 20, 10], t: [0, 10, 20] };
function deps(reply: () => Response, extra: Partial<InkDeps> = {}): InkDeps & { calls: { url: string; init: RequestInit }[] } {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = (async (url: string, init: RequestInit) => (calls.push({ url, init }), reply())) as unknown as typeof globalThis.fetch;
  return { applicationKey: "app", hmacKey: "secret", firebaseProject: "p", fetch, verify: async (t) => (t === "good" ? "uid" : Promise.reject(new Error("bad"))), calls, ...extra };
}
const post = (body: unknown, token: string | null = "good") =>
  new Request("https://site.test/api/ink", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) });

describe("/api/ink", () => {
  it("signs the request as MyScript expects and returns the LaTeX", async () => {
    const d = deps(() => new Response("\\frac{1}{2}", { headers: { "content-type": "application/x-latex" } }));
    const res = await handleInk(post({ strokes: [stroke], width: 300, height: 120 }), d);
    expect(await res.json()).toEqual({ latex: "\\frac{1}{2}" });
    const { url, init } = d.calls[0]!;
    expect(url).toBe("https://cloud.myscript.com/api/v4.0/iink/batch");
    const headers = init.headers as Record<string, string>;
    expect(headers.applicationKey).toBe("app");
    expect(headers.hmac).toBe(createHmac("sha512", "appsecret").update(init.body as string).digest("hex"));
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ contentType: "Math", xDPI: 96, width: 300, height: 120, configuration: { math: { mimeTypes: ["application/x-latex"] } } });
    expect(body.strokeGroups[0].strokes[0]).toEqual({ pointerType: "pen", ...stroke });
  });
  it("needs a sign-in and sane strokes, and nothing is sent otherwise", async () => {
    const d = deps(() => new Response("x"));
    expect((await handleInk(post({ strokes: [stroke], width: 300, height: 120 }, null), d)).status).toBe(401);
    for (const bad of [{ strokes: [], width: 1, height: 1 }, { strokes: [{ x: [1], y: [] }], width: 1, height: 1 }, { strokes: [stroke], width: -1, height: 1 }, { strokes: [{ x: ["1"], y: [1] }], width: 1, height: 1 }]) {
      expect((await handleInk(post(bad), d)).status).toBe(400);
    }
    expect(d.calls).toHaveLength(0);
  });
  it("reports an exhausted quota as 429 and missing keys as 503", async () => {
    const quota = deps(() => Response.json({ code: "quota.exceeded", message: "Monthly quota exceeded" }, { status: 403 }));
    expect((await handleInk(post({ strokes: [stroke], width: 300, height: 120 }), quota)).status).toBe(429);
    expect((await handleInk(post({ strokes: [stroke], width: 300, height: 120 }), deps(() => new Response("x"), { hmacKey: undefined }))).status).toBe(503);
  });
  it("computes HMAC-SHA512 in hex", async () => {
    expect(await hmacHex("body", "k")).toBe(createHmac("sha512", "k").update("body").digest("hex"));
  });
});
