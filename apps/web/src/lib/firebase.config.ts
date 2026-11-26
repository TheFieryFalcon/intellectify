/**
 * Firebase web config for the Intellectify project (intellectify-4357c).
 * These values identify the project and are public by design: data access is controlled by
 * firestore.rules, not by keeping this config secret. Env vars override them if set.
 */
const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDe9xVSugPE6XAuQXrPex1Cbaig9dLMOhY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "intellectify-4357c.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "intellectify-4357c",
  appId: env.VITE_FIREBASE_APP_ID || "1:493745497308:web:56c470f3eb64275c2b8019",
};

/** Web app "intellectify" (1:493745497308:web:56c470f3eb64275c2b8019). False only if both values are blanked. */
export const firebaseConfigured = env.VITE_LOCAL_MODE !== "1" && Boolean(firebaseConfig.apiKey && firebaseConfig.appId);
