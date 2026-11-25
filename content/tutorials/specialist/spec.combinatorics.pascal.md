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
Write $\binom{9}{4} + \binom{9}{5}$ as a single combination and evaluate it.

1. These are neighbors in row 9 ($r = 4$ and $r + 1 = 5$).
2. By Pascal's rule, the sum is the entry below them in row 10, at position 5: $\binom{10}{5}$.
3. $\binom{10}{5} = \dfrac{10!}{5!\,5!} = 252$.

### Example 2
Find $n$ if $\binom{n}{4} = \binom{n}{6}$ and $n \ge 6$.

1. Two different positions in the same row have equal values, so they are mirror images.
2. Mirror positions $r$ and $n - r$ add to $n$, so $4 + 6 = n$ and $n = 10$.

### Example 3
Show that $\binom{3}{3} + \binom{4}{3} + \binom{5}{3} = \binom{6}{4}$.

1. Both $\binom{3}{3}$ and $\binom{4}{4}$ equal 1, so replace the first term with $\binom{4}{4}$.
2. Pascal's rule on row 4: $\binom{4}{4} + \binom{4}{3} = \binom{5}{4}$.
3. Pascal's rule on row 5: $\binom{5}{4} + \binom{5}{3} = \binom{6}{4}$.
4. Check with numbers: $1 + 4 + 10 = 15 = \binom{6}{4}$. ✓

## Watch out
- Rows and positions are counted from 0, not 1.
- Pascal's rule adds neighboring entries in the same row; the result is in the next row.
