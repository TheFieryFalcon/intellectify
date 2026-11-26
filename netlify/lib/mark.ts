/**
 * POST /api/mark (SPEC §10.2): mark a free-response answer with the owner's Groq key.
 * The question, rubric and model solution come from this deploy's own content files, never the
 * request, and only signed-in students (Firebase ID token) may use the key.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { fillServed, validPicks, type WordLists, type WordPicks } from "../../packages/content/src/template";
import { GROQ_ENDPOINT, MARKING_MODELS, TRANSCRIBE_MODELS, effortLevel, isRubricMarked, MAX_ANSWER, MAX_ARGUMENT, markWithModels, MarkingError, type Appeal, type MarkResult } from "../../packages/content/src/marking";
import type { QuestionT } from "../../packages/content/src/schema";

export interface MarkRequest {
  course: string;
  skill: string;
  questionId: string;
  variant: number | null;
  /** Words picked when it was served (SPEC §9.6), checked against the deployed word lists. */
  words?: WordPicks | null;
  answers: Record<string, string>;
  appeal?: Appeal;
  /** Marking effort, 1 (one run) or 2 (three runs, by consensus); default 2. */
  effort?: number;
}

export interface Deps {
  /** The Gemini API key, for reading photos (free tier); unset switches photo answers off. */
  key: string | undefined;
  /** Firebase project whose ID tokens are accepted; null skips the check (local testing only). */
  firebaseProject: string | null;
  /** Gemini models for reading photos, unless transcribeModels is set. */
  models: string[];
  /** The Groq key and models that mark every answer; an unset key switches marking off. */
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
  if (b.effort !== undefined && !(b.effort === 1 || b.effort === 2)) return "effort must be 1 or 2";
  if (b.appeal !== undefined) {
    const a = b.appeal as Partial<Appeal>;
    if (typeof a?.argument !== "string" || !a.argument.trim() || a.argument.length > MAX_ARGUMENT) return `appeal argument must be 1–${MAX_ARGUMENT} characters`;
    if (!a.previous || !Array.isArray(a.previous.criteria)) return "appeal needs the earlier verdict";
  }
  return b as MarkRequest;
}

export async function handleMark(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return fail(405, "POST only", { Allow: "POST" });
  if (!deps.groqKey) return fail(503, "marking is not configured");

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
  if (r.variant !== null && !q.variants?.[r.variant]) return fail(400, "unknown variant");
  let lists: WordLists = {};
  if (q.words) {
    const w = await deps.fetch(`${origin}/content/words.json`);
    if (!w.ok) return fail(503, "marking is unavailable; it will retry", { "Retry-After": "20" });
    lists = (await w.json()) as WordLists;
  }
  if (!validPicks(q.words, r.words ?? null, lists)) return fail(400, "bad words");
  q = fillServed(q, r.variant, r.words ?? null, lists);

  // Groq marks: fast, rarely busy and free. Gemini's free quota is kept for reading photos.
  const level = effortLevel("free", r.effort ?? 2);
  try {
    const result: MarkResult = await markWithModels({
      question: q,
      answers: r.answers,
      appeal: r.appeal,
      endpoint: GROQ_ENDPOINT,
      key: deps.groqKey,
      models: deps.groqModels ?? level.models,
      reasoningEffort: "medium",
      samples: level.runs,
      fetch: deps.fetch,
      timeout: 25_000,
      budget: 50_000,
    });
    return json({ result, questionVersion: q.version });
  } catch (e) {
    const err = e instanceof MarkingError ? e : new MarkingError(String(e), 503);
    console.error("marking failed:", err.message);
    // 429 and 503 tell the client to queue and retry with backoff.
    if (err.status === 429) return fail(429, "free marking is busy; it will retry", { "Retry-After": "60" });
    if (err.status === 401 || err.status === 403) return fail(503, "marking is not configured");
    return fail(503, "marking is unavailable; it will retry", { "Retry-After": "20" });
  }
}

export const depsFromEnv = (get: (k: string) => string | undefined): Deps => ({
  key: get("GEMINI_API_KEY"),
  firebaseProject: get("MARK_SKIP_AUTH") === "1" ? null : (get("FIREBASE_PROJECT_ID") ?? "intellectify-4357c"),
  models: MARKING_MODELS,
  groqKey: get("GROQ_API_KEY"),
  groqModels: get("GROQ_MODELS")?.split(",").map((s) => s.trim()).filter(Boolean),
  transcribeModels: get("TRANSCRIBE_MODELS")?.split(",").map((s) => s.trim()).filter(Boolean) ?? TRANSCRIBE_MODELS,
  fetch,
});
