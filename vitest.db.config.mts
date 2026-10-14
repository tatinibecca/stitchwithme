import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes de banco (migrations + RLS). Rodam contra um Postgres real: `npm run test:db`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    fileParallelism: false,
  },
});
