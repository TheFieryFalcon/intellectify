/**
 * Bring-your-own marking key (SPEC §10.4): stored only in this browser, sent only to the provider.
 */
import { clampEffort, type MarkProvider } from "@intellectify/content/marking";

export type ByokProvider = Exclude<MarkProvider, "free">;
export interface Byok {
  provider: ByokProvider;
  key: string;
}

const KEY = "intellectify:byok";

export function loadByok(): Byok | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Byok | null;
    return v && typeof v.key === "string" && v.key && ["gemini", "openai", "anthropic"].includes(v.provider) ? v : null;
  } catch {
    return null;
  }
}

export function saveByok(v: Byok | null) {
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the key just isn't remembered */
  }
}

export const PROVIDER_LABEL: Record<ByokProvider, string> = { gemini: "Gemini", openai: "OpenAI", anthropic: "Claude" };

/** Marking effort per marker (SPEC §10.4): 1–2 for the free marker, 1–10 with an own key. */
const EFFORT_KEY = "intellectify:effort";
type EffortStore = Partial<Record<MarkProvider, number>>;
function readEffort(): EffortStore {
  try {
    const v = JSON.parse(localStorage.getItem(EFFORT_KEY) ?? "{}") as EffortStore;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
export const loadEffort = (p: MarkProvider): number => clampEffort(p, readEffort()[p]);
export function saveEffort(p: MarkProvider, level: number) {
  try {
    localStorage.setItem(EFFORT_KEY, JSON.stringify({ ...readEffort(), [p]: clampEffort(p, level) }));
  } catch {
    /* storage blocked: the default level is used */
  }
}
