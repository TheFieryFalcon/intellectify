import { describe, expect, it } from "vitest";
import { autoEarlyEaster, dateOfDay, easterMonday, parseTermWeek, schoolPosition, term1Start, terms } from "../src/calendar.js";

const iso = (d: Date) => d.toISOString().slice(0, 10);
describe("WA school calendar", () => {
  it("starts Term 1 on the Monday of 1–4 Feb, else the Wednesday of 31 Jan–3 Feb", () => {
    expect(iso(term1Start(2026))).toBe("2026-02-02"); // Monday
    expect(iso(term1Start(2028))).toBe("2028-02-02"); // no Monday on 1–4 Feb in 2028 (Tue 1 Feb): Wednesday 2 Feb
  });
  it("finds Easter Monday", () => {
    expect(iso(easterMonday(2026))).toBe("2026-04-06");
    expect(iso(easterMonday(2027))).toBe("2027-03-29");
  });
  it("matches the 2026 course outline's dates", () => {
    // Thu 12 Mar = Term 1 Week 6; Thu 7 May = Term 2 Week 3; Thu 20 Aug = Term 3 Week 5; Thu 29 Oct = Term 4 Week 3.
    for (const [day, term, week] of [["2026-03-12", 1, 6], ["2026-05-07", 2, 3], ["2026-08-20", 3, 5], ["2026-10-29", 4, 3]] as const) {
      const p = schoolPosition(dateOfDay(day));
      expect([p.term, p.week, p.inTerm]).toEqual([term, week, true]);
    }
  });
  it("counts holidays on from the term before, and parses outline captions", () => {
    const hol = schoolPosition(dateOfDay("2026-07-08"));
    expect(hol.term).toBe(2);
    expect(hol.inTerm).toBe(false);
    expect(parseTermWeek("T2 W5")).toBe(17);
    expect(parseTermWeek("Term 3 Week 10")).toBe(34);
  });
  it("gives Early Easter a nine-week Term 1", () => {
    const year = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].find(autoEarlyEaster);
    if (year) expect(terms(year)[0]!.weeks).toBe(9);
  });
});
