import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // Netlify's build context ("production", "deploy-preview", "branch-deploy"); "dev" locally.
  define: { __DEPLOY_CONTEXT__: JSON.stringify(process.env.CONTEXT ?? "dev") },
  server: { fs: { allow: ["../.."] } },
});
