/** "Paper first" (SPEC §15.4): Tier 3+ and written questions are meant to be worked on paper. */
import { tierOf } from "@intellectify/engine";
import type { QuestionT } from "./content";

export const PAPER_FIRST_TIER = 3;
export const paperFirst = (q: QuestionT) => tierOf(q.rating) >= PAPER_FIRST_TIER || q.parts.some((p) => p.rubric);

const KEY = "intellectify:tip:paper";
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
/** The one-time tip, until dismissed (remembered per browser). */
export const paperTip = $state({ dismissed: typeof localStorage === "undefined" ? true : read() });
export function dismissPaperTip() {
  paperTip.dismissed = true;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* not remembered; shows again next visit */
  }
}
