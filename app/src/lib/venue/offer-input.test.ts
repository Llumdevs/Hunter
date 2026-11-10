import { describe, expect, it } from "vitest";
import { validateOfferInput } from "./offer-input";

const valid = { title: " 2x1 en cañas ", description: "", includesAlcohol: true, daysOfWeek: [2, 3], validUntil: "" };

describe("validateOfferInput", () => {
  it("normaliza una oferta válida (sin descripción ni hora límite)", () => {
    expect(validateOfferInput(valid)).toEqual({
      kind: "valid",
      offer: { title: "2x1 en cañas", description: null, includes_alcohol: true, days_of_week: [2, 3], valid_until_time: null },
    });
  });

  it("acepta una hora límite HH:MM", () => {
    expect(validateOfferInput({ ...valid, validUntil: "01:30" })).toMatchObject({ offer: { valid_until_time: "01:30" } });
  });

  it("conserva la descripción sin espacios sobrantes", () => {
    expect(validateOfferInput({ ...valid, description: "  Con la primera  " })).toMatchObject({
      offer: { description: "Con la primera" },
    });
  });

  it("una descripción de solo espacios equivale a no tener descripción", () => {
    expect(validateOfferInput({ ...valid, description: "   " })).toMatchObject({ offer: { description: null } });
  });

  it("ordena y quita días repetidos", () => {
    expect(validateOfferInput({ ...valid, daysOfWeek: [5, 2, 5] })).toMatchObject({ offer: { days_of_week: [2, 5] } });
  });

  it.each([
    ["título vacío", { title: "   " }, "title_required"],
    ["título de más de 80 caracteres", { title: "a".repeat(81) }, "title_too_long"],
    ["ningún día", { daysOfWeek: [] }, "days_required"],
    ["día fuera de 1-7", { daysOfWeek: [0] }, "days_invalid"],
    ["día 8", { daysOfWeek: [8] }, "days_invalid"],
    ["un día válido y otro no", { daysOfWeek: [1, 9] }, "days_invalid"],
    ["hora con texto delante", { validUntil: "x01:00" }, "valid_until_invalid"],
    ["hora con texto detrás", { validUntil: "01:000" }, "valid_until_invalid"],
    ["hora mal escrita", { validUntil: "25:00" }, "valid_until_invalid"],
    ["descripción de más de 200 caracteres", { description: "a".repeat(201) }, "description_too_long"],
  ])("rechaza %s", (_label, change, error) => {
    expect(validateOfferInput({ ...valid, ...change })).toEqual({ kind: "invalid", errors: [error] });
  });

  it.each([
    ["80 caracteres de título", { title: "a".repeat(80) }],
    ["200 caracteres de descripción", { description: "a".repeat(200) }],
    ["días 1 y 7", { daysOfWeek: [1, 7] }],
    ["hora 23:59", { validUntil: "23:59" }],
  ])("acepta el límite: %s", (_label, change) => {
    expect(validateOfferInput({ ...valid, ...change })).toMatchObject({ kind: "valid" });
  });
});
