import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@content": path.resolve(__dirname, "src/content"),
      "@renderer": path.resolve(__dirname, "src/renderer")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome126"
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: { enabled: false }
  }
});
