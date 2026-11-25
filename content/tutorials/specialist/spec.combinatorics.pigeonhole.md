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
A drawer holds black, white and grey socks. How many socks must you take, without looking, to be sure of a matching pair?

1. The boxes are the 3 colors.
2. Taking 4 socks puts 4 objects into 3 boxes, so two socks share a color.
3. Taking 3 socks isn't enough: they could be one black, one white and one grey.
4. So the answer is **4**.

### Example 2
Prove that from any 11 numbers taken from $1, 2, \dots, 20$, two of them add to 21.

1. We want two numbers adding to 21, so make each box a pair that adds to 21: $\{1, 20\}, \{2, 19\}, \dots, \{10, 11\}$. That's 10 boxes, and every number from 1 to 20 is in exactly one box.
2. Eleven numbers in 10 boxes put two of them in the same box.
3. Two different numbers in the same box are the two members of that pair, so they add to 21.
4. Ten numbers aren't enough: $1, 2, \dots, 10$ has no two numbers adding to 21.

### Example 3
What is the least number of people needed to be sure that at least 4 of them share a birth month?

1. The boxes are the 12 months, and we want some box to hold at least $3 + 1 = 4$ people.
2. The general form with $k = 3$: more than $3 \times 12 = 36$ people guarantees it, so 37 people are enough.
3. 36 people aren't enough: exactly 3 people born in each month gives 36 people with no month holding 4.
4. So the answer is **37**.

## Watch out
- The principle says some box has two objects, not which box.
- For "least number" answers, you need both the guarantee and an example where one fewer fails.
- Every object must belong to some box. Check that your boxes cover every possibility.
