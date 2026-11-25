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
- the **parametrised, CAS-checked questions** of Mathspace.

Questions run from pure retrieval (Tier 1) to problems significantly harder than any WACE exam (Tiers 5–6). Low tiers emphasise **retrieval and application**. High tiers emphasise **creativity, critical thinking and problem solving**.

### 1.1 Goals
- A student can open a course, see every skill as a node in a tech tree, and practise any of them adaptively.
- Ratings are honest. A rank means the student has demonstrated work at that difficulty.
- High-end content is hard and creative, not just longer computations.
- Running cost is $0 (free tiers plus optional bring-your-own LLM key).

### 1.2 Non-goals (for now)
- Teacher/class management, parent views, separate content-author roles.
- Calculator-free vs calculator-assumed exam modelling. A question is flagged `requiresCalculator` only when it genuinely needs one.
- Spaced repetition, rating decay, retention mechanics. Once earned, a rating only changes through further practice.
- Hints. The design follows Alcumus: no hints, and the full worked solution is shown after the question is resolved.
- Recommendations ("what to do next"). The student always chooses.
- Native mobile apps. These come only after all five courses are done (see §16).
- Empirical difficulty calibration from attempt data. Question ratings are author-set for now.
- Privacy hardening of LLM calls. Not a concern for the current small, known group; revisit before any wider release.

### 1.3 Course roadmap
1. **Mathematics Specialist**: pilot. Build the framework here.
2. Mathematics Methods, Mathematics Applications.
3. Chemistry, Physics.

---

## 2. Users

| Role | Description |
|---|---|
| Student (only user role) | Signs in, picks a course, practises, competes on leaderboards, posts in discussions. |
| Owner (you) | Not an in-app role. Authors content offline via scripts and git; holds the server-side API keys. |

Sign-in uses **Google** or **email** (Firebase Auth: Google provider + email link/password).

---

## 3. Curriculum structure

```
Course (e.g. Mathematics Specialist)
 └── Unit (1–4; Units 1–2 = Year 11, Units 3–4 = Year 12)
      └── Section (3 per unit, from the WACE syllabus)
           └── Skill (cluster of related syllabus dot points, ~4–8 per section)
```

- **Skills are clustered dot points.** Each skill lists the syllabus content descriptors it covers, e.g. `["1.1.3", "1.1.4"]`.
- **Prerequisites form a DAG.** Each skill has a home in the hierarchy but may list prerequisite skills anywhere, **including in other courses**. For example, Specialist integration techniques depend on Methods calculus skills, even before Methods is launched. Prerequisites are informational: they are drawn as edges in the tree and **never lock** a skill.
- Provisional Specialist sections (confirm against the supplied syllabus documents, which are the source of truth):
  - **Unit 1:** Combinatorics · Vectors in the plane · Geometry
  - **Unit 2:** Trigonometry · Matrices · Real and complex numbers
  - **Unit 3:** Complex numbers · Functions and sketching graphs · Vectors in three dimensions
  - **Unit 4:** Integration and applications of integration · Rates of change and differential equations · Statistical inference

The tree is drafted by an LLM script from the syllabus PDFs and then edited by hand (§11.1). The edited `curriculum/*.yaml` files are the source of truth.

---

## 4. Difficulty: tiers and question ratings

Every question has an **author-set rating `d`**: 1000 is incredibly easy, 2000 is second-year university level. The tier is derived from the rating using **exam-anchored bands**:

| Tier | Rating band | Character |
|---|---|---|
| Tier 1 | 1000–1249 | Recall: definitions, notation, one-step procedures |
| Tier 2 | 1250–1449 | Apply: routine multi-step application |
| Tier 3 | 1450–1599 | Typical WACE exam question |
| Tier 4 | 1600–1699 | Hardest WACE exam questions |
| Tier 5 | 1700–1999 | Beyond exam: creative, unfamiliar, synthesis; up to 2nd-year uni |
| Tier 6 | 2000+ | Reserved for the **monthly problem** (§8.6); exceptionally difficult |

