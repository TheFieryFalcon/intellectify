import { describe, expect, it } from "vitest";
import { autoEarlyEaster, dateOfDay, easterMonday, examsOn, monthlyScope, parseTermWeek, schoolPosition, schoolPositionIn, term1Start, terms, termsFor, unitAt, type SchoolYear } from "../src/calendar.js";

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

describe("calendar files", () => {
  const cal2026: SchoolYear = {
    year: 2026,
    terms: [
      { term: 1, start: "2026-02-02", end: "2026-04-02" },
      { term: 2, start: "2026-04-20", end: "2026-07-03" },
      { term: 3, start: "2026-07-20", end: "2026-09-25" },
      { term: 4, start: "2026-10-12", end: "2026-12-17" },
    ],
    exams: [{ name: "ATAR written examinations", start: "2026-10-28", end: "2026-11-19" }],
  };
  it("agrees with the WA rule for 2026", () => {
    const fromFile = termsFor(2026, [cal2026]);
    expect(fromFile.map((t) => [t.start.toISOString().slice(0, 10), t.weeks])).toEqual(terms(2026).map((t) => [t.start.toISOString().slice(0, 10), t.weeks]));
    expect(schoolPositionIn(dateOfDay("2026-05-06"), [cal2026])).toEqual(schoolPosition(dateOfDay("2026-05-06")));
  });
  it("counts school weeks and units of 15 weeks, skipping holidays", () => {
    const at = (d: string, y: 11 | 12) => unitAt(dateOfDay(d), y, [cal2026]);
    expect(at("2026-01-20", 11)).toEqual({ unit: "year10", week: 0 });
    expect(at("2026-01-20", 12)).toEqual({ unit: 2, week: 0 });
    expect(at("2026-02-02", 11)).toEqual({ unit: 1, week: 1 });
    expect(at("2026-04-10", 11)).toEqual({ unit: 1, week: 9 }); // Term 1 is 9 weeks; holidays don't count
    expect(at("2026-05-18", 11)).toEqual({ unit: 1, week: 14 });
    expect(at("2026-06-01", 12)).toEqual({ unit: 4, week: 16 });
    expect(monthlyScope(dateOfDay("2026-03-01"), 11, [cal2026])).toBe("year10");
    expect(monthlyScope(dateOfDay("2026-08-01"), 11, [cal2026])).toBe(1);
    expect(monthlyScope(dateOfDay("2026-03-01"), 12, [cal2026])).toBe(2);
    expect(monthlyScope(dateOfDay("2026-08-01"), 12, [cal2026])).toBe(3);
  });
  it("lists exam periods", () => {
    expect(examsOn(dateOfDay("2026-11-02"), [cal2026]).map((e) => e.name)).toEqual(["ATAR written examinations"]);
    expect(examsOn(dateOfDay("2026-12-02"), [cal2026])).toEqual([]);
  });
});
