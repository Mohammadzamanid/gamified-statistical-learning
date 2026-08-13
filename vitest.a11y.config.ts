import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * The accessibility harness (S2-20).
 *
 * A separate config rather than a second entry in `vite.config.ts` because the
 * two suites need different environments: everything under `tests/` runs in
 * `node`, deliberately, since the core is pure and a DOM there would be dead
 * weight on 695 checks. These render React into jsdom, which is the only way
 * the things scope §6 asks about — focus order, accessible names, live regions,
 * keyboard operation — can be observed at all.
 *
 * `.tsx`, because a file that renders components is a file that contains JSX,
 * and the main config's `include` is `.ts` only.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@content": path.resolve(__dirname, "src/content"),
      "@renderer": path.resolve(__dirname, "src/renderer")
    }
  },
  test: {
    environment: "jsdom",
    include: ["tests/a11y/**/*.test.tsx"],
    setupFiles: ["tests/a11y/setup.ts"],
    globals: false,
    coverage: { enabled: false }
  }
});
