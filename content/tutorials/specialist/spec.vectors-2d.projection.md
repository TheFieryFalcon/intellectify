---
skill: spec.vectors-2d.projection
status: draft
terms:
  - term: scalar projection
    definition: The signed length of the "shadow" of a on the line of b, equal to a · b̂ = (a · b)/|b|. Negative if the angle between them is obtuse.
  - term: vector projection
    definition: The part of a that points along b, equal to ((a · b)/|b|²) b.
---
## Key ideas

**The picture.** Draw $\mathbf{a}$ and $\mathbf{b}$ from the same point, and imagine the line through $\mathbf{b}$ as the ground. Shine a light from directly above that line, so the light rays meet it at right angles. The shadow that $\mathbf{a}$ casts on the line is the *projection of $\mathbf{a}$ onto $\mathbf{b}$*. It measures how far $\mathbf{a}$ reaches in the direction of $\mathbf{b}$.

**Scalar projection.** The signed length of the shadow. From the right-angled triangle, this length is $|\mathbf{a}|\cos\theta$, where $\theta$ is the angle between the vectors. Using the scalar product,
$$\text{scalar projection of } \mathbf{a} \text{ onto } \mathbf{b} = |\mathbf{a}|\cos\theta = \frac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|} = \mathbf{a}\cdot\hat{\mathbf{b}}.$$
If the angle is obtuse, the shadow falls behind the starting point, pointing opposite to $\mathbf{b}$, and the scalar projection is negative.

**Vector projection.** The shadow as a vector. It lies along $\mathbf{b}$, so it is the scalar projection times the unit vector $\hat{\mathbf{b}} = \mathbf{b}/|\mathbf{b}|$:
$$\text{vector projection of } \mathbf{a} \text{ onto } \mathbf{b} = \left(\frac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|}\right)\frac{\mathbf{b}}{|\mathbf{b}|} = \left(\frac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|^2}\right)\mathbf{b}.$$
The second form avoids square roots, since $|\mathbf{b}|^2 = \mathbf{b}\cdot\mathbf{b}$.

**Splitting a vector into two parts.** The shadow and the light ray together rebuild $\mathbf{a}$. So $\mathbf{a}$ can be written as a part parallel to $\mathbf{b}$ plus a part perpendicular to $\mathbf{b}$:
$$\mathbf{a} = \underbrace{\left(\tfrac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|^2}\right)\mathbf{b}}_{\text{parallel to } \mathbf{b}} + \underbrace{\mathbf{a} - \left(\tfrac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|^2}\right)\mathbf{b}}_{\text{perpendicular to } \mathbf{b}}.$$
The perpendicular part is the light ray. Its length is the shortest distance from the tip of $\mathbf{a}$ to the line through $\mathbf{b}$. In forces, this is how a force is split into a part along a slope and a part pushing into it.

## Method

1. Identify which vector is projected and which it is projected onto. In "the projection of $\mathbf{a}$ onto $\mathbf{b}$", divide by $\mathbf{b}$'s magnitude.
2. Compute $\mathbf{a}\cdot\mathbf{b}$ and $|\mathbf{b}|$ (or $|\mathbf{b}|^2$).
3. Scalar projection: divide $\mathbf{a}\cdot\mathbf{b}$ by $|\mathbf{b}|$. Vector projection: divide by $|\mathbf{b}|^2$, then multiply by $\mathbf{b}$.
4. For the perpendicular part, subtract the vector projection from $\mathbf{a}$. Check that its dot product with $\mathbf{b}$ is 0.

## Worked examples

### Example 1
Find the scalar and vector projections of $\mathbf{a} = 4\mathbf{i} + 2\mathbf{j}$ onto $\mathbf{b} = 3\mathbf{i} + 4\mathbf{j}$.

1. $\mathbf{a}\cdot\mathbf{b} = 12 + 8 = 20$, and $|\mathbf{b}| = 5$, so $|\mathbf{b}|^2 = 25$.
2. Scalar projection: $\tfrac{20}{5} = 4$.
3. Vector projection: $\tfrac{20}{25}(3\mathbf{i} + 4\mathbf{j}) = \tfrac{12}{5}\mathbf{i} + \tfrac{16}{5}\mathbf{j}$.
4. Check: this vector has length $\tfrac{4}{5} \times 5 = 4$, matching the scalar projection. ✓

### Example 2
For the same vectors, write $\mathbf{a}$ as the sum of a vector parallel to $\mathbf{b}$ and a vector perpendicular to $\mathbf{b}$.

1. The parallel part is the vector projection, $\tfrac{12}{5}\mathbf{i} + \tfrac{16}{5}\mathbf{j}$.
2. The perpendicular part is what's left: $(4\mathbf{i} + 2\mathbf{j}) - (\tfrac{12}{5}\mathbf{i} + \tfrac{16}{5}\mathbf{j}) = \tfrac{8}{5}\mathbf{i} - \tfrac{6}{5}\mathbf{j}$.
3. Check: $(\tfrac{8}{5})(3) + (-\tfrac{6}{5})(4) = \tfrac{24}{5} - \tfrac{24}{5} = 0$. ✓
4. So $\mathbf{a} = \left(\tfrac{12}{5}\mathbf{i} + \tfrac{16}{5}\mathbf{j}\right) + \left(\tfrac{8}{5}\mathbf{i} - \tfrac{6}{5}\mathbf{j}\right)$.

### Example 3
Find the shortest distance from the point $P(7, 1)$ to the line through the origin in the direction of $\mathbf{b} = \mathbf{i} + \mathbf{j}$.

1. $P$ has position vector $\mathbf{p} = 7\mathbf{i} + \mathbf{j}$. The shortest distance is the length of the part of $\mathbf{p}$ perpendicular to $\mathbf{b}$.
2. $\mathbf{p}\cdot\mathbf{b} = 8$ and $|\mathbf{b}|^2 = 2$, so the vector projection is $4(\mathbf{i} + \mathbf{j}) = 4\mathbf{i} + 4\mathbf{j}$.
3. Perpendicular part: $(7\mathbf{i} + \mathbf{j}) - (4\mathbf{i} + 4\mathbf{j}) = 3\mathbf{i} - 3\mathbf{j}$.
4. Its length is $\sqrt{9 + 9} = 3\sqrt{2}$.

## Watch out
- The projection of $\mathbf{a}$ onto $\mathbf{b}$ divides by $|\mathbf{b}|$, not $|\mathbf{a}|$.
- The scalar projection divides by $|\mathbf{b}|$; the vector projection divides by $|\mathbf{b}|^2$.
- A negative scalar projection is not an error: it means the angle is obtuse.
