---
skill: spec.combinatorics.pigeonhole
status: draft
terms:
  - term: pigeonhole principle
    definition: If more than n objects are placed into n boxes, some box contains at least two objects.
  - term: remainder
    definition: What is left over when one whole number is divided by another, e.g. 17 divided by 5 leaves remainder 2.
---
## Key ideas

**Pigeonhole principle.** If more than $n$ objects are placed into $n$ boxes, at least one box contains at least two objects. Reason: if every box held at most one object, there would be at most $n$ objects in total, which is too few.

**General form.** If more than $kn$ objects are placed into $n$ boxes, some box contains at least $k + 1$ objects. Reason: if every box held at most $k$, the total would be at most $kn$. For example, 25 students in 12 birth months ($25 > 2 \times 12$) means some month has at least 3 birthdays.

The principle says *some* box is crowded, but not which one. Its power comes from designing the **boxes** so that "two objects in the same box" is exactly what you want to prove. Common designs:
- **Categories:** colors, months, suits.
- **Remainders:** when whole numbers are divided by $m$, the possible **remainders** are $0, 1, \dots, m - 1$, giving $m$ boxes. Two numbers with the same remainder differ by a multiple of $m$: if $a = mp + r$ and $b = mq + r$, then $a - b = m(p - q)$.
- **Pairs:** group the possible values into pairs, such as two numbers adding to a target. Two chosen numbers in the same pair satisfy the condition.
- **Regions:** cut a shape into small pieces. Two points in the same piece are close together, at most the longest distance across that piece.

**"Least number" questions.** To show that $N$ is the least number of objects that guarantees something, you need two arguments:
1. $N$ is enough: the principle forces the result.
2. $N - 1$ is not enough: give an example of $N - 1$ objects where it fails.

Proofs with the pigeonhole principle are often proofs by contradiction in disguise: "suppose no box has two objects; then there are at most $n$ objects, a contradiction."

## Method

1. Identify the objects, and decide what "two in the same box" must give you.
2. Design the boxes, and count them.
3. Compare the number of objects with the number of boxes, and apply the principle.
4. State the conclusion in words. For "least number" questions, also give an example where one fewer fails.

## Worked examples

### Example 1
A bag holds counters in 4 colors. Without looking, how many counters must you take to be sure of two the same color?

```diagram
view: [-0.3, 5.2, -0.8, 1.3]
width: 300
alt: "5 counters in 4 color boxes: one box has two"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [1, 0], [1, 1], [0, 1]] }
  - { type: text, at: [0.5, -0.35], text: '\text{red}', pos: c }
  - { type: point, at: [0.36, 0.5], label: ' ', pos: c }
  - { type: point, at: [0.64, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[1.25, 0], [2.25, 0], [2.25, 1], [1.25, 1]] }
  - { type: text, at: [1.75, -0.35], text: '\text{blue}', pos: c }
  - { type: point, at: [1.75, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[2.5, 0], [3.5, 0], [3.5, 1], [2.5, 1]] }
  - { type: text, at: [3, -0.35], text: '\text{green}', pos: c }
  - { type: point, at: [3, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[3.75, 0], [4.75, 0], [4.75, 1], [3.75, 1]] }
  - { type: text, at: [4.25, -0.35], text: '\text{yellow}', pos: c }
  - { type: point, at: [4.25, 0.5], label: ' ', pos: c }
```

1. The boxes are the 4 colors.
2. Taking 5 counters puts 5 objects into 4 boxes, so two counters share a color.
3. Taking 4 isn't enough: they could all be different colors.
4. So the answer is **5**.

### Example 2
Prove that from any 6 numbers taken from $1, 2, \dots, 10$, two of them add to 11.

