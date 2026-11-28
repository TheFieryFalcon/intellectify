#!/usr/bin/env python3
"""Simulate the Lemma economy (docs/SPEC.md §12.5) to tune its numbers.

A simulated student plays a fixed number of active hours a day. Practice earns Lemmas at a rate
that rises with upgrades, corollaries and Axioms; Research earns Lemmas per calendar day plus the
Time Warp. After each day the student buys whatever adds the most Lemmas per day per Lemma spent,
saving up when that purchase isn't affordable yet.

The model is deliberately simple. The question-specific theorems are lumped into one +10%/level
practice upgrade, corollaries grow linearly with hours played, and card collection follows a smooth
curve. Use it to compare settings and keep the calibration targets in §12.5, not to predict exact
numbers.

Usage:
    python3 scripts/economy_sim.py            # calibration tables for 45 min, 1.5 h and 3 h a day
    python3 scripts/economy_sim.py fit        # refit the 18 Axiom thresholds to the target curve
    python3 scripts/economy_sim.py report 1.5 # one play rate in detail
"""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass, field, replace

XP_PER_HOUR = 600  # §12.4: typical practice rate


@dataclass(frozen=True)
class Params:
    # Institutes (§12.5 Research): copy n+1 of tier k costs inst_cost0 * inst_cost_step**k * 1.15**n
    # and makes inst_out0 * inst_out_step**k Lemmas a day.
    inst_cost0: float = 2_000
    inst_cost_step: float = 15
    inst_out0: float = 2.5
    inst_out_step: float = 8
    copy_growth: float = 1.15
    # Cards staffing institutes: a full set multiplies output by about 2.78.
    full_set_boost: float = 1.78
    cards_time_constant_h: float = 80
    # Time Warp: days of Research credited per active hour (12 hours = 0.5).
    time_warp: float = 0.5
    # Conjectures: first costs conj_cost0, each next costs conj_cost_step times more, each multiplies Research.
    conj_cost0: float = 50e6
    conj_cost_step: float = 10
    conj_mult: float = 2.5
    conj_count: int = 12
    # Axioms: bonus to all sources each, at these lifetime-Lemma thresholds.
    axiom_bonus: float = 0.05
    axiom_thresholds: tuple[float, ...] = (
        10e3, 30e3, 100e3, 300e3, 700e3, 1.5e6, 3e6, 7e6, 15e6,       # ZFC
        30e6, 70e6, 100e6, 300e6, 1.5e9, 50e9, 150e12, 3e15, 7e15,    # large cardinals
    )
    # Corollaries, approximated: +0.6 per 100 active hours.
    corollary_per_100h: float = 0.6


AXIOMS = (
    "Extensionality", "Regularity", "Specification", "Pairing", "Union", "Replacement", "Infinity",
    "Power Set", "Choice", "Inaccessible", "Mahlo", "Weakly Compact", "Measurable", "Strong", "Woodin",
    "Supercompact", "Huge", "Rank-into-Rank",
)


@dataclass
class Snapshot:
    hours: float
    practice_per_hour: float
    research_per_day: float  # Time Warp included
    earned: float
    axioms: int
    conjectures: int

    @property
    def ratio(self) -> float:
        return self.research_per_day / self.practice_per_hour


@dataclass
class Run:
    hours_per_day: float
    snapshots: list[Snapshot] = field(default_factory=list)
    axiom_hours: dict[int, float] = field(default_factory=dict)
    conjecture_hours: dict[int, float] = field(default_factory=dict)

    def at(self, hours: float) -> Snapshot:
        return min(self.snapshots, key=lambda s: abs(s.hours - hours))


def simulate(p: Params, hours_per_day: float, max_hours: float) -> Run:
    run = Run(hours_per_day)
    balance = earned = 0.0
    owned = [0] * 7
    practice_lv = golden_lv = recurrence_lv = conj = 0
    outputs = [p.inst_out0 * p.inst_out_step**k for k in range(7)]
    hours = 0.0
    while hours < max_hours:
        hours += hours_per_day
        axioms = sum(1 for t in p.axiom_thresholds if earned >= t)
        for k in range(1, axioms + 1):
            run.axiom_hours.setdefault(k, hours)
        global_mult = (1 + p.corollary_per_100h * hours / 100) * (1 + p.axiom_bonus * axioms)
        golden = 1 + 0.0618 * golden_lv
        cards = 1 + p.full_set_boost * (1 - math.exp(-hours / p.cards_time_constant_h))
        conj_mult = p.conj_mult**conj
        practice = XP_PER_HOUR * (1 + 0.10 * practice_lv) * golden * global_mult
        base = sum(n * o for n, o in zip(owned, outputs)) * cards
        research = base * (1 + 0.10 * recurrence_lv) * golden * global_mult * conj_mult
        day = practice * hours_per_day + research * (1 + p.time_warp * hours_per_day)
        balance += day
        earned += day
        run.snapshots.append(Snapshot(hours, practice, research * (1 + p.time_warp * hours_per_day), earned, axioms, conj))

        while True:  # buy the best value per Lemma, or save for it
            base = sum(n * o for n, o in zip(owned, outputs)) * cards
            r_mult = (1 + 0.10 * recurrence_lv) * golden * global_mult * conj_mult
            options = []
            for k in range(7):
                cost = p.inst_cost0 * p.inst_cost_step**k * p.copy_growth ** owned[k]
                options.append((outputs[k] * cards * r_mult / cost, cost, ("institute", k)))
            cost = 500 * 1.15**practice_lv
            options.append((XP_PER_HOUR * hours_per_day * 0.10 * golden * global_mult / cost, cost, ("practice",)))
            cost = 1000 * 1.3**recurrence_lv
            options.append((base * 0.10 * golden * global_mult * conj_mult / cost, cost, ("recurrence",)))
            cost = 5000 * 1.618**golden_lv
            gain = (XP_PER_HOUR * hours_per_day * (1 + 0.10 * practice_lv) + base * (1 + 0.10 * recurrence_lv) * conj_mult)
            options.append((gain * 0.0618 * global_mult / cost, cost, ("golden",)))
            if conj < p.conj_count:
                cost = p.conj_cost0 * p.conj_cost_step**conj
                options.append((research * (p.conj_mult - 1) / cost, cost, ("conjecture",)))
            _, cost, what = max(options)
            if cost > balance:
                break
            balance -= cost
            if what[0] == "institute":
                owned[what[1]] += 1
            elif what[0] == "practice":
                practice_lv += 1
            elif what[0] == "recurrence":
                recurrence_lv += 1
            elif what[0] == "golden":
                golden_lv += 1
            else:
                conj += 1
                run.conjecture_hours[conj] = hours
    return run


