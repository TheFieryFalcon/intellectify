---
skill: spec.vectors-2d.components
status: draft
terms:
  - term: unit vector
    definition: A vector of magnitude 1. The unit vector in the direction of a is written â and equals a divided by |a|.
  - term: component form
    definition: A vector written as its horizontal and vertical parts, e.g. 3i − 2j, the ordered pair (3, −2), or a column vector.
  - term: position vector
    definition: The vector from the origin O to a point. Point A(2, 5) has position vector 2i + 5j.
---
## Key ideas

**The unit vectors i and j.** A **unit vector** has magnitude 1. In the plane, $\mathbf{i}$ is the unit vector pointing in the positive $x$-direction, and $\mathbf{j}$ is the unit vector pointing in the positive $y$-direction.

**Component form.** Any vector in the plane can be reached by moving some distance across and some distance up (or down). Moving 3 across and 2 down is $3\mathbf{i} - 2\mathbf{j}$. The same vector can be written in three ways:
$$3\mathbf{i} - 2\mathbf{j} = (3, -2) = \begin{pmatrix} 3 \\ -2 \end{pmatrix}.$$
The numbers 3 and $-2$ are the vector's $x$- and $y$-components.

```diagram
view: [-0.6, 4, -2.8, 1.4]
width: 230
grid: true
axes: true
alt: "The vector 3i − 2j is 3 across and 2 down"
draw:
  - { type: segment, from: [0, 0], to: [3, 0], color: muted, label: '3', side: left }
  - { type: segment, from: [3, 0], to: [3, -2], dashed: true, color: muted, label: '-2', side: left }
  - { type: vector, from: [0, 0], to: [3, -2], label: '3\mathbf{i} - 2\mathbf{j}', side: right }
```

**Working in components.** Moves across and moves up can be combined separately, so each operation works one component at a time. With $\mathbf{a} = a_1\mathbf{i} + a_2\mathbf{j}$ and $\mathbf{b} = b_1\mathbf{i} + b_2\mathbf{j}$:
- addition and subtraction: $\mathbf{a} \pm \mathbf{b} = (a_1 \pm b_1)\mathbf{i} + (a_2 \pm b_2)\mathbf{j}$;
- scalar multiple: $k\mathbf{a} = ka_1\mathbf{i} + ka_2\mathbf{j}$;
- magnitude: the components are the two short sides of a right-angled triangle, so by Pythagoras $|\mathbf{a}| = \sqrt{a_1^2 + a_2^2}$.

**Unit vector in a given direction.** Dividing a vector by its own magnitude keeps its direction and shrinks its length to 1:
$$\hat{\mathbf{a}} = \frac{\mathbf{a}}{|\mathbf{a}|}.$$
A vector of length $L$ in the direction of $\mathbf{a}$ is then $L\hat{\mathbf{a}}$.

**Position vectors.** The **position vector** of a point $A$ is $\overrightarrow{OA}$, the vector from the origin $O$ to $A$. Its components are $A$'s coordinates: $A(2, 5)$ has position vector $2\mathbf{i} + 5\mathbf{j}$. The vector between two points is "end minus start":
$$\overrightarrow{AB} = \overrightarrow{OB} - \overrightarrow{OA}.$$

**Between magnitude–angle and components.** A vector of magnitude $r$ at angle $\theta$ anticlockwise from the positive $x$-direction has components $r\cos\theta$ and $r\sin\theta$:
$$r\cos\theta\,\mathbf{i} + r\sin\theta\,\mathbf{j}.$$
Going the other way, $r = |\mathbf{a}|$ and $\tan\theta = \dfrac{a_2}{a_1}$. A calculator's $\tan^{-1}$ only returns angles between $-90^\circ$ and $90^\circ$, so use a sketch to put the angle in the right quadrant.

**Parallel vectors.** Two vectors are parallel when one is a scalar multiple of the other: $\mathbf{b} = k\mathbf{a}$. In components, both components are multiplied by the same $k$.

## Method

1. Write every vector in components.
2. Add, subtract and scale one component at a time.
3. For the vector between two points, subtract the starting point's position vector from the ending point's.
4. For a magnitude, use Pythagoras. For an angle, sketch the vector first so you know its quadrant.

## Worked examples

### Example 1
$A$ is the point $(2, -1)$ and $B$ is $(5, 3)$. Find $\overrightarrow{AB}$ and $|\overrightarrow{AB}|$.

1. End minus start: $\overrightarrow{AB} = (5 - 2)\mathbf{i} + (3 - (-1))\mathbf{j} = 3\mathbf{i} + 4\mathbf{j}$.

```diagram
view: [-0.5, 6, -1.6, 3.6]
width: 240
grid: true
axes: true
points: { A: [2, -1], B: [5, 3] }
alt: "AB goes 3 across and 4 up from A to B"
draw:
  - { type: segment, from: A, to: [5, -1], dashed: true, color: muted, label: '3', side: right }
  - { type: segment, from: [5, -1], to: B, dashed: true, color: muted, label: '4', side: right }
  - { type: vector, from: A, to: B, label: '\overrightarrow{AB}' }
  - { type: point, at: A, label: 'A(2, -1)', pos: w }
  - { type: point, at: B, label: 'B(5, 3)', pos: w, dot: false }
```
2. Magnitude: $|\overrightarrow{AB}| = \sqrt{3^2 + 4^2} = 5$.

### Example 2
Find the vector of magnitude 10 in the direction of $\mathbf{a} = 5\mathbf{i} - 12\mathbf{j}$.

1. $|\mathbf{a}| = \sqrt{25 + 144} = 13$.
2. The unit vector is $\hat{\mathbf{a}} = \tfrac{1}{13}(5\mathbf{i} - 12\mathbf{j})$.
3. Multiply by 10: $\tfrac{10}{13}(5\mathbf{i} - 12\mathbf{j}) = \tfrac{50}{13}\mathbf{i} - \tfrac{120}{13}\mathbf{j}$.

### Example 3
Find $m$ so that $\begin{pmatrix} 4 \\ m \end{pmatrix}$ is parallel to $\begin{pmatrix} 6 \\ -9 \end{pmatrix}$.

1. Parallel means $\begin{pmatrix} 4 \\ m \end{pmatrix} = k\begin{pmatrix} 6 \\ -9 \end{pmatrix}$ for some number $k$.
2. The $x$-components give $4 = 6k$, so $k = \tfrac{2}{3}$.
3. The $y$-components give $m = -9k = -6$.

## Watch out
- $\overrightarrow{AB}$ is $B$'s position vector minus $A$'s, not the other way round.
- Check the quadrant before trusting $\tan^{-1}$: $-\mathbf{i} - \mathbf{j}$ points at $225^\circ$, not $45^\circ$.
- A unit vector must have magnitude exactly 1. Check by finding its magnitude.
