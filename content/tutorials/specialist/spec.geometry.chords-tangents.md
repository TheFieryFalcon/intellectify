---
skill: spec.geometry.chords-tangents
status: draft
terms:
  - term: tangent
    definition: A line that touches a circle at exactly one point, the point of contact.
  - term: segment of a circle
    definition: The region between a chord and the arc it cuts off.
  - term: congruent
    definition: Exactly the same shape and size. Congruent triangles have all matching sides and angles equal.
---
## Key ideas

**Equal chords, equal angles at the center.** Chords of equal length subtend equal angles at the center, and conversely, chords that subtend equal angles at the center are equal.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Equal chords subtend equal angles at the center"
points: { A: [-1.879, 0.684], B: [-1.532, -1.286], C: [1.532, -1.286], D: [1.879, 0.684], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: A, to: B, ticks: 1 }
  - { type: segment, from: C, to: D, ticks: 1 }
  - { type: segment, from: O, to: A, color: muted }
  - { type: segment, from: O, to: B, color: muted }
  - { type: segment, from: O, to: C, color: muted }
  - { type: segment, from: O, to: D, color: muted }
  - { type: angle, at: O, from: A, to: B, radius: 14 }
  - { type: angle, at: O, from: C, to: D, radius: 14 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
  - { type: point, at: O, label: 'O', pos: n }
```

*Proof.* For chords $AB$ and $CD$, triangles $OAB$ and $OCD$ each have two sides that are radii. If $AB = CD$, the triangles are **congruent** (three pairs of equal sides), so $\angle AOB = \angle COD$. If instead $\angle AOB = \angle COD$, the triangles are congruent by two sides and the included angle, so $AB = CD$.

**Tangents** (facts used throughout):
- A **tangent** is perpendicular to the radius at its point of contact.
- The two tangents from an outside point $M$ are equal in length: $MS = MT$. (Triangles $OSM$ and $OTM$ are congruent: right angle, common side $OM$, and radii $OS = OT$.)

```diagram
view: [-2.45, 2.45, -4.05, 2.45]
width: 230
alt: "A tangent is perpendicular to the radius, and two tangents from one point are equal"
points: { M: [0, -3.6], S: [1.663, -1.111], T: [-1.663, -1.111], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: M, to: S, ticks: 1 }
  - { type: segment, from: M, to: T, ticks: 1 }
  - { type: segment, from: O, to: S, color: muted }
  - { type: segment, from: O, to: T, color: muted }
  - { type: angle, at: S, from: O, to: M, right: true }
  - { type: angle, at: T, from: O, to: M, right: true }
  - { type: point, at: M, label: 'M' }
  - { type: point, at: S, label: 'S' }
  - { type: point, at: T, label: 'T' }
  - { type: point, at: O, label: 'O', pos: n }
```

**Alternate segment theorem.** The angle between a tangent and a chord through the point of contact equals the angle in the **alternate segment**, the segment on the other side of the chord.

```diagram
view: [-2.9, 2.9, -2.5, 2.5]
width: 230
alt: "Alternate segment theorem: the angle between tangent and chord equals the angle in the alternate segment"
points: { T: [-0, -2], A: [-1.732, 1], B: [1.732, 1], X: [-2.6, -2], Y: [2.6, -2], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: X, to: Y }
  - { type: segment, from: T, to: A }
  - { type: segment, from: T, to: B }
  - { type: segment, from: A, to: B }
  - { type: angle, at: T, from: Y, to: B, label: '\theta', radius: 24 }
  - { type: angle, at: A, from: T, to: B, label: '\theta', radius: 20 }
  - { type: point, at: T, label: 'T' }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: X, label: 'X', dot: false }
