import type { Config } from "@netlify/functions";
import { depsFromEnv, handleMark } from "../lib/mark";

export default (req: Request) => handleMark(req, depsFromEnv((k) => Netlify.env.get(k)));

export const config: Config = { path: "/api/mark", method: ["POST"] };