- Tiers are displayed as plain numbers ("Tier 1" … "Tier 6").
- An LLM estimates the rating at generation time, and the owner adjusts it during review.
- Content mix per skill: **15–30 questions**, scaled to skill size. Tiers 1–2 need only a couple of items each, since they are mostly parametrised templates where only the numbers change. The bulk of authored items sit in **Tiers 3–5**. A parametrised template counts as one item.

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
- **Score (0–100)**, the Alcumus-style headline number: `round(100 · P(correct on a reference question of rating 1600))`. It is anchored to a fixed reference (the bottom of Tier 4, "hardest exam questions"), so it stays stable as content is added. The reference rating is configurable.
- **Raw θ** is shown next to the score.
- **Question rating `d`** and tier are shown on every question.
- **Δθ** is shown after every answer, e.g. "+14 → 1523".

### 5.3 Placement
- On first opening a skill, the student can **choose a starting tier**. The default is **Tier 3**. θ is set to the **floor of that tier's band** (e.g. Tier 4 → 1600) and then updates at normal speed.
- At any time the student can **drop a tier**: θ is reset to the floor of the next band down. Rank is then recomputed under the buffer rule (§5.4).
- Placement sets θ only. **Gate counts start at zero**, so placement alone never grants a rank.

### 5.4 Ranks
Ranks per skill: **Unranked → Bronze → Silver → Gold → Platinum → Diamond**. **Diamond = "Mastered".**

| Rank | Requires θ ≥ | AND gate |
|---|---|---|
| Bronze | 1000 | ≥ 3 correct at Tier 1 or higher |
| Silver | 1250 | ≥ 3 correct at Tier 2 or higher |
| Gold | 1450 | ≥ 3 correct at Tier 3 or higher |
| Platinum | 1600 | ≥ 3 correct at Tier 4 or higher |
| Diamond | 1700 | ≥ 3 correct at Tier 5 or higher |

- **Correct** means any resolved question with outcome > 0: a credited later attempt counts, and so does free-response at or above the 60% threshold. Harder solves satisfy lower gates.
- **Every problem contributes**: single-skill practice, quizzes, section challenges, daily and monthly problems, and cross-skill problems all update θ and gate counts. For cross-skill problems this applies to every tagged skill.
- **Buffer zone (hysteresis):** a student earns rank k when both conditions first hold. They lose it only when θ drops below `floor_k − 50` (tunable). Gate counts never decrease.

### 5.5 Roll-up: section, unit, course
- **Section θ** = weighted average of its skills' θ (weight = number of dot points in the skill).
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
- Hidden questions (reported, §11.5) are excluded.

---

## 6. Answering a question

### 6.1 Flow
1. The question renders: KaTeX for text and maths, plus any diagram (§9.4). Tier, rating and the `requiresCalculator` flag are shown.
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
- **Math keyboard:** MathLive `<math-field>` with a touch-optimised virtual keyboard. Specialist-specific key layouts: vectors, matrices, complex numbers, ∫, Σ, nCr/nPr, cis.
- **Stylus → recognised maths:** MyScript iink (free tier), producing LaTeX in the same math field. The student confirms the rendered result before submitting.
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
- When the day closes, a **solution discussion** opens (§13.1).
- A **daily streak** (consecutive days solved) feeds a leaderboard.

### 8.6 Monthly problem (Tier 6)
- One **exceptionally difficult** problem per month, rated 2000+, open for the whole month.
- **Milestone scoring:** the problem defines 3–5 named checkpoints (e.g. "reduce to a recurrence", "prove the bound", "full solution"), each worth points.
- **Unlimited submissions with no penalty.** Each submission is LLM-marked against the milestones, and the student's score is the best milestone set achieved.
  - To protect free-tier quota, free-tier marking is limited to a small number of submissions per user per day. BYO-key users are unlimited.
- At month end:
  - θ updates for the tagged skills (outcome = milestone points fraction);
  - the official solution and discussion are revealed;
  - the monthly leaderboard is finalised.

---

## 9. Answer checking (client-side)

Checking runs entirely in the browser. Answer keys ship in the content bundle. This is a self-study tool, so a determined cheater only cheats themselves.

### 9.1 Design: numeric sampling + form rules + typed comparators
We use precomputed checker specs rather than a full CAS at runtime.

- **Parsing:** CortexJS Compute Engine turns MathLive LaTeX into MathJSON. It is used **only for parsing and evaluation**.
- **Equivalence:** evaluate the student's expression and the key at K random points (default 8) in a declared domain, avoiding singularities, and compare within tolerance. This handles trig identities, complex expressions and algebraic rearrangements without symbolic simplification.
- **Form rules** run on the MathJSON tree. Examples:
  - `exact` (no decimals);
  - `factorised`, `expanded`;
  - `polar` / `cartesian` / `exponential` for complex numbers;
  - `simplified-fraction`, `rationalised-denominator`, `single-integral`;
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

