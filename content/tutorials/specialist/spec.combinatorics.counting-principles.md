---
skill: spec.combinatorics.counting-principles
status: draft
terms:
  - term: multiplication principle
    definition: If one choice can be made in m ways and a second, independent choice in n ways, the two together can be made in m × n ways.
  - term: addition principle
    definition: If a choice is either one of m options or one of n different options (never both), there are m + n ways.
  - term: factorial
    definition: n! is the product of the whole numbers from 1 to n; 0! is defined as 1.
  - term: permutation
    definition: An ordered arrangement of objects. ⁿPᵣ is the number of ways to arrange r of n different objects in order.
---
Dot points 1.2.2 and 1.2.3.

## Key ideas

**Multiplication principle (AND).** If a task is done in stages, and stage 1 can be done in $m$ ways and stage 2 in $n$ ways *whatever happened in stage 1*, the whole task can be done in $m \times n$ ways. This extends to any number of stages.

**Addition principle (OR).** If a choice falls into one of several cases that never overlap, add the counts for each case.

**Factorial.** $n! = n \times (n-1) \times \dots \times 2 \times 1$, with $0! = 1$. It counts the ways to arrange $n$ different objects in a row.

**Permutations.** The number of ways to choose and arrange $r$ of $n$ different objects is

$$^{n}P_{r} = n(n-1)\cdots(n-r+1) = \frac{n!}{(n-r)!}.$$

## Method

1. Decide whether order matters. If it does, you are counting arrangements.
2. Break the task into stages and count the options at each stage, filling the most restricted positions first.
3. Multiply across stages (AND). Split into non-overlapping cases and add (OR).
4. If "at least one" appears, it is often easier to count the complement (everything, minus the cases with none) and subtract.

## Worked examples

### Example 1
A PIN has 4 digits, and digits may repeat. How many PINs are there?

Each of the 4 positions has 10 options, so there are $10^4 = 10\,000$ PINs.

### Example 2
How many 4-digit numbers have all different digits?

The first digit can't be 0, so it has 9 options. The second digit can be anything except the first: 9 options. Then 8, then 7. The total is $9 \times 9 \times 8 \times 7 = 4536$.

### Example 3
How many positive integers less than 1000 contain at least one digit 7?

Count the complement. Write each number from 0 to 999 with three digits (e.g. 042). Avoiding 7 in every place gives $9^3 = 729$ strings, including 000. So 728 of the numbers 1 to 999 have no 7, and $999 - 728 = 271$ do.

## Watch out
- A leading zero doesn't make a valid 4-digit number. Fill restricted positions first.
- Only add when the cases can't overlap; otherwise you count some outcomes twice.