```diagram
view: [-0.3, 7.3, -0.8, 1.3]
width: 360
alt: "Six numbers in the five pairs that add to 11: one pair holds two"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [1.2, 0], [1.2, 1], [0, 1]] }
  - { type: text, at: [0.6, -0.35], text: '\{1, 10\}', pos: c }
  - { type: point, at: [0.6, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[1.5, 0], [2.7, 0], [2.7, 1], [1.5, 1]] }
  - { type: text, at: [2.1, -0.35], text: '\{2, 9\}', pos: c }
  - { type: point, at: [2.1, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[3, 0], [4.2, 0], [4.2, 1], [3, 1]] }
  - { type: text, at: [3.6, -0.35], text: '\{3, 8\}', pos: c }
  - { type: point, at: [3.46, 0.5], label: ' ', pos: c }
  - { type: point, at: [3.74, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[4.5, 0], [5.7, 0], [5.7, 1], [4.5, 1]] }
  - { type: text, at: [5.1, -0.35], text: '\{4, 7\}', pos: c }
  - { type: point, at: [5.1, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[6, 0], [7.2, 0], [7.2, 1], [6, 1]] }
  - { type: text, at: [6.6, -0.35], text: '\{5, 6\}', pos: c }
  - { type: point, at: [6.6, 0.5], label: ' ', pos: c }
```

1. We want two numbers adding to 11, so make each box a pair that adds to 11: $\{1, 10\}, \{2, 9\}, \{3, 8\}, \{4, 7\}, \{5, 6\}$. That's 5 boxes, and every number from 1 to 10 is in exactly one box.
2. Six numbers in 5 boxes put two of them in the same box.
3. Two different numbers in the same box are the two members of that pair, so they add to 11.
4. Five numbers aren't enough: $1, 2, 3, 4, 5$ has no two numbers adding to 11.

### Example 3
What is the least number of people needed to be sure that at least 3 of them were born on the same day of the week?

```diagram
view: [-0.3, 8.6, -0.8, 2.3]
width: 400
alt: "14 people, two born on each day: no day has three. A 15th person makes three on some day"
points: {  }
draw:
  - { type: polygon, points: [[0, 0], [1, 0], [1, 1], [0, 1]] }
  - { type: text, at: [0.5, -0.35], text: '\text{Mon}', pos: c }
  - { type: point, at: [0.36, 0.5], label: ' ', pos: c }
  - { type: point, at: [0.64, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[1.25, 0], [2.25, 0], [2.25, 1], [1.25, 1]] }
  - { type: text, at: [1.75, -0.35], text: '\text{Tue}', pos: c }
  - { type: point, at: [1.61, 0.5], label: ' ', pos: c }
  - { type: point, at: [1.89, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[2.5, 0], [3.5, 0], [3.5, 1], [2.5, 1]] }
  - { type: text, at: [3, -0.35], text: '\text{Wed}', pos: c }
  - { type: point, at: [2.86, 0.5], label: ' ', pos: c }
  - { type: point, at: [3.14, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[3.75, 0], [4.75, 0], [4.75, 1], [3.75, 1]] }
  - { type: text, at: [4.25, -0.35], text: '\text{Thu}', pos: c }
  - { type: point, at: [4.11, 0.5], label: ' ', pos: c }
  - { type: point, at: [4.39, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[5, 0], [6, 0], [6, 1], [5, 1]] }
  - { type: text, at: [5.5, -0.35], text: '\text{Fri}', pos: c }
  - { type: point, at: [5.36, 0.5], label: ' ', pos: c }
  - { type: point, at: [5.64, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[6.25, 0], [7.25, 0], [7.25, 1], [6.25, 1]] }
  - { type: text, at: [6.75, -0.35], text: '\text{Sat}', pos: c }
  - { type: point, at: [6.61, 0.5], label: ' ', pos: c }
  - { type: point, at: [6.89, 0.5], label: ' ', pos: c }
  - { type: polygon, points: [[7.5, 0], [8.5, 0], [8.5, 1], [7.5, 1]] }
  - { type: text, at: [8, -0.35], text: '\text{Sun}', pos: c }
  - { type: point, at: [7.86, 0.5], label: ' ', pos: c }
  - { type: point, at: [8.14, 0.5], label: ' ', pos: c }
  - { type: vector, from: [2.75, 1.85], to: [2.75, 1.05], color: accent }
  - { type: text, at: [2.75, 1.95], text: '15\text{th}', pos: n }
```

1. The boxes are the 7 days, and we want some box to hold at least $2 + 1 = 3$ people.
2. The general form with $k = 2$: more than $2 \times 7 = 14$ people guarantees it, so 15 people are enough.
3. 14 people aren't enough: exactly 2 people born on each day gives 14 people with no day holding 3.
4. So the answer is **15**.

## Watch out
- The principle says some box has two objects, not which box.
- For "least number" answers, you need both the guarantee and an example where one fewer fails.
- Every object must belong to some box. Check that your boxes cover every possibility.
