# Intellectify: Product & Technical Specification

**Status:** Draft v1, produced from a design interview (2026-11-25); revised 2026-11-27
**Scope of v1:** WACE Mathematics Specialist (pilot). Unit 1 is built to full depth first.
**Audience:** small group of self-directed Year 11/12 ATAR students in Western Australia.
**Budget:** zero running cost.

---

## Contents

- [1. Vision](#1-vision)
  - [1.1 Goals](#11-goals)
  - [1.2 Non-goals (for now)](#12-non-goals-for-now)
  - [1.3 Course roadmap](#13-course-roadmap)
- [2. Users](#2-users)
  - [2.1a Trying it anonymously](#21a-trying-it-anonymously)
- [3. Curriculum structure](#3-curriculum-structure)
  - [3.1 Tutorials](#31-tutorials)
  - [3.2 Skill sizes](#32-skill-sizes)
- [4. Difficulty: tiers and question ratings](#4-difficulty-tiers-and-question-ratings)
- [5. Rating and mastery engine (Alcumus-style)](#5-rating-and-mastery-engine-alcumus-style)
  - [5.1 Student ability θ](#51-student-ability-θ)
  - [5.2 Displayed numbers (everything is visible)](#52-displayed-numbers-everything-is-visible)
  - [5.3 Placement](#53-placement)
  - [5.4 Ranks](#54-ranks)
  - [5.5 Roll-up: section, unit, course](#55-roll-up-section-unit-course)
  - [5.6 Response skills](#56-response-skills)
  - [5.7 Question selection](#57-question-selection)
- [6. Answering a question](#6-answering-a-question)
  - [6.1 Flow](#61-flow)
  - [6.2 Attempts and credit (auto-marked)](#62-attempts-and-credit-auto-marked)
  - [6.3 Free-response](#63-free-response)
- [7. Answer formats and input](#7-answer-formats-and-input)
  - [7.1 Formats (all required for the Specialist pilot)](#71-formats-all-required-for-the-specialist-pilot)
  - [7.2 Input methods](#72-input-methods)
- [8. Practice and assessment modes](#8-practice-and-assessment-modes)
  - [8.1 Skill practice (core loop)](#81-skill-practice-core-loop)
  - [8.1a Review pools](#81a-review-pools)
  - [8.2 Section quiz](#82-section-quiz)
  - [8.3 Unit quiz](#83-unit-quiz)
  - [8.4 Section Challenge](#84-section-challenge)
  - [8.5 Daily problem](#85-daily-problem)
  - [8.5a Revision](#85a-revision)
  - [8.6 Monthly problems (Tier 6)](#86-monthly-problems-tier-6)
- [9. Answer checking (client-side)](#9-answer-checking-client-side)
  - [9.1 Design: numeric sampling + form rules + typed comparators](#91-design-numeric-sampling--form-rules--typed-comparators)
  - [9.2 Checker spec (per answer)](#92-checker-spec-per-answer)
  - [9.3 Parameterized questions](#93-parameterized-questions)
  - [9.4 Diagrams](#94-diagrams)
  - [9.6 Word variety (implemented)](#96-word-variety-implemented)
- [10. LLM marking (free-response, appeals, monthly problem)](#10-llm-marking-free-response-appeals-monthly-problem)
  - [10.1 Marking request](#101-marking-request)
  - [10.2 Providers and transport](#102-providers-and-transport)
  - [10.3 Appeals](#103-appeals)
  - [10.4 Bring-your-own key](#104-bring-your-own-key)
  - [10.5 Photo answers](#105-photo-answers)
- [11. Content pipeline (offline, owner-run scripts)](#11-content-pipeline-offline-owner-run-scripts)
  - [11.1 Question files](#111-question-files)
  - [11.2 Verification (all must pass before merge)](#112-verification-all-must-pass-before-merge)
  - [11.3 Build](#113-build)
  - [11.4 Error reports (implemented)](#114-error-reports-implemented)
- [12. Gamification](#12-gamification)
  - [12.1 Achievements](#121-achievements)
  - [12.2 Leaderboards](#122-leaderboards)
  - [12.3 Profile page](#123-profile-page)
  - [12.4 Global level](#124-global-level)
- [13. Lemmas, theorems and packs (planned)](#13-lemmas-theorems-and-packs-planned)
  - [13.1 Lemmas (∴)](#131-lemmas-)
  - [13.2 Theorems (the upgrade tree)](#132-theorems-the-upgrade-tree)
  - [13.3 Research (passive)](#133-research-passive)
  - [13.4 Conjectures (the long-term Research boost)](#134-conjectures-the-long-term-research-boost)
  - [13.5 Corollaries (free, automatic, permanent)](#135-corollaries-free-automatic-permanent)
  - [13.6 Axioms (milestones)](#136-axioms-milestones)
  - [13.7 Packs and cards](#137-packs-and-cards)
  - [13.8 Cosmetics (Lemma shop)](#138-cosmetics-lemma-shop)
  - [13.9 Titles](#139-titles)
  - [13.10 Storage](#1310-storage)
  - [13.11 Screens, layout and motion](#1311-screens-layout-and-motion)
- [14. Social](#14-social)
  - [14.1 Solution discussions](#141-solution-discussions)
  - [14.2 Moderation](#142-moderation)
- [15. Competitive play (Phase 3)](#15-competitive-play-phase-3)
  - [15.1 Principles](#151-principles)
  - [15.2 Frontline: maps and setup](#152-frontline-maps-and-setup)
  - [15.3 Frontline: rounds and actions](#153-frontline-rounds-and-actions)
  - [15.4 Frontline: snowballing, flags and scoring](#154-frontline-snowballing-flags-and-scoring)
  - [15.5 1v1 minigames](#155-1v1-minigames)
  - [15.6 Architecture for competitive play](#156-architecture-for-competitive-play)
  - [15.7 Elo ratings](#157-elo-ratings)
- [16. UI / UX](#16-ui--ux)
  - [16.1 Visual identity](#161-visual-identity)
  - [16.2 Home = the tech tree](#162-home--the-tech-tree)
  - [16.3 Skill page](#163-skill-page)
  - [16.3a Questions page](#163a-questions-page)
  - [16.4 Problem screen](#164-problem-screen)
  - [16.4a Wording: points, not marks](#164a-wording-points-not-marks)
  - [16.4b Answer history and Back](#164b-answer-history-and-back)
  - [16.4c Share a problem](#164c-share-a-problem)
  - [16.4d The current question stays until answered](#164d-the-current-question-stays-until-answered)
  - [16.5 Other screens](#165-other-screens)
  - [16.5a Paper first](#165a-paper-first)
  - [16.6 Platform and accessibility](#166-platform-and-accessibility)
- [17. Architecture](#17-architecture)
  - [17.1 Stack](#171-stack)
  - [17.2 Client-side logic](#172-client-side-logic)
  - [17.3 Firestore data model (sketch)](#173-firestore-data-model-sketch)
  - [17.4 Repository layout](#174-repository-layout)
  - [17.5 Free-tier budget notes](#175-free-tier-budget-notes)
- [18. Phasing](#18-phasing)
- [19. Open questions, risks and decisions](#19-open-questions-risks-and-decisions)

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
- Native mobile apps. These come only after all four courses are done (see §18).
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

### 2.1a Trying it anonymously
- **Continue anonymously** (Firebase anonymous auth) lets anyone try the site without an account. Anonymous accounts stay off leaderboards; their maths-mark placement is asked once per browser and reused by later anonymous accounts.
- **Limit: 5 questions.** Once an anonymous account has answered 5 questions (resolved in any mode, or written answers submitted for marking), the next question opens a **Keep your progress** dialog that can't be closed: continue with Google, sign up with email, or log in. Pages without a question (the map, leaderboards, tutorials) stay open. The count is kept in the browser as each answer lands, so a reload doesn't reset it.
- **Progress comes along.** Signing up (Google or email) adds the login to the anonymous account, so the account and all its data stay as they are. Logging in to an account that already exists (or choosing a Google account that already has one) merges the anonymous progress into it: per skill, the state with more resolved questions wins; XP and problem counts add up; earned achievements combine; written answers and their marks are copied; the account keeps its own placement, daily record and name. The anonymous account's data is left behind, unused. The page then reloads as the permanent account.
- **Deploy previews have no limit**, for testing (Netlify builds them with `CONTEXT=deploy-preview`).

---

## 3. Curriculum structure

```
Course (e.g. Mathematics Specialist)
 └── Unit (1–4; Units 1–2 = Year 11, Units 3–4 = Year 12)
      └── Section (3 per unit, from the WACE syllabus)
           └── Skill (cluster of related syllabus dot points, ~4–8 per section)
```

- **Skills are clustered dot points.** Each skill lists the syllabus content descriptors it covers, e.g. `["1.1.3", "1.1.4"]`.
- **Subsections (implemented).** Each skill also lists its **subsections**: the specific points it covers, named in words ("Pascal's rule", "Relative velocity"), never by dot-point number. Usually 3–8 per skill, in teaching order, in the curriculum file (`subsections:`). **Every question names exactly one** subsection of its primary skill (`subsection:`); the build rejects a question without one, a name the skill doesn't list, or a subsection named by a number, and warns when a subsection has no practice questions. Subsections are a filter everywhere questions are filtered (§8.5a, §16.3a, §16.4b); they don't affect θ, ranks or selection.
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

  The Year 12 Methods syllabi for 2026 and 2027 have **identical unit content**. The 2027 edition is part of the WACE Refreshment and only revises the rationale, aims and General Capabilities.

- The source PDFs live in a gitignored `content/syllabus/` folder. They are SCSA documents, so they aren't committed.
- **One file per syllabus:** `content/curriculum/<course>/<version>.yaml` (e.g. `specialist/y11-2026.yaml`) records its source document, effective date, dot points and skills, and is the source of truth. Skill IDs don't depend on syllabus numbering. Syllabi change rarely and years apart, so each change is handled by hand when it arrives.

### 3.1 Tutorials
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
- **No metadata in the body** (§16.1). The tutorial page shows the skill's dot points and prerequisites as a metadata row built from the curriculum; the Markdown starts at "Key ideas". The build rejects anything before it.

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

### 3.2 Skill sizes
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
- The rating is estimated when the question is written, and the owner adjusts it during review.
- **Bookwork is rated 100 lower.** A question whose whole task is to reproduce a proof the textbook teaches (a syllabus theorem such as "the perpendicular from the center bisects a chord", or a standard worked proof such as the vector proof of the angle in a semicircle) is rated **100 below** what its difficulty would otherwise be: a student who has studied can recall it. The penalty applies to the question, its parts and its rubric dimensions, and the question is marked `bookwork: true`. A proof of the same result by a different, unfamiliar route (e.g. equal tangents from the tangent–secant theorem) is not bookwork.
- Content mix per skill: at least **10–40 questions** depending on skill size (§3.2), with no maximum. Tiers 1–2 need only a couple of items each, since they are mostly parameterized templates where only the numbers change. The bulk of authored items sit in **Tiers 3–5**. A parameterized template counts as one item.

---

## 5. Rating and mastery engine (Alcumus-style)

### 5.1 Student ability θ
- Each student has an ability **θ per skill**, on the same 1000–2000 scale as questions. θ may go outside the scale; clamp it to [800, 2300].
- Probability of a correct answer: `P(correct) = 1 / (1 + exp(-(θ − d) / S))`, with `S = 100` (tunable).
- Update after a question resolves: `θ ← θ + K · w · (outcome − P)`
  - `outcome ∈ [0, 1]` (§6.2 credit rules)
  - `K = 32` × the skill-size speed (§3.2); tunable, and constant over time, so there is no provisional fast-moving phase
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
- **Skill size adds to every gate** (§3.2): +1 for Large skills and +2 for Cornerstone skills. Response skills use the Small/Medium numbers.
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
   - **Report error** (§11.4), which is also there before resolving.

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
| Complex number | Value equivalence plus required form (Cartesian / polar / exponential); polar and exponential answers need r > 0 and the principal argument, −π < θ ≤ π |
| Vector / matrix | Componentwise expression checks |
| Set / list | Order-insensitive (set) or ordered (list), element by element; elements are expressions, equations or points |
| Interval | A set of reals in interval notation ((−∞, 2] ∪ (3, 5), ℝ, ∅) or as inequalities in one variable (x ≤ 2 or 3 < x < 5); pieces are merged, so equal sets match; a question can require one notation |
| Equation | Equivalence up to rearrangement or scaling |
| MCQ / multi-select | Exact set match |
| Feature-entry | Graphical answers expressed as features: one labeled box per feature (asymptote equations, intercepts, turning points, locus equations), each a set of equations, points or values in any order, with **None** for a feature the graph doesn't have. All must be right; after the part ends, each box shows right or wrong |
| Multi-part | (a)(b)(c) composed of the above, each part auto-marked |
| Proof / free-response | LLM rubric marking (§10) |

Graphical answers such as "sketch y = 1/f(x)" or "shade the locus" are handled through **feature-entry**, not drawing. **All formats are implemented.**

### 7.2 Input methods
- **Maths keypad (implemented)**, so no student needs LaTeX. Three tabs: **Basic** (fraction, powers, roots, |x|, brackets, π, e, i, ∞, ±, ×, ÷, ≤, ≥, ≠, ≈, degrees, θ, sin, cos, tan, ln, log, eˣ, nCr, n!), **Greek** (every lowercase letter and the capitals that differ from Latin ones) and **Full** (grouped: structures such as overline, hat, dot, prime, nCr and nPr; operators and relations; logic and proof, such as ⇒, ⇔, ∴, ∀, ∃ and ∎; sets and number sets; geometry, such as △, ∠, ∥, ⊥, ≅, ∼, segments, rays and arcs; vectors and matrices, such as the tilde under a letter, arrows, bold, i, j, k, column vectors, matrices, inverse and transpose; functions and calculus, such as inverse trig, log bases, derivatives, integrals, sums and limits; complex numbers, such as cis, Re, Im, Arg and the conjugate; statistics, such as x̄, p̂, μ, σ, P(A) and E(X)). Keys with slots insert empty boxes to fill in; a power or subscript applies to what was just typed.
  - **Answer fields on computers:** one keypad under the question types into the last answer box used; the physical keyboard works as usual. Open or closed, and the last tab, are remembered in the browser.
  - **Answer fields on phones:** the field's own on-screen keyboard (MathLive) is the only keyboard: a **123** tab (digits, x, n, y, z, operators, e, i, π, squares, powers, roots, brackets, integral, ∀) with a **Shift** key, letters, then the keypad as tabs labeled with glyphs so they fit (π√ Basic, αβγ Greek, □ⁿ, ±×, ⇒, ∈, △, **v**, ∫, ℂ, σ for the Full groups).
  - **Shift keys (ClassPad-style):** every key on the 123 tab has a shifted symbol, shown small in the key's top corner (like the labels printed above calculator keys). The app writes answers rather than computing, so the defaults are notation, not CAS commands: the ClassPad II's own shifts that produce notation (1–3 sin cos tan, 4 eˣ, 5 ln, 6 log base, 0 π, . i, ÷ fraction, ^ √, ( [, ) ], and (−) ⇒ on ∀); its Specialist CAS shifts as the notation they stand for (7 diff( → d/dx, 8 approx( → ≈, 9 cis, y f(x)); and common answer symbols in memorable pairs elsewhere (+ ±, − ∓, = ≠, × ·, z ≤, n ≥, e ∞, x θ, π °, i |z|, x² prime, √ nth root, ∫ without limits). In **Settings › Shift keys** a student can set any key to any keypad key, a ClassPad CAS word (solve(, expand(, …), an editing command (Copy, Cut, Paste, Undo) or "Same key". Choices are saved to the account (only those changed from the defaults), so they follow the student to any device.
  - **Written answers are edited as they read (WYSIWYG):** words are plain text and mathematics sits inline as live maths, never raw LaTeX. Maths starts where a keypad key is pressed, where **Maths** is pressed, or where **$** is typed; arrow keys past either end, Enter or $ of a piece of maths go back to the words, and Backspace in empty maths removes it. Pasted text with $…$ becomes maths. The answer is stored, marked and shown elsewhere as text with mathematics between $ signs. On computers the keypad sits under the answer; on phones the maths keyboard appears inside the maths.
- **Handwriting (implemented).** **Handwrite** under any answer opens a pad: write with a stylus (or a finger or mouse; once a pen is used, touches are ignored), then **Read**. The typeset result is shown to check, then **Use this** puts it in the answer box last used (as maths in a written answer). Undo and Clear work on strokes.
  - **MyScript iink** reads the strokes, through the Netlify Function **`/api/ink`**: it holds the owner's application and HMAC keys (`MYSCRIPT_APPLICATION_KEY`, `MYSCRIPT_HMAC_KEY`), signs each request (HMAC-SHA512 of the body, keyed by both keys), and calls the Cloud REST batch API for LaTeX. Signed-in students only; at most 400 strokes and 20,000 points; nothing is stored.
  - **AI fallback:** when MyScript's shared monthly quota (2,000 requests on the free tier) runs out, the function answers 429 and that browser skips MyScript until next month; a picture of the ink goes to the vision reader instead (the student's own key, else the free photo reader, §10.5), marked "Read by AI · check it". Any other MyScript failure falls back the same way for that one request.
  - **Settings › Handwriting** turns the pad on or off (on by default) and says which reader is in use.
- **Paste detector (implemented, every answer).** Answers are the student's own writing, in every mode (practice, quizzes, Challenges, daily, revision, shared problems, and monthly problems when they arrive):
  - Text from **outside the site** can't be pasted or dropped into any answer box (MathLive's Paste menu item is removed too); a short note says "Pasting from outside the site is off". Text copied on the site itself (the student's own answer, a question) still pastes, and so do 1–3 characters.
  - Each answer keeps **signals**, never shown as an accusation: blocked pastes, **bursts** (40+ characters arriving at once, not from the keypad, a photo or the pad) and seconds from showing the question to answering. They're saved with the answer history entry and, for written answers, the marking job.

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
- Section quiz, unit quiz and Section Challenge are reached from the map, not from skill pages (§16.3). Each section's quiz (a checklist tile) and Challenge (a summit tile, showing the best result) sit at the foot of the section. Each unit's quiz (a star badge) sits below the unit.

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

- **One per year group (implemented):** a Year 11 and a Year 12 problem each day, each targeting **the block its year group has just learnt**. Course outlines live in `content/schedules/<course>-y<yearGroup>-<year>.yaml` as blocks of school weeks ("T2 W2" to "T2 W4") and dot points; the build maps dot points to skills and checks them. The school week for a Perth date comes from the calendar files (§8.6), or for a year without one, from the WA rule (Term 1 from the Monday of 1–4 Feb, else the Wednesday of 31 Jan–3 Feb; 10-week terms with 2-week breaks; Early Easter makes Term 1 nine weeks and Term 2 eleven; engine `calendar.ts`, ported from the owner's Connectify). The target is the latest block that has started; in the holidays, the last one before them; in January, the end of the previous year. If that block has no questions yet, the nearest earlier block with questions stands in (labeled "latest with questions"). A year group without an outline revises everything that has questions. A year without its own outline reuses the latest one.
- The pick is deterministic from the Perth date, course and year group (seeded hash), so it's the same for everyone with no server; its variant and words are seeded the same way. If the day's tier has no question in the target, the nearest tier stands in (lower first). Students default to their year group (from onboarding) and can switch.
- Normal attempt rules for its tier. It updates θ like any other problem.
- It has a **discussion thread** that is open the whole time (§14.1). The thread isn't linked from the problem screen; students find it through Discussions.
- A **daily streak** (consecutive days solved) feeds a leaderboard. A daily problem is solved with any credit on an auto-marked question, or at the 60% pass mark on a written one (when its mark arrives). One attempt per day per year group; afterwards the page shows the question and solution. The streak lives on the profile and is mirrored to the public profile (`dailyStreak`, `dailyBest`).

### 8.5a Revision
Reached from the **Revision** tile above the map (outside the skill tree). Questions come from every pool (practice, quizzes, Challenges) through the question index (§16.3a). Normal attempt rules; answers update θ, XP and achievements like practice, and written answers are marked as usual. A session runs until the student stops, showing questions done and the average score; **Skip** moves on without recording anything.
- **Exam revision.** **Easy**: Tiers 2 and 3. **Hard**: Tiers 3 and 4. A fair coin picks the tier of each question (the other tier if one runs dry), so the mix is half and half. Scope: the whole course, a unit, a section, a skill or one of its subsections (§3); type: any, auto-marked or written. Questions that need a later unit are left out.
- **Custom revision.** Any set of tiers (none = any), type, and tags (response skills; a question matches if it has any picked tag), over the whole course, a unit, a section, a skill or one of its subsections, optionally including questions that need later units. The setup page shows how many questions match.
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
- **School calendar (implemented).** Which unit each year group is in comes from `content/calendar/<year>.yaml`: WA public-school term dates (first and last school day), semesters (Terms 1–2 and 3–4) and exam periods (e.g. the ATAR practical and written examinations), from the Department of Education and SCSA. Units are counted as **15 school weeks** from the start of the school year, skipping holidays: Year 11 is in Unit 1 for weeks 1–15 and Unit 2 after, Year 12 in Units 3 and 4; before Term 1, each year group is still in last year's final unit (Year 11 counts as Year 10). The build checks the dates (four terms in order, within the year, on weekdays) and notes where a file differs from the WA rule; the engine gives the school week, the unit (`unitAt`), the monthly scope (`monthlyScope`) and the exams running on a date. Files exist for 2026 and 2027 (2027's later terms follow the rule until published).
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
- **Pasting from outside the site is blocked**, as in every answer (§7.2).
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
  - `simplified-fraction`, `rationalized-denominator`, `single-integral` (exactly one integral; definite integrals are evaluated numerically, by Simpson's rule);
  - `+C required`.
- **Typed comparators** cover vectors, matrices, sets, intervals, equations, MCQ and feature-lists.

Rationale: a full browser CAS is either weak (Compute Engine alone) or heavy and slow on phones (Pyodide + SymPy, ~15 MB). Numeric sampling is fast and robust for equivalence, and form rules capture what WACE markers care about. SymPy is still used **offline** to verify every answer key (§11.2).

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
- **Pre-generated variants (the default):** concrete variants are written into the question file (about 8–12 per numeric question), each SymPy-verified, and the build renders every variant's figure. A variant may carry its own figure coordinates (parameters starting with `_`, such as `_A: '1.2, -0.8'` and `_view`, used as `A: [{{_A}}]` in the figure; verify code never receives them), so a figure always matches its numbers. Numeric geometry questions have 5 variants each. Chosen over random values per serve: every served instance is checked before it ships, figures stay accurate, and serving, marking and storage only ever handle a variant number. Revisit if logs show students meeting repeats often.
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
- **Format (implemented):** a fenced ` ```diagram ` block of YAML inside any Markdown (tutorials, stems, solutions, prompts, options). It has a `view` in math coordinates (`[xmin, xmax, ymin, ymax]`, y up), optional `width`, `grid`, `axes`, named `points`, a screen-reader `alt`, and a `draw` list. Element types: `point` (filled, or `open` for an excluded point), `segment` (dashed, equal-length ticks), `vector` (arrowhead), `angle` (arc or right-angle mark), `circle` (radius or through a point, optionally filled), `polygon`, `text` and `north` (bearing arrow). Labels are LaTeX. Colors are theme tokens (`ink`, `accent`, `muted`, `good`, `bad`), so diagrams work in dark mode.
- **Graphs (implemented).** Formulas are plain text (`(x + 1)/(x - 2)`, `2sin(x) + 1`, `e^(-t/2)cos(3t)`), with implicit multiplication, `pi`, `e`, `|abs|` and the usual functions, compiled by a small built-in parser (`expr.ts`), not the answer checker. Any number in a diagram may also be a formula (`pi/2`, `2sqrt(3)`).
  - `function`: y in terms of x, sampled finely and clipped to the view; the pen lifts where the graph jumps through an asymptote, so branches are never joined. Optional `domain` and a `label` placed beside the curve (`labelAt` picks the x).
  - `parametric`: x and y (and z in 3D) in terms of t over a range.
  - `line`: infinite, clipped to the view, given as `through: [P, Q]`, `x: c`, `y: c`, or `slope` and `intercept`; dashed for asymptotes.
  - `ray`: from a point, through another point or at an `angle` in degrees, optionally with an `open` start (Argand loci such as arg(z − 1) = π/4).
  - `region`: the area between `fn` and `fn2` (default the x-axis) from x = a to x = b, shaded (areas and integrals).
  - `slopefield`: short segments of slope dy/dx(x, y) on a grid of spacing `step`, usually with a solution `function` over it.
  - `axes` takes labels (`x: '\text{Re}'`, `y: '\text{Im}'` for an Argand diagram) and `ticks` (one spacing or `[x, y]`); a spacing in π (`pi/2`) labels ticks as fractions of π. The grid follows the tick spacing.
- **3D (implemented).** With `projection: { azimuth, elevation }` (default 30° and 20°), points take three coordinates and are drawn in an orthographic view (x toward the viewer and left, y right, z up); the view fits the drawing, so `view` is optional. `axes: { length }` draws x, y and z axes; `vector`, `segment`, `point`, `polygon` (filled for a plane patch), `text`, `line`, `ray`, `parametric` (space curves) and `sphere` (outline and dashed equator) work in 3D. Circles, functions, regions and slope fields are 2D only, and the build says so.
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
- **Default: free tier.** A **Netlify Function `/api/mark`** holds the owner's free-tier key (Groq; see As built) and calls the model **synchronously**. Over quota, it returns **429**.
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
  - their own vision model for reading handwriting when the MyScript quota runs out (§7.2), instead of the free photo reader.

### 10.5 Photo answers
- Written answers can be **photographed**: the Photo button takes a picture with the camera or uploads one.
- **Several photos** (up to 6 pages of one answer) can be taken one by one with the camera or uploaded together. They show as numbered thumbnails and are read together, in order, as one answer. The reader ignores crossed-out work and straightens rotated pages. Transcription may fall back to Flash-Lite.
- Each photo is shrunk on the device (longest side 1600 px, JPEG) and sent to **`/api/transcribe`**, or straight to the student's own provider (§10.4). This is a vision model told only to transcribe the handwriting into text with LaTeX maths, marking unreadable parts [illegible].
- The transcription is added to the answer box, labelled "From photo · check it", for the student to correct before submitting. Marking and appeals then use that text as usual.
- **Photos are never stored.** `/api/transcribe` uses the same sign-in check as `/api/mark`, accepts one JPEG, PNG or WebP of about 3 MB at most, and reports 429 when over quota.

---

## 11. Content pipeline (offline, owner-run scripts)

Content is written **offline** by the owner (with Claude Code) as files committed to git, then checked by the build.

### 11.1 Question files
Each question in `content/questions/<course>/<unit>/<section>/<skill>.yaml` has:

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

Emphasis by tier:
- **T1–T2:** retrieval, notation, routine application.
- **T3–T4:** WACE exam style and its hardest items.
- **T5–T6:** creative, unfamiliar framing; multiple approaches; proof; synthesis across skills; no template feel. Tier 5 never goes above first-year undergraduate level. Tier 6 (monthly problems only) may reach second-year undergraduate difficulty, but only using knowledge already taught (§8.6).

Language rules for every question and solution:
- **Only taught terms.** Use vocabulary from the syllabus up to that skill (and the glossary built from tutorials, §3.1).
- **No untaught jargon.** Describe any other concept in plain English inside the question, without naming it. For example, write "the point where the three lines from each corner to the midpoint of the opposite side meet", not "the centroid".
- **Templates for routine setups.** Questions whose setup is routine use parameterized variants. For example, a "no two identical letters adjacent" arrangement question uses a list of words (MISSISSIPPI, GENERATED, METASTASIS, …), with each variant's answer computed and verified by the generator.

### 11.2 Verification (all must pass before merge)
1. **CAS verification:** run each question's SymPy `verify` code. It must reproduce every answer key, and every pre-generated variant. Any mismatch fails the build, and so does a question with computed answers but no `verify` code. Geometry answers are measured from a figure built from coordinates (helpers in `scripts/verify_geometry.py`), not re-derived from the theorem being tested.
2. **Constraint checks:** schema validation, form-rule sanity, diagram spec validity, and the trig simultaneous-equation constraints (§9.3).
3. **Owner review** in git/PR.

There is **no second-model cross-check** (another model solving every question independently): there isn't the quota for it. Student error reports (§11.4) catch what SymPy and review miss.

Tutorials (§3.1) are reviewed by the owner, with a deliberate pass for concision.

### 11.3 Build
`npm run build:content` validates everything and emits static JSON bundles (per course, per skill) deployed with the site to the Netlify CDN. This costs no Firestore reads.

### 11.4 Error reports (implemented)
1. **Report error** sits next to Share on every question (practice, quizzes, Challenges, daily, revision, shared problems, the Questions page) and at the end of every tutorial. It opens a dialog with one field, *What's wrong?* (up to 2,000 characters).
2. The report goes straight to Firestore `reports/{id}`: course, question or tutorial ID, the exact variant and words the student saw, the question's tier, the note, the student's name and uid, and status `open`. Rules let students create their own reports and read them back, nothing else.
3. **The owner reviews** at `/admin/reports` (linked from Settings for the owner's account, named by its uid in `firestore.rules` and `OWNER_UIDS`; an `admin` custom claim also works, for moderators later). Each report links to the exact problem it describes (a share link, §16.4c) or the tutorial. **Confirm** or **Dismiss**; either can be reopened.
4. Fixes ship in the next content release; nothing is hidden automatically. No server function, model call or GitHub token is involved.
5. **Rewards:** the next time a reporter opens the course (once per session), each newly confirmed report earns 50 XP and counts toward Spot the Flaw (P18) and, on a Tier 5 or 6 question, Counterexample (D21).

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
- Achievements whose feature doesn't exist yet (monthly problems) have `pending` rules: they're listed as "Not available yet" and can't be earned until the feature ships.
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
| P18 | Spot the Flaw | Report an error that gets confirmed |
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
- **Elo per game mode** (§15.7): Frontline, Divide, Draft, Exam Board and Race;
- Race personal bests (§15.5);
- cards collected (§13.7);
- **lifetime Lemmas** (`lemmasEarned`, not the spendable balance) and **Axioms proven**, shown by the highest Axiom's name (§13.6).

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
- Elo per game mode, current and peak (§15.7);
- leaderboard positions;
- with the economy (§13): banner, framed name and equipped title, the 3-card showcase, the card collection (read-only) and the Axioms proven (§13.11).

Phase 1: `/profile/<uid>` (the name in the header links to your own) shows name, level, tier and XP; problems, daily streak and achievement points; position on every board; per course the course rank, response-skill ranks and the tech tree read-only (under **Tech tree**); and earned achievements, secret ones marked. Elo arrives in Phase 3.

### 12.4 Global level
One account-wide **level**, earned with **XP** from almost everything a student does. It scales slowly: an hour gets a new student a few levels, while **level 500+ is reachable by determined students**, roughly 500 hours of activity over an ATAR career. There is no level cap.

**Level curve.**
- The XP needed to go from level L to L + 1 is **101 + 2L**, plus an **early extra** below level 50: 60 at level 1, shrinking evenly to 0 at level 50 (each level's extra rounded to a whole number). New students earn much faster than the long-run rate (first-visit, first-read, rank-up and daily bonuses all come early), so without it the first levels came every few minutes; with it, level 1 → 2 costs 163 XP, about **10 minutes** of early play, and costs rise to 200 by level 49. From level 50 the curve is unchanged.
- So the total XP needed to reach level L is **(L − 1)(L + 101)** plus the early extras of levels 1 to L − 1 (1,500 in all from level 50 on).
- The hours below assume about **600 XP per hour** of typical practice (tunable).

**Level tiers** use the same ladder as ranks and achievements, with Unranked called **Basic** here. The tier designs match the rank and achievement visuals (§12.1).

| Tier | Levels | Total XP to reach | ≈ Hours |
|---|---|---|---|
| Basic | 1–9 | 0 | 0 |
| Bronze | 10–24 | 1,495 | 2.5 |
| Silver | 25–49 | 4,127 | 7 |
| Gold | 50–99 | 8,899 | 15 |
| Platinum | 100–149 | 21,399 | 36 |
| Diamond | 150–199 | 38,899 | 65 |
| Ruby | 200–299 | 61,399 | 102 |
| Tanzanite | 300–399 | 121,399 | 202 |
| Vibranium | 400–499 | 201,399 | 336 |
| Solarium | 500–749 | 301,399 | 502 |
| Antimatter | 750+ | 638,899 | 1,065 |

**XP sources** (starting values, tunable):

| Activity | XP |
|---|---|
| Resolve a practice, quiz or challenge question | Correct: Tier 1 → 10, Tier 2 → 16, Tier 3 → 24, Tier 4 → 36, Tier 5 → 60. Wrong or given up: 4 (effort) |
| Free-response marked | 24 × tier × rubric score; a fifth of that for a question already answered (any time) |
| Read a tutorial (first time per skill; re-reads earn 0) | 40, once the end is reached **and** the page has been in view for the tutorial's reading time at 600 words a minute (maths counts as one word, diagrams none), so scrolling straight to the end earns nothing |
| Finish a section quiz / unit quiz | +50 / +100 bonus |
| Finish a Section Challenge | +200 bonus |
| Solve the daily problem | 30 + 10 × tier (on the first solve of each day's problem, per year group; written dailies at the 60% pass mark) |
| Score a monthly Tier 6 milestone | 100 per milestone |
| Rank up in a skill or response skill | Bronze 40, Silver 80, Gold 160, Platinum 280, Diamond 500 |
| Earn an achievement | 4 × its points |
| Play a Frontline game | 80, plus 40 for first place |
| Play a 1v1 minigame (Divide, Draft, Exam Board) | 50, plus 30 for a win |
| Play a Race game | 20, plus 10 for a win |
| Post a solution in a discussion | 20 (max 3 a day) |
| An error report confirmed by the owner (§11.4) | 50 |
| First visit of the day | 20 |

**Rules.**
- **XP per minute is roughly the same across tiers.** A Tier 4 question takes longer than a Tier 1 but pays more, so there is no XP reason to farm easy questions. Hard work is never punished.
- **Repeats:** an auto-marked question answered again within 30 days earns no XP; a written question answered again earns a fifth, however long ago (it's much easier the second time). A tutorial pays once.
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

**Storage.** Total XP lives on `users/{uid}` and is mirrored to `publicProfiles/{uid}` for leaderboards (§12.2: batched, not per answer). Practice XP is computed client-side, so it falls under the accepted client-side trust risk (§19). Competitive XP is awarded by Netlify Functions.

---

## 13. Lemmas, theorems and packs (planned)

A second, **spendable** layer on top of XP. XP measures lifetime effort and never goes down. **Lemmas** are earned alongside it (plus passive **Research** from institutes) and spent on **theorems** (an incremental upgrade tree), **packs** of collectible cards, and cosmetics. Achievements at Tanzanite and above also unlock **titles**.

**Rules** (all follow from §1.2 and §12.4)
- **Earned mostly by doing.** Almost every Lemma comes from an action that already earns XP. Lemmas inherit XP's repeat rules and daily caps, so nothing can be farmed that XP doesn't already allow. The one passive source, **Research**, starts slow and grows into a real alternative. Around 200 hours in, a day of Research earns about what an hour of practice does. By 400 hours a day of it is worth about 20 hours of practice, and Conjectures keep it growing long after that. Practice also speeds Research up directly, through the **Time Warp**.
- **Never touches learning.** Nothing bought, won or collected changes θ, ranks, gates, marking or question selection, and nothing gives hints.
- **Nothing decays or expires, and offline progress needs no collecting.** Research has no cap and no collect button: it is credited when the app loads, so being away never loses anything and coming back at a set time never gains anything. There are no limited-time offers and no shop rotation. What a student has earned only goes down when they spend it. (Milestones are different: a reached Axiom is **claimed** with a click, and upgrades are bought, §13.6.)
- **Nothing steers the student.** No upgrade pays more for one skill, section or unit than another.
- **No real money.** Lemmas, packs and cosmetics are never sold, and can't be traded or cashed out.
- **Can be hidden.** **Settings › Show rewards** off hides the whole economy for that student: the header count and **Lemmas** link, the hub, the result-row ∴ chip and Time Warp line, breakdown tooltips, and pack, Axiom and Conjecture celebrations. Equipped cosmetics and titles still render, for them and for others. Earnings, Research and pack grants still accrue.

### 13.1 Lemmas (∴)
- **Base:** each XP award also pays the same number of Lemmas, before multipliers: Lemmas = (XP + flat bonuses) × source multiplier × global multiplier.
- **Shown** next to the level badge in the header and as **+48 ∴** in the result row, on the same line as **+XP** (§16.4). The icon is labeled "Lemmas" for screen readers. Header behavior, tooltips and breakdowns are in §13.11.
- **SI notation, never scientific notation:**
  - Below 1,000, amounts show in full: **850 ∴**, "850 lemmas".
  - From 1,000 up they take an SI prefix, with three significant figures: **100 kilolemmas**, **4.56 megalemmas**, **12.3 gigalemmas**.
  - Where space is tight (header, result panel, buttons), the short form is used: **100 k∴**, **4.56 M∴**.
  - Prefixes run kilo (k, 10³), mega (M), giga (G), tera (T), peta (P), exa (E), zetta (Z), yotta (Y), ronna (R), quetta (Q, 10³⁰). Past that the number keeps growing in quettalemmas.
  - **Tooltips** (hover, focus or long-press) on any short form show the long name at the same three significant figures: **4.56 M∴** → "4.56 megalemmas". Exact digits are never shown.

### 13.2 Theorems (the upgrade tree)
Theorems are bought with Lemmas and have levels. Level n + 1 costs **base × growth^n**. They form a small dependency graph (the *proof tree*), drawn as a hand-placed diagram (§13.11); a theorem unlocks once its prerequisites are proven.

| Theorem | Boosts | Per level | Base cost | Growth | Requires |
|---|---|---|---|---|---|
| Successor Function | Resolved questions | +2 ∴ flat per question | 50 | 1.15 | — |
| Distributive Law | Quiz, unit quiz and Challenge bonuses | +10% | 200 | 1.15 | Successor Function 5 |
| Geometric Series | Daily problem | +1% × (1 + r + r² + … + r^(k−1)), r = 0.95, k = days solved ever (approaches +20%) | 300 | 1.15 | Successor Function 5 |
| Intermediate Value Theorem | Rank-ups (skills and response skills) | +15% | 400 | 1.15 | Distributive Law 3 |
| Euler's Identity | Achievements | +15% | 500 | 1.15 | Intermediate Value Theorem 3 |
| Binomial Theorem | Games (Phase 3; "Not available yet" until then) | +10% | 500 | 1.15 | Distributive Law 3 |
| Harmonic Series | All active sources | +0.5% × Hₙ, n = questions resolved ever | 1,000 | 1.2 | Geometric Series 5 |
| Pigeonhole Principle | Duplicate cards | +25% Lemmas per duplicate | 300 | 1.15 | — |
| Law of Large Numbers | Packs | Both pack guarantees come 5% of their base sooner (max level 10: Diamond 80 → 40, Platinum 10 → 5) | 2,000 | 2 | Pigeonhole Principle 5 |
| Golden Ratio | All sources | +6.18% | 5,000 | φ ≈ 1.618 | Harmonic Series 10 |
| Recurrence Relation | Research | +10% | 1,000 | 1.3 | Pigeonhole Principle 3 |

- Geometric Series and Harmonic Series grow with **counts that only go up** (days solved, questions resolved), so their bonuses never fall back.
- Each theorem's card shows its statement in one line of maths (e.g. Hₙ = 1 + ½ + ⅓ + … + 1/n), as flavor and as a tiny bit of learning.

### 13.3 Research (passive)
Research comes from **institutes**: one per era, bought with Lemmas and staffed by that era's cards. Like theorems, the (n + 1)th copy of an institute costs **base × 1.15ⁿ**. Each institute unlocks once one of the one before it is built.

| Institute | Era | Base cost | Output per copy (∴/day) |
|---|---|---|---|
| Academy | Antiquity | 2 k | 2.5 |
| House of Wisdom | Golden Age | 30 k | 20 |
| Observatory | Renaissance | 450 k | 160 |
| Learned Society | Enlightenment | 6.75 M | 1.28 k |
| Polytechnic | Steam Age | 101 M | 10.2 k |
| Research Institute | Machine Age | 1.52 G | 81.9 k |
| Particle Accelerator | Space Age | 22.8 G | 655 k |

- **Cards staff their era's institute, in limited slots.** Each institute has **staff slots**, and the student chooses which of that era's cards fill them (§13.11), so placing a rare card is a decision that feels good.
  - **Boost per slotted card:** Silver +2%, Gold +5%, Platinum +10%, Diamond +25% of that institute's output. A foil card doubles its own boost.
  - **Slots grow with copies built:** **1 slot per copy**, so the first copy opens 1 slot and each copy after it 1 more, up to **12 slots** (half a set) at the 12th copy. The cap keeps the rarest cards competing for room: a set's Diamonds and Platinums alone fill about 9 slots, leaving 3 for the best Golds.
  - **Why this schedule:** it was fitted with `scripts/economy_sim.py` to the calibration targets below. With a slot only every second copy, a day of Research at 400 hours would be worth about 10 hours of practice instead of 20, because a newly built institute starts with 1 copy and its era's packs have only just unlocked (§13.7). Above about 12, the cap barely changes the targets.
  - A card fills one slot at most. **Unslotted cards give nothing to Research**; collecting still counts toward set completion (its corollary and frame) and the Cards collected board.
  - A new card never replaces a slotted one by itself.
- **Time Warp.** Every 600 XP earned (about one active hour of practice) instantly credits **12 hours of Research** at the current rate.
  - It inherits XP's repeat rules and daily caps, so it rewards practice and can't be farmed.
  - Over a day, Research comes to about (1 + ½ × hours played) days' worth. Students who practice more keep pace in active hours, not just in calendar time.
  - Shown as a meter in the hub summary (**Time Warp · 420 / 600 XP**), and in the result row of the answer that fires it: **Time Warp +12 h · +5.4 k∴** (§13.11).
- **Other boosts:** Conjectures (below), Recurrence Relation, Golden Ratio, corollaries and Axioms all apply to Research. The question-specific theorems (Successor Function, Harmonic Series and so on) don't.
- **Calibration targets** for the early and middle game, for a typical student who plays about 0.75 hours a day (500 hours over two years, §12.4).
  - **Ratio:** one day of Research, Time Warp included, ÷ one active hour of practice.
  - **The simulated student** saves for whatever adds the most Lemmas per Lemma spent. The model is `scripts/economy_sim.py`: run it to print these tables, or with `fit` to refit the Axiom thresholds after changing a value.
  - **Included:** Axioms, Conjectures, the Time Warp, staff slots and era pack unlocks (§13.7).
  - **Assumed:** only free packs (level tiers, plus about 0.15 packs per active hour from Section Challenges and achievements and 0.5 a week from Full Weeks), the best cards held filling each institute's slots, and Axioms proven as soon as they're reached. Bought packs would raise the numbers a little.

  | Hours played | Practice (∴/hour) | Research (∴/day) | Ratio | Axioms | Conjectures |
  |---|---|---|---|---|---|
  | 100 | 5.88 k | 379 | 0.06 | 4 | 0 |
  | 200 | 10.3 k | 9.45 k | 0.9 | 6 | 0 |
  | 300 | 15.4 k | 76.4 k | 5.0 | 8 | 0 |
  | 400 | 22.9 k | 470 k | 21 | 10 | 0 |
  | 500 | 33.9 k | 11.1 M | 330 | 13 | 1 |
  | 600 | 67.6 k | 678 G | 10 million | 16 | 5 |
  | 700 | 132 k | 335 T | 2.5 billion | 18 | 9 |

  - **Early game:** practice is how Lemmas are earned.
  - **Around 200 hours:** a student who skips a day loses little, because Research already out-earns their typical 45 minutes of practice.
  - **From about 400 hours:** a day of Research equals about 20 hours of practice, so Lemmas stop being a constraint.
  - **From about 470 hours:** Conjectures take over. Each one multiplies Research by 2.5 and helps pay for the next, so growth compounds through the large cardinals.
- **The end goal: Rank-into-Rank after 1.5 years of 1.5 hours a day** (about 820 active hours). The Axiom thresholds are fitted to that student's curve. Every hour figure in this section counts **active hours** (time spent practicing); Research also accrues by calendar day.

  | Play per day | Rank-into-Rank (active hours) | Calendar time |
  |---|---|---|
  | 45 minutes | about 645 | 2.4 years |
  | 1.5 hours | about 820 | 1.5 years |
  | 3 hours | about 980 | 0.9 years |

  Playing more gets there sooner on the calendar but takes more active hours, because there are fewer days for Research to run. The Time Warp keeps that gap small.
- **Crediting:** in whole hours, whenever the app next loads. There's no cap and no collect button. Elapsed time comes from Firestore server timestamps, so changing the device clock gains nothing.
- **Shown** as a chip on the Lemmas page: **Research · 9.45 k∴/day**.

### 13.4 Conjectures (the long-term Research boost)
Conjectures are famous problems that the student's institutes "prove", one at a time, in order.
- **Cost:** each is bought with Lemmas. The first costs **50 M**, and each one after costs **10×** the last.
- **Effect:** each proven Conjecture **multiplies Research by 2.5**, permanently. The multipliers stack (×2.5, ×6.25, ×15.6, …).
- **Why the numbers work:** costs grow 10× while Research grows only 2.5×, so each Conjecture takes longer to reach than the one before. Growth compounds without running away, and the large cardinals arrive spread out rather than all at once.
- **Shown:** the Conjectures list shows every entry with its cost, its statement in one plain line, and when and by whom it was really proved. Proven ones carry a **Proved** chip.
- **The last two are the very end of the ladder**, after Rank-into-Rank: at 1.5 hours a day, about 1,300 and 1,900 active hours. The Riemann Hypothesis was proved only in November 2026, and P versus NP is still open: in Intellectify, Research can settle it; in the real world, nobody has.

| # | Conjecture | Cost | Statement | Really proved |
|---|---|---|---|---|
| 1 | Bertrand's Postulate | 50 M | For every n > 1 there's a prime between n and 2n | 1852, Chebyshev |
| 2 | Prime Number Theorem | 500 M | The number of primes up to x is about x / ln x | 1896, Hadamard and de la Vallée Poussin |
| 3 | Weil Conjectures | 5 G | Counting solutions of polynomial equations over finite fields obeys a Riemann Hypothesis of its own | 1960–1974, Dwork, Grothendieck and Deligne |
| 4 | Four Color Theorem | 50 G | Every map can be colored with four colors so no neighbors match | 1976, Appel and Haken |
| 5 | Mordell Conjecture | 500 G | A curve of genus 2 or more has only finitely many rational points | 1983, Faltings |
| 6 | Fermat's Last Theorem | 5 T | aⁿ + bⁿ = cⁿ has no positive whole-number solutions for n > 2 | 1994, Wiles (with Taylor) |
| 7 | Kepler Conjecture | 50 T | No packing of equal spheres is denser than the grocer's stack | 1998, Hales |
| 8 | Catalan's Conjecture | 500 T | 8 and 9 are the only consecutive perfect powers | 2002, Mihăilescu |
| 9 | Poincaré Conjecture | 5 P | Every simply connected, closed 3-manifold is a 3-sphere | 2003, Perelman |
| 10 | Weak Goldbach Conjecture | 50 P | Every odd number greater than 5 is a sum of three primes | 2013, Helfgott |
| 11 | Riemann Hypothesis | 500 P | Every nontrivial zero of ζ(s) has real part ½ | 2026, Alpöge (with AI; formally verified in Lean) |
| 12 | P versus NP | 5 E | Is every problem whose answer can be checked quickly also quick to solve? | Open |

### 13.5 Corollaries (free, automatic, permanent)
Corollaries follow from what a student has already done. They are added together into one global factor.
- Each achievement earned: +(points ÷ 10)%, so +1% for Platinum and +150% for Antimatter.
- Each level tier reached (§12.4): +5%.
- Each completed era set (below): +10%.

### 13.6 Axioms (milestones)
Axioms are **milestones of lifetime Lemmas earned**, starting at 10 kilolemmas. Spending never takes one away, and nothing resets.
- **Reached, then proven.** Crossing a threshold makes the Axiom *reached*. The student **claims** it with **Prove** in the hub (free: it spends nothing), and only then does it apply. A reached Axiom waits indefinitely; nothing is lost by claiming late, but its bonus doesn't apply until then. Several reached at once are claimed together (**Prove 3**, §13.11).
- **Each Axiom gives, once proven:** +5% to all sources (practice and Research) permanently, plus **its own cosmetic**, which can't be bought or found in packs.
- **Some Axioms also give a title** (see Titles).
- **Spacing:**
  - **Fitted to a curve:** thresholds follow the growth curve of a student who plays 1.5 hours a day, so that Rank-into-Rank arrives after 1.5 years.
  - **The nine ZFC axioms** (10 k to 15 M) spread over the first 420 or so active hours, starting with an early taste about 14 hours in.
  - **The nine large cardinals** (20 M to 1 P) then arrive about every 25–75 active hours, up to Rank-into-Rank at about 820. Conjectures carry students through them.
- **Display:** the hub summary shows the next Axiom and its progress, e.g. **Union · 640 k∴ / 700 k∴**; once reached it becomes a **Prove Union** button (§13.11).
- **Statements:** each Axiom's card shows its statement in one plain line, as flavor and a glimpse of set theory.
- **The "≈ Hours" column** is the simulation's estimate in **active hours** for a student playing 1.5 hours a day. At 45 minutes a day the late Axioms come sooner in active hours (Rank-into-Rank at about 645).

| # | Axiom | At | ≈ Hours | Statement | Cosmetic | Title |
|---|---|---|---|---|---|---|
| 1 | Extensionality | 10 k | 14 | Sets with the same elements are equal | **Venn** banner: two circles slide together and become one | — |
| 2 | Regularity | 30 k | 26 | Every nonempty set has an element disjoint from it, so there's no endless ∈-descent | **Well-Founded** node theme: the tech tree stands on a drawn ground line, with roots under the first skills | — |
| 3 | Specification | 100 k | 50 | Any definable property carves a subset out of a set | **Set-Builder** keypad skin: keys framed like { x ∣ … }, with a fine sieve texture | — |
| 4 | Pairing | 300 k | 100 | For any a and b, {a, b} is a set | **Pair** celebration: two sparks spiral together into one | — |
| 5 | Union | 700 k | 150 | The members of a set's members form a set | **Union** banner: many small sets drift together into one | — |
| 6 | Replacement | 1.5 M | 215 | The image of a set under a definable function is a set | **Image** celebration: each symbol of the answer maps, one to one, onto a star | — |
| 7 | Infinity | 3 M | 285 | There is an infinite (inductive) set | **∞ Lemma icon**: the ∴ in the header becomes a slowly tracing ∞ | Inductive |
| 8 | Power Set | 5 M | 335 | Every set has a set of all its subsets | **Hasse** node theme: tree edges drawn as the lattice of a power set | — |
| 9 | Choice | 15 M | 425 | Every family of nonempty sets has a choice function | **Banach–Tarski** celebration: a sphere splits into pieces that reassemble into two | Well-Ordered |
| 10 | Inaccessible | 20 M | 445 | A cardinal that unions and power sets of smaller ones can never reach | **Unreachable** banner: a ladder of ℵ's climbing out of view | Inaccessible |
| 11 | Mahlo | 50 M | 520 | Inaccessible, with inaccessibles below it so common they form a stationary set | **Stationary** keypad skin: the keys hold still while a field of stars turns behind them | — |
| 12 | Weakly Compact | 70 M | 550 | Inaccessible, and every tree of its height with small levels has a full-length branch | **Tree Property** node theme: one unbroken branch glows from the root to the top of the tech tree | — |
| 13 | Measurable | 100 M | 585 | Carries a two-valued measure: a κ-complete nonprincipal ultrafilter | **Ultrafilter** celebration: light pours down through a funnel of nested sets | Measurable |
| 14 | Strong | 500 M | 645 | The universe embeds into inner models that agree with it up to any chosen rank | **Embedding** profile banner: the profile shows a smaller faithful copy of itself inside | — |
| 15 | Woodin | 1.5 G | 685 | Infinitely many of them make every projective game determined | **Determinacy** keypad skin: keys light alternately, like moves in an infinite game | — |
| 16 | Supercompact | 50 G | 730 | Embeddings whose targets are closed under sequences of any chosen length | **Supercompact** node theme: the whole tree folds into a single point and unfolds when the map opens | — |
| 17 | Huge | 50 T | 780 | An embedding whose target is closed under sequences as long as the image of its critical point | **Huge** celebration: the celebration fills the whole screen | Huge |
| 18 | Rank-into-Rank | 1 P | 820 | A rank of the universe embeds into itself: one step short of what Kunen proved inconsistent | **Edge** name ornament: a hairline of light flickers along the name's edge | Edge of Consistency |

### 13.7 Packs and cards
Cards are scientists, mathematicians and philosophers, sorted into **era sets**. A pack holds 3 cards from one era.

**Eras.** A person sits in the era of their major work, not their birth. The Space Age starts in 1955, with the postwar turn toward postmodernism and the counterculture. The sets (first draft, `content/cards/`; rarities are the owner's call):

| Pack | Years | Diamond | Platinum | Gold | Silver |
|---|---|---|---|---|---|
| Antiquity Pack | to 500 | Pythagoras, Socrates, Plato, Aristotle, Euclid, Archimedes | Thales of Miletus, Confucius, Hippocrates of Kos, Eratosthenes, Claudius Ptolemy, Galen, Diophantus of Alexandria | Democritus, Zeno of Elea, Epicurus, Apollonius of Perga, Hipparchus, Aryabhata | Heraclitus, Eudoxus of Cnidus, Aristarchus of Samos, Hero of Alexandria, Liu Hui, Hypatia |
| Golden Age Pack | 500–1400 | Brahmagupta, Muhammad ibn Musa al-Khwarizmi, Ibn Sina (Avicenna), Leonardo of Pisa (Fibonacci), Thomas Aquinas | Ibn al-Haytham (Alhazen), Omar Khayyam, Ibn Rushd (Averroes), Moses Maimonides, Abu Rayhan al-Biruni, Bhaskara II | Boethius, Abu Bakr al-Razi (Rhazes), Abu Nasr al-Farabi, Nasir al-Din al-Tusi, William of Ockham, Ibn Khaldun | Abu Yusuf al-Kindi, Thabit ibn Qurra, Anselm of Canterbury, Shen Kuo, Yang Hui, Nicole Oresme, Madhava of Sangamagrama |
| Renaissance Pack | 1400–1650 | Leonardo da Vinci, Nicolaus Copernicus, Galileo Galilei, René Descartes | Johannes Kepler, Pierre de Fermat, Francis Bacon, Niccolò Machiavelli, Andreas Vesalius, William Harvey | Tycho Brahe, Gerolamo Cardano, François Viète, John Napier, Michel de Montaigne, Desiderius Erasmus, Paracelsus | Regiomontanus, Niccolò Tartaglia, Simon Stevin, William Gilbert, Giordano Bruno, Marin Mersenne |
| Enlightenment Pack | 1650–1800 | Isaac Newton, Gottfried Wilhelm Leibniz, Leonhard Euler, Immanuel Kant | Blaise Pascal, John Locke, Baruch Spinoza, David Hume, Joseph-Louis Lagrange, Pierre-Simon Laplace, Antoine Lavoisier | Thomas Hobbes, Christiaan Huygens, Robert Boyle, Carl Linnaeus, Jean-Jacques Rousseau, Adam Smith, Edward Jenner | Robert Hooke, Antonie van Leeuwenhoek, Jacob Bernoulli, Abraham de Moivre, Émilie du Châtelet, Voltaire, Benjamin Franklin |
| Steam Age Pack | 1800–1880 | Carl Friedrich Gauss, Charles Darwin, James Clerk Maxwell, Louis Pasteur, Karl Marx | Michael Faraday, Augustin-Louis Cauchy, Évariste Galois, Bernhard Riemann, Gregor Mendel, Georg Wilhelm Friedrich Hegel, Dmitri Mendeleev | Joseph Fourier, John Dalton, William Rowan Hamilton, George Boole, John Stuart Mill, Søren Kierkegaard, Arthur Schopenhauer | Sophie Germain, Niels Henrik Abel, Nikolai Lobachevsky, Charles Babbage, Ada Lovelace, Florence Nightingale, Joseph Lister |
| Machine Age Pack | 1880–1955 | Albert Einstein, Marie Curie, Friedrich Nietzsche, Sigmund Freud, Alan Turing, Richard Feynman, Jean-Paul Sartre | Georg Cantor, Henri Poincaré, David Hilbert, Max Planck, Ernest Rutherford, Niels Bohr, Werner Heisenberg, Kurt Gödel, John von Neumann, Francis Crick | Erwin Schrödinger, Emmy Noether, Srinivasa Ramanujan, Bertrand Russell, Ludwig Wittgenstein, Claude Shannon, Karl Popper, Simone de Beauvoir | Gottlob Frege, Alexander Fleming, Nikola Tesla, Paul Dirac, Rosalind Franklin, John Nash |
| Space Age Pack | 1955 on | Stephen Hawking, Gilles Deleuze, Noam Chomsky, Michel Foucault | Alexander Grothendieck, Roger Penrose, Andrew Wiles, Tim Berners-Lee, Thomas Kuhn, Jacques Derrida | Chien-Shiung Wu, Benoit Mandelbrot, Paul Erdős, Hannah Arendt, John Rawls, Daniel Kahneman, Terence Tao, Grigori Perelman, Rachel Carson, Jean-François Lyotard | Grace Hopper, Dorothy Hodgkin, Jonas Salk, Peter Higgs, John Horton Conway, Maryam Mirzakhani, Carl Sagan, Jane Goodall |

**Content rules**
- Cards live in `content/cards/<era>.yaml` (format in `content/cards/README.md`), with: id, name, born and died (or the year they flourished, when neither is known; approximate dates are marked), the year of their **major work** (which picks the era), fields (Mathematics, Statistics, Computing, Physics, Astronomy, Chemistry, Biology, Medicine, Psychology, Philosophy, Economics, History, Geography, Engineering, Art), rarity, Wikidata id (optional), portrait (see Portraits below), blurb, and related skill ids (optional).
- **Living people are allowed.** Every set mixes mathematics, science and philosophy.
- **Notability first.** Every card is someone notable in their own right. No one is added to balance a set by region or any other quota.
- **Blurb:** at most two sentences on what they did and why it mattered. This is learning content, so full sentences are fine (§16.1). Quotes are used only when the person is known to have actually said them.
- **Related skills** show as chips on the card's detail view (e.g. Euler → the skill on complex exponential form), linking to the skill page. They're information, not a suggestion of what to practice: nothing about a card changes what is served.
  - **Kept current as courses are added.** Related ids may point into any course. The card check fails on an id that no course has, so a renamed or removed skill can't leave a dead chip.
  - **New courses are flagged automatically.** The check also warns about every skill, in any course, whose name or summary mentions a card's person (Pascal's triangle, de Moivre's theorem) when that card doesn't link it yet. Adding a course surfaces its links to add, with no list to remember.
- **Set size:** about 24 cards. The Machine Age is the most crowded, at about 30.
- **Rarity** (the owner's judgment):
  - **Diamond:** profoundly transformed their field *and* is extremely famous (Einstein, Feynman, Turing, Nietzsche, Deleuze, Maxwell). There's no quota; the count per set follows from who qualifies, usually 3–6.
  - **Platinum:** transformed their field, and is well known to anyone who studies it.
  - **Gold:** made a major contribution that lasted.
  - **Silver:** did notable work that is still taught or cited.
- **Portraits** are public domain, CC0, **CC BY** or **CC BY-SA**, or an original illustration. Each keeps its file, source, author and license. Commons' **No restrictions** tag counts as public domain and its **Attribution** tag as CC BY.
  - **Credit:** a CC BY or CC BY-SA portrait shows its author, license and source link in the card's detail view (§13.11). The duotone is a modified version ("Adapted"), and a CC BY-SA portrait's WebP is shared under the same license.
  - **Finding them:** `scripts/find_portraits.py` matches each card to its Wikidata person, takes the portrait Wikidata lists, reads its license on Wikimedia Commons, and sorts the cards into ready, credit, check (a photo of a bust, statue, coin or stamp, or a public-domain claim on a recent photo) and illustrate. Its report is `content/cards/portraits.md`.
  - **Owner decisions** live in `content/cards/portraits/overrides.yaml`: a different Commons file for a card, an image the owner supplies, and the checks the owner has done, each tied to the exact file so a new image is checked again.
  - **Processing:** `scripts/process_portraits.py` downloads each chosen image at a standard Wikimedia thumbnail width, finds the face (OpenCV, or a position set by hand in the overrides), applies the ink wash (§13.11), saves `content/cards/portraits/<id>.webp` and fills in the card's `portrait` field. Cards still waiting on a check are skipped, and faces it can't find are listed for a hand-set position.
  - **Illustrations** fill the gaps, mostly people with no known likeness, in one style that suits the duotone. They aren't AI-generated likenesses of real people.
- **Build checks** (`scripts/verify_cards.py`): dates, era ranges by major work, at least 3 Diamonds and 4 cards of every other rarity per set, blurb length, portrait license and related skill ids.
- **Launch:** all seven eras together. Every set is drafted; portraits are being sourced.

**Era unlocks.** Antiquity packs are available from the start. Each later era's packs unlock with the **first copy of the previous era's institute** (Golden Age packs with the first Academy, Renaissance packs with the first House of Wisdom, and so on), which is also when that era's own institute unlocks (§13.3). Locked eras show as sealed packs with the bare-label condition, e.g. **Build an Academy**.

**Getting packs.** Every pack belongs to one era, fixed when it is granted or bought. Later eras cost more.

| Source | Packs |
|---|---|
| Reaching a level tier (§12.4), in proportion to the XP since the previous tier (Bronze = 1) | Bronze 1 · Silver 2 · Gold 3 · Platinum 8 · Diamond 12 · Ruby 15 · Tanzanite 40 · Vibranium 54 · Solarium 67 · Antimatter 226 |
| Finishing a Section Challenge | 1 |
| Achievement | Platinum 1 · Diamond 2 · Ruby 3 · Tanzanite 5 · Vibranium 8 · Solarium 12 · Antimatter 20 |
| A Full Week of daily problems (Mon–Sun, as in P8) | 1 |
| Buy with Lemmas | A fixed price per era: Antiquity 1 k∴; later eras cost more, at prices fitted with `scripts/economy_sim.py` |

**Which era a free pack is.** The source's tier picks it, capped at the latest unlocked era (if the picked era is locked, the latest unlocked one before it):

| Source tier | Era |
|---|---|
| Level tier Bronze or Silver; Platinum achievement | Antiquity |
| Level tier Gold; Diamond achievement | Golden Age |
| Level tier Platinum; Ruby achievement | Renaissance |
| Level tier Diamond; Tanzanite achievement | Enlightenment |
| Level tier Ruby; Vibranium achievement | Steam Age |
| Level tier Tanzanite; Solarium achievement | Machine Age |
| Level tier Vibranium and above; Antimatter achievement | Space Age |
| Section Challenge, Full Week (no tier) | Latest unlocked era |

**Opening**
- **Odds per card:**
  - Cards 1–2: Silver 72%, Gold 20%, Platinum 6.5%, Diamond 1.5%.
  - Card 3, the guaranteed **Gold or better**: Gold 92%, Platinum 6.5%, Diamond 1.5% (the same Platinum and Diamond odds as the others).
  
  The odds table is always shown on the pack screen.
- **Pity:** two guarantees by pack count, each kept per era. Law of Large Numbers shortens both by 5% of their base per level, so they keep the same proportion (halves round to the sooner pack).
  - **Platinum:** a Platinum or better by the **10th** pack of an era without one (5 at most, with Law of Large Numbers 10). A Diamond counts.
  - **Diamond:** a Diamond by the **80th** pack of an era without one (40 at most).
  - A guaranteed card takes the place of card 3. The counters are shown, e.g. "Diamond in ≤ 61 · Platinum in ≤ 7".
- **No duplicate Diamonds** until every Diamond in that era has been collected; the roll picks among the missing ones instead.
- **Duplicates** turn into Lemmas: Silver 20, Gold 60, Platinum 200, Diamond 600 (× Pigeonhole Principle).
- **Foil:** 1 card in 25 has a foil finish in its rarity's material. A foil copy of a card already held upgrades that card's finish instead of converting.
- **Rolls are fixed in advance:** each pack's cards come from a seeded hash of the uid, the era and that era's packs-opened count, so reloading can't re-roll a pack. This runs on the client like the rest of practice (§19, risk 4).

**Collection.** One shelf per era, in the hub's **Collection** tab and, read-only, on every public profile. Uncollected cards show as silhouettes with their name, rarity and fields; the portrait, dates and blurb appear once collected. Completing an era set unlocks that era's **profile frame** (which can't be bought) and its corollary. A profile can **showcase** up to 3 cards. Layout and card design are in §13.11.

### 13.8 Cosmetics (Lemma shop)
Bought at fixed prices, and cosmetic only. Every item can be previewed live before buying (§13.11).
- **Keypad skins** for the on-screen keypad (§7.2).
- **Answer celebrations** for correct answers and rank-ups.
- **Profile banners.**
- **Tech-tree node themes.**

Frames come only from era sets, Axiom cosmetics only from Axioms, and titles only from achievements and Axioms.

### 13.9 Titles
- **Every Tanzanite, Vibranium, Solarium and Antimatter achievement unlocks one unique title, and so do six Axioms** (Infinity, Choice, Inaccessible, Measurable, Huge, Rank-into-Rank). Titles can't be bought or dropped, so a title always means its feat.
- A title unlocks the first time its achievement is earned in any course.
- **Shown:** one equipped title under the name on profiles, in lobbies and on leaderboards.
- **Tooltip:** the achievement's name and tier, or the Axiom's name. Secret criteria stay hidden (§12.1).
- **Data:** in `content/achievements.yaml`, each achievement from Tanzanite up has a `title`. The build checks that every one has a title, that titles are unique, and that no lower tier has one.
- **Styles:**
  - **Tanzanite and Vibranium:** text in the tier's color and material, with its gem glyph. These don't move.
  - **Solarium and Antimatter:** each title has its **own animated effect**, built on the tier visuals of §12.4 (Solarium radiant and gold, Antimatter a void with an iridescent rim).
  - **Axiom titles:** ink serif small caps with a silver ∈ glyph. Inductive, Well-Ordered, Inaccessible and Measurable don't move.
    - **Huge** animates: the letters slowly swell a little and settle.
    - **Edge of Consistency** animates: the title holds a smaller copy of itself, which holds another, zooming in endlessly.
- **Effects, in practice:**
  - They run in CSS and SVG only, the title stays real, selectable text, and contrast passes WCAG AA.
  - On leaderboard rows the effect plays only on hover or focus, so long lists stay calm and cheap. It plays in full on profiles, in lobbies and in the achievement's full-screen celebration.
  - Reduced motion shows a still frame.
  - A preview of every title is at `/dev/titles`.

**Tanzanite**

| # | Achievement | Title | Why |
|---|---|---|---|
| T1 | Bedrock II | Keystone | The stone that holds the arch up |
| T2 | Diamond Unit | Unit Vector | A unit, at full magnitude |
| T3 | Frontier Hundred | Boundary Point | In topology the boundary is also called the frontier |
| T4 | Hundred Straight | Straightedge | Euclid's tool for drawing straight lines |
| T5 | Tier Six | Sixth Sense | Tier 6 |
| T6 | Half-Year | Solstice | 182 days is solstice to solstice |
| T7 | Unit Sweep | Exhaustive | The method of exhaustion: leave nothing out |
| T8 | Diamond Mind | Polymath | Every response skill |
| T9 | Year Diamond | Twin Prime | Two units, both Diamond |
| T10 | Perfect Year | Perfect Number | Two perfect Unit Quizzes |
| T11 | Grand Prover | Proofwright | A maker of proofs |
| T12 | Top of the Month | Supremum | The least upper bound |
| T13 | 🔒 Grandmaster Opening | Steep Gradient | Diamond in almost no time |
| T14 | 🔒 Contrapositive | Non Sequitur | Mastery that doesn't follow from its prerequisites |
| T15 | 🔒 Fractal | Self-Similar | The same rank at every scale |
| T16 | 🔒 Show Your Working | Worked Example | A solution posted every day |

**Vibranium**

| # | Achievement | Title | Why |
|---|---|---|---|
| V1 | Course Diamond | Closure | The whole course, closed |
| V2 | Ten Thousand | Myriad | Greek for ten thousand |
| V3 | Frontier Five Hundred | Cartographer | Has mapped the frontier |
| V4 | Triple Six | Honeycomb | Hexagons divide the plane most efficiently (Hales' honeycomb theorem) |
| V5 | Orbit | Revolutionary | One full revolution of the Sun |
| V6 | Two Hundred Straight | Geodesic | The straightest possible path |
| V7 | Challenge Master | Universal | ∀ Challenges |
| V8 | Diamond Everywhere | Everywhere Dense | Diamond in every neighborhood of the tree |
| V9 | 🔒 Flawless Frontier | Measure Zero | Errors: a set of measure zero |
| V10 | 🔒 Lone Wolf | Unique Solution | The only one who solved it |
| V11 | 🔒 QED | Tombstone | The ∎ that ends a proof |
| V12 | 🔒 Unblemished | No Remainder | A hundred questions, divided cleanly |
| V13 | 🔒 Speed of Thought | Instantaneous | The instantaneous rate of change |

**Solarium** (animated)

| # | Achievement | Title | Effect |
|---|---|---|---|
| S1 | Six Suns | Helios | Six small suns orbit the title on a hexagonal path |
| S2 | Five Hundred Straight | Infinite Ray | A thin beam of light runs through the letters and on past the end, never coming back; a new one starts every few seconds |
| S3 | Total Mastery | Totality | The title sits in front of a total eclipse: a corona flares around it, with beads of light at its edges |
| S4 | 🔒 Diamond Hands | Fixed Point | Sun rays turn slowly around a fixed dot beside the title, which stays perfectly still |
| S5 | 🔒 One Shot | Unit Impulse | A single sharp spike of light (a Dirac delta) rises from the baseline and lights every letter for an instant, then is gone |

**Antimatter** (animated)

| # | Achievement | Title | Effect |
|---|---|---|---|
| A1 | Annihilation | Annihilator | Void-black letters with an iridescent rim; a particle and an antiparticle appear at either end, meet in the middle and annihilate in a white flash. (In algebra, an annihilator is the set of elements that send everything to zero.) |
| A2 | 🔒 Event Horizon | Singularity | The letters bend around a black core at the title's center, as if gravitationally lensed, with a faint accretion ring |
| A3 | 🔒 Annus Mirabilis | Mirabilis | The letters are windows onto deep space: a starfield drifts inside them and a comet crosses once per cycle |

### 13.10 Storage
- `users/{uid}/meta/economy` holds:
  - `lemmasEarned` and `lemmasSpent` (*reached* Axioms follow from `lemmasEarned`); `axiomsProven`, the count claimed (§13.6), which only goes up;
  - `researchCreditedAt`, written as server time (the rules require `request.time`);
  - theorem levels, institutes built and Conjectures proven;
  - unopened packs per era, packs opened per era and Diamond and Platinum pity counters per era;
  - cards (id → count, foil) and staff slots per institute (slot → card id);
  - owned cosmetics, unlocked titles and the equipped title, frame, banner, keypad skin, celebration, node theme and showcase;
  - `lastVisit`: the balance, lifetime Lemmas and Research credited at the end of the last hub visit, for the hub's **Since last visit** line (§13.11).
- **Balance** = `lemmasEarned − lemmasSpent`.
- **Firestore rules** refuse any write that lowers `lemmasEarned`, `lemmasSpent`, `axiomsProven` or a packs-opened count, or that makes `lemmasSpent` exceed `lemmasEarned`. This is the same guard as XP (§17.2). A purchase raises `lemmasSpent`, so every counter only goes up.
- **Saving:** changes are saved in the same batched write as XP and the public mirror (§12.2).
- **Public mirror:** `publicProfiles/{uid}` gains the equipped title, frame, banner and showcase; the collection (card ids, with a foil flag; about 170 ids at most, well within a document); `lemmasEarned`; and `axiomsProven`. These feed the profile's collection and the **Cards collected**, **Lifetime Lemmas** and **Axioms** boards (§12.2). Theorems, institutes, staff and the balance stay private.
- **Logic:** formulas (earn rates, Research, Conjectures, theorem costs and effects, corollaries, Axioms, pack rolls) are pure functions in `packages/engine/src/economy.ts`, unit-tested like `level.ts`. Theorem, institute, Conjecture, Axiom (thresholds, cosmetics, titles), pack and shop values live in `content/economy.yaml`.

### 13.11 Screens, layout and motion
Copy follows §16.1: bare labels, chips and numbers. Full sentences only in learning content (theorem, Axiom and Conjecture statements, card blurbs) and the one-line first-open notes. There is **no sound** anywhere.

#### Where it lives
- **Header.** The nav gains **Lemmas** (→ `/lemmas`) after Leaderboards. The ∴ balance sits after the level badge, in short form (**4.56 M∴**), and also links to `/lemmas`.
  - **Count-up:** when XP or Lemmas change, the header number (and the level bar) rolls from the old value to the new one over about 600 ms, ease-out. The tooltip shows the final value at once. Reduced motion swaps instantly.
  - **Pip:** a small dot on the ∴ count while an Axiom is reached but not proven (screen readers: "Axiom to prove"). Nothing else pips: packs, affordable upgrades and new cards never do.
- **Hub** (`/lemmas`): tabs **Theorems · Research · Conjectures · Axioms · Packs · Collection · Shop**, under a summary strip. Only the hub takes the archive look (below); the header, result row, profile, pack overlay chrome and the rest of the site keep the standard style.
- **Profile** (§12.3): banner, frame, title, showcase, collection and Axioms. App-wide cosmetics (keypad skin, celebration, node theme) are equipped in **Shop › Wardrobe**.
- **Show rewards off** (§13 rules) removes the nav link, header count, pip and hub; `/lemmas` shows "Rewards hidden · Settings".

#### Hub summary
- **Contents, in order:** balance · **Research 9.45 k∴/day** · **Time Warp 420 / 600 XP** (a thin meter) · next Axiom (**Union · 640 k∴ / 700 k∴**, or the **Prove Union** / **Prove 3** button once reached) · buy amount **×1 / ×10 / Max** · **Multipliers**.
- **Since last visit · +12.3 k∴ · Research 14 h** heads the summary when anything changed since the last hub visit (from `lastVisit`, §13.10). It stays for the whole visit and resets when the student leaves the hub or hides the page. It appears nowhere else: there is no return toast.
- **Multipliers** opens a panel listing every active multiplier by source: theorems, corollaries (achievements, level tiers, era sets), Axioms and, for Research, Conjectures and staff, with each source's total.
- **Sticky** at the top of the hub on wider screens; not sticky on phones (below).

#### Tabs: unlock and peek
- **From the start:** Theorems, Packs, Collection and Shop.
- **Research:** at 2 k∴ lifetime earned (an Academy is affordable).
- **Axioms:** when the first Axiom is reached.
- **Conjectures:** once Research reaches 250 k∴/day (half the first Conjecture's price per 100 days).
- **Later:** a final, quiet tab item lists the tabs not yet open as silhouettes with their bare-label condition ("Research · 2 k∴ earned"). It disappears once every tab is open.
- **First-open note:** the first time a tab opens, one marginal sentence says what it's for (e.g. "Institutes earn Lemmas while you're away; cards you place in their slots boost them."). × dismisses it for good (localStorage, like the Paper first tip, §16.5a).
- **Keys:** Shift+1–7 switch tabs. Every hub shortcut is off while typing in a field or while a sheet or overlay is open; buttons name theirs in their tooltip ("Max (M)").

#### Buying
- **Buy amount** ×1 / ×10 / Max (in the summary) applies to every theorem and institute button. The button shows the total for that amount; Max also shows the count: **Max · 7 · 12.4 k∴**. If ×10 isn't affordable the button stays pencil and shows what 10 would cost.
- **No confirmations and no undo.** A purchase applies at once and saves with the next batched write (§12.2).
- **M** buys the max on the current tab only (Theorems or Research): it repeatedly buys the single **cheapest next level** available on that tab, including theorems it newly unlocks, until nothing more is affordable. It never buys Conjectures, packs or cosmetics. A toast reports **Bought 23 levels · 41.2 k∴**.
- **Affordability: inked vs pencil.** Affordable items render in full ink. Unaffordable ones render in pale pencil grey, with their price. There are no fill bars, progress rings, tab dots or badges: affordability never pulls.

#### Theorems: the proof tree
- **Hand-placed SVG** of the 11 theorems, each at a fixed position given in `content/economy.yaml`, composed to read like a page of a proof. Nodes are engraved plates with the name and level (**Lv 12**). Edges are ink lines ending in a small ∴: prerequisite ∴ theorem.
- **Locked theorems** are pencil outlines with the requirement as a label (**Successor Function 5**). Binomial Theorem shows "Not available yet" until games ship.
- **Selecting a node** opens a side panel (a bottom sheet on phones): name, statement (one line of KaTeX), effect now → next (**+24 ∴/question → +26**), cost at the chosen buy amount, the ×1/×10/Max buttons, Requires and Unlocks. Nodes are focusable in reading order; Enter opens the panel and Escape closes it.

#### Research: institutes and staff
- **One row per institute**, in era order: the institute's engraving, name, era, copies, output per day (per copy and total, staff boost included) and buy controls.
- **Staff strip** under each row: the slots, each filled with a portrait thumbnail in its rarity frame or drawn as a dashed empty slot; the total staff boost (**Staff +64%**); and when the next slot opens (**Next slot · copy 8**, or **12 / 12 slots** once full).
- **Click a slot** to open a picker of that era's owned cards, sorted by boost (Diamond foil first), each with its boost. A card already in a slot is marked **Slotted**, and choosing it moves it. **Remove** empties the slot. Newly pulled cards never fill or replace slots on their own.
- **Locked institutes** show as a sealed silhouette with the bare-label condition (**Build an Academy**).

#### Conjectures: the ledger
- **A vertical ledger in order.**
  - **Proven** entries carry a **Proved** stamp, the date the student proved it, and the real prover and year.
  - **The next entry** shows its cost, statement, the Research rate it would give (**×2.5 → 27.0 M∴/day**) and **Prove** (inked when affordable).
  - **Later entries** show their cost and statement in pencil.
  - **The open problem** (P versus NP) sits below a double rule labeled **Open**.
- **Proving one** opens a full-screen celebration: the statement, who really proved it and when (or "Open"), and the new Research rate.

#### Axioms
- **A ladder of 18**, in two groups: **ZFC** and **Large cardinals**. Each row has the name, threshold, statement (as marginalia), cosmetic and title.
  - **Proven:** inked, with the date.
  - **Reached:** a **Prove** button.
  - **Next:** lifetime progress, **640 k∴ / 700 k∴**.
  - **Later:** pencil. Their cosmetics show as a silhouette with the condition until proven.
- **Claiming:** **Prove** (in the summary or on the ladder) opens a full-screen celebration: the Axiom, its statement and what it unlocks (cosmetic, title, +5%), with **Equip · Later**. Equip puts the cosmetic (and title) on at once.
- **Several reached:** **Prove 3**. The earlier ones flash by briefly (name and statement, about 0.8 s each), and the highest gets the full celebration. The unlocks list each cosmetic and title with its own **Equip**; **Later** closes.

#### Packs
- **One pack per era**, in era order, each drawn in its era's style. Each shows:
  - the unopened count and the era's price, with **Buy** and **Buy 10**;
  - **Open**, **Open 10** and **Open all**;
  - set completion (**14 / 24**), the pity counters (**Diamond in ≤ 61 · Platinum in ≤ 7**) and the Diamonds still missing;
  - the odds table, always visible beneath it.
- **Locked eras** show as sealed packs with their condition (**Build an Academy**).
- **Granted packs** wait here quietly: no toast, no pip, no prompt anywhere else.

#### Opening a pack
- **Single pack:** a full-screen overlay.
  - **The cards:** three face-down cards fan out; the third, the guaranteed Gold-or-better card, is slightly larger and last. All backs look the same, so nothing tells what's coming.
  - **Flipping:** click or tap a card, or press Space or Enter, to flip the next one (a 3D turn of about 300 ms; a crossfade with reduced motion). **Reveal all** flips the rest.
  - **Duplicates** flip like any card and carry a count badge (**×2**). A foil duplicate of a held card shows **Foil upgrade**.
  - **A Diamond** flips like the others, then gets a crystal burst of about 1.5 s behind it as it enlarges to the center with its portrait large. A click or any key settles it back into the fan.
  - **The end** shows one line, **New 2 · Duplicates 1 · +20 ∴ · Diamond in ≤ 61**, and **Open another** (same era, if any are left) · **Done**. Escape first reveals all, then closes.
- **Open 10 / Open all** skip the flips and end on a grid of the **newly collected cards only** (rarity-sorted, foils marked), then one line: **Duplicates 14 · +2.1 k∴ · Diamond in ≤ 61**.
- Screen readers hear each reveal ("Euler · Platinum · New"); face-down cards are buttons ("Card 2 of 3").

#### Cards
- **Portraits** are processed offline into **one ink-wash style**, so a set looks coherent whatever the source (painting, photo, bust, stamp or sketch):
  - **Framing:** the face at a fixed size and eye line, the image always filling the card, inside an oval that fades into the paper.
  - **Tone:** contrast evened out, four flat bands of ink on the paper tone, and inked edges. Line drawings (mostly bare paper) keep a clean ground with smooth solid strokes and one light shade, and small sources are smoothed before banding, so neither turns blotchy.
  - **Stored** as 480 × 600 WebP next to the card YAML, with the source, author and license kept (§13.7).
- **Face:** portrait, name and rarity. **Detail view** (click a card anywhere): the enlarged card plus dates, era, field chips, blurb, related-skill chips (links to the skill page), copies owned, foil, which slot it's in, and the portrait credit in small type (author, license and source link; required for CC BY and CC BY-SA, shown for every portrait).
- **Rarity frames in archive materials:** Silver is pewter, Gold is gilt leaf, Platinum is engraved steel, Diamond is cut crystal over vellum. The rarity is also written on the frame, so color is never the only signal.
- **Foil:** a holographic sheen that follows the pointer, or a finger dragged across the card on touch. Device motion is never used, so no permission is ever asked. Reduced motion shows a still gilt rim.
- **Sizes:** a 5:7 card, about 96 px wide in grids, 180 px in the reveal and 320 px in the detail view.
- **No "New" markers** on cards or cosmetics: the reveal was the moment.

#### Collection
- **Hub tab:** one shelf per era, in era order. The shelf header shows the era, **14 / 24**, foils, and a **Complete** stamp with the frame once finished. Inside, cards are grouped by rarity (Diamond first, down to Silver) and by birth year within each rarity. Uncollected cards are silhouettes with their name, rarity and fields.
- **Profiles** show the same shelves, read-only, with that student's cards.

#### Shop
Two sub-tabs.
- **Wardrobe:** what the student owns, by slot (keypad skin, celebration, banner, node theme, frame, title, Lemma icon, name ornament), each with **Equip** / **Equipped** and a **Default** option. Items that can't be bought show as a silhouette with their condition: **Axiom · Union · 700 k∴**, **Machine Age set**, **Achievement · Keystone** (secret criteria stay hidden, §12.1).
- **Shop:** buyable items on category shelves, each with its price, **Preview** and **Buy** (**Owned** once bought).
- **Preview** opens a sheet with a live sample, and **Buy** is available there:
  - a keypad skin as a working mini keypad;
  - a celebration played on a sample answer, with **Replay**;
  - a banner as a profile hero with the student's own name;
  - a node theme on one section of the student's real map.

#### Profile hero
- **Layout:** the banner runs across the top. The name sits in its frame, with the equipped title under it, overlapping the banner's lower edge. The three showcase cards sit on the right (below on phones). Collection and Axioms proven follow further down.
- **Your own profile:** every editable field (display name, title, frame, banner, showcase) has an **Edit** button. Each opens a picker sheet (silhouettes for locked items, as in the Wardrobe), and a change saves at once with the next batched write.

#### Result row
- **+24 XP · +48 ∴** on one line (§16.4). The answer that fires the Time Warp adds **Time Warp +12 h · +5.4 k∴** to the same row.
- **Breakdown tooltip** on the ∴ chip: base, flat bonuses (Successor Function), each multiplier, and the total.
- **Rewards off:** XP only, and the row reflows with no gap.

#### Celebration order
- **On problem screens**, toasts play one at a time in this order: rank-up, achievement, level-up. A full-screen moment (a level tier) waits until **Next** is pressed or the screen is left.
- **Only one full-screen moment shows at a time.** Several play smallest first, biggest last: level tier, then Axiom, then Conjecture.
- Axioms and Conjectures are always started by the student's own click in the hub, so they never interrupt a question.

#### The archive look (hub only)
- **Built from tokens** layered over the site's own (`--paper`, `--paper-fiber`, `--ink-archive`, `--pencil`, `--rule`, `--plate`, `--gilt`), each with light and dark values. Every stage passes WCAG AA.
  - **Paper:** a warm off-white surface with a faint fiber texture (an inline SVG noise, at low opacity). In dark mode it's a deep ink-blue "blueprint" paper.
  - **Engraved rules and plates:** double hairline borders, corner ornaments, and numbered plates as tab and section labels (**Pl. I · Theorems**).
  - **Numerals:** STIX Two Text with old-style figures in prose; lining tabular figures for prices and counts.
  - **Marginalia:** statements set as margin notes beside their entries at 1024 px and up; inline, in italics, below that.
- **Escalation**, in three stages; the student doesn't choose:
  1. **Eras.** The hub takes the style of the latest unlocked era: Antiquity, parchment and ink · Golden Age, illuminated manuscript · Renaissance, copperplate · Enlightenment, printed folio · Steam Age, lithograph and brass · Machine Age, blueprint · Space Age, back to the site's own minimalist look (§16.1): the present day.
  2. **Axioms**, once every era is unlocked. Each proven large cardinal darkens the minimalist page a step toward night, with the ink turning to starlight. Large cardinals already proven count at once.
  3. **Conjectures**, once all 18 Axioms are proven. Each proven Conjecture adds a constellation, ending in an Antimatter-like void (§12.4) at P versus NP.

#### Phones (≤ 640 px)
- Hub tabs become a **☰ menu**: a sticky bar with ☰ and the current tab's name. The menu lists the tabs and the Later peek.
- The summary is **not sticky**: it heads the page and scrolls away.
- Side panels and pickers become bottom sheets, and marginalia go inline. The proof tree scales to the width, with touch targets of at least 44 px.

#### Accessibility and motion
- **Reduced motion:** tweens swap instantly, flips crossfade, and bursts, sheens and celebration motion show still frames.
- **Keyboard:** every tab, node, slot, card and button is reachable. Escape closes the top sheet or overlay.

#### Previews
`/dev/cards` (every rarity, foil, the reveal, the Diamond reveal, duplicates), `/dev/archive` (every stage, light and dark), `/dev/celebrations` (Axiom, multi-Axiom and Conjecture moments, and the queue order) and `/dev/cosmetics` (every shop and Axiom cosmetic in its preview frame).

---

## 14. Social

### 14.1 Solution discussions
- Discussions exist **only for daily and monthly problems**, and each thread is **open and visible the whole time**, including while the problem is live.
- **Not pushed at students:** problem screens, results and notifications never link to or preview discussions. Students reach them only through the **Discussions** page, which has search by date, problem and text.
- **Spoilers rely on good faith.** There is no automated spoiler blocking.
- **Spoiler tags:** `||label: hidden text||`, or `||hidden text||` without a label. Hidden text renders as a blurred block that is revealed on click. Hovering (or long-pressing on touch) shows a **tooltip with the author's label** describing what's hidden, e.g. "full solution to (b)" or "hint: consider parity". With no label, the tooltip says "Spoiler". LaTeX inside spoilers is supported.
- **Anyone** can post and comment. Posts support Markdown and LaTeX.

- **Phase 1 implementation.** `/<course>/discussions` lists threads (most recently active first) plus today's two daily problems (Year 11 and Year 12), and filters by date (a past date shows that day's problems even with no posts yet), year group and text (problem name and every post's text). A thread page shows the problem as served that day (rebuilt from the same seed as the daily page), its solution behind **Solution**, the posts with their comments (one level), and a composer with **Preview**. Authors can delete their own posts.
- **Storage:** `discussions/{day}:{course}:{year}` holds the post count, last activity and every post's text (for search, capped at 200,000 characters); its `posts` subcollection holds each post and comment (`parent` names the post a comment is on). Posting is one transaction (the post plus the thread's count and text). The thread list and each thread's posts are read once and kept for two minutes; your own posts update the copies without a re-read.
- **Safety:** posts are students' own writing, so raw HTML shows as typed, links are limited to safe protocols, and the HTML is sanitized (DOMPurify) before KaTeX output is added. KaTeX runs with `trust: false`.

### 14.2 Moderation
- A **banned-words list** of identity-based slurs (race, ethnicity, sexuality, gender identity, disability) and purely sexual terms applies to posts, comments and display names, checked client-side and again in Firestore rules. Profanity and general insults are not banned.
- No other moderation for now, given the small group.
- **Phase 1 implementation.** The list is `content/banned-words.txt` (one per line; owner-edited). The content build copies it to `/content/banned-words.json` for the app, and `pnpm moderation` writes it into `firestore.rules` as a `clean()` function (whole words, case-insensitive, plus -s/-es/-ed/-ing); deploy the rules after changing it. Matching catches **swapped numbers and symbols** (`5lut`, `f4g`, `s1ut`, `$lut`: a→4 @, b→8, e→3, g→6 9, h→#, i→1 ! | l, l→1 | i, o→0, s→5 $, t→7 +, z→2), repeated letters (`sluuut`) and, in the app, spaced-out letters (`s.l.u.t`). The same pattern (`packages/content/src/moderation.ts`) runs in the app and in the Firestore rules. A word can't start with a swapped-in digit unless a real letter follows, so plain numbers never match (checked against every number below 100,000 and all course text). Posts and comments with a banned word are refused; a display name with one shows as "Student" on the public mirror and is refused at sign-up.

---

## 15. Competitive play (Phase 3)

Competitive play has one main mode, **Frontline** (2–6 players, territory and capture the flag), and four secondary 1v1 minigames: **Divide**, **Draft**, **Exam Board** and **Race**.

### 15.1 Principles
- **Depth over speed.** Every mode except Race has:
  - a fixed number of questions per player, not a fixed time;
  - a time limit per round or a time bank, never a reward for answering first;
  - simultaneous rounds wherever possible.

  Race is the deliberate exception: a short fluency drill at Tiers 1–2 only (§15.5).
- **Difficulty is a choice, never a dominant one.** Each mode balances tiers through risk, exposure, durability, time cost or position, so no tier is automatically best.
- **Answers count as practice.**
  - Every competitive answer updates the skill's θ, gates and response skills like normal practice.
  - Competitive questions allow **one attempt**: correct counts as a first-try solve, wrong as outcome 0.
  - The worked solution is shown when the game ends, not mid-game.
- **Every player has an Elo rating for every game mode** (§15.7): Frontline, Divide, Draft, Exam Board and Race. These ratings are separate from skill θ and never touch mastery ranks.
- **Question pool.**
  - Competitive modes draw from **the same question pool as normal practice**. There is no separate competitive bank, so every question written serves both.
  - Auto-marked questions only. Free-response is too slow to mark live.
  - The lobby sets the syllabus scope (section, unit or course) and, for Frontline, the map.
  - Questions are drawn from that scope at the tier each action needs, preferring ones no player in the game has seen.
  - Questions answered in a game count as seen for practice selection too (§5.7).
  - Competitive play needs deep pools, which is why it comes after Specialist Units 1–4 have full content.
- **Live and correspondence play.**
  - Frontline, Divide, Draft and Exam Board can be played **live** (round timers) or by **correspondence** (one round per day).
  - Race is live only.
- **Lobbies:** private games joined by invite link or code. No public matchmaking for now.

### 15.2 Frontline: maps and setup
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

**Optional handicap:** Rally payouts scaled to each player's own rating, so every tier has equal expected value (§15.1).

### 15.3 Frontline: rounds and actions
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
- **Failed attempts wear a lock down.** An attacker who has failed a lock has seen its question, so a siege gets easier over time. No answer or solution is revealed mid-game (§15.1), so the attacker still has to work it out. The defender can **re-fortify** to replace the question with a fresh one at the hex's tier, which costs their round's action.
- A lock lasts until it is broken or replaced. A broken lock is gone, and the captured hex starts unlocked.

**Combat** (all values tunable).
- Attack strength = troops × assault multiplier × (1 + streak bonus) (§15.4).
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

### 15.4 Frontline: snowballing, flags and scoring
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

Final placement updates every player's Frontline Elo (§15.7). Ties in placement are broken by banked flags, then territory.

### 15.5 1v1 minigames
Each minigame has its own Elo (§15.7), updated after every game. Except for Race, each uses a time bank per player (chess clock). Points are each question's tier unless stated otherwise.

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

### 15.6 Architecture for competitive play
- **Server-checked.** In games, answers are checked and recorded by Netlify Functions, which also resolve every round, so the game state can't be edited by a client.
  - Because competitive questions share the practice pool, their answer keys are in the public content bundle. A determined player could look one up mid-game.
  - This is accepted for a small group, like the client-side trust risk (§19). If it becomes a problem, the fix is to move all answer keys server-side.
- **Functions:**
  - **create/join game**;
  - **submit answer:** checked on the server, recording the outcome;
  - **resolve round:** run when every player has submitted, or by a scheduled function when the round timer expires.
- **Firestore:**
  - `games/{gameId}`: mode, map version, scope, players, round and state;
  - `games/{gameId}/orders/{uid_round}`: each player's orders, written by that player and validated by the resolver;
  - only functions write game state.
- **Live updates:** clients follow game documents with real-time listeners.
- **Netlify credits:** functions use a small amount of compute, well within the free plan's credits (§17.5). No extra production deploys are needed.
- **Balance tooling:** an offline script runs bot simulations of Frontline maps (§15.2).

### 15.7 Elo ratings
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
- Ratings live in `users/{uid}/ratings/{mode}` (rating, games played, peak, provisional) and are written only by Netlify Functions, never by clients (§15.6).
- Elo is shared across all courses for now. If course scope turns out to matter, ratings could be split per course later (§19).

---

## 16. UI / UX

### 16.1 Visual identity
- **Spelling:** all product copy, content (tutorials, questions, solutions, skill names) and code use standard **American** spelling (practice, color, center, factored, modeling). Mathematical notation still follows WACE conventions (§3.1).
- **Copy is minimal:** labels over sentences, no explanatory filler on screens; show a number or a status rather than describe it.
- **Non-learning information is data, not sentences.** Design rule, applied everywhere (screens, tutorials, questions, emails): metadata such as dot points, prerequisites, counts, dates, statuses and modes is shown as a bare label, list or chip, never wrapped in a sentence. Write "1.2.2, 1.2.3", not "Dot points 1.2.2 and 1.2.3."; "Local mode · saved in this browser", not "Local mode: progress is saved in this browser."; "No questions yet" with no full stop. Full sentences are reserved for learning content: explanations, worked solutions and feedback.
- **Clean and academic:** light theme, minimal, plenty of white space. In the spirit of Khan Academy or Brilliant, but the design is original.
- Rank colors are the main accent: Unranked gray, Bronze, Silver, Gold, Platinum, Diamond.
- Typography is tuned for math: KaTeX output, and math fields at matching sizes.

### 16.2 Home = the tech tree
- After login, the student lands **directly on the course tech tree**. A course switcher sits at the top.
- **Vertical tech tree** (strategy-game style). The draft preview is at https://claude.ai/artifact/VhcVGyVCy3CTTMBeRBUmth.
  - **One map per course:** Year 11 sits above Year 12, and units are stacked top to bottom.
  - **Branching layout:** each unit is a layered graph (dagre-style, with crossing minimization). Sections are compound clusters drawn as soft regions, **not** linear columns, so skills branch the way their prerequisites do.
  - **Nodes** are filled with the rank color (Unranked is hollow), with a short label under each. Keep on-map text minimal. The **shape shows skill size** (§3.2): small circle (Small), circle (Medium), small diamond (Large), large diamond (Cornerstone). The legend above the tree explains both colors and shapes.
  - **Progress ring:** each node's ring fills toward the next rank's color, **linearly in the 0–100 score** from the current rank's floor to the next rank's floor (Diamond: toward θ 2000, score 99.3), so the ring always agrees with the number in the node.
  - **Edges** are suggested prerequisites, drawn as smooth curves routed between nodes (never through a node or label). Only prerequisites **within a section** are drawn all the time, and only they shape the layout, so each section is a compact tree. Links to other sections (drawn sideways, since sections sit side by side) and to earlier units appear when a skill is hovered or selected, and hovering traces the full chain up and down. Each section is laid out on its own, choosing the arrangement with the fewest crossings. Cross-course prerequisites appear in the skill panel.
  - **Selecting a skill** opens a compact panel: name, rank, score, θ, summary, suggested first, leads to.
  - Section and unit rolled-up ranks show on the region and unit labels.
- **Table view toggle:** a sortable table of Unit / Section / Skill with rank, score, θ, gate progress (e.g. "Silver 2/3") and question counts.
- The daily problem (tier, streak, solved) and Revision, Questions and leaderboard links are tiles above the map; the monthly problem joins them when it ships.

### 16.3 Skill page
- Shows rank, score, θ, what the next rank needs, **every rank's floor and gate progress** (e.g. "Gold · θ 1400 · 2/3 at Tier 3+", earned ranks ticked), size, dot points covered, suggested prerequisites (with their ranks, for information only), leads to, and the **last five answers** in the skill from this browser's history (date, question, score), linking to History.
- **Learn** opens the skill's tutorial (§3.1): a clean reading view with glossary hovers and links to prerequisite tutorials. On a student's first visit to a skill (never practiced) it is the main button, ahead of Practice, but never required.
- **Practice** is the main action otherwise. There is no tier chooser: the starting tier comes from onboarding (§5.3). **Drop a tier** is the "Easier questions" switch.
- No quiz or Challenge links here: the section quiz, unit quiz and Section Challenge are reached from their nodes on the map.
- **Tabs: Overview and Questions.** Questions lists every question whose skills include this one (practice, quiz and Challenge pools), easiest first: tier badge, name, type, pool, rating, and "Answered" once seen. A row expands to the stem and worked solution; a practice question has **Practice this**.

### 16.3a Questions page
- `/<course>/questions` lists every question in the course, from a small `question-index.json` built with the content (id, name, skill(s), subsection, section, unit, year, rating, tier, type, response-skill tags, pool, whether it needs a later unit's content). The full question loads only when a row is expanded.
- **Filter** by search text, tier, type (auto-marked or written), tag, year, unit, section, skill, subsection, pool, later units needed, and answered. **Sort** easiest or hardest first, by name, or by tag. **Group** by tier, tag, skill, subsection (in curriculum order), section or answered; a question with several tags or skills appears in each of their groups.
- The subsection filter lists the chosen skill's subsections, or every skill's grouped by skill; choosing another skill clears it. Each row shows its subsection. A skill's Questions tab has the same subsection filter.
- Filters live in the URL, so a view can be bookmarked or shared. "Answered" comes from local progress: no extra reads.
- **Every question has a `title`** (the build requires one): a short name in title case that says what the question is about ("Grid Paths That Stay Below the Diagonal", "Tangent Meets Radius at a Right Angle"), describing the situation rather than the method, and never naming a number or word that changes between variants or word picks. Titles are unique in a course: a quiz-pool question that would share a practice question's name adds **(Quiz)**, e.g. "Angle in a Semicircle (Quiz)".

### 16.4 Problem screen
- **Header:** tier, rating, calculator flag, skill(s).
- **Body:** stem, diagram, and answer inputs per part.
- Attempts remaining, **Check**, **Give up** (written answers: **Submit for marking**).
- **After resolving:** a result row (outcome, θ and its change, score, rank, **+XP** and, with the economy, **+∴** and any Time Warp on the same line (§13.11), the daily bonus included on the daily problem) on every question screen (practice, quizzes, Challenges, daily, revision, shared problems); worked solution; rank and achievement toasts; Next. A written answer shows the same row under its mark once the mark is applied (it can arrive later; it's kept on the marking job, so it also shows on the marked-answer page). **Tutorial**, **Share** and **Report error** sit above the question; on the practice screen **← Back** returns to the map.
- **Tutorial (implemented)** opens the question's skill tutorial in a side panel (a bottom sheet on phones) that doesn't block the question, so the student can read and answer at once; × or Escape closes it.
- Free-response pending state: "Marking…", with a BYO-key nudge.

### 16.4a Wording: points, not marks
The app says **points** (and **score**) wherever a student sees how an answer was scored: "Written · 5 points", "Score 80%", "Appeal this score". Our rubrics and milestones are not the WACE marking scheme, so the app never calls them marks. The LLM marker writes "points" in its feedback too. ("Marking" for the process, and a student's school "maths mark" in onboarding, keep their usual meaning.)

### 16.4b Answer history and Back
- Every answer a student gives (practice, quizzes, Challenges, daily, revision) is logged **in the browser only** (localStorage, newest 500 per course): question id, variant and word picks, the answer per part, the attempt each part was solved on, the outcome, and for written answers the marking job. Nothing is read from or written to Firestore for it, so it doesn't follow a student to another device.
- **Previous**, under the question on the practice screen, steps through earlier answers in that skill (showing when each was answered; **Next** and **Current question** return); the current question stays as it was, half-typed answers included. (**← Back** at the top returns to the map.)
- **History** (`/<course>/history`) lists every logged answer by day, filterable by skill, subsection, mode and result (60% or more, under 60%, still marking). A row expands to the question as it was served, the answers given (marked right or wrong per part, or with the written score and feedback) and the worked solution. **Clear history** empties it.

### 16.4c Share a problem
- **Share** on every question screen (practice, revision, daily, quizzes, Challenges, a shared problem) and on each question in the Questions lists sends a link to **that exact problem**: `/<course>/problem/<question id>?v=<variant>&w=<slot>.<index>,…`. The link carries the numeric variant and word picks, so the person opening it sees the same numbers and names. Nothing is stored; no reads or writes.
- On phones the system share sheet opens; elsewhere the link is copied ("Link copied").
- Opening the link shows the problem with its skill, to answer like practice (θ, XP, achievements; written answers are marked as usual; history mode "Shared"). If the question has changed since the link was made (a variant or word list no longer fits), it is served with fresh numbers and names and says so.

### 16.4d The current question stays until answered
- Practice remembers the question it is showing in each skill (id, variant and word picks; in the browser only). Leaving the page and pressing **Practice** again, or reloading, shows the same question with the same numbers and names. Once it is answered (resolved, given up or submitted for marking), it is forgotten and the next visit serves a new one.
- If the question has changed or been removed since, a new question is served.

### 16.5 Other screens
- **Profile, Leaderboards, Discussions** (daily/monthly; searchable, never linked from problem screens).
- **Settings:** display name; Shift keys (§7.2); handwriting pad on/off (§7.2); BYO key per provider (stored locally) with **Test key**, which lists the provider's models (nothing marked or charged) and says "Key works", "refused this key" or "Couldn't reach"; marking effort; **Show rewards** (with the economy, §13).
  - **Display name** (Phase 1): 2–30 characters, no banned words (§14.2). Saving updates the account, the profile and the public mirror at once; leaderboards show it within five minutes (their cache). Email sign-ups choose it on the sign-up form. **Google sign-ups** get Google's name by default, so onboarding asks them to choose one (prefilled with Google's name) as its own first step, before the maths mark; existing Google accounts are asked once.
- **Students' own writing** (written answers, previews, history, discussion posts) keeps the line breaks they typed; authored content (questions, tutorials, solutions) uses normal Markdown paragraphs.
- **Onboarding:** the display name (Google sign-ups), then the most recent maths mark and where it's from (which sets the year group and the starting tier, §5.3), then a **four-step tour**: the map (colors and shapes), tiers (bands), ranks (floors and gates) and the 0–100 score; **Skip** goes straight to the map. Specialist is the only course for now, so there's no course choice yet. All skills start Unranked.

### 16.5a Paper first
- Questions at **Tier 3 and above**, and **every written question**, show a **"Paper first"** label: they are meant to be worked out on paper, then answered on the site.
- The first time a student meets one, a one-time tip says so (and, for written questions, that the answer can be photographed). "Got it" dismisses it for good in that browser.

### 16.6 Platform and accessibility
- Responsive web app, desktop-first but usable on phones and tablets. Stylus input is supported on tablets.
- Keyboard-navigable; color is never the only rank signal (labels and icons too).
- **Accessible maths (implemented):** screen readers hear every answer field through MathLive's live region; **Ctrl+Alt+S** reads a field's maths aloud with the browser's own voice; KaTeX output includes MathML.

---

## 17. Architecture

### 17.1 Stack
| Layer | Choice |
|---|---|
| Frontend | **SvelteKit** (TypeScript), static adapter |
| Native (later) | **Capacitor** wrapping the same build |
| Math | MathLive (input), CortexJS Compute Engine (parse/eval), KaTeX (render) |
| Handwriting | MyScript iink (Cloud REST, free tier), via `/api/ink`; a vision model when its quota runs out |
| Auth | Firebase Auth (Google + email; anonymous to try it: 5 questions, then sign up or log in with progress kept (§2.1a); no limit on deploy previews; kept off public leaderboards) |
| Database | Cloud Firestore (Spark free plan) |
| Hosting | **Netlify** (static site + CDN for content bundles) |
| Server functions | **Netlify Functions**: `/api/mark`, `/api/transcribe`, `/api/ink` (hold the marking, photo and handwriting keys as env vars); Phase 3 adds game creation, server-side answer checking and round resolution (§15.6) |
| Offline tooling | Node/TS scripts + Python (SymPy) for verification |

### 17.2 Client-side logic
- **Saved progress is never overwritten by a failed or stale load (implemented).** Progress that is later saved back (profile, course progress, achievements, Challenge progress, marking jobs) is read **from the server only**, never Firestore's local cache: at sign-in the app writes the "last seen" fields, which leaves a partial copy of the profile in the cache, and a cached read on a slow connection once returned that partial copy as the whole profile, resetting a student. Loading retries twice (after 0.6 s and 1.8 s; a read straight after switching from an anonymous session to a real account can go out with the old sign-in and be refused). If it still fails, that session saves nothing (no XP, daily record, public mirror, counters, skill states or achievements), skips onboarding, and a banner says so with the error code and a Reload button. XP is saved by increment; the daily record, the activity counters and the public mirror are saved whole, so before saving them the app reads the latest saved profile and keeps the newer daily record, the higher XP and, per period, the newer or larger counters: an out-of-date tab or device never lowers them. **Sign-in writes nothing until the profile has loaded:** the "last seen" name and email are saved only after the load, because written at sign-in, at the same moment, they let Firestore answer the load with just those few fields (it reran onboarding and granted a second visit bonus). The app also waits for Firebase to restore the session before deciding whether anyone is signed in, and a profile that looks new (no maths mark, never visited) is read once more, 1.5 s later, before it is believed. Two more guards: **Firestore rules refuse any write that lowers XP** on `users/{uid}` or `publicProfiles/{uid}` (the whole batch fails, so the counters saved with it are kept too), and the app **checks for a new deploy every minute** and loads it at the next page change, so a tab never keeps running an old version.
Answer checking, θ updates, rank, gate and roll-up computation, question selection and achievement evaluation all run **on the client**. Results are then synced to Firestore. Firestore security rules ensure a user can only write their own documents.

### 17.3 Firestore data model (sketch)
```
users/{uid}                                              profile, settings, course enrollments, total XP (§12.4)
users/{uid}/ratings/{mode}                               Elo per game mode, written by functions only (§15.7)
users/{uid}/courses/{course}                             rolled-up ranks (for the hidden buffer)
users/{uid}/courses/{course}/skillStates/{skillId}       θ, rank, gateCounts[1..6], seen ids, counts
users/{uid}/courses/{course}/responseSkillStates/{rsId}  θ, rank, gateCounts
users/{uid}/courses/{course}/attempts/{attemptId}        question id/version/variant, answers, outcome, Δθ, ts
users/{uid}/courses/{course}/challenges/{sectionId}      Section Challenge progress
users/{uid}/courses/{course}/meta/achievements           achievement counters and earned dates (§12.1)
users/{uid}/meta/economy                                 Lemmas earned/spent, theorems, institutes, Conjectures, packs, cards, cosmetics, titles (§13.10)
users/{uid}/markingJobs/{jobId}          pending/complete, provider, result, effect, appeal, paste signals
publicProfiles/{uid}                     display name, ranks, achievement points, leaderboard aggregates
monthly/{yyyy-mm}/problems/{course-year} (with monthly problems) problem id; submissions/{uid} (best milestones, writing history, follow-up answers, signals, moderation status)
discussions/{day}:{course}:{year}        post count, last activity, posts' text (search)
discussions/{key}/posts/{postId}         uid, name, body, at, parent (null, or the post a comment is on)
reports/{reportId}                       uid, name, course, kind, target, variant, words, tier, note, at, status
```

Leaderboards read `publicProfiles` once per tab every five minutes and sort in the browser, which is fine at small-group scale. The daily problem needs no documents: it's picked from the date (§8.5), and the solved days live in the profile's daily record.

### 17.4 Repository layout
```
apps/web/              SvelteKit app
packages/engine/       rating, selection, ranks, roll-up, level, economy, school calendar (pure TS, unit-tested)
packages/checker/      answer checkers, intervals, form rules
packages/content/      content schema and build, diagrams (spec → SVG), marking prompts, verify runner
content/curriculum/    <course>/course.yaml + <version>.yaml
content/syllabus/      source PDFs (gitignored)
content/questions/     <course>/<unit>/<section>/<skill>.yaml
content/tutorials/     <course>/<skillId>.md (one per skill) + glossary built from them
content/schedules/     course outlines by school week (§8.5)
content/calendar/      <year>.yaml: term dates, semesters, exam periods (§8.6)
content/cards/          <era>.yaml: collectible cards by era (§13.7)
content/economy.yaml, achievements.yaml, response-skills.yaml, words.yaml, banned-words.txt
scripts/               SymPy verification (verify_questions.py, verify_geometry.py); Lemma economy simulation (economy_sim.py, §13.3); table of contents (spec_toc.py)
netlify/functions/     mark, transcribe, ink
```

### 17.5 Free-tier budget notes
- Firestore Spark: 50k reads / 20k writes per day. That's comfortable for a small group, because content is served from the CDN, not Firestore.
- Netlify free plan: 300 credits a month. Each production deploy costs 15, so merging to `main` is the release step and doc-only changes skip the build (`netlify.toml`). Functions (marking, Phase 3 game rounds) use a small amount of compute credit.
- Groq free tier (marking) and Gemini free tier (photos and the handwriting fallback): rate-limited, so the client retry queue absorbs bursts.
- MyScript: a shared monthly quota (2,000 requests); past it, the AI reader takes over until next month (§7.2).

---

## 18. Phasing

| Phase | Deliverable |
|---|---|
| 0: Framework | Repo scaffold, engine + checker packages with tests, content schema + build, auth, tech tree + table view, problem screen, Firestore sync |
| 1: Specialist Unit 1 (full depth) | Curriculum for all of Specialist; Unit 1 tutorials (one per skill) and questions at full depth (per skill size, §3.2); glossary; LLM marking; quizzes; Section Challenges; daily problem; achievements; global level and XP; leaderboards; discussions; word variety in word problems (§9.6); no repeats near the student's level (§5.7); Questions tab and page (§16.3–16.3a); local answer history and Back (§16.4b); Exam and Custom Revision (§8.5a); leaderboards and profiles (§12.2–12.3); daily-problem discussions with spoilers and a banned-words list (§14); share a problem by link (§16.4c). **Owner tests before continuing.** |
| 2: Specialist Units 2–4 | Error reports (§11.4), school calendar files, all answer formats, handwriting, paste detector (done); tutorials and questions for the remaining units; first monthly Tier 6 problems (Year 11 and Year 12) |
| 3: Competitive play | Frontline (three maps, spawn draft, server-resolved rounds), the 1v1 minigames Divide, Draft, Exam Board and Race, Elo ratings for every mode, server-side answer checking for competitive questions (§15) |
| 4: Methods | New curriculum + content; cross-course prerequisites become live links |
| 5: Chemistry, Physics | Science-specific answer types (see §19) + content |
| 6: Native apps | Capacitor iOS/Android builds |

---

## 19. Open questions, risks and decisions

**Resolved**
- *Drop a tier:* non-destructive selection shift (§5.3, §5.7). Rank loss only happens through the hidden per-rank buffer (§5.4).
- *Gate threshold:* outcome > 0.6 (§5.4).
- *Pasting:* blocked from outside the site in every answer, not just monthly ones (§7.2).
- *Score anchor:* reference rating 1500 (§5.2).
- *Monthly free-tier cap:* generous (20 per day to start), tuned as usage shows (§8.6).
- *LLM strictness:* the marker and appeal prompts are strict (§10.1, §10.3).

**Accepted risks (handle as they come)**
1. **Free-tier fragility:** Gemini and MyScript free tiers can change or vanish. Mitigations are the BYO key and keyboard fallback.
2. **Same-model appeals:** these can still be swayed by a persuasive wrong argument despite the strict prompt. Monitor appeal outcomes.
3. **Syllabus changes:** the Methods review may resurface. Each change is handled by hand when it arrives (§3).
4. **Client-side trust:** practice ratings and leaderboards can be spoofed by a determined user. This is accepted for a small group; revisit if the platform opens up. Competitive games are checked and resolved on the server, but their questions share the public practice pool, so answer keys can still be looked up (§15.6).

**To tune in Phase 3 playtesting**
- Frontline: round length, troop yields, multipliers, combat losses, streak cap, leader bounty and edge-collapse timing (§15.3, §15.4).
- Frontline map balance: spawn values, checked by bot simulation, then live win rates (§15.2).
- Minigame lengths, Race lockout and bonus values (§15.5).
- Elo K-factors and provisional period (§15.7); whether Elo should be split per course.

**To tune in Phase 1**
- XP values and the ~600 XP/hour assumption, checked against real usage so that level 500 stays at roughly 500 hours (§12.4).

**To tune when the economy ships**
- Lemma rates, institute and Conjecture costs and outputs, and the Time Warp (against the calibration targets in §13.3, including Rank-into-Rank after 1.5 years of 1.5 hours a day), theorem costs and effects, corollary sizes, Axiom thresholds, pack sources, odds, pity (80 packs) and shop prices, per-era pack prices, and the staff-slot schedule (copies per extra slot and the cap, §13.3) (§13), so that an era set takes weeks, not days, and the whole collection stays a long-term goal.

**Owner to specify later**
- **Science answer types** (before Phase 5): unit-aware numeric answers, significant-figure rules, chemical formula and equation input, balanced-equation checking.