```

*Proof (sketch).* Draw the diameter from $T$. It meets the tangent at $90^\circ$, and the angle in a semicircle is $90^\circ$. Subtracting the same angle from both right angles shows the tangent–chord angle equals an angle on the same arc as $\angle TAB$, and angles on the same arc are equal.

## Method

1. At every point of contact, mark the $90^\circ$ between tangent and radius.
2. For a tangent–chord angle, find the chord, then look across it to the alternate segment: any angle there subtended by that chord is equal.
3. Two tangents from one point: mark them equal, so the triangle they make with the chord of contact is isosceles.
4. Equal chords and equal center angles imply each other, so use whichever is given to get the other.

## Worked examples

### Example 1
A tangent touches a circle at $T$. Chord $TB$ makes an angle of $52^\circ$ with the tangent. $A$ is a point on the circle in the alternate segment. Find $\angle TAB$.

```diagram
view: [-3.25, 3.25, -2.45, 2.45]
width: 230
alt: "Tangent at T; chord TB at 52 degrees to it; A on the circle in the alternate segment"
points: { T: [-0, -2], B: [1.941, 0.484], A: [-1.732, 1], L: [-2.8, -2], R: [2.8, -2], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: L, to: R, color: muted }
  - { type: segment, from: T, to: B }
  - { type: segment, from: A, to: T }
  - { type: segment, from: A, to: B }
  - { type: angle, at: T, from: R, to: B, label: '52^\circ', radius: 24 }
  - { type: angle, at: A, from: T, to: B, label: '?', radius: 22 }
  - { type: point, at: T, label: 'T', pos: s }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
```

1. Alternate segment theorem: the tangent–chord angle equals the angle in the alternate segment.
2. So $\angle TAB = 52^\circ$.

### Example 2
Tangents from $M$ touch a circle with center $O$ at $S$ and $T$, and $\angle SMT = 50^\circ$. Find $\angle SOT$ and $\angle MST$.

```diagram
view: [-2.45, 5.18, -2.45, 2.45]
width: 300
alt: "Tangents from M touch the circle at S and T; angle SMT is 50 degrees"
points: { M: [4.732, 0], S: [0.845, 1.813], T: [0.845, -1.813], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: M, to: S }
  - { type: segment, from: M, to: T }
  - { type: segment, from: S, to: T, color: muted }
  - { type: segment, from: O, to: S, color: muted }
  - { type: segment, from: O, to: T, color: muted }
  - { type: angle, at: S, from: O, to: M, right: true }
  - { type: angle, at: T, from: M, to: O, right: true }
  - { type: angle, at: M, from: T, to: S, label: '50^\circ', radius: 26 }
  - { type: angle, at: O, from: T, to: S, label: '?', radius: 16 }
  - { type: angle, at: S, from: M, to: T, label: '?', radius: 16 }
  - { type: point, at: M, label: 'M', pos: e }
  - { type: point, at: S, label: 'S', pos: n }
  - { type: point, at: T, label: 'T', pos: s }
  - { type: point, at: O, label: 'O', pos: w }
```

1. Tangents are perpendicular to radii: $\angle OSM = \angle OTM = 90^\circ$.
2. The angles of quadrilateral $OSMT$ add to $360^\circ$: $\angle SOT = 360^\circ - 90^\circ - 90^\circ - 50^\circ = 130^\circ$.
3. $MS = MT$ (tangents from one point), so triangle $MST$ is isosceles: $\angle MST = \tfrac{1}{2}(180^\circ - 50^\circ) = 65^\circ$.

### Example 3
In a circle with center $O$, chords $AB$ and $CD$ are equal, and $\angle AOB = 72^\circ$. Find $\angle OCD$.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Equal chords AB and CD; angle AOB is 72 degrees"
points: { A: [-1.879, -0.684], B: [0.07, -1.999], C: [1.879, 0.684], D: [-0.07, 1.999], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: A, to: B, ticks: 1 }
  - { type: segment, from: C, to: D, ticks: 1 }
  - { type: segment, from: O, to: A, color: muted }
  - { type: segment, from: O, to: B, color: muted }
  - { type: segment, from: O, to: C, color: muted }
  - { type: segment, from: O, to: D, color: muted }
  - { type: angle, at: O, from: A, to: B, label: '72^\circ', radius: 18 }
  - { type: angle, at: C, from: O, to: D, label: '?', radius: 18 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
  - { type: point, at: O, label: 'O', pos: sw }
```

1. Equal chords subtend equal angles at the center: $\angle COD = 72^\circ$.
2. $OC = OD$ (radii): $\angle OCD = \tfrac{1}{2}(180^\circ - 72^\circ) = 54^\circ$.

## Watch out
- The alternate segment is on the *other* side of the chord from the tangent–chord angle.
- The tangent is perpendicular to the radius, not to the chord.
