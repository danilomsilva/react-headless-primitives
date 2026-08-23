import type { AxeMatchers } from "vitest-axe/dist/matchers";

// vitest-axe@0.1.0 ships a `Vi` namespace augmentation that predates
// Vitest 4's `declare module "vitest"` matcher typing, so it's redeclared
// here to match how @testing-library/jest-dom augments Vitest.
declare module "vitest" {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
