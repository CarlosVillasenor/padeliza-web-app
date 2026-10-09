# Padeliza

A web application for creating and managing Americano and Mexicano padel
tournaments. It is built with Next.js App Router, React, and TypeScript.
Tournament data is stored in the browser's local storage.

## Requirements and development

Node.js 26 (the version specified in `.nvmrc`) and npm are required.

```bash
nvm use
npm install
npm run dev
```

No environment variables are required for local development or production
builds.

Open [http://localhost:3000](http://localhost:3000). Available commands:

```bash
npm test                 # Domain tests
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript validation
npm run build            # Production build
npm start                # Serve the production build
```

## Routes and workflows

- `/`: Lists saved tournaments and provides a way to start a new one.
- `/tournaments/new`: Wizard for configuring the format, players, courts,
  scoring, number of rounds when applicable, and tournament name. You can
  move between steps without losing the draft; leaving or reloading discards it.
- `/tournaments/[id]`: Displays matches and lets you enter results. In Mexicano,
  each next round can be generated after completing all matches in the current
  round. When the tournament is complete, this route displays the standings.

Route pages in `src/app/` compose tournament features; the UI, state, and
business rules belong to the feature.

## Architecture

```text
src/
├── app/                              # Routes, layout, and global styles
│   ├── tournaments/
│   │   ├── [id]/page.tsx             # Tournament view composition
│   │   └── new/page.tsx              # Wizard composition
│   ├── layout.tsx                    # Root layout and tournament provider
│   └── page.tsx                      # Home page and tournament list
├── features/tournaments/
│   ├── components/                   # List, wizard, match, scoring, and standings UI
│   ├── hooks/TournamentProvider.tsx  # Shared state and tournament actions
│   ├── lib/                          # Rules, schedules, scoring, progress, storage
│   └── types/tournament.ts           # Domain types and error codes
└── shared/
    ├── i18n/                         # Locale configuration and message dictionaries
    └── styles/variables.css          # Global CSS design tokens
```

The `@/` alias points to `src/`, as configured in `tsconfig.json`. Routes may
import from `features/` and `shared/`; feature modules should not import from
`app/`, and `shared/` must not depend on a feature. Keep components that are
used by only one feature inside that feature.

Route components are Server Components by default. The provider and interfaces
that use state, event handlers, or browser APIs are Client Components. The
provider is mounted in the root layout to share tournament data and mutations
across routes.

The active locale is Spanish (`es`). Locale configuration and dictionaries live
in `src/shared/i18n/`; adding a locale requires registering its messages there.
Global design tokens are in `src/shared/styles/variables.css`, while route and
feature styles use CSS Modules.

### Feature responsibilities

- `components/TournamentWizard/`: Temporary form state and tournament creation
  steps.
- `components/TournamentPlay/`: Match view, score editing, and final standings.
- `hooks/TournamentProvider.tsx`: Context, data loading, and tournament
  creation, scoring, round generation, and completion actions.
- `lib/rules.ts`: Tournament configuration and schedule validation.
- `lib/schedule.ts`: Match and round generation.
- `lib/scoring.ts`, `lib/progress.ts`, and `lib/standings.ts`: Score validation,
  progression rules, and standings calculations.
- `lib/play.ts`: Domain operations for matches and tournaments.
- `lib/storage.ts`: Storage encoding, validation, and decoding.
- `types/tournament.ts`: Domain types and error codes; user-facing messages
  remain in `shared/i18n/`.

## Tournament rules

- **Players:** 4, 8, 12, or 16; IDs and names must be unique. Names are compared
  case-insensitively.
- **Americano:** Every player partners with every other player once. Rotations
  are processed in batches of up to the configured number of courts. The number
  of rounds is `(N - 1) × ceil((N / 4) / C)`, where `N` is the number of players
  and `C` is the number of courts. For example, 12 players and 2 courts produce
  22 rounds.
- **Mexicano:** Four players per court, with 1 to 4 courts. The first round is
  randomized; subsequent rounds are generated from the standings in groups of
  four. Within each group, first and fourth play against second and third.
- **Scoring:** Each match score must total the configured value, from 1 to 100.
  Ties are allowed. Each player's points include the score earned by their team.
- **Standings:** Players are sorted by points descending, then wins descending,
  then name. Players tied on points and wins share the same position.
- **Editing and completion:** Americano scores can be edited until the
  tournament is complete. In Mexicano, only the latest round can be edited
  because later rounds depend on its results. A tournament is complete when
  every round has been generated and every match has a score.

## Persistence and limitations

Tournaments are stored in `localStorage` under the key
`padeliza.tournaments.v2` using a versioned format. On load, the app validates
the configuration, schedule, scores, and uniqueness of IDs. Corrupted data or
an unrecognized version produces a visible error and is not automatically
overwritten.

Writes happen before an operation is reported as successful; if a write fails,
the UI displays an error. Other tabs receive updates through the `storage`
event, but simultaneous writes are not transactional. There is no API, remote
database, cross-device synchronization, or backup. The browser may clear this
data, and using `localStorage` does not mean the app works offline.

## Tests

Domain tests are located next to the modules they validate:

- `src/features/tournaments/lib/rules.test.ts`: Configuration, rounds, and
  persistence.
- `src/features/tournaments/lib/play.test.ts`: Scores, progression, standings,
  and round generation.

Run `npm test` to run all tests. When changing rules or persistence, update the
relevant tests and also validate lint, TypeScript, and the production build.
