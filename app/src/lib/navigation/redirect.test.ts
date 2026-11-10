import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("acepta rutas internas con query", () => {
    expect(safeRedirectPath("/c/abc?k=123")).toBe("/c/abc?k=123");
  });

  it.each([
    ["dominio externo", "https://evil.example"],
    ["ruta protocol-relative", "//evil.example/x"],
    ["barra invertida", "/\\evil.example"],
    ["vacío", ""],
    ["ausente", null],
    ["javascript:", "javascript:alert(1)"],
  ])("rechaza %s y vuelve al inicio", (_label, value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });
});
