---
skill: spec.combinatorics.pascal
status: draft
terms:
  - term: Pascal's triangle
    definition: A triangle of numbers where row n lists nC0, nC1, …, nCn. Each entry is the sum of the two entries above it.
  - term: identity
    definition: An equation that is true for every allowed value of its variables, not just some.
---
Dot point 1.2.9. Builds on [combinations](/specialist/learn/spec.combinatorics.combinations).

## Key ideas

Row $n$ of **Pascal's triangle** (starting from row 0) lists $\binom{n}{0}, \binom{n}{1}, \dots, \binom{n}{n}$:

| Row | Entries |
|---|---|
| 0 | 1 |
| 1 | 1 1 |
| 2 | 1 2 1 |
| 3 | 1 3 3 1 |
| 4 | 1 4 6 4 1 |

Identities you should be able to derive and use:

- **Symmetry:** $\binom{n}{r} = \binom{n}{n-r}$. Choosing $r$ to take is the same as choosing $n - r$ to leave.
- **Pascal's rule:** $\binom{n}{r} + \binom{n}{r+1} = \binom{n+1}{r+1}$. To choose $r + 1$ from $n + 1$ objects, either a particular object is chosen (choose $r$ more from the other $n$) or it isn't (choose all $r + 1$ from the other $n$).
- **Row sums:** $\binom{n}{0} + \binom{n}{1} + \dots + \binom{n}{n} = 2^n$, because both sides count all the subsets of an $n$-element set.

A **counting argument** proves an identity by showing that both sides count the same collection in two different ways.

## Method

1. To simplify a sum of two neighboring entries, use Pascal's rule.
2. To solve $\binom{n}{a} = \binom{n}{b}$ with $a \ne b$, use symmetry: $a + b = n$.
3. To prove an identity, either describe one collection counted two ways, or apply Pascal's rule repeatedly.

## Worked examples

### Example 1
Write $\binom{9}{4} + \binom{9}{5}$ as a single combination and evaluate it.

By Pascal's rule, it equals $\binom{10}{5} = 252$.

### Example 2
Find $n$ if $\binom{n}{4} = \binom{n}{6}$.

By symmetry, $4 + 6 = n$, so $n = 10$.

### Example 3
Show that $\binom{3}{3} + \binom{4}{3} + \binom{5}{3} = \binom{6}{4}$.

Replace $\binom{3}{3}$ with $\binom{4}{4}$ (both equal 1). Then $\binom{4}{4} + \binom{4}{3} = \binom{5}{4}$, and $\binom{5}{4} + \binom{5}{3} = \binom{6}{4}$ by Pascal's rule. Check: $1 + 4 + 10 = 15$. ✓

## Watch out
- Rows and positions start at 0, not 1.
- Pascal's rule adds *neighboring* entries in the *same* row.
