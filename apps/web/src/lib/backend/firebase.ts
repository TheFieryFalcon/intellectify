import { FirebaseError, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, increment, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { anonymousAllowed } from "./context";
import { emptyProfile, emptyProgress, type AchievementRecord, type Backend, type ChallengeState, type MarkingJob, type Post, type Profile, type PublicProfile, type StoredSkillState, type ThreadSummary, type User } from "./types";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

/** Plain-English messages for the auth errors students can actually hit. */
const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/invalid-email": "That email address isn't valid.",
  "auth/email-already-in-use": "An account with that email already exists. Sign in instead.",
  "auth/weak-password": "Use a password of at least 6 characters.",
  "auth/missing-password": "Enter your password.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "Couldn't reach the server. Check your connection.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled for the project yet.",
  "auth/admin-restricted-operation": "This sign-in method isn't enabled for the project yet.",
  "auth/unauthorized-domain": "This site isn't on the project's list of authorized domains.",
};

/** Rethrow Firebase auth errors with a readable message. Returns silently if the user closed the popup. */
function friendly(err: unknown): never | void {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") return;
    throw new Error(AUTH_MESSAGES[err.code] ?? "Sign-in failed. Try again.");
  }
  throw err;
}

/**
 * Firestore layout (docs/SPEC.md §16.3):
 *   users/{uid}                                  profile
 *   users/{uid}/courses/{course}                 rollupRanks
 *   users/{uid}/courses/{course}/skillStates/{skillId}
 *   users/{uid}/courses/{course}/responseSkillStates/{id}
 *   users/{uid}/courses/{course}/attempts/{attemptId}
 *   users/{uid}/courses/{course}/challenges/{sectionId}   Section Challenge progress
 *   users/{uid}/courses/{course}/meta/achievements         achievement stats and earned dates
 *   users/{uid}/markingJobs/{jobId}                         free-response answers and their LLM marks
 */
