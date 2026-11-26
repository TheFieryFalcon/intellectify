---
skill: spec.geometry.logic
status: draft
terms:
  - term: statement
    definition: A sentence that is either true or false, such as "7 is prime" or "every square is a rectangle".
  - term: implication
    definition: A statement of the form "if P, then Q", written P ⇒ Q. P is the hypothesis and Q is the conclusion.
  - term: converse
    definition: The implication Q ⇒ P formed by swapping the hypothesis and conclusion of P ⇒ Q.
  - term: inverse
    definition: The implication "not P ⇒ not Q" formed by negating both parts of P ⇒ Q.
  - term: contrapositive
    definition: The implication "not Q ⇒ not P". It is always true exactly when the original implication P ⇒ Q is true.
  - term: negation
    definition: The statement "not P", which is true exactly when P is false.
  - term: equivalence
    definition: P ⇔ Q, read "P if and only if Q". It means P ⇒ Q and Q ⇒ P are both true.
  - term: quantifier
    definition: A word or symbol saying how many objects a statement is about. ∀ means "for all" and ∃ means "there exists".
---
## Key ideas

**Statements.** Mathematics deals in **statements**: sentences that are definitely true or definitely false. "$x^2 = 9$" isn't a statement until we know $x$; "$3^2 = 9$" is a (true) statement.

**Implication.** "If $P$, then $Q$" is written $P \Rightarrow Q$. $P$ is the *hypothesis* and $Q$ is the *conclusion*. It claims that whenever $P$ is true, $Q$ is true too. It says nothing about what happens when $P$ is false.

**Four related implications.** Starting from $P \Rightarrow Q$:

| Name | Form | Example |
|---|---|---|
| Original | $P \Rightarrow Q$ | If a shape is a square, then it is a rectangle. (True) |
| Converse | $Q \Rightarrow P$ | If a shape is a rectangle, then it is a square. (False) |
| Inverse | not $P \Rightarrow$ not $Q$ | If a shape isn't a square, then it isn't a rectangle. (False) |
| Contrapositive | not $Q \Rightarrow$ not $P$ | If a shape isn't a rectangle, then it isn't a square. (True) |

```diagram
view: [-3, 3, -2.3, 2.3]
width: 260
alt: "Squares sit inside rectangles: every square is a rectangle, but not every rectangle is a square"
points: {  }
draw:
  - { type: polygon, points: [[-2.9, -2.2], [2.9, -2.2], [2.9, 2.2], [-2.9, 2.2]], color: muted }
  - { type: circle, center: [0, -0.1], radius: 1.9 }
  - { type: circle, center: [-0.55, -0.55], radius: 0.9, color: accent }
  - { type: text, at: [0.3, 1.2], text: '\text{rectangles}', pos: c }
  - { type: text, at: [-0.55, -0.55], text: '\text{squares}', pos: c }
  - { type: text, at: [-2.3, 1.85], text: '\text{shapes}', pos: c }
```

- **The contrapositive always matches the original.** If $P \Rightarrow Q$ is true and $Q$ fails, then $P$ can't hold (otherwise $Q$ would). So proving the contrapositive proves the original, which is often easier.
- **The converse is a different claim.** A true implication can have a false converse, as above. The inverse matches the converse, since it is the converse's contrapositive.

**Equivalence.** $P \Leftrightarrow Q$ ("$P$ if and only if $Q$") means both $P \Rightarrow Q$ and $Q \Rightarrow P$ are true. To prove an equivalence, prove both directions.

**Symbols.** $=$ joins two expressions with the same value ($2 + 3 = 5$). $\Rightarrow$ and $\Leftrightarrow$ join two *statements*. Write "$x = 3 \Rightarrow x^2 = 9$", not "$x = 3 = x^2 = 9$".

**Quantifiers.** $\forall$ means "for all" and $\exists$ means "there exists". "$\forall n \in \mathbb{Z},\ n^2 \ge 0$" says every integer has a non-negative square. "$\exists x \in \mathbb{R},\ x^2 = 2$" says at least one real number squares to 2.

