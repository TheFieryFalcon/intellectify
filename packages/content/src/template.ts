/** Fill `{{name}}` placeholders from a variant's parameters and the served words. Browser-safe (no Node imports). */
export function fillTemplate<T>(value: T, params: Record<string, string | number>): T {
  const sub = (s: string) => s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  const walk = (v: unknown): unknown =>
    typeof v === "string" ? sub(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
  return walk(value) as T;
}

/**
 * Word variety (SPEC §9.6): a question names word lists per slot (`words: { who: person }`), and each
 * serve picks an entry from each at random. A served question stores its picks (entry indices), so it
 * reads the same when marked or resumed.
 */
export type WordEntry = string | Record<string, string>;
export type WordLists = Record<string, WordEntry[]>;
export type WordPicks = Record<string, number>;

const vowel = /^[aeiou]/i;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Random picks for a question's slots; two slots on the same list never get the same entry. */
export function pickWords(slots: Record<string, string> | undefined, lists: WordLists, rand: () => number = Math.random): WordPicks | null {
  if (!slots || !Object.keys(slots).length) return null;
  const taken: Record<string, Set<number>> = {};
  const picks: WordPicks = {};
  for (const [slot, list] of Object.entries(slots)) {
    const n = lists[list]?.length ?? 0;
    if (!n) continue; // lists not loaded (offline): the build guarantees every list exists
    const used = (taken[list] ??= new Set());
    const free = Array.from({ length: n }, (_, i) => i).filter((i) => !used.has(i));
    const i = free[Math.floor(rand() * free.length)] ?? 0;
    used.add(i);
    picks[slot] = i;
  }
  return picks;
}

/** Whether stored picks fit a question's slots (the server checks picks sent by the browser). */
export function validPicks(slots: Record<string, string> | undefined, picks: unknown, lists: WordLists): picks is WordPicks | null {
  if (!slots || !Object.keys(slots).length) return picks === null || picks === undefined;
  if (!picks || typeof picks !== "object") return false;
  const p = picks as Record<string, unknown>;
  if (Object.keys(p).length !== Object.keys(slots).length) return false;
  return Object.entries(slots).every(([slot, list]) => Number.isInteger(p[slot]) && (p[slot] as number) >= 0 && (p[slot] as number) < (lists[list]?.length ?? 0));
}

/** The placeholder values for picked words: {{slot}}, {{slot.a}}, {{slot.A}}, {{slot.Cap}} and {{slot.field}}. */
export function wordParams(slots: Record<string, string> | undefined, picks: WordPicks | null, lists: WordLists): Record<string, string> {
  const out: Record<string, string> = {};
  if (!slots || !picks) return out;
  for (const [slot, list] of Object.entries(slots)) {
    const entry = lists[list]?.[picks[slot] ?? 0];
    if (entry === undefined) continue;
    const name = typeof entry === "string" ? entry : (entry.name ?? "");
    if (typeof entry === "object") for (const [k, v] of Object.entries(entry)) out[`${slot}.${k}`] = v;
    const a = `${vowel.test(name) ? "an" : "a"} ${name}`;
    Object.assign(out, { [slot]: name, [`${slot}.a`]: a, [`${slot}.A`]: cap(a), [`${slot}.Cap`]: cap(name) });
  }
  return out;
}

/** A question as served: its numeric variant (if any) and its picked words (if any) filled in. */
export function fillServed<Q extends { variants?: Record<string, string | number>[]; words?: Record<string, string> }>(
  q: Q,
  variant: number | null,
  picks: WordPicks | null,
  lists: WordLists,
): Q {
  const params = { ...(variant !== null ? q.variants?.[variant] : undefined), ...wordParams(q.words, picks, lists) };
  return Object.keys(params).length ? fillTemplate(q, params) : q;
}
