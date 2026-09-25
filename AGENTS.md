# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

---

# Padeliza Frontend Agent Instructions

This is a Next.js App Router application for creating and managing "Americano"-style padel tournaments.

## Next.js generated guidance

Keep the Next.js-generated guidance in this file intact. Next.js may update or re-add that block during development. Before implementing framework-specific code, consult the Next.js documentation available in the installed version of the project when appropriate.

---

## 1. Project goals

Build Padeliza as a maintainable, accessible, responsive, and production-ready React/Next.js application.

Priorities, in order:

1. Correctness and clear domain behavior.
2. Simple, maintainable architecture.
3. Accessibility and responsive UX.
4. Performance and small client-side JavaScript bundles.
5. Consistent visual language and reusable UI.
6. Type safety and code quality.

Avoid adding abstractions, dependencies, or patterns that do not solve a real problem in the application.

## 2. Technology baseline

Use the versions and capabilities already defined by the repository unless a task explicitly requires a change.

Current baseline:

- Next.js App Router.
- React.
- TypeScript.
- ESLint.
- React Compiler is configured in the project.
- CSS Modules plus global CSS are the default styling approach.

Do not replace the styling system, routing model, or state architecture with another framework/library without a clear technical reason and explicit approval.

## 3. Architecture: feature-first

Keep `src/app` focused on Next.js routing, layouts, route-level loading/error/not-found behavior, metadata, and composition.

Put domain-specific application code under `src/features`.

Preferred structure:

```text
src/
├── app/                         # Routes, layouts, route composition
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── features/
│   ├── tournaments/
│   │   ├── components/          # Tournament-specific UI
│   │   ├── hooks/               # Tournament-specific client hooks
│   │   ├── lib/                 # Tournament domain logic/helpers
│   │   ├── types/               # Tournament types
│   │   └── ...
│   ├── players/
│   ├── matches/
│   └── ...
├── components/                  # Truly shared UI components
├── lib/                         # Cross-feature utilities/infrastructure
├── types/                       # Truly global/shared types
└── styles/                      # Optional shared style resources/tokens
```

Rules:

- Keep a feature's domain logic, types, hooks, and components close together.
- Do not put tournament-specific code in `components/` merely because it is a React component.
- Only promote code to shared folders when it is genuinely reused by multiple features and has stable semantics.
- Avoid creating a large generic `utils.ts`, `helpers.ts`, or `components/` dumping ground.
- Avoid deep circular dependencies between features.
- Prefer one-way dependency flow: `app -> features/shared`, and shared code must not depend on a feature.
- Keep imports explicit and local. Avoid giant global barrel files that make ownership unclear.

## 4. Next.js App Router rules

- Treat Server Components as the default.
- Add `"use client"` only when a component actually needs client-side state, event handlers, effects, browser APIs, or another client-only capability.
- Keep client boundaries as low in the component tree as practical.
- Do not add `"use client"` to an entire page/layout just to make one small interactive control work.
- Avoid moving data fetching to the client when it can be performed on the server.
- Pass only the data a Client Component needs; keep props serializable across the server/client boundary.
- Keep secrets, credentials, and private server-only operations out of Client Components.
- Prefer Next.js `Link` for internal navigation.
- Use route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` when they improve the UX.
- Follow the installed Next.js version's local documentation before using APIs whose behavior may have changed.

## 5. React component design

Create components around responsibilities, not arbitrary file size.

Good components:

- Have a clear purpose.
- Receive explicit props.
- Keep rendering logic easy to read.
- Keep side effects localized.
- Avoid knowing about unrelated features.

Prefer composition over giant components with many boolean props.

Example:

```tsx
<TournamentCard>
  <TournamentCard.Header />
  <TournamentCard.Players />
  <TournamentCard.Actions />
