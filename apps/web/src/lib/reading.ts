/**
 * Tutorial reading time (SPEC §12.4): reading a tutorial earns XP only after the time it takes to read
 * at 600 words a minute, the speed of a fast, educated reader, so scrolling straight to the end earns nothing.
 */
export const READING_WPM = 600;

/** Words a reader reads: prose words, with each piece of maths counted as one word and diagrams skipped. */
export function wordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " m ")
    .replace(/\$[^$\n]+\$/g, " m ")
    .replace(/[#*_>|`-]+/g, " ");
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Seconds of reading needed before a tutorial earns XP. */
export const readingSeconds = (markdown: string, wpm = READING_WPM) => Math.ceil((wordCount(markdown) / wpm) * 60);
