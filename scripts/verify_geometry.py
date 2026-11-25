"""
Geometry helpers available to every question's `verify` code (docs/SPEC.md §11.3).
They let a verify script build the actual figure from coordinates and *measure* the answer,
instead of re-applying the theorem the question is testing.
"""
import math

import sympy


def on_circle(deg, r=1, c=(0, 0)):
    """The point at angle `deg` (degrees, anticlockwise from the positive x-axis) on a circle."""
    t = math.radians(deg)
    return (c[0] + r * math.cos(t), c[1] + r * math.sin(t))


def dist(p, q):
    return math.hypot(p[0] - q[0], p[1] - q[1])


def angle_at(p, q, r):
    """The angle PQR at Q, in degrees (0 to 180)."""
    a = (p[0] - q[0], p[1] - q[1])
    b = (r[0] - q[0], r[1] - q[1])
    cos = (a[0] * b[0] + a[1] * b[1]) / (math.hypot(*a) * math.hypot(*b))
    return math.degrees(math.acos(max(-1.0, min(1.0, cos))))


def line_meet(p1, p2, q1, q2):
    """Where line P1P2 meets line Q1Q2."""
    d = (p2[0] - p1[0]) * (q2[1] - q1[1]) - (p2[1] - p1[1]) * (q2[0] - q1[0])
    if abs(d) < 1e-12:
        raise ValueError("lines are parallel")
    t = ((q1[0] - p1[0]) * (q2[1] - q1[1]) - (q1[1] - p1[1]) * (q2[0] - q1[0])) / d
    return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))


def tangent_point_toward(c, r, m, side=1):
    """A point where a tangent from external point M touches the circle (center C, radius r)."""
    d = dist(c, m)
    base = math.atan2(m[1] - c[1], m[0] - c[0])
    off = math.acos(r / d)
    t = base + side * off
    return (c[0] + r * math.cos(t), c[1] + r * math.sin(t))


def approx(x, places=6):
    """A float rounded and turned into an exact SymPy number, for comparing with exact keys."""
    return sympy.nsimplify(round(x, places), rational=True)


def line_circle(p, deg, r, c=(0, 0)):
    """Signed distances t (sorted) where the line p + t·(cos deg, sin deg) meets the circle."""
    dx, dy = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    fx, fy = p[0] - c[0], p[1] - c[1]
    b = 2 * (fx * dx + fy * dy)
    k = fx * fx + fy * fy - r * r
    disc = b * b - 4 * k
    if disc < 0:
        return []
    s = math.sqrt(disc)
    return sorted([(-b - s) / 2, (-b + s) / 2])


def search(f, target, lo=0.0, hi=180.0, steps=180000):
    """The x in [lo, hi] where f(x) is closest to target (f may return None where undefined)."""
    best, bx = float("inf"), None
    for i in range(steps + 1):
        x = lo + (hi - lo) * i / steps
        v = f(x)
        if v is not None and abs(v - target) < best:
            best, bx = abs(v - target), x
    return bx
