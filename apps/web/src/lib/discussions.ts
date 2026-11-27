/**
 * Discussions (SPEC §13): thread list and posts, each read once and kept for a short while, so browsing
 * costs few Firestore reads. Your own posts update the copies in place.
 */
import type { Backend, Post, ThreadSummary } from "./backend";

const TTL_MS = 2 * 60_000;
let threads: { at: number; data: Promise<ThreadSummary[]> } | null = null;
const posts = new Map<string, { at: number; data: Promise<Post[]> }>();

export function listThreads(backend: Backend, force = false): Promise<ThreadSummary[]> {
  if (force || !threads || Date.now() - threads.at > TTL_MS) {
    const data = backend.listThreads();
    threads = { at: Date.now(), data };
    data.catch(() => (threads = null));
  }
  return threads.data;
}

export function loadPosts(backend: Backend, key: string, force = false): Promise<Post[]> {
  const hit = posts.get(key);
  if (force || !hit || Date.now() - hit.at > TTL_MS) {
    const data = backend.loadPosts(key);
    posts.set(key, { at: Date.now(), data });
    data.catch(() => posts.delete(key));
    return data;
  }
  return hit.data;
}

/** Keep the cached copies in step with your own change, without re-reading. */
export function noteChange(key: string, next: Post[]) {
  posts.set(key, { at: Date.now(), data: Promise.resolve(next) });
  threads = null;
}
