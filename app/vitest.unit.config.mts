// Solo tests unitarios: lo usa Stryker, que no debe depender de la base de datos.
import { defineConfig } from "vitest/config";
import { resolve, unitTests } from "./vitest.shared.mts";

export default defineConfig({ resolve, test: unitTests });
