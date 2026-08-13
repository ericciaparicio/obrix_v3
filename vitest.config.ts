import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Los tests de integración pegan contra la misma base de datos local de
    // desarrollo (ver AGENTS.md); se ejecutan secuencialmente para evitar que
    // corran en paralelo sobre el mismo estado.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
