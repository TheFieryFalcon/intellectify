---
skill: spec.vectors-2d.geometric
status: draft
terms:
  - term: vector
    definition: A quantity with both a size (magnitude) and a direction, such as a displacement or a velocity. Drawn as an arrow; written in bold, a, or as AB with an arrow over it.
  - term: scalar
    definition: A quantity with size only, such as a distance, speed or mass. Also means an ordinary number that multiplies a vector.
  - term: magnitude
    definition: The length (size) of a vector, written |a|.
  - term: displacement
    definition: A change of position, described by a distance and a direction.
  - term: resultant
    definition: The single vector equal to the sum of two or more vectors.
  - term: true bearing
    definition: A direction given as the angle measured clockwise from north, written with three digits, e.g. 060°T.
---
## Key ideas

**Vectors and scalars.** Some quantities need only a size: a distance of 5 km, a speed of 60 km/h, a mass of 2 kg. These are **scalars**. Others also need a direction: walking 5 km *north* ends somewhere different from walking 5 km *east*. These are **vectors**. A **displacement** (change of position) and a velocity (speed in a given direction) are both vectors.

**Drawing and naming.** A vector is drawn as an arrow. Its length shows its size, and the arrowhead shows its direction. The vector from point $A$ to point $B$ is written $\overrightarrow{AB}$. A vector can also be named by one bold letter, $\mathbf{a}$; by hand, write $\underset{\sim}{a}$ (a letter with a squiggle under it).

**Magnitude and direction.** The **magnitude** of $\mathbf{a}$, written $|\mathbf{a}|$, is its length. Directions are given in one of two ways:
- as a **true bearing**: the angle measured clockwise from north, written with three digits (east is $090^\circ\text{T}$, south-west is $225^\circ\text{T}$);
- as an angle from the positive $x$-direction, measured anticlockwise.

**Equal and opposite vectors.** Two vectors are equal when they have the same magnitude and the same direction, even if they are drawn in different places. A vector doesn't remember where it starts. $-\mathbf{a}$ has the same magnitude as $\mathbf{a}$ but points the opposite way. Going from $B$ back to $A$ undoes going from $A$ to $B$, so $\overrightarrow{BA} = -\overrightarrow{AB}$.

**Scalar multiples.** $3\mathbf{a}$ is three copies of $\mathbf{a}$ placed end to end: it points the same way and is 3 times as long. In general $k\mathbf{a}$ is parallel to $\mathbf{a}$ with magnitude $|k|\,|\mathbf{a}|$. If $k > 0$ it points the same way as $\mathbf{a}$; if $k < 0$ it points the opposite way.

**Adding: the triangle rule.** Walking from $A$ to $B$ and then from $B$ to $C$ has the same overall effect as walking straight from $A$ to $C$. So
$$\overrightarrow{AB} + \overrightarrow{BC} = \overrightarrow{AC}.$$
To add two vectors, draw the second one starting at the head (arrowhead) of the first. The sum runs from the tail of the first to the head of the second. The sum of vectors is called their **resultant**.

**Adding: the parallelogram rule.** Draw $\mathbf{a}$ and $\mathbf{b}$ from the same starting point, then complete the parallelogram. The diagonal from that shared point is $\mathbf{a} + \mathbf{b}$. This gives the same answer as the triangle rule, because the opposite sides of a parallelogram are equal vectors.

**Subtracting.** $\mathbf{a} - \mathbf{b}$ means $\mathbf{a} + (-\mathbf{b})$. With $\mathbf{a}$ and $\mathbf{b}$ drawn from the same point, $\mathbf{a} - \mathbf{b}$ runs from the head of $\mathbf{b}$ to the head of $\mathbf{a}$. A useful case: for any point $O$, $\overrightarrow{AB} = \overrightarrow{AO} + \overrightarrow{OB} = \overrightarrow{OB} - \overrightarrow{OA}$.

## Method

1. Draw a sketch, and mark the vectors you know.
2. To write a vector in terms of known ones, find a path from its start to its end along known vectors. Add each vector you travel along, and subtract any you travel against.
3. To find a magnitude and direction, draw the vector triangle (head to tail). Use Pythagoras if it has a right angle, otherwise the cosine rule. Then find the angle with trigonometry or the sine rule.

## Worked examples

### Example 1
In parallelogram $OABC$, $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OC} = \mathbf{c}$. $M$ is the midpoint of $AB$. Find $\overrightarrow{CM}$ in terms of $\mathbf{a}$ and $\mathbf{c}$.

1. Opposite sides of a parallelogram are equal and parallel, so $\overrightarrow{AB} = \overrightarrow{OC} = \mathbf{c}$. Then $\overrightarrow{AM} = \tfrac{1}{2}\mathbf{c}$.
2. Travel $C \to O \to A \to M$. From $C$ to $O$ goes against $\mathbf{c}$, so it is $-\mathbf{c}$.
3. $\overrightarrow{CM} = -\mathbf{c} + \mathbf{a} + \tfrac{1}{2}\mathbf{c} = \mathbf{a} - \tfrac{1}{2}\mathbf{c}$.

### Example 2
A hiker walks 3 km east, then 4 km north. Find the hiker's resultant displacement.

1. Head to tail, the two legs form a right-angled triangle.
2. Distance: $\sqrt{3^2 + 4^2} = 5$ km.
3. Direction: the angle at the start, measured from north towards east, is $\theta$ with $\tan\theta = \tfrac{3}{4}$, so $\theta \approx 36.9^\circ$.
4. The displacement is 5 km on a bearing of about $037^\circ\text{T}$.

### Example 3
$|\mathbf{a}| = 5$, $|\mathbf{b}| = 8$ and the angle between $\mathbf{a}$ and $\mathbf{b}$ is $60^\circ$. Find $|\mathbf{a} + \mathbf{b}|$.

1. The angle between two vectors is measured with them drawn from the same point.
2. Redraw them head to tail. The angle inside the triangle, between the two sides, is now $180^\circ - 60^\circ = 120^\circ$.
3. Cosine rule: $|\mathbf{a} + \mathbf{b}|^2 = 5^2 + 8^2 - 2(5)(8)\cos 120^\circ = 25 + 64 + 40 = 129$.
4. So $|\mathbf{a} + \mathbf{b}| = \sqrt{129} \approx 11.4$.

## Watch out
- The angle between two vectors is measured with both drawn from the same point. In a head-to-tail triangle, use $180^\circ$ minus that angle.
- $|\mathbf{a} + \mathbf{b}|$ is usually less than $|\mathbf{a}| + |\mathbf{b}|$. The two are equal only when $\mathbf{a}$ and $\mathbf{b}$ point the same way.
- $\overrightarrow{AB}$ and $\overrightarrow{BA}$ are different vectors: they point in opposite directions.
