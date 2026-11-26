---
skill: spec.combinatorics.pascal
status: draft
terms:
  - term: Pascal's triangle
    definition: A triangle of numbers where row n lists nC0, nC1, …, nCn. Each entry is the sum of the two entries above it.
  - term: identity
    definition: An equation that is true for every allowed value of its variables, not just some.
---
## Key ideas

**Pascal's triangle** arranges the values of $\binom{n}{r}$. Row $n$ (counting from row 0) lists $\binom{n}{0}, \binom{n}{1}, \dots, \binom{n}{n}$:

| Row | Entries |
|---|---|
| 0 | 1 |
| 1 | 1 1 |
| 2 | 1 2 1 |
| 3 | 1 3 3 1 |
| 4 | 1 4 6 4 1 |
| 5 | 1 5 10 10 5 1 |

```diagram
view: [-3.6, 3.6, -5.2, 0.4]
width: 300
alt: "Pascal's triangle, rows 0 to 6; 10 + 10 in row 5 make 20 in row 6"
points: {  }
draw:
  - { type: text, at: [0, 0], text: '1', pos: c }
  - { type: text, at: [-0.5, -0.8], text: '1', pos: c }
  - { type: text, at: [0.5, -0.8], text: '1', pos: c }
  - { type: text, at: [-1, -1.6], text: '1', pos: c }
  - { type: text, at: [0, -1.6], text: '2', pos: c }
  - { type: text, at: [1, -1.6], text: '1', pos: c }
  - { type: text, at: [-1.5, -2.4], text: '1', pos: c }
  - { type: text, at: [-0.5, -2.4], text: '3', pos: c }
  - { type: text, at: [0.5, -2.4], text: '3', pos: c }
  - { type: text, at: [1.5, -2.4], text: '1', pos: c }
  - { type: text, at: [-2, -3.2], text: '1', pos: c }
  - { type: text, at: [-1, -3.2], text: '4', pos: c }
  - { type: text, at: [0, -3.2], text: '6', pos: c }
  - { type: text, at: [1, -3.2], text: '4', pos: c }
  - { type: text, at: [2, -3.2], text: '1', pos: c }
  - { type: text, at: [-2.5, -4], text: '1', pos: c }
  - { type: text, at: [-1.5, -4], text: '5', pos: c }
  - { type: text, at: [-0.5, -4], text: '10', pos: c }
  - { type: text, at: [0.5, -4], text: '10', pos: c }
  - { type: text, at: [1.5, -4], text: '5', pos: c }
  - { type: text, at: [2.5, -4], text: '1', pos: c }
  - { type: text, at: [-3, -4.8], text: '1', pos: c }
  - { type: text, at: [-2, -4.8], text: '6', pos: c }
  - { type: text, at: [-1, -4.8], text: '15', pos: c }
  - { type: text, at: [0, -4.8], text: '20', pos: c }
  - { type: text, at: [1, -4.8], text: '15', pos: c }
  - { type: text, at: [2, -4.8], text: '6', pos: c }
  - { type: text, at: [3, -4.8], text: '1', pos: c }
  - { type: vector, from: [-0.4, -4.2], to: [-0.12, -4.58], color: accent }
  - { type: vector, from: [0.4, -4.2], to: [0.12, -4.58], color: accent }
```

Each row starts and ends with 1, and every other entry is the sum of the two entries above it. The patterns in the triangle are **identities**: equations true for every allowed $n$ and $r$.

**Symmetry:** $\binom{n}{r} = \binom{n}{n-r}$. Each row reads the same forwards and backwards. Reason: taking a group of $r$ objects out of $n$ leaves a group of $n - r$ behind. Matching each group taken with the group left behind pairs them up exactly, so there are equally many of each.

**Pascal's rule:** $\binom{n}{r} + \binom{n}{r+1} = \binom{n+1}{r+1}$. Reason: $\binom{n+1}{r+1}$ counts the groups of $r + 1$ from $n + 1$ objects. Pick out one particular object, $X$. A group either contains $X$ or it doesn't.
- If it contains $X$, its other $r$ members come from the remaining $n$ objects, so there are $\binom{n}{r}$ such groups.
- If it doesn't, all $r + 1$ members come from the remaining $n$, so there are $\binom{n}{r+1}$ such groups.

Adding the two cases gives the rule. This is why each entry is the sum of the two above it.

**Row sums:** $\binom{n}{0} + \binom{n}{1} + \cdots + \binom{n}{n} = 2^n$. Both sides count the subsets of a set of $n$ objects. On the left, they are sorted by size. On the right, each object is either in or out, giving $2 \times 2 \times \cdots \times 2 = 2^n$.

A **counting argument** proves an identity by showing that both sides count the same collection in two different ways, as in the reasons above.

## Method

1. To combine two neighboring entries from the same row, use Pascal's rule: the result is in the next row, under the larger $r$.
2. To solve $\binom{n}{a} = \binom{n}{b}$ with $a \ne b$, use symmetry: $a + b = n$.
3. To prove an identity, either describe one collection and count it two ways, or apply Pascal's rule repeatedly.

## Worked examples

### Example 1
Write $\binom{7}{2} + \binom{7}{3}$ as a single combination and evaluate it.

```diagram
view: [-2.2, 2.2, -1.5, 0.6]
width: 240
alt: "Neighbors 21 and 35 in row 7 add to 56, below them in row 8"
points: {  }
draw:
  - { type: text, at: [-1, 0], text: '\tbinom{7}{2} = 21', pos: c }
  - { type: text, at: [1, 0], text: '\tbinom{7}{3} = 35', pos: c }
  - { type: text, at: [0, -1.2], text: '\tbinom{8}{3} = 56', pos: c }
  - { type: vector, from: [-0.75, -0.3], to: [-0.2, -0.85], color: accent }
  - { type: vector, from: [0.75, -0.3], to: [0.2, -0.85], color: accent }
```

1. These are neighbors in row 7 ($r = 2$ and $r + 1 = 3$).
2. By Pascal's rule, the sum is the entry below them in row 8, at position 3: $\binom{8}{3}$.
3. $\binom{8}{3} = \dfrac{8!}{3!\,5!} = 56$.

### Example 2
Find $n$ if $\binom{n}{3} = \binom{n}{5}$ and $n \ge 5$.

1. Two different positions in the same row have equal values, so they are mirror images.
2. Mirror positions $r$ and $n - r$ add to $n$, so $3 + 5 = n$ and $n = 8$.

### Example 3
Show that $\binom{2}{2} + \binom{3}{2} + \binom{4}{2} = \binom{5}{3}$.

1. Both $\binom{2}{2}$ and $\binom{3}{3}$ equal 1, so replace the first term with $\binom{3}{3}$.
2. Pascal's rule on row 3: $\binom{3}{3} + \binom{3}{2} = \binom{4}{3}$.
3. Pascal's rule on row 4: $\binom{4}{3} + \binom{4}{2} = \binom{5}{3}$.
4. Check with numbers: $1 + 3 + 6 = 10 = \binom{5}{3}$. ✓

## Watch out
- Rows and positions are counted from 0, not 1.
- Pascal's rule adds neighboring entries in the same row; the result is in the next row.
