/**
 * Anonymous sign-in is for testing deploy previews only (their URLs aren't on Firebase's authorized
 * domains, so Google sign-in fails there). Never offered on production or anywhere else.
 */
export const anonymousAllowed = typeof __DEPLOY_CONTEXT__ !== "undefined" && __DEPLOY_CONTEXT__ === "deploy-preview";
