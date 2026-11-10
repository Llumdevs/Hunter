import { describe, expect, it } from "vitest";
import { parseCheckinRow, parseCheckInResult, parseRedeemResult } from "./results";

const CHECKIN = {
  id: "46625b41-81cc-47aa-867d-e9ec9cc8c5ea",
  user_id: "00000000-0000-0000-0000-00000000000a",
  place_id: "30000000-0000-0000-0000-000000000001",
  signup_id: "0b2e2a32-3f43-46e0-8e45-2023dd917c19",
  night_date: "2026-11-13",
  created_at: "2026-11-14T00:31:00+00:00",
  qr_kind: "static",
  lat: null,
  lng: null,
  distance_m: null,
  geo_ok: false,
  flagged: true,
};

const REDEMPTION = {
  id: "8a0b5d1e-0000-4000-8000-000000000001",
  checkin_id: CHECKIN.id,
  offer_id: "40000000-0000-0000-0000-000000000001",
  offer_snapshot: { title: "Tapa gratis", description: null, includes_alcohol: false },
  is_first_visit: true,
  billable: true,
  created_at: "2026-11-14T00:40:00+00:00",
  expires_at: "2026-11-14T00:55:00+00:00",
};

describe("parseCheckInResult", () => {
  it("devuelve el check-in cuando ok es true", () => {
    const result = parseCheckInResult({ ok: true, checkin: CHECKIN });
    expect(result).toMatchObject({ ok: true, checkin: { id: CHECKIN.id, nightDate: "2026-11-13" } });
  });

  it("devuelve el código de error de negocio", () => {
    expect(parseCheckInResult({ ok: false, error: "qr_invalid" })).toEqual({ ok: false, error: "qr_invalid" });
  });

  it("lanza si el servidor devuelve un error desconocido (contrato roto)", () => {
    expect(() => parseCheckInResult({ ok: false, error: "algo_nuevo" })).toThrow();
  });

  it("lanza si la forma no es la esperada", () => {
    expect(() => parseCheckInResult({ ok: true })).toThrow();
  });
});

describe("parseRedeemResult", () => {
  it("convierte las fechas y conserva la oferta", () => {
    const result = parseRedeemResult({ ok: true, redemption: REDEMPTION });
    expect(result).toMatchObject({
      ok: true,
      redemption: { offerTitle: "Tapa gratis", expiresAt: new Date("2026-11-14T00:55:00Z") },
    });
  });

  it("no expone al cliente si el canje se cobra", () => {
    const result = parseRedeemResult({ ok: true, redemption: REDEMPTION });
    expect(result.ok && "billable" in result.redemption).toBe(false);
  });

  it("devuelve el código de error de negocio", () => {
    expect(parseRedeemResult({ ok: false, error: "already_redeemed" })).toEqual({ ok: false, error: "already_redeemed" });
  });
});

describe("parseCheckinRow", () => {
  it("convierte una fila de check-in leída de la tabla", () => {
    expect(parseCheckinRow(CHECKIN)).toEqual({
      id: CHECKIN.id, placeId: CHECKIN.place_id, nightDate: "2026-11-13", geoOk: false,
    });
  });
});
