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
## Key ideas

Counting questions ask "how many ways?" without listing every possibility. Two principles do most of the work.

**Multiplication principle (AND).** Suppose a task happens in stages: stage 1 can be done in $m$ ways, and stage 2 can be done in $n$ ways *no matter how stage 1 went*. Then the whole task can be done in $m \times n$ ways. Picture a tree diagram: each of the $m$ first branches splits into $n$ second branches, giving $m \times n$ ends. The idea extends to any number of stages. An outfit made of one of 4 shirts, one of 3 pairs of pants and one of 2 pairs of shoes can be put together in $4 \times 3 \times 2 = 24$ ways.

```diagram
view: [-0.4, 6, -3.1, 2.4]
width: 320
alt: "Tree diagram: 2 shirts, each followed by 3 pants, gives 6 outfits"
points: {  }
draw:
  - { type: point, at: [0, 0], label: ' ', pos: c }
  - { type: segment, from: [0, 0], to: [2, 1.3] }
  - { type: point, at: [2, 1.3], label: ' ', pos: c }
  - { type: text, at: [1.15, 1.72], text: '\text{shirt 1}', pos: c }
  - { type: segment, from: [2, 1.3], to: [4, 2] }
  - { type: point, at: [4, 2], label: '\text{pants 1}', pos: e }
  - { type: segment, from: [2, 1.3], to: [4, 1.3] }
  - { type: point, at: [4, 1.3], label: '\text{pants 2}', pos: e }
  - { type: segment, from: [2, 1.3], to: [4, 0.6] }
  - { type: point, at: [4, 0.6], label: '\text{pants 3}', pos: e }
  - { type: segment, from: [0, 0], to: [2, -1.3] }
  - { type: point, at: [2, -1.3], label: ' ', pos: c }
  - { type: text, at: [1.15, -1.72], text: '\text{shirt 2}', pos: c }
  - { type: segment, from: [2, -1.3], to: [4, -0.6] }
  - { type: point, at: [4, -0.6], label: '\text{pants 1}', pos: e }
  - { type: segment, from: [2, -1.3], to: [4, -1.3] }
  - { type: point, at: [4, -1.3], label: '\text{pants 2}', pos: e }
  - { type: segment, from: [2, -1.3], to: [4, -2] }
  - { type: point, at: [4, -2], label: '\text{pants 3}', pos: e }
  - { type: text, at: [1, -2.75], text: '2 \text{ ways}', pos: c }
  - { type: text, at: [3, -2.75], text: '\times\, 3 \text{ ways}', pos: c }
  - { type: text, at: [5.2, -2.75], text: '= 6', pos: c }
```

**Addition principle (OR).** Suppose every outcome belongs to exactly one of several cases, with no outcome in two cases. Then the total is the sum of the counts for each case. If a meal is one of 5 pasta dishes or one of 3 salads, there are $5 + 3 = 8$ options.

**Factorial.** Lining up $n$ different objects has $n$ options for the first place, $n - 1$ for the second, and so on down to 1. That product is written

$$n! = n \times (n-1) \times \cdots \times 2 \times 1.$$

We define $0! = 1$, which keeps the formulas below working when nothing is left to arrange.

**Permutations.** Filling $r$ ordered places from $n$ different objects (no repeats) gives $n$ options, then $n - 1$, down to $n - r + 1$:

$$^{n}P_{r} = n(n-1)\cdots(n-r+1) = \frac{n!}{(n-r)!}.$$

For example, a president, secretary and treasurer can be elected from 10 people in $^{10}P_{3} = 10 \times 9 \times 8 = 720$ ways. Different jobs make order matter: Ana as president with Ben as secretary differs from the reverse.

**Complements.** Sometimes the unwanted outcomes are easier to count. Then

$$\text{wanted} = \text{total} - \text{unwanted}.$$

This is especially useful for "at least one", whose complement is "none".

## Method

1. Decide whether order matters. Does swapping two items give a different outcome? If so, you are counting arrangements.
2. Split the task into stages, and count the options at each stage. Fill the most restricted positions first, such as a first digit that can't be 0.
3. Multiply across stages (AND). If outcomes fall into separate cases, count each case and add (OR).
4. For "at least one", count the outcomes with none and subtract from the total.
5. Sense-check the size of your answer, or list a small version of the problem by hand.

## Worked examples

