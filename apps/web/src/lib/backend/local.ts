import { emptyProgress, type Backend, type CourseProgress, type User } from "./types";

/**
 * Local backend: a single guest user whose progress lives in this browser's localStorage.
 * Used when Firebase isn't configured, and for development.
 */
const USER_KEY = "intellectify:guest";
const progressKey = (uid: string, course: string) => `intellectify:progress:${uid}:${course}`;
const attemptsKey = (uid: string, course: string) => `intellectify:attempts:${uid}:${course}`;

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: progress for this session stays in memory only.
  }
};

export function createLocalBackend(): Backend {
  const listeners = new Set<(u: User | null) => void>();
  let user: User | null = read<User | null>(USER_KEY, null);
  const emit = () => listeners.forEach((l) => l(user));

  return {
    kind: "local",
    onUser(cb) {
      listeners.add(cb);
      cb(user);
      return () => listeners.delete(cb);
    },
    async signInWithGoogle() {
      throw new Error("Google sign-in needs Firebase. Continue as a guest instead.");
    },
    async sendEmailLink() {
      throw new Error("Email sign-in needs Firebase. Continue as a guest instead.");
    },
    async completeEmailLink() {
      return false;
    },
    async signInAsGuest() {
      user = { uid: "guest", displayName: "Guest", email: null, local: true };
      write(USER_KEY, user);
      emit();
    },
    async signOut() {
      user = null;
      try {
        localStorage.removeItem(USER_KEY);
      } catch {
        /* ignore */
      }
      emit();
    },
    async loadProgress(uid, course) {
      return { ...emptyProgress(), ...read<Partial<CourseProgress>>(progressKey(uid, course), {}) };
    },
    async saveResult(uid, course, changes, attempt) {
      const current = { ...emptyProgress(), ...read<Partial<CourseProgress>>(progressKey(uid, course), {}) };
      write(progressKey(uid, course), {
        skills: { ...current.skills, ...changes.skills },
        responseSkills: { ...current.responseSkills, ...changes.responseSkills },
        rollupRanks: { ...current.rollupRanks, ...changes.rollupRanks },
      });
      if (!attempt) return;
      const attempts = read<unknown[]>(attemptsKey(uid, course), []);
      attempts.push(attempt);
      write(attemptsKey(uid, course), attempts.slice(-500));
    },
  };
}
