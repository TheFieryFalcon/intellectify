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
- All defined terms feed a course **glossary**. Wherever a glossary term appears in a tutorial, question or solution, hovering or tapping it shows the definition. **Implemented:** the first mention of each term (or its plural) in any rendered text is underlined with a dotted line; hover, tap or keyboard focus shows the term and its definition. A student's own written answer gets no hovers.
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

### 3.3 Skill sizes
Every skill has a **size**, set in the curriculum file. Bigger skills are foundational (many skills build on them), difficult, or heavily examined, so they get more questions and take more to rank up.

| Size | Tree node | Questions (min) | Tier 5 (min) | Extra correct answers per rank gate (§5.4) | θ speed |
|---|---|---|---|---|---|
| Small | small circle | 10 | 3 | +0 | ×1 |
| Medium | circle | 15 | 4 | +0 | ×1 |
| Large | small diamond | 25 | 5 | +1 | ×0.85 |
| Cornerstone | large diamond | 40 | 7 | +2 | ×0.7 |

- There is **no maximum**: a skill that deserves more questions gets them.
- "θ speed" scales K in the rating update (§5.1), so θ moves more slowly in bigger skills and each rank takes more questions to earn.
- Size is a judgment call, led by **how often exams test the skill**, then its difficulty. Specialist's Cornerstones: proof methods, permutations, combinations, the scalar product, displacement/force/velocity, converses and circle problems, complex arithmetic and induction.
- **First-order foundations that exams rarely test on their own** (counting principles, vectors as directed line segments, component form, logic, matrix arithmetic, 3D vector algebra, …) are **Small**, even though everything builds on them. Their questions stay; only the rank requirements drop.
- The content build warns when a skill with questions is below its size's minimums.
- **Geometry is mostly written proofs.** In every Geometry skill (logic, proof methods and the circle theorems), at least 55% of practice questions are written (rubric-marked, §10). The auto-marked questions stay for quick checks. Written questions name their rubric dimensions as response skills (§5.6): Proof for structure, Reasoning for deductive steps, Clarity and Precision for the write-up.

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
- Content mix per skill: at least **10–40 questions** depending on skill size (§3.3), with no maximum. Tiers 1–2 need only a couple of items each, since they are mostly parameterized templates where only the numbers change. The bulk of authored items sit in **Tiers 3–5**. A parameterized template counts as one item.

---

## 5. Rating and mastery engine (Alcumus-style)

### 5.1 Student ability θ
- Each student has an ability **θ per skill**, on the same 1000–2000 scale as questions. θ may go outside the scale; clamp it to [800, 2300].
- Probability of a correct answer: `P(correct) = 1 / (1 + exp(-(θ − d) / S))`, with `S = 100` (tunable).
- Update after a question resolves: `θ ← θ + K · w · (outcome − P)`
  - `outcome ∈ [0, 1]` (§6.2 credit rules)
  - `K = 32` × the skill-size speed (§3.3); tunable, and constant over time, so there is no provisional fast-moving phase
  - `w` = skill weight: 1.0 for the primary skill, 0.5 for secondary skills on cross-skill problems

### 5.2 Displayed numbers (everything is visible)
- **Score (0–100)**, the Alcumus-style headline number: `round(100 · P(correct on a reference question of rating 1500))`. It is anchored to a fixed reference in the middle of Tier 3 (a typical exam question), so a score of 50 reads as roughly "exam-ready", and it stays stable as content is added. The reference rating is configurable.
- **Raw θ** is shown next to the score.
- **Question rating `d`** and tier are shown on every question.
- **Δθ** is shown after every answer, e.g. "+14 → 1523".

### 5.3 Placement
- **Onboarding** asks once for the student's **most recent maths mark** (0–100%) and **where it is from**: Year 10, Year 11 Methods, Year 11 Specialist, Year 12 Methods or Year 12 Specialist. That sets a starting tier **per course**.
- Methods questions sit **a tier below** Specialist ones, so **Methods always starts one tier above Specialist** (capped at Tier 5).

  | Mark | Specialist or Year 10 mark → Specialist | Methods mark → Methods |
  |---|---|---|
  | under 40% | Tier 1 | Tier 1 |
  | 40–59% | Tier 2 | Tier 2 |
  | 60–74% | Tier 3 | Tier 3 |
  | 75–89% | Tier 4 | Tier 4 |
  | 90–100% | Tier 4 | Tier 5 |

  The other course follows from the one-tier shift (e.g. a 95% Methods mark: Methods Tier 5, Specialist Tier 4). A **Year 10** mark starts **one tier lower** (never below Tier 1).
- On first opening a skill, θ is set to the **floor of the starting tier's band** (e.g. Tier 4 → 1550) and then updates at normal speed. There is no per-skill tier chooser.
- At any time the student can **drop a tier**. This is a **non-destructive selection shift**: θ, rank and gates are untouched, and question selection (§5.7) targets the tier below the one θ currently sits in. The student can switch it off at any time. θ keeps updating normally, and easier questions naturally give smaller gains.
- Placement sets θ only. **Gate counts start at zero**, so placement alone never grants a rank.

