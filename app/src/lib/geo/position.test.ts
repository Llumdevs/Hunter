import { describe, expect, it } from "vitest";
import { requestPosition, type GeolocationLike } from "./position";

const fakeGeo = (behaviour: (ok: PositionCallback, fail: PositionErrorCallback) => void): GeolocationLike => ({
  getCurrentPosition: (ok, fail) => behaviour(ok, fail ?? (() => undefined)),
});

const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as GeolocationPosition;

const failure = (code: number) => ({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as GeolocationPositionError;

describe("requestPosition", () => {
  it("devuelve las coordenadas si el usuario da permiso", async () => {
    await expect(requestPosition(fakeGeo((ok) => ok(position(39.46, -0.37))))).resolves.toEqual({
      kind: "granted",
      lat: 39.46,
      lng: -0.37,
    });
  });

  it("indica que se ha denegado el permiso", async () => {
    await expect(requestPosition(fakeGeo((_ok, fail) => fail(failure(1))))).resolves.toEqual({
      kind: "unavailable",
      reason: "denied",
    });
  });

  it("indica tiempo agotado", async () => {
    await expect(requestPosition(fakeGeo((_ok, fail) => fail(failure(3))))).resolves.toEqual({
      kind: "unavailable",
      reason: "timeout",
    });
  });

  it("indica error genérico si la posición no está disponible", async () => {
    await expect(requestPosition(fakeGeo((_ok, fail) => fail(failure(2))))).resolves.toEqual({
      kind: "unavailable",
      reason: "error",
    });
  });

  it("pide una posición precisa, reciente y con tiempo límite", async () => {
    let received: PositionOptions | undefined;
    const geo: GeolocationLike = {
      getCurrentPosition: (ok, _fail, options) => {
        received = options;
        ok(position(0, 0));
      },
    };
    await requestPosition(geo);
    expect(received).toEqual({ enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 });
  });

  it("indica que el dispositivo no tiene geolocalización", async () => {
    await expect(requestPosition(undefined)).resolves.toEqual({ kind: "unavailable", reason: "unsupported" });
  });
});
