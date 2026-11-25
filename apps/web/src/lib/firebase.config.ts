/**
 * Firebase web config for the Intellectify project (intellectify-4357c).
 * These values identify the project and are public by design: data access is controlled by
 * firestore.rules, not by keeping this config secret. Env vars override them if set.
 */
const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "intellectify-4357c.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "intellectify-4357c",
  appId: env.VITE_FIREBASE_APP_ID || "",
};

/** True once a web app is registered and its apiKey and appId are filled in. */
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId);