</TournamentCard>
```

Do not create a component only to wrap one element unless it provides a meaningful semantic, styling, or behavioral boundary.

Use stable, domain-meaningful keys when rendering collections. Do not use array indexes as keys for lists whose order or membership can change.

Keep state as close as possible to the component that owns it. Lift state only when multiple components genuinely need the same state.

Avoid derived state when the value can be calculated directly from props/state during render.

Avoid `useEffect` for values that can be computed during render. Use effects for synchronization with external systems, subscriptions, browser APIs, or other genuinely side-effectful work.

## 6. React performance

Performance optimization must be evidence-driven.

- Prefer Server Components to reduce client JavaScript.
- Keep Client Components small and focused.
- Avoid unnecessary state updates and effects.
- Avoid recreating large data structures on every render when they can be moved or computed more efficiently.
- Do not optimize every component preemptively.
- Do not add `React.memo`, `useMemo`, or `useCallback` by default.
- Because React Compiler is configured, rely on compiler-driven memoization for normal cases.
- Use manual memoization only when it solves a demonstrated performance or dependency problem and remains understandable.
- When performance work is required, measure first and verify after the change.
- For expensive lists or large datasets, consider pagination, virtualization, incremental rendering, or moving computation off the critical render path when appropriate.
- Prefer CSS for visual transitions and animations rather than JavaScript animation loops.
- Avoid unnecessary client-side libraries for functionality that can be implemented with platform APIs or server rendering.

When performance is discussed, distinguish among:

- server/render performance,
- client JavaScript/bundle size,
- rendering/re-render cost,
- network/data-fetch cost,
- image/font loading,
- Core Web Vitals.

Do not claim an optimization helped without measuring or having a defensible technical reason.

## 7. Code splitting and loading

Load code only where it is needed.

- Use normal static imports by default.
- Use lazy loading/dynamic imports for genuinely non-critical or heavy Client Components and libraries when this improves the initial experience.
- Do not dynamically import small components merely to appear "optimized."
- Keep third-party libraries out of the client bundle unless the feature needs them in the browser.
- Load heavy browser-only dependencies only when the related feature is used.

## 8. Images and fonts

Use Next.js image/font capabilities where applicable.

Images:

- Prefer `next/image` instead of raw `<img>` for application images.
- Provide meaningful `alt` text for informative images.
- Use empty `alt` text for purely decorative images.
- Define appropriate dimensions or use `fill` with a properly constrained container to avoid layout shift.
- Use responsive sizing appropriately.
- Do not eagerly load every image.
- For an image that is intentionally the critical above-the-fold resource, use the current Next.js mechanism for preloading it; do not rely on deprecated options.

Fonts:

- Prefer `next/font` for application fonts.
- Avoid unnecessary external font requests from CSS or third-party CDNs.
- Keep font usage intentional; do not load many weights/styles without a reason.

## 9. CSS architecture

Use CSS custom properties (CSS variables) for design tokens and CSS Modules for component/feature styles.

### Global CSS

`src/app/globals.css` should contain:

- global design tokens,
- reset/base styles,
- typography defaults,
- global accessibility preferences,
- global layout primitives only when they are truly global.

Do not put feature-specific styles in `globals.css`.

### CSS variables

Prefer semantic variables over raw repeated values.

Example:

```css
:root {
  --color-background: #ffffff;
  --color-surface: #f7f7f8;
  --color-text: #171717;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-primary: #0f766e;
  --color-primary-foreground: #ffffff;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.08);
}
```

Use a local `*.module.css` file for component and feature styling unless inline styles are specifically appropriate.

Avoid:

- large global selector chains,
- unnecessary `!important`,
- duplicated responsive rules,
- styling based on DOM structure when a class can express the intent more clearly.

Prefer mobile-first CSS and progressive enhancement with media queries.

### Responsive CSS structure

Use a mobile-first approach in every `*.module.css` file.

The standard Padeliza breakpoints are:

- Mobile: default
- Large phones / small tablets: `36rem` (576px)
- Tablets: `48rem` (768px)
- Laptops: `64rem` (1024px)
- Large desktops: `80rem` (1280px)
- Wide screens: `96rem` (1536px)

Example:

```css
.component {
  /* Mobile styles */
}

