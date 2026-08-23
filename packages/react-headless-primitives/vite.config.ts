import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
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
