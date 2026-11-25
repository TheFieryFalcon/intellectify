import { FirebaseError, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { emptyProgress, type Backend, type StoredSkillState, type User } from "./types";

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
 */
export function createFirebaseBackend(config: FirebaseConfig): Backend {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const courseDoc = (uid: string, course: string) => doc(db, "users", uid, "courses", course);

  const listeners = new Set<(u: User | null) => void>();
  const toUser = (u: FirebaseUser): User => ({ uid: u.uid, displayName: u.displayName || u.email?.split("@")[0] || "Student", email: u.email, local: false });
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
      throw new Error("Sign in with Google or email.");
    },
    async signOut() {
      await signOut(auth);
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
