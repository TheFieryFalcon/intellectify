---
skill: spec.geometry.chord-secant-lengths
status: draft
terms:
  - term: secant
    definition: A line that cuts a circle at two points.
  - term: similar triangles
    definition: Triangles with the same three angles. Their sides are in the same ratio, so matching sides can be divided to give equal fractions.
---
## Key ideas

Both results come from **similar triangles**, made by angles on the same arc or by the alternate segment theorem.

**Intersecting chords.** If chords $AB$ and $CD$ meet at $X$ inside the circle, then
$$AX \times XB = CX \times XD.$$

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Intersecting chords AB and CD meet at X: AX times XB equals CX times XD"
points: { A: [-1.732, 1], B: [1.732, -1], C: [0.347, 1.97], D: [-1, -1.732], X: [-0.306, 0.176], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: A, to: B }
  - { type: segment, from: C, to: D }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
  - { type: point, at: X, label: 'X', pos: e }
```

*Proof.* Join $AC$ and $BD$. $\angle CAB = \angle CDB$ (same arc $CB$) and $\angle AXC = \angle DXB$ (vertically opposite). So triangles $AXC$ and $DXB$ are similar, giving $\dfrac{AX}{DX} = \dfrac{CX}{BX}$, i.e. $AX \times XB = CX \times XD$.

**Tangent and secant from an outside point.** If a tangent from $M$ touches the circle at $T$, and a **secant** from $M$ cuts it at $A$ and $B$, then
$$MT^2 = MA \times MB.$$

```diagram
view: [-2.5, 4.7, -2.5, 2.5]
width: 260
alt: "From M, tangent MT and secant MAB: MT squared equals MA times MB"
points: { M: [4.2, 0], T: [0.952, 1.759], A: [1.942, -0.48], B: [-1.578, -1.228], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: M, to: T }
  - { type: segment, from: M, to: B }
  - { type: point, at: M, label: 'M' }
  - { type: point, at: T, label: 'T' }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
```

*Proof.* Triangles $MTA$ and $MBT$ share the angle at $M$, and $\angle MTA = \angle MBT$ by the alternate segment theorem. So they are similar: $\dfrac{MT}{MB} = \dfrac{MA}{MT}$, giving $MT^2 = MA \times MB$.

**Two secants from an outside point.** Comparing both with the same tangent gives $MA \times MB = MC \times MD$ for secants $MAB$ and $MCD$.

In every case the lengths are measured **from the meeting point** ($X$ or $M$) to each place the line meets the circle.

## Method

1. Find the point where the lines meet ($X$ inside, or $M$ outside).
2. Measure every length from that point. For an outside point, $MB$ is the *whole* secant: $MB = MA + AB$.
3. Write the matching product equation and solve, often a quadratic.
4. Check that lengths are positive; reject negative solutions.

## Worked examples

### Example 1
Chords $AB$ and $CD$ meet at $X$. $AX = 6$, $XB = 4$ and $CX = 3$. Find $XD$.

1. Intersecting chords: $AX \times XB = CX \times XD$, so $6 \times 4 = 3 \times XD$.
2. $XD = 8$.

### Example 2
From $M$, a tangent touches a circle at $T$, and a secant cuts the circle at $A$ and $B$ with $MA = 4$ and $AB = 5$. Find $MT$.

1. Measure from $M$: $MB = MA + AB = 9$.
2. $MT^2 = MA \times MB = 4 \times 9 = 36$, so $MT = 6$.

### Example 3
From $M$, a secant cuts a circle at $A$ and $B$ with $MA = x$ and $AB = 5$, and a tangent has $MT = 6$. Find $x$.

1. $MT^2 = MA \times MB$: $36 = x(x + 5)$, so $x^2 + 5x - 36 = 0$.
2. $(x + 9)(x - 4) = 0$, and lengths are positive, so $x = 4$.

## Watch out
- From an outside point, use the whole secant $MB$, not the chord $AB$.
- Each product pairs the two pieces of the *same* line.
