import type { RankLevel } from "@intellectify/engine";
import { getBackend, emptyProgress, type AttemptRecord, type Backend, type CourseProgress, type StoredSkillState, type User } from "./backend";

/** App-wide session: the signed-in user and the backend in use. */
export const session = $state<{ ready: boolean; user: User | null; backend: Backend | null }>({ ready: false, user: null, backend: null });

let started = false;
export function startSession() {
  if (started) return;
  started = true;
  getBackend().then((b) => {
    session.backend = b;
    b.onUser((u) => {
      session.user = u;
      session.ready = true;
    });
  });
}

/** Reactive progress for one course, loaded from and saved to the backend. */
export class CourseProgressStore {
  progress = $state<CourseProgress>(emptyProgress());
  loaded = $state(false);
  error = $state<string | null>(null);

  constructor(
    readonly course: string,
    private readonly backend: Backend,
    private readonly uid: string,
  ) {}

  /** Resolves once progress has loaded (or failed to). */
  ready: Promise<void> = Promise.resolve();

  async load() {
    try {
      this.progress = await this.backend.loadProgress(this.uid, this.course);
    } catch (err) {
      this.error = `Couldn't load your progress: ${(err as Error).message}`;
    } finally {
      this.loaded = true;
    }
  }

  /** Update local state immediately, then persist. */
  async save(
    changes: { skills: Record<string, StoredSkillState>; responseSkills: Record<string, StoredSkillState>; rollupRanks: Record<string, RankLevel> },
    attempt: AttemptRecord | null,
  ) {
    this.progress = {
      skills: { ...this.progress.skills, ...changes.skills },
      responseSkills: { ...this.progress.responseSkills, ...changes.responseSkills },
      rollupRanks: { ...this.progress.rollupRanks, ...changes.rollupRanks },
    };
    try {
      await this.backend.saveResult(this.uid, this.course, changes, attempt);
      this.error = null;
    } catch (err) {
      this.error = `Couldn't save your last answer: ${(err as Error).message}`;
    }
  }

  /** Persist a single skill's state (placement, drop-a-tier). */
  async saveSkill(skillId: string, state: StoredSkillState) {
    this.progress = { ...this.progress, skills: { ...this.progress.skills, [skillId]: state } };
    try {
      await this.backend.saveResult(this.uid, this.course, { skills: { [skillId]: state }, responseSkills: {}, rollupRanks: {} }, null);
    } catch (err) {
      this.error = `Couldn't save that change: ${(err as Error).message}`;
    }
  }
}

const stores = new Map<string, CourseProgressStore>();
/** One progress store per (user, course), loaded on first use. */
export function courseProgress(course: string): CourseProgressStore | null {
  if (!session.backend || !session.user) return null;
  const key = `${session.user.uid}:${course}`;
  if (!stores.has(key)) {
    const store = new CourseProgressStore(course, session.backend, session.user.uid);
    stores.set(key, store);
    store.ready = store.load();
  }
  return stores.get(key)!;
}