**Negation.** The **negation** of $P$, "not $P$", is true exactly when $P$ is false.
- Negating swaps the quantifier: not ($\forall x$, $P$) is ($\exists x$, not $P$), and not ($\exists x$, $P$) is ($\forall x$, not $P$). To deny "every prime is odd", you only need one prime that isn't odd.
- "and" and "or" swap too: not ($P$ and $Q$) is (not $P$) or (not $Q$).

## Method

1. Identify the hypothesis $P$ and the conclusion $Q$. Rewrite the statement as "if $P$, then $Q$" if it is phrased differently (e.g. "every square is a rectangle").
2. Form the converse, inverse or contrapositive by swapping and/or negating $P$ and $Q$.
3. Decide truth: one counterexample shows an implication is false; otherwise you need a reason that covers every case.
4. To negate a statement with quantifiers, swap $\forall$ and $\exists$ and negate what follows.

## Worked examples

### Example 1
Write the converse and contrapositive of "If $x = 3$, then $x^2 = 9$", and decide whether each is true.

1. $P$ is "$x = 3$" and $Q$ is "$x^2 = 9$". The original is true.
2. Converse ($Q \Rightarrow P$): "If $x^2 = 9$, then $x = 3$." False: $x = -3$ is a counterexample.
3. Contrapositive (not $Q \Rightarrow$ not $P$): "If $x^2 \ne 9$, then $x \ne 3$." True, as it always matches the original.

### Example 2
Write the negation of "Every prime number is odd". Which of the two statements is true?

1. The statement is "$\forall$ primes $p$, $p$ is odd".
2. Negating swaps the quantifier and negates the rest: "There exists a prime number that is not odd."
3. The negation is true, because 2 is an even prime. So the original statement is false.

### Example 3
Is "$x^2 > 4 \Leftrightarrow x > 2$" true for real numbers $x$? If not, correct it.

```diagram
view: [-6.4, 4.8, -0.7, 2]
width: 340
alt: "x squared greater than 4 holds for x < -2 and x > 2; x > 2 is only the right-hand part, so -3 is a counterexample"
points: {  }
draw:
  - { type: segment, from: [-4.5, 1.4], to: [4.5, 1.4], color: muted }
  - { type: text, at: [-4.7, 1.4], text: 'x^2 > 4', pos: w }
  - { type: segment, from: [-2, 1.28], to: [-2, 1.52], color: muted }
  - { type: text, at: [-2, 1.05], text: '-2', pos: c }
  - { type: segment, from: [0, 1.28], to: [0, 1.52], color: muted }
  - { type: text, at: [0, 1.05], text: '0', pos: c }
  - { type: segment, from: [2, 1.28], to: [2, 1.52], color: muted }
  - { type: text, at: [2, 1.05], text: '2', pos: c }
  - { type: segment, from: [-4.5, 0], to: [4.5, 0], color: muted }
  - { type: text, at: [-4.7, 0], text: 'x > 2', pos: w }
  - { type: segment, from: [-2, -0.12], to: [-2, 0.12], color: muted }
  - { type: text, at: [-2, -0.35], text: '-2', pos: c }
  - { type: segment, from: [0, -0.12], to: [0, 0.12], color: muted }
  - { type: text, at: [0, -0.35], text: '0', pos: c }
  - { type: segment, from: [2, -0.12], to: [2, 0.12], color: muted }
  - { type: text, at: [2, -0.35], text: '2', pos: c }
  - { type: vector, from: [-2, 1.4], to: [-4.4, 1.4], color: accent }
  - { type: vector, from: [2, 1.4], to: [4.4, 1.4], color: accent }
  - { type: vector, from: [2, 0], to: [4.4, 0], color: accent }
  - { type: point, at: [-3, 1.4], label: '-3', pos: n }
```

1. Check "$\Leftarrow$": if $x > 2$, then $x^2 > 4$. True.
2. Check "$\Rightarrow$": if $x^2 > 4$, is $x > 2$? No: $x = -3$ gives $x^2 = 9 > 4$ but $x < 2$.
3. So the equivalence is false. A true version is $x^2 > 4 \Leftrightarrow (x > 2 \text{ or } x < -2)$.

## Watch out
- A true statement can have a false converse. Check each direction separately.
- The contrapositive negates *and* swaps. Negating without swapping gives the inverse.
- To show "for all" is false you need one counterexample, not a general argument.
