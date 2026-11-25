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
Dot point 1.2.5. Builds on [counting principles](/specialist/learn/spec.combinatorics.counting-principles).

## Key ideas

$|A|$ means the number of elements in $A$.

**Two sets.** Adding $|A| + |B|$ counts the overlap twice, so subtract it once:

$$|A \cup B| = |A| + |B| - |A \cap B|.$$

**Three sets.** Add the singles, subtract the pairs, add back the triple:

$$|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|.$$

An element in exactly one set is counted once. An element in two sets is counted $2 - 1 = 1$ time. An element in all three is counted $3 - 3 + 1 = 1$ time. So every element is counted exactly once.

**"Neither" or "none of".** Count the union, then subtract from the total.

## Method

1. Name the sets clearly (e.g. $A$ = divisible by 3).
2. Find each set's size, then each overlap. For divisibility: numbers up to $N$ divisible by $d$ number $\lfloor N/d \rfloor$, where $\lfloor x \rfloor$ means $x$ rounded down to a whole number. Numbers divisible by both 3 and 5 are those divisible by 15.
3. Apply the formula. Subtract from the total if the question asks for "none".
4. A Venn diagram helps when the question gives "only" or "exactly" counts.

## Worked examples

### Example 1
In a class of 30, 18 play soccer, 12 play netball and 5 play both. How many play neither?

$|S \cup N| = 18 + 12 - 5 = 25$, so $30 - 25 = 5$ play neither.

### Example 2
How many integers from 1 to 1000 are divisible by 3, 5 or 7?

The singles are $333 + 200 + 142 = 675$. The pairs (divisible by 15, 21, 35) are $66 + 47 + 28 = 141$. The triple (divisible by 105) is $9$. So the answer is $675 - 141 + 9 = 543$.

## Watch out
- Overlaps for divisibility use the lowest common multiple (e.g. 4 and 6 overlap at multiples of 12, not 24).
- Read whether the question wants "at least one", "exactly one" or "none".
