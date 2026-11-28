/**
 * The question practice is showing in each skill (SPEC §16.4d), kept in this browser until it's answered,
 * so leaving and coming back shows the same question with the same numbers and words.
 */
import type { WordPicks } from "@intellectify/content/template";

export interface CurrentQuestion {
  id: string;
  variant: number | null;
  words: WordPicks | null;
}

const key = (course: string, skill: string) => `intellectify:current:${course}:${skill}`;

export function loadCurrent(course: string, skill: string): CurrentQuestion | null {
  try {
    const raw = localStorage.getItem(key(course, skill));
    return raw ? (JSON.parse(raw) as CurrentQuestion) : null;
  } catch {
    return null;
  }
}

export function saveCurrent(course: string, skill: string, q: CurrentQuestion | null): void {
  try {
    if (q) localStorage.setItem(key(course, skill), JSON.stringify(q));
    else localStorage.removeItem(key(course, skill));
  } catch {
    // Storage blocked: practice still works, it just serves a new question next visit.
  }
}
