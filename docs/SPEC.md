# Intellectify: Product & Technical Specification

**Status:** Draft v1, produced from a design interview (2026-11-25)
**Scope of v1:** WACE Mathematics Specialist (pilot). Unit 1 is built to full depth first.
**Audience:** small group of self-directed Year 11/12 ATAR students in Western Australia.
**Budget:** zero running cost.

---

## 1. Vision

Intellectify is a mastery-based practice platform for WACE ATAR courses. It combines:

- the **skill tree** of Khan Academy;
- the **adaptive rating/mastery engine** of AoPS Alcumus;
- the **parameterized, CAS-checked questions** of Mathspace.

Questions run from pure retrieval (Tier 1) to problems significantly harder than any WACE exam (Tiers 5–6). Low tiers emphasize **retrieval and application**. High tiers emphasize **creativity, critical thinking and problem solving**.

### 1.1 Goals
- A student can open a course, see every skill as a node in a tech tree, and practice any of them adaptively.
- Ratings are honest. A rank means the student has demonstrated work at that difficulty.
- High-end content is hard and creative, not just longer computations.
- Running cost is $0 (free tiers plus optional bring-your-own LLM key).

### 1.2 Non-goals (for now)
- Teacher/class management, parent views, separate content-author roles.
- Calculator-free vs calculator-assumed exam modeling. A question is flagged `requiresCalculator` only when it genuinely needs one.
- Spaced repetition, rating decay, retention mechanics. Once earned, a rating only changes through further practice.
- Hints. The design follows Alcumus: no hints, and the full worked solution is shown after the question is resolved.
- Recommendations ("what to do next"). The student always chooses.
- Native mobile apps. These come only after all four courses are done (see §17).
- Mathematics Applications. It is not planned.
- Empirical difficulty calibration from attempt data. Question ratings are author-set for now.
- Privacy hardening of LLM calls. Not a concern for the current small, known group; revisit before any wider release.

### 1.3 Course roadmap
1. **Mathematics Specialist**: pilot. Build the framework here.
2. Mathematics Methods.
3. Chemistry, Physics.

---

## 2. Users

| Role | Description |
|---|---|
| Student (only user role) | Signs in, picks a course, practices, competes on leaderboards, posts in discussions. |
| Owner (you) | Authors content offline via scripts and git; holds the server-side API keys; moderates monthly answers through an admin page (§8.6). |
| Moderator (later) | Optional trusted helpers who can verify monthly answers (§8.6). |

Sign-in uses **Google** or **email and password** (Firebase Auth, project `intellectify-4357c`), with password reset by email.

---

## 3. Curriculum structure

```
Course (e.g. Mathematics Specialist)
 └── Unit (1–4; Units 1–2 = Year 11, Units 3–4 = Year 12)
      └── Section (3 per unit, from the WACE syllabus)
           └── Skill (cluster of related syllabus dot points, ~4–8 per section)
```

- **Skills are clustered dot points.** Each skill lists the syllabus content descriptors it covers, e.g. `["1.1.3", "1.1.4"]`.
- **Prerequisites form a DAG.** Each skill has a home in the hierarchy but may list prerequisite skills anywhere, **including in other courses**. For example, Specialist integration techniques depend on Methods calculus skills, even before Methods is launched. Prerequisites are **suggestions, not requirements**:
  - They are drawn as edges in the tree and listed on the skill page as "Suggested first".
  - Every skill can be opened and practiced at any time, whatever the student's ranks elsewhere. There are no locks, no gates and no warnings.
  - Unlike the Section Challenge's "Recommended at Gold" notice (§8.4), prerequisites never interrupt starting a skill.
- **Mathematics Specialist sections**, confirmed against the SCSA syllabi. Sources: Year 11 syllabus for teaching from 2026; Year 12 syllabus for teaching from January 2025.

  | Unit | Section (syllabus topic) | Hours | Dot points |
  |---|---|---|---|
  | 1 | 1.1 Geometry: nature of proof; circle properties | 20 | 15 |
  | 1 | 1.2 Combinatorics: permutations, inclusion–exclusion, pigeonhole, combinations | 11 | 9 |
  | 1 | 1.3 Vectors in the plane: representation, algebra, geometric proofs | 24 | 17 |
  | 2 | 2.1 Trigonometry | 16 | 9 |
  | 2 | 2.2 Matrices | 19 | 11 |
  | 2 | 2.3 Real and complex numbers: proof, irrationality, induction, complex numbers | 20 | 16 |
  | 3 | 3.1 Complex numbers | 18 | 15 |
  | 3 | 3.2 Functions and sketching graphs | 16 | 8 |
  | 3 | 3.3 Vectors in three dimensions | 21 | 15 |
  | 4 | 4.1 Integration and applications of integration | 20 | ~7 |
  | 4 | 4.2 Rates of change and differential equations | 20 | ~7 |
  | 4 | 4.3 Statistical inference | 15 | ~7 |

  Dot-point counts for Unit 4 are approximate; they come from text extraction and some dot points contain inline formulas. Skill IDs reference dot-point IDs, e.g. `spec.combinatorics.pigeonhole → ["1.2.6"]`. The draft Specialist tree is in `content/curriculum/specialist/`: 69 skills, 87 suggested-prerequisite edges, and 30 links to Methods dot points.
- **One map per course.** Year 11 and Year 12 form one continuous tree. Year 12 skills take Year 11 skills as suggested prerequisites.
  - Where a later syllabus *reviews* earlier content (e.g. Specialist 3.1.1–3.1.3, "review Cartesian form"), there is no duplicate review skill. The section's `reviewDotPoints` maps those dot points onto the earlier skill, which then serves both years.
  - Every dot point is covered exactly once, by a skill or by a review mapping.

- **Mathematics Methods sections** (Phase 3; listed now because Specialist skills take prerequisites from them). Sources: Year 11 syllabus for teaching from 2026; Year 12 syllabus for teaching from 2026 and from 2027.

  | Unit | Section (syllabus topic) | Hours | Dot points |
  |---|---|---|---|
  | 1 | 1.1 Counting and probability | 18 | 15 |
  | 1 | 1.2 Functions and graphs | 22 | 24 |
  | 1 | 1.3 Trigonometric functions | 15 | 16 |
  | 2 | 2.1 Exponential functions | 10 | 7 |
  | 2 | 2.2 Arithmetic and geometric sequences and series | 15 | 9 |
  | 2 | 2.3 Introduction to differential calculus | 30 | 22 |
  | 3 | 3.1 Further differentiation and applications | 20 | 16 |
  | 3 | 3.2 Integrals | 20 | 22 |
  | 3 | 3.3 Discrete random variables | 15 | 16 |
  | 4 | 4.1 The logarithmic function | 18 | 14 |
  | 4 | 4.2 Continuous random variables and the normal distribution | 15 | ~7 |
  | 4 | 4.3 Interval estimates for proportions | 22 | ~10 |

  The Year 12 Methods syllabi for 2026 and 2027 have **identical unit content**. The 2027 edition is part of the WACE Refreshment and only revises the rationale, aims and General Capabilities. Both are registered as versions anyway, which exercises the versioning infrastructure below.

- The source PDFs live in a gitignored `content/syllabus/` folder, where the ingest script reads them. They are SCSA documents, so they aren't committed.

### 3.1 Syllabus versioning infrastructure
WACE syllabi rarely change significantly, but Methods is under review. Build for change from the start.

- **Versioned curricula:** `content/curriculum/<course>/<version>.yaml`, e.g. `specialist/y11-2026.yaml`, `methods/y12-2026.yaml`, `methods/y12-2027.yaml`. Each file records its source document, effective date and dot-point list.
- **Stable skill IDs:** skills have IDs that are independent of syllabus numbering. Each skill maps to dot-point IDs **per version**, so a renumbered dot point doesn't change the skill.
- **Version maps:** `content/curriculum/<course>/maps/<from>__<to>.yaml` declares how skills change between versions: `same`, `renamed`, `split: [a, b]`, `merged-into: c`, `removed`, `added`. The build checks that every skill in the old version is accounted for.
- **Student-state migration:** a migration step runs when a student moves to a new version.
  - Split: children inherit the parent's θ and gate counts.
  - Merge: θ is the attempt-weighted average and gate counts are the max.
  - Removed skills are archived but stay visible on the profile.
  - Added skills start Unranked.
- **Question tagging:** questions reference stable skill IDs plus dot-point IDs. The build warns when a question's dot points no longer exist in a version that serves it, and questions can be restricted to specific versions.
- **Version selection:** each course enrollment records the syllabus version. It defaults to the current one for the student's year. During transition years the student can choose in settings.

The tree is drafted by an LLM script from the syllabus PDFs and then edited by hand (§11.1). The edited `content/curriculum/<course>/<version>.yaml` files are the source of truth (§3.1).

### 3.2 Tutorials
Every skill has a tutorial. Together the tutorials do the job of a very good WA community textbook (in the vein of Lucarelli or O.T. Lee): a student who has never met a topic can learn it here, then practice it.

**Scope**
- A tutorial covers everything a student needs to reach **low-to-mid Tier 3** (ratings up to about 1480): every dot point the skill covers, including review dot points mapped onto it (§3).
- It stops there. Harder technique and insight are learned through Tier 4–6 problems and their worked solutions, not the tutorial.
- Where the syllabus says "prove", the tutorial includes the proof (or a proof sketch where the full proof is itself an exercise).

**Concise, but complete.** Say each thing once, in the fewest words that are still clear, but never so few that the reasoning is lost.
- No motivation paragraphs, history, filler or recaps.
- Explain *why* each rule or formula works, in a sentence or two (a short counting argument, a picture, a derivation), not just *what* it is.
- Explain notation by what it means or counts, never by restating its own name (not "$\binom{n}{r}$: choosing $r$ to take is the same as choosing $n - r$ to leave").
- Length budget: about **250–700 words of prose** per tutorial, not counting worked examples, formulas and diagrams. The build warns above 700 and fails above 1000.
- Prefer a formula, a table or a diagram over a paragraph when it says the same thing.
- Don't re-teach a suggested prerequisite. Link to that skill's tutorial instead.
- **No metadata in the body** (§15.1). The tutorial page shows the skill's dot points and prerequisites as a metadata row built from the curriculum; the Markdown starts at "Key ideas". The build rejects anything before it.