### 5.4 Ranks
Ranks per skill: **Unranked → Bronze → Silver → Gold → Platinum → Diamond**. **Diamond = "Mastered".**

| Rank | Requires θ ≥ | AND gate (Small/Medium skill) |
|---|---|---|
| Bronze | 1000 | ≥ 3 correct at Tier 1 or higher |
| Silver | 1250 | ≥ 3 correct at Tier 2 or higher |
| Gold | 1400 | ≥ 3 correct at Tier 3 or higher |
| Platinum | 1550 | ≥ 3 correct at Tier 4 or higher |
| Diamond | 1700 | ≥ 3 correct at Tier 5 or higher |

- Rank floors match the tier floors (§4).
- **Skill size adds to every gate** (§3.3): +1 for Large skills and +2 for Cornerstone skills. Response skills use the Small/Medium numbers.
- **Ranks are earned in order:** rank *k* also needs every lower rank's floor and gate.

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

`Calculation` · `Reasoning` · `Reading & interpretation` · `Proof` · `Clarity of expression` · `Precision of language` · `Synthesis` (list is configurable)

**Tagging rules** (the content build enforces the first four):

| Response skill | Tag when the question… |
|---|---|
| Every question | has at least one response skill |
| Calculation | has a computed answer (anything but MCQ or multi-select) |
| Synthesis | is cross-skill (has secondary skills), or combines several results at Tier 4–5 |
| Rubric dimensions | each rubric criterion's dimension is also listed in `responseSkills` |
| Reasoning | needs a chain of deductions: choosing which result applies and justifying each step (angle chasing with reasons, case analysis, complements, logical deduction) |
| Proof | asks for a written proof; rubric criteria on proof *structure* (the setup, the assumption, the contradiction or contrapositive, a case split that covers every case, the conclusion) |
| Reading | turns words, a diagram or notation into mathematics |
| Clarity, Precision | grades how the answer is written (rubric only) |

In a rubric, a deductive step ("so ∠XAC = ∠XDB") is a Reasoning criterion, and the structure of the proof is a Proof criterion. A "prove that" question always keeps at least one Proof criterion: the step that completes the argument.

- **Auto-marked questions** carry a coarse difficulty per response skill they exercise, e.g. `{calculation: 1500, reading: 1300}`. A tier-level value is fine. The question's outcome updates each listed response skill against that difficulty.
- **Free-response questions** use **rubric dimensions** that map to response skills. Each dimension is scored separately and updates its response skill using that dimension's score as the outcome.
- Response-skill gates use the tier of the response-skill difficulty, not the question's content tier.

### 5.7 Question selection
- Target success probability **P\* ≈ 0.65**, the Alcumus-like "edge of ability" (tunable). The ideal rating is `d* = θ − S·ln(P*/(1−P*))`.
- Choose from the skill's pool by closeness to `d*`, with a soft weighting so sessions vary.
- **No repeats near the student's level (implemented):** while any unseen question lies within **±150** of `d*` (`noRepeatBand`), only unseen questions in that band are served. Once the band is used up, repeats are allowed, avoiding the last 20 questions; a repeat near `d*` is preferred over a new question far from it. A repeat comes with a freshly picked variant and words (§9.3, §9.6), so it rarely reads the same.
- "Seen" means answered (the last 200 per skill are stored), plus written answers still waiting in the marking queue.
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

