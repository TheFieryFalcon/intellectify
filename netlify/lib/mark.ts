/**
 * POST /api/mark (SPEC §10.2): mark a free-response answer with the owner's Gemini key.
 * The question, rubric and model solution come from this deploy's own content files, never the
 * request, and only signed-in students (Firebase ID token) may use the key.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { fillTemplate } from "../../packages/content/src/template";
import { GEMINI_ENDPOINT, GROQ_ENDPOINT, GROQ_MODELS, MARKING_MODELS, TRANSCRIBE_MODELS, isRubricMarked, MAX_ANSWER, MAX_ARGUMENT, markWithModels, MarkingError, type Appeal, type MarkResult } from "../../packages/content/src/marking";
import type { QuestionT } from "../../packages/content/src/schema";

export interface MarkRequest {
  course: string;
  skill: string;
  questionId: string;
  variant: number | null;
  answers: Record<string, string>;
  appeal?: Appeal;
  /** The answer was read from photos of paper working (marked by Gemini first, below). */
  photo?: boolean;
}

/** The pass mark for a written answer (SPEC §6.3). */
const PASS = 0.6;

export interface Deps {
  /** The Gemini API key; unset means marking is switched off. */
  key: string | undefined;
  /** Firebase project whose ID tokens are accepted; null skips the check (local testing only). */
  firebaseProject: string | null;
  /** Models for marking, and for reading photos. */
  models: string[];
  /** Groq key and models: tried first for marking when set (fast, rarely busy), then Gemini. */
  groqKey?: string;
  groqModels?: string[];
  transcribeModels?: string[];
  fetch: typeof fetch;
  verify?: (token: string) => Promise<string>;
}

const ID = /^[a-z0-9][a-z0-9.-]{0,120}$/;
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });
export const fail = (status: number, error: string, headers?: Record<string, string>) => json({ error }, status, headers);

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
/** Verify a Firebase ID token; returns the uid. */
export async function verifyFirebaseToken(token: string, project: string): Promise<string> {
  jwks ??= createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
  const { payload } = await jwtVerify(token, jwks, { issuer: `https://securetoken.google.com/${project}`, audience: project });
  if (!payload.sub) throw new Error("token has no subject");
  return payload.sub;
}

/** Only signed-in students (a valid Firebase ID token) may use the owner's key. Returns a 401, or null if allowed. */
export async function authorize(req: Request, deps: Deps): Promise<Response | null> {
  if (!deps.firebaseProject) return null;
  const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return fail(401, "sign in to use marking");
  try {
    await (deps.verify ?? ((t) => verifyFirebaseToken(t, deps.firebaseProject!)))(token);
    return null;
  } catch {
    return fail(401, "sign in again to use marking");
  }
}

/** Light shape check: the request is untrusted. */
function parse(body: unknown): MarkRequest | string {
  const b = body as Partial<MarkRequest> | null;
  if (!b || typeof b !== "object") return "body must be JSON";
  if (typeof b.course !== "string" || !ID.test(b.course)) return "bad course";
  if (typeof b.skill !== "string" || !ID.test(b.skill)) return "bad skill";
  if (typeof b.questionId !== "string" || !ID.test(b.questionId)) return "bad questionId";
  if (b.variant !== null && !(Number.isInteger(b.variant) && (b.variant as number) >= 0)) return "bad variant";
  if (!b.answers || typeof b.answers !== "object") return "answers missing";
  for (const v of Object.values(b.answers)) if (typeof v !== "string" || v.length > MAX_ANSWER) return `answers must be text of at most ${MAX_ANSWER} characters`;
  if (b.photo !== undefined && typeof b.photo !== "boolean") return "bad photo";
  if (b.appeal !== undefined) {
    const a = b.appeal as Partial<Appeal>;
    if (typeof a?.argument !== "string" || !a.argument.trim() || a.argument.length > MAX_ARGUMENT) return `appeal argument must be 1–${MAX_ARGUMENT} characters`;
    if (!a.previous || !Array.isArray(a.previous.criteria)) return "appeal needs the earlier verdict";
  }
  return b as MarkRequest;
}

