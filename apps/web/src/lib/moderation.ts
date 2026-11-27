/**
 * Banned words (SPEC §13.2): checked here before posting or showing a name, and again in Firestore rules.
 * The list is content/banned-words.txt, built to /content/banned-words.json.
 */
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

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };
/** Lowercase, undo common letter swaps, and join letters spaced or dotted apart ("s.l.u.r"). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$!]/g, (c) => LEET[c] ?? c)
    .replace(/\b(?:\w[ .\-_*]){2,}\w\b/g, (m) => m.replace(/[ .\-_*]/g, ""));
}

/** The first banned word in `text` (whole words, after normalizing), or null. */
export function findBanned(text: string, list: string[] = loaded): string | null {
  if (!list.length || !text) return null;
  const norm = normalize(text);
  for (const w of list) if (new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es|ed|ing)?(?![a-z])`).test(norm)) return w;
  return null;
}

/** A display name safe to show: the name, or "Student" if it has a banned word. */
export const safeName = (name: string, list: string[] = loaded) => (findBanned(name, list) ? "Student" : name);
