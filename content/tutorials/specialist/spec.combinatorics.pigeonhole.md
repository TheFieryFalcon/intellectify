---
skill: spec.combinatorics.pigeonhole
status: draft
terms:
  - term: pigeonhole principle
    definition: If more than n objects are placed into n boxes, some box contains at least two objects.
  - term: remainder
    definition: What is left over when one whole number is divided by another, e.g. 17 divided by 5 leaves remainder 2.
---
Dot point 1.2.6. Uses proof by contradiction from [contradiction and counter-examples](/specialist/learn/spec.geometry.proof-methods).

## Key ideas

**Pigeonhole principle.** If more than $n$ objects are put into $n$ boxes, at least one box contains at least two objects.

**General form.** If more than $kn$ objects are put into $n$ boxes, some box contains at least $k + 1$ objects. Otherwise every box holds at most $k$, giving at most $kn$ objects in total.

The skill is choosing the **boxes**. Common choices:
- **Categories:** colors, months, suits.
- **Remainders:** dividing by $m$ gives $m$ possible remainders ($0, 1, \dots, m-1$). Two numbers with the same remainder differ by a multiple of $m$.
- **Pairs:** group the possible values into pairs, such as numbers adding to a target. Two chosen numbers in the same pair satisfy the condition.
- **Regions:** split a shape into small pieces. Two points in the same piece are close together.

To show a number of objects is the **least** that guarantees something, give two arguments: the principle shows that number is enough, and an example shows one fewer isn't.

## Method

1. Identify the objects and design boxes so that "two in the same box" gives what you want.
2. Count the boxes and compare with the number of objects.
3. State the conclusion. For "least number" questions, also give an example where one fewer fails.

## Worked examples

### Example 1
A drawer holds black, white and grey socks. How many socks must you take, without looking, to be sure of a matching pair?

There are 3 colors (boxes). Taking 4 socks forces two of the same color, and 3 socks could all be different. So the answer is **4**.

### Example 2
Prove that from any 11 numbers chosen from $1, 2, \dots, 20$, two of them add to 21.

Make 10 boxes: $\{1, 20\}, \{2, 19\}, \dots, \{10, 11\}$. Each pair adds to 21. Eleven numbers in 10 boxes put two numbers in the same box, and those two add to 21. (Ten numbers aren't enough: take $1, 2, \dots, 10$.)

## Watch out
- The principle says *some* box has two objects, not which one.
- For "least number" answers, you need both the guarantee and an example showing one fewer fails.