**Every technical term is explained**
- Each technical term or symbol is defined at first use: **bold** term, then a one-line plain-English definition, plus notation if any (e.g. **permutation**: an ordered arrangement; ${}^nP_r$).
- Terms defined in other skills' tutorials link there instead of being redefined.
- All defined terms feed a course **glossary**. Wherever a glossary term appears in a tutorial, question or solution, hovering or tapping it shows the definition.
- Use WA/WACE notation and conventions (cis θ, $\binom{n}{r}$ and ${}^nC_r$, column vectors, i/j/k), matching how exams and markers write.

**Structure** (fixed headings, so tutorials feel consistent):
1. **Key ideas**: definitions, results and formulas, each stated precisely, with proofs where the syllabus asks for them.
2. **Method**: how to approach the standard question types, as short numbered steps where that helps.
3. **Worked examples**: **one to three**, rising in difficulty from about Tier 1 to low-to-mid Tier 3. Each is set out as numbered steps, saying what is done and why, laid out the way a top WACE answer would be. A worked example must not duplicate a practice question.
4. **Watch out** (optional): at most three common mistakes, one line each.

**Format and behavior**
- One Markdown file per skill: `content/tutorials/<course>/<skillId>.md`, with the same `$…$` LaTeX and declarative diagram specs (§9.4) as questions.
- Front matter records the dot points covered, the glossary terms it defines, and its review status.
- Tutorials are free to read at any time and **never affect θ, ranks or gates**.

**Build checks**
- Every skill has a tutorial; a missing one is a warning until Phase 1 content is complete, then an error.
- Each tutorial has 1–3 worked examples and stays within the length budget.
- Every dot point the skill covers is referenced.
- Glossary terms are defined exactly once across the course, and every term link resolves.

---

## 4. Difficulty: tiers and question ratings

Every question has an **author-set rating `d`**: 1000 is incredibly easy, 2000 is the top of first-year university level, and only Tier 6 goes beyond. The tier is derived from the rating using **exam-anchored bands**:

| Tier | Rating band | Character |
|---|---|---|
| Tier 1 | 1000–1249 | Recall: definitions, notation, one-step procedures |
| Tier 2 | 1250–1399 | Apply: routine multi-step application |
| Tier 3 | 1400–1549 | Typical WACE exam question |
| Tier 4 | 1550–1699 | Hardest WACE exam questions |
| Tier 5 | 1700–1999 | Beyond the exam: creative, unfamiliar, synthesis. **Never above first-year undergraduate level.** |
| Tier 6 | 2000+ | Reserved for the **monthly problems** (§8.6). Exceptionally difficult, **up to second-year undergraduate level** in difficulty, but never needing unlearned knowledge (§8.6). |

- Tiers are displayed as plain numbers ("Tier 1" … "Tier 6").
- An LLM estimates the rating at generation time, and the owner adjusts it during review.
- Content mix per skill: **15–30 questions**, scaled to skill size. Tiers 1–2 need only a couple of items each, since they are mostly parameterized templates where only the numbers change. The bulk of authored items sit in **Tiers 3–5**. A parameterized template counts as one item.

---

## 5. Rating and mastery engine (Alcumus-style)

### 5.1 Student ability θ
- Each student has an ability **θ per skill**, on the same 1000–2000 scale as questions. θ may go outside the scale; clamp it to [800, 2300].
- Probability of a correct answer: `P(correct) = 1 / (1 + exp(-(θ − d) / S))`, with `S = 100` (tunable).
- Update after a question resolves: `θ ← θ + K · w · (outcome − P)`
  - `outcome ∈ [0, 1]` (§6.2 credit rules)
  - `K = 32` (tunable; constant, so there is no provisional fast-moving phase)
  - `w` = skill weight: 1.0 for the primary skill, 0.5 for secondary skills on cross-skill problems

### 5.2 Displayed numbers (everything is visible)
- **Score (0–100)**, the Alcumus-style headline number: `round(100 · P(correct on a reference question of rating 1500))`. It is anchored to a fixed reference in the middle of Tier 3 (a typical exam question), so a score of 50 reads as roughly "exam-ready", and it stays stable as content is added. The reference rating is configurable.
- **Raw θ** is shown next to the score.
- **Question rating `d`** and tier are shown on every question.
- **Δθ** is shown after every answer, e.g. "+14 → 1523".

### 5.3 Placement
- On first opening a skill, the student can **choose a starting tier**. The default is **Tier 3**. θ is set to the **floor of that tier's band** (e.g. Tier 4 → 1550) and then updates at normal speed.
- At any time the student can **drop a tier**. This is a **non-destructive selection shift**: θ, rank and gates are untouched, and question selection (§5.7) targets the tier below the one θ currently sits in. The student can switch it off at any time. θ keeps updating normally, and easier questions naturally give smaller gains.
- Placement sets θ only. **Gate counts start at zero**, so placement alone never grants a rank.

### 5.4 Ranks
Ranks per skill: **Unranked → Bronze → Silver → Gold → Platinum → Diamond**. **Diamond = "Mastered".**

| Rank | Requires θ ≥ | AND gate |
|---|---|---|
| Bronze | 1000 | ≥ 3 correct at Tier 1 or higher |
| Silver | 1250 | ≥ 3 correct at Tier 2 or higher |
| Gold | 1400 | ≥ 3 correct at Tier 3 or higher |
| Platinum | 1550 | ≥ 3 correct at Tier 4 or higher |
| Diamond | 1700 | ≥ 3 correct at Tier 5 or higher |

- **Correct** (for gates) means a resolved question with **outcome > 0.6**. Some consequences:
  - First-try answers always count.
  - Later attempts count only where their credit exceeds 0.6: Tier 4 attempt 2 (0.7) and Tier 5 attempts 2–5 (0.9 down to 0.656). They don't count at Tiers 1–3 (0.3, 0.5).
  - Free-response counts with a rubric score above 60%.
  - Harder solves satisfy lower gates.
- **Every problem contributes**: single-skill practice, quizzes, section challenges, daily and monthly problems, and cross-skill problems all update θ and gate counts. For cross-skill problems this applies to every tagged skill.
- **Buffer zone (hysteresis):** a student earns rank k when both conditions first hold. They lose it only when θ drops below `floor_k − buffer_k`. Gate counts never decrease.
  - The buffer varies by rank, sized to the band below, and is **not displayed** to students. Starting values (tunable): Bronze 25, Silver 50, Gold 45, Platinum 35, Diamond 30.

### 5.5 Roll-up: section, unit, course
- **Section θ** = weighted average of its *started* skills' θ (weight = number of dot points in the skill, including review dot points it covers). Unstarted skills don't enter the average but count as Unranked for the cap below.
- **Section rank** = the rank implied by section θ, **capped at one rank above the lowest skill rank** in the section. Example: one Silver skill caps the section at Gold. The same buffer rule applies.
- Units roll up from sections, and the course rolls up from units, using the same rule.

### 5.6 Response skills
Alongside content skills, every student has **response skills**, each with its own θ and Bronze→Diamond rank (same rules as §5.4):

`Calculation` · `Reading & interpretation` · `Proof` · `Clarity of expression` · `Precision of language` · `Synthesis` (list is configurable)

- **Auto-marked questions** carry a coarse difficulty per response skill they exercise, e.g. `{calculation: 1500, reading: 1300}`. A tier-level value is fine. The question's outcome updates each listed response skill against that difficulty.
- **Free-response questions** use **rubric dimensions** that map to response skills. Each dimension is scored separately and updates its response skill using that dimension's score as the outcome.
- Response-skill gates use the tier of the response-skill difficulty, not the question's content tier.

### 5.7 Question selection
- Target success probability **P\* ≈ 0.65**, the Alcumus-like "edge of ability" (tunable). The ideal rating is `d* = θ − S·ln(P*/(1−P*))`.
- Choose from the skill's pool by closeness to `d*`. **Down-weight questions already seen**, and never repeat a question seen in the last N sessions unless the pool is exhausted. Template questions may repeat with fresh parameters.
- **Drop a tier** (§5.3) shifts `d*` down into the band one tier below θ's current band.
- Hidden questions (reported, §11.5) are excluded.

---

## 6. Answering a question

### 6.1 Flow
1. The question renders: KaTeX for text and math, plus any diagram (§9.4). Tier, rating and the `requiresCalculator` flag are shown.
2. The student answers via the math keyboard, stylus, MCQ, feature-entry or free-response.
3. Auto-marked answers are checked **client-side, instantly**. Free-response answers go to LLM marking (§10).
4. If wrong and attempts remain, the student sees "Incorrect, N attempts left". No hints are given.
5. Once resolved (correct, out of attempts, or **Give up**, which gives outcome 0), the student sees:
   - the **full worked solution**;
   - Δθ, the new score, any rank change and achievements earned;
   - a **Report issue** button.

### 6.2 Attempts and credit (auto-marked)
Only the **final outcome** counts, so there is one θ update per question. Wrong attempts before a success don't update θ.

| Tier | Attempts | Credit by attempt that succeeds |
|---|---|---|
| 1–2 | 2 | 1.0, 0.3 |
| 3 | 2 | 1.0, 0.5 |
| 4 | 3 | 1.0, 0.7, 0.49 (geometric ×0.7) |
| 5 | 5 | 1.0, 0.9, 0.81, 0.729, 0.656 (geometric ×0.9) |
| 6 | Unlimited | No penalty for wrong answers (milestone scoring, §8.6) |

**Multi-part questions:** each part has its own attempts, and the question outcome is the weighted mean of the part outcomes (weights = part marks).

### 6.3 Free-response
- **One attempt**, plus an **appeal** (§10.3).
- Outcome from rubric score `s`: `outcome = s` if `s ≥ 0.6`, otherwise `0`.

