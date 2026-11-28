/**
 * Answer history (SPEC §16.4b): every answer a student gives, kept in this browser only.
 * Never synced, so it costs no Firestore reads or writes. Oldest entries drop past MAX per course.
 */
import type { SubmittedSignals } from "./paste";
import type { WordPicks } from "@intellectify/content/template";

export type HistoryMode = "practice" | "quiz" | "challenge" | "daily" | "revision" | "shared";

export interface HistoryEntry {
  id: string;
  at: number;
  course: string;
  skill: string;
  questionId: string;
  variant: number | null;
  words: WordPicks | null;
  mode: HistoryMode;
  /** Auto-marked: the answer given per part ("" if none), and the attempt it was solved on (null = not solved). */
  answers: string[];
  solvedOn: (number | null)[] | null;
  /** Auto-marked outcome, 0–1. Written answers take theirs from the marking job. */
  outcome: number | null;
  /** Written answers: the marking job, which holds the score and feedback. */
  jobId?: string;
  /** Paste detector signals (SPEC §7.2): blocked outside pastes, bursts, seconds to answer. */
  signals?: SubmittedSignals | null;
}

export const MAX = 500;
const key = (course: string) => `intellectify:history:${course}`;

export function listHistory(course: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(key(course));
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "at"> & { at?: number }): void {
  const full: HistoryEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: entry.at ?? Date.now() };
  try {
    const all = [full, ...listHistory(entry.course)].slice(0, MAX);
    localStorage.setItem(key(entry.course), JSON.stringify(all));
  } catch {
    // Storage full or blocked: history is a convenience, so carry on without it.
  }
}

export function clearHistory(course: string): void {
  try {
    localStorage.removeItem(key(course));
  } catch {
    /* ignore */
  }
}