/* Large phones / small tablets (576px) */
@media (min-width: 36rem) {
  .component {
    /* Only include styles that change at this breakpoint */
  }
}

/* Tablets (768px) */
@media (min-width: 48rem) {
  .component {
    /* Only include styles that change at this breakpoint */
  }
}
```

## 10. Responsive design

Padeliza should work well on phones first and scale up to tablet and desktop layouts.

- Use CSS media queries instead of reading viewport width in React whenever possible.
- Avoid hard-coded widths that break on small screens.
- Prefer flexible layouts using Flexbox/Grid, `minmax()`, `clamp()`, `min()`, and `max()` where appropriate.
- Ensure tap targets have adequate size and spacing.
- Test long player names, tournament names, scores, and empty states at narrow widths.
- Do not rely on hover as the only way to expose functionality.

## 11. Accessibility

Accessibility is a core requirement, not a polish step.

- Use semantic HTML elements before ARIA.
- Every interactive element must be keyboard accessible.
- Buttons should use `<button>`; navigation should use `<a>`/Next.js `Link`.
- Form controls need associated labels.
- Maintain visible focus styles.
- Do not use color as the only way to communicate match/tournament status.
- Provide meaningful accessible names for icon-only controls.
- Keep heading levels logical.
- Respect `prefers-reduced-motion` for non-essential animations.
- Ensure sufficient color contrast.
- Do not disable browser focus outlines without providing an equivalent visible focus state.

## 12. State management

Use the smallest state scope that solves the problem.

Prefer this order when deciding where state belongs:

1. Local component state.
2. Parent/feature state shared by a small part of the UI.
3. URL/search params for state that should be linkable, shareable, or navigation-related.
4. Server-side data fetching/caching for server state.
5. Context only for genuinely cross-cutting values.
6. A global client-state library only when the application's requirements actually justify one.

Do not put every piece of state into a global store.

Do not duplicate server state into client state unless the feature specifically needs an editable local copy or optimistic workflow.

## 13. Domain modeling for Padeliza

Use domain language consistently.

Prefer explicit types for concepts such as:

- Tournament
- TournamentStatus
- Player
- Team/Pair
- Match
- MatchResult
- Round
- Court
- Score

Avoid loose `string`/`number` usage when a discriminated union or domain type makes invalid states harder to represent.

Example:

```ts
type TournamentStatus =
  | "draft"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";