export function createFirebaseBackend(config: FirebaseConfig): Backend {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const courseDoc = (uid: string, course: string) => doc(db, "users", uid, "courses", course);

  const listeners = new Set<(u: User | null) => void>();
  const toUser = (u: FirebaseUser): User => ({
    uid: u.uid,
    displayName: u.displayName || u.email?.split("@")[0] || (u.isAnonymous ? `Anonymous ${u.uid.slice(0, 4)}` : "Student"),
    email: u.email,
    local: false,
    anonymous: u.isAnonymous,
    google: u.providerData.some((p) => p.providerId === "google.com"),
  });
  const emit = (u: FirebaseUser | null) => listeners.forEach((l) => l(u ? toUser(u) : null));

  onAuthStateChanged(auth, (u) => {
    emit(u);
    // Keep a small profile document (name, email, last seen) for profiles and leaderboards.
    if (u) void setDoc(doc(db, "users", u.uid), { displayName: toUser(u).displayName, email: u.email, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
  });

  return {
    kind: "firebase",
    onUser(cb) {
      listeners.add(cb);
      if (auth.currentUser !== undefined) cb(auth.currentUser ? toUser(auth.currentUser) : null);
      return () => listeners.delete(cb);
    },
    async signInWithGoogle() {
      await signInWithPopup(auth, new GoogleAuthProvider()).catch(friendly);
    },
    async signInWithEmail(email, password) {
      await signInWithEmailAndPassword(auth, email.trim(), password).catch(friendly);
    },
    async signUpWithEmail(name, email, password) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(user, { displayName: name.trim() });
          await setDoc(doc(db, "users", user.uid), { displayName: name.trim(), nameSet: true }, { merge: true });
          emit(auth.currentUser);
        }
      } catch (err) {
        friendly(err);
      }
    },
    async sendPasswordReset(email) {
      await sendPasswordResetEmail(auth, email.trim()).catch(friendly);
    },
    async signInAsGuest() {
      // Anonymous accounts work on any domain, so deploy previews can be tested without adding them to Firebase.
      // Deploy previews only: the button isn't shown elsewhere, and this refuses too.
      if (!anonymousAllowed) throw new Error("Anonymous sign-in is only for deploy previews.");
      await signInAnonymously(auth).catch(friendly);
    },
    async signOut() {
      await signOut(auth);
    },
    async loadProfile(uid) {
      const d = (await getDoc(doc(db, "users", uid))).data() ?? {};
      return { ...emptyProfile(), ...(d as Partial<Profile>) };
    },
    async setPlacement(uid, placement) {
      await setDoc(doc(db, "users", uid), { placement }, { merge: true });
    },
    async setDisplayName(u, name) {
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
      const batch = writeBatch(db);
      batch.set(doc(db, "users", u.uid), { displayName: name, nameSet: true }, { merge: true });
      if (!u.anonymous) batch.set(doc(db, "publicProfiles", u.uid), { displayName: name }, { merge: true });
      await batch.commit();
      emit(auth.currentUser);
    },
    async grantXp(u, grant) {
      const batch = writeBatch(db);
      const own: Record<string, unknown> = { xp: increment(grant.amount) };
      if (grant.questionId) own.questionXpAt = { [grant.questionId]: Date.now() };
      if (grant.visitDay) own.lastVisitDay = grant.visitDay;
      batch.set(doc(db, "users", u.uid), own, { merge: true });
      await batch.commit();
    },
    async saveDaily(u, daily) {
      await setDoc(doc(db, "users", u.uid), { daily }, { merge: true });
    },
    async savePublic(u, stats, pub) {
      const batch = writeBatch(db);
      batch.set(doc(db, "users", u.uid), { stats }, { merge: true });
      // Public mirror for leaderboards and profiles (SPEC §12.2). Anonymous test accounts stay off it.
      // Courses merge key by key, so a course not touched this session keeps its last mirror.
      if (!u.anonymous) batch.set(doc(db, "publicProfiles", u.uid), JSON.parse(JSON.stringify(pub)), { merge: true });
      await batch.commit();
    },
    async listThreads() {
      const snap = await getDocs(query(collection(db, "discussions"), orderBy("updatedAt", "desc"), limit(300)));
      return snap.docs.map((d) => ({ ...(d.data() as Omit<ThreadSummary, "key">), key: d.id }));
    },
    async loadPosts(key) {
      const snap = await getDocs(query(collection(db, "discussions", key, "posts"), orderBy("at", "asc"), limit(1000)));
      return snap.docs.map((d) => ({ ...(d.data() as Omit<Post, "id">), id: d.id }));
    },
    async addPost(u, t, body, parent, name) {
      const ref = doc(collection(db, "discussions", t.key, "posts"));
      const post: Post = { id: ref.id, uid: u.uid, name, body, at: Date.now(), parent };
      // One transaction: the post, and the thread's count and search text.
      await runTransaction(db, async (tx) => {
        const threadRef = doc(db, "discussions", t.key);
        const prev = (await tx.get(threadRef)).data() as Partial<ThreadSummary> | undefined;
        tx.set(threadRef, { day: t.day, course: t.course, year: t.year, questionId: t.questionId, posts: (prev?.posts ?? 0) + 1, updatedAt: post.at, text: `${prev?.text ?? ""}\n${body}`.slice(-200000) });
        tx.set(ref, { uid: post.uid, name, body, at: post.at, parent });
      });
      return post;
    },
    async deletePost(key, post) {
      await runTransaction(db, async (tx) => {
        const threadRef = doc(db, "discussions", key);
        const prev = (await tx.get(threadRef)).data() as ThreadSummary | undefined;
        if (prev) tx.set(threadRef, { ...prev, posts: Math.max(0, prev.posts - 1), text: prev.text.replace(`\n${post.body}`, "") });
        tx.delete(doc(db, "discussions", key, "posts", post.id));
      });
    },
    async listPublic() {
      const snap = await getDocs(query(collection(db, "publicProfiles"), limit(1000)));
      return snap.docs
        .map((d) => ({ ...(d.data() as Partial<PublicProfile>), uid: d.id }))
        .filter((p) => typeof p.xp === "number")
        .map((p) => ({ displayName: "Student", stats: null, daily: null, achievements: {}, courses: {}, updatedAt: 0, ...p }) as PublicProfile);
    },
    async loadAchievements(uid, course) {
      const d = await getDoc(doc(courseDoc(uid, course), "meta", "achievements"));
      return d.exists() ? (d.data() as AchievementRecord) : null;
    },
    async saveAchievements(uid, course, record) {
      await setDoc(doc(courseDoc(uid, course), "meta", "achievements"), record);
    },
    async loadMarkingJobs(uid) {
      const snap = await getDocs(query(collection(db, "users", uid, "markingJobs"), orderBy("createdAt", "desc"), limit(100)));
      return snap.docs.map((d) => d.data() as MarkingJob);
    },
    async saveMarkingJob(uid, job) {
      // Firestore rejects undefined values; a JSON round trip drops them.
      await setDoc(doc(db, "users", uid, "markingJobs", job.id), JSON.parse(JSON.stringify(job)));
    },
    async idToken() {
      return auth.currentUser ? auth.currentUser.getIdToken() : null;
    },
    async loadChallenge(uid, course, section) {
      const d = await getDoc(doc(courseDoc(uid, course), "challenges", section));
      return d.exists() ? (d.data() as ChallengeState) : null;
    },
    async saveChallenge(uid, course, section, state) {
      const ref = doc(courseDoc(uid, course), "challenges", section);
      if (state) await setDoc(ref, state);
      else await deleteDoc(ref);
    },
    async loadProgress(uid, course) {
      const progress = emptyProgress();
      const base = courseDoc(uid, course);
      const [meta, skills, rs] = await Promise.all([
        getDoc(base),
        getDocs(collection(base, "skillStates")),
        getDocs(collection(base, "responseSkillStates")),
      ]);
      progress.rollupRanks = (meta.data()?.rollupRanks as typeof progress.rollupRanks) ?? {};
      skills.forEach((d) => (progress.skills[d.id] = d.data() as StoredSkillState));
      rs.forEach((d) => (progress.responseSkills[d.id] = d.data() as StoredSkillState));
      return progress;
    },
    async saveResult(uid, course, changes, attempt) {
      const base = courseDoc(uid, course);
      const batch = writeBatch(db);
      for (const [id, s] of Object.entries(changes.skills)) batch.set(doc(base, "skillStates", id), s);
      for (const [id, s] of Object.entries(changes.responseSkills)) batch.set(doc(base, "responseSkillStates", id), s);
      batch.set(base, { rollupRanks: changes.rollupRanks }, { merge: true });
      if (attempt) batch.set(doc(base, "attempts", attempt.id), attempt);
      await batch.commit();
    },
  };
}
