#!/usr/bin/env python3
"""Simulate the Lemma economy (docs/SPEC.md §13) to tune its numbers.

A simulated student plays a fixed number of active hours a day. Practice earns Lemmas at a rate
that rises with upgrades, corollaries and Axioms; Research earns Lemmas per calendar day plus the
Time Warp. After each day the student buys whatever adds the most Lemmas per day per Lemma spent,
saving up when that purchase isn't affordable yet.

The model is deliberately simple. The question-specific theorems are lumped into one +10%/level
practice upgrade and corollaries grow linearly with hours played.

Cards (§13.3, §13.7) are tracked per era as expected values. Free packs arrive from level tiers (each
tier's era, capped at the latest unlocked era), plus Section Challenges, achievements and Full Weeks,
which are lumped into a steady rate per active hour and per calendar week and go to the latest
unlocked era. An era's packs unlock with the first copy of the previous era's institute. Each pack's
rarity rolls fill a 24-card set (expected distinct cards and foils per rarity, no duplicate Diamonds
until all are held), with the Platinum guarantee averaged in; the Diamond guarantee and bought packs are
left out. Each institute has staff slots that grow with
copies built, and the best cards held for its era fill them. Axioms are assumed to be claimed (Prove)
as soon as they are reached.

Use it to compare settings and keep the calibration targets in §13.3, not to predict exact numbers.

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
    # Institutes (§13.3): copy n+1 of tier k costs inst_cost0 * inst_cost_step**k * 1.15**n
    # and makes inst_out0 * inst_out_step**k Lemmas a day.
    inst_cost0: float = 2_000
    inst_cost_step: float = 15
    inst_out0: float = 2.5
    inst_out_step: float = 8
    copy_growth: float = 1.15
    # Staff slots (§13.3): 1 slot with the first copy, 1 more every slot_copies copies, at most slot_cap.
    # Fitted: 1 slot per copy up to 12 (half a set). Two copies per slot leaves the 400-hour ratio near 10.
    slot_copies: int = 1
    slot_cap: int = 12
    # Free packs besides level tiers: Section Challenges and achievements per active hour, Full Weeks
    # per calendar week. They go to the latest unlocked era.
    packs_per_hour: float = 0.15
    packs_per_week: float = 0.5
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
        10e3, 30e3, 100e3, 300e3, 700e3, 1.5e6, 3e6, 5e6, 15e6,       # ZFC
        20e6, 50e6, 70e6, 100e6, 500e6, 1.5e9, 50e9, 50e12, 1e15,     # large cardinals
    )
    # Corollaries, approximated: +0.6 per 100 active hours.
    corollary_per_100h: float = 0.6


# Cards (§13.7). Rarities from best to worst; boost per slotted card, a foil doubles it.
RARITIES = ("diamond", "platinum", "gold", "silver")
CARD_BOOST = {"diamond": 0.30, "platinum": 0.15, "gold": 0.06, "silver": 0.02}
SET_SIZE = {"diamond": 4, "platinum": 5, "gold": 7, "silver": 8}  # about 24 per era
# Expected cards of each rarity per pack (§13.7): 3 cards; cards 1-2 Silver 72%, Gold 20%, Platinum 6.5%,
# Diamond 1.5%; card 3 Gold 92%, Platinum 6.5%, Diamond 1.5%. A Platinum or better is guaranteed by the
# 10th pack without one: over many packs that adds the share below, taken from Gold. (The Diamond
# guarantee, by the 80th pack, is left out, and so is Law of Large Numbers.)
PLAT_PITY = 10
_q = 1 - (1 - 0.08) ** 3  # a pack holds a Platinum or Diamond without the guarantee
_forced = 1 / ((1 - (1 - _q) ** PLAT_PITY) / _q) - _q  # extra Platinums per pack from the guarantee
ROLLS_PER_PACK = {"diamond": 3 * 0.015, "platinum": 3 * 0.065 + _forced,
                  "gold": 2 * 0.20 + 0.92 - _forced, "silver": 2 * 0.72}
FOIL = 1 / 25
# Level tiers (§12.4): total XP to reach, packs granted, and the era they come from (§13.7).
TIER_PACKS = ((1_495, 1, 0), (4_127, 2, 0), (8_899, 3, 1), (21_399, 8, 2), (38_899, 12, 3),
              (61_399, 15, 4), (121_399, 40, 5), (201_399, 54, 6), (301_399, 67, 6), (638_899, 226, 6))


def slots(p: Params, copies: int) -> int:
    """Staff slots of an institute with this many copies built."""
    return 0 if copies == 0 else min(p.slot_cap, 1 + (copies - 1) // p.slot_copies)


def slot_boosts(packs: float) -> list[tuple[float, float]]:
    """An era's held cards as (boost, expected count) pairs, best boost first, after this many packs."""
    runs = []
    for r in RARITIES:
        n = SET_SIZE[r]
        m = packs * ROLLS_PER_PACK[r]
        held = min(n, m) if r == "diamond" else n * (1 - (1 - 1 / n) ** m)
        foils = min(held, n * (1 - (1 - FOIL / n) ** m))
        runs.append((2 * CARD_BOOST[r], foils))
        runs.append((CARD_BOOST[r], held - foils))
    runs.sort(reverse=True)
    return runs


