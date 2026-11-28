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

/**
 * Check a key with the provider's cheapest call, listing models (SPEC §16.5: test-key button). Nothing
 * is marked and nothing is charged. Returns "ok", "refused" (bad key) or "unreachable".
 */
export async function testKey(byok: Byok): Promise<"ok" | "refused" | "unreachable"> {
  try {
    if (byok.provider === "anthropic") {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: byok.key, dangerouslyAllowBrowser: true, maxRetries: 0 });
      try {
        await client.models.list({ limit: 1 });
        return "ok";
      } catch (e) {
        return e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError ? "refused" : "unreachable";
      }
    }
    const url = byok.provider === "openai" ? "https://api.openai.com/v1/models" : "https://generativelanguage.googleapis.com/v1beta/openai/models";
    const res = await fetch(url, { headers: { Authorization: `Bearer ${byok.key}` } });
    if (res.ok) return "ok";
    return res.status === 400 || res.status === 401 || res.status === 403 ? "refused" : "unreachable";
  } catch {
    return "unreachable";
  }
}
