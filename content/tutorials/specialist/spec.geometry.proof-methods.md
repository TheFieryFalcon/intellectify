---
skill: spec.geometry.proof-methods
status: draft
terms:
  - term: proof by contradiction
    definition: A proof that assumes the statement is false and shows this leads to something impossible, so the statement must be true.
  - term: counterexample
    definition: A single example where the hypothesis of a "for all" claim holds but the conclusion fails. One counterexample proves the claim false.
  - term: integer
    definition: A whole number, positive, negative or zero. The set of integers is written ℤ.
  - term: even and odd
    definition: An integer is even if it equals 2k for some integer k, and odd if it equals 2k + 1.
---
## Key ideas

**Examples and counterexamples.** A claim of the form "for all $x$, $P(x)$" is about infinitely many cases, so examples can only *illustrate* it, never prove it. But a single **counterexample**, one case where it fails, proves the claim false. On the other hand, a "there exists" claim *is* proved by one example.

| Claim | To prove it | To disprove it |
|---|---|---|
| For all $x$, $P(x)$ | A general argument | One counterexample |
| There exists $x$ with $P(x)$ | One example | A general argument that no $x$ works |

**Proof by contradiction.** To prove a statement $S$:
1. Assume $S$ is false.
2. Reason correctly from that assumption until you reach something impossible: a statement and its negation, or a fact known to be false (such as $0 = 1$, or an integer strictly between 0 and 1).
3. Conclude that the assumption was wrong, so $S$ is true.

It works because a correct chain of reasoning from a true starting point can never reach a false conclusion. So the starting point, "$S$ is false", must have been false.

Contradiction is especially useful for statements that say something *doesn't* exist or *can't* happen ("there is no largest prime", "no triangle has two obtuse angles"). Assuming the opposite gives you an object to work with.

**Proving an implication.** For $P \Rightarrow Q$ you can:
- prove it directly: assume $P$ and deduce $Q$;
- prove the contrapositive: assume not $Q$ and deduce not $P$;
- use contradiction: assume $P$ *and* not $Q$, and reach something impossible.

**Writing it up.** State what you are assuming ("Suppose, for contradiction, that…"), make each step follow from the last, name the contradiction clearly, and finish with a conclusion sentence.

## Method

1. Decide what kind of claim it is. "For all" claims need a proof or one counterexample; "there exists" claims need one example or a proof that none exists.
2. To hunt for a counterexample, try small and special cases: 0, 1, negative numbers, 2 (the even prime), equal values, extreme shapes.
3. For contradiction, write down the exact negation of what you want to prove, then use it alongside the given facts.
4. Algebra with integers: write even numbers as $2k$ and odd numbers as $2k + 1$.

## Worked examples

### Example 1
Disprove: "For every whole number $n$, $n^2 + n + 41$ is prime."

1. It is a "for all" claim, so one counterexample is enough. Small values ($n = 0, 1, 2, \dots$) all give primes, which is why the claim seems believable.
2. Choose $n = 41$: every term then has a factor of 41. $41^2 + 41 + 41 = 41 \times 43$, which isn't prime.
3. So the claim is false.

### Example 2
Prove by contradiction that there is no largest odd number.

```diagram
view: [-1, 7, -1.15, 0.9]
width: 320
alt: "Odd numbers N - 4, N - 2, N, N + 2 on a number line: N + 2 is a larger odd number"
points: {  }
draw:
  - { type: segment, from: [-0.5, 0], to: [6.5, 0], color: muted }
  - { type: point, at: [0, 0], label: 'N - 4', pos: s }
  - { type: point, at: [2, 0], label: 'N - 2', pos: s }
  - { type: point, at: [4, 0], label: 'N', pos: s }
  - { type: point, at: [6, 0], label: 'N + 2', pos: s }
  - { type: vector, from: [4, 0.15], to: [6, 0.15], color: accent }
  - { type: text, at: [5, 0.45], text: '+2', pos: c }
  - { type: text, at: [4, -0.85], text: '\text{(largest?)}', pos: c }
```

1. Suppose, for contradiction, that there is a largest odd number, $N$.
2. Then $N + 2$ is also odd, because adding 2 keeps a number odd.
3. But $N + 2 > N$, so $N$ isn't the largest odd number. This contradicts our assumption.
4. So there is no largest odd number.

### Example 3
Prove that for any integer $n$, if $n^2$ is odd, then $n$ is odd.

1. Prove the contrapositive: if $n$ is even, then $n^2$ is even.
2. If $n$ is even, $n = 2k$ for some integer $k$, so $n^2 = 4k^2 = 2(2k^2)$, which is even.
3. The contrapositive is true, so the original statement is true.

## Watch out
- Checking many examples never proves a "for all" claim.
- In a contradiction proof, assume the *exact* negation, and say clearly where the contradiction is.
- A counterexample must satisfy the hypothesis. To disprove "every prime is odd", the example must be a prime.
