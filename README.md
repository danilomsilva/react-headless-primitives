# react-headless-primitives

A from-scratch headless React component library — the skill this repo isolates is building correct, accessible component _behavior_ with zero styling opinions: WAI-ARIA patterns, keyboard interaction, focus management, and controlled/uncontrolled state, implemented directly (no Radix/React Aria dependency) and documented in Storybook.

**[Storybook →](https://danilomsilva.github.io/react-headless-primitives/)**

[![CI](https://github.com/danilomsilva/react-headless-primitives/actions/workflows/ci.yml/badge.svg)](https://github.com/danilomsilva/react-headless-primitives/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white)](https://danilomsilva.github.io/react-headless-primitives/)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-88%20passing-brightgreen)

## Install

```sh
npm install react-headless-primitives
```

Each component also has its own subpath export, so bundlers can tree-shake per-component:

```ts
import { Button } from "react-headless-primitives/button";
import { Dialog } from "react-headless-primitives/dialog";
```

## Architecture

**Headless.** No component ships CSS. Stateful parts expose `data-state`, `data-variant`, `data-highlighted`, etc. as styling hooks — consumers style via attribute selectors (`[data-state="open"]`) in whatever system they use. The `apps/demo` app in this repo styles every component with Tailwind purely off these hooks.

**Compound API.** Multi-part components (`Dialog`, `Toast`, `Tabs`, `Accordion`, `Combobox`) are `Root` + parts (`Trigger`, `Content`, `Item`, ...) sharing state through context, rather than one component with a dozen props. This mirrors how Radix/React Aria structure things, and it's the only way to let consumers control markup structure and composition (e.g. reorder a Dialog's Close button, or render Accordion items from arbitrary data) without prop-explosion.

**Controlled or uncontrolled, always both.** Every stateful component takes `value`/`defaultValue`/`onValueChange` (or `open`/`defaultOpen`/`onOpenChange`) via one shared internal hook, `useControllableState`. Uncontrolled is the default (state lives internally); passing `value` hands control to the parent. `Accordion`'s single-select mode uses `""` (not `undefined`) to represent "nothing open" while controlled, since `undefined` is the hook's uncontrolled-fallback sentinel.

**No JS-driven animation.** Every open/close transition is `data-state="open"|"closed"` for the consumer to animate in CSS. The library never owns timing.

## Components and keyboard interaction

| Component | Keyboard                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button    | Enter / Space activates (native `<button>`); blocked while `disabled` or `loading`                                                                                                          |
| Dialog    | Tab/Shift+Tab cycles focus within Content (focus trap); Escape closes; focus moves to first focusable element on open and returns to the trigger on close                                   |
| Toast     | Tab reaches the dismiss control like any other content; auto-dismiss pauses on hover/focus                                                                                                  |
| Tabs      | ArrowRight/ArrowLeft (or ArrowDown/ArrowUp when `orientation="vertical"`) moves focus and activates, wrapping at the ends; Home/End jump to first/last tab                                  |
| Accordion | ArrowDown/ArrowUp moves focus between triggers only (does not activate), wrapping at the ends; Home/End jump to first/last trigger; Enter/Space toggles (native `<button>`)                 |
| Combobox  | ArrowDown/ArrowUp moves the highlighted option (`aria-activedescendant`, focus stays on the input); Enter selects the highlighted option; Escape closes; Home/End jump to first/last option |

## Repo layout

- `packages/react-headless-primitives` — the library (components, tests, Storybook stories, all colocated)
- `apps/demo` — a Tailwind app consuming the published package like any other npm dependency
- `docs/plan.md` — the build plan this repo was built from, one milestone/step at a time

## Local development

```sh
npm install
npm run build -w packages/react-headless-primitives   # apps/demo imports the built package
npm run storybook -w packages/react-headless-primitives
npm run dev -w apps/demo
```

`npm run lint` / `npm run typecheck` / `npm run test` / `npm run build` run across the whole workspace.
