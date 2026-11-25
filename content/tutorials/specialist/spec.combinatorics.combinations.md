---
skill: spec.combinatorics.combinations
status: draft
terms:
  - term: combination
    definition: An unordered selection of objects. ⁿCᵣ, also written as n choose r, is the number of ways to choose r of n different objects when order doesn't matter.
---
Dot points 1.2.7 and 1.2.8. Builds on [permutations](/specialist/learn/spec.combinatorics.permutations).

## Key ideas

**Combinations** count *selections*, where order doesn't matter:

$$\binom{n}{r} = {}^{n}C_{r} = \frac{n!}{r!\,(n-r)!}.$$

Each selection of $r$ objects can be put in order in $r!$ ways, so $^{n}P_{r} = r! \times \binom{n}{r}$.

Useful facts: $\binom{n}{0} = \binom{n}{n} = 1$, $\binom{n}{1} = n$, and $\binom{n}{r} = \binom{n}{n-r}$ (choosing which $r$ to take is the same as choosing which $n - r$ to leave).

**Selecting from groups.** To choose some from group A *and* some from group B, multiply: $\binom{a}{i}\binom{b}{j}$.

**Sharing identical objects.** To share $n$ identical objects among $k$ people (some may get none), lay the objects in a row and place $k - 1$ dividers among them. That's $\binom{n+k-1}{k-1}$ ways.

## Method

1. Does order matter? If not, use combinations; if it does, use permutations.
2. Split "exactly" conditions into groups, and multiply the choices for each group.
3. For "at least" and "at most", either add the separate cases or subtract the unwanted cases from the total.
4. For "these two can't both be chosen", subtract the selections that include both.

## Worked examples

### Example 1
A committee of 4 is chosen from 7 women and 5 men. How many committees have exactly 2 women?

Choose the women and the men separately: $\binom{7}{2}\binom{5}{2} = 21 \times 10 = 210$.

### Example 2
For the same group, how many committees contain at least one man?

All committees minus those with no men: $\binom{12}{4} - \binom{7}{4} = 495 - 35 = 460$.

### Example 3
How many solutions does $x + y + z = 10$ have, where $x, y, z$ are whole numbers ($\ge 0$)?

This shares 10 identical units among 3 variables: place 2 dividers among 10 objects, giving $\binom{12}{2} = 66$.

## Watch out
- Don't multiply by $r!$ unless the chosen objects are then arranged.
- "At least one" is usually easiest as total minus none.
