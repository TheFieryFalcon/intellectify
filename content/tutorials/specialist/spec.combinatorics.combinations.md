---
skill: spec.combinatorics.combinations
status: draft
terms:
  - term: combination
    definition: An unordered selection of objects. ⁿCᵣ, also written as n choose r, is the number of ways to choose r of n different objects when order doesn't matter.
---
## Key ideas

A **combination** is a selection where order doesn't matter: a team, a hand of cards, a committee. The team {Ana, Ben, Cy} is the same team in any order.

**The formula.** Compare a selection with an arrangement. Each group of $r$ objects can be put in order in $r!$ ways, so every group corresponds to $r!$ arrangements. That means

$$^{n}P_{r} = r! \times \binom{n}{r}, \quad\text{so}\quad \binom{n}{r} = {}^{n}C_{r} = \frac{n!}{r!\,(n-r)!}.$$

For example, there are $^{5}P_{2} = 20$ ordered pairs from 5 people, and each unordered pair appears twice, so $\binom{5}{2} = 10$.

**Useful values.**
- $\binom{n}{0} = \binom{n}{n} = 1$: there is one empty group, and one group containing everything.
- $\binom{n}{1} = n$: a group of one is just a single object.
- $\binom{n}{r} = \binom{n}{n-r}$: every group of $r$ that is taken leaves behind a group of $n - r$, and each leftover group matches exactly one taken group. So the two counts are equal.

**Selecting from separate groups.** A committee with 2 women and 3 men is built in two stages: the women, then the men. By the multiplication principle, the count is $\binom{w}{2}\binom{m}{3}$, where $w$ and $m$ are the numbers of women and men available.

**Sharing identical objects.** To share $n$ identical objects among $k$ people (some may get none), lay the objects in a row with $k - 1$ dividers. Person 1 gets everything before the first divider, person 2 everything between the first and second, and so on. Every sharing matches exactly one row of $n + k - 1$ symbols with $k - 1$ dividers in it, so the count is $\binom{n+k-1}{k-1}$.

## Method

1. Does order matter? If swapping two selected items gives the same outcome, use combinations; otherwise use permutations.
2. For "exactly" conditions, split the objects into groups and multiply the counts for each group.
3. For "at least" or "at most", either add the separate cases or subtract the unwanted cases from the total.
4. For "these two can't both be in it", subtract the selections that include both.

## Worked examples

### Example 1
A team of 5 is formed from 6 juniors and 8 seniors. How many teams have exactly 3 seniors?

1. The team then has 3 seniors and 2 juniors.
2. Groups of 3 seniors from 8: $\binom{8}{3} = 56$. Groups of 2 juniors from 6: $\binom{6}{2} = 15$.
3. Any group of seniors can go with any group of juniors: $56 \times 15 = 840$.

### Example 2
For the same players, how many teams of 5 contain at least one junior?

```diagram
view: [-0.2, 6.2, -0.6, 3.2]
width: 320
alt: "All 2002 teams: the all-senior ones (56) and the rest, which have at least one junior"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [6, 0], [6, 3], [0, 3]] }
  - { type: polygon, points: [[4.6, 0], [6, 0], [6, 3], [4.6, 3]], color: accent, fill: true }
  - { type: text, at: [2.3, 1.75], text: '\text{at least one junior}', pos: c }
  - { type: text, at: [2.3, 1.15], text: '?', pos: c }
  - { type: text, at: [5.3, 1.75], text: '\text{all}', pos: c }
  - { type: text, at: [5.3, 1.35], text: '\text{seniors}', pos: c }
  - { type: text, at: [5.3, 0.8], text: '56', pos: c }
  - { type: text, at: [3, 3.05], text: '\tbinom{14}{5} = 2002', pos: n }
```

1. The complement of "at least one junior" is "no juniors", i.e. all seniors.
2. All teams of 5 from 14 players: $\binom{14}{5} = 2002$.
3. All-senior teams: $\binom{8}{5} = 56$.
4. Subtract: $2002 - 56 = 1946$.

### Example 3
In how many ways can 6 identical apples be shared among 3 children, if some children may get none?

```diagram
view: [-0.6, 6.2, -1.4, 0.9]
width: 300
alt: "6 apples and 2 dividers: 2, 1 and 3 apples"
points: {  }
draw:
  - { type: point, at: [0, 0], label: ' ', pos: c }
  - { type: point, at: [0.8, 0], label: ' ', pos: c }
  - { type: segment, from: [1.6, -0.5], to: [1.6, 0.5], color: accent }
  - { type: point, at: [2.4, 0], label: ' ', pos: c }
  - { type: segment, from: [3.2, -0.5], to: [3.2, 0.5], color: accent }
  - { type: point, at: [4, 0], label: ' ', pos: c }
  - { type: point, at: [4.8, 0], label: ' ', pos: c }
  - { type: point, at: [5.6, 0], label: ' ', pos: c }
  - { type: text, at: [0.4, -1], text: '\text{2 apples}', pos: c }
  - { type: text, at: [2.4, -1], text: '\text{1 apple}', pos: c }
  - { type: text, at: [4.8, -1], text: '\text{3 apples}', pos: c }
```

1. Write 6 dots (apples) and 2 dividers in a row, 8 symbols in all. For example, ••|•|••• means the children get 2, 1 and 3 apples.
2. Each sharing matches exactly one row, decided by where the 2 dividers sit among the 8 places.
3. So there are $\binom{8}{2} = 28$ ways.

## Watch out
- Don't multiply by $r!$ unless the selected objects are then put in order.
- "At least one" is usually easiest as total minus none.
- Adding cases such as "2 women" and "3 women" is fine. Don't also count them as overlapping.
