/**
 * The anonymous limit (SPEC §2.1a): after ANON_QUESTION_LIMIT answered questions, the next question
 * opens a sign-up or log-in dialog that can't be dismissed. Deploy previews have no limit.
 */
import { ANON_QUESTION_LIMIT } from "./backend";
import { markingFor } from "./marking.svelte";
import { anonCount, profileFor } from "./profile.svelte";
import { session } from "./session.svelte";

export const gate = $state({ open: false });

/** Questions an anonymous account has answered: resolved ones, plus written answers waiting for a mark. */
export function answeredCount(): number {
  const profile = profileFor(session.backend, session.user);
  const marking = markingFor(session.backend, session.user);
  const resolved = Math.max(profile?.profile.stats?.problems ?? 0, session.user ? anonCount(session.user.uid) : 0);
  return resolved + (marking?.jobs.filter((j) => j.status === "pending").length ?? 0);
}

/** Called when a new question appears: past the limit, the dialog opens instead. */
export function checkGate(): void {
  if (session.user?.anonymous && answeredCount() >= ANON_QUESTION_LIMIT) gate.open = true;
}

/** Whether the profile is loaded, so the count is real. */
export const gateReady = () => !!profileFor(session.backend, session.user)?.loaded;
