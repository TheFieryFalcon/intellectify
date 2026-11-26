---
skill: spec.vectors-2d.proofs
status: draft
terms:
  - term: rhombus
    definition: A four-sided shape with all four sides equal in length. It is a parallelogram.
  - term: quadrilateral
    definition: Any shape with four straight sides.
---
## Key ideas

Vectors turn geometric facts into algebra. Instead of reasoning about angles and lengths in a diagram, you write every line segment as a vector and calculate. The table shows how common claims translate:

| To show… | Show that… |
|---|---|
| $AB$ is parallel to $CD$ | $\overrightarrow{CD} = k\,\overrightarrow{AB}$ for some number $k$ |
| $AB$ and $CD$ are equal in length and parallel | $\overrightarrow{AB} = \overrightarrow{CD}$ |
| $AB$ is perpendicular to $CD$ | $\overrightarrow{AB}\cdot\overrightarrow{CD} = 0$ |
| $AB$ and $CD$ have equal lengths | $|\overrightarrow{AB}|^2 = |\overrightarrow{CD}|^2$ |
| $A$, $B$ and $C$ lie on one straight line | $\overrightarrow{AC} = k\,\overrightarrow{AB}$ for some number $k$ |

Comparing squared lengths avoids square roots, and $|\mathbf{v}|^2 = \mathbf{v}\cdot\mathbf{v}$ can be expanded like brackets.

**Useful facts.**
- **Parallelograms.** In parallelogram $OABC$, let $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OC} = \mathbf{c}$. Opposite sides are equal vectors, so $\overrightarrow{CB} = \mathbf{a}$ and $\overrightarrow{AB} = \mathbf{c}$. The diagonals are $\overrightarrow{OB} = \mathbf{a} + \mathbf{c}$ and $\overrightarrow{CA} = \mathbf{a} - \mathbf{c}$.
- **Midpoints.** If $A$ and $B$ have position vectors $\mathbf{a}$ and $\mathbf{b}$, the midpoint $M$ of $AB$ has position vector $\tfrac{1}{2}(\mathbf{a} + \mathbf{b})$. Starting at $A$ and going halfway to $B$ gives $\mathbf{a} + \tfrac{1}{2}(\mathbf{b} - \mathbf{a})$, which simplifies to this.
- A **rhombus** is a parallelogram with all four sides equal, so $|\mathbf{a}| = |\mathbf{c}|$.

## Method

1. Draw and label a diagram. Choose base vectors: usually two sides from one corner, or the position vectors of the corners from an origin.
2. Write each vector you need in terms of the base vectors.
3. Translate the claim into a vector statement using the table, then prove it with algebra.
4. Finish with a sentence stating the geometric conclusion.

## Worked examples

### Example 1
Prove that the diagonals of a **rhombus** are perpendicular.

1. Let the rhombus be $OABC$, with $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OC} = \mathbf{c}$. All sides are equal, so $|\mathbf{a}| = |\mathbf{c}|$.

```diagram
view: [-0.4, 6.4, -0.4, 3.9]
width: 260
points: { O: [0, 0], A: [4, 0], B: [6, 3.46], C: [2, 3.46], M: [3, 1.73] }
alt: "Rhombus OABC with diagonals a + c and a − c meeting at right angles"
draw:
  - { type: segment, from: A, to: B, ticks: 1 }
  - { type: segment, from: C, to: B, ticks: 1 }
  - { type: vector, from: O, to: A, label: '\mathbf{a}', side: right }
  - { type: vector, from: O, to: C, label: '\mathbf{c}' }
  - { type: segment, from: O, to: B, dashed: true, color: muted }
  - { type: segment, from: C, to: A, dashed: true, color: muted }
  - { type: angle, at: M, from: B, to: A, right: true }
  - { type: point, at: O, label: O, dot: false }
  - { type: point, at: A, label: A, dot: false }
  - { type: point, at: B, label: B, dot: false }
  - { type: point, at: C, label: C, dot: false }
```
2. The diagonals are $\overrightarrow{OB} = \mathbf{a} + \mathbf{c}$ and $\overrightarrow{CA} = \mathbf{a} - \mathbf{c}$.
3. Their dot product is $(\mathbf{a} + \mathbf{c})\cdot(\mathbf{a} - \mathbf{c}) = \mathbf{a}\cdot\mathbf{a} - \mathbf{a}\cdot\mathbf{c} + \mathbf{c}\cdot\mathbf{a} - \mathbf{c}\cdot\mathbf{c} = |\mathbf{a}|^2 - |\mathbf{c}|^2$.
4. Since $|\mathbf{a}| = |\mathbf{c}|$, this is 0. So the diagonals of a rhombus are perpendicular.

### Example 2
Prove that joining the midpoints of the sides of any **quadrilateral** $ABCD$, in order, gives a parallelogram.

