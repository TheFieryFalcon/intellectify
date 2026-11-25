import { createLocalBackend } from "./local";
import type { Backend } from "./types";

export * from "./types";

const env = import.meta.env;
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);

let backend: Promise<Backend> | null = null;

/** Firebase when configured (loaded lazily, so local mode never downloads it); otherwise local storage. */
export function getBackend(): Promise<Backend> {
  backend ??= firebaseConfigured
    ? import("./firebase").then((m) =>
        m.createFirebaseBackend({
          apiKey: env.VITE_FIREBASE_API_KEY!,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
          projectId: env.VITE_FIREBASE_PROJECT_ID!,
          appId: env.VITE_FIREBASE_APP_ID ?? "",
        }),
      )
    : Promise.resolve(createLocalBackend());
  return backend;
}
