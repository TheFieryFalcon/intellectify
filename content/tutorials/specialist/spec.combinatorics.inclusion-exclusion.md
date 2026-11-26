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

```diagram
view: [-3.4, 3.4, -2.2, 2.2]
width: 290
alt: "Two overlapping sets A and B; the overlap is counted in both"
points: {  }
draw:
  - { type: polygon, points: [[-3.2, -2], [3.2, -2], [3.2, 2], [-3.2, 2]] }
  - { type: circle, center: [-0.8, 0], radius: 1.5 }
  - { type: circle, center: [0.8, 0], radius: 1.5 }
  - { type: text, at: [-2.1, 1.45], text: 'A', pos: c }
  - { type: text, at: [2.1, 1.45], text: 'B', pos: c }
  - { type: text, at: [-1.45, 0], text: '\text{in } A', pos: c }
  - { type: text, at: [0, 0], text: 'A \cap B', pos: c }
  - { type: text, at: [1.45, 0], text: '\text{in } B', pos: c }
```

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
In a group of 50 people, 28 own a dog, 20 own a cat and 9 own both. How many own neither?

```diagram
view: [-3.4, 3.4, -2.2, 2.2]
width: 290
alt: "Dogs only 19, both 9, cats only 11, of 50 people; neither is unknown"
points: {  }
draw:
  - { type: polygon, points: [[-3.2, -2], [3.2, -2], [3.2, 2], [-3.2, 2]] }
  - { type: circle, center: [-0.8, 0], radius: 1.5 }
  - { type: circle, center: [0.8, 0], radius: 1.5 }
  - { type: text, at: [-2.1, 1.45], text: 'D', pos: c }
  - { type: text, at: [2.1, 1.45], text: 'C', pos: c }
  - { type: text, at: [-1.45, 0], text: '19', pos: c }
  - { type: text, at: [0, 0], text: '9', pos: c }
  - { type: text, at: [1.45, 0], text: '11', pos: c }
  - { type: text, at: [2.6, -1.6], text: '?', pos: c }
  - { type: text, at: [-2.6, -1.6], text: '\text{of } 50', pos: c }
```

1. Let $D$ be the dog owners and $C$ the cat owners.
2. $|D \cup C| = 28 + 20 - 9 = 39$ people own at least one.
3. The rest own neither: $50 - 39 = 11$.

### Example 2
How many integers from 1 to 600 are divisible by 4, 5 or 6?

1. Single sets: $\lfloor 600/4 \rfloor = 150$, $\lfloor 600/5 \rfloor = 120$ and $\lfloor 600/6 \rfloor = 100$, for a sum of 370.
2. Pairs use lowest common multiples. Divisible by 4 and 5 means divisible by 20: 30. By 4 and 6 means by 12 (not 24): 50. By 5 and 6 means by 30: 20. The sum is 100.
3. All three means divisible by 60: 10.
4. Combine: $370 - 100 + 10 = 280$.

### Example 3
In a survey of 50 people, 20 like tea, 25 like coffee and 15 like juice. 8 like tea and coffee, 5 like tea and juice, 6 like coffee and juice, and 3 like all three. How many like only coffee?

```diagram
view: [-3.6, 3.6, -3.1, 2.7]
width: 300
alt: "Three-set Venn diagram: 3 in all three, 5 in tea and coffee only, 3 in coffee and juice only; only coffee unknown"
points: {  }
draw:
  - { type: polygon, points: [[-3.4, -2.9], [3.4, -2.9], [3.4, 2.5], [-3.4, 2.5]] }
  - { type: circle, center: [-0.9, 0.5], radius: 1.6 }
  - { type: circle, center: [0.9, 0.5], radius: 1.6 }
  - { type: circle, center: [0, -1], radius: 1.6 }
  - { type: text, at: [-2.55, 1.95], text: 'T\ (20)', pos: c }
  - { type: text, at: [2.5, 1.95], text: 'C\ (25)', pos: c }
  - { type: text, at: [-1.75, -2.55], text: 'J\ (15)', pos: c }
  - { type: text, at: [0, 0], text: '3', pos: c }
  - { type: text, at: [0, 1.05], text: '5', pos: c }
  - { type: text, at: [0.85, -0.6], text: '3', pos: c }
  - { type: text, at: [1.4, 0.95], text: '?', pos: c }
```

1. Fill the Venn diagram from the middle: 3 are in all three regions.
2. Coffee and tea but not juice: $8 - 3 = 5$. Coffee and juice but not tea: $6 - 3 = 3$.
3. Only coffee: $25 - 5 - 3 - 3 = 14$.

## Watch out
- Overlaps for divisibility use the lowest common multiple (e.g. 4 and 6 overlap at multiples of 12, not 24).
- Read whether the question asks for "at least one", "exactly one", "only" or "none".