---

## 7. Answer formats and input

### 7.1 Formats (all required for the Specialist pilot)
| Format | Checking |
|---|---|
| Numeric | Value with tolerance / significant figures / exact-form rule |
| Expression | Symbolic equivalence by numeric sampling plus form rules (§9) |
| Complex number | Value equivalence plus required form (Cartesian / polar / exponential) |
| Vector / matrix | Componentwise expression checks |
| Set / interval / list | Order-insensitive, element-wise checks |
| Equation | Equivalence up to rearrangement or scaling |
| MCQ / multi-select | Exact set match |
| Feature-entry | Graphical answers expressed as features: asymptote equations, intercepts, turning points, locus equations |
| Multi-part | (a)(b)(c) composed of the above, each part auto-marked |
| Proof / free-response | LLM rubric marking (§10) |

Graphical answers such as "sketch y = 1/f(x)" or "shade the locus" are handled through **feature-entry**, not drawing.

### 7.2 Input methods
- **Math keyboard:** MathLive `<math-field>` with a touch-optimized virtual keyboard. Specialist-specific key layouts: vectors, matrices, complex numbers, ∫, Σ, nCr/nPr, cis.
- **Stylus → recognized math:** MyScript iink (free tier), producing LaTeX in the same math field. The student confirms the rendered result before submitting.
  - **When the shared monthly quota runs out:** the stylus pad is disabled with a notice. The student falls back to the keyboard, or to **BYO-key vision LLM transcription** if they've configured a key (§10.4).
- **Free-response editor:** rich text with inline math fields; stylus input works there too.

---

## 8. Practice and assessment modes

### 8.1 Skill practice (core loop)
An endless adaptive stream for one skill (§5.7).

### 8.2 Section quiz
- **8 questions**, fixed mix: 2×T1, 2×T2, 3×T3, 1×T4, drawn across the section's skills.
- Every question updates θ for its skill. An end summary shows score per skill and rank changes.

### 8.3 Unit quiz
- **15 questions**, fixed mix: 2×T1, 4×T2, 6×T3, 3×T4, drawn across the unit.
- Both quiz mixes are **config-driven**.

### 8.4 Section Challenge
- **10–25 Tier 4–5 cross-skill (synthesis) problems**; the count scales with section size.
- **Untimed**, and progress is saved across sessions.
- **Soft gate:** always available. If any skill in the section is below Gold, a "Recommended at Gold" warning appears before starting.
- Each problem has one **primary skill** (full update) and secondary skills (0.5× update).

### 8.5 Daily problem
- **Same problem for everyone**, changing at midnight **Australia/Perth**.
- Crossword-style weekly ramp:

  | Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
  |---|---|---|---|---|---|---|---|
  | Tier | 1 | 2 | 2 | 3 | 3 | 4 | 4 |

- Normal attempt rules for its tier. It updates θ like any other problem.
- It has a **discussion thread** that is open the whole time (§13.1). The thread isn't linked from the problem screen; students find it through Discussions.
- A **daily streak** (consecutive days solved) feeds a leaderboard.

### 8.6 Monthly problems (Tier 6)
- **Two problems per course each month**, both open for the whole month:
  - a **Year 11** problem;
  - a **Year 12** problem.
- **Scope: the previous unit.** Each problem covers the unit its year group finished most recently. Every unit is treated as **15 school weeks**:

  | Year group is currently in | Monthly problem covers |
  |---|---|
  | Unit 1 (Year 11) | Year 10 content (Australian Curriculum, including 10A) |
  | Unit 2 (Year 11) | Unit 1 |
  | Unit 3 (Year 12) | Unit 2 |
  | Unit 4 (Year 12) | Unit 3 |

  - A problem may also use anything from earlier units and years.
  - A Specialist problem may assume Methods content up to the same point, since Specialist students study Methods concurrently.
- **Never requires unlearned knowledge.** Difficulty comes from insight, not from material the year group hasn't been taught. Every problem lists the dot points it relies on, and the build checks they all come from the allowed scope.
- **Difficulty differs by course:**
  - **Specialist:** rated 2000+, up to second-year undergraduate level in difficulty.
  - **Methods:** **substantially easier**: about 1800–2000 on the shared scale, no harder than first-year undergraduate. It is still labeled the course's Tier 6 problem.
- **School calendar.** Which unit each year group is in comes from a calendar file, `content/calendar/<year>.yaml`. It records WA term dates, semester boundaries and exam periods, and units are counted as 15 school weeks from the start of the school year, skipping holidays. The dates will be based on the owner's earlier project's calendar data.
- **Milestone scoring:** the problem defines **5–7 named checkpoints** (e.g. "find a useful invariant", "reduce to a recurrence", "prove the lower bound", "prove the upper bound", "handle the edge cases", "full solution"), each worth points.
- **Unlimited submissions with no penalty.** Each submission is LLM-marked against the milestones, and the student's score is the best milestone set achieved.
  - Free-tier marking gets a **generous** daily per-user cap (starting value 20, configurable). Quotas are opaque and change often, so the cap is tuned as usage shows. BYO-key users are unlimited.
- **Answers must be the student's own work, definitely not AI-generated** (see Moderation below).
- At month end, after moderation:
  - θ updates for the tagged skills (outcome = milestone points fraction);
  - the official solution is revealed (the discussion thread has been open all month);
  - the monthly leaderboards are finalized, one per course and year group.

#### Moderation of monthly answers
Monthly answers must be **definitely not AI-generated**. Automated AI-text detectors can't prove that on their own, since they misfire on genuine student writing. So the burden of proof is on the submission: it must carry evidence of being the student's own work, and a person verifies it before it counts.

**Writing rules (enforced by the answer editor):**
- Answers are written **in the app**, typed in the math editor or handwritten with the stylus.
- **Pasting is blocked** in the monthly answer editor.
- The editor records a **writing history**: timestamped keystrokes and strokes, which a moderator can replay as the answer was written.
- Handwritten working may also be uploaded as photos of paper pages. A photo-only submission still needs a writing summary in the editor, and goes straight to human review.

**Follow-up check (for any submission that earns milestone points):**
- The student answers **one or two short follow-up questions about their own solution**, inside the app with a time limit. For example: "Why does step 3 hold?" or "What changes if n is even?"
- An LLM generates and marks these from the submission. Someone who wrote the solution can answer them easily; someone who pasted it usually can't.

**Automated signals (for prioritizing review, never proof on their own):**
- Large instantaneous insertions, or typing rhythm that doesn't match writing.
- Time from first opening the problem to submission that's implausibly short for the answer's length.
- Close similarity to reference solutions generated by several AI models when the problem was authored.
- Style that departs sharply from the student's own earlier free-response answers.

**Human verification:**
- **Every submission that earns milestone points goes to a moderation queue** before it counts. The moderator sees the writing replay, the follow-up answers and the signals.
- The moderator marks each submission **Verified**, **Rejected** or **Needs follow-up**. Needs follow-up means a short chat or call with the student, or an extra follow-up question.
- The owner moderates at first. A `moderator` role (Firebase custom claim) can be granted to trusted helpers later.
- **Live explanation (Specialist monthly problems only, Year 11 and Year 12):**
  - **Who:** the **top finisher** of each Specialist monthly problem, plus anyone claiming a **full solve**, must explain their solution live before their submission can be Verified.
  - **How:** a short (about 10-minute) in-person chat or video call with the owner or a moderator, walking through the key steps and answering questions about them.
  - **If not completed:** a student who can't or won't do it within the moderation window keeps only the milestones the moderator can verify from the writing history and follow-up answers. A full solve that wasn't explained live never counts as a full solve.
  - **Methods** monthly problems don't need a live explanation; the other checks above apply as usual.
- There's a **7-day moderation window** after the month closes. Leaderboards, XP, θ updates and achievements for the monthly problem apply only to Verified submissions, once that window ends.

**Policy:**
- Using AI to produce a monthly answer disqualifies the student from that month's problem. A second offense bars them from monthly problems for the rest of the year.
- AI tools remain fine for learning elsewhere in the app; the rule applies only to monthly answers.
- Students see the rules and agree to an honor pledge before their first monthly submission.

---

## 9. Answer checking (client-side)

Checking runs entirely in the browser. Answer keys ship in the content bundle. This is a self-study tool, so a determined cheater only cheats themselves.

### 9.1 Design: numeric sampling + form rules + typed comparators
We use precomputed checker specs rather than a full CAS at runtime.

- **Parsing:** CortexJS Compute Engine turns MathLive LaTeX into MathJSON. It is used **only for parsing and evaluation**.
- **Equivalence:** evaluate the student's expression and the key at K random points (default 8) in a declared domain, avoiding singularities, and compare within tolerance. This handles trig identities, complex expressions and algebraic rearrangements without symbolic simplification.
- **Form rules** run on the MathJSON tree. Examples:
  - `exact` (no decimals);
  - `factored`, `expanded`;
  - `polar` / `cartesian` / `exponential` for complex numbers;
  - `simplified-fraction`, `rationalized-denominator`, `single-integral`;
  - `+C required`.
- **Typed comparators** cover vectors, matrices, sets, intervals, equations, MCQ and feature-lists.

Rationale: a full browser CAS is either weak (Compute Engine alone) or heavy and slow on phones (Pyodide + SymPy, ~15 MB). Numeric sampling is fast and robust for equivalence, and form rules capture what WACE markers care about. SymPy is still used **offline** to verify every answer key (§11.3).

### 9.2 Checker spec (per answer)
```yaml
answer:
  type: expression
  key: "\\frac{2}{(x-1)^2}"
  vars: { x: { domain: [-5, 5], avoid: [1] } }
  samples: 8
  tolerance: 1e-9
  form: [exact, simplified-fraction]
```

