import { describe, expect, it } from "vitest";
import { addProblem, addXp, dayBefore, roll, weekOf } from "./activity";

describe("activity", () => {
  it("finds the Monday of a week", () => {
    expect(weekOf("2026-11-27")).toBe("2026-11-23"); // Friday
    expect(weekOf("2026-11-23")).toBe("2026-11-23"); // Monday
    expect(weekOf("2026-11-29")).toBe("2026-11-23"); // Sunday
    expect(weekOf("2027-01-01")).toBe("2026-12-28");
  });
  it("counts problems and XP, and resets each period", () => {
    let s = addProblem(null, "2026-11-27");
    s = addXp(addProblem(s, "2026-11-27"), "2026-11-27", 30);
    expect(s).toMatchObject({ problems: 2, dayProblems: 2, weekProblems: 2, weekXp: 30, monthXp: 30 });
    s = addProblem(s, "2026-11-28");
    expect(s).toMatchObject({ problems: 3, dayProblems: 1, weekProblems: 3, weekXp: 30 });
    s = addXp(s, "2026-11-30", 5); // new week, same month
    expect(s).toMatchObject({ problems: 3, dayProblems: 0, weekProblems: 0, weekXp: 5, monthXp: 35 });
    s = roll(s, "2026-12-01"); // new month
    expect(s).toMatchObject({ weekXp: 5, monthXp: 0 });
  });
  it("steps back a day across months", () => {
    expect(dayBefore("2026-12-01")).toBe("2026-11-30");
    expect(dayBefore("2027-01-01")).toBe("2026-12-31");
  });
});
