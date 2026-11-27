import type { Config } from "@netlify/functions";
import { handleInk, inkDepsFromEnv } from "../lib/ink";

export default (req: Request) => handleInk(req, inkDepsFromEnv((k) => Netlify.env.get(k)));

export const config: Config = { path: "/api/ink", method: ["POST"] };
