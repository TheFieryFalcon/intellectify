---
skill: spec.geometry.circle-problems
status: draft
terms:
  - term: concyclic
    definition: Lying on one circle. Four points are concyclic exactly when they form a cyclic quadrilateral.
---
## Key ideas

**Converses.** Several circle results also work backwards. They are how you prove that points lie on a circle (are **concyclic**):
- If $\angle ACB = 90^\circ$, then $C$ lies on the circle with diameter $AB$ (converse of the angle in a semicircle).
- If a quadrilateral's opposite angles add to $180^\circ$, it is cyclic (converse of the cyclic quadrilateral theorem).
- If segment $AB$ subtends equal angles at $C$ and $D$ on the same side of $AB$, then $A$, $B$, $C$ and $D$ are concyclic (converse of angles on the same arc).
- If an exterior angle of a quadrilateral equals the interior opposite angle, it is cyclic.

```diagram
view: [-2.45, 2.45, -1.4, 2.45]
width: 230
alt: "If AB subtends equal angles at C and D on the same side, then A, B, C and D lie on a circle"
points: { O: [0, 0], A: [-1.879, -0.684], B: [1.879, -0.684], C: [0.518, 1.932], D: [-1, 1.732] }
draw:
  - { type: segment, from: A, to: B }
  - { type: segment, from: C, to: A }
  - { type: segment, from: C, to: B }
  - { type: segment, from: D, to: A }
  - { type: segment, from: D, to: B }
  - { type: angle, at: C, from: A, to: B, label: 'x', radius: 20 }
  - { type: angle, at: D, from: A, to: B, label: 'x', radius: 20 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
  - { type: circle, center: O, radius: 2, dashed: true, color: muted }
```

*Why the converses hold (sketch for the first):* the circle through $A$, $B$ and $C$ is fixed. If $D$ were inside it, $\angle ADB$ would be larger than $\angle ACB$; if outside, smaller. Equal angles force $D$ onto the circle. This is a proof by contradiction.

**Solving problems.** Most problems combine several results. The useful facts so far:

| Look for | Gives |
|---|---|
| Two radii | An isosceles triangle |
| A diameter | A right angle at the circumference |
| Same arc, same side | Equal angles |
| Cyclic quadrilateral | Opposite angles add to $180^\circ$; exterior angle equals interior opposite |
| Tangent and radius | A right angle |
| Tangent and chord | The alternate segment angle |
| Two tangents from a point | Equal lengths |
| Chords or secants meeting | Equal products of lengths |

## Method

1. Draw a large, clear diagram. Mark the given angles and lengths, and every radius, tangent and right angle you can.
2. Chase angles: write each new angle on the diagram with its reason. Use letters for unknowns when needed.
3. For "prove that…" questions, work out what you need to show (e.g. two equal angles, or opposite angles adding to $180^\circ$), then build a chain of reasons towards it.
4. To prove points are concyclic, use one of the converses above.

## Worked examples

### Example 1
$ABCD$ is a quadrilateral with $\angle DAB = 2x + 10^\circ$, $\angle ABC = 3x + 5^\circ$, $\angle BCD = 4x - 10^\circ$ and $\angle CDA = 85^\circ$. Find $x$, and show that $ABCD$ is cyclic.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Quadrilateral ABCD with its four angles given in terms of x"
points: { A: [-1.879, -0.684], B: [0.684, -1.879], C: [1.97, 0.347], D: [0.684, 1.879], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2, dashed: true }
  - { type: polygon, points: [A, B, C, D] }
  - { type: angle, at: A, from: B, to: D, label: '2x + 10^\circ', radius: 20 }
  - { type: angle, at: B, from: C, to: A, label: '3x + 5^\circ', radius: 20 }
  - { type: angle, at: C, from: D, to: B, label: '4x - 10^\circ', radius: 20 }
  - { type: angle, at: D, from: A, to: C, label: '85^\circ', radius: 20 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
```

1. The angles of a quadrilateral add to $360^\circ$: $9x + 5^\circ + 85^\circ = 360^\circ$, so $9x = 270^\circ$ and $x = 30^\circ$.
2. Then $\angle DAB = 70^\circ$ and $\angle BCD = 110^\circ$, which add to $180^\circ$.
3. One pair of opposite angles adds to $180^\circ$, so by the converse of the cyclic quadrilateral theorem, $ABCD$ is cyclic. (The other pair, $95^\circ + 85^\circ$, also adds to $180^\circ$, as it must.)

### Example 2
Points $A$, $B$, $C$, $D$ lie on a circle, and the chords $AC$ and $BD$ meet at $X$. $\angle BAC = 40^\circ$ and $\angle AXB = 105^\circ$. Find $\angle ACD$.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Chords AC and BD meet at X; angle BAC is 40 degrees and angle AXB is 105 degrees"
points: { A: [-1.879, -0.684], B: [1.532, -1.286], C: [1.532, 1.286], D: [-1.286, 1.532], X: [-0.098, 0.344], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: A, to: C }
  - { type: segment, from: B, to: D }
  - { type: segment, from: A, to: B, color: muted }
  - { type: segment, from: C, to: D, color: muted }
  - { type: angle, at: A, from: B, to: C, label: '40^\circ', radius: 30 }
  - { type: angle, at: X, from: A, to: B, label: '105^\circ', radius: 14 }
  - { type: angle, at: C, from: A, to: D, label: '?', radius: 24 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
  - { type: point, at: X, label: 'X', pos: n }
```

1. Angles on the same arc $BC$: $\angle BDC = \angle BAC = 40^\circ$.
2. $\angle DXC = \angle AXB = 105^\circ$ (vertically opposite).
3. In triangle $DXC$: $\angle XCD = 180^\circ - 105^\circ - 40^\circ = 35^\circ$. So $\angle ACD = 35^\circ$.

### Example 3
$AB$ is a diameter of a circle. $P$ is a point outside the circle with $\angle APB = 90^\circ$. Is that possible?

```diagram
view: [-2.45, 2.45, -2.45, 3.26]
width: 250
alt: "Diameter AB. C on the circle makes a right angle; P outside makes 63 degrees"
points: { A: [-2, 0], B: [2, 0], C: [1, 1.732], P: [-1.31, 2.81], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: A, to: B }
  - { type: segment, from: A, to: C, color: muted }
  - { type: segment, from: C, to: B, color: muted }
  - { type: segment, from: A, to: P, color: accent }
  - { type: segment, from: P, to: B, color: accent }
  - { type: angle, at: C, from: A, to: B, right: true }
  - { type: angle, at: P, from: A, to: B, label: '63^\circ', radius: 18 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: P, label: 'P' }
  - { type: point, at: O, label: 'O', pos: s }
```

1. By the converse of the angle in a semicircle, $\angle APB = 90^\circ$ means $P$ is *on* the circle with diameter $AB$.
2. So no point outside (or inside) the circle makes a right angle at $P$: it is impossible.

## Watch out
- Converses need their exact conditions: equal angles must be on the *same side* of the segment.
- Never read angles or lengths off a diagram. Diagrams are not to scale unless stated.
- Every angle in a proof needs a reason.
