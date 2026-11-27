import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { svelte } from "./apps/web/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";

const svelteDir = fileURLToPath(new URL("./apps/web/node_modules/svelte/", import.meta.url));

export default defineConfig({
  // Compiles Svelte stores (*.svelte.ts) so their logic can be tested too (Vitest runs them as server code).
  plugins: [svelte({ compilerOptions: { runes: true } })],
  resolve: {
    alias: [
      { find: /^\$lib\//, replacement: fileURLToPath(new URL("./apps/web/src/lib/", import.meta.url)) },
      { find: /^svelte\/internal\/server$/, replacement: `${svelteDir}src/internal/server/index.js` },
      { find: /^svelte\/internal\/client$/, replacement: `${svelteDir}src/internal/client/index.js` },
      { find: /^svelte\/internal\/disclose-version$/, replacement: `${svelteDir}src/internal/disclose-version.js` },
      { find: /^svelte$/, replacement: `${svelteDir}src/index-client.js` },
    ],
  },
  test: {
    include: ["packages/*/test/**/*.test.ts", "apps/web/src/**/*.test.ts", "netlify/**/*.test.ts"],
    testTimeout: 20000,
  },
});
