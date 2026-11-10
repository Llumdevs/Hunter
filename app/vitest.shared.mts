import { fileURLToPath } from "node:url";

export const resolve = { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } };
export const unitTests = { name: "unit", include: ["src/**/*.test.ts"], environment: "node" as const };
