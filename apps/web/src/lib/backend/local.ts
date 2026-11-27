import { emptyProfile, emptyProgress, type AchievementRecord, type Backend, type ChallengeState, type CourseProgress, type MarkingJob, type Post, type Profile, type PublicProfile, type Report, type ThreadSummary, type User } from "./types";

/**
 * Local backend: a single guest user whose progress lives in this browser's localStorage.
 * Used when Firebase isn't configured, and for development.
 */
const USER_KEY = "intellectify:guest";
const progressKey = (uid: string, course: string) => `intellectify:progress:${uid}:${course}`;
const attemptsKey = (uid: string, course: string) => `intellectify:attempts:${uid}:${course}`;
const profileKey = (uid: string) => `intellectify:profile:${uid}`;
const achievementsKey = (uid: string, course: string) => `intellectify:achievements:${uid}:${course}`;
const markingKey = (uid: string) => `intellectify:marking:${uid}`;
const THREADS_KEY = "intellectify:discuss:threads";
const postsKey = (key: string) => `intellectify:discuss:posts:${key}`;
const REPORTS_KEY = "intellectify:reports";
const PUBLIC_PREFIX = "intellectify:public:";
const publicKey = (uid: string) => `${PUBLIC_PREFIX}${uid}`;
const challengeKey = (uid: string, course: string, section: string) => `intellectify:challenge:${uid}:${course}:${section}`;

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
    async signInWithEmail() {
      throw new Error("Email sign-in needs Firebase. Continue as a guest instead.");
    },
    async signUpWithEmail() {
      throw new Error("Email sign-in needs Firebase. Continue as a guest instead.");
    },
    async sendPasswordReset() {
      throw new Error("Email sign-in needs Firebase.");
    },
    async upgradeWithGoogle() {
      throw new Error("Accounts need Firebase.");
    },
    async upgradeWithEmail() {
      throw new Error("Accounts need Firebase.");
    },
    async signInAsGuest() {
      user = { uid: "guest", displayName: "Guest", email: null, local: true, joined: Date.now() };
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
    async loadProfile(uid) {
      return { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(uid), {}) };
    },
    async saveShiftKeys(uid, keys) {
      write(profileKey(uid), { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(uid), {}), shiftKeys: keys });
    },
    async setPlacement(uid, placement) {
      write(profileKey(uid), { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(uid), {}), placement });
    },
    async setDisplayName(u, name) {
      if (user && user.uid === u.uid) {
        user = { ...user, displayName: name };
        write(USER_KEY, user);
      }
      write(profileKey(u.uid), { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(u.uid), {}), nameSet: true });
      const pub = read<Partial<PublicProfile> | null>(publicKey(u.uid), null);
      if (pub) write(publicKey(u.uid), { ...pub, displayName: name });
      emit();
    },
    async grantXp(u, grant) {
      const p = { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(u.uid), {}) };
      p.xp += grant.amount;
      if (grant.questionId) p.questionXpAt = { ...p.questionXpAt, [grant.questionId]: Date.now() };
      if (grant.visitDay) p.lastVisitDay = grant.visitDay;
      write(profileKey(u.uid), p);
    },
    async markSeen() {
      /* nothing to record in local mode */
    },
    async saveDaily(u, daily) {
      write(profileKey(u.uid), { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(u.uid), {}), daily });
    },
    async savePublic(u, stats, pub) {
      write(profileKey(u.uid), { ...emptyProfile(), ...read<Partial<Profile>>(profileKey(u.uid), {}), stats });
      const prev = read<Partial<PublicProfile>>(publicKey(u.uid), {});
      write(publicKey(u.uid), { ...prev, ...pub, courses: { ...prev.courses, ...pub.courses }, achievements: { ...prev.achievements, ...pub.achievements } });
    },
    async addReport(u, r) {
      const report: Report = { ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, uid: u.uid, name: u.displayName, at: Date.now(), status: "open" };
      write(REPORTS_KEY, [report, ...read<Report[]>(REPORTS_KEY, [])]);
    },
    async confirmedReports(uid, course) {
      return read<Report[]>(REPORTS_KEY, []).filter((r) => r.uid === uid && r.course === course && r.status === "confirmed");
    },
    // The local guest reviews its own reports, so the review page can be tried without Firebase.
    async isAdmin() {
      return true;
    },
    async listReports() {
      return read<Report[]>(REPORTS_KEY, []);
    },
    async setReportStatus(id, status) {
      write(REPORTS_KEY, read<Report[]>(REPORTS_KEY, []).map((r) => (r.id === id ? { ...r, status } : r)));
    },
    async listThreads() {
      return Object.values(read<Record<string, ThreadSummary>>(THREADS_KEY, {})).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async loadPosts(key) {
      return read<Post[]>(postsKey(key), []);
    },
    async addPost(u, t, body, parent, name) {
      const post: Post = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, uid: u.uid, name, body, at: Date.now(), parent };
      write(postsKey(t.key), [...read<Post[]>(postsKey(t.key), []), post]);
      const threads = read<Record<string, ThreadSummary>>(THREADS_KEY, {});
      const prev = threads[t.key];
      threads[t.key] = { ...t, posts: (prev?.posts ?? 0) + 1, updatedAt: post.at, text: `${prev?.text ?? ""}\n${body}` };
      write(THREADS_KEY, threads);
      return post;
    },
    async deletePost(key, post) {
      write(postsKey(key), read<Post[]>(postsKey(key), []).filter((p) => p.id !== post.id));
      const threads = read<Record<string, ThreadSummary>>(THREADS_KEY, {});
      const prev = threads[key];
      if (prev) threads[key] = { ...prev, posts: Math.max(0, prev.posts - 1), text: prev.text.replace(`\n${post.body}`, "") };
      write(THREADS_KEY, threads);
    },
    async listPublic() {
      // Only this browser's guest, plus any other entries stored under the same prefix (handy for testing boards).
      const out: PublicProfile[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(PUBLIC_PREFIX)) out.push(read<PublicProfile>(k, null as unknown as PublicProfile));
        }
      } catch {
        /* storage blocked */
      }
      return out.filter(Boolean);
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
    async loadAchievements(uid, course) {
      return read<AchievementRecord | null>(achievementsKey(uid, course), null);
    },
    async saveAchievements(uid, course, record) {
      write(achievementsKey(uid, course), record);
    },
    async loadMarkingJobs(uid) {
      return read<MarkingJob[]>(markingKey(uid), []).sort((a, b) => b.createdAt - a.createdAt);
    },
    async saveMarkingJob(uid, job) {
      const jobs = read<MarkingJob[]>(markingKey(uid), []).filter((j) => j.id !== job.id);
      // Keep the newest 200.
      write(markingKey(uid), [job, ...jobs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200));
    },
    async idToken() {
      return null;
    },
    async loadChallenge(uid, course, section) {
      return read<ChallengeState | null>(challengeKey(uid, course, section), null);
    },
    async saveChallenge(uid, course, section, state) {
      if (state) write(challengeKey(uid, course, section), state);
      else localStorage.removeItem(challengeKey(uid, course, section));
    },
  };
}