```diagram
view: [-0.7, 6.8, -1.1, 4.3]
width: 280
alt: "Quadrilateral ABCD; the midpoints P, Q, R, S of its sides form a parallelogram"
points: { A: [0, 0], B: [5, -0.5], C: [6, 3], D: [1.2, 3.6], P: [2.5, -0.25], Q: [5.5, 1.25], R: [3.6, 3.3], S: [0.6, 1.8] }
draw:
  - { type: polygon, points: [A, B, C, D] }
  - { type: polygon, points: [P, Q, R, S], color: accent }
  - { type: point, at: A, label: 'A', pos: sw }
  - { type: point, at: B, label: 'B', pos: se }
  - { type: point, at: C, label: 'C', pos: ne }
  - { type: point, at: D, label: 'D', pos: nw }
  - { type: point, at: P, label: 'P', pos: s }
  - { type: point, at: Q, label: 'Q', pos: e }
  - { type: point, at: R, label: 'R', pos: n }
  - { type: point, at: S, label: 'S', pos: w }
```

1. Let the corners have position vectors $\mathbf{a}, \mathbf{b}, \mathbf{c}, \mathbf{d}$. Let $P, Q, R, S$ be the midpoints of $AB, BC, CD, DA$.
2. Then $\mathbf{p} = \tfrac{1}{2}(\mathbf{a} + \mathbf{b})$, $\mathbf{q} = \tfrac{1}{2}(\mathbf{b} + \mathbf{c})$, $\mathbf{r} = \tfrac{1}{2}(\mathbf{c} + \mathbf{d})$ and $\mathbf{s} = \tfrac{1}{2}(\mathbf{d} + \mathbf{a})$.
3. $\overrightarrow{PQ} = \mathbf{q} - \mathbf{p} = \tfrac{1}{2}(\mathbf{c} - \mathbf{a})$, and $\overrightarrow{SR} = \mathbf{r} - \mathbf{s} = \tfrac{1}{2}(\mathbf{c} - \mathbf{a})$.
4. So $\overrightarrow{PQ} = \overrightarrow{SR}$: sides $PQ$ and $SR$ are equal in length and parallel. A quadrilateral with one pair of opposite sides equal and parallel is a parallelogram, so $PQRS$ is a parallelogram.

### Example 3
Prove that in any parallelogram, the sum of the squares of the two diagonals equals the sum of the squares of the four sides.

```diagram
view: [-0.6, 6, -0.6, 3]
width: 290
alt: "Parallelogram OABC with diagonals a + c and a - c"
points: { O: [0, 0], A: [4, 0], B: [5.3, 2.4], C: [1.3, 2.4], L1: [4.134, 1.872], L2: [3.46, 0.48] }
draw:
  - { type: vector, from: O, to: A, label: '\mathbf{a}', side: right }
  - { type: vector, from: O, to: C, label: '\mathbf{c}' }
  - { type: segment, from: A, to: B, color: muted }
  - { type: segment, from: C, to: B, color: muted }
  - { type: vector, from: O, to: B, color: good }
  - { type: vector, from: C, to: A, color: bad }
  - { type: text, at: L1, text: '\mathbf{a} + \mathbf{c}', pos: se }
  - { type: text, at: L2, text: '\mathbf{a} - \mathbf{c}', pos: ne }
  - { type: point, at: O, label: 'O', pos: sw }
  - { type: point, at: A, label: 'A', pos: se }
  - { type: point, at: B, label: 'B', pos: ne }
  - { type: point, at: C, label: 'C', pos: nw }
```

1. Use parallelogram $OABC$ with sides $\mathbf{a}$ and $\mathbf{c}$. The four sides have lengths $|\mathbf{a}|, |\mathbf{c}|, |\mathbf{a}|, |\mathbf{c}|$, so the sum of their squares is $2|\mathbf{a}|^2 + 2|\mathbf{c}|^2$.
2. The diagonals are $\mathbf{a} + \mathbf{c}$ and $\mathbf{a} - \mathbf{c}$. Expanding:
$$|\mathbf{a} + \mathbf{c}|^2 = |\mathbf{a}|^2 + 2\,\mathbf{a}\cdot\mathbf{c} + |\mathbf{c}|^2, \qquad |\mathbf{a} - \mathbf{c}|^2 = |\mathbf{a}|^2 - 2\,\mathbf{a}\cdot\mathbf{c} + |\mathbf{c}|^2.$$
3. Adding, the $\mathbf{a}\cdot\mathbf{c}$ terms cancel, leaving $2|\mathbf{a}|^2 + 2|\mathbf{c}|^2$.
4. This equals the sum of the squares of the four sides, as required.

## Watch out
- Define every vector you use, and state what is given (such as $|\mathbf{a}| = |\mathbf{c}|$) before you use it.
- Two vectors being parallel isn't enough to make them equal: they also need the same length and direction.
- End with a sentence that answers the original geometric claim.
