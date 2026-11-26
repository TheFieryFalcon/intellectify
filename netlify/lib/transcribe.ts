/**
 * POST /api/transcribe (SPEC §10.5): turn a photo of handwritten working into text with the owner's
 * Gemini key, for the student to check before submitting. Signed-in students only; the photo is not stored.
 */
import { GEMINI_ENDPOINT, MAX_IMAGE_DATA_URL, MarkingError, transcribeWithModels } from "../../packages/content/src/marking";
import { authorize, fail, json, type Deps } from "./mark";

const IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function handleTranscribe(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return fail(405, "POST only", { Allow: "POST" });
  if (!deps.key) return fail(503, "photo answers are not configured");
  const denied = await authorize(req, deps);
  if (denied) return denied;

  let image: unknown;
  try {
    image = ((await req.json()) as { image?: unknown }).image;
  } catch {
    return fail(400, "body must be JSON");
  }
  if (typeof image !== "string" || image.length > MAX_IMAGE_DATA_URL || !IMAGE.test(image)) return fail(400, "send one JPEG, PNG or WebP photo, at most about 3 MB");

  try {
    const text = await transcribeWithModels({ image, endpoint: GEMINI_ENDPOINT, key: deps.key, models: deps.models, fetch: deps.fetch });
    return json({ text });
  } catch (e) {
    const err = e instanceof MarkingError ? e : new MarkingError(String(e), 503);
    console.error("transcription failed:", err.message);
    if (err.status === 429) return fail(429, "photo reading is busy; try again in a minute", { "Retry-After": "60" });
    return fail(503, "couldn't read the photo; try again, or type your answer");
  }
}
