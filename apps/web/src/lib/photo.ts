/**
 * Photo answers (SPEC §10.5): shrink a photo of handwritten working on the device, then have a vision
 * model transcribe it into text with maths, for the student to check before submitting. Photos are
 * never stored; only the checked text is marked.
 */
import { GEMINI_ENDPOINT, GEMINI_MODELS, MAX_IMAGE_DATA_URL, transcribeMessages, transcribeWithModels } from "@intellectify/content/marking";
import type { Backend } from "./backend";
import { loadByok } from "./byok";

/** Longest side, in pixels: plenty for handwriting, small enough to send quickly. */
const MAX_SIDE = 1600;

/** Read and shrink a photo to a JPEG data URL. */
export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.85, 0.7, 0.55]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= MAX_IMAGE_DATA_URL) return url;
  }
  throw new Error("That photo is too large. Try a closer, simpler shot.");
}

/** Transcribe a shrunk photo: with the student's own key if they have one, else with /api/transcribe. */
export async function transcribePhoto(backend: Backend, image: string): Promise<string> {
  const own = loadByok();
  if (own?.provider === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: own.key, dangerouslyAllowBrowser: true, maxRetries: 1 });
    const [system] = transcribeMessages(image);
    const data = image.slice(image.indexOf(",") + 1);
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: system!.content as string,
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data } }, { type: "text", text: "Transcribe this working." }] }],
    });
    if (res.stop_reason === "refusal") throw new Error("Claude declined to read this photo.");
    return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  }
  if (own) {
    const openai = own.provider === "openai";
    return transcribeWithModels({ image, endpoint: openai ? "https://api.openai.com/v1/chat/completions" : GEMINI_ENDPOINT, key: own.key, models: openai ? ["gpt-5-mini"] : GEMINI_MODELS });
  }
  const token = await backend.idToken();
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ image }),
  });
  const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok || !body.text) throw new Error(body.error ?? "Couldn't read the photo. Try again, or type your answer.");
  return body.text;
}
