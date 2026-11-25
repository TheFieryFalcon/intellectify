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
2. The diagonals are $\overrightarrow{OB} = \mathbf{a} + \mathbf{c}$ and $\overrightarrow{CA} = \mathbf{a} - \mathbf{c}$.
3. Their dot product is $(\mathbf{a} + \mathbf{c})\cdot(\mathbf{a} - \mathbf{c}) = \mathbf{a}\cdot\mathbf{a} - \mathbf{a}\cdot\mathbf{c} + \mathbf{c}\cdot\mathbf{a} - \mathbf{c}\cdot\mathbf{c} = |\mathbf{a}|^2 - |\mathbf{c}|^2$.
4. Since $|\mathbf{a}| = |\mathbf{c}|$, this is 0. So the diagonals of a rhombus are perpendicular.

### Example 2
Prove that joining the midpoints of the sides of any **quadrilateral** $ABCD$, in order, gives a parallelogram.

1. Let the corners have position vectors $\mathbf{a}, \mathbf{b}, \mathbf{c}, \mathbf{d}$. Let $P, Q, R, S$ be the midpoints of $AB, BC, CD, DA$.
2. Then $\mathbf{p} = \tfrac{1}{2}(\mathbf{a} + \mathbf{b})$, $\mathbf{q} = \tfrac{1}{2}(\mathbf{b} + \mathbf{c})$, $\mathbf{r} = \tfrac{1}{2}(\mathbf{c} + \mathbf{d})$ and $\mathbf{s} = \tfrac{1}{2}(\mathbf{d} + \mathbf{a})$.
3. $\overrightarrow{PQ} = \mathbf{q} - \mathbf{p} = \tfrac{1}{2}(\mathbf{c} - \mathbf{a})$, and $\overrightarrow{SR} = \mathbf{r} - \mathbf{s} = \tfrac{1}{2}(\mathbf{c} - \mathbf{a})$.
4. So $\overrightarrow{PQ} = \overrightarrow{SR}$: sides $PQ$ and $SR$ are equal in length and parallel. A quadrilateral with one pair of opposite sides equal and parallel is a parallelogram, so $PQRS$ is a parallelogram.

### Example 3
Prove that in any parallelogram, the sum of the squares of the two diagonals equals the sum of the squares of the four sides.

1. Use parallelogram $OABC$ with sides $\mathbf{a}$ and $\mathbf{c}$. The four sides have lengths $|\mathbf{a}|, |\mathbf{c}|, |\mathbf{a}|, |\mathbf{c}|$, so the sum of their squares is $2|\mathbf{a}|^2 + 2|\mathbf{c}|^2$.
2. The diagonals are $\mathbf{a} + \mathbf{c}$ and $\mathbf{a} - \mathbf{c}$. Expanding:
$$|\mathbf{a} + \mathbf{c}|^2 = |\mathbf{a}|^2 + 2\,\mathbf{a}\cdot\mathbf{c} + |\mathbf{c}|^2, \qquad |\mathbf{a} - \mathbf{c}|^2 = |\mathbf{a}|^2 - 2\,\mathbf{a}\cdot\mathbf{c} + |\mathbf{c}|^2.$$
3. Adding, the $\mathbf{a}\cdot\mathbf{c}$ terms cancel, leaving $2|\mathbf{a}|^2 + 2|\mathbf{c}|^2$.
4. This equals the sum of the squares of the four sides, as required.

## Watch out
- Define every vector you use, and state what is given (such as $|\mathbf{a}| = |\mathbf{c}|$) before you use it.
- Two vectors being parallel isn't enough to make them equal: they also need the same length and direction.
- End with a sentence that answers the original geometric claim.
