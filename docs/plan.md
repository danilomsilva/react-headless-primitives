# react-headless-primitives — build plan

## Context

This is a new, currently-empty repo (`danilomsilva/react-headless-primitives` on GitHub, remote already configured, no commits yet) intended as a portfolio piece demonstrating headless, accessible React component design: unstyled primitives with correct WAI-ARIA behavior, controlled/uncontrolled APIs, and full Storybook documentation. The original 5-milestone brief was reviewed and tightened in conversation.

Revised per feedback: instead of one giant commit per milestone (tooling all at once, then components all at once), the build proceeds the way a person actually builds a project — each piece committed as soon as it's working, tooling added just-in-time for what the next piece needs rather than front-loaded. The milestones below are still the useful checkpoints, but each is a sequence of small, individually-committed steps. Commits are authored normally — no AI co-author trailer. The plan itself is checked into the repo at `docs/plan.md` as the first commit, the way a person would jot down the plan before writing code.

Confirmed with the user:

- **Layout**: npm workspaces monorepo — `packages/react-headless-primitives` (the lib) + `apps/demo` (Tailwind consumer app that installs the lib like a real external consumer).
- **Package manager**: npm (already installed, no extra setup).
- **Publish intent**: portfolio-only — `package.json` exports configured correctly "as if publishable," but no npm publish automation/Changesets.
- **Storybook deploy**: GitHub Pages via GitHub Actions, not Vercel.

## Workspace structure

```
react-headless-primitives/
├── docs/
│   └── plan.md                      # this plan, committed first
├── package.json                     # root, "workspaces": ["packages/*", "apps/*"]
├── .nvmrc                           # pinned to installed Node (24.x)
├── .github/workflows/ci.yml
├── packages/
│   └── react-headless-primitives/
│       ├── package.json             # per-component subpath exports, main/module/types
│       ├── vite.config.ts           # lib mode, ESM+CJS+d.ts, one entry per component
│       ├── .storybook/
│       ├── src/
│       │   ├── internal/            # Slot, Portal, useControllableState, useId, composeEventHandlers, useEscapeKey, useFocusTrap
│       │   └── components/
│       │       └── <Name>/
│       │           ├── <Name>.tsx
│       │           ├── <Name>.test.tsx
│       │           └── <Name>.stories.tsx
└── apps/
    └── demo/                        # Vite + Tailwind, depends on the workspace package
```

## Stack

| Area              | Choice                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| React             | 19, peerDependency `>=18`                                                                                                                         |
| TypeScript        | 5.x strict + `noUncheckedIndexedAccess`                                                                                                           |
| Bundler           | Vite lib mode                                                                                                                                     |
| Storybook         | latest 9.x, `.storybook` inside the lib package, stories colocated with components                                                                |
| Tests             | Vitest + React Testing Library + `vitest-axe`                                                                                                     |
| Interaction tests | Storybook play functions, executed headlessly in CI via `@storybook/test-runner`                                                                  |
| Lint              | ESLint flat config: typescript-eslint, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, `eslint-plugin-storybook`, `eslint-config-prettier` |
| Format            | Prettier                                                                                                                                          |
| Pre-commit        | husky + lint-staged                                                                                                                               |
| Deploy            | GitHub Actions → GitHub Pages, on push to `main`, after all checks pass                                                                           |

## Architecture decisions

- **No shipped CSS.** Stateful parts expose `data-state` / `data-orientation` / `data-disabled` attributes (Radix-style) as the styling hook; consumers style via attribute selectors. `className` passes through untouched.
- **Polymorphism via an internal `Slot`.** Gives `asChild` support to `Button` and compound `Trigger` parts without duplicating behavior.
- **Shared internal utilities are added just-in-time**, not all upfront: `Slot`/`composeEventHandlers` land with Button (the first component that needs them); `useControllableState`, `useId`, `Portal`, `useFocusTrap`, `useEscapeKey` land with Dialog (the first component that needs them); a live-region helper lands with Toast. Later components reuse whatever already exists.
- **Button has no controlled/uncontrolled story** — it has no open/value state, so that requirement (meaningful for Dialog/Toast/Tabs/Accordion/Combobox) doesn't apply to it. It gets variant/size/loading/disabled + `asChild`, reflected as `data-*` attributes.
- **No JS-driven animation anywhere**, including Accordion. `data-state="open"|"closed"` is exposed for CSS transitions; the library never owns timing.

## Component specs

