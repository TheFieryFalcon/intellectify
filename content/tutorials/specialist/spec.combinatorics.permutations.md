---
skill: spec.combinatorics.permutations
status: draft
terms:
  - term: arrangement with repeated objects
    definition: An ordering of objects where some are identical; swapping identical objects doesn't make a new arrangement.
  - term: circular arrangement
    definition: An arrangement around a circle where only the positions relative to each other matter, so rotations count as the same.
---
## Key ideas

**Different objects in a row.** $n$ different objects can be lined up in $n!$ ways: $n$ options for the first place, $n - 1$ for the next, and so on.

**Repeated objects.** Suppose some objects are identical, as with the letters of BOOK. Label the identical ones to tell them apart: B, O₁, O₂, K. These have $4! = 24$ orderings. Each real arrangement, such as BOOK, appears $2!$ times among them (O₁O₂ and O₂O₁) and these look the same once the labels are removed. So there are $24 \div 2 = 12$ arrangements. In general, if $n$ objects include identical groups of sizes $a, b, c, \dots$, the number of arrangements is

$$\frac{n!}{a!\,b!\,c!\cdots}.$$

**Restrictions.**
- *Must be together.* Tape the objects into one block. Arrange the block along with everything else, then multiply by the number of orders inside the block.
- *Must not be together.* Either subtract the "together" arrangements from the total, or use gaps. With gaps, arrange the other objects first. Each space between them, plus the two ends, is a gap, and putting at most one of the separated objects in each gap keeps them apart.
- *Fixed positions* ("starts with a vowel"). Fill the restricted places first, then arrange the rest.

**Circular arrangements.** Around a round table, turning everyone one seat to the left gives the same seating, since each person has the same neighbors. Seat one person anywhere as a reference point. The other $n - 1$ people then fill seats that are distinct relative to that person, giving $(n-1)!$ arrangements.

```diagram
view: [-2, 6.6, -1.9, 1.9]
width: 330
alt: "Five people around a table, then everyone moved one seat: the same arrangement"
points: {  }
draw:
  - { type: circle, center: [0, 0], radius: 1.2, color: muted }
  - { type: point, at: [0, 1.2], label: 'A', pos: n }
  - { type: point, at: [-1.141, 0.371], label: 'B', pos: n }
  - { type: point, at: [-0.705, -0.971], label: 'C', pos: s }
  - { type: point, at: [0.705, -0.971], label: 'D', pos: s }
  - { type: point, at: [1.141, 0.371], label: 'E', pos: n }
  - { type: circle, center: [4.6, 0], radius: 1.2, color: muted }
  - { type: point, at: [3.459, 0.371], label: 'A', pos: n }
  - { type: point, at: [3.895, -0.971], label: 'B', pos: s }
  - { type: point, at: [5.305, -0.971], label: 'C', pos: s }
  - { type: point, at: [5.741, 0.371], label: 'D', pos: n }
  - { type: point, at: [4.6, 1.2], label: 'E', pos: n }
  - { type: text, at: [2.3, 0], text: '=', pos: c }
```

## Method

1. Check whether the objects are all different or some are identical.
2. Deal with each restriction first: blocks for "together", gaps or the complement for "apart", and fixed places for "begins with" or "ends with".
3. Arrange what's left and multiply the stages together.
4. Divide by the factorials of any groups of identical objects.

## Worked examples

### Example 1
In how many ways can 7 different books be placed on a shelf if the 3 math books must stay together?

