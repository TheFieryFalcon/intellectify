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
A committee of 4 is formed from 7 women and 5 men. How many committees have exactly 2 women?

1. The committee then has 2 women and 2 men.
2. Groups of 2 women from 7: $\binom{7}{2} = 21$. Groups of 2 men from 5: $\binom{5}{2} = 10$.
3. Any women's pair can go with any men's pair: $21 \times 10 = 210$.

### Example 2
For the same group, how many committees contain at least one man?

1. The complement of "at least one man" is "no men", i.e. all women.
2. All committees of 4 from 12 people: $\binom{12}{4} = 495$.
3. All-women committees: $\binom{7}{4} = 35$.
4. Subtract: $495 - 35 = 460$.

### Example 3
How many solutions does $x + y + z = 10$ have, where $x$, $y$ and $z$ are whole numbers ($\ge 0$)?

1. Think of 10 identical units shared among $x$, $y$ and $z$.
2. Write 10 dots and 2 dividers in a row, 12 symbols in all. For example, ••|•••••|••• means $x = 2$, $y = 5$, $z = 3$.
3. Each solution matches one row, decided by where the 2 dividers sit among the 12 places: $\binom{12}{2} = 66$.

## Watch out
- Don't multiply by $r!$ unless the selected objects are then put in order.
- "At least one" is usually easiest as total minus none.
- Adding cases such as "2 women" and "3 women" is fine. Don't also count them as overlapping.
