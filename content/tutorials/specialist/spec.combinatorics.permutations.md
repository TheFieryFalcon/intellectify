---
skill: spec.combinatorics.permutations
status: draft
terms:
  - term: arrangement with repeated objects
    definition: An ordering of objects where some are identical; swapping identical objects doesn't make a new arrangement.
  - term: circular arrangement
    definition: An arrangement around a circle where only the positions relative to each other matter, so rotations count as the same.
---
Dot points 1.2.1 and 1.2.4. Builds on [counting principles](/specialist/learn/spec.combinatorics.counting-principles).

## Key ideas

**$n$ different objects in a row** can be arranged in $n!$ ways.

**Repeated objects.** If $n$ objects include groups of identical ones of sizes $a, b, c, \dots$, the number of different arrangements is

$$\frac{n!}{a!\,b!\,c!\cdots}$$

because swapping identical objects among themselves gives the same arrangement.

**Restrictions.**
- *Must be together:* glue them into one block, arrange the blocks, then multiply by the ways to arrange inside the block.
- *Must not be together:* count all arrangements, minus those where they are together. Or arrange the other objects first and place the separated ones in the gaps.
- *Fixed positions:* fill restricted positions first.

**Around a circle**, only relative positions matter, so $n$ different objects can be arranged in $(n-1)!$ ways. Fix one object, then arrange the rest.

## Method

1. Check whether objects are all different or some are identical.
2. Deal with restrictions first: blocks for "together", gaps or the complement for "apart", restricted places for "begins with" or "ends with".
3. Arrange what's left and multiply.
4. Divide by the factorials of any repeated groups.

## Worked examples

### Example 1
In how many ways can 6 people stand in a row if two of them, Ann and Bo, must stand together?

Glue Ann and Bo into one block: there are now 5 things to arrange, which is $5! = 120$ ways. The pair can be Ann–Bo or Bo–Ann, giving $120 \times 2 = 240$.

### Example 2
How many arrangements of the letters of PARALLEL are there?

There are 8 letters, with A twice and L three times: $\dfrac{8!}{2!\,3!} = 3360$.

### Example 3
How many arrangements of MISSISSIPPI have no two S's next to each other?

Arrange the 7 letters that aren't S (M, I×4, P×2): $\dfrac{7!}{4!\,2!} = 105$ ways. This leaves 8 gaps (between letters and at both ends). Choose 4 gaps for the S's: $\binom{8}{4} = 70$. Total: $105 \times 70 = 7350$.

## Watch out
- After gluing a block, remember the arrangements *inside* the block.
- Divide by repeats only for objects that are genuinely identical.