```diagram
view: [-0.3, 7.5, -0.9, 1.9]
width: 360
alt: "The 3 math books taped into one block, plus 4 other books: 5 items in a row"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [1, 0], [1, 1], [0, 1]] }
  - { type: text, at: [0.5, 0.5], text: '\text{B}', pos: c }
  - { type: polygon, points: [[1.3, 0], [2.9, 0], [2.9, 1], [1.3, 1]] }
  - { type: text, at: [2.1, 0.5], text: '\text{M M M}', pos: c }
  - { type: polygon, points: [[1.2, -0.1], [3, -0.1], [3, 1.1], [1.2, 1.1]], color: accent }
  - { type: text, at: [2.1, -0.45], text: '3! \text{ inside}', pos: c }
  - { type: polygon, points: [[3.2, 0], [4.2, 0], [4.2, 1], [3.2, 1]] }
  - { type: text, at: [3.7, 0.5], text: '\text{B}', pos: c }
  - { type: polygon, points: [[4.5, 0], [5.5, 0], [5.5, 1], [4.5, 1]] }
  - { type: text, at: [5, 0.5], text: '\text{B}', pos: c }
  - { type: polygon, points: [[5.8, 0], [6.8, 0], [6.8, 1], [5.8, 1]] }
  - { type: text, at: [6.3, 0.5], text: '\text{B}', pos: c }
  - { type: text, at: [3.6, 1.55], text: '5 \text{ items: } 5!', pos: c }
```

1. Tape the 3 math books together as a single block. There are now 5 items: the block and the 4 other books.
2. Five items can be lined up in $5! = 120$ ways.
3. Inside the block, the math books can be in $3! = 6$ orders.
4. Total: $120 \times 6 = 720$.

### Example 2
How many arrangements of the letters of SEASIDE are there?

1. Count the letters: S, E, A, S, I, D, E. That's 7 letters, with S appearing twice and E twice.
2. If every letter were different, there would be $7!$ orderings.
3. Swapping the two S's, or the two E's, doesn't change the word, so divide by $2!$ twice:
$$\frac{7!}{2!\,2!} = \frac{5040}{4} = 1260.$$

### Example 3
How many arrangements of the letters of COFFEE have the two F's apart?

```diagram
view: [0, 6.6, -1, 1.1]
width: 320
alt: "C, O, E, E in a row leave 5 gaps for the two F's"
points: {  }
draw:
  - { type: text, at: [1.2, 0.6], text: '\text{C}', pos: c }
  - { type: text, at: [2.4, 0.6], text: '\text{O}', pos: c }
  - { type: text, at: [3.6, 0.6], text: '\text{E}', pos: c }
  - { type: text, at: [4.8, 0.6], text: '\text{E}', pos: c }
  - { type: vector, from: [0.6, -0.4], to: [0.6, 0.15], color: accent }
  - { type: text, at: [0.6, -0.65], text: '\text{gap}', pos: c }
  - { type: vector, from: [1.8, -0.4], to: [1.8, 0.15], color: accent }
  - { type: text, at: [1.8, -0.65], text: '\text{gap}', pos: c }
  - { type: vector, from: [3, -0.4], to: [3, 0.15], color: accent }
  - { type: text, at: [3, -0.65], text: '\text{gap}', pos: c }
  - { type: vector, from: [4.2, -0.4], to: [4.2, 0.15], color: accent }
  - { type: text, at: [4.2, -0.65], text: '\text{gap}', pos: c }
  - { type: vector, from: [5.4, -0.4], to: [5.4, 0.15], color: accent }
  - { type: text, at: [5.4, -0.65], text: '\text{gap}', pos: c }
```

1. Set the two F's aside. The other 4 letters are C, O, E, E, with E twice. They can be arranged in $\dfrac{4!}{2!} = 12$ ways.
2. In any such row, there are 5 gaps: 3 between neighboring letters and 1 at each end.
3. Putting the F's in different gaps keeps them apart. The F's are identical, so an arrangement is decided by which 2 of the 5 gaps hold an F: $\binom{5}{2} = 10$ sets of gaps.
4. Total: $12 \times 10 = 120$.

## Watch out
- After taping objects into a block, multiply by the orders inside the block.
- Divide only for objects that really are identical.
- Rotations count as the same only in a circle, not in a row.
