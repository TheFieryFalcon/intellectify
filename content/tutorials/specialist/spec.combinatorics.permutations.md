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
In how many ways can 6 people stand in a row if two of them, Ann and Bo, must stand together?

1. Tape Ann and Bo together as a single block. There are now 5 items: the block and the other 4 people.
2. Five items can be lined up in $5! = 120$ ways.
3. Inside the block, the order is Ann–Bo or Bo–Ann: 2 ways.
4. Total: $120 \times 2 = 240$.

### Example 2
How many arrangements of the letters of PARALLEL are there?

1. Count the letters: P, A, R, A, L, L, E, L. That's 8 letters, with A appearing twice and L three times.
2. If every letter were different, there would be $8!$ orderings.
3. Swapping the two A's, or rearranging the three L's, doesn't change the word, so divide by $2!$ and $3!$:
$$\frac{8!}{2!\,3!} = \frac{40\,320}{12} = 3360.$$

### Example 3
How many arrangements of MISSISSIPPI have no two S's next to each other?

1. Set the four S's aside. The other 7 letters are M, I, I, I, I, P, P, with 4 I's and 2 P's. They can be arranged in $\dfrac{7!}{4!\,2!} = 105$ ways.
2. In any such row, there are 8 gaps: 6 between neighboring letters and 1 at each end.
3. Putting each S in a different gap keeps all the S's apart. Since the S's are identical, an arrangement is decided by which 4 of the 8 gaps hold an S. There are $\binom{8}{4} = 70$ such sets of gaps.
4. Total: $105 \times 70 = 7350$.

## Watch out
- After taping objects into a block, multiply by the orders inside the block.
- Divide only for objects that really are identical.
- Rotations count as the same only in a circle, not in a row.