### 9.3 Parametrised questions
- **Runtime templates:** parameter ranges plus constraints. The client instantiates random values and computes the key and checker in JS. Used for simple arithmetic-type items, mostly Tiers 1–2.
- **Pre-generated variants:** the offline script produces concrete variants (e.g. 20 per template), each SymPy-verified, and ships them. Used wherever parameter choice can break "nice" answers.
- **Mandatory rule for trigonometric simultaneous-equation problems** (collisions, interception, flight direction with wind, relative velocity): always pre-generate, and verify that
  - (a) answers are **small whole numbers**, or the intended exact values;
  - (b) the problem is **solvable on a low-power scientific calculator**, with no CAS solve needed.
- `requiresCalculator: true` is set only when a calculator is genuinely needed (combinations with large numbers, vector/trig calculations with non-exact values).

### 9.4 Diagrams
- **Declarative spec → SVG**, rendered by a small in-house renderer (or a JSXGraph/Mafs-style library):
  - points, segments, vectors, angles, circles, polygons;
  - function curves, asymptotes, Argand diagrams, slope fields;
  - 3D vectors as projected views.
- Diagram specs reference question parameters, so diagrams update with parametrised variants. They are LLM-authorable and validated at build time.

---

## 10. LLM marking (free-response, appeals, monthly problem)

### 10.1 Marking request
- Input: question, model solution, **rubric** (criteria with points), **rubric dimensions** (mapped to response skills), and the student's answer (text + LaTeX).
- Output (strict JSON): per-criterion points, total score `s`, per-dimension scores, short feedback per criterion, and overall feedback.
- The rubric breakdown and feedback are shown to the student.

### 10.2 Providers and transport
- **Default: free tier.** A **Netlify Function `/api/mark`** holds the owner's **Gemini free-tier API key** and calls the model **synchronously**. Over quota, it returns **429**.
- **Async UX with a client retry queue:**
  - The submission is saved as a pending job in Firestore (`users/{uid}/markingJobs`).
  - The UI shows "Marking…" and the student **keeps practising**.
  - The open app retries with exponential backoff. If the app is closed, it resumes on the next visit.
  - When a result lands, a toast appears and θ, gates and achievements update at that moment, using θ at application time.
- **Nudge to BYO key:** the pending state explains that the free queue may be slow, and offers a one-tap "Add your own key for instant marking".

### 10.3 Appeals
- One appeal per marked submission. The student writes an argument.
- The **same model** re-marks with the original submission, rubric, first verdict and the student's argument.
- The re-mark is **final and can go up or down**. There is no manual review.

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
`scripts/ingest-syllabus` reads the supplied course PDFs and drafts `curriculum/<course>.yaml`:
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
| `params`, `variants` | For parametrised questions |
| `solution` | Full worked solution |
| `rubric` | Free-response only |
| `milestones` | Tier 6 only |
| `verify` | SymPy script that recomputes every answer key |

Generation prompt emphasis by tier:
- **T1–T2:** retrieval, notation, routine application.
- **T3–T4:** WACE exam style and its hardest items.
- **T5–T6:** creative, unfamiliar framing; multiple approaches; proof; synthesis across skills; no template feel.