**Multi-part questions:** ratings are **per part**. A part may have its own `rating`; parts without one use the question's. The question's rating is always its **hardest part's** (the build enforces this), so adding an easy part never lowers it. Selection, tier labels and Challenge grades use that headline rating.
- Each part has its own tier, so its own attempts and attempt credit.
- θ updates part by part, all from the same starting θ: Δθ = K·Σ (marks share) × (part outcome − P(correct at that part's rating)). With one part, or parts sharing one rating, this is exactly the single update.
- Each part counts toward the rank gate at its own tier.
- The question's overall outcome (shown, and used for response skills and XP) is the mark-weighted mean of the part outcomes.
- Written parts are scored the same way: the marker returns each part's score, and appeals revise part by part.

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

### 8.1a Review pools
- Section quizzes, unit quizzes and Section Challenges draw from **their own authored pools**, never from practice. A question's `pool` field (`section-quiz`, `unit-quiz` or `challenge`; default `practice`) decides where it is served. The build writes `reviews/section-<id>.json` (`sectionQuiz`, `challenge`) and `reviews/unit-<n>.json` (`unitQuiz`).
- **Pool sizes** (the build warns below these):

  | Pool | Size |
  |---|---|
  | Quiz pools | at least 2× the quiz's mix in every tier |
  
- Challenge problems must be Tier 4–5 (a build error otherwise). A Section Challenge is a fixed sequence, not a pool (§8.4).
- Pools include **written** (rubric-marked) questions. These are marked in the background (§10.2). The quiz summary and the Challenge average fill in as marks arrive, and quiz and Challenge achievements wait until every answer is marked.

### 8.2 Section quiz
- **8 questions**, fixed mix: 2×T1, 2×T2, 3×T3, 1×T4, drawn across the section's skills.
- Every question updates θ for its skill. An end summary shows score per skill and rank changes.

### 8.3 Unit quiz
- **15 questions**, fixed mix: 2×T1, 4×T2, 6×T3, 3×T4, drawn across the unit.
- Both quiz mixes are **config-driven**. Questions are spread round-robin across the skills, falling back to the nearest tier when a tier runs short, and served easiest first. After each question the solution is shown.
- Section quiz, unit quiz and Section Challenge are linked from every skill page (§15.3), and they are on the map. Each section's quiz (a checklist tile) and Challenge (a summit tile, showing the best result) sit at the foot of the section. Each unit's quiz (a star badge) sits below the unit.

### 8.4 Section Challenge
- A **fixed, authored sequence of 10–15 problems** per section; the count scales with section size (its dot points, clamped to 10–15). There is no pool and no random picking: every student meets the same problems in the same order.
- Problems are **unconventional**: synthesis across the section's skills, often with tools the course doesn't name, e.g. proofs about matrices, coordinates, tilings or grids. Any notation they use is defined in the question.
- **Graded like slopes, and served in rising order:**

  | Grade | Rating | Mark |
  |---|---|---|
  | Green | 1550–1699 (Tier 4) | circle |
  | Yellow | 1700–1849 | square |
  | Red | 1850–1949 | triangle |
  | Black | 1950–1999 | diamond |

  Each Challenge ends on **exactly one black problem**. The build enforces the length, the rising order and the single black finale, and warns if a grade is missing or fewer than a third of the problems are cross-skill.
- **Later-unit content.** A problem may draw on a later unit of the **same year**, declared by `requires` (section IDs, e.g. `requires: [matrices]`). The problem shows "Uses Unit 2 · Matrices" and can be **skipped**: a skipped problem changes no θ and is left out of the average, though it rules out a first-try sweep. The build rejects `requires` outside Section Challenges, on a section that isn't in a later unit, and **any Year 11 Challenge problem that requires Year 12 content**.
- **Untimed**, and progress is saved across sessions. "Try again" restarts the same sequence; the best average is kept.
- **Soft gate:** always available. If any skill in the section is below Gold, a "Recommended at Gold" warning appears before starting.
- Each problem has one **primary skill** (full update) and secondary skills (0.5× update).

### 8.5 Daily problem
- **Same problem for everyone**, changing at midnight **Australia/Perth**.
- Crossword-style weekly ramp:

  | Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
  |---|---|---|---|---|---|---|---|
  | Tier | 1 | 2 | 2 | 3 | 3 | 4 | 4 |

- **One per year group (implemented):** a Year 11 and a Year 12 problem each day, each targeting **the block its year group has just learnt**. Course outlines live in `content/schedules/<course>-y<yearGroup>-<year>.yaml` as blocks of school weeks ("T2 W2" to "T2 W4") and dot points; the build maps dot points to skills and checks them. The WA school calendar (Term 1 from the Monday of 1–4 Feb, else the Wednesday of 31 Jan–3 Feb; 10-week terms with 2-week breaks; Early Easter makes Term 1 nine weeks and Term 2 eleven) gives the school week for a Perth date (engine `calendar.ts`, ported from the owner's Connectify). The target is the latest block that has started; in the holidays, the last one before them; in January, the end of the previous year. If that block has no questions yet, the nearest earlier block with questions stands in (labeled "latest with questions"). A year group without an outline revises everything that has questions. A year without its own outline reuses the latest one.
- The pick is deterministic from the Perth date, course and year group (seeded hash), so it's the same for everyone with no server; its variant and words are seeded the same way. If the day's tier has no question in the target, the nearest tier stands in (lower first). Students default to their year group (from onboarding) and can switch.
- Normal attempt rules for its tier. It updates θ like any other problem.
- It has a **discussion thread** that is open the whole time (§13.1). The thread isn't linked from the problem screen; students find it through Discussions.
- A **daily streak** (consecutive days solved) feeds a leaderboard. A daily problem is solved with any credit on an auto-marked question, or at the 60% pass mark on a written one (when its mark arrives). One attempt per day per year group; afterwards the page shows the question and solution. The streak lives on the profile and is mirrored to the public profile (`dailyStreak`, `dailyBest`).

### 8.5a Revision
Reached from the **Revision** tile above the map (outside the skill tree). Questions come from every pool (practice, quizzes, Challenges) through the question index (§15.3a). Normal attempt rules; answers update θ, XP and achievements like practice, and written answers are marked as usual. A session runs until the student stops, showing questions done and the average score; **Skip** moves on without recording anything.
- **Exam revision.** **Easy**: Tiers 2 and 3. **Hard**: Tiers 3 and 4. A fair coin picks the tier of each question (the other tier if one runs dry), so the mix is half and half. Scope: the whole course, a unit, a section or a skill; type: any, auto-marked or written. Questions that need a later unit are left out.
- **Custom revision.** Any set of tiers (none = any), type, and tags (response skills; a question matches if it has any picked tag), over the whole course, a unit, a section or a skill, optionally including questions that need later units. The setup page shows how many questions match.
- Within a session no question repeats until the mix runs out, and questions the student has never answered come first.

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
- **Pre-generated variants (the default):** an authoring script takes parameter ranges and constraints and writes concrete variants into the question file (about 8–12 per numeric question), each SymPy-verified, and the build renders every variant's figure. A variant may carry its own figure coordinates (parameters starting with `_`, such as `_A: '1.2, -0.8'` and `_view`, used as `A: [{{_A}}]` in the figure; verify code never receives them), so a figure always matches its numbers. Numeric geometry questions have 5 variants each. Chosen over random values per serve: every served instance is checked before it ships, figures stay accurate, and serving, marking and storage only ever handle a variant number. Revisit if logs show students meeting repeats often.
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
- **Format (implemented):** a fenced ` ```diagram ` block of YAML inside any Markdown (tutorials, stems, solutions, prompts, options). It has a `view` in math coordinates (`[xmin, xmax, ymin, ymax]`, y up), optional `width`, `grid`, `axes`, named `points`, a screen-reader `alt`, and a `draw` list. Element types so far: `point`, `segment` (dashed, equal-length ticks), `vector` (arrowhead), `angle` (arc or right-angle mark), `circle` (radius or through a point), `polygon`, `text` and `north` (bearing arrow). Labels are LaTeX. Colors are theme tokens (`ink`, `accent`, `muted`, `good`, `bad`), so diagrams work in dark mode. Function curves, Argand diagrams, slope fields and 3D views come later.
- The build parses and renders every diagram, for every question variant, and fails on unknown points, bad numbers or unfilled placeholders.

### 9.6 Word variety (implemented)
Word problems change their story each time, not just their numbers, so they don't read the same twice.
- `content/words.yaml` holds named word lists: people's names, aircraft, vessels, river crossers, road vehicles, and matched unit sets (km with km/h, nautical miles with knots, miles with mph). Entries are words, or records with fields (a crosser's `name` and `verb`; a unit set's `distance` and `speed`).
- A question names a list per slot: `words: { who: person, craft: aircraft, u: units }`, and its text uses `{{who}}`, `{{craft}}`, `{{craft.a}}` ("a"/"an" added), `{{craft.A}}` (capitalized, for a sentence start) and `{{u.speed}}` (a field).
- **Truly random per serve:** each serve picks an entry for every slot at random, independently of the numeric variant; two slots on the same list never get the same entry. The picks (entry indices) are stored with the serve (attempt, marking job, Challenge state), so a question reads the same when it's marked, resumed or reviewed. The marking server checks picks against the deployed lists before filling the question.
- **Words never change an answer.** The build fails if a slot appears in an answer key or verify code, and if a list is unknown; numbers stay in the variant. A unit swap only relabels: answers are given in the question's own units.
- People are referred to by name only, never by pronoun, so any name fits any sentence.
- Lists grow with content: add a list when a new kind of story needs one (foods, sports, clubs, subjects for combinatorics).

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
- **As built:**
  - The function loads the question, rubric and model solution from the deploy's own content files (never from the request), and needs a Firebase ID token.
  - **Free marking is Groq only** (`openai/gpt-oss-120b`, medium reasoning effort). Gemini's free tier is kept for reading photos, since a consensus mark used 3 of its ~20 requests a day per model. In testing, Groq gave a correct but messy handwritten proof 0% while Gemini 3.8 Flash gave it 100%; that's the accepted trade-off for free marking (an own key fixes it).
  - **Marking effort** (Settings slider, stored per marker in the browser): the free marker offers 1 (one Groq run) and 2 (three runs by consensus; the default). With an own key, 1–10 (default 3) pick the model, reasoning effort and number of runs, from `EFFORT_LEVELS` in `packages/content/src/marking.ts`. Settings shows only the number. The slider always shows 1–10; without an own key, 3–10 are shown hatched and the thumb stops at 2.
  - A step that sorts a transcription into "Answer" and "Rough work" was tried and dropped: on one run it moved steps the proof relied on into rough work. Groq's vision model (Qwen) was also tried as a reader and looped on rough work.
  - Own-key Gemini marking uses Gemini 3.8 Flash, then 3.5 Flash. Flash-Lite is **not** used for marking: in testing it gave the same proof 100% one time and 20% the next. When the marker is busy, the reply is 429 or 503, and the answer waits in the queue and retries. A late mark beats a wrong one.
  - **Consensus:** every answer is marked three times in parallel. Each criterion takes the median award, completeness needs a majority, and the feedback comes from the run closest to the median total. If some runs fail, the rest still count.
  - **Any valid method:** criteria are matched to the equivalent step of the student's own method, and a different method never loses marks. The marker also judges, per part, whether the answer completely and correctly proves what was asked. A part judged so gets **full marks**, set in code. Rough working and abandoned attempts on photographed pages aren't penalized unless the argument depends on them.
  - Points come from the rubric, not the model: awards are clamped to each criterion's maximum and rounded to halves, and missing criteria score 0.
  - Content skills get `freeResponseOutcome(s)`. Each rubric dimension updates its response skill using that dimension's own score.
  - Jobs live in `users/{uid}/markingJobs`. The open app marks one at a time and retries with backoff (15 s, doubling, up to 30 min; Retry-After wins if longer).
  - Every written answer is listed at `/{course}/marked`.
  - An appeal moves θ by K·w·(new − old), which is exact because the expected score is unchanged, and corrects the gate count. XP isn't clawed back.
  - The key is the Netlify environment variable `GEMINI_API_KEY`, scoped to Functions.

### 10.3 Appeals
- One appeal per marked submission. The student writes an argument.
- The **same model** re-marks with the original submission, rubric, first verdict and the student's argument.
- The re-mark is **final and can go up or down**. There is no manual review.
- The appeal prompt keeps the strict stance. It changes a mark only if the student's argument identifies a concrete error in the original marking. Persuasive or emotional appeals without substance don't move the mark.

### 10.4 Bring-your-own key
- Providers: **Gemini, Claude, OpenAI**.
- The key is stored **only on the device** (localStorage) and never sent to the owner's servers.
- Calls go **directly from the browser** to the provider (e.g. Anthropic's direct-browser-access header).
- As built: Claude uses `claude-opus-5-5` at medium effort, with structured output and the default server-side refusal fallback. Gemini uses the same model chain as the free tier. OpenAI uses `gpt-5-mini`. The key is set at `/settings`.
- BYO keys also enable:
  - instant marking, with no queue;
  - unlimited monthly-problem submissions;
  - vision-LLM handwriting transcription when the MyScript quota runs out.

### 10.5 Photo answers
- Written answers can be **photographed**: the Photo button takes a picture with the camera or uploads one.
- **Several photos** (up to 6 pages of one answer) can be taken one by one with the camera or uploaded together. They show as numbered thumbnails and are read together, in order, as one answer. The reader ignores crossed-out work and straightens rotated pages. Transcription may fall back to Flash-Lite.
- Each photo is shrunk on the device (longest side 1600 px, JPEG) and sent to **`/api/transcribe`**, or straight to the student's own provider (§10.4). This is a vision model told only to transcribe the handwriting into text with LaTeX maths, marking unreadable parts [illegible].
- The transcription is added to the answer box, labelled "From photo · check it", for the student to correct before submitting. Marking and appeals then use that text as usual.
- **Photos are never stored.** `/api/transcribe` uses the same sign-in check as `/api/mark`, accepts one JPEG, PNG or WebP of about 3 MB at most, and reports 429 when over quota.

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
1. **CAS verification:** run each question's SymPy `verify` code. It must reproduce every answer key, and every pre-generated variant. Any mismatch fails the build, and so does a question with computed answers but no `verify` code. Geometry answers are measured from a figure built from coordinates (helpers in `scripts/verify_geometry.py`), not re-derived from the theorem being tested.
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
- **Definitions:** criteria are declarative in `content/achievements.yaml` (generated from the tables below; the build checks tier counts, secrets and points against them) and evaluated client-side after each resolved question, quiz, challenge or daily/monthly result. Counters (first-try streaks, per-tier correct counts, weekly counts, one-off flags) and earned dates live in `users/{uid}/courses/{course}/meta/achievements`.
- Achievements whose feature doesn't exist yet (monthly problems, reports) have `pending` rules: they're listed as "Not available yet" and can't be earned until the feature ships.
- **Feature events (Phase 1).** Daily problems, written answers, appeals, discussion posts and the leaderboards feed the same stats:
  - **Daily:** each solved day is kept (first try or not; a day counts once, whichever year group's problem it was). Full Week and Perfect Week check the Mon–Sun week; Calendar Month every day of the month; Weekend Warrior and Sunday Best count weekend and first-try Sunday solves; the streak achievements use the daily streak. A written daily answer is one submission, so a solve at 60% or more is a first-try solve.
  - **Written answers:** 100% answers in total and in a row (an appeal that lifts a score to 100% counts toward the total). An appeal from below 60% to 100% earns its achievement.
  - **Discussions:** each thread posted in counts once (any post or comment). The week-and-discussions achievement needs a perfect week with a post in a thread for each of its days.
  - **Top of the Month:** checked when the leaderboards open on the last day of a month (Perth): #1 on that course's board, alone, with at least one other student on it.
- Earning one grants XP (4 × points) and shows a toast.
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

**Implementation (Phase 1).** Each student has one `publicProfiles/{uid}` document holding everything the boards and profile pages show: display name, XP, activity counters (problems total, today and this week; XP this week and this month, by Perth day, Monday-start week and month), daily streak (current, best, last solved), earned achievement ids and points per course, and per course the course rank and θ, started skills' and response skills' rank and θ, and the roll-up ranks.
- **Writes:** changes collect in the browser and are saved together 15 seconds after the last one (and when the page is hidden), in one batch with the private counters on `users/{uid}`. A run of answers costs one write, not one per answer. Each course is also refreshed once per tab session when its map opens, so older progress appears. Anonymous test accounts stay off the mirror.
- **Reads:** the boards and every profile page share one read of the collection, cached for five minutes per tab (memory and sessionStorage); **Refresh** re-reads. Boards are sorted in the browser; ties share a position; a student with nothing on a board isn't listed. The top 100 show, plus the student's own row if lower.
- Boards now: XP and level (all time, this month, this week), course rank (rank, then score), achievement points, problems done (total, this week, today), daily streak (alive while the last solve was today or yesterday). Monthly, Elo and Race boards arrive with those features.

### 12.3 Profile page
A public profile shows:
- display name, global level and tier badge (§12.4);
- course ranks, plus the tech tree as a read-only view;
- response-skill ranks;
- achievements, earned and secret;
- Elo per game mode, current and peak (§14.7);
- leaderboard positions.

Phase 1: `/profile/<uid>` (the name in the header links to your own) shows name, level, tier and XP; problems, daily streak and achievement points; position on every board; per course the course rank, response-skill ranks and the tech tree read-only (under **Tech tree**); and earned achievements, secret ones marked. Elo arrives in Phase 3.

### 12.4 Global level
One account-wide **level**, earned with **XP** from almost everything a student does. It scales slowly: an hour gets a new student a few levels, while **level 500+ is reachable by determined students**, roughly 500 hours of activity over an ATAR career. There is no level cap.

**Level curve.**
- The XP needed to go from level L to L + 1 is **101 + 2L**.
- So the total XP needed to reach level L is **(L − 1)(L + 101)**.
- The hours below assume about **600 XP per hour** of typical practice (tunable).

**Level tiers** use the same ladder as ranks and achievements, with Unranked called **Basic** here. The tier designs match the rank and achievement visuals (§12.1).

| Tier | Levels | Total XP to reach | ≈ Hours |
|---|---|---|---|
| Basic | 1–9 | 0 | 0 |
| Bronze | 10–24 | 999 | 2 |
| Silver | 25–49 | 3,024 | 5 |
| Gold | 50–99 | 7,399 | 12 |
| Platinum | 100–149 | 19,899 | 33 |
| Diamond | 150–199 | 37,399 | 62 |
| Ruby | 200–299 | 59,899 | 100 |
| Tanzanite | 300–399 | 119,899 | 200 |
| Vibranium | 400–499 | 199,899 | 333 |
| Solarium | 500–749 | 299,899 | 500 |
| Antimatter | 750+ | 637,399 | 1,062 |

**XP sources** (starting values, tunable):

| Activity | XP |
|---|---|
| Resolve a practice, quiz or challenge question | Correct: Tier 1 → 10, Tier 2 → 16, Tier 3 → 24, Tier 4 → 36, Tier 5 → 60. Wrong or given up: 4 (effort) |
| Free-response marked | 24 × tier × rubric score |
| Read a tutorial (first time per skill) | 40 |
| Finish a section quiz / unit quiz | +50 / +100 bonus |
| Finish a Section Challenge | +200 bonus |
| Solve the daily problem | 30 + 10 × tier |
| Score a monthly Tier 6 milestone | 100 per milestone |
| Rank up in a skill or response skill | Bronze 40, Silver 80, Gold 160, Platinum 280, Diamond 500 |
| Earn an achievement | 4 × its points |
| Play a Frontline game | 80, plus 40 for first place |
| Play a 1v1 minigame (Divide, Draft, Exam Board) | 50, plus 30 for a win |
| Play a Race game | 20, plus 10 for a win |
| Post a solution in a discussion | 20 (max 3 a day) |
| A report confirmed by auto-reverification | 50 |
| First visit of the day | 20 |

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

**Storage.** Total XP lives on `users/{uid}` and is mirrored to `publicProfiles/{uid}` for leaderboards (§12.2: batched, not per answer). Practice XP is computed client-side, so it falls under the accepted client-side trust risk (§18). Competitive XP is awarded by Netlify Functions.

---

## 13. Social

### 13.1 Solution discussions
- Discussions exist **only for daily and monthly problems**, and each thread is **open and visible the whole time**, including while the problem is live.
- **Not pushed at students:** problem screens, results and notifications never link to or preview discussions. Students reach them only through the **Discussions** page, which has search by date, problem and text.
- **Spoilers rely on good faith.** There is no automated spoiler blocking.
- **Spoiler tags:** `||label: hidden text||`, or `||hidden text||` without a label. Hidden text renders as a blurred block that is revealed on click. Hovering (or long-pressing on touch) shows a **tooltip with the author's label** describing what's hidden, e.g. "full solution to (b)" or "hint: consider parity". With no label, the tooltip says "Spoiler". LaTeX inside spoilers is supported.
- **Anyone** can post and comment. Posts support Markdown and LaTeX.

- **Phase 1 implementation.** `/<course>/discussions` lists threads (most recently active first) plus today's two daily problems (Year 11 and Year 12), and filters by date (a past date shows that day's problems even with no posts yet), year group and text (problem name and every post's text). A thread page shows the problem as served that day (rebuilt from the same seed as the daily page), its solution behind **Solution**, the posts with their comments (one level), and a composer with **Preview**. Authors can delete their own posts.
- **Storage:** `discussions/{day}:{course}:{year}` holds the post count, last activity and every post's text (for search, capped at 200,000 characters); its `posts` subcollection holds each post and comment (`parent` names the post a comment is on). Posting is one transaction (the post plus the thread's count and text). The thread list and each thread's posts are read once and kept for two minutes; your own posts update the copies without a re-read.
- **Safety:** posts are students' own writing, so raw HTML shows as typed, links are limited to safe protocols, and the HTML is sanitized (DOMPurify) before KaTeX output is added. KaTeX runs with `trust: false`.

### 13.2 Moderation
- A **banned-words list** of identity-based slurs (race, ethnicity, sexuality, gender identity, disability) and purely sexual terms applies to posts, comments and display names, checked client-side and again in Firestore rules. Profanity and general insults are not banned.
- No other moderation for now, given the small group.
- **Phase 1 implementation.** The list is `content/banned-words.txt` (one per line; owner-edited). The content build copies it to `/content/banned-words.json` for the app, and `pnpm moderation` writes it into `firestore.rules` as a `clean()` function (whole words, case-insensitive, plus -s/-es/-ed/-ing); deploy the rules after changing it. The app also undoes common letter swaps (`3` for `e`, `@` for `a`) and spaced-out letters before checking. Posts and comments with a banned word are refused; a display name with one shows as "Student" on the public mirror and is refused at sign-up.

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
  - **Nodes** are filled with the rank color (Unranked is hollow), with a short label under each. Keep on-map text minimal. The **shape shows skill size** (§3.3): small circle (Small), circle (Medium), small diamond (Large), large diamond (Cornerstone). The legend above the tree explains both colors and shapes.
  - **Progress ring:** each node's ring fills toward the next rank's color, **linearly in the 0–100 score** from the current rank's floor to the next rank's floor (Diamond: toward θ 2000, score 99.3), so the ring always agrees with the number in the node.
  - **Edges** are suggested prerequisites, drawn as smooth curves routed between nodes (never through a node or label). Only prerequisites **within a section** are drawn all the time, and only they shape the layout, so each section is a compact tree. Links to other sections (drawn sideways, since sections sit side by side) and to earlier units appear when a skill is hovered or selected, and hovering traces the full chain up and down. Each section is laid out on its own, choosing the arrangement with the fewest crossings. Cross-course prerequisites appear in the skill panel.
  - **Selecting a skill** opens a compact panel: name, rank, score, θ, summary, suggested first, leads to.
  - Section and unit rolled-up ranks show on the region and unit labels.
- **Table view toggle:** a sortable table of Unit / Section / Skill with rank, score, θ, gate progress (e.g. "Silver 2/3") and question counts.
- The daily problem and monthly problem appear as persistent cards or a side panel on the tree screen.

### 15.3 Skill page
- Shows rank, score, θ, gate progress per rank, dot points covered, suggested prerequisites (with their ranks, for information only), and recent attempts.
- **Learn** opens the skill's tutorial (§3.2): a clean reading view with glossary hovers and links to prerequisite tutorials. It is offered prominently on a student's first visit to a skill, but never required.
- **Start practicing** is the main action. On first visit it offers a tier chooser (default Tier 3). **Drop a tier** is also available here.
- No quiz or Challenge links here: the section quiz, unit quiz and Section Challenge are reached from their nodes on the map.
- **Tabs: Overview and Questions.** Questions lists every question whose skills include this one (practice, quiz and Challenge pools), easiest first: tier badge, name, type, pool, rating, and "Answered" once seen. A row expands to the stem and worked solution; a practice question has **Practice this**.

### 15.3a Questions page
- `/<course>/questions` lists every question in the course, from a small `question-index.json` built with the content (id, name, skill(s), section, unit, year, rating, tier, type, response-skill tags, pool, whether it needs a later unit's content). The full question loads only when a row is expanded.
- **Filter** by search text, tier, type (auto-marked or written), tag, year, unit, section, skill, pool, later units needed, and answered. **Sort** easiest or hardest first, by name, or by tag. **Group** by tier, tag, skill, section or answered; a question with several tags or skills appears in each of their groups.
- Filters live in the URL, so a view can be bookmarked or shared. "Answered" comes from local progress: no extra reads.
- A question's name is its `title` field, or else its id turned into words.

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
  - **Display name** (Phase 1): 2–30 characters, no banned words (§13.2). Saving updates the account, the profile and the public mirror at once; leaderboards show it within five minutes (their cache). Email sign-ups choose it on the sign-up form. **Google sign-ups** get Google's name by default, so onboarding asks them to choose one (prefilled with Google's name); existing Google accounts are asked once.
- **Students' own writing** (written answers, previews, history, discussion posts) keeps the line breaks they typed; authored content (questions, tutorials, solutions) uses normal Markdown paragraphs.
- **Onboarding:** pick course + year, then a short tour of the tree, tiers, ranks and gates, and the 0–100 score. All skills start Unranked.

### 15.4a Wording: points, not marks
The app says **points** (and **score**) wherever a student sees how an answer was scored: "Written · 5 points", "Score 80%", "Appeal this score". Our rubrics and milestones are not the WACE marking scheme, so the app never calls them marks. The LLM marker writes "points" in its feedback too. ("Marking" for the process, and a student's school "maths mark" in onboarding, keep their usual meaning.)

### 15.4b Answer history and Back
- Every answer a student gives (practice, quizzes, Challenges, daily, revision) is logged **in the browser only** (localStorage, newest 500 per course): question id, variant and word picks, the answer per part, the attempt each part was solved on, the outcome, and for written answers the marking job. Nothing is read from or written to Firestore for it, so it doesn't follow a student to another device.
- **Back** on the practice screen steps through earlier answers in that skill (Forward and **Current question** return); the current question stays as it was, half-typed answers included.
- **History** (`/<course>/history`) lists every logged answer by day, filterable by skill, mode and result (60% or more, under 60%, still marking). A row expands to the question as it was served, the answers given (marked right or wrong per part, or with the written score and feedback) and the worked solution. **Clear history** empties it.

### 15.4c Share a problem
- **Share** on every question screen (practice, revision, daily, quizzes, Challenges, a shared problem) and on each question in the Questions lists sends a link to **that exact problem**: `/<course>/problem/<question id>?v=<variant>&w=<slot>.<index>,…`. The link carries the numeric variant and word picks, so the person opening it sees the same numbers and names. Nothing is stored; no reads or writes.
- On phones the system share sheet opens; elsewhere the link is copied ("Link copied").
- Opening the link shows the problem with its skill, to answer like practice (θ, XP, achievements; written answers are marked as usual; history mode "Shared"). If the question has changed since the link was made (a variant or word list no longer fits), it is served with fresh numbers and names and says so.

### 15.5a Paper first
- Questions at **Tier 3 and above**, and **every written question**, show a **"Paper first"** label: they are meant to be worked out on paper, then answered on the site.
- The first time a student meets one, a one-time tip says so (and, for written questions, that the answer can be photographed). "Got it" dismisses it for good in that browser.

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
| Auth | Firebase Auth (Google + email; anonymous for testing deploy previews, kept off public leaderboards) |
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
discussions/{day}:{course}:{year}        post count, last activity, posts' text (search)
discussions/{key}/posts/{postId}         uid, name, body, at, parent (null, or the post a comment is on)
hiddenQuestions/{questionId}             reason, ts
reports/{reportId}                       question id, note, verdict
```

Leaderboards read `publicProfiles` once per tab every five minutes and sort in the browser, which is fine at small-group scale.

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
| 1: Specialist Unit 1 (full depth) | Curriculum for all of Specialist; Unit 1 tutorials (one per skill) and questions at full depth (per skill size, §3.3); glossary; LLM marking; quizzes; Section Challenges; daily problem; achievements; global level and XP; leaderboards; discussions; word variety in word problems (§9.6); no repeats near the student's level (§5.7); Questions tab and page (§15.3–15.3a); local answer history and Back (§15.4b); Exam and Custom Revision (§8.5a); leaderboards and profiles (§12.2–12.3); daily-problem discussions with spoilers and a banned-words list (§13); share a problem by link (§15.4c). **Owner tests before continuing.** |
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
- XP values and the ~600 XP/hour assumption, checked against real usage so that level 500 stays at roughly 500 hours (§12.4).

**Owner to specify later**
- **Science answer types** (before Phase 5): unit-aware numeric answers, significant-figure rules, chemical formula and equation input, balanced-equation checking.
