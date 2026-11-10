import { defineConfig } from "vitest/config";
import { resolve, unitTests } from "./vitest.shared.mts";

export default defineConfig({
  resolve,
  test: {
    projects: [
      { extends: true, test: unitTests },
      {
        extends: true,
        test: { name: "integration", include: ["tests/integration/**/*.test.ts"], environment: "node", testTimeout: 20000 },
      },
    ],
  },
});
