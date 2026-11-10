import { describe, expect, it } from "vitest";
import { checkInPath, parseCheckInLink, parseCheckInParams } from "./link";

const ORIGIN = "https://hunter.app";
const PLACE = "30000000-0000-0000-0000-000000000001";
const TOKEN = "AbCdEf0123456789_-xyz";

describe("parseCheckInLink", () => {
  it("acepta un QR fijo de nuestro dominio", () => {
    expect(parseCheckInLink(`${ORIGIN}/c/${PLACE}?k=${TOKEN}`, ORIGIN)).toEqual({
      kind: "valid",
      placeId: PLACE,
      credential: { type: "static", token: TOKEN },
    });
  });

  it("acepta un código de pantalla de 8 hex", () => {
    expect(parseCheckInLink(`${ORIGIN}/c/${PLACE}?t=43dd8124`, ORIGIN)).toEqual({
      kind: "valid",
      placeId: PLACE,
      credential: { type: "screen", code: "43dd8124" },
    });
  });

  it("rechaza QR de otro dominio (posible phishing)", () => {
    expect(parseCheckInLink(`https://evil.example/c/${PLACE}?k=${TOKEN}`, ORIGIN)).toEqual({
      kind: "invalid",
      reason: "foreign_origin",
    });
  });

  it("rechaza texto que no es una URL", () => {
    expect(parseCheckInLink("hola", ORIGIN)).toEqual({ kind: "invalid", reason: "malformed" });
  });

  it.each([
    ["ruta con prefijo", `${ORIGIN}/x/c/${PLACE}?k=${TOKEN}`],
    ["ruta con segmentos extra", `${ORIGIN}/c/${PLACE}/extra?k=${TOKEN}`],
  ])("rechaza %s", (_label, url) => {
    expect(parseCheckInLink(url, ORIGIN)).toEqual({ kind: "invalid", reason: "malformed" });
  });

  it("rechaza rutas que no son de check-in", () => {
    expect(parseCheckInLink(`${ORIGIN}/admin/${PLACE}?k=${TOKEN}`, ORIGIN)).toEqual({ kind: "invalid", reason: "malformed" });
  });
});

describe("parseCheckInParams", () => {
  const params = (query: string) => new URLSearchParams(query);

  it("rechaza un id de local que no es UUID", () => {
    expect(parseCheckInParams("bar-prueba", params(`k=${TOKEN}`))).toEqual({ kind: "invalid", reason: "malformed" });
  });

  it("rechaza si no hay credencial", () => {
    expect(parseCheckInParams(PLACE, params(""))).toEqual({ kind: "invalid", reason: "missing_credential" });
  });

  it("rechaza si vienen las dos credenciales a la vez", () => {
    expect(parseCheckInParams(PLACE, params(`k=${TOKEN}&t=43dd8124`))).toEqual({ kind: "invalid", reason: "malformed" });
  });

  it.each([
    ["id con texto delante", `x${PLACE}`],
    ["id con texto detrás", `${PLACE}x`],
  ])("rechaza un %s", (_label, placeId) => {
    expect(parseCheckInParams(placeId, params(`k=${TOKEN}`))).toEqual({ kind: "invalid", reason: "malformed" });
  });

  it.each([
    ["código de pantalla con un carácter delante", "t=x43dd8124"],
    ["código de pantalla con un carácter detrás", "t=43dd8124x"],
    ["token demasiado corto", `k=${"a".repeat(15)}`],
    ["token con caracteres no permitidos", `k=${"a".repeat(20)}<script>`],
    ["token demasiado largo", `k=${"a".repeat(129)}`],
    ["código de pantalla en mayúsculas", "t=43DD8124"],
    ["código de pantalla de 7 caracteres", "t=43dd812"],
  ])("rechaza %s", (_label, query) => {
    expect(parseCheckInParams(PLACE, params(query))).toEqual({ kind: "invalid", reason: "malformed" });
  });

  it.each([
    ["token de 16 caracteres", "a".repeat(16)],
    ["token de 128 caracteres", "a".repeat(128)],
  ])("acepta %s", (_label, token) => {
    expect(parseCheckInParams(PLACE, params(`k=${token}`))).toMatchObject({ kind: "valid" });
  });
});

describe("checkInPath", () => {
  it("construye la ruta interna de un QR fijo", () => {
    expect(checkInPath({ placeId: PLACE, credential: { type: "static", token: TOKEN } })).toBe(`/c/${PLACE}?k=${TOKEN}`);
  });

  it("construye la ruta interna de un código de pantalla", () => {
    expect(checkInPath({ placeId: PLACE, credential: { type: "screen", code: "43dd8124" } })).toBe(`/c/${PLACE}?t=43dd8124`);
  });
});
