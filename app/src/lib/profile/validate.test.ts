import { describe, expect, it } from "vitest";
import { validateProfileInput } from "./validate";

const TODAY = new Date("2026-11-14T12:00:00Z");

describe("validateProfileInput", () => {
  it("acepta un adulto con nombre", () => {
    expect(validateProfileInput({ displayName: "  Luz ", birthdate: "2000-01-01" }, TODAY)).toEqual({
      kind: "valid",
      profile: { displayName: "Luz", birthdate: "2000-01-01" },
    });
  });

  it("acepta a quien cumple 18 hoy", () => {
    expect(validateProfileInput({ displayName: "Ana", birthdate: "2008-11-14" }, TODAY)).toMatchObject({ kind: "valid" });
  });

  it("rechaza a quien cumple 18 mañana", () => {
    expect(validateProfileInput({ displayName: "Ana", birthdate: "2008-11-15" }, TODAY)).toEqual({
      kind: "invalid",
      errors: ["underage"],
    });
  });

  it("rechaza nombre vacío y fecha inválida a la vez", () => {
    expect(validateProfileInput({ displayName: "   ", birthdate: "2026-02-30" }, TODAY)).toEqual({
      kind: "invalid",
      errors: ["name_required", "birthdate_invalid"],
    });
  });

  it("rechaza nombres de más de 60 caracteres", () => {
    expect(validateProfileInput({ displayName: "a".repeat(61), birthdate: "2000-01-01" }, TODAY)).toEqual({
      kind: "invalid",
      errors: ["name_too_long"],
    });
  });

  it("rechaza fechas que no están en formato ISO", () => {
    expect(validateProfileInput({ displayName: "Ana", birthdate: "14/11/2000" }, TODAY)).toEqual({
      kind: "invalid",
      errors: ["birthdate_invalid"],
    });
  });

  it.each([
    ["29 de febrero de un año no bisiesto", "2001-02-29"],
    ["mes 13", "2001-13-01"],
    ["texto delante", "x2000-01-01"],
    ["texto detrás", "2000-01-01x"],
  ])("rechaza la fecha: %s", (_label, birthdate) => {
    expect(validateProfileInput({ displayName: "Ana", birthdate }, TODAY)).toEqual({
      kind: "invalid",
      errors: ["birthdate_invalid"],
    });
  });

  it("acepta el 29 de febrero de un año bisiesto", () => {
    expect(validateProfileInput({ displayName: "Ana", birthdate: "2000-02-29" }, TODAY)).toMatchObject({ kind: "valid" });
  });

  it("acepta un nombre de exactamente 60 caracteres", () => {
    expect(validateProfileInput({ displayName: "a".repeat(60), birthdate: "2000-01-01" }, TODAY)).toMatchObject({
      kind: "valid",
    });
  });

  it("acepta el 1 de enero de 1900", () => {
    expect(validateProfileInput({ displayName: "Ana", birthdate: "1900-01-01" }, TODAY)).toMatchObject({ kind: "valid" });
  });

  it("rechaza fechas anteriores a 1900", () => {
    expect(validateProfileInput({ displayName: "Ana", birthdate: "1899-12-31" }, TODAY)).toEqual({
      kind: "invalid",
      errors: ["birthdate_invalid"],
    });
  });
});
