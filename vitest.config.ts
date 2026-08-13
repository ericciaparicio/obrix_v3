import { defineConfig } from "vitest/config";
import path from "node:path";

// Los tests corren fuera del ciclo de vida de Next.js, así que hay que cargar
// .env explícitamente (DATABASE_URL para Prisma, AUTH_SECRET para Auth.js).
try {
  process.loadEnvFile(path.resolve(__dirname, ".env"));
} catch {
  // .env ausente (ej. CI con variables ya exportadas) — seguir sin fallar.
}

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
    server: {
      // "next" y "next-auth" no declaran "exports" en su package.json, así
      // que el loader ESM nativo de Node (usado para deps externalizadas)
      // no resuelve subpaths sin extensión como "next/server". Forzamos a
      // que Vite los transforme en vez de externalizarlos.
      deps: {
        inline: [/next-auth/, /^next\//, /^next$/],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
