/// <reference types="@sveltejs/kit" />
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_LOCAL_MODE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare namespace svelteHTML {
  interface IntrinsicElements {
    "math-field": Record<string, unknown>;
  }
}
export {};
