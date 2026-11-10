import { describe, expect, it } from "vitest";
import { managementContextSchema, onboardingError, venueApplicationDetailsSchema } from "./onboarding";

const valid = { name: "Mi bar", zone: "Ruzafa", address: "Calle de prueba 12", contact: "bar@example.com", kind: "bar", price: "€€", lat: 39.46, lng: -0.37, days: [1, 5, 6], opens_at: "20:00", closes_at: "03:00" };
describe("alta de locales", () => {
  it("admite horario nocturno y normaliza textos", () => {
    expect(venueApplicationDetailsSchema.parse({ ...valid, name: " Mi bar " }).name).toBe("Mi bar");
  });
  it.each([{ lat: 91 }, { lng: -181 }, { days: [] }, { days: [8] }, { opens_at: "25:00" }, { closes_at: "abc" }, { contact: "x" }, { kind: "unknown" }])("rechaza datos inválidos %o", (invalid) => {
    expect(venueApplicationDetailsSchema.safeParse({ ...valid, ...invalid }).success).toBe(false);
  });
  it("el cliente no confunde una membresía con un permiso de plataforma", () => {
    expect(managementContextSchema.safeParse({ organizer_id: "x", is_admin: "true" }).success).toBe(false);
    expect(managementContextSchema.parse({ is_admin: false, approvals_enabled: false, demo_place_id: null }).is_admin).toBe(false);
  });
  it("explica los límites y no refleja errores arbitrarios del servidor", () => {
    expect(onboardingError("pending_limit")).toContain("tres solicitudes");
    expect(onboardingError("unexpected-secret")).not.toContain("unexpected-secret");
  });
});
