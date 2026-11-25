// Copy MathLive's fonts into static/ so the math keyboard renders without a CDN.
import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../node_modules/mathlive/dist/fonts", import.meta.url));
const target = fileURLToPath(new URL("../static/mathlive/fonts", import.meta.url));
if (!existsSync(source)) throw new Error(`MathLive fonts not found at ${source}. Run pnpm install.`);
if (!existsSync(target)) cpSync(source, target, { recursive: true });