def si(x: float) -> str:
    """SI notation as the app shows it (§12.5): three significant figures, k to Q."""
    if x < 1000:
        return f"{x:.0f}"
    prefixes = "kMGTPEZYRQ"
    e = min(int(math.log10(x) // 3), len(prefixes))
    v = x / 10 ** (3 * e)
    digits = 2 if v < 10 else 1 if v < 100 else 0
    return f"{v:.{digits}f} {prefixes[e - 1]}"


def nice(x: float) -> float:
    """Round a threshold to 1, 1.5, 2, 3, 5 or 7 times a power of ten."""
    e = math.floor(math.log10(x))
    m = x / 10**e
    for c in (1, 1.5, 2, 3, 5, 7, 10):
        if m <= c * 1.2:
            return c * 10**e
    return 10 ** (e + 1)


def fit_thresholds(p: Params, hours_per_day: float = 1.5, end_hours: float = 821,
                   zfc_hours=(12, 25, 50, 95, 150, 210, 270, 340, 410)) -> Params:
    """Fit all 18 thresholds so the given student reaches each Axiom at a target active hour.

    ZFC targets are fixed; the large cardinals are spaced evenly from the last ZFC target to end_hours.
    The default targets Rank-into-Rank after 1.5 years of 1.5 hours a day (§12.5).
    """
    last = zfc_hours[-1]
    targets = list(zfc_hours) + [last + (end_hours - last) * (k + 1) / 9 for k in range(9)]
    for _ in range(10):
        run = simulate(p, hours_per_day, end_hours + 300)
        new = [nice(run.at(t).earned) for t in targets]
        for i in range(1, len(new)):
            if new[i] <= new[i - 1]:
                new[i] = nice(new[i - 1] * 1.4)
        if tuple(new) == p.axiom_thresholds:
            break
        p = replace(p, axiom_thresholds=tuple(new))
    return p


def report(p: Params, hours_per_day: float, rows=(100, 200, 300, 400, 500, 600, 700, 800)) -> None:
    run = simulate(p, hours_per_day, 2500)
    print(f"\n{hours_per_day} active hours a day")
    print(f"{'Hours':>6} {'Practice ∴/h':>13} {'Research ∴/day':>15} {'Ratio':>11} {'Axioms':>7} {'Conj.':>6}")
    for h in rows:
        s = run.at(h)
        print(f"{h:>6} {si(s.practice_per_hour):>13} {si(s.research_per_day):>15} {s.ratio:>11.3g} {s.axioms:>7} {s.conjectures:>6}")
    rir = run.axiom_hours.get(18)
    if rir:
        print(f"Rank-into-Rank at {rir:.0f} active hours = {rir / hours_per_day / 365:.2f} years")
    else:
        print("Rank-into-Rank not reached within 2,500 active hours")
    print("Axioms:", ", ".join(f"{AXIOMS[k - 1]} {h:.0f}" for k, h in sorted(run.axiom_hours.items())))
    print("Conjectures:", ", ".join(f"{k} at {h:.0f}" for k, h in sorted(run.conjecture_hours.items())))


def main(argv: list[str]) -> None:
    p = Params()
    if argv and argv[0] == "fit":
        p = fit_thresholds(p)
        print("Fitted thresholds:", ", ".join(f"{a} {si(t)}" for a, t in zip(AXIOMS, p.axiom_thresholds)))
        report(p, 1.5)
    elif argv and argv[0] == "report":
        report(p, float(argv[1]) if len(argv) > 1 else 0.75)
    else:
        for hpd in (0.75, 1.5, 3.0):
            report(p, hpd)


if __name__ == "__main__":
    main(sys.argv[1:])
