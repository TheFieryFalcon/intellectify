/**
 * Banned words (SPEC §13.2): checked here before posting or showing a name, and again in Firestore rules.
 * The list is content/banned-words.txt, built to /content/banned-words.json.
 */
import { bannedPattern } from "@intellectify/content/moderation";

let words: Promise<string[]> | null = null;
let loaded: string[] = [];
export function loadBannedWords(f: typeof fetch = fetch): Promise<string[]> {
  words ??= f("/content/banned-words.json")
    .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
    .catch(() => [])
    .then((w) => (loaded = w));
  return words;
}
export const bannedWords = () => loaded;

/** Lowercase, drop accents, and join letters spaced or dotted apart ("s.l.u.r" → "slur"). Swapped-in numbers and symbols are left for the pattern. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(?<![\w$@!|+#])(?:[\w$@!|+#][ .\-_*]){2,}[\w$@!|+#](?![\w$@!|+#])/g, (m) => m.replace(/[ .\-_*]/g, ""));
}

const patterns = new Map<string, RegExp>();
const patternFor = (w: string) => {
  if (!patterns.has(w)) patterns.set(w, new RegExp(bannedPattern([w])));
  return patterns.get(w)!;
};

/**
 * The first banned word in `text`, or null. Matches whole words, including spellings with numbers or
 * symbols swapped in ("5lut", "f4g"), repeated letters and spaced-out letters (the same pattern as the
 * Firestore rules, plus the spacing).
 */
export function findBanned(text: string, list: string[] = loaded): string | null {
  if (!list.length || !text) return null;
  const plain = text.toLowerCase();
  const joined = normalize(text);
  for (const w of list) if (patternFor(w).test(plain) || patternFor(w).test(joined)) return w;
  return null;
}

/** A display name safe to show: the name, or "Student" if it has a banned word. */
export const safeName = (name: string, list: string[] = loaded) => (findBanned(name, list) ? "Student" : name);
