---
skill: spec.vectors-2d.applications
status: draft
terms:
  - term: equilibrium
    definition: When the forces on an object add to the zero vector, so the object stays still or moves at constant velocity.
  - term: relative velocity
    definition: The velocity of A as seen by B, written ᴬv_B = v_A − v_B.
  - term: ground velocity
    definition: The actual velocity over the ground (or seabed) of a plane or boat, equal to its own velocity through the air or water plus the wind or current velocity.
---
## Key ideas

Displacements, velocities and forces all have a size and a direction, so they add as vectors. Most applied problems come down to adding vectors correctly and then reading off what the question asks for.

**Forces.** When several forces act on an object, their combined effect is their vector sum, the resultant force. An object is in **equilibrium** when the resultant is the zero vector $\mathbf{0}$. It then stays still, or keeps moving at a constant velocity. If all but one of the forces are known, the missing force is minus the sum of the others.

**Navigation with wind or current.** A plane flies through the air, and the air itself moves (wind). Similarly a boat moves through water, and the water moves (current). The craft's actual motion over the ground, its **ground velocity**, is the sum
$$\mathbf{v}_{\text{ground}} = \mathbf{v}_{\text{through air or water}} + \mathbf{v}_{\text{wind or current}}.$$
The *heading* is the direction the craft points. Its *track* is the direction it actually travels, which is the direction of the ground velocity.

**Relative velocity.** Two moving objects look different from each other than from the ground. The velocity of $A$ relative to $B$ is how $A$ appears to move to someone traveling with $B$:
$${}^{A}\mathbf{v}_{B} = \mathbf{v}_A - \mathbf{v}_B.$$
For example, a car at 100 km/h east, seen from a car at 80 km/h east, appears to move at 20 km/h east.

**Position over time.** An object starting at position vector $\mathbf{r}_0$ and moving with constant velocity $\mathbf{v}$ is at
$$\mathbf{r} = \mathbf{r}_0 + t\mathbf{v}$$
after time $t$. Two objects collide only if their position vectors are equal at the same time. Both components must agree for one value of $t$.

**Bearings to components.** Take $\mathbf{i}$ as east and $\mathbf{j}$ as north. A vector of magnitude $r$ on a true bearing $\beta$ (clockwise from north) has an east component $r\sin\beta$ and a north component $r\cos\beta$:
$$r\sin\beta\,\mathbf{i} + r\cos\beta\,\mathbf{j}.$$
Sine goes with east here because the angle is measured from north, not from east.

```diagram
view: [-0.6, 3.6, -0.6, 3.4]
width: 200
points: { O: [0, 0], N: [0, 3], P: [2.6, 1.5], E: [2.6, 0] }
alt: "A vector on bearing beta: east part r sin beta, north part r cos beta"
draw:
  - { type: segment, from: O, to: N, dashed: true, color: muted }
  - { type: text, at: N, text: '\text{N}', pos: n }
  - { type: segment, from: O, to: E, dashed: true, color: muted, label: 'r\sin\beta', side: right }
  - { type: segment, from: E, to: P, dashed: true, color: muted, label: 'r\cos\beta', side: right }
  - { type: vector, from: O, to: P, label: 'r' }
  - { type: angle, at: O, from: N, to: P, label: '\beta', radius: 22 }
```

**Work done by a force.** A constant force $\mathbf{F}$ that moves an object through a displacement $\mathbf{s}$ does work $\mathbf{F}\cdot\mathbf{s}$. Only the part of the force along the motion does any work.

## Method

1. Draw a diagram. Label each known vector with its magnitude and direction.
2. Choose an approach. Either write each vector in components ($\mathbf{i}$ east, $\mathbf{j}$ north) and add, or draw a vector triangle and use the sine and cosine rules.
3. Write the vector equation the situation gives (a sum, an equilibrium, or equal positions), and solve it.
4. Convert the answer to the form asked for, such as a speed and bearing, or a time.

## Worked examples

### Example 1
Forces $\mathbf{F}_1 = 3\mathbf{i} + 5\mathbf{j}$ N and $\mathbf{F}_2 = -7\mathbf{i} + 2\mathbf{j}$ N act on a particle. Find the third force $\mathbf{F}_3$ that keeps the particle in equilibrium.

1. Equilibrium means $\mathbf{F}_1 + \mathbf{F}_2 + \mathbf{F}_3 = \mathbf{0}$.
2. $\mathbf{F}_1 + \mathbf{F}_2 = -4\mathbf{i} + 7\mathbf{j}$.
3. So $\mathbf{F}_3 = -(-4\mathbf{i} + 7\mathbf{j}) = 4\mathbf{i} - 7\mathbf{j}$ N.

### Example 2
A boat heads due north at 12 km/h through water that flows east at 5 km/h. Find the boat's speed over the seabed and its bearing.

1. Through the water: $12\mathbf{j}$. Current: $5\mathbf{i}$.

```diagram
view: [-1.5, 6.5, -0.6, 12.8]
width: 150
points: { O: [0, 0], W: [0, 12], G: [5, 12] }
alt: "Velocity triangle: 12 north through the water plus 5 east current gives 13 over the seabed"
draw:
  - { type: vector, from: O, to: W, label: '12', side: left }
  - { type: vector, from: W, to: G, label: '5', color: muted }
  - { type: vector, from: O, to: G, label: '13', color: ink, side: right }
  - { type: angle, at: O, from: W, to: G, label: '\theta', radius: 30 }
```
2. Ground velocity: $5\mathbf{i} + 12\mathbf{j}$, so the speed is $\sqrt{5^2 + 12^2} = 13$ km/h.
3. The angle east of north satisfies $\tan\theta = \tfrac{5}{12}$, so $\theta \approx 22.6^\circ$. The boat travels on a bearing of about $022.6^\circ\text{T}$.

### Example 3
At noon, ship $A$ is at $3\mathbf{i} + 4\mathbf{j}$ km with velocity $2\mathbf{i} + \mathbf{j}$ km/h, and ship $B$ is at $9\mathbf{i} + 2\mathbf{j}$ km with velocity $-\mathbf{i} + 2\mathbf{j}$ km/h. Will they collide?

1. After $t$ hours: $\mathbf{r}_A = (3 + 2t)\mathbf{i} + (4 + t)\mathbf{j}$ and $\mathbf{r}_B = (9 - t)\mathbf{i} + (2 + 2t)\mathbf{j}$.
2. The $\mathbf{i}$-components are equal when $3 + 2t = 9 - t$, so $t = 2$.
3. At $t = 2$ the $\mathbf{j}$-components are $4 + 2 = 6$ and $2 + 4 = 6$, which are also equal.
4. So they collide at 2 pm, at position $7\mathbf{i} + 6\mathbf{j}$ km.

## Watch out
- Bearings are measured clockwise from north, so east goes with $\sin\beta$ and north goes with $\cos\beta$.
- A collision needs both components to match at the same time. Matching at different times means the paths cross, but the ships don't meet.
- "Velocity of $A$ relative to $B$" is $\mathbf{v}_A - \mathbf{v}_B$, in that order.