| Component     | API shape                                                     | ARIA pattern                                          | Controlled/uncontrolled                                                                                                     |
| ------------- | ------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button        | single component                                              | button                                                | —                                                                                                                           |
| Dialog        | `Root/Trigger/Portal/Overlay/Content/Title/Description/Close` | Dialog (Modal): focus trap, ESC, scroll lock          | `open`/`defaultOpen`/`onOpenChange`                                                                                         |
| Toast         | `Provider/Viewport/Root` + `useToast()` imperative hook       | `aria-live` region, internal queue                    | `toasts`/`onToastsChange` (Provider) vs internal queue via the hook                                                         |
| Tabs          | `Root/List/Trigger/Content`                                   | Tabs: roving tabindex, arrow/Home/End                 | `value`/`defaultValue`/`onValueChange`                                                                                      |
| Accordion     | `Root/Item/Header/Trigger/Content`                            | Accordion (button+region)                             | `type: "single"                                                                                                             | "multiple"`, `value`/`defaultValue`/`onValueChange`, `collapsible` |
| Combobox\<T\> | `Root<T>/Trigger/Input/Content/Item`                          | Combobox 1.2 (listbox popup, `aria-activedescendant`) | `value`/`defaultValue`/`onValueChange`; async via `loadOptions(query): Promise<T[]>`, loading/error exposed through context |

Every component (except Button, per above) ships: the component, a `.test.tsx` (behavior + `vitest-axe` assertions), and a `.stories.tsx` with Default / Variants / Keyboard-interaction (play function) / Accessibility stories — built together as one unit, one commit, not split across separate "write code" / "write tests" / "write stories" passes.

## Build sequence (small, individually-committed steps)

**Step 0 — plan on record**

- `docs: add project plan` — `docs/plan.md`.

**Milestone 1 — foundation, added just-in-time**

1. `chore: initialize npm workspaces` — root `package.json`, `.gitignore`, `.nvmrc`, README stub.
2. `chore: scaffold library package` — `packages/react-headless-primitives`, strict `tsconfig`, Vite lib config, empty `src/index.ts` that builds.
3. `chore: configure ESLint + Prettier` — get lint/format passing on the (small) codebase so far.
4. `chore: add Vitest + RTL + vitest-axe` with one smoke test to prove the pipeline works.
5. `chore: add Storybook 9` to the library package with a placeholder story to prove it boots.
6. `chore: add husky + lint-staged` pre-commit hook.
7. `ci: add GitHub Actions workflow` — typecheck → lint → test → build → storybook build, sequential.

**Milestone 2 — first 3 components, one at a time**

1. `feat: add Button component` — including the `Slot`/`composeEventHandlers` utilities it needs, plus test + story, in one commit.
2. `feat: add Dialog component` — including `useControllableState`, `useId`, `Portal`, `useFocusTrap`, `useEscapeKey`, plus test + story.
3. `feat: add Toast component` — `Provider/Viewport/Root` + `useToast()` hook, live-region helper, plus test + story.

**Milestone 3 — compound components, one at a time**

1. `feat: add Tabs component`, plus test + story.
2. `feat: add Accordion component` (reusing shared patterns from Tabs where they fit), plus test + story.
3. `feat: add Combobox<T> component` with async option loading, plus test + story.

**Milestone 4 — polish, demo, deploy**

1. `feat: enable Storybook autodocs + a11y addon`; backfill any component missing a Keyboard/Accessibility story.
2. `ci: run test-storybook (play functions) in CI`.
3. `feat: scaffold apps/demo` — Vite + Tailwind, consuming the workspace package like an external consumer.
4. `ci: deploy Storybook to GitHub Pages` on push to `main`, gated on green checks.

**Milestone 5 — README + publishable polish**

1. `docs: write README` — what this repo isolates, live Storybook link, install snippet, architecture rationale, keyboard tables.
2. `chore: finalize package.json exports` — per-component subpath exports, main/module/types.
3. `chore: set GitHub repo topics and description` via `gh repo edit`.

## Verification

- Each step: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run build-storybook` all green locally before committing.
- Component work (M2/M3): `vitest-axe` assertions must pass with zero violations; Storybook play-function stories must pass under `test-storybook`.
- CI (from M1 step 7 onward): GitHub Actions workflow must pass on push.
- M4: confirm the deployed GitHub Pages Storybook URL loads and `apps/demo` runs (`npm run dev -w apps/demo`) importing the lib via its workspace package name, not a relative path.
