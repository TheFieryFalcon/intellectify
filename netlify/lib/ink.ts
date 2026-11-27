/**
 * POST /api/ink (SPEC §7.2): handwritten maths → LaTeX with MyScript iink (Cloud REST "batch" API, free
 * tier: a shared monthly request quota). The owner's application and HMAC keys stay on the server; the
 * request is signed with HMAC-SHA512 (key = application key + HMAC key, message = the JSON body), as
 * MyScript's own iink-ts client does. Signed-in students only; the strokes are not stored.
 *
 * Replies: 200 { latex }, 429 when the month's quota is used up (the app then switches to the AI
 * fallback for the rest of the month), 503 when not configured or MyScript can't answer.
 */
import { authorize, fail, json, type Deps } from "./mark";

export const MYSCRIPT_URL = "https://cloud.myscript.com/api/v4.0/iink/batch";
/** Limits on what a student can send: a few lines of maths, not a drawing. */
export const MAX_STROKES = 400;
export const MAX_POINTS = 20_000;

export interface InkDeps extends Pick<Deps, "firebaseProject" | "fetch" | "verify"> {
  applicationKey: string | undefined;
  hmacKey: string | undefined;
}

export interface InkStroke {
  x: number[];
  y: number[];
  t?: number[];
}

export async function hmacHex(message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The batch request body for one piece of maths. */
export function mathRequest(strokes: InkStroke[], width: number, height: number) {
  return {
    configuration: {
      lang: "en_US",
      math: { solver: { enable: false }, margin: { top: 20, left: 10, right: 10, bottom: 10 }, mimeTypes: ["application/x-latex"] },
    },
    xDPI: 96,
    yDPI: 96,
    contentType: "Math",
    width: Math.round(width),
    height: Math.round(height),
    strokeGroups: [{ strokes: strokes.map((s) => ({ pointerType: "pen", x: s.x, y: s.y, ...(s.t ? { t: s.t } : {}) })) }],
  };
}

const finiteList = (v: unknown, n?: number): v is number[] => Array.isArray(v) && (n === undefined || v.length === n) && v.every((x) => typeof x === "number" && Number.isFinite(x));

export async function handleInk(req: Request, deps: InkDeps): Promise<Response> {
  if (req.method !== "POST") return fail(405, "POST only", { Allow: "POST" });
  if (!deps.applicationKey || !deps.hmacKey) return fail(503, "handwriting is not configured");
  const denied = await authorize(req, deps as Deps);
  if (denied) return denied;

  let body: { strokes?: unknown; width?: unknown; height?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fail(400, "body must be JSON");
  }
  const { strokes, width, height } = body;
  if (!Array.isArray(strokes) || !strokes.length || strokes.length > MAX_STROKES) return fail(400, `send 1 to ${MAX_STROKES} strokes`);
  let points = 0;
  for (const s of strokes as InkStroke[]) {
    if (!s || !finiteList(s.x) || !finiteList(s.y, s.x.length) || !s.x.length || (s.t !== undefined && !finiteList(s.t, s.x.length))) return fail(400, "each stroke needs x and y (and optional t) of equal length");
    points += s.x.length;
  }
  if (points > MAX_POINTS) return fail(400, "too much ink; write less at once");
  if (typeof width !== "number" || typeof height !== "number" || !(width > 0 && width < 10_000 && height > 0 && height < 10_000)) return fail(400, "bad pad size");

  const payload = JSON.stringify(mathRequest(strokes as InkStroke[], width, height));
  const res = await deps.fetch(MYSCRIPT_URL, {
    method: "POST",
    headers: {
      Accept: "application/json,application/x-latex",
      "Content-Type": "application/json",
      applicationKey: deps.applicationKey,
      hmac: await hmacHex(payload, deps.applicationKey + deps.hmacKey),
    },
    body: payload,
  });
  if (res.ok) {
    const text = (await res.text()).trim();
    // Some servers answer JSON ({ "application/x-latex": "…" }) rather than bare LaTeX.
    let latex = text;
    if (text.startsWith("{")) {
      try {
        const j = JSON.parse(text) as Record<string, unknown>;
        latex = String(j["application/x-latex"] ?? j.latex ?? j.result ?? "");
      } catch {
        /* bare LaTeX after all */
      }
    }
    return json({ latex: latex.trim() });
  }
  const detail = (await res.text().catch(() => "")).slice(0, 300);
  console.error(`MyScript ${res.status}: ${detail}`);
  // The free tier stops answering once the month's requests are used up.
  if (res.status === 429 || res.status === 402 || /quota|limit|exceeded|too many/i.test(detail)) return fail(429, "handwriting quota used up this month");
  if (/access\.not\.granted/.test(detail) || res.status === 401) return fail(503, "handwriting keys were refused");
  return fail(503, "couldn't read the handwriting");
}

export const inkDepsFromEnv = (get: (k: string) => string | undefined): InkDeps => ({
  applicationKey: get("MYSCRIPT_APPLICATION_KEY"),
  hmacKey: get("MYSCRIPT_HMAC_KEY"),
  firebaseProject: get("MARK_SKIP_AUTH") === "1" ? null : (get("FIREBASE_PROJECT_ID") ?? "intellectify-4357c"),
  fetch,
});
