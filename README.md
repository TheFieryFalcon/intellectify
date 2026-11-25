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

`pnpm dev` builds the content bundles and starts the app at http://localhost:5173.

## Firebase

The app uses the Firebase project **intellectify-4357c** (web app "intellectify"):

- **Authentication:** Google and Email/Password sign-in, with password reset by email.
- **Firestore:** `(default)` database in `australia-southeast1`, with the rules in `firestore.rules`.

The web config is in `apps/web/src/lib/firebase.config.ts`. It's public by design; the Firestore rules
protect the data. To deploy rule changes with the Firebase CLI:

```bash
npx firebase-tools deploy --only firestore:rules
```

Local mode (one guest user, progress saved in the browser) is used only if the config is blanked out.

## Content

Run `pnpm content` after editing anything under `content/`. It validates the curriculum (every dot point
covered once, no prerequisite cycles, prerequisites never in a later unit) and every question (schema,
known skills, and each answer key passing its own checker). Nothing is written if there are errors.

## Deploy

Netlify builds with `pnpm build` and publishes `apps/web/build` (see `netlify.toml`). No environment
variables are needed. Add the Netlify domain to Firebase **Authentication → Settings → Authorized domains**
so Google sign-in works there.
