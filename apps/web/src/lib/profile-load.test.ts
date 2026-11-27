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
