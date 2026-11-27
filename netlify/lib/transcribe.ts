/**
 * POST /api/transcribe (SPEC §10.5): turn a photo of handwritten working into text with the owner's
 * Gemini key, for the student to check before submitting. Signed-in students only; the photo is not stored.
 */
import { GEMINI_ENDPOINT, MAX_IMAGE_DATA_URL, MAX_IMAGES, MAX_IMAGES_TOTAL, MarkingError, transcribeWithModels } from "../../packages/content/src/marking";
import { authorize, fail, json, type Deps } from "./mark";

const IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function handleTranscribe(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return fail(405, "POST only", { Allow: "POST" });
  if (!deps.key) return fail(503, "photo answers are not configured");
  const denied = await authorize(req, deps);
  if (denied) return denied;

  // One or more photos: the pages of one answer, in order.
  let body: { images?: unknown; image?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fail(400, "body must be JSON");
  }
  const images = Array.isArray(body.images) ? body.images : [body.image];
  if (!images.length || images.length > MAX_IMAGES) return fail(400, `send 1 to ${MAX_IMAGES} photos`);
  if (images.some((x) => typeof x !== "string" || x.length > MAX_IMAGE_DATA_URL || !IMAGE.test(x))) return fail(400, "photos must be JPEG, PNG or WebP, each at most about 3 MB");
  if ((images as string[]).reduce((t, x) => t + x.length, 0) > MAX_IMAGES_TOTAL) return fail(400, "those photos are too large together; send fewer");

  try {
    const text = await transcribeWithModels({ images: images as string[], endpoint: GEMINI_ENDPOINT, key: deps.key, models: deps.transcribeModels ?? deps.models, fetch: deps.fetch });
    return json({ text });
  } catch (e) {
    const err = e instanceof MarkingError ? e : new MarkingError(String(e), 503);
    console.error("transcription failed:", err.message);
    if (err.status === 429) return fail(429, "photo reading is busy; try again in a minute", { "Retry-After": "60" });
    return fail(503, "couldn't read the photo; try again, or type your answer");
  }
}