```

Keep business rules in feature/domain modules rather than inside JSX when possible.

Example:

```ts
export function canStartTournament(tournament: Tournament): boolean {
  // Business rule belongs in domain logic, not in the component render tree.
}
```

Components should primarily compose UI and user interactions around those rules.

## 14. TypeScript

- Keep TypeScript strict and expressive.
- Never introduce `any` unless there is a documented, unavoidable boundary.
- Prefer `unknown` at unsafe boundaries and narrow it safely.
- Use discriminated unions for mutually exclusive states.
- Prefer type aliases/interfaces that communicate the domain.
- Avoid overusing generics when a concrete type is clearer.
- Keep public component props explicit.
- Reuse existing shared/domain types instead of redefining equivalent shapes.
- Validate external data at boundaries instead of assuming it matches internal types.

## 15. Error, loading, and empty states

Every async feature should consider:

- loading,
- success,
- empty,
- error,
- retry/recovery where appropriate.

Do not render a blank page or silently swallow an error.

Use route-level and component-level boundaries according to the scope of the failure.

## 16. Forms and user input

- Use semantic form controls.
- Validate user input close to the boundary where it enters the application.
- Preserve useful user input when validation fails.
- Show clear, specific validation messages.
- Avoid unnecessary controlled state for simple fields unless the behavior requires it.
- Disable submission only when there is a real reason; communicate why when useful.
- Make forms fully keyboard accessible.

## 17. Data fetching and mutations

When backend/API work is introduced:

- Prefer server-side data fetching for data that does not require browser-only behavior.
- Keep API/infrastructure logic out of presentational components.
- Centralize reusable API clients in `src/lib` or a feature-specific `lib` module.
- Validate responses at external boundaries.
- Handle loading, empty, and error states explicitly.
- Never expose secrets through `NEXT_PUBLIC_*` variables unless they are intentionally public.
- Treat authorization as a server-side concern; client-side checks are only UX helpers, not security controls.

For mutations, use the current Next.js/React pattern appropriate to the installed version, and consult the installed documentation before implementing framework-specific APIs.

## 18. Security

- Never commit secrets, tokens, private keys, or credentials.
- Do not trust client-provided permissions or role information.
- Validate and sanitize untrusted input where appropriate.
- Avoid unsafe HTML injection.
- Keep server-only code and credentials on the server.
- Review any use of external URLs, redirects, uploads, or dynamic HTML carefully.

## 19. Dependency discipline

Before adding a dependency:

1. Check whether the platform, Next.js, React, or existing project code already solves the problem.
2. Check whether the dependency is necessary for a meaningful feature.
3. Prefer small, well-maintained dependencies over large libraries for narrow tasks.
4. Avoid adding duplicate libraries that overlap with existing capabilities.

Do not add a dependency only to save a few lines of code.

## 20. Naming and file conventions

- Use PascalCase for React component files when the repository convention supports it.
- Use camelCase for utility modules and functions.
- Use descriptive feature names in plural/domain terms when appropriate (`tournaments`, `players`, `matches`).
- Name CSS Modules after the component (`TournamentCard.module.css`).
- Prefer descriptive handler names such as `handleCreateTournament` over `handleClick2`.
- Avoid vague names such as `data`, `thing`, `stuff`, `temp`, or `helper` when a domain-specific name is available.

## 21. Comments and documentation

Write comments for intent, constraints, and non-obvious tradeoffs—not for obvious syntax.

Bad:

```ts
// Increment count
count += 1;
```

Good:

```ts
// Prevent generating a new round until all matches in the current round have results.
```

Update documentation when an architectural decision changes how future contributors should work.

## 22. Testing and validation

Do not introduce a test framework unless the task requires it or the repository already has one.

When test infrastructure exists:

- Test business rules and important user flows.
- Prefer behavior-oriented tests over implementation-detail tests.
- Cover important edge cases such as zero players, odd player counts, incomplete matches, duplicate players, invalid scores, and tournament state transitions.
- Keep tests close to the feature they validate when practical.

Before considering a change complete, run the repository's available validation commands. At minimum for the current repository:

```bash
npm run lint
npm run build
```

Fix lint/type/build errors introduced by the change rather than ignoring them.

## 23. Git and change discipline

Keep changes focused.

- Do not modify unrelated files.
- Do not reformat the entire repository for a feature change.
- Do not remove working code without understanding its purpose.
- Prefer small, reviewable commits when working through Git.
- Preserve existing behavior unless the task explicitly changes it.

## 24. Definition of done

A change is considered complete when:

- The feature works correctly.
- The implementation follows the feature-first architecture.
- Server/client boundaries are intentional.
- Styling uses the existing CSS architecture and design tokens.
- The UI is responsive and accessible.
- Performance-sensitive code has no obvious unnecessary client work.
- TypeScript and ESLint are clean.
- The production build succeeds.
- New abstractions/dependencies are justified.
- Error, loading, and empty states are handled where relevant.

## 25. Agent behavior

When implementing a request:

1. Inspect the existing code before creating new abstractions.
2. Reuse existing components, tokens, types, utilities, and patterns when they fit.
3. Follow the nearest feature's conventions before introducing a new convention.
4. Prefer the simplest implementation that preserves maintainability.
5. Keep framework-specific behavior aligned with the installed Next.js and React versions.
6. Measure before making performance-sensitive changes when practical.
7. Do not add unrelated improvements unless they are necessary for the requested change or prevent a clear regression.

## 26. Git Commit Convention

All commits created by the agent must follow this format:

```text
<type>: <description>
```
