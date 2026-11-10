import { describe, expect, it } from "vitest";
import { friendsSchema, pilotProfileSchema, pilotResult, visitsSchema } from "./data";

describe("respuestas del piloto", () => {
  it("solo confirma éxito cuando el servidor lo confirma", () => {
    expect(pilotResult({ ok: true }, false)).toBeNull();
    expect(pilotResult(null, false)).not.toBeNull();
    expect(pilotResult({ ok: true }, true)).not.toBeNull();
  });
  it("explica las restricciones de visitas y evita repetir premios", () => {
    expect(pilotResult({ ok: false, error: "already_reviewed" }, false)).toContain("Ya has valorado");
    expect(pilotResult({ ok: false, error: "verified_visit_required" }, false)).toContain("propios check-ins");
  });
  it("no refleja un mensaje arbitrario del proveedor", () => {
    expect(pilotResult({ ok: false, error: "secret-from-server" }, false)).not.toContain("secret-from-server");
  });
  it("rechaza datos de perfil incompletos y estados de amistad inesperados", () => {
    expect(pilotProfileSchema.safeParse({ name: "Ana" }).success).toBe(false);
    expect(friendsSchema.safeParse([{ id: "x", name: "Ana", status: "admin", incoming: true }]).success).toBe(false);
    expect(visitsSchema.safeParse([{ id: "x", place_name: "Bar", night_date: "2026-11-10", rating: null }]).success).toBe(true);
  });
});
