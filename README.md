# Intellectify

A mastery-based practice platform for WACE ATAR courses: a Khan Academy-style skill tree, an AoPS Alcumus-style
rating engine, and CAS-checked questions from recall up to well beyond the exam. The pilot course is
Mathematics Specialist.

The full specification is in [`docs/SPEC.md`](docs/SPEC.md).

## Layout

| Path | What it is |
|---|---|
| `packages/engine` | Ratings (θ), ranks, gates, roll-ups, question selection, attempt credit |
| `packages/checker` | Answer checking: LaTeX parsing, numeric-sampling equivalence, form rules |
| `packages/content` | Content schemas, validation and the JSON bundle build |
| `content/` | Curriculum (skill trees) and questions, as YAML |
| `apps/web` | SvelteKit web app (static SPA) |

## Develop

```bash
pnpm install
```

```bash
pnpm test
```

```bash
pnpm dev
```

`pnpm dev` builds the content bundles and starts the app at http://localhost:5173. Without Firebase settings
it runs in **local mode**: one guest user, progress saved in the browser.

To use Firebase, copy `apps/web/.env.example` to `apps/web/.env` and fill in your project's web config. Then:

- in the Firebase console, enable the **Google** and **Email link** sign-in providers;
- create a Firestore database and deploy the rules in `firestore.rules`.

## Content

Run `pnpm content` after editing anything under `content/`. It validates the curriculum (every dot point
covered once, no prerequisite cycles, prerequisites never in a later unit) and every question (schema,
known skills, and each answer key passing its own checker). Nothing is written if there are errors.

## Deploy

Netlify builds with `pnpm build` and publishes `apps/web/build` (see `netlify.toml`). Set the
`VITE_FIREBASE_*` variables in the Netlify site settings.
