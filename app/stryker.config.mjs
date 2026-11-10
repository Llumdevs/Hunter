// Mutación de la lógica pura del frontend (la lógica de base de datos se muta con su propio script).
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  vitest: { configFile: "vitest.unit.config.mts", related: false },
  mutate: ["src/lib/**/*.ts", "!src/lib/**/*.test.ts", "!src/lib/supabase/**", "!src/lib/env.ts", "!src/lib/auth/**", "!src/lib/venue/place-access.ts", "!src/lib/venue/qr-credentials.ts"],
  reporters: ["clear-text", "progress"],
  thresholds: { high: 90, low: 80, break: 80 },
  tempDirName: ".stryker-tmp",
};

export default config;
