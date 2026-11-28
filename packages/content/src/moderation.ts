/**
 * Banned-word matching (SPEC §14.2), shared by the app and the Firestore rules so both catch the same
 * spellings. Browser-safe. Each letter also matches the numbers and symbols people swap in for it
 * ("5lut", "f4g", "n1gg3r"), and may repeat ("sluuut"); a phrase's words may be split by anything.
 * Plain numbers never match: a word can't start with a digit unless a real letter comes next.
 * The pattern uses no backslashes or quotes, so it drops into a rules string as it is.
 */

/** What each letter may be written as. */
export const SUBSTITUTES: Record<string, string> = {
  a: "a4@",
  b: "b8",
  e: "e3",
  g: "g69",
  h: "h#",
  i: "i1!|l",
  l: "l1|i",
  o: "o0",
  s: "s5$",
  t: "t7+",
  z: "z2",
};

const letter = (c: string) => `[${SUBSTITUTES[c] ?? c}]+`;
const noDigits = (c: string) => `[${(SUBSTITUTES[c] ?? c).replace(/[0-9]/g, "")}]+`;
const digitsOf = (c: string) => (SUBSTITUTES[c] ?? "").replace(/[^0-9]/g, "");

/**
 * A word may start with a swapped-in digit only if a real letter follows it ("5lut" yes, "480" no:
 * a plain number never reads as a word).
 */
function firstPart(part: string): string {
  const [c1, c2, ...rest] = [...part];
  const tail = rest.map(letter).join("");
  const plain = noDigits(c1!) + (c2 ? letter(c2) : "") + tail;
  const d = digitsOf(c1!);
  return d && c2 ? `(${plain}|[${d}]+[${c2}]+${tail})` : plain;
}
const word = (w: string) =>
  w
    .split(" ")
    .map((part, i) => (i === 0 ? firstPart(part) : [...part].map(letter).join("")))
    .join("[^a-z0-9]+");

/** Plural and verb endings, with substitutes too. */
const SUFFIX = `(${letter("s")}|${letter("e")}${letter("s")}|${letter("e")}d|${letter("i")}ng)?`;

/**
 * The pattern for a list of lowercase words, matched against lowercased text. It finds a word standing
 * on its own: not inside another word, so "class" never trips "ass" and "Scunthorpe" is fine.
 */
export function bannedPattern(words: string[]): string {
  const ok = words.map((w) => w.trim().toLowerCase()).filter((w) => /^[a-z][a-z ]*$/.test(w));
  if (!ok.length) return "(?!)";
  return `(^|[^a-z0-9])(${ok.map(word).join("|")})${SUFFIX}([^a-z0-9]|$)`;
}