### Example 1
A bike lock has 3 dials, and each dial shows one of the letters A to F. How many different codes are there?

```diagram
view: [-0.3, 6.9, -0.8, 1.3]
width: 420
alt: "Three dials with 6 options each: 6 x 6 x 6 = 216"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [1.2, 0], [1.2, 1], [0, 1]] }
  - { type: text, at: [0.6, 0.5], text: '6', pos: c }
  - { type: text, at: [0.6, -0.35], text: '\text{dial 1}', pos: c }
  - { type: text, at: [1.5, 0.5], text: '\times', pos: c }
  - { type: polygon, points: [[1.8, 0], [3, 0], [3, 1], [1.8, 1]] }
  - { type: text, at: [2.4, 0.5], text: '6', pos: c }
  - { type: text, at: [2.4, -0.35], text: '\text{dial 2}', pos: c }
  - { type: text, at: [3.3, 0.5], text: '\times', pos: c }
  - { type: polygon, points: [[3.6, 0], [4.8, 0], [4.8, 1], [3.6, 1]] }
  - { type: text, at: [4.2, 0.5], text: '6', pos: c }
  - { type: text, at: [4.2, -0.35], text: '\text{dial 3}', pos: c }
  - { type: text, at: [5.7, 0.5], text: '= 216', pos: c }
```

1. There are 3 stages, one per dial.
2. Each dial has 6 options, whatever the other dials show.
3. Multiply: $6 \times 6 \times 6 = 6^3 = 216$ codes.

### Example 2
How many 3-digit numbers have all different digits?

```diagram
view: [-0.3, 6.9, -0.8, 1.3]
width: 420
alt: "First digit 9 options (not 0), then 9, then 8"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [1.2, 0], [1.2, 1], [0, 1]] }
  - { type: text, at: [0.6, 0.5], text: '9', pos: c }
  - { type: text, at: [0.6, -0.35], text: '\text{hundreds}', pos: c }
  - { type: text, at: [1.5, 0.5], text: '\times', pos: c }
  - { type: polygon, points: [[1.8, 0], [3, 0], [3, 1], [1.8, 1]] }
  - { type: text, at: [2.4, 0.5], text: '9', pos: c }
  - { type: text, at: [2.4, -0.35], text: '\text{tens}', pos: c }
  - { type: text, at: [3.3, 0.5], text: '\times', pos: c }
  - { type: polygon, points: [[3.6, 0], [4.8, 0], [4.8, 1], [3.6, 1]] }
  - { type: text, at: [4.2, 0.5], text: '8', pos: c }
  - { type: text, at: [4.2, -0.35], text: '\text{ones}', pos: c }
  - { type: text, at: [5.7, 0.5], text: '= 648', pos: c }
```

1. The first digit is the most restricted: it can't be 0, leaving 9 options.
2. The second digit can be any of the 10 digits except the first one: 9 options (0 is now allowed).
3. The third digit avoids the two already used: 8 options.
4. Multiply: $9 \times 9 \times 8 = 648$.

### Example 3
How many 3-digit numbers contain at least one 0?

```diagram
view: [-0.2, 6.2, -0.6, 3.2]
width: 320
alt: "All 900 three-digit numbers: 729 have no 0, the rest have at least one 0"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [6, 0], [6, 3], [0, 3]] }
  - { type: polygon, points: [[0, 0], [4.86, 0], [4.86, 3], [0, 3]], color: accent, fill: true }
  - { type: text, at: [2.43, 1.75], text: '\text{no } 0', pos: c }
  - { type: text, at: [2.43, 1.15], text: '9^3 = 729', pos: c }
  - { type: text, at: [5.43, 1.75], text: '\text{a } 0', pos: c }
  - { type: text, at: [5.43, 1.15], text: '?', pos: c }
  - { type: text, at: [3, 3.05], text: '900', pos: n }
```

1. "At least one 0" has a simpler complement: "no 0 at all".
2. All 3-digit numbers: $9 \times 10 \times 10 = 900$ (the first digit can't be 0).
3. With no 0 anywhere, every digit has 9 options (1 to 9): $9^3 = 729$.
4. Subtract: $900 - 729 = 171$.

## Watch out
- A number can't start with 0. Deal with the first digit before the others.
- Only add counts when the cases can't overlap; otherwise some outcomes are counted twice.
- Multiply only when the number of options at each stage doesn't depend on earlier choices.
