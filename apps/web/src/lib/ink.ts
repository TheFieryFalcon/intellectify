/**
 * Handwritten maths (SPEC §7.2): strokes from the pad are read by MyScript (/api/ink, a shared monthly
 * free quota). When the quota runs out, MyScript is skipped until next month and a vision model reads a
 * picture of the ink instead (the student's own key if set, else the free photo reader); the same happens
 * for any one request MyScript can't answer. The student always checks the result before it's used.
 */
import type { Backend } from "./backend/types";
import { transcribePhotos } from "./photo";

export interface Stroke {
  x: number[];
  y: number[];
  t: number[];
}
export interface InkResult {
  latex: string;
  via: "myscript" | "ai";
}

const QUOTA_KEY = "intellectify:ink-quota-out";
const SETTING_KEY = "intellectify:stylus";
const month = () => new Date().toISOString().slice(0, 7);

/** Has MyScript's quota run out this month (in this browser)? */
export function quotaOut(): boolean {
  try {
    return localStorage.getItem(QUOTA_KEY) === month();
  } catch {
    return false;
  }
}
function markQuotaOut() {
  try {
    localStorage.setItem(QUOTA_KEY, month());
  } catch {
    /* storage blocked: MyScript is just asked again next time */
  }
}

/** The Settings switch for the handwriting pad (on unless turned off). */
export function stylusOn(): boolean {
  try {
    return localStorage.getItem(SETTING_KEY) !== "off";
  } catch {
    return true;
  }
}
export function setStylus(on: boolean) {
  try {
    localStorage.setItem(SETTING_KEY, on ? "on" : "off");
  } catch {
    /* storage blocked */
  }
}

/** A vision model's transcription as bare LaTeX for a maths field: no $ delimiters or prose wrapper. */
export function asLatex(text: string): string {
  let t = text.trim();
  const m = t.match(/^\$\$([\s\S]*)\$\$$/) ?? t.match(/^\$([\s\S]*)\$$/) ?? t.match(/^\\\[([\s\S]*)\\\]$/) ?? t.match(/^\\\(([\s\S]*)\\\)$/);
  if (m) t = m[1]!.trim();
  return t.replace(/\$/g, "").trim();
}

/** Read the ink: MyScript first (unless its quota is out), else the AI reader on a picture of the pad. */
export async function recognizeInk(backend: Backend | null, strokes: Stroke[], size: { width: number; height: number }, picture: () => string): Promise<InkResult> {
  if (!quotaOut() && backend) {
    try {
      const token = await backend.idToken();
      const res = await fetch("/api/ink", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ strokes, ...size }),
      });
      if (res.ok) {
        const { latex } = (await res.json()) as { latex: string };
        if (latex) return { latex, via: "myscript" };
      } else if (res.status === 429) markQuotaOut();
    } catch {
      /* offline or no function (local mode): fall through to the AI reader */
    }
  }
  if (!backend) throw new Error("Sign in to read handwriting");
  const text = await transcribePhotos(backend, [picture()]);
  return { latex: asLatex(text), via: "ai" };
}
