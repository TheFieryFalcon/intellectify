/**
 * Share a problem by link (SPEC §16.4c): the question id, its numeric variant and its word picks, so the
 * person opening the link gets exactly the same problem. Nothing is stored; the link carries it all.
 */
import { validPicks, type WordLists, type WordPicks } from "@intellectify/content/template";
import type { QuestionT } from "./content";

/** Path and query for a served problem, e.g. /specialist/problem/spec.x.y?v=2&w=who.12,craft.3 */
export function sharePath(course: string, q: Pick<QuestionT, "id">, variant: number | null, words: WordPicks | null): string {
  const p = new URLSearchParams();
  if (variant !== null) p.set("v", String(variant));
  if (words && Object.keys(words).length) p.set("w", Object.entries(words).map(([slot, i]) => `${slot}.${i}`).join(","));
  const qs = p.toString();
  return `/${course}/problem/${encodeURIComponent(q.id)}${qs ? `?${qs.replace(/%2C/g, ",")}` : ""}`;
}

/**
 * The variant and words a link asks for, or null if they no longer fit the question (it changed since the
 * link was made; the page then serves fresh numbers and words and says so).
 */
export function readShare(params: URLSearchParams, q: Pick<QuestionT, "variants" | "words">, lists: WordLists): { variant: number | null; words: WordPicks | null } | null {
  const n = q.variants?.length ?? 0;
  const v = params.get("v");
  const variant = v === null ? null : Number(v);
  const variantOk = n ? Number.isInteger(variant) && variant! >= 0 && variant! < n : variant === null;
  const w = params.get("w");
  let words: WordPicks | null = null;
  if (w) {
    words = {};
    for (const part of w.split(",")) {
      const m = /^(\w+)\.(\d+)$/.exec(part);
      if (!m) return null;
      words[m[1]!] = Number(m[2]);
    }
  }
  const wordsOk = validPicks(q.words, words, lists);
  return variantOk && wordsOk ? { variant, words } : null;
}