def card_boost(runs: list[tuple[float, float]], n_slots: int) -> float:
    """Output multiplier of an institute whose n_slots slots hold the best cards in runs."""
    total, room = 1.0, float(n_slots)
    for boost, count in runs:
        take = min(room, count)
        total += boost * take
        room -= take
        if room <= 0:
            break
    return total


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
    owned: tuple[int, ...] = ()
    slots: tuple[int, ...] = ()
    card_mult: tuple[float, ...] = ()  # each institute's output multiplier from its slotted cards

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
    packs = [0.0] * 7  # packs opened per era
    practice_lv = golden_lv = recurrence_lv = conj = 0
    outputs = [p.inst_out0 * p.inst_out_step**k for k in range(7)]
    hours = 0.0
    while hours < max_hours:
        xp_before = XP_PER_HOUR * hours
        hours += hours_per_day
        # Era k's packs unlock with the first copy of institute k - 1 (§13.7).
        latest = next((k for k in range(1, 7) if owned[k - 1] == 0), 7) - 1
        for xp, n, era in TIER_PACKS:
            if xp_before < xp <= XP_PER_HOUR * hours:
                packs[min(era, latest)] += n
        packs[latest] += p.packs_per_hour * hours_per_day + p.packs_per_week / 7
        runs = [slot_boosts(n) for n in packs]

        def staffed(k: int, copies: int) -> float:
            """Output of `copies` copies of institute k, boosted by its staff slots."""
            return copies * outputs[k] * card_boost(runs[k], slots(p, copies))

        axioms = sum(1 for t in p.axiom_thresholds if earned >= t)
        for k in range(1, axioms + 1):
            run.axiom_hours.setdefault(k, hours)
        global_mult = (1 + p.corollary_per_100h * hours / 100) * (1 + p.axiom_bonus * axioms)
        golden = 1 + 0.0618 * golden_lv
        conj_mult = p.conj_mult**conj
        practice = XP_PER_HOUR * (1 + 0.10 * practice_lv) * golden * global_mult
        base = sum(staffed(k, n) for k, n in enumerate(owned))
        research = base * (1 + 0.10 * recurrence_lv) * golden * global_mult * conj_mult
        day = practice * hours_per_day + research * (1 + p.time_warp * hours_per_day)
        balance += day
        earned += day
        run.snapshots.append(Snapshot(hours, practice, research * (1 + p.time_warp * hours_per_day), earned, axioms, conj,
                                      tuple(owned), tuple(slots(p, n) for n in owned),
                                      tuple(card_boost(runs[k], slots(p, n)) for k, n in enumerate(owned))))

        while True:  # buy the best value per Lemma, or save for it
            base = sum(staffed(k, n) for k, n in enumerate(owned))
            r_mult = (1 + 0.10 * recurrence_lv) * golden * global_mult * conj_mult
            options = []
            for k in range(7):
                if k > 0 and owned[k - 1] == 0:
                    continue  # each institute unlocks with the first copy of the one before it
                cost = p.inst_cost0 * p.inst_cost_step**k * p.copy_growth ** owned[k]
                gain = staffed(k, owned[k] + 1) - staffed(k, owned[k])
                options.append((gain * r_mult / cost, cost, ("institute", k)))
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
    """SI notation as the app shows it (§13.1): three significant figures, k to Q."""
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
    The default targets Rank-into-Rank after 1.5 years of 1.5 hours a day (§13.3, §13.6).
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
