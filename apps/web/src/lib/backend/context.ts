/** Netlify's build context: "production", "deploy-preview", "branch-deploy", or "dev" locally (vite.config.ts). */
export const deployContext = typeof __DEPLOY_CONTEXT__ !== "undefined" ? __DEPLOY_CONTEXT__ : "dev";

/**
 * Anonymous accounts may answer this many questions before they must sign up or log in (SPEC §2.1a).
 * Deploy previews are for testing, so they have no limit.
 */
export const ANON_QUESTION_LIMIT = deployContext === "deploy-preview" ? Infinity : 5;