export async function handleMark(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return fail(405, "POST only", { Allow: "POST" });
  if (!deps.key && !deps.groqKey) return fail(503, "marking is not configured");

  const denied = await authorize(req, deps);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "body must be JSON");
  }
  const r = parse(body);
  if (typeof r === "string") return fail(400, r);

  // The question comes from this deploy's content, so the rubric and solution can't be tampered with.
  const origin = new URL(req.url).origin;
  const res = await deps.fetch(`${origin}/content/${r.course}/questions/${r.skill}.json`);
  if (!res.ok) return fail(404, "unknown skill");
  const pool = (await res.json()) as QuestionT[];
  let q = pool.find((x) => x.id === r.questionId);
  if (!q || !isRubricMarked(q)) return fail(404, "unknown free-response question");
  if (r.variant !== null) {
    const v = q.variants?.[r.variant];
    if (!v) return fail(400, "unknown variant");
    q = fillTemplate(q, v);
  }

  // Two markers, tried in turn. Groq is fast and rarely busy, and right on typed answers. Gemini judges
  // messy photographed working (slips, misread symbols, non-standard methods) far better, so it goes
  // first for photo answers; either one stands in when the other is busy.
  const groq = deps.groqKey ? { endpoint: GROQ_ENDPOINT, key: deps.groqKey, models: deps.groqModels ?? GROQ_MODELS, reasoningEffort: "medium" as const, samples: 1 } : null;
  const gemini = deps.key ? { endpoint: GEMINI_ENDPOINT, key: deps.key, models: deps.models, reasoningEffort: "low" as const } : null;
  const order = (r.photo ? [gemini, groq] : [groq, gemini]).filter((m) => m !== null);
  // Netlify functions stop at 60 s: the first marker leaves room for the second.
  const budgets = order.length > 1 ? [order[0] === gemini ? 36_000 : 20_000, order[0] === gemini ? 18_000 : 32_000] : [50_000];
  let last: MarkingError = new MarkingError("no markers", 503);
  for (const [i, m] of order.entries()) {
    try {
      const result: MarkResult = await markWithModels({ question: q, answers: r.answers, appeal: r.appeal, ...m, fetch: deps.fetch, timeout: Math.min(22_000, budgets[i]!), budget: budgets[i]! });
      // Groq standing in on a photo answer: its pass stands, but its fail is unreliable on messy
      // working, so that answer waits (queued, with backoff) for Gemini instead.
      if (r.photo && m === groq && gemini && result.score < PASS) throw new MarkingError("Groq fail on a photo answer: waiting for Gemini", 503);
      return json({ result, questionVersion: q.version });
    } catch (e) {
      last = e instanceof MarkingError ? e : new MarkingError(String(e), 503);
      console.error(`marking failed (${m.endpoint === GROQ_ENDPOINT ? "Groq" : "Gemini"}):`, last.message);
    }
  }
  // 429 and 503 tell the client to queue and retry with backoff.
  if (last.status === 429) return fail(429, "free marking is busy; it will retry", { "Retry-After": "60" });
  if (last.status === 401 || last.status === 403) return fail(503, "marking is not configured");
  return fail(503, "marking is unavailable; it will retry", { "Retry-After": "20" });
}

export const depsFromEnv = (get: (k: string) => string | undefined): Deps => ({
  key: get("GEMINI_API_KEY"),
  firebaseProject: get("MARK_SKIP_AUTH") === "1" ? null : (get("FIREBASE_PROJECT_ID") ?? "intellectify-4357c"),
  models: get("MARK_MODELS")?.split(",").map((s) => s.trim()).filter(Boolean) ?? MARKING_MODELS,
  groqKey: get("GROQ_API_KEY"),
  groqModels: get("GROQ_MODELS")?.split(",").map((s) => s.trim()).filter(Boolean),
  transcribeModels: get("TRANSCRIBE_MODELS")?.split(",").map((s) => s.trim()).filter(Boolean) ?? TRANSCRIBE_MODELS,
  fetch,
});
