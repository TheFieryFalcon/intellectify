---
skill: spec.combinatorics.inclusion-exclusion
status: draft
terms:
  - term: union
    definition: A ∪ B is everything in A or B (or both).
  - term: intersection
    definition: A ∩ B is everything in both A and B.
  - term: complement
    definition: Everything in the whole collection that is not in the given set.
  - term: inclusion–exclusion principle
    definition: A way to count a union by adding the sizes of the sets, subtracting the overlaps of pairs, adding back the overlap of three, and so on.
---
## Key ideas

$|A|$ means the number of elements in set $A$. The **union** $A \cup B$ is everything in $A$ or $B$ (or both), and the **intersection** $A \cap B$ is everything in both.

**Two sets.** Adding $|A| + |B|$ counts every element of the overlap twice: once in $A$ and once in $B$. Subtracting the overlap once fixes this:

$$|A \cup B| = |A| + |B| - |A \cap B|.$$

**Three sets.** Add the three sets, subtract the three pairwise overlaps, then add back the overlap of all three:

$$|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|.$$

To see why the last term is needed, follow one element through the formula:
- In exactly one set: it is added once. Total 1.
- In exactly two sets: it is added twice and subtracted once (in one pair). Total 1.
- In all three sets: it is added three times, subtracted three times (in all three pairs), then added once. Total 1.

So every element in the union is counted exactly once. This is the **inclusion–exclusion principle**.

**"Neither" or "none of".** These describe the **complement** of the union: everything outside all the sets. Find the union, then subtract it from the total.

**Divisibility.** Among $1, 2, \dots, N$, the multiples of $d$ are $d, 2d, 3d, \dots$. There are $\lfloor N/d \rfloor$ of them, where $\lfloor x \rfloor$ means $x$ rounded down to a whole number. A number divisible by both 4 and 6 is divisible by their lowest common multiple, 12.

## Method

1. Name the sets clearly (e.g. $A$ = numbers divisible by 3).
2. Find the size of each set, then of each overlap.
3. Apply the formula. Subtract from the total if the question asks for "neither" or "none".
4. If the question gives "only" or "exactly" counts, draw a Venn diagram and fill it from the middle outwards.

## Worked examples

### Example 1
In a class of 30, 18 play soccer, 12 play netball and 5 play both. How many play neither?

1. Let $S$ be the soccer players and $N$ the netball players.
2. $|S \cup N| = 18 + 12 - 5 = 25$ students play at least one sport.
3. The rest play neither: $30 - 25 = 5$.

### Example 2
How many integers from 1 to 1000 are divisible by 3, 5 or 7?

1. Single sets: $\lfloor 1000/3 \rfloor = 333$, $\lfloor 1000/5 \rfloor = 200$ and $\lfloor 1000/7 \rfloor = 142$, for a sum of 675.
2. Pairs use the lowest common multiples 15, 21 and 35: $66 + 47 + 28 = 141$.
3. All three use 105: $\lfloor 1000/105 \rfloor = 9$.
4. Combine: $675 - 141 + 9 = 543$.

### Example 3
In a survey of 50 people, 20 like tea, 25 like coffee and 15 like juice. 8 like tea and coffee, 5 like tea and juice, 6 like coffee and juice, and 3 like all three. How many like only coffee?

1. Fill the Venn diagram from the middle: 3 are in all three regions.
2. Coffee and tea but not juice: $8 - 3 = 5$. Coffee and juice but not tea: $6 - 3 = 3$.
3. Only coffee: $25 - 5 - 3 - 3 = 14$.

## Watch out
- Overlaps for divisibility use the lowest common multiple (e.g. 4 and 6 overlap at multiples of 12, not 24).
- Read whether the question asks for "at least one", "exactly one", "only" or "none".
