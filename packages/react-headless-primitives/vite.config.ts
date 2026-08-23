import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.stories.ts",
        "src/**/*.stories.tsx",
      ],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        button: "src/components/Button/Button.tsx",
        dialog: "src/components/Dialog/Dialog.tsx",
        toast: "src/components/Toast/Toast.tsx",
        tabs: "src/components/Tabs/Tabs.tsx",
        accordion: "src/components/Accordion/Accordion.tsx",
        combobox: "src/components/Combobox/Combobox.tsx",
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.js` : `${entryName}.cjs`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
