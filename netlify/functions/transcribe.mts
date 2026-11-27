import type { Config } from "@netlify/functions";
import { depsFromEnv } from "../lib/mark";
import { handleTranscribe } from "../lib/transcribe";

export default (req: Request) => handleTranscribe(req, depsFromEnv((k) => Netlify.env.get(k)));

export const config: Config = { path: "/api/transcribe", method: ["POST"] };
