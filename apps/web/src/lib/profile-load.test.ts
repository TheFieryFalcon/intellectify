import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";
import { ProfileStore } from "./profile.svelte";
import type { Backend, User } from "./backend/types";

const user: User = { uid: "u1", displayName: "Student", email: null, local: false };

describe("loading saved progress", () => {
  it("retries a failed load before giving up", async () => {
    let calls = 0;
    const ok = await withRetry(async () => (++calls < 3 ? Promise.reject(new Error("offline")) : "data"), [1, 1]);
    expect([ok, calls]).toEqual(["data", 3]);
    await expect(withRetry(() => Promise.reject(new Error("offline")), [1])).rejects.toThrow("offline");
  });

  it("never mistakes a failed profile load for a new student, or saves over the real one", async () => {
    const backend = {
      loadProfile: vi.fn().mockRejectedValue(new Error("client is offline")),
      grantXp: vi.fn().mockResolvedValue(undefined),
      savePublic: vi.fn().mockResolvedValue(undefined),
      saveDaily: vi.fn().mockResolvedValue(undefined),
      setPlacement: vi.fn().mockResolvedValue(undefined),
    } as unknown as Backend;
    vi.useFakeTimers();
    const store = new ProfileStore(backend, user);
    const loading = store.load();
    await vi.runAllTimersAsync(); // the retries
    await loading;
    vi.useRealTimers();
    expect(backend.loadProfile).toHaveBeenCalledTimes(3);
    expect(store.failed).toBe(true);
    expect(store.loaded).toBe(true);
    // No first-visit XP, no XP for answers, no daily record, no public mirror.
    await store.grantQuestion("q1", 3, 1);
    await store.recordDaily("2026-11-27:specialist:11", "2026-11-27", true);
    store.countProblem();
    await store.flush();
    expect(backend.grantXp).not.toHaveBeenCalled();
    expect(backend.saveDaily).not.toHaveBeenCalled();
    expect(backend.savePublic).not.toHaveBeenCalled();
    await expect(store.setPlacement({ mark: 80, source: "y10", tiers: {}, at: 0 })).rejects.toThrow();
    expect(backend.setPlacement).not.toHaveBeenCalled();
  });
});

describe("saving from an out-of-date tab", () => {
  it("never lowers XP, the daily record or the counters that are already saved", async () => {
    const { emptyProfile } = await import("./backend/types");
    const saved = {
      ...emptyProfile(),
      xp: 244,
      placement: { mark: 96, source: "y11-methods" as const, tiers: { specialist: 4 }, at: 1 },
      lastVisitDay: "2026-11-27",
      daily: { lastSolved: "2026-11-27", streak: 1, best: 1, done: { "2026-11-27:specialist:11": "solved" as const } },
      stats: { problems: 2, day: "2026-11-27", dayProblems: 2, week: "2026-11-23", weekProblems: 2, weekXp: 244, month: "2026-11", monthXp: 244 },
    };
    // This tab loaded an earlier state; the newer one was saved since (another tab or device).
    const loads = [{ ...saved, xp: 158, daily: null, stats: { ...saved.stats, problems: 0, dayProblems: 0, weekProblems: 0, weekXp: 0, monthXp: 0 } }, saved];
    const savePublic = vi.fn().mockResolvedValue(undefined);
    const backend = {
      loadProfile: vi.fn().mockImplementation(async () => loads.shift() ?? saved),
      grantXp: vi.fn().mockResolvedValue(undefined),
      savePublic,
    } as unknown as Backend;
    const store = new ProfileStore(backend, user);
    await store.load();
    store.countProblem();
    await store.flush();
    const [, stats, pub] = savePublic.mock.calls[0]!;
    expect(pub.xp).toBe(244);
    expect(pub.daily).toEqual({ streak: 1, best: 1, last: "2026-11-27" });
    expect(stats).toMatchObject({ problems: 2, dayProblems: 2, weekXp: 244, monthXp: 244 });
  });
});

describe("one-off XP", () => {
  it("pays a tutorial once, discussion posts three times a day, and written answers by tier and score", async () => {
    const { emptyProfile } = await import("./backend/types");
    const backend = {
      loadProfile: vi.fn().mockResolvedValue({ ...emptyProfile(), lastVisitDay: "2999-01-01" }),
      grantXp: vi.fn().mockResolvedValue(undefined),
      savePublic: vi.fn().mockResolvedValue(undefined),
    } as unknown as Backend;
    const store = new ProfileStore(backend, user);
    await store.load();
    expect(await store.grantTutorial("specialist", "spec.combinatorics.pascal")).toBe(40);
    expect(await store.grantTutorial("specialist", "spec.combinatorics.pascal")).toBe(0);
    expect([await store.grantPost(), await store.grantPost(), await store.grantPost(), await store.grantPost()]).toEqual([20, 20, 20, 0]);
    expect(await store.grantWritten("proof-1", 3, 1)).toBe(72);
    expect(await store.grantWritten("proof-1", 3, 1)).toBe(14); // a repeat earns a fifth
    expect(await store.grantWritten("proof-2", 4, 0.5)).toBe(48);
  });
});
