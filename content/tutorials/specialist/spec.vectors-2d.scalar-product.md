---
skill: spec.vectors-2d.scalar-product
status: draft
terms:
  - term: scalar product
    definition: Also called the dot product. a · b = |a||b|cos θ, where θ is the angle between a and b. In components, (a₁, a₂) · (b₁, b₂) = a₁b₁ + a₂b₂. The result is a number, not a vector.
  - term: perpendicular
    definition: At right angles (90°) to each other.
---
## Key ideas

**Definition.** The **scalar product** (or dot product) of $\mathbf{a}$ and $\mathbf{b}$ is
$$\mathbf{a}\cdot\mathbf{b} = |\mathbf{a}|\,|\mathbf{b}|\cos\theta,$$
where $\theta$ is the angle between $\mathbf{a}$ and $\mathbf{b}$ drawn from the same point, with $0^\circ \le \theta \le 180^\circ$. The result is a number, not a vector, which is why it is called the *scalar* product. It measures how much two vectors point the same way.

**In components.** For $\mathbf{a} = a_1\mathbf{i} + a_2\mathbf{j}$ and $\mathbf{b} = b_1\mathbf{i} + b_2\mathbf{j}$,
$$\mathbf{a}\cdot\mathbf{b} = a_1b_1 + a_2b_2.$$
This follows from the definition. $\mathbf{i}$ and $\mathbf{j}$ have length 1, and the angle between them is $90^\circ$, so $\mathbf{i}\cdot\mathbf{i} = \mathbf{j}\cdot\mathbf{j} = 1$ and $\mathbf{i}\cdot\mathbf{j} = 0$. Expanding $(a_1\mathbf{i} + a_2\mathbf{j})\cdot(b_1\mathbf{i} + b_2\mathbf{j})$ like brackets leaves only $a_1b_1 + a_2b_2$.

**Finding an angle.** Rearranging the definition:
$$\cos\theta = \frac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{a}|\,|\mathbf{b}|}.$$

**Properties.**
- Order doesn't matter: $\mathbf{a}\cdot\mathbf{b} = \mathbf{b}\cdot\mathbf{a}$.
- It expands like brackets: $\mathbf{a}\cdot(\mathbf{b} + \mathbf{c}) = \mathbf{a}\cdot\mathbf{b} + \mathbf{a}\cdot\mathbf{c}$, and $(k\mathbf{a})\cdot\mathbf{b} = k(\mathbf{a}\cdot\mathbf{b})$.
- A vector dotted with itself gives its length squared: $\mathbf{a}\cdot\mathbf{a} = |\mathbf{a}|^2$, since the angle is $0^\circ$.

**What the sign tells you.** For non-zero vectors, $\cos\theta$ has the same sign as $\mathbf{a}\cdot\mathbf{b}$:
- positive: the angle is acute (less than $90^\circ$);
- zero: the vectors are **perpendicular** (at $90^\circ$);
- negative: the angle is obtuse (more than $90^\circ$).

**Perpendicular and parallel tests.** For non-zero vectors:
- perpendicular exactly when $\mathbf{a}\cdot\mathbf{b} = 0$;
- parallel exactly when $\mathbf{b} = k\mathbf{a}$ for some number $k$. Then $\theta$ is $0^\circ$ or $180^\circ$, so $\mathbf{a}\cdot\mathbf{b} = \pm|\mathbf{a}|\,|\mathbf{b}|$.

Swapping the components of $a\mathbf{i} + b\mathbf{j}$ and changing one sign gives $-b\mathbf{i} + a\mathbf{j}$, which is perpendicular to it: the dot product is $-ab + ba = 0$.

## Method

1. For an angle, find $\mathbf{a}\cdot\mathbf{b}$, $|\mathbf{a}|$ and $|\mathbf{b}|$, then use the cosine formula.
2. For an unknown that makes vectors perpendicular, set the dot product equal to 0 and solve.
3. For expressions such as $|\mathbf{a} - \mathbf{b}|$ when only lengths and a dot product are known, square it, write it as a dot product, expand like brackets, and replace $\mathbf{a}\cdot\mathbf{a}$ with $|\mathbf{a}|^2$.

## Worked examples

### Example 1
Find the angle between $\mathbf{a} = \mathbf{i} + 2\mathbf{j}$ and $\mathbf{b} = 3\mathbf{i} - \mathbf{j}$, to one decimal place.

1. $\mathbf{a}\cdot\mathbf{b} = (1)(3) + (2)(-1) = 1$.
2. $|\mathbf{a}| = \sqrt{1 + 4} = \sqrt{5}$ and $|\mathbf{b}| = \sqrt{9 + 1} = \sqrt{10}$.
3. $\cos\theta = \dfrac{1}{\sqrt{5}\sqrt{10}} = \dfrac{1}{\sqrt{50}}$, so $\theta \approx 81.9^\circ$.

### Example 2
Find $k$ so that $k\mathbf{i} + 3\mathbf{j}$ and $2\mathbf{i} + (k - 5)\mathbf{j}$ are perpendicular.

1. Perpendicular means the dot product is 0: $2k + 3(k - 5) = 0$.
2. Simplify: $5k - 15 = 0$, so $k = 3$.
3. Check: the vectors are $3\mathbf{i} + 3\mathbf{j}$ and $2\mathbf{i} - 2\mathbf{j}$, with dot product $6 - 6 = 0$. ✓

### Example 3
$|\mathbf{a}| = 3$, $|\mathbf{b}| = 4$ and $\mathbf{a}\cdot\mathbf{b} = 2$. Find $|\mathbf{a} - \mathbf{b}|$.

1. Write the squared length as a dot product: $|\mathbf{a} - \mathbf{b}|^2 = (\mathbf{a} - \mathbf{b})\cdot(\mathbf{a} - \mathbf{b})$.
2. Expand: $\mathbf{a}\cdot\mathbf{a} - 2\,\mathbf{a}\cdot\mathbf{b} + \mathbf{b}\cdot\mathbf{b} = 9 - 4 + 16 = 21$.
3. So $|\mathbf{a} - \mathbf{b}| = \sqrt{21}$.

## Watch out
- Use the angle between the vectors drawn from the same point, not head to tail.
- $\mathbf{a}\cdot\mathbf{b}$ is a number. You can't divide by a vector, and $\mathbf{a}\cdot\mathbf{b} = \mathbf{a}\cdot\mathbf{c}$ doesn't mean $\mathbf{b} = \mathbf{c}$.
- $\mathbf{a}\cdot\mathbf{a}$ is $|\mathbf{a}|^2$, not $|\mathbf{a}|$.
