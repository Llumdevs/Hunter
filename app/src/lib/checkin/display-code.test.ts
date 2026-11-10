import { describe, expect, it } from "vitest";
import { redemptionDisplayCode } from "./display-code";

describe("redemptionDisplayCode", () => {
  it("muestra los 6 primeros caracteres en mayúsculas, legible en la barra", () => {
    expect(redemptionDisplayCode("8a0b5d1e-0000-4000-8000-000000000001")).toBe("8A0-B5D");
  });

  it("siempre tiene el formato XXX-XXX", () => {
    expect(redemptionDisplayCode("ffffffff-ffff-4fff-bfff-ffffffffffff")).toMatch(/^[0-9A-F]{3}-[0-9A-F]{3}$/);
  });
});
