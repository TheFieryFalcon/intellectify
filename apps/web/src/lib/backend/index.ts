import { firebaseConfig, firebaseConfigured } from "$lib/firebase.config";
import { createLocalBackend } from "./local";
import type { Backend } from "./types";

export * from "./types";
export { firebaseConfigured };
export { ANON_QUESTION_LIMIT, deployContext } from "./context";

let backend: Promise<Backend> | null = null;

/** Firebase when configured (loaded lazily, so local mode never downloads it); otherwise local storage. */
export function getBackend(): Promise<Backend> {
  backend ??= firebaseConfigured ? import("./firebase").then((m) => m.createFirebaseBackend(firebaseConfig)) : Promise.resolve(createLocalBackend());
  return backend;
}
