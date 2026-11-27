import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** Static SPA: content ships as static JSON, all logic runs client-side (docs/SPEC.md §15). */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: "index.html" }),
    // Notice a new deploy within a minute, so an open tab switches to it at the next page change (SPEC §16.2).
    version: { pollInterval: 60_000 },
  },
};