### 11.3 Verification (all must pass before merge)
1. **CAS verification:** run each question's SymPy `verify` code. It must reproduce every answer key, and every pre-generated variant. Any mismatch fails the build.
2. **Multi-model cross-check:** **Gemini** (owner's key) solves the question independently. Disagreement with the key flags the question.
3. **Constraint checks:** schema validation, form-rule sanity, diagram spec validity, and the trig simultaneous-equation constraints (§9.3).
4. **Owner review** in git/PR, with flagged items highlighted.

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
Khan-style achievements that **feel like rewards** and must be **deliberately earned**. They range from hard to incredibly hard. Each has points, weighted by difficulty, and the points feed a leaderboard.

| Category | Seed examples |
|---|---|
| Depth | 100 / 500 / 2,000 questions resolved correctly at Tier 3 or above |
| Mastery | Diamond in every skill of a section; of a unit; of the whole course |
| Precision | 25 consecutive first-try correct answers at Tier 4 or above; perfect Unit Quiz; full-marks proof with no appeal |
| Frontier | First Tier 5 solve; 10 Tier 5 solves in one section; any monthly Tier 6 milestone; full Tier 6 solve |
| Breadth / consistency | Daily problem solved every day of a calendar month; every response skill at Gold or above; Diamond in Proof |
| Secret (esoteric, hidden until earned) | e.g. solve a Tier 5 with exactly one attempt left; solve the Sunday daily problem within 60 s of release; win an appeal that moved a score from below to above 60%; resolve a question whose ID is prime; reach θ exactly 1729 in any skill |

Achievement definitions are declarative (`achievements.yaml`) and evaluated client-side after each resolved question.

### 12.2 Leaderboards
Group-wide boards:
- achievement points;
- course θ / rank;
- daily streak;
- monthly Tier 6 score;
- problems done: total, this week, today.

### 12.3 Profile page
A public profile shows:
- display name;
- course ranks, plus the tech tree as a read-only view;
- response-skill ranks;
- achievements, earned and secret;
- leaderboard positions.

---

## 13. Social

### 13.1 Solution discussions
- These exist **only for daily and monthly problems**, and open after the problem closes.
- **Anyone** can post and comment. Posts support Markdown and LaTeX.

### 13.2 Moderation
- A **banned-words list** (slurs etc.) applies to posts, comments and display names, checked client-side and again in Firestore rules or a function.
- No other moderation for now, given the small group.

---

## 14. UI / UX

### 14.1 Visual identity
- **Clean and academic:** light theme, minimal, plenty of white space. In the spirit of Khan Academy or Brilliant, but the design is original.
- Rank colours are the main accent: Unranked grey, Bronze, Silver, Gold, Platinum, Diamond.
- Typography is tuned for maths: KaTeX output, and math fields at matching sizes.

### 14.2 Home = the tech tree
- After login, the student lands **directly on the course tech tree**. A course switcher sits at the top.
- **Vertical tech tree** (strategy-game style):
  - laid out top to bottom by prerequisite depth;
  - nodes are skills, coloured and labelled by rank with a mini score (0–100);
  - edges are prerequisites, with cross-course prerequisites shown as stub nodes;
  - grouping bands show Unit and Section;
  - section and unit nodes show rolled-up ranks.
- **Table view toggle:** a sortable table of Unit / Section / Skill with rank, score, θ, gate progress (e.g. "Platinum gate 2/3") and question counts.
- The daily problem and monthly problem appear as persistent cards or a side panel on the tree screen.

### 14.3 Skill page
- Shows rank, score, θ, gate progress per rank, dot points covered, prerequisites, and recent attempts.
- **Start practising** is the main action. On first visit it offers a tier chooser (default Tier 3). **Drop a tier** is also available here.
- Entry points to the section quiz, unit quiz and Section Challenge.

### 14.4 Problem screen
- **Header:** tier, rating, calculator flag, skill(s).
- **Body:** stem, diagram, and answer inputs per part.
- Attempts remaining, **Submit**, **Give up**.
- **After resolving:** worked solution; Δθ and score change; rank and achievement toasts; Report issue; Next.
- Free-response pending state: "Marking…", with a BYO-key nudge.

### 14.5 Other screens
- **Profile, Leaderboards, Discussions** (daily/monthly).
- **Settings:** display name; BYO key per provider (stored locally; test-key button); stylus on/off.
- **Onboarding:** pick course + year, then a short tour of the tree, tiers, ranks and gates, and the 0–100 score. All skills start Unranked.

### 14.6 Platform and accessibility
- Responsive web app, desktop-first but usable on phones and tablets. Stylus input is supported on tablets.
- Keyboard-navigable; MathLive's accessible math (speech output) enabled; colour is never the only rank signal (labels and icons too).

---

## 15. Architecture

### 15.1 Stack
| Layer | Choice |
|---|---|
| Frontend | **SvelteKit** (TypeScript), static adapter |
| Native (later) | **Capacitor** wrapping the same build |
| Maths | MathLive (input), CortexJS Compute Engine (parse/eval), KaTeX (render) |
| Handwriting | MyScript iink (free tier) |
| Auth | Firebase Auth (Google + email) |
| Database | Cloud Firestore (Spark free plan) |
| Hosting | **Netlify** (static site + CDN for content bundles) |
| Server functions | **Netlify Functions**: `/api/mark`, `/api/report` (hold the Gemini key and GitHub token as env vars) |
| Offline tooling | Node/TS scripts + Python (SymPy) for verification |

### 15.2 Client-side logic
Answer checking, θ updates, rank, gate and roll-up computation, question selection and achievement evaluation all run **on the client**. Results are then synced to Firestore. Firestore security rules ensure a user can only write their own documents.

### 15.3 Firestore data model (sketch)
```
users/{uid}                              profile, settings, course enrolments
users/{uid}/skillStates/{skillId}        θ, rank, gateCounts[1..6], seen ids, counts
users/{uid}/responseSkillStates/{rsId}   θ, rank, gateCounts
users/{uid}/attempts/{attemptId}         question id/version/params, answers, outcome, Δθ, ts
users/{uid}/markingJobs/{jobId}          pending/complete, provider, result, appeal
users/{uid}/achievements/{achId}         earnedAt
users/{uid}/challengeProgress/{sectId}   Section Challenge progress
publicProfiles/{uid}                     display name, ranks, achievement points, leaderboard aggregates
daily/{yyyy-mm-dd}                       problem id; submissions/{uid}
monthly/{yyyy-mm}                        problem id; submissions/{uid} (best milestones)
discussions/{problemKey}/posts/{postId}  body, author, ts; comments/{commentId}
hiddenQuestions/{questionId}             reason, ts
reports/{reportId}                       question id, note, verdict
```

Leaderboards query `publicProfiles` directly, which is fine at small-group scale.

### 15.4 Repository layout (proposed)
```
apps/web/              SvelteKit app
packages/engine/       rating, selection, ranks, roll-up, achievements (pure TS, unit-tested)
packages/checker/      answer checkers + form rules
packages/diagrams/     diagram spec → SVG
content/curriculum/    <course>.yaml
content/questions/     <course>/<unit>/<section>/<skill>/*.yaml
content/achievements.yaml
scripts/               ingest-syllabus, generate, verify (SymPy), build-content
netlify/functions/     mark, report
```

### 15.5 Free-tier budget notes
- Firestore Spark: 50k reads / 20k writes per day. That's comfortable for a small group, because content is served from the CDN, not Firestore.
- Netlify Functions free tier is ample for marking and reports.
- Gemini free tier: rate-limited, so the client retry queue absorbs bursts.
- MyScript: shared monthly quota, with a keyboard fallback when it runs out.

---

## 16. Phasing

| Phase | Deliverable |
|---|---|
| 0: Framework | Repo scaffold, engine + checker packages with tests, content schema + build, auth, tech tree + table view, problem screen, Firestore sync |
| 1: Specialist Unit 1 (full depth) | Curriculum for all of Specialist; Unit 1 questions at full depth (15–30 per skill); LLM marking; quizzes; Section Challenges; daily problem; achievements; leaderboards; discussions. **Owner tests before continuing.** |
| 2: Specialist Units 2–4 | Content for the remaining units; first monthly Tier 6 problems |
| 3: Methods, Applications | New curricula + content; cross-course prerequisites become live links |
| 4: Chemistry, Physics | Science-specific answer types (see §17) + content |
| 5: Native apps | Capacitor iOS/Android builds |

---

## 17. Open questions and risks

1. **"Drop a tier" semantics:** this spec resets θ to the floor of the lower band, and rank recomputes under the buffer rule. The alternative is a non-destructive selection shift. Confirm.
2. **Gate "correct" threshold:** currently any credited outcome counts, including a 0.3 second try. Should gates require a first-try correct answer or outcome ≥ 0.5?
3. **Score anchor:** with the reference at 1600, a fresh Gold student (θ 1450) shows a score of about 18. Consider anchoring at 1450 (Tier 3) so "exam-ready" reads as about 50.
4. **Monthly free-tier submission cap:** this spec proposes a daily cap for free-tier users. The exact number is TBD.
5. **Free-tier fragility:** Gemini and MyScript free tiers can change or vanish. Mitigations are the BYO key and keyboard fallback.
6. **LLM marking reliability:** same-model appeals can be swayed by persuasive but wrong arguments. Monitor appeal outcomes. If abuse appears, switch to a second-model re-mark.
7. **Science courses:** they will need unit-aware numeric answers, significant-figure rules, chemical formula and equation input, and possibly balanced-equation checkers. Spec these before Phase 4.
8. **Syllabus updates:** WACE syllabi are revised periodically. Curriculum YAML should record the syllabus version, and question files should reference dot-point IDs so they can be remapped.
9. **Client-side trust:** ratings and leaderboards can be spoofed by a determined user. This is accepted for a small group; revisit if the platform opens up.
