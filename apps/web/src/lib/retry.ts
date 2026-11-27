/**
 * Loads that a student's saved progress depends on are retried before giving up, because a failed load
 * must never be mistaken for "nothing saved yet": that would show a new student and then save the
 * empty state over the real one.
 */
export async function withRetry<T>(load: () => Promise<T>, delays: number[] = [600, 1800]): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await load();
    } catch (err) {
      if (i >= delays.length) throw err;
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
}
