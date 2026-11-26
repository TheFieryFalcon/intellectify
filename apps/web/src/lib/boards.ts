/**
 * The publicProfiles collection, read at most once every few minutes per browser tab and shared by the
 * leaderboards and every profile page (SPEC §12.2: keep Firestore reads low).
 */
import type { Backend, PublicProfile } from "./backend";

const TTL_MS = 5 * 60_000;
const KEY = "intellectify:boards";
let memo: { at: number; data: Promise<PublicProfile[]> } | null = null;

export function loadPublicProfiles(backend: Backend, force = false): Promise<PublicProfile[]> {
  const now = Date.now();
  if (!force && memo && now - memo.at < TTL_MS) return memo.data;
  if (!force && !memo) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as { at: number; data: PublicProfile[] } | null;
      if (cached && now - cached.at < TTL_MS) {
        memo = { at: cached.at, data: Promise.resolve(cached.data) };
        return memo.data;
      }
    } catch {
      /* no session storage */
    }
  }
  const data = backend.listPublic().then((list) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ at: now, data: list }));
    } catch {
      /* too big or blocked: memory only */
    }
    return list;
  });
  memo = { at: now, data };
  data.catch(() => (memo = null));
  return data;
}

/** When the shared copy was read, for a "Updated" label. */
export const boardsReadAt = () => memo?.at ?? null;
