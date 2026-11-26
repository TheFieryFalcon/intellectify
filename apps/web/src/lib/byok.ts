/**
 * Bring-your-own marking key (SPEC §10.4): stored only in this browser, sent only to the provider.
 */
export type ByokProvider = "gemini" | "openai" | "anthropic";
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
