import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, writeBatch } from "firebase/firestore";
import { emptyProgress, type Backend, type StoredSkillState } from "./types";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

const EMAIL_KEY = "intellectify:email-for-sign-in";

/**
 * Firestore layout (docs/SPEC.md §15.3):
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

  return {
    kind: "firebase",
    onUser(cb) {
      return onAuthStateChanged(auth, (u) =>
        cb(u ? { uid: u.uid, displayName: u.displayName ?? u.email?.split("@")[0] ?? "Student", email: u.email, local: false } : null),
      );
    },
    async signInWithGoogle() {
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    async sendEmailLink(email) {
      await sendSignInLinkToEmail(auth, email, { url: `${location.origin}/auth/email-link`, handleCodeInApp: true });
      localStorage.setItem(EMAIL_KEY, email);
    },
    async completeEmailLink(href) {
      if (!isSignInWithEmailLink(auth, href)) return false;
      let email = localStorage.getItem(EMAIL_KEY);
      if (!email) email = window.prompt("Confirm your email to finish signing in") ?? "";
      if (!email) throw new Error("Enter the email address the link was sent to.");
      await signInWithEmailLink(auth, email, href);
      localStorage.removeItem(EMAIL_KEY);
      return true;
    },
    async signInAsGuest() {
      await signInAnonymously(auth);
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
