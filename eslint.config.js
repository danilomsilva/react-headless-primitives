import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/storybook-static/**",
      "**/coverage/**",
      "**/node_modules/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs["recommended-latest"].rules,
  },
  jsxA11y.flatConfigs.recommended,
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
  },
  {
    // Module-augmentation declaration files legitimately declare
    // empty interfaces with unused type params (matches how
    // @testing-library/jest-dom types its own Vitest augmentation).
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