### 9.3 Parameterized questions
- **Runtime templates:** parameter ranges plus constraints. The client instantiates random values and computes the key and checker in JS. Used for simple arithmetic-type items, mostly Tiers 1–2.
- **Pre-generated variants:** the offline script produces concrete variants (e.g. 20 per template), each SymPy-verified, and ships them. Used wherever parameter choice can break "nice" answers.
- **Mandatory rule for trigonometric simultaneous-equation problems** (collisions, interception, flight direction with wind, relative velocity): always pre-generate, and verify that
  - (a) answers are **small whole numbers**, or the intended exact values;
  - (b) the problem is **solvable on a low-power CAS calculator**, meaning an old, slow, unreliable CAS with `solve` and graphing. In practice:
    - `solve` on the system returns the intended solution quickly from default settings;
    - any graph intersections are clearly identifiable in a standard window;
    - no step relies on heavy symbolic simplification that a weak CAS would choke on or return in an unrecognizable form.
- `requiresCalculator: true` is set only when a calculator is genuinely needed (combinations with large numbers, vector/trig calculations with non-exact values).

### 9.4 Diagrams
- **Declarative spec → SVG**, rendered by a small in-house renderer (or a JSXGraph/Mafs-style library):
  - points, segments, vectors, angles, circles, polygons;
  - function curves, asymptotes, Argand diagrams, slope fields;
  - 3D vectors as projected views.
- Diagram specs reference question parameters, so diagrams update with parameterized variants. They are LLM-authorable and validated at build time.

---

## 10. LLM marking (free-response, appeals, monthly problem)

### 10.1 Marking request
- Input: question, model solution, **rubric** (criteria with points), **rubric dimensions** (mapped to response skills), and the student's answer (text + LaTeX).
- Output (strict JSON): per-criterion points, total score `s`, per-dimension scores, short feedback per criterion, and overall feedback.
- The rubric breakdown and feedback are shown to the student.
- **The marker is instructed to be strict.** It acts as a demanding WACE marker:
  - It awards a criterion only when the work clearly and correctly establishes it.
  - It gives no credit for correct answers with missing or invalid justification where the rubric requires reasoning.
  - It penalizes imprecise language and notation according to the rubric dimensions.
  - When in doubt, it does not award the mark.

### 10.2 Providers and transport
- **Default: free tier.** A **Netlify Function `/api/mark`** holds the owner's **Gemini free-tier API key** and calls the model **synchronously**. Over quota, it returns **429**.
- **Async UX with a client retry queue:**
  - The submission is saved as a pending job in Firestore (`users/{uid}/markingJobs`).
  - The UI shows "Marking…" and the student **keeps practicing**.
  - The open app retries with exponential backoff. If the app is closed, it resumes on the next visit.
  - When a result lands, a toast appears and θ, gates and achievements update at that moment, using θ at application time.
- **Nudge to BYO key:** the pending state explains that the free queue may be slow, and offers a one-tap "Add your own key for instant marking".

### 10.3 Appeals
- One appeal per marked submission. The student writes an argument.
- The **same model** re-marks with the original submission, rubric, first verdict and the student's argument.
- The re-mark is **final and can go up or down**. There is no manual review.
- The appeal prompt keeps the strict stance. It changes a mark only if the student's argument identifies a concrete error in the original marking. Persuasive or emotional appeals without substance don't move the mark.

