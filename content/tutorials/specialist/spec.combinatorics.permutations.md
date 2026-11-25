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

## Method

1. Check whether the objects are all different or some are identical.
2. Deal with each restriction first: blocks for "together", gaps or the complement for "apart", and fixed places for "begins with" or "ends with".
3. Arrange what's left and multiply the stages together.
4. Divide by the factorials of any groups of identical objects.

## Worked examples

### Example 1
In how many ways can 7 different books be placed on a shelf if the 3 math books must stay together?

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

1. Set the two F's aside. The other 4 letters are C, O, E, E, with E twice. They can be arranged in $\dfrac{4!}{2!} = 12$ ways.
2. In any such row, there are 5 gaps: 3 between neighboring letters and 1 at each end.
3. Putting the F's in different gaps keeps them apart. The F's are identical, so an arrangement is decided by which 2 of the 5 gaps hold an F: $\binom{5}{2} = 10$ sets of gaps.
4. Total: $12 \times 10 = 120$.

## Watch out
- After taping objects into a block, multiply by the orders inside the block.
- Divide only for objects that really are identical.
- Rotations count as the same only in a circle, not in a row.
