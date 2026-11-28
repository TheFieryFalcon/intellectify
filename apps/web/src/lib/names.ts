/** Display names (SPEC §12.3): 2–30 characters, no banned words (§14.2). Returns an error, or null if fine. */
import { findBanned } from "./moderation";

export const NAME_MAX = 30;
export function nameError(raw: string, banned: string[]): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) return "Use at least 2 characters.";
  if (name.length > NAME_MAX) return `Use at most ${NAME_MAX} characters.`;
  if (findBanned(name, banned)) return "That name has a word that isn't allowed. Choose another.";
  return null;
}
export const cleanName = (raw: string) => raw.trim().replace(/\s+/g, " ");
