---
skill: spec.geometry.circle-angles
status: draft
terms:
  - term: chord
    definition: A line segment joining two points on a circle. A chord through the center is a diameter.
  - term: arc
    definition: The part of a circle between two points on it. The shorter one is the minor arc, the longer one the major arc.
  - term: subtend
    definition: An arc or chord AB subtends angle APB at a point P, the angle formed by joining P to A and to B.
  - term: circumference
    definition: The circle itself, the curve. An "angle at the circumference" has its corner on the circle.
  - term: cyclic quadrilateral
    definition: A four-sided shape whose four corners all lie on one circle.
  - term: isosceles triangle
    definition: A triangle with two equal sides. The angles opposite those sides are equal too.
---
## Key ideas

Four facts about angles in circles, each proved from the one before. Throughout, $O$ is the center, and two radii from $O$ always make an **isosceles triangle**.

**1. Angle at the center is twice the angle at the circumference.** If arc $AB$ subtends angle $AOB$ at the center and angle $ACB$ at a point $C$ on the rest of the circle, then $\angle AOB = 2\angle ACB$.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "The angle at the center is twice the angle at the circumference on the same arc"
points: { A: [-1.732, -1], B: [1.732, -1], C: [-0.347, 1.97], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: O, to: A, color: muted }
  - { type: segment, from: O, to: B, color: muted }
  - { type: segment, from: C, to: A }
  - { type: segment, from: C, to: B }
  - { type: angle, at: O, from: A, to: B, label: '2x', radius: 16 }
  - { type: angle, at: C, from: A, to: B, label: 'x', radius: 22 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: O, label: 'O', pos: ne }
```

*Proof (when $O$ is inside angle $ACB$).* Draw the diameter through $C$, ending at $E$. $OA = OC$ (radii), so triangle $OAC$ is isosceles and $\angle OAC = \angle OCA = a$. The angle $AOE$, outside that triangle, equals the two opposite angles: $2a$. In the same way, triangle $OBC$ gives $\angle EOB = 2b$, where $b = \angle OCB$. Adding: $\angle AOB = 2a + 2b = 2(a + b) = 2\angle ACB$. (When $O$ is outside the angle, the same steps work with subtraction.)

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Proof: draw the diameter through C, making two isosceles triangles"
points: { A: [-1.732, -1], B: [1.732, -1], C: [-0.347, 1.97], E: [0.347, -1.97], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: C, to: A }
  - { type: segment, from: C, to: B }
  - { type: segment, from: O, to: A, color: muted }
  - { type: segment, from: O, to: B, color: muted }
  - { type: segment, from: C, to: E, dashed: true, color: muted }
  - { type: angle, at: C, from: A, to: O, label: 'a', radius: 26 }
  - { type: angle, at: C, from: O, to: B, label: 'b', radius: 34 }
  - { type: angle, at: A, from: O, to: C, label: 'a', radius: 18 }
  - { type: angle, at: B, from: C, to: O, label: 'b', radius: 18 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: E, label: 'E' }
  - { type: point, at: O, label: 'O', pos: e }
```

**2. Angle in a semicircle.** If $AB$ is a diameter, then any angle $ACB$ with $C$ on the circle is $90^\circ$. This is fact 1 with $\angle AOB = 180^\circ$.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "An angle in a semicircle is a right angle"
points: { A: [-2, 0], B: [2, 0], C: [-1, 1.732], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: segment, from: A, to: B }
  - { type: segment, from: C, to: A }
  - { type: segment, from: C, to: B }
  - { type: angle, at: C, from: A, to: B, right: true }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: O, label: 'O', pos: s }
```

**3. Angles on the same arc are equal.** Angles at the circumference subtended by the same arc, on the same side of the chord, are equal. Each is half of the same angle at the center.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Angles at C and D on the same arc AB are equal"
points: { A: [-1.879, -0.684], B: [1.879, -0.684], C: [0.684, 1.879], D: [-1.147, 1.638], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
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
```

**4. Opposite angles of a cyclic quadrilateral add to $180^\circ$.** In cyclic quadrilateral $ABCD$, $\angle A + \angle C = 180^\circ$ and $\angle B + \angle D = 180^\circ$. The two angles at the center that they correspond to make a full turn, $360^\circ$, so the two angles at the circumference add to half of that.

```diagram
view: [-2.45, 2.45, -2.45, 2.45]
width: 230
alt: "Opposite angles of a cyclic quadrilateral add to 180 degrees"
points: { A: [-1.879, -0.684], B: [1, -1.732], C: [1.732, 1], D: [-0.684, 1.879], O: [0, 0] }
draw:
  - { type: circle, center: O, radius: 2 }
  - { type: polygon, points: [A, B, C, D] }
  - { type: angle, at: A, from: B, to: D, label: '\alpha', radius: 18 }
  - { type: angle, at: C, from: D, to: B, label: '180^\circ - \alpha', radius: 16 }
  - { type: point, at: A, label: 'A' }
  - { type: point, at: B, label: 'B' }
  - { type: point, at: C, label: 'C' }
  - { type: point, at: D, label: 'D' }
```

A useful consequence: an **exterior angle** of a cyclic quadrilateral (made by extending one side) equals the **interior opposite angle**.

## Method

1. Mark the center and every radius you can draw. Each pair of radii gives an isosceles triangle.
2. Find the arc each angle stands on (the chord its two arms reach). Angles on the same arc are equal; the angle at the center on that arc is double.
3. Look for diameters (right angles) and cyclic quadrilaterals (opposite angles supplementary).
4. Give a reason for every angle you state, using the theorem's name.

## Worked examples

### Example 1
$A$, $B$ and $C$ are on a circle with center $O$, and $\angle ACB = 35^\circ$, with $C$ on the major arc. Find $\angle AOB$ and $\angle OAB$.

1. Angle at the center is twice the angle at the circumference: $\angle AOB = 2 \times 35^\circ = 70^\circ$.
2. $OA = OB$ (radii), so triangle $OAB$ is isosceles with equal base angles: $\angle OAB = \tfrac{1}{2}(180^\circ - 70^\circ) = 55^\circ$.

### Example 2
$ABCD$ is a cyclic quadrilateral with $\angle DAB = 3x$ and $\angle BCD = 2x + 30^\circ$. Find $x$.

1. Opposite angles of a cyclic quadrilateral add to $180^\circ$: $3x + 2x + 30^\circ = 180^\circ$.
2. So $5x = 150^\circ$ and $x = 30^\circ$. (The angles are $90^\circ$ and $90^\circ$.)

### Example 3
$AB$ is a diameter of a circle, and $C$ is on the circle with $\angle CAB = 28^\circ$. $D$ is on the circle on the same side of $AB$ as $C$. Find $\angle ADC$.

1. Angle in a semicircle: $\angle ACB = 90^\circ$, so $\angle ABC = 180^\circ - 90^\circ - 28^\circ = 62^\circ$.
2. $\angle ADC$ and $\angle ABC$ are on the same arc $AC$, so they are equal: $\angle ADC = 62^\circ$.

## Watch out
- "Twice" goes from the circumference to the center, never the other way.
- Angles on the same arc must be on the same side of the chord. On opposite sides, they add to $180^\circ$ instead (a cyclic quadrilateral).
- Name the theorem for every step: markers expect reasons.