### 10.4 Bring-your-own key
- Providers: **Gemini, Claude, OpenAI**.
- The key is stored **only on the device** (localStorage) and never sent to the owner's servers.
- Calls go **directly from the browser** to the provider (e.g. Anthropic's direct-browser-access header).
- BYO keys also enable:
  - instant marking, with no queue;
  - unlimited monthly-problem submissions;
  - vision-LLM handwriting transcription when the MyScript quota runs out.

---

## 11. Content pipeline (offline, owner-run scripts)

All generation runs **offline**, via scripts the owner runs (e.g. with Claude Code or the owner's own subscription). Output is files committed to git.

### 11.1 Syllabus → curriculum
`scripts/ingest-syllabus` reads the supplied course PDFs and drafts `content/curriculum/<course>/<version>.yaml`:
- units, sections, skill clusters and dot-point mapping;
- **prerequisites, including cross-course** links, inferred from the other courses' syllabi even before those courses launch.

The owner edits the draft, and the edited file becomes the source of truth.

### 11.2 Question generation
`scripts/generate --skill <id> --tier <n> --count <k>` drafts question files. Each file contains:

| Field | Contents |
|---|---|
| `id`, `version` | Identifier and version |
| `skills` | Primary skill, plus secondary skills for cross-skill problems |
| `rating` | 1000–2000+; the tier is derived from it |
| `responseSkills` | Difficulty per response skill (auto-marked) or rubric dimensions (free-response) |
| `requiresCalculator` | Only when genuinely needed |
| `stem` | Text with LaTeX |
| `diagram` | Diagram spec |
| `parts` | Answer checker specs |
| `params`, `variants` | For parameterized questions |
| `solution` | Full worked solution |
| `rubric` | Free-response only |
| `milestones` | Tier 6 only |
| `verify` | SymPy script that recomputes every answer key |

Generation prompt emphasis by tier:
- **T1–T2:** retrieval, notation, routine application.
- **T3–T4:** WACE exam style and its hardest items.
- **T5–T6:** creative, unfamiliar framing; multiple approaches; proof; synthesis across skills; no template feel. Tier 5 never goes above first-year undergraduate level. Tier 6 (monthly problems only) may reach second-year undergraduate difficulty, but only using knowledge already taught (§8.6).

Language rules for every question and solution:
- **Only taught terms.** Use vocabulary from the syllabus up to that skill (and the glossary built from tutorials, §3.2).
- **No untaught jargon.** Describe any other concept in plain English inside the question, without naming it. For example, write "the point where the three lines from each corner to the midpoint of the opposite side meet", not "the centroid".
- **Templates for routine setups.** Questions whose setup is routine use parameterized variants. For example, a "no two identical letters adjacent" arrangement question uses a list of words (MISSISSIPPI, GENERATED, METASTASIS, …), with each variant's answer computed and verified by the generator.

### 11.3 Verification (all must pass before merge)
1. **CAS verification:** run each question's SymPy `verify` code. It must reproduce every answer key, and every pre-generated variant. Any mismatch fails the build.
2. **Multi-model cross-check:** **Gemini** (owner's key) solves the question independently. Disagreement with the key flags the question.
3. **Constraint checks:** schema validation, form-rule sanity, diagram spec validity, and the trig simultaneous-equation constraints (§9.3).
4. **Owner review** in git/PR, with flagged items highlighted.

Tutorials (§3.2) go through the same pipeline:
- `scripts/generate-tutorial --skill <id>` drafts one from the syllabus dot points, the suggested prerequisites' glossary terms and the style rules in §3.2.
- Every worked example has SymPy verification of its final answers.
- Gemini cross-checks the examples and flags any undefined technical term.
- The owner reviews each tutorial, with a deliberate pass for concision.

### 11.4 Build
`npm run build:content` validates everything and emits static JSON bundles (per course, per skill) deployed with the site to the Netlify CDN. This costs no Firestore reads.

### 11.5 Student reports (automatic, no manual queue)
1. **Report issue** calls the Netlify function `/api/report` with the question ID, variant/params, and the student's note.
2. The function **re-verifies automatically**: Gemini re-solves, and the stored verification result plus key are compared.
3. **If they disagree:** the question is added to a Firestore `hiddenQuestions` list, so clients exclude it immediately. A **GitHub issue** is opened automatically on this repo with all the details, and the owner fixes it in a PR.
4. **If they agree:** the report is logged, and the question is auto-hidden once it collects N independent reports.

---

## 12. Gamification

### 12.1 Achievements

Achievements are Khan-style badges that **feel like rewards** and must be **deliberately earned**. There are **100** of them across **seven tiers**. Even the easiest tier needs sustained effort.

| Tier | Points | Count | Of which secret | Intended feel |
|---|---|---|---|---|
| **Platinum** | 10 | 23 | 1 | Weeks of steady, serious work |
| **Diamond** | 25 | 22 | 2 | A term of dedicated work |
| **Ruby** | 50 | 18 | 3 | Strong mastery of a unit |
| **Tanzanite** | 100 | 16 | 4 | Top-student territory |
| **Vibranium** | 250 | 13 | 5 | Exceptional; few will earn any |
| **Solarium** | 600 | 5 | 2 | Near-mythical |
| **Antimatter** | 1500 | 3 | 2 | Possibly never earned |
| **Total** | | **100** | **19** | |

**Rules**
- **Secret achievements (🔒)** are fully visible: name, tier and points are shown like any other achievement. Only the **criterion is hidden** ("???") until earned, so the **name serves as the hint**. Secrets are esoteric and skew toward the high tiers.
- **Course scope:** achievements are earned once per course. When new courses launch, the course-scoped set is instantiated for each one, and cross-course ones (e.g. daily streaks) stay global.
- **Definitions:** criteria are declarative in `content/achievements.yaml` and evaluated client-side after each resolved question, quiz, challenge or daily/monthly result. Counters live in `users/{uid}/stats`, e.g. consecutive first-try streaks, per-tier correct counts and daily streak.
- **Tier designs continue the rank ladder:** the Platinum and Diamond achievement tiers deliberately parallel the Platinum and Diamond mastery ranks (§5.4). Their designs are **very similar**:
  - same colors, materials and finish (metallic platinum, faceted diamond);
  - same frame shape and insignia motif.
  - The only differences are the achievement's own emblem in the center and where it appears: achievement shelves and toasts, as opposed to tree nodes and rank labels.
  - Ruby, Tanzanite, Vibranium, Solarium and Antimatter extend the same visual language upward. Each step is more elaborate than the last, e.g. richer materials, glow and motion for Solarium, and an inverted or void treatment for Antimatter.

**Terms used below**
- *Correct* = resolved with outcome > 0.6, the same as the rank gate (§5.4).
- *First-try* = correct on attempt 1.
- *T3+* = Tier 3 or higher.
- Free-response counts as *100%* only with a rubric score of 100% and no appeal.
- Daily-problem rules use Australia/Perth dates.

#### Platinum (10 pts, 23)
| # | Name | Criterion |
|---|---|---|
| P1 | Groundwork | 100 correct answers at T3+ |
| P2 | First Light | Gold in 10 skills |
| P3 | Gilded Section | Every skill in one section at Gold+ |
| P4 | Platinum Standard | First skill at Platinum rank |
| P5 | Over the Edge | First Tier 5 question correct |
| P6 | Clean Sheet | A perfect Section Quiz (8/8, all first-try) |
| P7 | Ten in a Row | 10 consecutive first-try correct at T3+ |
| P8 | Full Week | Solve all 7 daily problems of one Mon–Sun week |
| P9 | Weekend Warrior | Solve 4 weekend (Tier 4) daily problems |
| P10 | Proof Positive | A free-response answer at 100% |
| P11 | Challenger | Complete a Section Challenge with average outcome ≥ 0.5 |
| P12 | Fortnight | 14-day daily-problem streak |
| P13 | Tier 4 Ten | 10 Tier 4 questions first-try correct |
| P14 | Unit Scholar | ≥ 13/15 on a Unit Quiz |
| P15 | All-Rounder | Every response skill at Silver+ |
| P16 | Wordsmith | Gold in both Clarity of expression and Precision of language |
| P17 | First Milestone | Score at least one milestone on a monthly Tier 6 problem |
| P18 | Spot the Flaw | Submit a report that auto-reverification confirms (question hidden) |
| P19 | Comeback | Regain a rank previously lost under the buffer rule |
| P20 | Synthesist | 10 cross-skill problems correct |
| P21 | Broad Base | Gold in at least one skill in every section of a unit |
| P22 | Explorer | Resolve at least 10 questions in every skill of a unit |
| P23 | 🔒 Last Gasp | Solve a Tier 5 question on its 5th and final attempt |

#### Diamond (25 pts, 22)
| # | Name | Criterion |
|---|---|---|
| D1 | Deep Roots | 500 correct at T3+ |
| D2 | Diamond Cut | First skill at Diamond rank |
| D3 | Platinum Section | Every skill in a section at Platinum+ |
| D4 | Frontier Ten | 10 Tier 5 questions correct |
| D5 | Twenty-Five Straight | 25 consecutive first-try correct at T4+ |
| D6 | Flawless Unit | A perfect Unit Quiz (15/15, all first-try) |
| D7 | Calendar Month | Every daily problem of a calendar month solved |
| D8 | Challenge Conquered | A Section Challenge with average outcome ≥ 0.8 |
| D9 | Unit Challenger | Complete all three Section Challenges of a unit |
| D10 | Prover | 10 free-response answers at 100% |
| D11 | Well-Rounded | Every response skill at Gold+ |
| D12 | Rigour | Platinum in the Proof response skill |
| D13 | Halfway There | ≥ 50% of milestone points on a monthly problem |
| D14 | Sharpshooter | 50 first-try correct at T4+ within one calendar week |
| D15 | Golden Unit | Unit rank Gold |
| D16 | Sunday Best | 8 Sunday daily problems solved first-try |
| D17 | Ascent | Raise one skill's θ by 300 within 7 days |
| D18 | Cross-Pollinator | 50 cross-skill problems correct |
| D19 | Steady Hand | 50 consecutive resolved questions at T3+ with outcome > 0 (no give-ups) |
| D20 | Annotator | Post solutions in 25 different daily/monthly discussions |
| D21 | 🔒 Counterexample | A confirmed report on a Tier 5 or Tier 6 question |
| D22 | 🔒 Contradiction | Solve a Tier 5 question first-try in a skill where you are Unranked |

#### Ruby (50 pts, 18)
| # | Name | Criterion |
|---|---|---|
| R1 | Bedrock | 2,000 correct at T3+ |
| R2 | Diamond Section | Every skill in a section at Diamond |
| R3 | Frontier Fifty | 50 Tier 5 questions correct |
| R4 | Fifty Straight | 50 consecutive first-try correct at T4+ |
| R5 | Platinum Unit | Unit rank Platinum |
| R6 | Century | 100-day daily-problem streak |
| R7 | Clean Sweep | A Section Challenge with every problem first-try correct |
| R8 | Master Prover | 50 free-response answers at 100% |
| R9 | Polished | Every response skill at Platinum+ |
| R10 | Fluent in Proof | Diamond in the Proof response skill |
| R11 | Quiz Machine | 10 perfect Section Quizzes |
| R12 | Diamond Ten | Diamond in 10 skills |
| R13 | Regular | At least one milestone on 3 consecutive monthly problems |
| R14 | Perfect Week | Every daily problem of a Mon–Sun week solved first-try |
| R15 | Frontier Streak | 5 consecutive Tier 5 questions first-try correct |
| R16 | 🔒 Taxicab | θ exactly 1729 in any skill after an update |
| R17 | 🔒 Clutch Appeal | An appeal that moves a score from below 60% to 100% |
| R18 | 🔒 Ouroboros | Reach Diamond in a skill after having dropped it to Tier 1 |

#### Tanzanite (100 pts, 16)
| # | Name | Criterion |
|---|---|---|
| T1 | Bedrock II | 5,000 correct at T3+ |
| T2 | Diamond Unit | Unit rank Diamond |
| T3 | Frontier Hundred | 100 Tier 5 questions first-try correct |
| T4 | Hundred Straight | 100 consecutive first-try correct at T4+ |
| T5 | Tier Six | Fully solve a monthly Tier 6 problem (all milestones) |
| T6 | Half-Year | 182-day daily-problem streak |
| T7 | Unit Sweep | All three Section Challenges of a unit at average outcome ≥ 0.9 |
| T8 | Diamond Mind | Every response skill at Diamond |
| T9 | Year Diamond | Both units of a year (1–2 or 3–4) at unit rank Diamond |
| T10 | Perfect Year | A perfect Unit Quiz in both units of a year |
| T11 | Grand Prover | 150 free-response answers at 100% |
| T12 | Top of the Month | Finish a calendar month #1 on the course θ leaderboard |
| T13 | 🔒 Grandmaster Opening | Reach Diamond in a skill within 20 questions of first opening it |
| T14 | 🔒 Contrapositive | Diamond in a skill while every one of its prerequisites is below Gold |
| T15 | 🔒 Fractal | Every skill, section and unit of a year at the same rank (Platinum or higher) at once |
| T16 | 🔒 Show Your Working | Solve every daily problem of a week first-try and post a solution in each one's discussion |

#### Vibranium (250 pts, 13)
| # | Name | Criterion |
|---|---|---|
| V1 | Course Diamond | Course rank Diamond |
| V2 | Ten Thousand | 10,000 correct at T3+ |
| V3 | Frontier Five Hundred | 500 Tier 5 questions correct |
| V4 | Triple Six | Fully solve 3 monthly Tier 6 problems |
| V5 | Orbit | 365-day daily-problem streak |
| V6 | Two Hundred Straight | 200 consecutive first-try correct at T4+ |
| V7 | Challenge Master | Every Section Challenge in the course at average outcome ≥ 0.9 |
| V8 | Diamond Everywhere | Every skill in the course at Diamond simultaneously |
| V9 | 🔒 Flawless Frontier | 25 consecutive Tier 5 questions first-try correct |
| V10 | 🔒 Lone Wolf | The only user to fully solve that month's Tier 6 problem (≥ 5 users attempted) |
| V11 | 🔒 QED | 15 consecutive free-response answers at 100% |
| V12 | 🔒 Unblemished | A calendar week with ≥ 100 questions, at least half T4+, every one first-try correct |
| V13 | 🔒 Speed of Thought | Fully solve a monthly Tier 6 problem within 72 hours of release |

#### Solarium (600 pts, 5)
| # | Name | Criterion |
|---|---|---|
| S1 | Six Suns | Fully solve 6 consecutive monthly Tier 6 problems |
| S2 | Five Hundred Straight | 500 consecutive first-try correct at T4+ |
| S3 | Total Mastery | Every skill and every response skill at Diamond, and every Section Challenge swept (all first-try) |
| S4 | 🔒 Diamond Hands | Hold Diamond in every course skill continuously for 90 days |
| S5 | 🔒 One Shot | Fully solve a monthly Tier 6 problem with a single submission |

#### Antimatter (1500 pts, 3)
| # | Name | Criterion |
|---|---|---|
| A1 | Annihilation | Fully solve 12 consecutive monthly Tier 6 problems |
| A2 | 🔒 Event Horizon | Reach the θ cap of 2300 in any skill |
| A3 | 🔒 Annus Mirabilis | A calendar year in which every daily problem is solved first-try and every monthly problem is fully solved |

Thresholds are starting values. Tune them after Phase 1 testing, keeping each tier's intended feel.

### 12.2 Leaderboards
Group-wide boards:
- achievement points;
- course θ / rank;
- daily streak;
- monthly Tier 6 scores, per course and year group;
- problems done: total, this week, today;
- **XP and global level** (§12.4): all time, this month and this week;
- **Elo per game mode** (§14.7): Frontline, Divide, Draft, Exam Board and Race;
- Race personal bests (§14.5).

### 12.3 Profile page
A public profile shows:
- display name, global level and tier badge (§12.4);
- course ranks, plus the tech tree as a read-only view;
- response-skill ranks;
- achievements, earned and secret;
- Elo per game mode, current and peak (§14.7);
- leaderboard positions.

### 12.4 Global level
One account-wide **level**, earned with **XP** from almost everything a student does. It scales slowly: an hour gets a new student a few levels, while **level 500+ is reachable by determined students**, roughly 900 hours of activity over an ATAR career. There is no level cap.

**Level curve.**
- The XP needed to go from level L to L + 1 is **50 + 2L**.
- So the total XP needed to reach level L is **(L − 1)(L + 50)**.
- The hours below assume about **300 XP per hour** of typical practice (tunable).

**Level tiers** use the same ladder as ranks and achievements, with Unranked called **Basic** here. The tier designs match the rank and achievement visuals (§12.1).

| Tier | Levels | Total XP to reach | ≈ Hours |
|---|---|---|---|
| Basic | 1–9 | 0 | 0 |
| Bronze | 10–24 | 540 | 2 |
| Silver | 25–49 | 1,800 | 6 |
| Gold | 50–99 | 4,900 | 16 |
| Platinum | 100–149 | 14,850 | 50 |
| Diamond | 150–199 | 29,800 | 100 |
| Ruby | 200–299 | 49,750 | 165 |
| Tanzanite | 300–399 | 104,650 | 350 |
| Vibranium | 400–499 | 179,550 | 600 |
| Solarium | 500–749 | 274,450 | 915 |
| Antimatter | 750+ | 599,200 | 2,000 |

**XP sources** (starting values, tunable):

| Activity | XP |
|---|---|
| Resolve a practice, quiz or challenge question | Correct: Tier 1 → 5, Tier 2 → 8, Tier 3 → 12, Tier 4 → 18, Tier 5 → 30. Wrong or given up: 2 (effort) |
| Free-response marked | 12 × tier × rubric score |
| Read a tutorial (first time per skill) | 20 |
| Finish a section quiz / unit quiz | +25 / +50 bonus |
| Finish a Section Challenge | +100 bonus |
| Solve the daily problem | 15 + 5 × tier |
| Score a monthly Tier 6 milestone | 50 per milestone |
| Rank up in a skill or response skill | Bronze 20, Silver 40, Gold 80, Platinum 140, Diamond 250 |
| Earn an achievement | 2 × its points |
| Play a Frontline game | 40, plus 20 for first place |
| Play a 1v1 minigame (Divide, Draft, Exam Board) | 25, plus 15 for a win |
| Play a Race game | 10, plus 5 for a win |
| Post a solution in a discussion | 10 (max 3 a day) |
| A report confirmed by auto-reverification | 25 |
| First visit of the day | 10 |

**Rules.**
- **XP per minute is roughly the same across tiers.** A Tier 4 question takes longer than a Tier 1 but pays more, so there is no XP reason to farm easy questions. Hard work is never punished.
- **Repeats pay once:** a question answered again within 30 days earns no XP.
- **Daily caps on quick or social sources:** discussion posts as above, and Race XP for at most 10 games a day.
- XP never decreases.

**Display.**
- The level and tier badge show next to the student's name in the header, on profiles, in lobbies and on leaderboards.
- A level-up shows a small toast. Reaching a new tier opens a **full-screen celebration** that stays until it's dismissed.
- **High tiers look like rewards.** Basic to Diamond use calm gems in the rank colors. The tiers above escalate:
  - **Ruby:** faceted, with a passing shine.
  - **Tanzanite:** shimmering facets and a twinkling star.
  - **Vibranium:** a moving metallic sheen and a pulsing glow.
  - **Solarium:** a radiant sun with turning rays.
  - **Antimatter:** a black core inside a swirling iridescent ring, with orbiting motes and a deep-space celebration.

  From Ruby up, the level number and progress bar also take on the tier's material. All motion respects reduced-motion settings. A preview of every tier is at `/dev/tiers`.
- XP has its own **leaderboard** (§12.2): all time, this month and this week.

**Storage.** Total XP lives on `users/{uid}` and is mirrored to `publicProfiles/{uid}` for leaderboards. Practice XP is computed client-side, so it falls under the accepted client-side trust risk (§18). Competitive XP is awarded by Netlify Functions.

---

## 13. Social

### 13.1 Solution discussions
- Discussions exist **only for daily and monthly problems**, and each thread is **open and visible the whole time**, including while the problem is live.
- **Not pushed at students:** problem screens, results and notifications never link to or preview discussions. Students reach them only through the **Discussions** page, which has search by date, problem and text.
- **Spoilers rely on good faith.** There is no automated spoiler blocking.
- **Spoiler tags:** `||label: hidden text||`, or `||hidden text||` without a label. Hidden text renders as a blurred block that is revealed on click. Hovering (or long-pressing on touch) shows a **tooltip with the author's label** describing what's hidden, e.g. "full solution to (b)" or "hint: consider parity". With no label, the tooltip says "Spoiler". LaTeX inside spoilers is supported.
- **Anyone** can post and comment. Posts support Markdown and LaTeX.

### 13.2 Moderation
- A **banned-words list** (slurs etc.) applies to posts, comments and display names, checked client-side and again in Firestore rules or a function.
- No other moderation for now, given the small group.

---

## 14. Competitive play (Phase 3)

Competitive play has one main mode, **Frontline** (2–6 players, territory and capture the flag), and four secondary 1v1 minigames: **Divide**, **Draft**, **Exam Board** and **Race**.

### 14.1 Principles
- **Depth over speed.** Every mode except Race has:
  - a fixed number of questions per player, not a fixed time;
  - a time limit per round or a time bank, never a reward for answering first;
  - simultaneous rounds wherever possible.

  Race is the deliberate exception: a short fluency drill at Tiers 1–2 only (§14.5).
- **Difficulty is a choice, never a dominant one.** Each mode balances tiers through risk, exposure, durability, time cost or position, so no tier is automatically best.
- **Answers count as practice.**
  - Every competitive answer updates the skill's θ, gates and response skills like normal practice.
  - Competitive questions allow **one attempt**: correct counts as a first-try solve, wrong as outcome 0.
  - The worked solution is shown when the game ends, not mid-game.
- **Every player has an Elo rating for every game mode** (§14.7): Frontline, Divide, Draft, Exam Board and Race. These ratings are separate from skill θ and never touch mastery ranks.
- **Question pool.**
  - Competitive modes draw from **the same question pool as normal practice**. There is no separate competitive bank, so every question written serves both.
  - Auto-marked questions only. Free-response is too slow to mark live.
  - The lobby sets the syllabus scope (section, unit or course) and, for Frontline, the map.
  - Questions are drawn from that scope at the tier each action needs, preferring ones no player in the game has seen.
  - Questions answered in a game count as seen for practice selection too (§5.7), and questions hidden after a confirmed report are excluded (§11.5).
  - Competitive play needs deep pools, which is why it comes after Specialist Units 1–4 have full content.
- **Live and correspondence play.**
  - Frontline, Divide, Draft and Exam Board can be played **live** (round timers) or by **correspondence** (one round per day).
  - Race is live only.
- **Lobbies:** private games joined by invite link or code. No public matchmaking for now.

### 14.2 Frontline: maps and setup
A territory and capture-the-flag strategy game for 2–6 players, inspired by territorial.io and openfront.io. Players command troops on a fixed hex map to take territory, raid enemy headquarters and carry flags home.

**Maps.** There are exactly three, each hand-designed, fixed and balanced, so map knowledge is part of the skill.

| Map | Players | Hexes | Spawns | Relics | Rounds | Length |
|---|---|---|---|---|---|---|
| Small | 2–3 | ~25 | 4 | 1 | 6 | ~12 min |
| Medium | 3–4 | ~45 | 6 | 3 | 8 | ~16 min |
| Large | 5–6 | ~75 | 9 | 5 | 10 | ~20 min |

**Terrain is difficulty.** Every hex has a fixed tier, like elevation. Any question asked in a hex is at that hex's tier. The skill comes from the lobby's syllabus scope.

| Terrain | Tier | Troops per round | Defense bonus |
|---|---|---|---|
| Lowland | 1 | +1 | none |
| Hills | 2 | +2 | +15% |
| Highland | 3 | +3 | +30% |
| Peak | 4 | +5 | +50% |
| HQ | n/a | +3 | +50% |

**Spawns.**
- Each map has more spawns than its maximum player count.
- Spawns differ in character but have roughly equal total value. Example archetypes:
  - **Coast** (mostly lowland): fast and cheap early expansion, low income, many approaches.
  - **Valley** (hills, central): best access to relics, contested from several sides.
  - **Ridge** (highland/peak): rich and defensible, but slow to expand, with a single exit pass.
- Spawns nobody picks become neutral territory.

**Spawn draft.**
- Players pick spawns in order of **lowest Frontline Elo first**. Picks are visible, with about 20 seconds per pick.
- The choice draws on the player's comfort tiers, map knowledge, and the visible ranks of their opponents. Counter-picking adds replayability.

**Map data and balance.**
- Maps are data files: each hex's coordinates and terrain, plus spawns, relics, HQ positions and the edge ring for each round. They live in `content/frontline/maps/`, carry a version number (e.g. `medium@1.2`), and are edited with a small map editor.
- Before release, bot simulations at a range of skill levels play each spawn thousands of times and flag outlier win rates.
- After release, win rate by spawn and rating band is tracked, and maps are retuned by publishing a new version.

**Optional loadout** (lobby setting, off by default):
- Each player picks 4 skills before the game.
- Their Claim, Fortify and Rally questions come from their own loadout.
- Assault questions come from the defender's loadout.

**Optional handicap:** Rally payouts scaled to each player's own rating, so every tier has equal expected value (§14.1).

### 14.3 Frontline: rounds and actions
**Rounds.**
- Rounds are simultaneous and **2 minutes** long (tunable; Tier 4-heavy play may need 2.5).
- During a round each player acts whenever they like. All orders resolve together at the end of the round.
- Each player answers **exactly one question per round**. Finishing early gives planning time only.

**Each round, a player chooses one action**, which determines their question:

| Action | Question tier | Effect |
|---|---|---|
| **Claim** | Target hex's tier | Take an adjacent neutral hex, moving at least 1 troop in. |
| **Assault** | Target hex's tier; on a locked hex, the lock's own question | Attack an adjacent enemy hex. Correct: attack ×1.5. Wrong: ×0.75. A lock is broken only by a correct answer. |
| **Fortify** | Own hex's tier | Place a lock on the hex, or replace an existing one (below). |
| **Rally** | Player's choice, Tier 1–4 | Gain emergency troops: Tier 1 → 2, Tier 2 → 3, Tier 3 → 5, Tier 4 → 7. |

**Moves need no question.**
- Each player gets **3 moves per round, plus 1 for every 5 hexes owned**.
- A move shifts troops between adjacent owned hexes, or sets up an attack from an owned hex.

**Locks.**
- To lock a hex at Tier t, the defender must solve a Tier t question themselves. **That exact question becomes the lock.**
- An attacker must answer **the same question** correctly to break the lock. A lock is literally "solve what I solved".
  - If the question is a parameterized template, the attacker gets the same variant.
- If the attacker fails, the attack bounces: the attacker loses half the attacking troops and the defender loses none.
- **Failed attempts wear a lock down.** An attacker who has failed a lock has seen its question, so a siege gets easier over time. No answer or solution is revealed mid-game (§14.1), so the attacker still has to work it out. The defender can **re-fortify** to replace the question with a fresh one at the hex's tier, which costs their round's action.
- A lock lasts until it is broken or replaced. A broken lock is gone, and the captured hex starts unlocked.

**Combat** (all values tunable).
- Attack strength = troops × assault multiplier × (1 + streak bonus) (§14.4).
- Defense strength = troops × (1 + terrain defense bonus).
- **If attack beats defense:**
  - the hex is captured;
  - surviving attackers = attacking troops × (1 − defense ÷ attack), rounded up;
  - plunder = half the defender's troops in that hex, added to the attacker.
- **If attack doesn't beat defense:**
  - the attacker loses half the attacking troops;
  - the defender loses troops × attack ÷ (2 × defense), rounded down.

**Resolution order each round:**
1. Moves.
2. Assaults, strongest first, so several attacks on one hex resolve in turn.
3. Claims. If two players claim the same hex, the higher tier solved wins; at equal tiers the claim fails for both.
4. Income from territory.
5. Relic points.

### 14.4 Frontline: snowballing, flags and scoring
**Snowballing is intended and available to everyone.** These engines compound:
- **Territory:** more hexes produce more troops, which take more hexes.
- **Command:** extra moves for larger empires.
- **Plunder:** capturing hexes takes troops.
- **Flag spoils:** capturing a flag gives an immediate troop burst, half the sacked HQ's garrison.
- **Hot streak:** consecutive correct answers boost Assault strength and Rally troops. The bonus **doubles with each correct answer** and caps at a 5-answer streak. A wrong answer resets it.

  | Streak | 1 | 2 | 3 | 4 | 5+ |
  |---|---|---|---|---|---|
  | Bonus | +2% | +4% | +8% | +15% | +30% |

The streak rewards accuracy, not speed. Spawn archetypes peak at different times (Coast early, Valley mid-game, Ridge late), so the lead changes hands as different engines kick in.

**Bounty on the leader.**
- The current leader is marked with a visible crown.
- Each successful assault on a leader's hex gives **+2 points and double plunder**.
- Capturing the leader's flag scores **+8** instead of +5.

The leader feeds everyone else's snowball, which keeps the game swingy and gives trailing players a target.

**Flags.**
- Each HQ holds a flag.
- **Capturing an HQ:**
  - the HQ is **sacked**: it loses half its garrison and can't be re-flagged for 2 rounds;
  - a visible **flag carrier** spawns with the attacking survivors, moving 1 hex per round;
  - carrying it to the capturer's own HQ **banks** it.
- Intercepting a carrier (capturing its hex) returns the flag to its owner.
- Players are **never eliminated**. A sacked HQ keeps producing income and can be retaken.

**Late game.**
- **Relics** pay +2 points per round to whoever holds them.
- At 75% of the rounds, the map's outer edge ring **collapses**. Those hexes become impassable, and troops on them are lost unless moved inward that round.
- **Exact scores are hidden** until the final quarter of rounds; only the leader's crown is visible before then.

**Scoring** (at game end):

| Source | Points |
|---|---|
| Flag held or being carried | +5 each (+8 for the leader's flag) |
| Flag banked at your HQ | +10 each (+13 for the leader's flag) |
| Relic | +2 per round held |
| Territory | +1 per 3 hexes |
| Leader bounty | +2 per successful assault on the leader |

Final placement updates every player's Frontline Elo (§14.7). Ties in placement are broken by banked flags, then territory.

### 14.5 1v1 minigames
Each minigame has its own Elo (§14.7), updated after every game. Except for Race, each uses a time bank per player (chess clock). Points are each question's tier unless stated otherwise.

**Divide** (fair division, about 12–16 min).
- **Each round** (2 rounds):
  1. **Reveal:** 6 problems from Tiers 1–4, with full stems visible.
  2. **Divide:** the **Divider** (alternating each round) splits them into two piles of any size.
  3. **Choose:** the **Chooser** takes one pile, and the Divider gets the other.
  4. **Solve:** both solve their piles at the same time.
- **Steal:** a player may spend clock time attempting a problem their opponent failed, for half points.
- **Strategy:**
  - make piles you value equally but your opponent values unequally (their ranks are visible);
  - plant problems you can solve where a failure lets you steal;
  - weigh pile size against your time bank.

**Draft** (pick and assign, about 12–15 min).
- **Setup:** 8 problems laid face-up, with skill, tier and full stem visible.
- **Draft:** players alternately take one, assigning it **to their own set or to their opponent's**, until each set has 4.
- **Solve:** both solve their sets at the same time.
- **Scoring:** points are scaled to the solver's rating (correct scores (1 − p) × 10, where p is the solver's probability of success; wrong scores 0), so dumping a hard problem on a strong opponent can hand them points.
- **Strategy:** every pick is a trade-off between keeping a question you're sure of and sending one your opponent is weak at.

**Exam Board** (paper construction, about 12–15 min).
- **Pool:** 14 problems with visible stems and ratings, spanning a unit's sections.
- **Build:** each player secretly builds a 4-question paper for the other, under these constraints:
  - total rating no more than 4 × 1500;
  - at least one question per section in scope;
  - at least one Tier 1–2 question.
- **Appeal:** on receiving the paper, the sitter may swap **one** question for any unused pool question of equal or lower rating.
- **Sit:** both sit their papers at the same time.
- **Strategy:**
  - set questions with the biggest gap between their rating and *this* opponent's ability in that skill;
  - anticipate the appeal, for example with a decoy;
  - read what the opponent left in the pool.

**Race** (fluency minigame, 3 min, live only).
- **Questions:** both players get the **same stream of Tier 1–2 questions** from the lobby's scope, in the same order.
- **Scoring:**
  - correct +1;
  - +1 bonus for every 5 correct in a row;
  - wrong −1 plus a 3-second lockout, which discourages guessing.
- **Display:** a tug-of-war bar shows the margin.
- **Winning:** most points at 3:00 wins. Ties go to sudden death.
- **Solo mode:** with no opponent online, a player can race their own best run (a "ghost").
- **Ratings and records:** head-to-head games update Race Elo; solo ghost runs don't. Race also keeps personal bests.
- **Why speed is allowed here:** Race is the one place where speed matters, deliberately limited to retrieval-level questions, as a warm-up and fluency drill.

### 14.6 Architecture for competitive play
- **Server-checked.** In games, answers are checked and recorded by Netlify Functions, which also resolve every round, so the game state can't be edited by a client.
  - Because competitive questions share the practice pool, their answer keys are in the public content bundle. A determined player could look one up mid-game.
  - This is accepted for a small group, like the client-side trust risk (§18). If it becomes a problem, the fix is to move all answer keys server-side.
- **Functions:**
  - **create/join game**;
  - **submit answer:** checked on the server, recording the outcome;
  - **resolve round:** run when every player has submitted, or by a scheduled function when the round timer expires.
- **Firestore:**
  - `games/{gameId}`: mode, map version, scope, players, round and state;
  - `games/{gameId}/orders/{uid_round}`: each player's orders, written by that player and validated by the resolver;
  - only functions write game state.
- **Live updates:** clients follow game documents with real-time listeners.
- **Netlify credits:** functions use a small amount of compute, well within the free plan's credits (§16.5). No extra production deploys are needed.
- **Balance tooling:** an offline script runs bot simulations of Frontline maps (§14.2).

### 14.7 Elo ratings
Every player has an Elo rating **for each game mode**: Frontline, Divide, Draft, Exam Board and Race. Every completed game is rated, live or correspondence.

**Parameters** (tunable):
- Everyone starts at **1200**.
- The step size **K is 40 for a player's first 15 games** in that mode, when the rating is **provisional** and shown with a "?". After that, K is **24**.
- Ratings never go below 100.

**1v1 modes** (Divide, Draft, Exam Board, Race) use standard Elo:
- expected score E = 1 / (1 + 10^((R_opponent − R_self) / 400));
- the new rating is R + K × (S − E), where S is 1 for a win, 0.5 for a draw and 0 for a loss.

**Frontline** (2–6 players) uses **pairwise Elo by placement**.
- Every pair of players is treated as a virtual match: the higher-placed player wins, and equal placement is a draw.
- Each player's change is (K ÷ (N − 1)) × Σ over opponents of (S − E), where N is the number of players. This keeps a 6-player game's swing comparable to a 1v1.

**Display and storage:**
- Elo shows next to names in lobbies, on profiles (current and peak, per mode) and on per-mode leaderboards (§12.2).
- Ratings live in `users/{uid}/ratings/{mode}` (rating, games played, peak, provisional) and are written only by Netlify Functions, never by clients (§14.6).
- Elo is shared across all courses for now. If course scope turns out to matter, ratings could be split per course later (§18).

---

## 15. UI / UX

### 15.1 Visual identity
- **Spelling:** all product copy, content (tutorials, questions, solutions, skill names) and code use standard **American** spelling (practice, color, center, factored, modeling). Mathematical notation still follows WACE conventions (§3.2).
- **Copy is minimal:** labels over sentences, no explanatory filler on screens; show a number or a status rather than describe it.
- **Non-learning information is data, not sentences.** Design rule, applied everywhere (screens, tutorials, questions, emails): metadata such as dot points, prerequisites, counts, dates, statuses and modes is shown as a bare label, list or chip, never wrapped in a sentence. Write "1.2.2, 1.2.3", not "Dot points 1.2.2 and 1.2.3."; "Local mode · saved in this browser", not "Local mode: progress is saved in this browser."; "No questions yet" with no full stop. Full sentences are reserved for learning content: explanations, worked solutions and feedback.
- **Clean and academic:** light theme, minimal, plenty of white space. In the spirit of Khan Academy or Brilliant, but the design is original.
- Rank colors are the main accent: Unranked gray, Bronze, Silver, Gold, Platinum, Diamond.
- Typography is tuned for math: KaTeX output, and math fields at matching sizes.

### 15.2 Home = the tech tree
- After login, the student lands **directly on the course tech tree**. A course switcher sits at the top.
- **Vertical tech tree** (strategy-game style). The draft preview is at https://claude.ai/artifact/VhcVGyVCy3CTTMBeRBUmth.
  - **One map per course:** Year 11 sits above Year 12, and units are stacked top to bottom.
  - **Branching layout:** each unit is a layered graph (dagre-style, with crossing minimization). Sections are compound clusters drawn as soft regions, **not** linear columns, so skills branch the way their prerequisites do.
  - **Nodes are circles** filled with the rank color (Unranked is a hollow ring), with a short label under each. Keep on-map text minimal.
  - **Edges** are suggested prerequisites. Links from earlier units appear when a skill is hovered or selected, and hovering traces the full chain up and down. Cross-course prerequisites appear in the skill panel.
  - **Selecting a skill** opens a compact panel: name, rank, score, θ, summary, suggested first, leads to.
  - Section and unit rolled-up ranks show on the region and unit labels.
- **Table view toggle:** a sortable table of Unit / Section / Skill with rank, score, θ, gate progress (e.g. "Platinum gate 2/3") and question counts.
- The daily problem and monthly problem appear as persistent cards or a side panel on the tree screen.

### 15.3 Skill page
- Shows rank, score, θ, gate progress per rank, dot points covered, suggested prerequisites (with their ranks, for information only), and recent attempts.
- **Learn** opens the skill's tutorial (§3.2): a clean reading view with glossary hovers and links to prerequisite tutorials. It is offered prominently on a student's first visit to a skill, but never required.
- **Start practicing** is the main action. On first visit it offers a tier chooser (default Tier 3). **Drop a tier** is also available here.
- Entry points to the section quiz, unit quiz and Section Challenge.

### 15.4 Problem screen
- **Header:** tier, rating, calculator flag, skill(s).
- **Body:** stem, diagram, and answer inputs per part.
- Attempts remaining, **Submit**, **Give up**.
- **After resolving:** worked solution; Δθ and score change; rank and achievement toasts; Report issue; Next.
- A small **Tutorial** link opens the skill's tutorial in a side panel (bottom sheet on phones) without leaving the question.
- Free-response pending state: "Marking…", with a BYO-key nudge.

### 15.5 Other screens
- **Profile, Leaderboards, Discussions** (daily/monthly; searchable, never linked from problem screens).
- **Settings:** display name; BYO key per provider (stored locally; test-key button); stylus on/off.
- **Onboarding:** pick course + year, then a short tour of the tree, tiers, ranks and gates, and the 0–100 score. All skills start Unranked.

### 15.6 Platform and accessibility
- Responsive web app, desktop-first but usable on phones and tablets. Stylus input is supported on tablets.
- Keyboard-navigable; MathLive's accessible math (speech output) enabled; color is never the only rank signal (labels and icons too).

---

## 16. Architecture

### 16.1 Stack
| Layer | Choice |
|---|---|
| Frontend | **SvelteKit** (TypeScript), static adapter |
| Native (later) | **Capacitor** wrapping the same build |
| Math | MathLive (input), CortexJS Compute Engine (parse/eval), KaTeX (render) |
| Handwriting | MyScript iink (free tier) |
| Auth | Firebase Auth (Google + email) |
| Database | Cloud Firestore (Spark free plan) |
| Hosting | **Netlify** (static site + CDN for content bundles) |
| Server functions | **Netlify Functions**: `/api/mark`, `/api/report` (hold the Gemini key and GitHub token as env vars); Phase 3 adds game creation, server-side answer checking and round resolution (§14.6) |
| Offline tooling | Node/TS scripts + Python (SymPy) for verification |

### 16.2 Client-side logic
Answer checking, θ updates, rank, gate and roll-up computation, question selection and achievement evaluation all run **on the client**. Results are then synced to Firestore. Firestore security rules ensure a user can only write their own documents.

### 16.3 Firestore data model (sketch)
```
users/{uid}                                              profile, settings, course enrollments, total XP (§12.4)
users/{uid}/ratings/{mode}                               Elo per game mode, written by functions only (§14.7)
users/{uid}/courses/{course}                             rolled-up ranks (for the hidden buffer)
users/{uid}/courses/{course}/skillStates/{skillId}       θ, rank, gateCounts[1..6], seen ids, counts
users/{uid}/courses/{course}/responseSkillStates/{rsId}  θ, rank, gateCounts
users/{uid}/courses/{course}/attempts/{attemptId}        question id/version/variant, answers, outcome, Δθ, ts
users/{uid}/markingJobs/{jobId}          pending/complete, provider, result, appeal
users/{uid}/achievements/{achId}         earnedAt
users/{uid}/stats                        achievement counters (streaks, per-tier counts)
users/{uid}/challengeProgress/{sectId}   Section Challenge progress
publicProfiles/{uid}                     display name, ranks, achievement points, leaderboard aggregates
daily/{yyyy-mm-dd}                       problem id; submissions/{uid}
monthly/{yyyy-mm}/problems/{course-year} problem id; submissions/{uid} (best milestones, writing history, follow-up answers, signals, moderation status)
discussions/{problemKey}/posts/{postId}  body, author, ts; comments/{commentId}
hiddenQuestions/{questionId}             reason, ts
reports/{reportId}                       question id, note, verdict
```

Leaderboards query `publicProfiles` directly, which is fine at small-group scale.

### 16.4 Repository layout (proposed)
```
apps/web/              SvelteKit app
packages/engine/       rating, selection, ranks, roll-up, achievements (pure TS, unit-tested)
packages/checker/      answer checkers + form rules
packages/diagrams/     diagram spec → SVG
content/curriculum/    <course>/<version>.yaml + maps/ (version-to-version skill maps)
content/syllabus/      source PDFs (gitignored)
content/questions/     <course>/<unit>/<section>/<skill>/*.yaml
content/tutorials/     <course>/<skillId>.md (one per skill) + glossary built from them
content/achievements.yaml
scripts/               ingest-syllabus, generate, verify (SymPy), build-content
netlify/functions/     mark, report
```

### 16.5 Free-tier budget notes
- Firestore Spark: 50k reads / 20k writes per day. That's comfortable for a small group, because content is served from the CDN, not Firestore.
- Netlify free plan: 300 credits a month. Each production deploy costs 15, so merging to `main` is the release step and doc-only changes skip the build (`netlify.toml`). Functions (marking, reports, Phase 3 game rounds) use a small amount of compute credit.
- Gemini free tier: rate-limited, so the client retry queue absorbs bursts.
- MyScript: shared monthly quota, with a keyboard fallback when it runs out.

---

## 17. Phasing

| Phase | Deliverable |
|---|---|
| 0: Framework | Repo scaffold, engine + checker packages with tests, content schema + build, auth, tech tree + table view, problem screen, Firestore sync |
| 1: Specialist Unit 1 (full depth) | Curriculum for all of Specialist; Unit 1 tutorials (one per skill) and questions at full depth (15–30 per skill); glossary; LLM marking; quizzes; Section Challenges; daily problem; achievements; global level and XP; leaderboards; discussions. **Owner tests before continuing.** |
| 2: Specialist Units 2–4 | Tutorials and questions for the remaining units; school calendar file; first monthly Tier 6 problems (Year 11 and Year 12) |
| 3: Competitive play | Frontline (three maps, spawn draft, server-resolved rounds), the 1v1 minigames Divide, Draft, Exam Board and Race, Elo ratings for every mode, server-side answer checking for competitive questions (§14) |
| 4: Methods | New curriculum + content; cross-course prerequisites become live links |
| 5: Chemistry, Physics | Science-specific answer types (see §18) + content |
| 6: Native apps | Capacitor iOS/Android builds |

---

## 18. Open questions, risks and decisions

**Resolved**
- *Drop a tier:* non-destructive selection shift (§5.3, §5.7). Rank loss only happens through the hidden per-rank buffer (§5.4).
- *Gate threshold:* outcome > 0.6 (§5.4).
- *Score anchor:* reference rating 1500 (§5.2).
- *Monthly free-tier cap:* generous (20 per day to start), tuned as usage shows (§8.6).
- *LLM strictness:* the marker and appeal prompts are strict (§10.1, §10.3).

**Accepted risks (handle as they come)**
1. **Free-tier fragility:** Gemini and MyScript free tiers can change or vanish. Mitigations are the BYO key and keyboard fallback.
2. **Same-model appeals:** these can still be swayed by a persuasive wrong argument despite the strict prompt. Monitor appeal outcomes.
3. **Syllabus changes:** the Methods review may resurface. The versioning infrastructure (§3.1) is built for it.
4. **Client-side trust:** practice ratings and leaderboards can be spoofed by a determined user. This is accepted for a small group; revisit if the platform opens up. Competitive games are checked and resolved on the server, but their questions share the public practice pool, so answer keys can still be looked up (§14.6).

**To tune in Phase 3 playtesting**
- Frontline: round length, troop yields, multipliers, combat losses, streak cap, leader bounty and edge-collapse timing (§14.3, §14.4).
- Frontline map balance: spawn values, checked by bot simulation, then live win rates (§14.2).
- Minigame lengths, Race lockout and bonus values (§14.5).
- Elo K-factors and provisional period (§14.7); whether Elo should be split per course.

**To tune in Phase 1**
- XP values and the ~300 XP/hour assumption, checked against real usage so that level 500 stays at roughly 900 hours (§12.4).

**Owner to specify later**
- **Science answer types** (before Phase 5): unit-aware numeric answers, significant-figure rules, chemical formula and equation input, balanced-equation checking.
